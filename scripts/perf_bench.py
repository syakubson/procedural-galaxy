#!/usr/bin/env python3
"""Headless performance harness for Galaxy Explorer.

Boots the app's own dev server (`.nocache_server.py`), drives it with
Playwright/Chromium, jumps to a handful of representative scenes via the
app's `galaxyApp.debugJumpTo()` dev hook, and reads `galaxyApp.getPerfSnapshot()`
— the same numbers the in-app dev panel shows (draw calls / triangles / asset
MB) — checked against `PERF_BUDGETS` in `src/config.js`.

WHAT THE NUMBERS MEAN:
    Headless Chromium falls back to the SwiftShader software rasterizer, so
    the FPS this script prints is NOT representative of real hardware — it's
    often stuck around ~10fps no matter how heavy the scene is. Treat headless
    FPS as a *relative* signal only (did this scenario get slower than that
    one?), never as an absolute number, and don't fail a run over it. The
    metrics that ARE meaningful in absolute terms here are draw calls /
    triangles / asset MB, because they come straight from `renderer.info` and
    the asset loader's byte ledger, not from wall-clock timing — that's why
    only those two gate the exit code. For a trustworthy absolute FPS number,
    run with `--headed` on a real reference machine and read it off the
    screen (note the machine model wherever you record the result).

Run with any Python environment that has `playwright` installed and its
Chromium browser fetched (`python3 -m playwright install chromium`):
    python3 scripts/perf_bench.py
    python3 scripts/perf_bench.py --profile low --scenario galaxy_view system_enter
    python3 scripts/perf_bench.py --headed --profile high
"""
import argparse
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

from playwright.sync_api import Page, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PORT = 8124
PROFILES = ('low', 'medium', 'high')

# Metrics that gate the exit code (see the module docstring — draw calls /
# triangles are the only budget numbers a headless SwiftShader run can judge
# honestly). Everything else `checkBudget()` reports is printed but treated
# as a warning here.
FAIL_METRICS = {'drawCalls', 'triangles'}

# Each scenario is either None (stay on the default galaxy view) or a JS
# predicate body handed verbatim to `galaxyApp.debugJumpTo(entry => ...)` —
# the same dev hook the app exposes for this script (see main.js). Special
# systems are hand-placed in markers.js unconditionally (not gated by seed),
# so every predicate here is expected to match on any seed. Dict keys double
# as the CLI --scenario names and the report's row labels.
SCENARIOS = {
    'galaxy_view': None,
    # any regular explorable system, i.e. not one of the two black holes.
    'system_enter': "e => e.data && e.data.kind !== 'blackhole'",
    'deathstar': "e => e.data && e.data.seed === 'death-star'",
    'ishimura': "e => e.data && e.data.seed === 'deadspace'",
    'blackhole': "e => e.data && e.data.seed === 'galactic-core'",
    'endurance': "e => e.data && e.data.seed === 'interstellar'",
    # not a system of its own — the Crew Dragon flag on the Solar System
    # replica — so it's found by object presence rather than by seed.
    'dragon': "e => e.data && !!e.data.dragonToMars",
}


def start_server(port: int) -> subprocess.Popen[str] | None:
    """Launch the project's no-cache dev server as a subprocess.

    Only spawned for the default port. `.nocache_server.py` hardcodes its bind
    to 8124, so a non-default `--port` means "I'm already running my own
    server there"; spawning ours anyway would either bind-fail or serve
    nothing useful.

    Args:
        port: Port the caller wants the dev server reachable on.

    Returns:
        The spawned subprocess, or ``None`` if ``port`` isn't the default
        (in which case the caller is expected to already have a server up).
    """
    if port != DEFAULT_PORT:
        return None
    return subprocess.Popen(
        [sys.executable, '.nocache_server.py'],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
    )


def stop_server(proc: subprocess.Popen[str] | None) -> None:
    """Terminate the dev server subprocess, killing it if it won't stop.

    Args:
        proc: The subprocess to stop, or ``None`` (no-op) if no server was
            spawned by this run.
    """
    if proc is None:
        return
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait()


