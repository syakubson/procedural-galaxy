// Application orchestrator: renderer, camera + controls, the galaxy layers,
// post-processing and the render loop. Designed to stay light on the CPU —
// per frame it only advances one time value and lets the GPU do the rest.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createDefaultConfig, applyQuality, PERF_BUDGETS, checkBudget, resolveBudgetProfile } from './config.js';
import { AssetLoader } from './assetLoader.js';
import { getPalette } from './palettes.js';
import { Galaxy } from './galaxy.js';
import { Suns } from './suns.js';
import { Background } from './background.js';
import { PostFX } from './postfx.js';
import { buildGUI } from './gui.js';
import { Systems } from './systems/markers.js';
import { SystemView } from './systems/systemView.js';
import { framingFor } from './systems/focusConfig.js';
import { InfoPanel, Tooltip, Overlay, Legend, structureCard } from './ui/hud.js';
import { PlanetLabels } from './ui/planetLabels.js';
import { AmbientMusic } from './audio/ambient.js';
import { WorldOverlay } from './state/overlay.js';
import { currentPartyId, ensureParty, hasLegacyCharted } from './state/party.js';
import { record as codexRecord, flush as codexFlush } from './codex/codex.js';
import { CodexUI } from './codex/codexUI.js';
import { ObjectViewer } from './ui/objectViewer.js';
import { ROLES } from './systems/ships.js';
import { STATION_TYPES } from './systems/stations.js';

// Which special system each phenomenon lives in — so «Перейти к объекту» can
// warp to it (a phenomenon's sourceRef holds only its id, not a system seed).
const PHENOMENON_SYSTEM_SEED = {
  'blackhole-galactic': 'galactic-core',
  'blackhole-gargantua': 'interstellar',
  endurance: 'interstellar',
  ishimura: 'deadspace',
  deathstar: 'death-star',
  dragon: 'sol-system',
};

// Russian planet-type labels for the in-system hover card (#6).
const SYS_TYPE_RU = {
  lava: 'Лавовая',
  rocky: 'Каменистая',
  desert: 'Пустынная',
  terran: 'Земного типа',
  ocean: 'Океаническая',
  ice: 'Ледяная',
  gas: 'Газовый гигант',
};

// Held keys that drive the camera each frame (orbit + zoom). Discrete one-shot
// keys (R/C/M/Esc/Space) are handled on keydown, not tracked here (#2).
const MOVE_CODES = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'KeyQ', 'KeyE', // Q/E zoom in/out
  'Equal', 'Minus', 'NumpadAdd', 'NumpadSubtract',
]);
const _ko = new THREE.Vector3(); // scratch: camera→target offset
const _ksph = new THREE.Spherical(); // scratch: that offset in spherical coords

class GalaxyApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.config = createDefaultConfig('medium');
    this.stats = { fps: 0, drawCalls: 0, triangles: 0 };

    this._time = 0; // accumulated animation time (seconds)
    this._galaxyRotTime = 0; // galaxy-spin clock — only advances while idle (frozen on interaction)
    this._lastInteract = 0; // time of last camera interaction (auto-rotate idle, #23)
    this._galaxyDolly = null; // galaxy-side camera flight into/out of a system (#9)
    this._preDolly = null; // saved galaxy view to restore on exit (#9)
    this._running = true;
    this._fpsEma = 60;
    this._lowPerfFrames = 0;
    this._autoDowngraded = false;

    this.mode = 'galaxy'; // 'galaxy' | 'system' | 'transition'

    // Created before _buildWorld(): Background takes it in its constructor so
    // it can defer its own texture fetch; SystemView gets the same instance
    // further down, once the renderer it needs exists.
    this.assetLoader = new AssetLoader();

    this._initRenderer();
    this._initScene();
    this._initControls();
    this._buildWorld();
    this.postfx = new PostFX(this.renderer, this.scene, this.camera, this.config.antialias ? 4 : 0);

    // The party this browser is playing: `ensureParty` also reports whether
    // GEN_VERSION moved since last boot (or this is a pre-overlay save's first
    // run), which drives the one-time notice below. The world overlay itself
    // MUST exist before _buildSystems() — Systems reads visited-state from it
    // while placing markers.
    this._partyStatus = ensureParty(this.config);
    this.worldOverlay = new WorldOverlay(currentPartyId(this.config));

    this._buildSystems();
    this.systemView = new SystemView(this.renderer, this.assetLoader);
    this._initHud();
    this._initCodex();
    this._syncPixelRatio();

    this.clock = new THREE.Clock();

    this._bindEvents();
    this.gui = buildGUI(this);
    this.gui.hide(); // minimal galaxy view — the generator panel opens via the ⚙ button
    this._initSettingsToggle();
    this._initViewMode();
    this._initRotateToggle();
    this._initCinematic();
    this._initControlsHelp();
    this._maybeShowGenVersionBanner();

    this._loop = this._loop.bind(this);
    this.renderer.setAnimationLoop(this._loop);

    this._warmUpSystemShaders(); // pre-compile system shaders so the first dive is instant
  }

  /** One-time notice: the generation rules moved (GEN_VERSION bumped) since
   *  this browser last played, or this is a returning pre-overlay save seeing
   *  the new party format for the first time — either way the charted-systems
   *  map necessarily starts over. Self-dismisses on click or after a timeout,
   *  same pattern as the #cine-hint / #hint floating notices. */
  _maybeShowGenVersionBanner() {
    const { versionChanged, fromVersion } = this._partyStatus;
    const firstRunOnNewSaveFormat = fromVersion === null && hasLegacyCharted();
    if (!versionChanged && !firstRunOnNewSaveFormat) return;

    const el = document.createElement('div');
    el.id = 'genversion-banner';
    el.textContent =
      'Правила генерации миров обновились — вселенная пересобрана заново, карта исследований начата с чистого листа.';
    document.body.appendChild(el);

    const dismiss = () => {
      el.classList.remove('visible');
      clearTimeout(timer);
      this._genBannerDismiss = null;
      setTimeout(() => el.remove(), 400); // matches the CSS fade duration below
    };
    el.addEventListener('click', dismiss);
    const timer = setTimeout(dismiss, 9000);
    // enterSystem() calls this so the pill never lingers over the warp fade
    // or collides with the cinematic hint (both live in the same screen spot).
    this._genBannerDismiss = dismiss;
    requestAnimationFrame(() => el.classList.add('visible'));
  }

  /** Wire the ⚙ button that opens/closes the generator panel (hidden by default
   *  so the galaxy reads as a universe to explore, not an engineer's console). */
  _initSettingsToggle() {
    const btn = document.getElementById('settings-toggle');
    this._settingsBtn = btn;
    this._galleryLink = document.getElementById('gallery-link');
    this._settingsOpen = false;
    if (!btn) return;
    btn.addEventListener('click', () => {
      this._settingsOpen = !this._settingsOpen;
      if (this._settingsOpen) this.gui.show();
      else this.gui.hide();
      btn.classList.toggle('on', this._settingsOpen);
    });
  }

  /** Wire the bottom-right view-mode cycle (system view only):
   *   0 — full: labels + side description + object shifted right
   *   1 — clean scene: labels hidden
   *   2 — cinematic: labels + description hidden, object centred. */
  _initViewMode() {
    const btn = document.getElementById('view-mode');
    this._viewModeBtn = btn;
    this._reticle = document.getElementById('reticle');
    // hover selection — brass corner brackets, same square shape as the focus
    // reticle but lighter (#1); open sides keep it off the side label (#2)
    this._hoverRing = document.createElement('div');
    this._hoverRing.id = 'hover-ring';
    this._hoverRing.setAttribute('aria-hidden', 'true');
    this._hoverRing.innerHTML =
      '<span class="rt c1"></span><span class="rt c2"></span><span class="rt c3"></span><span class="rt c4"></span>';
    document.body.appendChild(this._hoverRing);
    this._hoverObj = null;
    this._hoverR = 1;
    this._viewMode = 0;
    this._viewModeIcons = ['❏', '○', '▣']; // labels / clean scene / cinematic (monochrome glyphs)
    if (!btn) return;
    btn.addEventListener('click', () => {
      this._viewMode = (this._viewMode + 1) % 3;
      this._applyViewMode();
    });
  }

  /** Wire the galaxy-view «stop / rotate» toggle (#4): a hard stop that holds the
   *  map still (and suppresses the 7s idle-resume) until the user restarts it. */
  _initRotateToggle() {
    this._rotationLocked = false;
    this._rotBtnRotating = null;
    const btn = document.createElement('button');
    btn.id = 'rotate-toggle';
    btn.type = 'button';
    btn.classList.add('visible'); // galaxy mode is shown from the start
    btn.innerHTML = this._rotIcon(true);
    btn.addEventListener('click', () => {
      if (!this.controls) return;
      if (this.controls.autoRotate) {
        // spinning → hard-stop (lock so it won't auto-resume after 7s)
        this._rotationLocked = true;
        this.controls.autoRotate = false;
      } else {
        // stopped — by the button OR by a mouse drag — → spin again right now
        this._rotationLocked = false;
        this.controls.autoRotate = true;
        this._lastInteract = this._time;
      }
      this._syncRotateBtn(true);
    });
    document.body.appendChild(btn);
    this._rotateBtn = btn;
  }

  /** Media-player play/pause glyphs for the map-rotate toggle (#7). */
  _rotIcon(rotating) {
    return rotating
      ? '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><rect x="7" y="5.5" width="3.6" height="13" rx="0.9"/><rect x="13.4" y="5.5" width="3.6" height="13" rx="0.9"/></svg>'
      : '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M8 5.4 18.6 12 8 18.6Z"/></svg>';
  }

  /** Keep the rotate button in sync with the ACTUAL spin state (#6): pause icon
   *  while spinning, play icon while stopped — including a mouse-drag pause — so
   *  the user can always click to spin again. */
  _syncRotateBtn(force) {
    if (!this._rotateBtn || !this.controls) return;
    const rotating = !!this.controls.autoRotate;
    if (!force && this._rotBtnRotating === rotating) return;
    this._rotBtnRotating = rotating;
    this._rotateBtn.innerHTML = this._rotIcon(rotating);
    this._rotateBtn.title = rotating ? 'Остановить вращение карты' : 'Вращать карту';
    this._rotateBtn.classList.toggle('on', !rotating);
  }

  /** A «?» button (top-right, by the settings gear) that toggles a small panel
   *  listing every control — mouse + keyboard (#2). */
  _initControlsHelp() {
    const btn = document.createElement('button');
    btn.id = 'help-toggle';
    btn.type = 'button';
    btn.title = 'Управление';
    btn.setAttribute('aria-label', 'Управление');
    btn.textContent = '?';
    btn.classList.add('visible'); // galaxy mode from the start
    document.body.appendChild(btn);

    const panel = document.createElement('div');
    panel.id = 'help-panel';
    panel.setAttribute('aria-hidden', 'true');
    const rows = [
      ['Мышь', ''],
      ['Колесо', 'приблизиться к курсору'],
      ['Зажать ЛКМ', 'повернуть / облёт'],
      ['Клавиатура', ''],
      ['Стрелки / WASD', 'обзор'],
      ['Q / E · + / −', 'зум'],
      ['R', 'вращение карты'],
      ['C', 'кинопоказ'],
      ['M', 'музыка'],
      ['Пробел', 'из планеты — к системе'],
      ['Esc', 'шаг назад'],
    ];
    panel.innerHTML =
      '<h4>Управление</h4>' +
      rows
        .map(([k, v]) =>
          v === ''
            ? `<div class="help-group">${k}</div>`
            : `<div class="help-row"><kbd>${k}</kbd><span>${v}</span></div>`,
        )
        .join('');
    document.body.appendChild(panel);

    btn.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      btn.classList.toggle('on', open);
    });
    // click outside / Esc closes it
    document.addEventListener('pointerdown', (e) => {
      if (panel.classList.contains('open') && e.target !== btn && !panel.contains(e.target)) {
        panel.classList.remove('open');
        btn.classList.remove('on');
      }
    });
    this._helpBtn = btn;
    this._helpPanel = panel;
  }

  /** Hide the «?» help button + close its panel (called on entering a system). */
  _hideHelp() {
    if (this._helpBtn) this._helpBtn.classList.remove('visible', 'on');
    if (this._helpPanel) this._helpPanel.classList.remove('open');
  }

  /** Wire the cinematic auto-tour (#5): a hands-off camera show that
   *  dives system to system, lingering on each highlight with a slow cinematic
   *  drift. Any interaction ends it. */
  _initCinematic() {
    this._cine = null;
    const btn = document.createElement('button');
    btn.id = 'cine-toggle';
    btn.type = 'button';
    btn.title = 'Кинопоказ — авто-облёт миров';
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="3" y="7" width="12.5" height="10" rx="1.6"/><path d="M15.5 10.4 21 7.6v8.8l-5.5-2.8z"/></svg>';
    btn.classList.add('visible');
    btn.addEventListener('click', () => {
      if (this._cineActive()) this.stopCinematic();
      else this.startCinematic();
    });
    document.body.appendChild(btn);
    this._cineBtn = btn;

    const hint = document.createElement('div');
    hint.id = 'cine-hint';
    hint.textContent = 'Кинопоказ · любое действие — выход';
    document.body.appendChild(hint);
    this._cineHintEl = hint;

    // any interaction ends the show — EXCEPT the cinematic toggle itself and the
    // music on/off button, which stays live so you can mute during the show (#cine)
    const exempt = (t) => t === this._cineBtn || (t && t.closest && t.closest('#music-toggle'));
    document.addEventListener('pointerdown', (e) => {
      if (this._cineActive() && !exempt(e.target)) this.stopCinematic();
    });
    window.addEventListener('wheel', () => this._cineActive() && this.stopCinematic(), { passive: true });
    window.addEventListener('keydown', () => this._cineActive() && this.stopCinematic());
  }

  _cineActive() {
    return !!(this._cine && this._cine.active);
  }

  startCinematic() {
    if (this._cineActive() || this.mode !== 'galaxy') return;
    this._cine = { active: true };
    this._suppressClick = true; // swallow the click that started the show
    this._hoverObj = null;
    if (this._cineBtn) this._cineBtn.classList.add('on'); // camera lights up while running
    if (this._cineHintEl) this._cineHintEl.classList.add('visible');
    // the exit hint only shows for the first 10s, then fades away (#cine)
    clearTimeout(this._cineHintTimer);
    this._cineHintTimer = setTimeout(() => {
      if (this._cineHintEl) this._cineHintEl.classList.remove('visible');
    }, 10000);
    this.runCinematic();
  }

  stopCinematic() {
    if (!this._cine) return;
    this._cine.active = false;
    this._suppressClick = true; // swallow the interrupting click
    if (this.overlay) this.overlay.fadeTo(0, 300); // reveal at once (we may be mid-black)
    this._endCinematic();
  }

  /** Idempotent teardown — hands normal control back after the tour ends/breaks. */
  _endCinematic() {
    this._cine = null;
    if (this._cineBtn) this._cineBtn.classList.remove('on');
    if (this._cineHintEl) this._cineHintEl.classList.remove('visible');
    document.body.classList.remove('clean-view');
    document.body.classList.remove('cine-show');
    if (this.systemView) this.systemView.controls.autoRotate = false;
    clearTimeout(this._cineHintTimer);
    // restore the galaxy chrome the tour kept hidden (when we land back in galaxy)
    if (this.mode === 'galaxy') {
      if (this._settingsBtn) this._settingsBtn.style.display = '';
      if (this._galleryLink) this._galleryLink.style.display = '';
      if (this._codexBtn) this._codexBtn.style.display = '';
      this.legend.setVisible(this.config.showMarkers);
      this.controls.enabled = true;
      this.controls.autoRotate = this.config.cameraAutoRotate;
      this._lastInteract = this._time;
      if (this._rotateBtn) this._rotateBtn.classList.add('visible');
      if (this._cineBtn) this._cineBtn.classList.add('visible');
      if (this._helpBtn) this._helpBtn.classList.add('visible');
    }
  }

  /** Resolve after `ms`, or early the instant the show is interrupted. */
  _cineWait(ms) {
    return new Promise((res) => {
      const start = performance.now();
      const tick = () => {
        if (!this._cineActive() || performance.now() - start >= ms) return res();
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  /** Curated tour stops: Solar System, the Dead Space system, the other
   *  hand-built specials, then a handful of inhabited systems. */
  _buildCineStops() {
    const list = this.systems.list;
    const byName = (n) => list.find((s) => s.data && s.data.name === n);
    const stops = [];
    const push = (s) => s && !stops.includes(s) && stops.push(s);
    push(byName('Солнечная система')); // Earth + Crew Dragon
    push(byName('Чёрный Карантин')); // the Ishimura cracks a planet
    push(byName('Гаргантюа')); // black hole + the Endurance station
    // the rest of the hand-built specials (events/phenomena/transport), skipping
    // only the galactic-core void
    for (const s of list) if (s.special && !s.noFade) push(s);
    const inhab = list.filter((s) => !s.special && s.data && s.data.status === 'inhabited');
    for (const s of inhab.slice(0, 4)) push(s);
    return stops;
  }

  /** Ordered focus actions for the current system — the interesting stuff first
   *  (transport, phenomena, events), then a couple of standout worlds (#cine). */
  _cineHighlights(sv) {
    const acts = [];
    if (sv.dragon) acts.push(() => this._focusHit('dragon', sv.dragon)); // transport
    if (sv.ishimura) acts.push(() => this._focusHit('ishimura', sv.ishimura)); // event
    if (sv.deathStar) acts.push(() => this._focusHit('deathstar', sv.deathStar)); // event
    if (sv.endurance) acts.push(() => this._cineFocusEndurance(sv)); // transport near the black hole
    const flag = (sv.ships || []).find((s) => s.type && s.type.cat === 'flagship');
    if (flag) acts.push(() => this._focusHit('ship', flag)); // fleet flagship
    // then a couple of standout worlds
    const planets = sv.planets || [];
    const pick = [];
    const inhab = planets.find((p) => p.data && (p.data.inhabited || p.data.ruined));
    if (inhab) pick.push(inhab);
    const gas = planets.find((p) => p.data && p.data.type === 'gas' && !pick.includes(p));
    if (gas) pick.push(gas);
    for (const p of planets) {
      if (pick.length >= 2) break;
      if (!pick.includes(p)) pick.push(p);
    }
    for (const p of pick) acts.push(() => this._focusPlanet(p));
    return acts;
  }

  /** Cinematic focus on the Endurance ring station (it isn't a normal pickable). */
  _cineFocusEndurance(sv) {
    if (!sv.endurance) return;
    this._frameObject(sv.endurance.group, 'endurance');
    this.infoPanel.showStructure(
      {
        kindLabel: 'Станция · экспедиция',
        name: '«Эндюранс»',
        desc: 'Вращающаяся станция-кольцо: искусственную тяжесть ей даёт само вращение обода. Горстка людей на ней ищет человечеству новый дом — у самого края чёрной дыры, где время течёт иначе.',
        meta: [
          ['Тип', 'кольцевая станция'],
          ['Экипаж', 'экспедиция'],
          ['Тяжесть', 'от вращения обода'],
          ['Курс', 'к мирам за горизонтом событий'],
        ],
      },
      null, // not a faction build — keep the "Orbital structure" subtitle
    );
    this.planetLabels.setVisible(false);
  }

  async runCinematic() {
    const stops = this._buildCineStops();
    if (!stops.length) {
      this._endCinematic();
      return;
    }
    let i = 0;
    try {
      await this.overlay.fadeTo(1, 480); // the show begins from black
      while (this._cineActive()) {
        const entry = stops[i % stops.length];
        i++;
        document.body.classList.add('cine-show');
        await this.enterSystem(entry); // built behind the black — no warp flight
        if (!this._cineActive()) break;
        document.body.classList.add('cine-show');
        this.systemView.controls.autoRotate = true;
        this.systemView.controls.autoRotateSpeed = 0.42; // slow, even drift
        // fade IN on the overview — time to read WHAT this system is
        await this.overlay.fadeTo(0, 650);
        await this._cineWait(6500);
        if (!this._cineActive()) break;
        for (const act of this._cineHighlights(this.systemView).slice(0, 3)) {
          if (!this._cineActive()) break;
          await this.overlay.fadeTo(1, 460); // fade to black between objects
          if (!this._cineActive()) break;
          act();
          this.systemView.snapFocus(); // cut to the framed object behind the black
          await this._cineWait(120);
          await this.overlay.fadeTo(0, 600); // fade in on the new object
          await this._cineWait(11000); // ~11s — time to read the card
        }
        if (!this._cineActive()) break;
        await this.overlay.fadeTo(1, 460); // fade out before leaving the system
        if (!this._cineActive()) break;
        await this.exitSystem(); // teardown behind the black
        await this._cineWait(250);
      }
    } catch (e) {
      // a failed transition just ends the show gracefully
    }
    await this.overlay.fadeTo(0, 320).catch(() => {}); // never leave the screen black
    this._endCinematic();
  }

  /** Position the brass ranging reticle over the focused object (#15). Hidden
   *  during the dolly-in / transitions and whenever nothing is focused. */
  _updateReticle(sv, transitioning) {
    const r = this._reticle;
    if (!r) return;
    const fc = this.infoPanel ? this.infoPanel.focusEl : null;
    const hide = () => {
      r.classList.remove('visible');
      if (fc) fc.classList.remove('visible');
    };
    const f = sv._focus;
    if (!f || f.entering || transitioning) {
      hide();
      return;
    }
    // the reticle + its callout belong to the on-scene HUD layer: the «clean
    // scene» (mode 1) and «cinematic» (mode 2) turn them off — only mode 0 keeps
    // them (#18). The label-toggle button thus clears the brackets too.
    if (this._viewMode !== 0) {
      hide();
      return;
    }
    const cam = sv.camera;
    const c = new THREE.Vector3();
    f.obj.getWorldPosition(c);
    const cp = c.clone().project(cam);
    if (cp.z >= 1) {
      hide();
      return;
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const sx = (cp.x * 0.5 + 0.5) * w;
    const sy = (-cp.y * 0.5 + 0.5) * h;
    // project a point one radius to the camera-right → on-screen radius in px
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const edge = c.clone().addScaledVector(right, f.reticleRadius || 1).project(cam);
    const pxR = Math.hypot((edge.x * 0.5 + 0.5) * w - sx, (-edge.y * 0.5 + 0.5) * h - sy);
    const size = Math.max(44, pxR * 2 + 28);
    r.style.left = `${sx}px`;
    r.style.top = `${sy}px`;
    r.style.width = `${size}px`;
    r.style.height = `${size}px`;
    r.classList.add('visible');

    // park the side callout (label + description) beside the reticle, flipping
    // to the left when there isn't room on the right
    if (fc && this.infoPanel.focusActive) {
      const fcw = fc.offsetWidth || 240;
      let fx = sx + size / 2 + 18;
      if (fx + fcw > w - 16) fx = sx - size / 2 - 18 - fcw;
      fc.style.left = `${Math.max(16, fx)}px`;
      fc.style.top = `${sy}px`;
      fc.classList.add('visible');
    } else if (fc) {
      fc.classList.remove('visible');
    }
  }

  /** Apply the current view mode to labels, the side panel and the framing. */
  _applyViewMode() {
    const m = this._viewMode;
    if (this._viewModeBtn) this._viewModeBtn.textContent = this._viewModeIcons[m];
    document.body.classList.toggle('clean-view', m === 2); // hide panel + facts
    if (this.systemView) this.systemView.setBaseShift(m === 2 ? 0 : 0.12); // centre vs. make room
    // labels are re-evaluated every frame in the loop (gated on m === 0)
  }

  /** Pre-compile the system-view shaders ONCE, in the background, while the user
   *  is still on the galaxy — so the first dive into a system doesn't pay the
   *  shader-compile cost mid-warp. three caches programs, so later dives reuse
   *  them. Best-effort and race-safe: skips if the user has already dived, and
   *  never clears a system they entered while we were compiling. */
  _warmUpSystemShaders() {
    setTimeout(async () => {
      if (!this._warmed && this.mode === 'galaxy') {
        const sample = this.systems.list.find(
          (s) => s.data && s.data.kind === 'star' && (s.data.planets || []).length >= 2,
        );
        if (sample) {
          try {
            this.systemView.load(sample.data);
            // Track the in-flight compile: compileAsync's readiness poll runs
            // in its own timer and CRASHES (not rejects) if a material it's
            // polling gets disposed under it — enterSystem() therefore awaits
            // this before load() replaces the warmup scene.
            this._warmupCompile = this.renderer.compileAsync(this.systemView.scene, this.systemView.camera);
            await this._warmupCompile;
            if (this.mode === 'galaxy') this.systemView.clear(); // don't nuke a system dived into meanwhile
            this._warmed = true;
          } catch {
            // a failed warmup just means the first real dive compiles normally
          } finally {
            this._warmupCompile = null;
          }
        }
      }
      // Deferred skybox fetches share this same idle window, off the critical
      // boot path. Galaxy first — it's the backdrop the player is looking at
      // right now; system second — that view isn't even visible until they
      // dive in. Either can fail (missing file, network hiccup) without
      // consequence: both scenes already render fine with their procedural /
      // flat-colour fallback, so a failure is just logged, not surfaced.
      try {
        await this.background.loadSkybox?.();
      } catch (e) {
        console.warn('[galaxy] galaxy skybox failed to load', e);
      }
      try {
        await this.systemView.loadSkybox?.();
      } catch (e) {
        console.warn('[galaxy] system skybox failed to load', e);
      }
    }, 1500);
  }

  // ---- setup ----------------------------------------------------------------

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.config.antialias,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(new THREE.Color(getPalette(this.config.palette).background), 1);
    // ACES tone-mapping (applied by the OutputPass) rolls off the additive HDR
    // accumulation so the core glows warm-white instead of clipping flat.
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.config.exposure;

    // Hardware point-size ceiling — weak GPUs cap this low (often 63/64); we
    // clamp to it so big suns don't hit the driver's silent point-size cliff.
    const gl = this.renderer.getContext();
    this.maxPointSize = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1] || 1024;

    // postfx does TWO renderer.render() calls per frame (the scene RenderPass,
    // then the OutputPass's fullscreen quad) — with autoReset left on, each one
    // wipes info.render before the next, so by the time the frame is done all
    // that's left is the OutputPass's own ~1 draw call / 2 triangles, not the
    // scene's real cost. We reset it ourselves once per frame in _loop() so the
    // totals accumulate across both passes instead.
    this.renderer.info.autoReset = false;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    const r = this.config.radius;
    this.camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      0.1,
      r * 20, // headroom over the radius*9 background shell at full zoom-out
    );
    // cinematic low-oblique view: close enough to fill the frame, tilted enough
    // to project the disk as a clear ellipse (a 3D plane, not a flat sprite).
    this.camera.position.set(0, r * 0.62, r * 1.2);
  }

  _initControls() {
    const r = this.config.radius;
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.target.set(0, 0, 0); // always orbit / zoom toward the galactic centre
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false; // keep the centre locked
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.9;
    controls.zoomToCursor = true; // #2: wheel zooms toward the cursor, not just the centre
    controls.maxTargetRadius = r * 0.5; // …but keep the focus near the centre so you never get lost
    controls.minDistance = r * 0.12; // dive into the core
    controls.maxDistance = r * 7;
    controls.maxPolarAngle = Math.PI * 0.92; // don't flip fully under the disk
    controls.autoRotate = this.config.cameraAutoRotate;
    controls.autoRotateSpeed = 0.3;
    // #23: stop the idle auto-rotation the moment the user grabs the camera
    // (drag / zoom); it resumes only after 30s of no interaction (see _loop).
    controls.addEventListener('start', () => {
      controls.autoRotate = false;
      this._lastInteract = this._time;
    });
    this.controls = controls;
  }

  _buildWorld() {
    this.galaxy = new Galaxy(this.config);
    this.suns = new Suns(this.config);
    this.background = new Background(this.config, this.assetLoader);
    // clamp shader point sizes to the device's hardware ceiling
    const cap = Math.min(this.maxPointSize, 1024);
    this.galaxy.material.uniforms.uMaxPointSize.value = cap;
    this.suns.material.uniforms.uMaxPointSize.value = cap;
    this.scene.add(this.background.group);
    this.scene.add(this.galaxy.points);
    this.scene.add(this.suns.points);
  }

  _buildSystems() {
    this.systems = new Systems(this.config, { overlay: this.worldOverlay });
    this.systems.setVisible(this.config.showMarkers);
    this.scene.add(this.systems.group);
  }

  /** Recreate the world overlay when the current seed no longer matches the
   *  party it was built for — a new seed IS a new party (see party.js). Called
   *  from rebuildSystems() so both a full rebuild() (seed change) and a
   *  systems-only rebuild (count/fraction change, same seed) go through one
   *  check instead of duplicating it at each call site. */
  _ensureWorldOverlayForCurrentParty() {
    const partyId = currentPartyId(this.config);
    if (!this.worldOverlay || this.worldOverlay.partyId !== partyId) {
      // A new seed is a new party: register its metadata record too, or the
      // overlay would write orphan patches nothing can attribute to a party
      // record (ensureParty is idempotent). The migration banner stays a
      // boot-only affair — no re-show here.
      this._partyStatus = ensureParty(this.config);
      this.worldOverlay = new WorldOverlay(partyId);
    }
  }

  _initHud() {
    this.overlay = new Overlay();
    this.tooltip = new Tooltip();
    this.infoPanel = new InfoPanel({
      onBack: () => this.exitSystem(),
      // from a planet/ship card → back to the system overview (#6/#7/#1)
      onBackToSystem: () => this._backToOverview(),
    });
    this.legend = new Legend();
    this.legend.setVisible(this.config.showMarkers);
    // clicking a diegetic label focuses that object, exactly like clicking it (#5/#6)
    this.planetLabels = new PlanetLabels((kind, ref) => this._focusHit(kind, ref));
    this.music = new AmbientMusic();
    this.raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2();
    this._downAt = { x: 0, y: 0 };
    this._updateProgress();
  }

  /** Wire the codex (#codex): a permanent, cross-party discovery log. The
   *  object viewer owns its OWN isolated renderer (ui/objectViewer.js) and
   *  pauses THIS app's render loop for as long as it stays open, via
   *  pauseRender()/resumeRender() below — the two renderers never compete
   *  for the frame budget. */
  _initCodex() {
    this._objectViewerOpen = false;
    this.objectViewer = new ObjectViewer({
      onOpen: () => {
        this._objectViewerOpen = true;
        this.pauseRender();
      },
      onClose: () => {
        this._objectViewerOpen = false;
        this.resumeRender();
      },
    });
    this.codexUI = new CodexUI({
      objectViewer: this.objectViewer,
      getOverlay: () => this.worldOverlay, // a live getter — the overlay is replaced on a seed change
      // 'system' has no finite catalog (codex.js's progress()) — hand it the
      // CURRENT party's chartable system count, same filter _updateProgress() uses.
      getSystemTotal: () => this.systems.list.filter((s) => !s.special).length,
      getPartyId: () => currentPartyId(this.config), // scopes 'system' progress to this galaxy
      onNavigate: (entry) => this.navigateToEntry(entry), // «Перейти к объекту» → warp there
    });
    this._codexBtn = document.getElementById('codex-toggle');
    if (this._codexBtn) this._codexBtn.addEventListener('click', () => this.codexUI.open());
  }

  /** Stop/resume the main render loop (`_loop` just early-returns on
   *  `!this._running` — `setAnimationLoop` keeps ticking either way) while the
   *  codex object viewer owns the frame budget with its own renderer. Mirrors
   *  the existing visibilitychange pause: resuming also drops the accumulated
   *  clock gap so the next frame's dt doesn't spike. */
  pauseRender() {
    this._running = false;
  }

  resumeRender() {
    // A hidden tab stays paused — the visibilitychange handler will resume
    // the loop when the tab comes back (and it, in turn, respects an open
    // object viewer; the two pause owners never override each other).
    this._running = !document.hidden;
    this.clock.getDelta();
  }

  /** All codex writes funnel through here so one rule holds everywhere: the
   *  cinematic auto-tour drives the very same enterSystem()/_focusHit()/
   *  _focusPlanet() paths a player does, and the show discovering things on
   *  its own would defeat the codex — only a real player action records. */
  _codexRecord(category, archetypeKey, meta) {
    if (this._cineActive()) return;
    codexRecord(category, archetypeKey, meta);
  }

  _syncPixelRatio() {
    const pr = Math.min(window.devicePixelRatio || 1, this.config.maxPixelRatio);
    this.renderer.setPixelRatio(pr);
    this.postfx.setPixelRatio(pr);
    this.postfx.setSize(window.innerWidth, window.innerHeight);
  }

  // ---- events ---------------------------------------------------------------

  _bindEvents() {
    let resizeRaf = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => this._onResize());
    });
    document.addEventListener('visibilitychange', () => {
      // Pause the loop when the tab is hidden — saves battery/CPU. An open
      // codex object viewer keeps the loop paused even on a visible tab
      // (pauseRender() owns the pause for as long as the viewer is up).
      this._running = !document.hidden && !this._objectViewerOpen;
      if (this._running) this.clock.getDelta(); // drop the accumulated gap
    });

    // --- system interaction (galaxy mode) ---
    this.canvas.addEventListener('pointermove', (e) => this._onPointerMove(e));
    this.canvas.addEventListener('pointerdown', (e) => {
      this._downAt = { x: e.clientX, y: e.clientY };
    });
    this.canvas.addEventListener('pointerup', (e) => {
      const moved = Math.hypot(e.clientX - this._downAt.x, e.clientY - this._downAt.y);
      if (moved < 6) this._onClick(e); // distinguish a click from an orbit-drag
    });
    // pointer left the canvas → drop any marker hover highlight (#1)
    this.canvas.addEventListener('pointerleave', () => {
      if (this.systems) this.systems.setHovered(null);
      this.tooltip.hide();
    });

    // --- keyboard control (#2) ---
    this._keys = new Set();
    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => this._keys.delete(e.code));
    window.addEventListener('blur', () => this._keys.clear());
  }

  /** Discrete shortcuts + held-movement-key tracking (#2). Movement itself is
   *  applied per frame in `_applyKeyboard`, so holding a key gives smooth motion. */
  _onKeyDown(e) {
    if (this._cineActive()) return; // the show treats any key as «exit» (wired in _initCinematic)
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;

    switch (e.code) {
      case 'Escape': // one step back: object viewer → codex → planet focus → system → galaxy (#1, #codex)
        if (this._objectViewerOpen) {
          this.objectViewer.close();
        } else if (this.codexUI && this.codexUI.isOpen) {
          this.codexUI.escape(); // detail dialog first (if up), then the panel
        } else if (this.mode === 'system') {
          if (this.systemView._focus) this._backToOverview();
          else this.exitSystem();
        }
        return;
      case 'KeyR': // toggle map rotation (reuses the corner button's logic)
        if (this.mode === 'galaxy' && this._rotateBtn) this._rotateBtn.click();
        return;
      case 'KeyC': // toggle the cinematic show
        if (this.mode === 'galaxy' && this._cineBtn) this._cineBtn.click();
        return;
      case 'KeyM': { // toggle music
        const mb = document.getElementById('music-toggle');
        if (mb) mb.click();
        return;
      }
      case 'Space': // drop a planet focus back to the system overview
        if (this.mode === 'system' && this.systemView._focus) {
          e.preventDefault();
          this._backToOverview();
        }
        return;
    }
    if (MOVE_CODES.has(e.code)) {
      this._keys.add(e.code);
      e.preventDefault(); // arrows/space would otherwise scroll the page
    }
  }

  /** Apply held movement keys to the active camera once per frame: arrows / WASD
   *  orbit around the current target, +/- dolly in and out (clamped to the same
   *  limits as the mouse). Runs in both galaxy and system view (#2). */
  _applyKeyboard(dt) {
    if (this._cineActive() || !this._keys.size) return;
    const system = this.mode === 'system';
    const controls = system ? this.systemView.controls : this.controls;
    const camera = system ? this.systemView.camera : this.camera;
    if (!controls || !camera) return;
    // don't fight an automated camera move (warp dolly, entry zoom, focus dolly)
    if (this._galaxyDolly) return;
    if (system && (this.systemView._zoom || (this.systemView._focus && this.systemView._focus.entering))) return;

    const k = this._keys;
    let az = 0;
    let pol = 0;
    let zoom = 1;
    if (k.has('ArrowLeft') || k.has('KeyA')) az += 1;
    if (k.has('ArrowRight') || k.has('KeyD')) az -= 1;
    if (k.has('ArrowUp') || k.has('KeyW')) pol -= 1;
    if (k.has('ArrowDown') || k.has('KeyS')) pol += 1;
    if (k.has('Equal') || k.has('NumpadAdd') || k.has('KeyQ')) zoom *= 1 - 0.9 * dt; // zoom in
    if (k.has('Minus') || k.has('NumpadSubtract') || k.has('KeyE')) zoom *= 1 + 0.9 * dt; // zoom out
    if (!az && !pol && zoom === 1) return;

    if (!system) {
      // a keyboard nudge counts as interaction → freeze the idle auto-spin (#23)
      this.controls.autoRotate = false;
      this._lastInteract = this._time;
    }

    const rot = 1.5 * dt; // orbit speed (rad/sec)
    _ko.copy(camera.position).sub(controls.target);
    _ksph.setFromVector3(_ko);
    _ksph.theta += az * rot;
    _ksph.phi += pol * rot;
    const minP = controls.minPolarAngle ?? 0.0001;
    const maxP = controls.maxPolarAngle ?? Math.PI;
    _ksph.phi = Math.max(minP + 0.02, Math.min(maxP - 0.02, _ksph.phi));
    _ksph.radius = Math.max(
      controls.minDistance || 0.1,
      Math.min(controls.maxDistance || 1e7, _ksph.radius * zoom),
    );
    _ko.setFromSpherical(_ksph);
    camera.position.copy(controls.target).add(_ko);
    camera.lookAt(controls.target);
  }

  _updatePointer(e) {
    this._pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this._pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this._pointer, this.camera);
  }

  _onPointerMove(e) {
    // Record only; the actual raycast runs at most once per frame in the loop.
    this._hover = { x: e.clientX, y: e.clientY };
  }

  /** Throttled hover pick — one raycast per rendered frame, in galaxy mode. */
  _processHover() {
    if (!this._hover) return;
    const e = this._hover;
    this._hover = null;
    this._pointer.x = (e.x / window.innerWidth) * 2 - 1;
    this._pointer.y = -(e.y / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this._pointer, this.camera);
    const hit = this.systems.pick(this.raycaster);
    this.systems.setHovered(hit); // grow + brass-tint the hovered marker (#1)
    if (hit) {
      this.tooltip.show(hit.data, e.x, e.y, hit.visited);
      this.canvas.style.cursor = 'pointer';
    } else {
      this.tooltip.hide();
      this.canvas.style.cursor = 'grab';
    }
  }

  /** Throttled hover pick in the system view — planets + ships (#6/#7). */
  _processHoverSystem() {
    if (!this._hover) return;
    const e = this._hover;
    this._hover = null;
    this._pointer.x = (e.x / window.innerWidth) * 2 - 1;
    this._pointer.y = -(e.y / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this._pointer, this.systemView.camera);
    // precise raycast first; fall back to the generous screen-space zone (#9)
    const hit =
      this.systemView.pickObject(this.raycaster) ||
      this.systemView.pickNearestScreen(e.x, e.y, window.innerWidth, window.innerHeight);
    // remember what's under the pointer so the hover ring can track it (#9)
    this._hoverObj = hit ? hit.obj : null;
    this._hoverR = hit ? this._hitRadius(hit) : 1;
    if (hit && hit.kind === 'planet') {
      // already focused on this planet → no "click to approach" prompt
      if (this.systemView._focus && this.systemView._focus.planet === hit.ref) {
        this.tooltip.hide();
        this.canvas.style.cursor = 'default';
        return;
      }
      const d = hit.ref.data;
      const title = d.label || d.biomeLabel || SYS_TYPE_RU[d.type] || 'Планета';
      this.tooltip.showSimple(title, 'нажмите, чтобы приблизиться →', e.x, e.y);
      this.canvas.style.cursor = 'pointer';
    } else if (hit && (hit.kind === 'ship' || hit.kind === 'structure' || hit.kind === 'ishimura' || hit.kind === 'deathstar')) {
      const name = hit.kind === 'ship' && hit.ref.type ? hit.ref.type.name : 'Объект';
      this.tooltip.showSimple(name, 'нажмите для информации →', e.x, e.y);
      this.canvas.style.cursor = 'pointer';
    } else {
      this.tooltip.hide();
      this.canvas.style.cursor = 'grab';
    }
  }

  /** World-space bounding-sphere radius of an object — the true size, so framing
   *  & brackets fit any model regardless of its scale. */
  _objectRadius(obj) {
    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) return 1;
    const s = box.getBoundingSphere(new THREE.Sphere());
    return s.radius || 1;
  }

  /** Focus `obj` with the camera distance + visor size for its `kind`, pulled
   *  from focusConfig.js. `r` is the radius basis (planet sphere radius, else the
   *  true bounding radius). */
  _frameObject(obj, kind, r) {
    const radius = r != null ? r : this._objectRadius(obj);
    const { dist, reticleRadius } = framingFor(kind, radius);
    this.systemView.focusObject(obj, dist, reticleRadius);
  }

  /** On-screen radius basis for the hover ring (#9). Planets use their sphere
   *  radius; everything else hugs its actual model bounds. */
  _hitRadius(hit) {
    if (hit.kind === 'planet') return hit.ref.data.radius;
    if (hit.obj) return this._objectRadius(hit.obj) * 0.72;
    return 1;
  }

  /** Position the soft brass hover ring over whatever's under the pointer (#9).
   *  Hidden when nothing is hovered or the hovered object is already focused
   *  (the ranging reticle covers that one). */
  _updateHoverRing() {
    const ring = this._hoverRing;
    if (!ring) return;
    const sv = this.systemView;
    const obj = this._hoverObj;
    if (!obj || (sv && sv._focus && sv._focus.obj === obj)) {
      ring.classList.remove('visible');
      return;
    }
    const c = new THREE.Vector3();
    obj.getWorldPosition(c);
    const cp = c.clone().project(sv.camera);
    if (cp.z >= 1) {
      ring.classList.remove('visible');
      return;
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const sx = (cp.x * 0.5 + 0.5) * w;
    const sy = (-cp.y * 0.5 + 0.5) * h;
    const right = new THREE.Vector3().setFromMatrixColumn(sv.camera.matrixWorld, 0);
    const edge = c.clone().addScaledVector(right, this._hoverR || 1).project(sv.camera);
    const pxR = Math.hypot((edge.x * 0.5 + 0.5) * w - sx, (-edge.y * 0.5 + 0.5) * h - sy);
    const size = Math.max(32, pxR * 2 + 12); // brackets hug the object tightly
    ring.style.left = `${sx}px`;
    ring.style.top = `${sy}px`;
    ring.style.width = `${size}px`;
    ring.style.height = `${size}px`;
    ring.classList.add('visible');
  }

  _updateProgress() {
    // count only real systems (the legend doesn't list the special black holes)
    const list = this.systems.list.filter((s) => !s.special);
    const n = list.filter((s) => s.visited).length;
    this.legend.setProgress(n, list.length);
  }

  /** Chart every system at once (#13) — fog-of-war off; refreshes the counter.
   *  Revealing the whole galaxy is equivalent to having been everywhere, so it
   *  also fills the codex with everything those systems hold (this is the ONE
   *  bulk path allowed to record — the cinematic tour still doesn't). */
  revealAllSystems() {
    this.systems.markAllVisited();
    this._updateProgress();
    this._recordEverythingDiscoverable();
    if (this.codexUI) this.codexUI.refresh();
  }

  /** Record every archetype reachable in the CURRENT galaxy, for revealAll.
   *  Systems/planets/races/ruins/phenomena come from real generated data (so
   *  each entry keeps a valid sourceRef the viewer can rebuild + navigate to);
   *  ships and stations are anchored per present faction (their in-system
   *  composition is drawn fresh each visit, so "every fleet type this galaxy
   *  fields" is the honest set). */
  _recordEverythingDiscoverable() {
    const batchId = currentPartyId(this.config);
    const factionSeed = {}; // faction -> a representative inhabited-system seed
    // defer every write and persist ONCE at the end (rec): hundreds of systems
    // would otherwise each trigger a full-map serialize + setItem.
    const rec = (category, key, meta) => codexRecord(category, key, meta, { defer: true });
    for (const s of this.systems.list) {
      const data = s.data;
      if (!data) continue;
      if (!s.special) {
        rec('system', data.seed, { batchId, sourceRef: { seed: data.seed }, label: data.name });
      }
      if (data.faction && data.status === 'inhabited' && !factionSeed[data.faction]) factionSeed[data.faction] = data.seed;
      (data.planets || []).forEach((p, planetIndex) => {
        const sourceRef = { seed: data.seed, planetIndex, faction: data.faction };
        rec('planet', p.type, { batchId, sourceRef, colonyKind: p.colonyKind });
        if (p.inhabited && p.biomeName && p.civLevel) {
          rec('race', `${p.biomeName}:${p.civLevel}`, { batchId, sourceRef, biome: p.biomeName });
        } else if (p.ruined && p.biomeName) {
          const ruinType = p.robotic ? 'robotic' : p.destroyed ? 'destroyed' : p.obliterated ? 'obliterated' : 'plain';
          rec('ruin', `${p.biomeName}:${ruinType}`, { batchId, sourceRef, ruinType });
        }
      });
      if (data.kind === 'blackhole') {
        rec('phenomenon', `blackhole-${data.variant}`, { batchId, sourceRef: { phenomenonId: `blackhole-${data.variant}` } });
        if (data.variant === 'gargantua') rec('phenomenon', 'endurance', { batchId, sourceRef: { phenomenonId: 'endurance' } });
      }
      if (data.deathStar) rec('phenomenon', 'deathstar', { batchId, sourceRef: { phenomenonId: 'deathstar' } });
      if (data.dragonToMars) rec('phenomenon', 'dragon', { batchId, sourceRef: { phenomenonId: 'dragon' } });
      if ((data.planets || []).some((p) => p.ishimura)) {
        rec('phenomenon', 'ishimura', { batchId, sourceRef: { phenomenonId: 'ishimura' } });
      }
    }
    // stations: the 3 kinds, anchored to any faction present (createStation
    // rebuilds any kind in any faction style, so this stays viewable).
    const anchorFaction = Object.keys(factionSeed)[0] || 'alliance';
    const anchorSeed = factionSeed[anchorFaction] || (this.systems.list.find((s) => !s.special)?.data?.seed ?? null);
    for (const st of STATION_TYPES) {
      rec('station', st.id, { batchId, sourceRef: { seed: anchorSeed, faction: anchorFaction } });
    }
    // ships: every role of every faction the galaxy actually fields.
    for (const [faction, seed] of Object.entries(factionSeed)) {
      for (const role of ROLES) {
        rec('ship', `${faction}:${role.id}`, { batchId, sourceRef: { role: role.id, faction, seed } });
      }
    }
    codexFlush(); // single serialize + setItem for the whole reveal
  }

  /** «Перейти к объекту»: warp to a codex find in the live galaxy and focus it.
   *  Systems/planets/stations carry a seed; a phenomenon maps to its fixed
   *  special system. A no-op if the target can't be located (e.g. an old ship
   *  record with no seed, or a seed from a different galaxy). */
  async navigateToEntry(entry) {
    const ref = entry.sourceRef || {};
    let seed = ref.seed || null;
    if (entry.category === 'system') seed = ref.seed || entry.archetypeKey;
    else if (entry.category === 'phenomenon') seed = PHENOMENON_SYSTEM_SEED[entry.archetypeKey] || seed;
    if (!seed) return;
    const target = this.systems.list.find((s) => s.data && s.data.seed === seed);
    if (!target) return;

    if (this.mode === 'system') await this.exitSystem();
    if (this.mode !== 'galaxy') return; // a transition is mid-flight — bail rather than race it
    await this.enterSystem(target);
    if (this.mode !== 'system') return; // enter was interrupted

    if (entry.category === 'planet' || entry.category === 'race' || entry.category === 'ruin') {
      const p = this.systemView.planets[ref.planetIndex];
      if (p) this._focusPlanet(p);
    } else if (entry.category === 'ship') {
      const ships = this.systemView.ships || [];
      const ship = ships.find((sh) => sh.type && sh.type.id === ref.role) || ships[0];
      if (ship) this._focusHit('ship', ship);
    } else if (entry.category === 'station') {
      const host = (this.systemView.planets || []).find((p) => p.station);
      if (host) this._focusHit('structure', host);
    } else if (entry.category === 'phenomenon') {
      // map the phenomenon id to the SystemView field holding it (note the
      // Death Star's field is `deathStar`, capital S) — the _focusHit kind
      // string stays the lowercase id its branch matches on.
      const field = { ishimura: 'ishimura', deathstar: 'deathStar', dragon: 'dragon' }[entry.archetypeKey];
      const obj = field && this.systemView[field];
      if (obj) this._focusHit(entry.archetypeKey, obj);
    }
  }

  /** Focus a planet + show its card (shared by canvas clicks and label clicks). */
  /** One step back from a focused planet/ship to the system overview (#1): drop
   *  the focus, restore the system dossier + the diegetic labels + the trails. */
  _backToOverview() {
    this.systemView.unfocus(); // also clears _planetFocused → trails return (#4)
    if (this.systemView.data) this.infoPanel.show(this.systemView.data);
    this.planetLabels.setVisible(true);
  }

  _focusPlanet(planet) {
    this.systemView._planetFocused = true; // hide all planet trails for the close-up (#4)
    this._frameObject(planet.body, 'planet', planet.data.radius);
    const idx = this.systemView.planets.indexOf(planet);
    const name = planet.data.label || `${this.systemView.data.name} ${String.fromCharCode(98 + idx)}`;
    this.infoPanel.showPlanet(planet.data, name);
    this.planetLabels.setVisible(false);
    this._recordPlanetCodex(planet.data, idx);
  }

  /** Codex bookkeeping for a focused planet (#codex) — this HUD card is the
   *  first look at its inhabitants, so the planet's kind always counts, and an
   *  inhabited world additionally unlocks its living-race archetype (a ruined
   *  one its extinct-ruin archetype instead — never both). */
  _recordPlanetCodex(p, planetIndex) {
    const batchId = currentPartyId(this.config);
    // `faction` pins the fleet skin this find was ACTUALLY seen in: an
    // inhabited system's faction comes from the catalog's round-robin (an
    // index over inhabited systems, not derivable from the seed alone), so
    // the codex viewer can't reconstruct it — it must be carried along.
    const sourceRef = { seed: this.systemView.data.seed, planetIndex, faction: this.systemView._faction };
    this._codexRecord('planet', p.type, { batchId, sourceRef, colonyKind: p.colonyKind });
    if (p.inhabited && p.biomeName && p.civLevel) {
      this._codexRecord('race', `${p.biomeName}:${p.civLevel}`, { batchId, sourceRef, biome: p.biomeName });
    } else if (p.ruined && p.biomeName) {
      const ruinType = p.robotic ? 'robotic' : p.destroyed ? 'destroyed' : p.obliterated ? 'obliterated' : 'plain';
      this._codexRecord('ruin', `${p.biomeName}:${ruinType}`, { batchId, sourceRef, ruinType });
    }
  }

  /** Focus + open whatever was picked — a planet, ship or structure (#5/#6).
   *  Shared by canvas clicks and by clicks on the diegetic labels. */
  _focusHit(kind, ref) {
    if (kind !== 'planet') this.systemView._planetFocused = false; // non-planet focus → trails return (#4)
    const codexBatch = currentPartyId(this.config); // discovery context (#codex)
    if (kind === 'planet') {
      this._focusPlanet(ref);
    } else if (kind === 'ship') {
      // #6: ships zoom in + follow, framed by their true bounds (focusConfig).
      this._frameObject(ref.mesh, 'ship');
      this.infoPanel.showShip(ref.type, this.systemView._factionStyle, ref);
      this.planetLabels.setVisible(false);
      this._codexRecord('ship', `${this.systemView._faction}:${ref.type.id}`, {
        batchId: codexBatch,
        // seed pins the system this fleet type was seen in — lets «Перейти к
        // объекту» warp back to it (buildShip itself needs only role+faction).
        sourceRef: { role: ref.type.id, faction: this.systemView._faction, seed: this.systemView.data.seed },
      });
    } else if (kind === 'structure') {
      // #6: orbital structures zoom in + follow + their own info card.
      this._frameObject(ref.station, 'structure');
      this.infoPanel.showStructure(structureCard(ref), this.systemView._factionStyle);
      this.planetLabels.setVisible(false);
      this._codexRecord('station', ref.stationKind, {
        batchId: codexBatch,
        // `faction` for the same reason as _recordPlanetCodex: the round-robin
        // fleet skin isn't recoverable from the seed when rebuilding the find.
        sourceRef: { seed: this.systemView.data.seed, faction: this.systemView._faction },
      });
    } else if (kind === 'ishimura') {
      // #5: the planet-cracker — zoom in + its own card
      const ish = this.systemView.ishimura;
      this._frameObject(ish.group, 'ishimura');
      this.infoPanel.showStructure(
        {
          kindLabel: 'Корабль · добыча',
          name: 'USG Ishimura',
          desc: 'Корабль-трещинник, разламывающий планеты ради руды. Сейчас он завис над Эгидой VII — именно из недр этой планеты подняли Красный Обелиск, после чего колония и сошла с ума. (Dead Space)',
          meta: [
            ['Класс', 'planetcracker'],
            ['Длина', '~1,6 км'],
            ['Захваты', '52 гравитационных троса'],
            ['Команда', 'погибла — некроморфы'],
          ],
        },
        this.systemView._factionStyle,
      );
      this.planetLabels.setVisible(false);
      this._codexRecord('phenomenon', 'ishimura', { batchId: codexBatch, sourceRef: { phenomenonId: 'ishimura' } });
    } else if (kind === 'deathstar') {
      // #10: the battle station — zoom in + its own card
      const ds = this.systemView.deathStar;
      this._frameObject(ds.group, 'deathstar');
      this.infoPanel.showStructure(
        {
          kindLabel: 'Боевая станция · Империя',
          name: 'Звезда Смерти «Длань»',
          desc: 'Бронированная боевая станция размером с малую луну. По её броне тянется глубокий экваториальный ров, а на верхней полусфере зияет вогнутая чаша главного орудия: его зелёный суперлазер способен расколоть планету одним залпом — что и случилось с Альдерааном.',
          meta: [
            ['Тип', 'боевая станция'],
            ['Размер', 'с малую луну (~160 км)'],
            ['Орудие', 'суперлазер — раскалывает планеты'],
            ['Флот', 'клиновидные разрушители'],
          ],
        },
        this.systemView._factionStyle,
      );
      this.planetLabels.setVisible(false);
      this._codexRecord('phenomenon', 'deathstar', { batchId: codexBatch, sourceRef: { phenomenonId: 'deathstar' } });
    } else if (kind === 'dragon') {
      // #8: the Crew Dragon en route to Mars — zoom in + its own card
      const dr = this.systemView.dragon;
      this._frameObject(dr.group, 'dragon');
      this.infoPanel.showStructure(
        {
          kindLabel: 'Корабль · экспедиция',
          name: 'Crew Dragon',
          desc: 'Частный многоразовый корабль с экипажем на пути к Марсу. Капсула-«капля» с тепловым щитом сидит на разгонном модуле с солнечными крыльями; внутри — несколько человек и припасы на долгий перелёт.',
          meta: [
            ['Тип', 'пилотируемая капсула'],
            ['Экипаж', 'до 4 человек'],
            ['Курс', 'Земля → Марс'],
            ['Двигатели', 'SuperDraco + разгонный модуль'],
          ],
        },
        this.systemView._factionStyle,
      );
      this.planetLabels.setVisible(false);
      this._codexRecord('phenomenon', 'dragon', { batchId: codexBatch, sourceRef: { phenomenonId: 'dragon' } });
    }
  }

  _onClick(e) {
    // the click that interrupted the cinematic show is swallowed, not acted on
    if (this._suppressClick) {
      this._suppressClick = false;
      return;
    }
    if (this._cineActive()) {
      this.stopCinematic();
      return;
    }
    if (this.mode === 'galaxy') {
      this._updatePointer(e);
      const hit = this.systems.pick(this.raycaster);
      if (hit) this.enterSystem(hit);
      return;
    }
    if (this.mode === 'system') {
      // pick a planet (→ zoom + planet card, #6) or a ship (→ ship card, #7)
      this._pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this._pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this._pointer, this.systemView.camera);
      // precise hit first, then the generous screen-space zone (#9)
      const hit =
        this.systemView.pickObject(this.raycaster) ||
        this.systemView.pickNearestScreen(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
      if (!hit) return;
      this._focusHit(hit.kind, hit.ref);
    }
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.postfx.setSize(w, h);
    this.systemView.setSize(w, h);
  }

  // ---- system enter / exit (cinematic warp) ---------------------------------

  async enterSystem(entry) {
    if (this.mode !== 'galaxy') return;
    this.mode = 'transition';
    this._genBannerDismiss?.(); // don't let the migration pill sit over the warp fade
    this.systems.markVisited(entry); // chart it: persist + ink the marker its status colour
    this._updateProgress();
    // codex (#codex): log this system as discovered — hand-crafted specials
    // aren't part of "the current party's system count" (_updateProgress()'s
    // own denominator above), so they don't inflate the 'system' progress;
    // a black-hole encounter unlocks its own phenomenon archetype though.
    const codexBatch = currentPartyId(this.config);
    if (!entry.special) {
      this._codexRecord('system', entry.data.seed, {
        batchId: codexBatch,
        sourceRef: { seed: entry.data.seed },
        label: entry.data.name,
      });
    }
    if (entry.data && entry.data.kind === 'blackhole') {
      const phenomenonId = `blackhole-${entry.data.variant}`;
      this._codexRecord('phenomenon', phenomenonId, { batchId: codexBatch, sourceRef: { phenomenonId } });
      // Gargantua's scene includes the Endurance ring station in plain view on
      // arrival — it isn't independently pickable, so warping in IS the find.
      if (entry.data.variant === 'gargantua') {
        this._codexRecord('phenomenon', 'endurance', { batchId: codexBatch, sourceRef: { phenomenonId: 'endurance' } });
      }
    }
    this.controls.enabled = false; // lock galaxy input immediately
    this.tooltip.hide();
    this.legend.setVisible(false);
    this.canvas.style.cursor = 'default';
    // settings belong to the galaxy view only — hide the ⚙ + close the panel
    if (this._settingsBtn) this._settingsBtn.style.display = 'none';
    // the "Fleet & stations" link and the codex both live next to the ⚙ — all
    // galaxy-only, so hide them inside a system (the facts box owns that corner there).
    if (this._galleryLink) this._galleryLink.style.display = 'none';
    if (this._codexBtn) this._codexBtn.style.display = 'none';
    this.gui.hide();
    this._settingsOpen = false;
    if (this._settingsBtn) this._settingsBtn.classList.remove('on');
    if (this._viewModeBtn) this._viewModeBtn.classList.add('visible'); // view-mode cycle is system-only
    if (this._rotateBtn) this._rotateBtn.classList.remove('visible'); // map-rotate toggle is galaxy-only (#4)
    if (this._cineBtn) this._cineBtn.classList.remove('visible'); // cinematic toggle is galaxy-only (#5)
    this._hideHelp(); // «?» is galaxy-only — the system facts box owns the top-right corner

    // #9: fly the galaxy camera toward the marker, while the system is BUILT AND
    // COMPILED IN THE BACKGROUND during the approach — so by the time the flight
    // lands everything is ready and the swap is a quick dip, not a long one that
    // has to hide the load. Reversed on exit.
    this._preDolly = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
    const toPos = this.camera.position.clone().lerp(entry.worldPos, 0.72);

    // If the idle warmup is still compiling its sample scene, let it finish
    // first: load() below disposes that scene's materials, and compileAsync's
    // readiness poll throws (uncaught, in its own timer) on a disposed
    // material. Only ever waits inside the ~1.5s-after-boot race window.
    if (this._warmupCompile) await this._warmupCompile.catch(() => {});
    // build the system now (cheap), and compile its shaders in PARALLEL with the
    // flight (non-blocking via KHR_parallel_shader_compile) — no mid-warp hitch.
    this.systemView.load(entry.data);
    this.planetLabels.setSystem(this.systemView, entry.data);
    this.systemView.setSize(window.innerWidth, window.innerHeight);
    const compiled = this.renderer.compileAsync(this.systemView.scene, this.systemView.camera);

    if (this._cineActive()) {
      // cinematic: no warp flight — the show fades to/from black itself (#cine).
      // load() already placed the camera at the overview, so just reveal it.
      await compiled;
      this.postfx.setView(this.systemView.scene, this.systemView.camera);
      this.systemView.enter();
      this.infoPanel.show(entry.data);
      this.mode = 'system';
      return;
    }

    await this._galaxyDollyTo(toPos, entry.worldPos.clone(), 0.6);
    await compiled; // ensure shaders are ready before we reveal (usually already done)

    await this.overlay.fadeTo(0.72, 120); // short dip — nothing heavy left to do
    this.postfx.setView(this.systemView.scene, this.systemView.camera);
    this.systemView.beginEnterZoom(1.35); // system appears pulled-back and dollies in (cinematic)
    this.systemView.enter();
    this.infoPanel.show(entry.data);
    await this.overlay.fadeTo(0, 460); // reveal while the zoom continues to the overview
    this.mode = 'system'; // flip only now, so Esc can't race the reveal
  }

  async exitSystem() {
    if (this.mode !== 'system') return;
    this.mode = 'transition';
    this.infoPanel.hide();
    this.planetLabels.setVisible(false);
    if (this._reticle) this._reticle.classList.remove('visible');
    // drop the hover ring — its target object is about to be disposed (#9)
    this._hoverObj = null;
    if (this._hoverRing) this._hoverRing.classList.remove('visible');
    // reset the view-mode for the next dive + hide its button
    this._viewMode = 0;
    document.body.classList.remove('clean-view');
    if (this._viewModeBtn) {
      this._viewModeBtn.classList.remove('visible');
      this._viewModeBtn.textContent = this._viewModeIcons[0];
    }
    // back in galaxy → show the galaxy-only toggles, unless the cinematic show is
    // still running (it keeps them hidden as it hops between systems) (#4/#5)
    if (this._rotateBtn && !this._cineActive()) this._rotateBtn.classList.add('visible');
    if (this._cineBtn && !this._cineActive()) this._cineBtn.classList.add('visible');
    if (this._helpBtn && !this._cineActive()) this._helpBtn.classList.add('visible');
    this.systemView.baseShift = 0.12;

    if (this._cineActive()) {
      // cinematic: tear down with no exit-zoom / fade / galaxy flight (#cine)
      this.systemView.exit();
      this.postfx.setView(this.scene, this.camera);
      this.systemView.clear();
      this.planetLabels.clear();
      this.controls.enabled = false; // the show drives the camera
      this.mode = 'galaxy';
      return;
    }

    // #3: first zoom the system camera back OUT (reverse of the entry flight),
    // then a brief PARTIAL dip — not a hard black cut — so the exit reads as one
    // continuous pull-back rather than a jump.
    this.systemView.beginExitZoom(0.55);
    await this.overlay.fadeTo(0.82, 300);
    this.systemView.exit();
    this.postfx.setView(this.scene, this.camera);
    this.systemView.clear();
    this.planetLabels.clear();
    // reveal the galaxy while the camera pulls back out to where it was.
    const reveal = this.overlay.fadeTo(0, 620);
    if (this._preDolly) {
      await this._galaxyDollyTo(this._preDolly.pos, this._preDolly.target, 0.7);
      this._preDolly = null;
    }
    await reveal;
    this.controls.enabled = true;
    // rotate again on return to the galaxy, and restart the 30s idle timer (#23)
    this.controls.autoRotate = this.config.cameraAutoRotate;
    this._lastInteract = this._time;
    this.legend.setVisible(this.config.showMarkers);
    if (this._settingsBtn) this._settingsBtn.style.display = ''; // ⚙ back in the galaxy view
    if (this._galleryLink) this._galleryLink.style.display = ''; // gallery link back too
    if (this._codexBtn) this._codexBtn.style.display = ''; // codex button back too
    this.mode = 'galaxy'; // flip after reveal so a stray click can't double-fire
  }

  /** Animate the galaxy camera + target to (toPos,toTarget); resolves when done (#9). */
  _galaxyDollyTo(toPos, toTarget, dur) {
    return new Promise((resolve) => {
      this._galaxyDolly = {
        t: 0,
        dur,
        fromPos: this.camera.position.clone(),
        fromTarget: this.controls.target.clone(),
        toPos: toPos.clone(),
        toTarget: toTarget.clone(),
        resolve,
      };
    });
  }

  _stepGalaxyDolly(dt) {
    const d = this._galaxyDolly;
    d.t = Math.min(d.t + dt / d.dur, 1);
    const e = d.t * d.t * d.t * (d.t * (d.t * 6 - 15) + 10); // smootherstep — gentler accel/decel
    this.camera.position.lerpVectors(d.fromPos, d.toPos, e);
    this.controls.target.lerpVectors(d.fromTarget, d.toTarget, e);
    this.camera.lookAt(this.controls.target);
    if (d.t >= 1) {
      const r = d.resolve;
      this._galaxyDolly = null;
      if (r) r();
    }
  }

  // ---- mutations driven by the GUI -----------------------------------------

  /** Structural change: regenerate all geometry from the current config. */
  rebuild() {
    this.scene.remove(this.galaxy.points);
    this.scene.remove(this.suns.points);
    this.scene.remove(this.background.group);
    this.galaxy.dispose();
    this.suns.dispose();
    this.background.dispose();
    this._buildWorld();
    this.rebuildSystems();
    this.controls.autoRotate = this.config.cameraAutoRotate;
    // The idle-timer skybox load in _warmUpSystemShaders() only ever fires
    // once, but _buildWorld() just replaced Background with a textureless
    // instance — re-request the sky here. The AssetLoader dedupes by url, so
    // after the first fetch this resolves instantly from cache.
    this.background.loadSkybox().catch(() => {});
  }

  /** Regenerate the explorable systems (seed / count / fraction change). */
  rebuildSystems() {
    this._ensureWorldOverlayForCurrentParty(); // a seed change is a new party
    this.scene.remove(this.systems.group);
    this.systems.dispose();
    this._buildSystems();
    this._updateProgress();
  }

  /** Live change: push uniforms / renderer state without rebuilding geometry. */
  applyLive() {
    this.galaxy.applyLiveUniforms();
    this.suns.applyLiveUniforms();
    this.background.applyLiveUniforms();
    this.controls.autoRotate = this.config.cameraAutoRotate;
    this.renderer.setClearColor(new THREE.Color(getPalette(this.config.palette).background), 1);
    this.renderer.toneMappingExposure = this.config.exposure;
    this.systems.setVisible(this.config.showMarkers);
    this.legend.setVisible(this.config.showMarkers && this.mode !== 'system');
  }

  setQuality(quality) {
    applyQuality(this.config, quality);
    this.postfx.setSamples(this.config.antialias ? 4 : 0);
    this._syncPixelRatio();
    this._autoDowngraded = false;
    this.rebuild();
    this.applyLive();
  }

  // ---- render loop ----------------------------------------------------------

  _loop() {
    const rawDelta = this.clock.getDelta();
    if (!this._running) return;

    // clamp to avoid a time jump after a stall / hidden tab
    const dt = Math.min(rawDelta, 0.05);
    this._time += dt;

    if (this.mode === 'galaxy' || this.mode === 'transition') {
      const pr = this.renderer.getPixelRatio();
      // hard map-stop (#4) overrides everything, incl. the autoRotate reset that
      // exitSystem does — enforce it every frame so a lock truly holds.
      if (this._rotationLocked) this.controls.autoRotate = false;
      // the universe spins only while idle — interaction freezes it, just like
      // the camera auto-rotation (the rotation clock stops; twinkle stays alive).
      if (this.controls.autoRotate) this._galaxyRotTime += dt;
      this.galaxy.update(this._time, this._galaxyRotTime, pr);
      this.suns.update(this._time, this._galaxyRotTime, pr);
      // the nebula gas rides the same rotation clock as the stars — it freezes
      // on interaction with them (not the always-running _time) and stays glued.
      this.background.update(this._galaxyRotTime);
      // markers rotate on the freezable clock but pulse on the always-on one (#10)
      this.systems.update(this._galaxyRotTime, this._time, this.camera);
      if (this.mode === 'galaxy' && !this._cineActive()) this._processHover();
      if (this.mode === 'galaxy') this._applyKeyboard(dt); // arrows/WASD/±  (#2)
      if (this._galaxyDolly) {
        this._stepGalaxyDolly(dt); // #9: warp flight in/out — bypass controls
      } else {
        // resume auto-rotation after 7s of no camera interaction (#4), unless the
        // user has hard-stopped the map with the rotate toggle.
        if (
          this.config.cameraAutoRotate &&
          !this._rotationLocked &&
          !this.controls.autoRotate &&
          this._time - this._lastInteract > 7
        ) {
          this.controls.autoRotate = true;
        }
        this.controls.update();
      }
      this._syncRotateBtn(); // keep the play/pause glyph matching the spin state (#6)
    }
    if (this.mode === 'system' || this.mode === 'transition') {
      if (this.mode === 'system') this._applyKeyboard(dt); // orbit/zoom the system view (#2)
      this.systemView.update(dt, this._time);
      if (this.mode === 'system') {
        if (!this._cineActive()) this._processHoverSystem();
        // diegetic labels — hidden only during a transition (entry zoom or the
        // dolly-in of a focus). At a steady close-up we KEEP them and switch to
        // focus mode, so the focused planet's stations get clickable labels (#6).
        const sv = this.systemView;
        const transitioning = sv._zoom || (sv._focus && sv._focus.entering);
        // labels only in view-mode 0 (off in «clean scene» + «cinematic» + the show)
        const showLabels = this._viewMode === 0 && !transitioning && !this._cineActive();
        this.planetLabels.setVisible(showLabels);
        if (showLabels) {
          const cutoff = sv._focus ? sv.camera.position.distanceTo(sv.controls.target) * 2.6 : 0;
          this.planetLabels.update(sv.camera, window.innerWidth, window.innerHeight, cutoff, sv._focus ? sv._focus.obj : null);
        }
        this._updateReticle(sv, transitioning);
        this._updateHoverRing();
      }
    }

    // autoReset is off (see _initRenderer) — reset once, then postfx's two
    // internal renderer.render() calls both add into the same totals so the
    // numbers we read below cover the whole frame, not just the last pass.
    this.renderer.info.reset();
    this.postfx.render();
    this._trackPerf(rawDelta, this.renderer.info.render.calls, this.renderer.info.render.triangles);
  }

  _trackPerf(delta, drawCalls, triangles) {
    if (delta > 0) {
      const fps = 1 / delta;
      this._fpsEma = this._fpsEma * 0.9 + fps * 0.1;
      this.stats.fps = Math.round(this._fpsEma);
    }
    // Cheap passthrough — renderer.info already did the counting, so this is
    // just two property writes, not a new measurement (perf invariant: the
    // CPU updates ~one number per frame here, no allocations/iteration).
    this.stats.drawCalls = drawCalls;
    this.stats.triangles = triangles;
    // One-shot graceful auto-downgrade if the machine clearly can't keep up.
    if (!this._autoDowngraded && this._fpsEma < 38) {
      if (++this._lowPerfFrames > 40) {
        this._autoDowngrade();
      }
    } else {
      this._lowPerfFrames = 0;
    }
  }

  _autoDowngrade() {
    this._autoDowngraded = true;
    this.config.maxPixelRatio = 1.0;
    this._syncPixelRatio();
    // eslint-disable-next-line no-console
    console.info('[galaxy] low FPS detected — pixel ratio capped to 1.0 for smoother motion.');
  }

  // ---- perf reporting (on-demand, not per-frame) -----------------------------

  /** Cold-load time + shipped-bundle weight via Navigation/Resource Timing.
   *  Both are fixed for the life of the page (nothing re-navigates or re-fetches
   *  the bundle), so this runs once and the result is cached on first call. */
  _measureColdLoad() {
    let coldLoadMs = 0;
    let bundleKB = 0;
    let valid = false;
    try {
      const [nav] = performance.getEntriesByType('navigation');
      // loadEventEnd stays 0 until the load event actually finishes — a
      // snapshot taken before that would freeze coldLoadMs=0 (and a partial
      // resource list) forever, so the measurement only counts as cacheable
      // once the page has genuinely finished loading.
      valid = !!nav && nav.loadEventEnd > 0;
      if (nav) coldLoadMs = Math.round(nav.loadEventEnd - nav.startTime);
      let bytes = 0;
      for (const r of performance.getEntriesByType('resource')) {
        if (r.initiatorType === 'script' || r.initiatorType === 'link' || /\.(js|css)(\?|$)/.test(r.name)) {
          bytes += r.transferSize || r.encodedBodySize || 0;
        }
      }
      bundleKB = Math.round(bytes / 1024);
    } catch {
      // Navigation/Resource Timing unavailable — leave the zeros, don't throw.
    }
    return { coldLoadMs, bundleKB, valid };
  }

  /** On-demand perf report for the dev panel / scripts/perf_bench.py — deliberately
   *  NOT called per frame (unlike _trackPerf, this walks Performance API entries
   *  and is fine to be a little more expensive). Checks the current numbers
   *  against PERF_BUDGETS[profile] via checkBudget(). */
  getPerfSnapshot(profile = this.config.quality) {
    // Cache the cold-load measurement only once it's valid (page load event
    // finished) — an early console/script call gets a fresh best-effort read
    // without freezing zeros into every later snapshot.
    const cold = this._coldLoad ?? this._measureColdLoad();
    if (cold.valid) this._coldLoad = cold;
    const appliedProfile = resolveBudgetProfile(profile);
    const metrics = {
      // Context for checkBudget, not a judged metric: picks the galaxy- vs
      // system-view draw-call/triangle ceilings ('transition' frames render
      // both worlds — judge those leniently as galaxy).
      view: this.mode === 'system' ? 'system' : 'galaxy',
      fps: this.stats.fps,
      drawCalls: this.stats.drawCalls,
      triangles: this.stats.triangles,
      // Skyboxes load lazily off the idle timer in _warmUpSystemShaders, so
      // this can legitimately read 0 right after boot and pick up the real
      // total once those fetches land.
      systemAssetMB: (this.assetLoader?.bytesLoadedTotal?.() ?? 0) / (1024 * 1024),
      // Nothing loads under the 'hero' tag, so this reads 0 (which the
      // low-profile budget of 0 MB happens to already satisfy).
      heroTextureMB: (this.assetLoader?.bytesLoaded?.('hero') ?? 0) / (1024 * 1024),
      // Omitted (undefined) until the load event has finished, so checkBudget
      // skips them instead of judging a half-measured page.
      coldLoadMs: cold.valid ? cold.coldLoadMs : undefined,
      bundleKB: cold.valid ? cold.bundleKB : undefined,
    };
    const budget = PERF_BUDGETS[appliedProfile];
    const { ok, violations } = checkBudget(appliedProfile, metrics);
    return { profile: appliedProfile, metrics, budget, violations, ok };
  }

  /** Dev helper for the perf bench: jump straight
   *  into the first catalog entry matching `predicate(entry)`, bypassing marker
   *  picking entirely — lets a script warp to e.g. the Death Star or a black
   *  hole by id without hunting for it on screen. Returns the target's stable
   *  id (`entry.data.seed`) so a caller can log what it landed on, or null if
   *  nothing matched. Not wired into any in-game UI. */
  debugJumpTo(predicate) {
    // enterSystem() silently no-ops outside galaxy mode (mid-transition, or
    // already inside a system) — returning the seed anyway would tell the
    // caller "jumped" when nothing happened, so report the refusal instead.
    if (this.mode !== 'galaxy') return null;
    const entry = this.systems.list.find(predicate);
    if (!entry) return null;
    this.enterSystem(entry);
    return entry.data.seed || null;
  }
}

const canvas = document.getElementById('scene');
// Expose for debugging / console tweaking.
window.galaxyApp = new GalaxyApp(canvas);

// The scene builds synchronously, so the loader can fade out immediately.
const loader = document.getElementById('loader');
if (loader) {
  loader.classList.add('hide');
  setTimeout(() => loader.remove(), 700);
}
