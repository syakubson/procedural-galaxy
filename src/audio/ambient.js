// Background music (#6): real, melodic, free-to-bundle tracks with a play/pause
// toggle (🔊) and a next-track button (⏭). The previous procedural Web-Audio
// synth sounded dissonant/"scary"; these are calm, melodic, cinematic space
// pieces. Tracks fade in/out for smooth switching. Autoplay is blocked by
// browsers, so playback starts on the user's first click.
//
// Licensing (all free to bundle):
//   • "Echoes of Time" / "Frozen Star" — Kevin MacLeod (incompetech.com), CC-BY 4.0
//   • "Out There" — yd (OpenGameArt.org), CC0 / public domain
// The required credit is shown in the on-screen track label and in audio/CREDITS.txt.

import { NAMESPACES, read, write } from '../state/storage.js';

const TRACKS = [
  { name: 'Frozen Star', credit: 'Kevin MacLeod · CC-BY', src: 'audio/tracks/frozen_star.mp3' }, // default (#6)
  { name: 'Echoes of Time', credit: 'Kevin MacLeod · CC-BY', src: 'audio/tracks/echoes_of_time.mp3' },
  { name: 'Out There', credit: 'yd · CC0', src: 'audio/tracks/out_there.ogg' },
];
const DEFAULT_VOLUME = 0.5;
const SCOPE_KEY = 'music'; // NAMESPACES.PLAYER / 'music' → { volume }

export class AmbientMusic {
  constructor() {
    this.trackIndex = 0;
    this.playing = false;
    this._fadeT = 0;
    const saved = read(NAMESPACES.PLAYER, SCOPE_KEY, null) || {};
    this.volume = typeof saved.volume === 'number' ? saved.volume : DEFAULT_VOLUME;
    // the ♪ toggle is the ONE master audio switch: main.js hooks this to also
    // mute/unmute the UI sounds, so «музыка выключена» means «всё звук выключен».
    this.onStateChange = null;

    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.preload = 'none';
    this.audio.volume = 0;

    // --- UI: track label + ⏭ next + 🔊 toggle (bottom-right) ---
    const label = document.createElement('div');
    label.id = 'music-track';
    document.body.appendChild(label);
    this._label = label;

    const nextBtn = document.createElement('button');
    nextBtn.id = 'music-next';
    nextBtn.type = 'button';
    nextBtn.title = 'Следующий трек';
    nextBtn.setAttribute('aria-label', 'Следующий трек');
    nextBtn.textContent = '»';
    nextBtn.addEventListener('click', () => this.next());
    document.body.appendChild(nextBtn);

    const btn = document.createElement('button');
    btn.id = 'music-toggle';
    btn.type = 'button';
    btn.title = 'Космическая музыка';
    btn.setAttribute('aria-label', 'Музыка');
    btn.textContent = '♪'; // monochrome note; .on tints it brass when playing
    btn.addEventListener('click', () => {
      const on = this.toggle();
      btn.classList.toggle('on', on);
      this._userToggled = true; // the user took control — don't auto-start anymore
    });
    document.body.appendChild(btn);
    this._btn = btn;

    this._armAutostart();
  }

  /** Music is ON by default (#5). Browsers block autoplay, so light the toggle
   *  now and kick playback off on the user's very first interaction — unless they
   *  manually turned it off first. */
  _armAutostart() {
    this._btn.classList.add('on');
    const start = () => {
      window.removeEventListener('pointerdown', start, true);
      window.removeEventListener('keydown', start, true);
      if (this._userToggled || this.playing) return;
      const on = this.toggle();
      this._btn.classList.toggle('on', on);
    };
    window.addEventListener('pointerdown', start, true);
    window.addEventListener('keydown', start, true);
  }

  _load(i) {
    this.trackIndex = i;
    this.audio.src = TRACKS[i].src;
  }

  _showLabel(i) {
    this._label.textContent = `${TRACKS[i].name} · ${TRACKS[i].credit}`;
    this._label.classList.add('show');
    clearTimeout(this._labelTimer);
    this._labelTimer = setTimeout(() => this._label.classList.remove('show'), 4500);
  }

  _fade(target, ms, done) {
    clearInterval(this._fadeT);
    const a = this.audio;
    const from = a.volume;
    const steps = Math.max(1, Math.round(ms / 40));
    let i = 0;
    this._fadeT = setInterval(() => {
      i++;
      a.volume = Math.max(0, Math.min(1, from + (target - from) * (i / steps)));
      if (i >= steps) {
        clearInterval(this._fadeT);
        if (done) done();
      }
    }, 40);
  }

  /** @returns {boolean} whether music is now playing. */
  toggle() {
    if (!this.playing) {
      if (!this.audio.src) this._load(this.trackIndex);
      this.audio.play().catch(() => {});
      this._fade(this.volume, 1500);
      this._showLabel(this.trackIndex);
      this.playing = true;
    } else {
      this._fade(0, 600, () => this.audio.pause());
      this.playing = false;
    }
    if (this.onStateChange) this.onStateChange(this.playing); // master switch (#sfx)
    return this.playing;
  }

  /** Music volume 0..1 — persisted per device; eases to the new level live. */
  setVolume(volume) {
    this.volume = Math.min(1, Math.max(0, volume));
    write(NAMESPACES.PLAYER, SCOPE_KEY, { volume: this.volume });
    if (this.playing) this._fade(this.volume, 200);
  }

  /** Crossfade to the next track (starting playback if it wasn't running). */
  next() {
    const nextI = (this.trackIndex + 1) % TRACKS.length;
    if (!this.playing) {
      this._load(nextI);
      this.toggle();
      this._btn.classList.add('on');
      return;
    }
    this._fade(0, 500, () => {
      this._load(nextI);
      this.audio.play().catch(() => {});
      this._fade(this.volume, 1200);
      this._showLabel(nextI);
    });
  }
}
