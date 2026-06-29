// Application orchestrator: renderer, camera + controls, the galaxy layers,
// post-processing and the render loop. Designed to stay light on the CPU —
// per frame it only advances one time value and lets the GPU do the rest.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createDefaultConfig, applyQuality } from './config.js';
import { getPalette } from './palettes.js';
import { Galaxy } from './galaxy.js';
import { Suns } from './suns.js';
import { Background } from './background.js';
import { PostFX } from './postfx.js';
import { buildGUI } from './gui.js';
import { Systems } from './systems/markers.js';
import { SystemView } from './systems/systemView.js';
import { InfoPanel, Tooltip, Overlay, Legend, structureCard } from './ui/hud.js';
import { PlanetLabels } from './ui/planetLabels.js';
import { AmbientMusic } from './audio/ambient.js';

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

class GalaxyApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.config = createDefaultConfig('medium');
    this.stats = { fps: 0 };

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

    this._initRenderer();
    this._initScene();
    this._initControls();
    this._buildWorld();
    this.postfx = new PostFX(this.renderer, this.scene, this.camera, this.config.antialias ? 4 : 0);
    this._buildSystems();
    this.systemView = new SystemView(this.renderer);
    this._initHud();
    this._syncPixelRatio();

    this.clock = new THREE.Clock();

    this._bindEvents();
    this.gui = buildGUI(this);
    this.gui.hide(); // minimal galaxy view — the generator panel opens via the ⚙ button
    this._initSettingsToggle();
    this._initViewMode();
    this._initRotateToggle();
    this._initCinematic();

    this._loop = this._loop.bind(this);
    this.renderer.setAnimationLoop(this._loop);

    this._warmUpSystemShaders(); // pre-compile system shaders so the first dive is instant
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
    this._viewModeIcons = ['❏', '○', '▣']; // подписи / чистая сцена / кино (monochrome glyphs)
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

  /** Wire the «▶ Кинопоказ» cinematic auto-tour (#5): a hands-off camera show that
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

    // any interaction (except the toggle itself) ends the show
    document.addEventListener('pointerdown', (e) => {
      if (this._cineActive() && e.target !== this._cineBtn) this.stopCinematic();
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
    this.runCinematic();
  }

  stopCinematic() {
    if (!this._cine) return;
    this._cine.active = false;
    this._suppressClick = true; // swallow the interrupting click
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
    // restore the galaxy chrome that the tour kept hidden
    if (this.mode === 'galaxy') {
      if (this._rotateBtn) this._rotateBtn.classList.add('visible');
      if (this._cineBtn) this._cineBtn.classList.add('visible');
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
    push(byName('Солнечная система')); // Земля + Crew Dragon
    push(byName('Чёрный Карантин')); // Ишимура крушит планету
    push(byName('Гаргантюа')); // чёрная дыра + станция «Эндюранс»
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
    if (sv.dragon) acts.push(() => this._focusHit('dragon', sv.dragon)); // транспорт
    if (sv.ishimura) acts.push(() => this._focusHit('ishimura', sv.ishimura)); // событие
    if (sv.deathStar) acts.push(() => this._focusHit('deathstar', sv.deathStar)); // событие
    if (sv.endurance) acts.push(() => this._cineFocusEndurance(sv)); // транспорт у чёрной дыры
    const flag = (sv.ships || []).find((s) => s.type && s.type.cat === 'flagship');
    if (flag) acts.push(() => this._focusHit('ship', flag)); // флагман флота
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

  /** Cinematic focus on the «Эндюранс» ring station (it isn't a normal pickable). */
  _cineFocusEndurance(sv) {
    if (!sv.endurance) return;
    const r = this._objectRadius(sv.endurance.group);
    sv.focusObject(sv.endurance.group, r, r * 0.82);
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
      null, // not a faction build — keep the «Орбитальная постройка» subtitle
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
      while (this._cineActive()) {
        const entry = stops[i % stops.length];
        i++;
        document.body.classList.add('cine-show'); // hide chrome, keep panel + reticle
        await this.enterSystem(entry);
        if (!this._cineActive()) break;
        document.body.classList.add('cine-show'); // re-assert after the warp
        this.systemView.controls.autoRotate = true;
        this.systemView.controls.autoRotateSpeed = 0.42; // slow, even drift = the "проводка"
        // dwell at the overview first — long enough to read WHAT this system is
        // (its left-panel dossier) before diving to a highlight (#cine readability)
        await this._cineWait(6500);
        if (!this._cineActive()) break;
        for (const act of this._cineHighlights(this.systemView).slice(0, 3)) {
          if (!this._cineActive()) break;
          act();
          await this._cineWait(11000); // ~11s per highlight — time to read the card
        }
        if (!this._cineActive()) break;
        await this.exitSystem();
        if (!this._cineActive()) break;
        await this._cineWait(1500);
      }
    } catch (e) {
      // a failed transition just ends the show gracefully
    }
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
    const edge = c.clone().addScaledVector(right, f.reticleRadius || f.radius || 1).project(cam);
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
      if (this._warmed || this.mode !== 'galaxy') return;
      const sample = this.systems.list.find(
        (s) => s.data && s.data.kind === 'star' && (s.data.planets || []).length >= 2,
      );
      if (!sample) return;
      try {
        this.systemView.load(sample.data);
        await this.renderer.compileAsync(this.systemView.scene, this.systemView.camera);
        if (this.mode === 'galaxy') this.systemView.clear(); // don't nuke a system dived into meanwhile
        this._warmed = true;
      } catch {
        // a failed warmup just means the first real dive compiles normally
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
    this.background = new Background(this.config);
    // clamp shader point sizes to the device's hardware ceiling
    const cap = Math.min(this.maxPointSize, 1024);
    this.galaxy.material.uniforms.uMaxPointSize.value = cap;
    this.suns.material.uniforms.uMaxPointSize.value = cap;
    this.scene.add(this.background.group);
    this.scene.add(this.galaxy.points);
    this.scene.add(this.suns.points);
  }

  _buildSystems() {
    this.systems = new Systems(this.config);
    this.systems.setVisible(this.config.showMarkers);
    this.scene.add(this.systems.group);
  }

  _initHud() {
    this.overlay = new Overlay();
    this.tooltip = new Tooltip();
    this.infoPanel = new InfoPanel({
      onBack: () => this.exitSystem(),
      // from a planet/ship card → back to the system overview (#6/#7)
      onBackToSystem: () => {
        this.systemView.unfocus();
        if (this.systemView.data) this.infoPanel.show(this.systemView.data);
      },
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
      // Pause the loop when the tab is hidden — saves battery/CPU.
      this._running = !document.hidden;
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
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mode === 'system') this.exitSystem();
    });
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

  /** Chart every system at once (#13) — fog-of-war off; refreshes the counter. */
  revealAllSystems() {
    this.systems.markAllVisited();
    this._updateProgress();
  }

  /** Focus a planet + show its card (shared by canvas clicks and label clicks). */
  _focusPlanet(planet) {
    this.systemView.focusPlanet(planet);
    const idx = this.systemView.planets.indexOf(planet);
    const name = planet.data.label || `${this.systemView.data.name} ${String.fromCharCode(98 + idx)}`;
    this.infoPanel.showPlanet(planet.data, name);
    this.planetLabels.setVisible(false);
  }

  /** Focus + open whatever was picked — a planet, ship or structure (#5/#6).
   *  Shared by canvas clicks and by clicks on the diegetic labels. */
  _focusHit(kind, ref) {
    if (kind === 'planet') {
      this._focusPlanet(ref);
    } else if (kind === 'ship') {
      // #6: ships zoom in + follow, just like planets, plus the ship card. Frame
      // by the ship's TRUE bounds so the camera gets close and the visor hugs the
      // hull (small ships were framed too far, flagships got a huge visor).
      {
        const r = this._objectRadius(ref.mesh);
        this.systemView.focusObject(ref.mesh, r, r * 0.72);
      }
      this.infoPanel.showShip(ref.type, this.systemView._factionStyle, ref);
      this.planetLabels.setVisible(false);
    } else if (kind === 'structure') {
      // #6: orbital structures zoom in + follow + their own info card.
      const r = this._objectRadius(ref.station);
      this.systemView.focusObject(ref.station, r, r * 0.78);
      this.infoPanel.showStructure(structureCard(ref), this.systemView._factionStyle);
      this.planetLabels.setVisible(false);
    } else if (kind === 'ishimura') {
      // #5: the planet-cracker — zoom in + its own card
      const ish = this.systemView.ishimura;
      const ishR = this._objectRadius(ish.group); // frame by its true size (#19)
      this.systemView.focusObject(ish.group, ishR, ishR * 0.72);
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
    } else if (kind === 'deathstar') {
      // #10: the battle station — zoom in + its own card
      const ds = this.systemView.deathStar;
      {
        const r = this._objectRadius(ds.group);
        this.systemView.focusObject(ds.group, r, r * 0.8);
      }
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
    } else if (kind === 'dragon') {
      // #8: the Crew Dragon en route to Mars — zoom in + its own card
      const dr = this.systemView.dragon;
      {
        const r = this._objectRadius(dr.group);
        this.systemView.focusObject(dr.group, r, r * 0.72);
      }
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
    this.systems.markVisited(entry); // chart it: persist + ink the marker its status colour
    this._updateProgress();
    this.controls.enabled = false; // lock galaxy input immediately
    this.tooltip.hide();
    this.legend.setVisible(false);
    this.canvas.style.cursor = 'default';
    // settings belong to the galaxy view only — hide the ⚙ + close the panel
    if (this._settingsBtn) this._settingsBtn.style.display = 'none';
    // the «Флот и станции» link lives next to the ⚙ — both are galaxy-only, so
    // hide it inside a system (the facts box owns the top-right corner there).
    if (this._galleryLink) this._galleryLink.style.display = 'none';
    this.gui.hide();
    this._settingsOpen = false;
    if (this._settingsBtn) this._settingsBtn.classList.remove('on');
    if (this._viewModeBtn) this._viewModeBtn.classList.add('visible'); // view-mode cycle is system-only
    if (this._rotateBtn) this._rotateBtn.classList.remove('visible'); // map-rotate toggle is galaxy-only (#4)
    if (this._cineBtn) this._cineBtn.classList.remove('visible'); // cinematic toggle is galaxy-only (#5)

    // #9: fly the galaxy camera toward the marker, while the system is BUILT AND
    // COMPILED IN THE BACKGROUND during the approach — so by the time the flight
    // lands everything is ready and the swap is a quick dip, not a long one that
    // has to hide the load. Reversed on exit.
    this._preDolly = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
    const toPos = this.camera.position.clone().lerp(entry.worldPos, 0.72);

    // build the system now (cheap), and compile its shaders in PARALLEL with the
    // flight (non-blocking via KHR_parallel_shader_compile) — no mid-warp hitch.
    this.systemView.load(entry.data);
    this.planetLabels.setSystem(this.systemView, entry.data);
    this.systemView.setSize(window.innerWidth, window.innerHeight);
    const compiled = this.renderer.compileAsync(this.systemView.scene, this.systemView.camera);

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
    this.systemView.baseShift = 0.12;

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
  }

  /** Regenerate the explorable systems (seed / count / fraction change). */
  rebuildSystems() {
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

    this.postfx.render();
    this._trackPerf(rawDelta);
  }

  _trackPerf(delta) {
    if (delta > 0) {
      const fps = 1 / delta;
      this._fpsEma = this._fpsEma * 0.9 + fps * 0.1;
      this.stats.fps = Math.round(this._fpsEma);
    }
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
