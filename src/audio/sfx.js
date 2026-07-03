// SfxManager (stage 5): tiny, lazy UI-sound player over the SFX_EVENTS table.
// One HTMLAudioElement per event, created on first play and then re-triggered
// by rewinding — a rapid re-trigger (hover ticks) cuts itself off instead of
// stacking, which is exactly the right feel for UI feedback. No WebAudio
// graph: seven short one-shot samples don't need one, and <audio> keeps the
// main thread + frame budget untouched.
//
// Autoplay policy: browsers reject play() before the first user gesture.
// Every SFX here is triggered BY a gesture except the galaxy-marker hover —
// so a pre-gesture hover's rejection is swallowed silently and the sound
// simply starts working from the first click on.
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
    this._pool = new Map(); // event name -> lazily created HTMLAudioElement
  }

  /** Fire one UI sound by its SFX_EVENTS name. Unknown names are a silent
   *  no-op (a call site can stay wired while its sound is retired). */
  play(name) {
    if (this.muted || this.volume <= 0) return;
    const def = SFX_EVENTS[name];
    if (!def) return;
    let a = this._pool.get(name);
    if (!a) {
      a = new Audio(def.src);
      a.preload = 'auto';
      this._pool.set(name, a);
    }
    a.volume = Math.min(1, def.volume * this.volume);
    a.currentTime = 0; // re-trigger cuts the previous shot — no stacking
    const p = a.play();
    if (p && p.catch) p.catch(() => {}); // pre-gesture autoplay block — skip silently
  }

  setMuted(muted) {
    this.muted = !!muted;
    this._persist();
  }

  /** Master volume 0..1 — multiplies every event's own relative volume. */
  setVolume(volume) {
    this.volume = Math.min(1, Math.max(0, volume));
    this._persist();
  }

  _persist() {
    write(NAMESPACES.PLAYER, SCOPE_KEY, { muted: this.muted, volume: this.volume });
  }
}
