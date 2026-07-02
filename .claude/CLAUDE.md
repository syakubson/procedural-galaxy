# CLAUDE.md

Guidance for Claude Code (and any AI assistant) working in this repository.

> **This is a public repository.** Keep everything here clean and self-contained: no secrets,
> no API keys, no private URLs, no references to other repos or internal infrastructure. If a
> change would expose any of that, stop and flag it instead.

## What this is

**Galaxy Explorer** — an interactive, procedurally generated spiral galaxy in the browser
(Three.js). Hover a system marker to read it, click to warp inside to its star, planets, and
lore. The whole universe is generated deterministically from a seed. Design constraints:

- **Runs on weak PCs.** The entire star disk is one draw call; rotation/twinkle/size are computed
  on the GPU in shaders. Per frame the CPU updates ~one number, never iterating over stars. Keep
  it that way — prefer a shader/uniform over per-star CPU work.
- **No build step. No internet at runtime.** Pure ES modules + an import map; Three.js and lil-gui
  are vendored in `vendor/`. Don't add a bundler, a framework, or an `npm install` requirement.

The `README.md` has the full feature tour, generation rules, and a project-structure map — read it
first. `docs/GENERATION.md` documents the generation parameters in depth.

## Conventions

- **Vanilla ES modules**, no TypeScript, no JSX. Match the surrounding code's style and comment
  density — files carry thorough "why" comments; keep them.
- **UI text is Russian**; code, comments, identifiers, and commit messages are English.
- **Determinism.** All generation rolls go through the seeded PRNG in `src/rng.js` (mulberry32).
  Generation probabilities live in `src/systems/genParams.js` (the `GEN` object); quality presets
  and the explorable-system share live in `src/config.js`. Never use `Math.random()` for anything
  that should be reproducible from a seed.
- **Two rotation clocks (invariant).** `uRotTime` / `_galaxyRotTime` advances only while idle and
  **freezes on interaction**; `uTime` / `_time` always runs (twinkle, pulse, hover eases). The
  nebula rides the freezable clock so it stays glued to the arms. Don't move idle-freezable motion
  onto the always-on clock or vice-versa.
- **Markers / fog-of-war.** `src/systems/markers.js`: uncharted = hollow "survey ring", charted =
  filled status disc, both baked WHITE and tinted via `material.color` (so hover can lerp toward
  brass). Discovery persists in `localStorage` under `galaxy.charted.<seed>`.
- **Camera framing.** Per-object-type focus distances live in `src/systems/focusConfig.js` — tune
  framing there, not by scattering magic numbers in `main.js`.
- **Design system.** Cartographer theme — CSS tokens in `styles.css` `:root` (ink / vellum / ivory
  / brass / status colours; serif EB Garamond + mono IBM Plex Mono, vendored woff2). Reuse the
  tokens; don't hardcode hex values for chrome.
- **GalaxyApp init order.** `main.js`'s constructor wires things in a fixed sequence — keep new
  steps in it: `assetLoader` → `_buildWorld()` (`Background` takes the loader) → `PostFX` →
  `_buildSystems()` → `SystemView` (also takes the loader) → HUD → GUI → the render loop →
  `_warmUpSystemShaders()` (idle-timer, ~1.5s — also where deferred skybox loads fire).

## Verify before claiming done

- **Syntax:** `node --check <file.js>` on every edited JS file (modules can't be required without a
  server).
- **Run it:** serve the folder over HTTP — `python3 .nocache_server.py` (port 8124, no-cache) or
  `python3 -m http.server 8000`. ES modules need HTTP, not `file://`.
- **Visual / functional QA:** drive the live page with headless Playwright (Chromium with
  SwiftShader for software WebGL, ~10fps headless). Screenshots are ground truth; assert app state
  via `window.galaxyApp` (e.g. `galaxyApp.systems.list.length`, `galaxyApp.mode`). Note: during a
  ~2s focus dolly, transient `visible` reads can be stale — wait, then re-check.

## Deploy

Static site → any static host. Live on Vercel (`vercel.json` sets always-revalidate cache headers
so a redeploy is picked up without a hard refresh; `.vercelignore` keeps dev-only files —
`docs/`, screenshots, scripts, `*.md`, `*.py` — out of the bundle).

## Housekeeping

- Don't commit large binaries. The README demo lives in `media/` already compressed (≈1 MB H.264);
  re-compress new media with ffmpeg (`scale=1280:-2`, `crf 30`, `+faststart`), don't drop a raw
  multi-hundred-MB screen recording into git.
- `TODO.md` (the roadmap) is gitignored on purpose — it's a scratch wishlist, not public docs.