def wait_for_server(port: int, proc: subprocess.Popen[str] | None = None, timeout: float = 15.0) -> None:
    """Block until the dev server answers on ``port``, or raise.

    Args:
        port: Port to poll.
        proc: The dev server subprocess, if this run spawned one — used to
            detect an early exit (a bind failure) and surface its stderr
            instead of polling until the timeout.
        timeout: How long to poll before giving up, in seconds.

    Raises:
        RuntimeError: If the server subprocess exited before answering, or if
            nothing answers within ``timeout`` seconds.
    """
    url = f'http://127.0.0.1:{port}/'
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        # A dead server subprocess means the bind failed — almost always an
        # orphaned server already squatting the port. Surfacing its stderr
        # beats the silent alternative: benchmarking whatever (possibly
        # stale) process happens to answer on that port.
        if proc is not None and proc.poll() is not None:
            # `start_server()` always redirects stderr to a pipe, so this is
            # never actually None at runtime — the check just satisfies the
            # type checker's static view of `Popen.stderr`.
            stderr_text = proc.stderr.read() if proc.stderr is not None else ''
            err = (stderr_text or '').strip()
            raise RuntimeError(
                f'dev server exited on startup (port {port} already taken?):\n{err}')
        try:
            with urllib.request.urlopen(url, timeout=1):
                return
        except (urllib.error.URLError, OSError):
            time.sleep(0.25)
    raise RuntimeError(f'dev server never answered at {url} within {timeout:.0f}s')


def settle(page: Page, ms: int) -> None:
    """Wait out the wall clock, then two animation frames.

    Lets a rebuild/dolly's last frame actually land before the next
    `renderer.info` read.

    Args:
        page: The Playwright page to settle.
        ms: Wall-clock milliseconds to wait before the two-frame settle.
    """
    page.wait_for_timeout(ms)
    page.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')


def run_scenarios(
    args: argparse.Namespace, scenario_names: list[str]
) -> tuple[list[dict[str, Any]], dict[str, list[str]]]:
    """Drive the app through each named scenario and collect a perf snapshot per scenario.

    Args:
        args: Parsed CLI arguments (`profile`, `port`, `headed` are used here).
        scenario_names: Names of the scenarios to run, in order (see `SCENARIOS`).

    Returns:
        A tuple of `(results, console_log)`: `results` is one dict per scenario
        (either a perf snapshot or an `{'error': ...}` entry for a failed jump);
        `console_log` maps each scenario name (plus `'boot'`) to the browser
        console errors observed during it.
    """
    profile = args.profile
    results = []
    console_log = defaultdict(list)
    current = {'name': 'boot'}

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=not args.headed)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        page.on('console', lambda msg: msg.type == 'error' and console_log[current['name']].append(msg.text))
        page.on('pageerror', lambda exc: console_log[current['name']].append(f'pageerror: {exc}'))

        page.goto(f'http://127.0.0.1:{args.port}/', wait_until='load')
        page.wait_for_function('() => !!window.galaxyApp', timeout=15000)

        # Boot settle: 3s + two frames for the initial scene, then another
        # ~2.5s so the skybox fetches _warmUpSystemShaders() fires ~1.5s
        # after boot (background.js / systemView.js, both idle-loaded via
        # assetLoader) have landed before the first snapshot.
        settle(page, 3000)
        page.wait_for_timeout(2500)

        for name in scenario_names:
            current['name'] = name
            predicate = SCENARIOS[name]

            # The previous scenario's exitSystem() plays a fade + dolly that
            # headless SwiftShader stretches to a couple of wall-clock seconds
            # — wait for the mode flag itself, not a guessed timeout, or the
            # next debugJumpTo() gets refused mid-transition and the snapshot
            # silently measures the galaxy under a system scenario's name.
            page.wait_for_function("() => window.galaxyApp.mode === 'galaxy'", timeout=30000)

            # Same path gui.js's quality dropdown uses (app.setQuality(q)) —
            # applies the preset, rebuilds geometry, re-applies live uniforms.
            page.evaluate(f"() => window.galaxyApp.setQuality('{profile}')")
            settle(page, 400)

            jumped_to = None
            if predicate is not None:
                jumped_to = page.evaluate(f'() => window.galaxyApp.debugJumpTo({predicate})')
                if jumped_to is None:
                    # No snapshot for a failed jump — galaxy-view numbers
                    # published under a system scenario's name are worse than
                    # an explicit hole in the report.
                    print(f'warning: scenario {name!r} did not enter a system — no snapshot', file=sys.stderr)
                    results.append({
                        'scenario': name,
                        'error': 'jump failed (no matching entry, or app not in galaxy mode)',
                        'consoleErrors': list(console_log[name]),
                    })
                    continue
                page.wait_for_function("() => window.galaxyApp.mode === 'system'", timeout=30000)
                # Mode flips when the warp lands; give the in-system focus
                # dolly (~2s, per the project docs) a beat to settle before
                # reading renderer.info.
                settle(page, 2000)

            snapshot = page.evaluate('() => window.galaxyApp.getPerfSnapshot()')
            snapshot['scenario'] = name
            snapshot['jumpedTo'] = jumped_to
            snapshot['consoleErrors'] = list(console_log[name])
            results.append(snapshot)

            # Back to the galaxy view; the mode wait at the top of the next
            # iteration (or nothing, if this was the last one) absorbs the
            # transition however long it takes.
            page.evaluate('() => window.galaxyApp.exitSystem()')

        browser.close()

    return results, dict(console_log)


