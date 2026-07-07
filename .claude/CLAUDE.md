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
first. `GENERATION.md` (repo root) documents the generation parameters in depth.

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
  brass). Discovery persists via the party overlay (`src/state/`) under
  `galaxy.party.v1.patches::<GEN_VERSION>::<seed>`; legacy `galaxy.charted.<seed>` keys are
  only detected for the one-time migration notice, never written.
- **Camera framing.** Per-object-type focus distances live in `src/systems/focusConfig.js` — tune
  framing there, not by scattering magic numbers in `main.js`.
- **Versioning.** `src/version.js` holds `APP_VERSION` (`0.MINOR.PATCH` — MINOR per shipped
  feature wave, PATCH per refinement round). Bump it in the same commit as the user-visible
  change; it shows in the «?» panel footer, the boot console line, and `galaxyApp.version`.
- **Design system.** Cartographer theme — CSS tokens in `styles.css` `:root` (ink / vellum / ivory
  / brass / status colours; serif EB Garamond + mono IBM Plex Mono, vendored woff2). Reuse the
  tokens; don't hardcode hex values for chrome.
- **GalaxyApp init order.** `main.js`'s constructor wires things in a fixed sequence — keep new
  steps in it: `assetLoader` → `_buildWorld()` (`Background` takes the loader) → `PostFX` →
  `_buildSystems()` → `SystemView` (also takes the loader) → HUD → codex (`_initCodex`) → GUI →
  the render loop → `_warmUpSystemShaders()` (idle-timer, ~1.5s — also where deferred skybox
  loads fire).
- **Onboarding (`src/onboarding/`).** A 9-step first-flight tour through the Solar System:
  steps are pure data (steps.js), the FSM (onboarding.js) advances via `notify(event)` calls
  from main.js on REAL player actions and can fast-forward past manual narration steps.
  Persists under `NAMESPACES.PLAYER/'onboarding'`; `_begin()` stamps `{done:false}` so an
  abandoned tour restarts instead of being grandfathered by its own codex records; a browser
  with prior codex finds never sees it. Mutually exclusive with the cinematic show.
- **UI sounds (`src/audio/sfx.js` + `sfxEvents.js`).** WebAudio, all assets fetched+decoded
  up front (zero-latency); crisp one-shots ship as WAV (AAC pads ~23 ms of priming silence —
  reads as input lag on a transient), swelling whooshes as m4a. Deliberate silences: buttons,
  the first-charting, and the whole cinematic show (`!_cineActive()` gate at every call site,
  same rule as the codex funnel). The ♪ music toggle is the ONE master audio switch
  (AmbientMusic.onStateChange → sfx.setMuted); the two volumes persist under
  `NAMESPACES.PLAYER`. New sounds: bake offline via trim-leading-silence + peak ≈ -3 dB,
  credit in `audio/CREDITS.txt`, set relative loudness ONLY in sfxEvents.js.
