// First-flight onboarding (stage 3): a small FSM that walks a brand-new player
// through the Solar System — rotate, zoom, fly home, enter, meet Earth, find
// it in the codex. Steps are pure data in steps.js; main.js reports player
// actions via notify(event, payload) and this class decides whether the
// current step advances. One floating «coachmark» card (bottom-center, the
// #hint spot) is the whole UI — no scrims over the canvas, the player keeps
// full control of the galaxy at every step.
//
// Persistence: NAMESPACES.PLAYER / 'onboarding' → { v, done, skippedAt?,
// completedAt?, grandfathered? }. Only the terminal states persist — an
// abandoned half-tour simply restarts on the next boot, which is simpler and
// kinder than resuming into a context the player has forgotten.

import { NAMESPACES, read, write } from '../state/storage.js';
import { hasAnyEntries } from '../codex/codex.js';
import { ONBOARDING_STEPS } from './steps.js';

const SCOPE_KEY = 'onboarding';
const PAYLOAD_V = 1; // our payload's own version (storage.js's `v` is the envelope's)
const START_DELAY_MS = 1600; // let the loader fade + the first render settle

export class Onboarding {
  constructor(app) {
    this.app = app;
    this.steps = ONBOARDING_STEPS;
    this.index = -1;
    this.active = false;
    this._el = null; // the coachmark card root (lazy)
    this._glowEl = null; // element currently haloed by the active step
  }

  /** Start the tour on a fresh browser only: never when already done/skipped,
   *  never over the cinematic show, and a browser that has already discovered
   *  things gets grandfathered — the codex predates this tutorial. */
  maybeStart() {
    const saved = read(NAMESPACES.PLAYER, SCOPE_KEY, null);
    if (saved && saved.done) return;
    // The veteran check runs ONLY on a browser this module has never stamped:
    // the tour itself creates codex entries (entering Sol, focusing Earth), so
    // an abandoned half-tour must not read as «veteran» on the next boot —
    // _begin() writes {done:false} precisely so this branch is skipped then.
    if (!saved && hasAnyEntries()) {
      write(NAMESPACES.PLAYER, SCOPE_KEY, { v: PAYLOAD_V, done: true, grandfathered: true, completedAt: Date.now() });
      return;
    }
    // the GEN_VERSION migration banner owns the same bottom-center spot for
    // ~9s — if it's up (a legacy save's first boot), start after it's gone.
    const delay = this.app._genBannerDismiss ? 10500 : START_DELAY_MS;
    const tryBegin = () => {
      // not a quiet galaxy moment (mid-warp / inside a system / the show is
      // running)? re-arm rather than lose the tour for the whole session.
      if (this.app._cineActive() || this.app.mode !== 'galaxy') {
        setTimeout(tryBegin, 3000);
        return;
      }
      this._begin();
    };
    setTimeout(tryBegin, delay);
  }

  /** main.js reports a player action. The FSM is strict about ORDER of taught
   *  actions (an event step never advances on a different event) but forgiving
   *  to eager players: an action may fast-forward past MANUAL narration steps
   *  — e.g. clicking Земля straight from the «meet-sol» card skips its
   *  «Дальше». The cinematic show drives the same code paths a player does —
   *  ignore it, same rule as the codex funnel. */
  notify(event, payload) {
    if (!this.active || this.app._cineActive()) return;
    // any warp re-docks the card: bottom-center in the galaxy, bottom-right
    // inside a system (the dossier panel owns bottom-center/left there).
    if (this._el && event === 'enterSystem') this._el.classList.add('in-system');
    if (this._el && event === 'exitSystem') this._el.classList.remove('in-system');
    for (let j = this.index; j < this.steps.length; j++) {
      const step = this.steps[j];
      if (step.advanceOn === `event:${event}` && this._matches(step.when, payload)) {
        this._goto(j + 1);
        return;
      }
      if (step.advanceOn !== 'manual') return; // only narration may be skipped
    }
  }

  _matches(when, payload) {
    if (!when) return true;
    const data = payload && payload.data;
    if (when.seed) return !!data && data.seed === when.seed;
    if (when.label) return !!data && data.label === when.label;
    return true;
  }

  /** The codex tab the rail click should land on right now, or undefined for
   *  the default. During the tour's «codex» step the graduate's finds live
   *  under «Планеты» — the default «Системы» tab would show an empty shelf. */
  wantsCodexTab() {
    if (!this.active) return undefined;
    const step = this.steps[this.index];
    return step ? step.codexTab : undefined;
  }

  // ---- flow -----------------------------------------------------------------

  _begin() {
    // stamp started-but-unfinished: an abandoned session restarts on the next
    // boot instead of being grandfathered by its own mid-tour codex records.
    write(NAMESPACES.PLAYER, SCOPE_KEY, { v: PAYLOAD_V, done: false, startedAt: Date.now() });
    this.active = true;
    document.body.classList.add('onboarding'); // hides #hint — the card replaces it
    this._mount();
    this._goto(0);
  }

