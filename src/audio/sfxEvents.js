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

// Format note: crisp one-shots (click/hover/codex) ship as WAV — AAC pads
// ~23 ms of priming silence onto the front of every m4a, which reads as input
// lag on a transient. The warp whooshes SWELL in, so m4a stays fine there.
export const SFX_EVENTS = {
  // levels halved across the board 2026-07-03 — owner: «слишком громкие».
  // No 'chart' and no 'click' events: the first-charting stamp and the button
  // click were both cut entirely (owner) — buttons act, they don't speak.
  hover: { src: 'audio/sfx/hover.wav', volume: 0.1 }, // a barely-there synth tick — a NEW marker under the pointer
  warpIn: { src: 'audio/sfx/warp-in.m4a', volume: 0.3 }, // designed whoosh 049 — diving into a system
  warpOut: { src: 'audio/sfx/warp-out.m4a', volume: 0.3 }, // its sibling 048 — pulling back out
  // the planet glide reuses the warp-in whoosh (owner: «как при вхождении»),
  // just quieter — same sound family for every scale of travel.
  planetFocus: { src: 'audio/sfx/warp-in.m4a', volume: 0.22 },
  codexOpen: { src: 'audio/sfx/codex-open.wav', volume: 0.22 }, // a heavy page turn
  codexClose: { src: 'audio/sfx/codex-close.wav', volume: 0.22 }, // a soft book close
};
