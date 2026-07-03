// UI sound effects: the event → asset table (stage 5). Every sound is a CC0
// recording from freesound.org, peak-normalized to ≈ -3 dB offline (two-pass,
// measured on the BAKED m4a; AAC wobbles the peak by ~±0.3 dB) — the
// per-event `volume` below is therefore the ONLY loudness knob that matters
// (relative to the master volume in SfxManager). Full credits with sound ids
// and authors: audio/CREDITS.txt.
//
// Deliberate silences: the cinematic show's fades carry no sound (owner
// decision, 2026-07-03), and the show never voices warp/chart at all — the
// auto-tour drives the same code paths a player does, so SFX playback is
// gated on `!_cineActive()` at the call sites, same rule as the codex funnel.

export const SFX_EVENTS = {
  click: { src: 'audio/sfx/click.m4a', volume: 0.35 }, // a relay switch — every chrome button
  hover: { src: 'audio/sfx/hover.m4a', volume: 0.28 }, // soft button — a NEW marker under the pointer
  chart: { src: 'audio/sfx/chart.m4a', volume: 0.5 }, // rubber stamp — a system inked into the map
  warpIn: { src: 'audio/sfx/warp-in.m4a', volume: 0.6 }, // designed whoosh 049 — diving into a system
  warpOut: { src: 'audio/sfx/warp-out.m4a', volume: 0.6 }, // its sibling 048 — pulling back out
  codexOpen: { src: 'audio/sfx/codex-open.m4a', volume: 0.45 }, // a heavy page turn
  codexClose: { src: 'audio/sfx/codex-close.m4a', volume: 0.45 }, // a soft book close
};