  _goto(i) {
    this._clearGlow();
    if (i >= this.steps.length) {
      this._finish({ completedAt: Date.now() });
      return;
    }
    this.index = i;
    const step = this.steps[i];
    // leaving find-sol (either way) always drops the marker beacon
    if (step.id !== 'find-sol') this.app.systems.setBeacon(null);
    this._render(step);
    if (step.glow) {
      const el = document.getElementById(step.glow);
      if (el) {
        el.classList.add('onboard-glow');
        this._glowEl = el;
      }
    }
  }

  skip() {
    const step = this.steps[this.index];
    this._finish({ skippedAt: step ? step.id : null });
  }

  _finish(extra) {
    write(NAMESPACES.PLAYER, SCOPE_KEY, { v: PAYLOAD_V, done: true, ...extra });
    this.active = false;
    this.index = -1;
    this._clearGlow();
    if (this.app.systems) this.app.systems.setBeacon(null);
    document.body.classList.remove('onboarding');
    // lifting .onboarding would replay the static control-strip's fade from
    // zero — the tour already taught everything on it; retire it for good.
    const hint = document.getElementById('hint');
    if (hint) hint.remove();
    if (this._el) {
      const el = this._el;
      this._el = null;
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 400); // matches the CSS fade
    }
  }

  _clearGlow() {
    if (this._glowEl) {
      this._glowEl.classList.remove('onboard-glow');
      this._glowEl = null;
    }
  }

  // ---- «показать дом»: fly the galaxy camera to the Solar System marker ------

  async showHome() {
    const app = this.app;
    if (app._cineActive()) return; // the show owns the camera — don't fight it
    if (app._galaxyDolly) return; // a flight is already underway — don't restart it
    if (app.mode === 'system') await app.exitSystem();
    if (app.mode !== 'galaxy') return; // mid-transition — the button can be pressed again
    const target = app.systems.list.find((s) => s.data && s.data.seed === 'sol-system');
    if (!target) return;
    app.systems.setBeacon(target); // pulse until the step advances
    // freeze the idle spin so the marker holds still while the player aims
    app.controls.autoRotate = false;
    app._lastInteract = app._time;
    const toPos = app.camera.position.clone().lerp(target.worldPos, 0.6);
    app.controls.enabled = false; // don't fight the dolly
    try {
      await app._galaxyDollyTo(toPos, target.worldPos.clone(), 0.9);
    } finally {
      if (app.mode === 'galaxy') app.controls.enabled = true;
    }
  }

  // ---- the coachmark card -----------------------------------------------------

  _mount() {
    const el = document.createElement('div');
    el.id = 'onboard-card';
    el.innerHTML =
      '<div class="onboard-kicker"></div>' +
      '<div class="onboard-title"></div>' +
      '<div class="onboard-body"></div>' +
      '<div class="onboard-actions">' +
      '<button type="button" class="onboard-btn onboard-action"></button>' +
      '<button type="button" class="onboard-btn primary onboard-next"></button>' +
      '<button type="button" class="onboard-skip">Пропустить обучение</button>' +
      '</div>';
    document.body.appendChild(el);
    this._el = el;

    el.querySelector('.onboard-skip').addEventListener('click', () => this.skip());
    el.querySelector('.onboard-next').addEventListener('click', (e) => {
      e.currentTarget.blur(); // a focused button would swallow Space (system shortcut)
      this._goto(this.index + 1);
    });
    el.querySelector('.onboard-action').addEventListener('click', (e) => {
      e.currentTarget.blur();
      const step = this.steps[this.index];
      if (step && step.action === 'showHome') this.showHome();
    });
    requestAnimationFrame(() => el.classList.add('visible'));
  }

  _render(step) {
    const el = this._el;
    if (!el) return;
    el.querySelector('.onboard-kicker').textContent = `Первый полёт · шаг ${this.index + 1} из ${this.steps.length}`;
    const title = el.querySelector('.onboard-title');
    title.textContent = step.title || '';
    title.style.display = step.title ? '' : 'none';
    el.querySelector('.onboard-body').textContent = step.body;

    const actionBtn = el.querySelector('.onboard-action');
    actionBtn.style.display = step.action ? '' : 'none';
    if (step.action === 'showHome') actionBtn.textContent = 'Показать дом';

    const nextBtn = el.querySelector('.onboard-next');
    nextBtn.style.display = step.advanceOn === 'manual' ? '' : 'none';
    nextBtn.textContent = step.next || 'Дальше';

    // «Пропустить» next to the final «В путь» would be a second button doing
    // the same thing — the last step offers only the real exit.
    el.querySelector('.onboard-skip').style.display = this.index === this.steps.length - 1 ? 'none' : '';

    // restart the slide-in so each step visibly «arrives»
    el.classList.remove('step-in');
    void el.offsetWidth; // reflow — restarts the CSS animation
    el.classList.add('step-in');
  }
}
