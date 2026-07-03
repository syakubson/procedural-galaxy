// SfxManager (stage 5): WebAudio-backed UI-sound player over the SFX_EVENTS
// table. All eight one-shots (~100 KB total) are fetched and decoded into
// AudioBuffers UP FRONT, so a press/hover triggers with zero fetch/element
// latency — the original <audio>-per-event version created its element on
// FIRST play, which audibly lagged the very first click of each kind.
//
// A re-trigger stops the previous shot of the same event (no stacking of
// rapid hover ticks); different events overlap freely. Master volume is one
// GainNode; per-event levels are per-shot gains from the table.
//
// Autoplay policy: the AudioContext is born suspended and resume() is called
// on every play — the first gesture-driven sound resumes it for good, and a
// pre-gesture hover simply stays silent (resume() is then rejected — fine).
//
// Persistence: NAMESPACES.PLAYER / 'sfx' → { muted, volume } — per-device,
// party-independent, same bucket as the onboarding stamp.

import { NAMESPACES, read, write } from '../state/storage.js';
import { SFX_EVENTS } from './sfxEvents.js';

const SCOPE_KEY = 'sfx';
const DEFAULT_VOLUME = 0.6;

export class SfxManager {
  constructor() {
    const saved = read(NAMESPACES.PLAYER, SCOPE_KEY, null) || {};
    this.muted = !!saved.muted;
    this.volume = typeof saved.volume === 'number' ? saved.volume : DEFAULT_VOLUME;
    this._ctx = null; // lazy — see _ensureCtx()
    this._master = null; // master GainNode (this.volume)
    this._buffers = new Map(); // event name -> decoded AudioBuffer
    this._last = new Map(); // event name -> its most recent source (re-trigger cuts it)
    this._preload();
  }

  _ensureCtx() {
    if (!this._ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this._ctx = new Ctx(); // born 'suspended' pre-gesture — decode still works
      this._master = this._ctx.createGain();
      this._master.gain.value = this.volume;
      this._master.connect(this._ctx.destination);
    }
    return this._ctx;
  }

  /** Fetch + decode every event's asset immediately (fetch needs no gesture),
   *  so the first audible play is instant. A failed asset just leaves its
   *  event silent — play() skips names with no buffer. */
  _preload() {
    const ctx = this._ensureCtx();
    for (const [name, def] of Object.entries(SFX_EVENTS)) {
      fetch(def.src)
        .then((r) => r.arrayBuffer())
        .then((raw) => ctx.decodeAudioData(raw))
        .then((buf) => this._buffers.set(name, buf))
        .catch(() => {}); // missing/undecodable asset → that event stays silent
    }
  }

  /** Fire one UI sound by its SFX_EVENTS name. Unknown names are a silent
   *  no-op (a call site can stay wired while its sound is retired). */
  play(name) {
    if (this.muted || this.volume <= 0) return;
    const def = SFX_EVENTS[name];
    const buf = this._buffers.get(name);
    if (!def || !buf) return; // unknown event, or its asset is still decoding
    const ctx = this._ensureCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {}); // pre-gesture → stays silent
    const prev = this._last.get(name);
    if (prev) {
      try {
        prev.stop(); // a rapid re-trigger cuts itself off — no tick pile-ups
      } catch {
        /* already ended */
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = def.volume;
    src.connect(gain);
    gain.connect(this._master);
    src.start();
    this._last.set(name, src);
  }

  setMuted(muted) {
    this.muted = !!muted;
    this._persist();
  }

  /** Master volume 0..1 — multiplies every event's own relative volume. */
  setVolume(volume) {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this._master) this._master.gain.value = this.volume;
    this._persist();
  }

  _persist() {
    write(NAMESPACES.PLAYER, SCOPE_KEY, { muted: this.muted, volume: this.volume });
  }
}
