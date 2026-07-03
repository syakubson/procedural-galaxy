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
  // levels halved across the board 2026-07-03 — owner: «слишком громкие».
  // No 'chart' event: the first-charting stamp was cut entirely (owner).
  click: { src: 'audio/sfx/click.m4a', volume: 0.18 }, // a relay switch — every chrome button
  hover: { src: 'audio/sfx/hover.m4a', volume: 0.1 }, // a barely-there synth tick — a NEW marker under the pointer
  warpIn: { src: 'audio/sfx/warp-in.m4a', volume: 0.3 }, // designed whoosh 049 — diving into a system
  warpOut: { src: 'audio/sfx/warp-out.m4a', volume: 0.3 }, // its sibling 048 — pulling back out
  // the planet glide reuses the warp-in whoosh (owner: «как при вхождении»),
  // just quieter — same sound family for every scale of travel.
  planetFocus: { src: 'audio/sfx/warp-in.m4a', volume: 0.22 },
  codexOpen: { src: 'audio/sfx/codex-open.m4a', volume: 0.22 }, // a heavy page turn
  codexClose: { src: 'audio/sfx/codex-close.m4a', volume: 0.22 }, // a soft book close
};