def print_report(results: list[dict[str, Any]]) -> bool:
    """Print the scenario table to stdout.

    Args:
        results: Per-scenario results, as returned by `run_scenarios()`.

    Returns:
        True if any scenario has a fail-worthy (drawCalls/triangles) violation
        (or errored outright), signalling the caller should exit non-zero.
    """
    rows = []
    any_fail = False
    for r in results:
        if 'error' in r:
            # A scenario that never reached its scene is a broken run, not a
            # silently-missing row — fail the exit code so CI-ish usage notices.
            any_fail = True
            rows.append((r['scenario'], '-', '?', '?', '?', 'ERROR', r['error']))
            continue
        m = r['metrics']
        fail_violations = [v for v in r['violations'] if v['metric'] in FAIL_METRICS]
        warn_violations = [v for v in r['violations'] if v['metric'] not in FAIL_METRICS]
        if fail_violations:
            any_fail = True
        status = 'FAIL' if fail_violations else ('warn' if warn_violations else 'ok')
        rows.append((
            r['scenario'],
            r['profile'],
            str(m.get('drawCalls', '?')),
            str(m.get('triangles', '?')),
            str(m.get('fps', '?')),
            status,
            # `dir` comes from checkBudget: '<' for fps (too low), '>' for the
            # rest (too high) — "fps=15>60" would read as a lie.
            '; '.join(f"{v['metric']}={v['value']}{v.get('dir', '>')}{v['budget']}" for v in r['violations']) or '-',
        ))

    headers = ('SCENARIO', 'PROFILE', 'DRAW CALLS', 'TRIANGLES', 'FPS', 'STATUS', 'VIOLATIONS')
    widths = [max(len(h), *(len(row[i]) for row in rows)) if rows else len(h) for i, h in enumerate(headers)]
    line = '  '.join(h.ljust(w) for h, w in zip(headers, widths, strict=False))
    print(line)
    print('-' * len(line))
    for row in rows:
        print('  '.join(cell.ljust(w) for cell, w in zip(row, widths, strict=False)))

    for r in results:
        if r['consoleErrors']:
            print(f"  [{r['scenario']}] console errors: {r['consoleErrors']}", file=sys.stderr)

    return any_fail


def write_json_report(results: list[dict[str, Any]], args: argparse.Namespace, boot_errors: list[str]) -> Path:
    """Write the full scenario report to `docs/perf/report_<timestamp>.json`.

    Args:
        results: Per-scenario results, as returned by `run_scenarios()`.
        args: Parsed CLI arguments (only `headed` is used here).
        boot_errors: Console errors observed while the app was still booting.

    Returns:
        Path of the written report file.
    """
    out_dir = ROOT / 'docs' / 'perf'
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    out_path = out_dir / f'report_{stamp}.json'
    report = {
        'generatedAt': datetime.now().isoformat(),
        'headed': args.headed,
        'note': 'FPS is headless SwiftShader software rendering unless headed=true — treat it as relative, '
                'not absolute.',
        'bootErrors': boot_errors,
        'scenarios': results,
    }
    out_path.write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(f'\nwrote {out_path}')
    return out_path


def main() -> None:
    """Parse CLI args, run the scenarios, print + write the report, and set the exit code."""
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--profile', choices=PROFILES, default='medium',
                         help='quality preset to switch to before each scenario '
                              '(matches src/config.js QUALITY_PRESETS); default: medium')
    parser.add_argument('--scenario', nargs='+', choices=list(SCENARIOS), default=None,
                         help='which scenarios to run (default: all of them, in the order above)')
    parser.add_argument('--headed', action='store_true',
                         help='show the browser window instead of running headless — '
                              'needed for a meaningful FPS number')
    parser.add_argument('--port', type=int, default=DEFAULT_PORT,
                         help=f'port the dev server is reachable on (default {DEFAULT_PORT}); '
                              f'.nocache_server.py always binds {DEFAULT_PORT}, so only change '
                              'this if you run your own server elsewhere')
    args = parser.parse_args()
    scenario_names = args.scenario or list(SCENARIOS)

    server = start_server(args.port)
    try:
        wait_for_server(args.port, server)
        results, console_log = run_scenarios(args, scenario_names)
    finally:
        stop_server(server)

    # Errors thrown while the page was still booting land in their own bucket
    # — a page that stumbles on startup but limps into the scenarios would
    # otherwise pass without a trace of it anywhere.
    boot_errors = console_log.get('boot', [])
    if boot_errors:
        print(f'  [boot] console errors: {boot_errors}', file=sys.stderr)

    any_fail = print_report(results)
    write_json_report(results, args, boot_errors)
    sys.exit(1 if any_fail else 0)


if __name__ == '__main__':
    main()
