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
    this._viewMode = 0;
    this._viewModeIcons = ['❏', '○', '▣']; // подписи / чистая сцена / кино (monochrome glyphs)
    if (!btn) return;
    btn.addEventListener('click', () => {
      this._viewMode = (this._viewMode + 1) % 3;
      this._applyViewMode();
    });
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
    const edge = c.clone().addScaledVector(right, f.radius || 1).project(cam);
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
    const hit = this.systemView.pickObject(this.raycaster);
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
    } else if (hit && hit.kind === 'ship') {
      this.tooltip.showSimple(hit.ref.type.name, 'нажмите для информации →', e.x, e.y);
      this.canvas.style.cursor = 'pointer';
    } else {
      this.tooltip.hide();
      this.canvas.style.cursor = 'grab';
    }
  }

  _updateProgress() {
    // count only real systems (the legend doesn't list the special black holes)
    const list = this.systems.list.filter((s) => !s.special);
    const n = list.filter((s) => s.visited).length;
    this.legend.setProgress(n, list.length);
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
      // #6: ships zoom in + follow, just like planets, plus the ship card.
      this.systemView.focusObject(ref.mesh, Math.max(0.5, ref.baseScale * 1.6));
      this.infoPanel.showShip(ref.type, this.systemView._factionStyle, ref);
      this.planetLabels.setVisible(false);
    } else if (kind === 'structure') {
      // #6: orbital structures zoom in + follow + their own info card.
      const r = (ref.stationScale || ref.data.radius * 0.25) * 2.4;
      this.systemView.focusObject(ref.station, Math.max(0.4, r));
      this.infoPanel.showStructure(structureCard(ref), this.systemView._factionStyle);
      this.planetLabels.setVisible(false);
    } else if (kind === 'ishimura') {
      // #5: the planet-cracker — zoom in + its own card
      const ish = this.systemView.ishimura;
      this.systemView.focusObject(ish.group, 3);
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
      this.systemView.focusObject(ds.group, ds.R || 5);
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
    }
  }

  _onClick(e) {
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
      const hit = this.systemView.pickObject(this.raycaster);
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
    // reset the view-mode for the next dive + hide its button
    this._viewMode = 0;
    document.body.classList.remove('clean-view');
    if (this._viewModeBtn) {
      this._viewModeBtn.classList.remove('visible');
      this._viewModeBtn.textContent = this._viewModeIcons[0];
    }
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
      // the universe spins only while idle — interaction freezes it, just like
      // the camera auto-rotation (the rotation clock stops; twinkle stays alive).
      if (this.controls.autoRotate) this._galaxyRotTime += dt;
      this.galaxy.update(this._time, this._galaxyRotTime, pr);
      this.suns.update(this._time, this._galaxyRotTime, pr);
      // the nebula gas rides the same rotation clock as the stars — it freezes
      // on interaction with them (not the always-running _time) and stays glued.
      this.background.update(this._galaxyRotTime);
      this.systems.update(this._galaxyRotTime, this.camera);
      if (this.mode === 'galaxy') this._processHover();
      if (this._galaxyDolly) {
        this._stepGalaxyDolly(dt); // #9: warp flight in/out — bypass controls
      } else {
        // resume auto-rotation after 30s of no camera interaction (#23)
        if (
          this.config.cameraAutoRotate &&
          !this.controls.autoRotate &&
          this._time - this._lastInteract > 30
        ) {
          this.controls.autoRotate = true;
        }
        this.controls.update();
      }
    }
    if (this.mode === 'system' || this.mode === 'transition') {
      this.systemView.update(dt, this._time);
      if (this.mode === 'system') {
        this._processHoverSystem();
        // diegetic labels — hidden only during a transition (entry zoom or the
        // dolly-in of a focus). At a steady close-up we KEEP them and switch to
        // focus mode, so the focused planet's stations get clickable labels (#6).
        const sv = this.systemView;
        const transitioning = sv._zoom || (sv._focus && sv._focus.entering);
        // labels only in view-mode 0 (off in «clean scene» + «cinematic»)
        const showLabels = this._viewMode === 0 && !transitioning;
        this.planetLabels.setVisible(showLabels);
        if (showLabels) {
          const cutoff = sv._focus ? sv.camera.position.distanceTo(sv.controls.target) * 2.6 : 0;
          this.planetLabels.update(sv.camera, window.innerWidth, window.innerHeight, cutoff, sv._focus ? sv._focus.obj : null);
        }
        this._updateReticle(sv, transitioning);
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
