// The app version — the single source of truth, shown in the «?» help panel
// footer, logged once on boot, and exposed as `galaxyApp.version`.
//
// Scheme: 0.MINOR.PATCH — MINOR steps with each shipped feature wave, PATCH
// with refinement/fix rounds inside one. Bump it in the same commit as the
// change it describes (see CLAUDE.md → Conventions).

export const APP_VERSION = '0.7.0';