- **Faction capitals & fleet lore (`src/codex/fleetLore.js`).** Each of the six fleet factions has a
  hand-crafted HOME system (`generateFactionCapitals()` in systemData.js, seeds `capital-<id>`) settled
  by it: fixed `faction`, a `capital: <id>` flag, and its CANONICAL named flagship via `flagshipOverride`.
  Capitals are appended to the catalog AFTER every other special — never insert one earlier (rng order).
  Their map markers are five-pointed STARS (the cartographer's capital mark) — hollow until charted,
  filled after — and ink in `CAPITAL_COLOR` (markers.js; mirrored in hud.js and codexUI's FACTION_TINT)
  only once charted: shape may say "a capital", colour (whose) waits for the visit. The codex has no
  Корабли/Станции tabs — both catalogs live inside the «Фракции» tab, ONE faction at a time behind a
  tinted switcher row (header, fleet, structures, and a five-chapter chronicle from fleetLore.js's
  FACTION_LORE that unlocks by visiting the capital). Ship characteristics come from
  `src/systems/ships/shipStats.js` (role baseline + faction bias, 1–10; precursor hulls give no
  readings) — if gameplay ever consumes stats, THAT file stays the single source. All fleet lore is
  written against an anti-AI-pattern checklist (no «не X, а Y» stamps, no mirror aphorisms, ≤2
  button endings per chronicle) — keep new texts to the same bar. Flagship + station lore lives in fleetLore.js and must stay in
  sync with the capitals' `flagshipOverride` (one canon, two surfaces). Lore canon guardrails: Earth is
  pre-spacefaring and belongs to NO faction, and how humans relate to the aelari is never explained in
  any text — hints only.
- **Ship geometry (`src/systems/ships/`).** `buildShip(role, faction)` bakes ~25 small meshes →
  2 draw calls (opaque + additive vertex-colour), unlit — the in-game path. `buildShipParts(role,
  faction)` returns the merged hull geometry (position+normal+colour, any material) plus the
  engine/nav EMITTERS pulled OUT of the bake, for lit/animated rendering. A faction MAY replace any
  role or station with a BESPOKE builder via `style.roles[id]` / `style.stations[type]`; the Alliance
  ships a full bespoke line (`faction_alliance.js` — 9 cosmo-style hulls + 3 stations, welded blocky
  segments in a SW-Old-Republic / Halo-UNSC visual language). Factions without a bespoke line use the
  shared role silhouettes (`roles.js`). Detail helpers (barrel/nozzle/dish/blister/nacelle/greeble/
  radiatorPanel/rcsQuad/…) and an opt-in matcap path (`setShipMatcap`/`makeMatcap`, default OFF) live
  in `style.js`. Match the surrounding builder style and keep the 2-draw-call bake.
- **Codex (`src/codex/`).** A PERMANENT cross-party discovery log (storage namespace `CODEX` —
  no party id / GEN_VERSION in its key). Records fire on meaningful player actions through
  `main.js`'s `_codexRecord()` funnel, which stays silent during the cinematic auto-tour; the
  ONE sanctioned bulk exception is reveal-all (`_recordEverythingDiscoverable()`), which fills
  the codex from the whole galaxy in a single deferred-persist pass (`record(...,{defer})` +
  `flush()`). The gallery renders each find as a thumbnail (`thumbnails.js`, a shared offscreen
  renderer driving the SAME `codexViewer.buildFor` rebuild); undiscovered slots show a
  per-category glyph (`codexIcons.js`). A card opens a detail dialog with «Рассмотреть» (the 3D
  viewer) and «Перейти к объекту» (`navigateToEntry` warps to it). Every rebuild re-drives the
  SAME builders with the SAME seeds (plus `sourceRef.faction`, since inhabited fleet skins are
  assigned round-robin outside the seed) — never invent a second rendering path for a find. The
  gallery tile class is `.codex-tile`; `.codex-card` is the panel container (keep them distinct).

## Verify before claiming done

- **Syntax:** `node --check <file.js>` on every edited JS file (modules can't be required without a
  server).
- **Lint JS:** `oxlint .` from the repo root (config: `.oxlintrc.json`; install via `brew install
  oxlint` or one-off `npx -y oxlint@latest .` — no `node_modules` either way). Zero warnings is the
  bar; if it isn't, either fix the finding or silence it in `.oxlintrc.json`/`// eslint-disable-*`
  with a one-line "why" — never reformat to chase style rules.
- **Lint CSS:** `biome lint styles.css` from the repo root (config: `biome.jsonc` — must keep the
  `.jsonc` extension, Biome silently drops comment-bearing sections in a plain `.json`; install via
  `brew install biome` or one-off `npx -y @biomejs/biome@latest lint styles.css`). Formatter stays
  off (`formatter.enabled: false`) — never run `biome check --write`/`biome format` here.
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
- `TODO.md` / `CHECKPOINT.md` are gitignored scratch names — never commit working notes of
  any kind here; this repository carries only the shipped project itself.
