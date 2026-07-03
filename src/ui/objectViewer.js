// Isolated-canvas "codex" object viewer: a full-screen overlay with its OWN
// renderer/scene/camera/OrbitControls, entirely separate from the main app's
// renderer and the in-system SystemView — a standalone find inspector packaged
// as a reusable class. Renders ONLY while open, at its own requestAnimationFrame
// loop — main.js pauses ITS OWN loop for the duration via the onOpen/onClose
// callbacks below, so the two loops never compete for the frame budget.
//
// Lazy + fully torn down: the renderer/DOM/controls are built from scratch on
// EVERY open() and fully disposed on EVERY close() (not just the first/last),
// so an idle codex inspection never leaves an extra WebGL context or GPU
// allocation lying around between uses — this app targets weak PCs.
//
// Why close() delegates scene disposal to `build`'s own handle instead of a
// blind scene.traverse(): codexViewer.js rebuilds "finds" straight from the
// SAME existing generators/classes the live game uses (buildShip,
// createStation, Planet, BlackHole, DeathStar, Ishimura, Endurance, Dragon…).
// Several of those deliberately cache geometries/materials/textures at MODULE
// scope and share them across every instance the whole app ever creates (e.g.
// ships/style.js's per-faction material cache, deathStar.js's baked hull
// texture). A generic "scene.traverse(o => o.geometry.dispose())" here would
// reach into those shared caches too and free GPU resources still in use
// elsewhere (the paused system view, another faction's ship…). So scene-
// content disposal is delegated entirely to whatever `build(scene)` returns
// as its `dispose()` handle — every existing class already ships its own
// correctly-scoped .dispose() (Planet/BlackHole/DeathStar/Ishimura free
// exactly their per-instance resources and leave shared caches alone;
// Endurance/Dragon are no-ops since everything they use IS shared), and
// codexViewer.js does the analogous thing for the baked ship/station groups
// it builds directly (see its disposeBaked()). This viewer's OWN renderer,
// OrbitControls and DOM/listeners belong to nobody else and get a full,
// unconditional teardown below.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ObjectViewer {
  /**
   * @param {object} [opts]
   * @param {() => void} [opts.onOpen] called once the overlay is up and its
   *   render loop has started — main.js uses this to pause its own loop.
   * @param {() => void} [opts.onClose] called once the overlay is fully torn
   *   down — main.js uses this to resume its own loop. Never fires for a
   *   close() on an already-closed viewer (idempotent).
   */
  constructor({ onOpen, onClose } = {}) {
    this._onOpen = onOpen || null;
    this._onClose = onClose || null;
    this._open = false;
    this._raf = null;
    this._handle = null; // the {dispose, update} build(scene) returned
    this._scene = null;
    this._renderer = null;
    this._camera = null;
    this._controls = null;
    this._overlay = null;
    this._onResize = null;
    this._last = 0;
  }

  /**
   * Open the viewer on a freshly-built find. `build(scene)` must add whatever
   * it wants shown to `scene` and may return `{dispose, update, focus}` —
   * `update(dt)` runs once per rendered frame while the viewer stays open;
   * `dispose()` frees anything `build` allocated (see the file header for why
   * this viewer itself doesn't also blindly dispose the scene). Camera
   * framing is automatic: a bounding-box fit over everything `build` added —
   * or, when the handle names a `focus` object,
   * over just that object (a planet's helper geometry — an orbit-scale motion
   * trail — would otherwise dwarf the body itself in the fit).
   *
   * @param {(scene: THREE.Scene) =>
   *   ({dispose?: Function, update?: Function, focus?: THREE.Object3D}|void)} build
   * @param {object} [opts]
   * @param {string} [opts.background] scene background colour (CSS colour
   *   string); defaults to the same near-black the system view uses.
   */
  open(build, opts = {}) {
    if (this._open) this.close(); // swap cleanly if something was already up
    this._build();

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(opts.background || '#03030a');
    try {
      this._handle = build(this._scene) || null;
      this._frame();
    } catch (e) {
      // A failed build must never strand the overlay on screen (it only
      // becomes visible via the .open class below) or leak the renderer/
      // controls/listeners just created — tear it all back down and stay
      // closed. onOpen never fired, so there's no pause to undo either.
      if (this._handle && this._handle.dispose) this._handle.dispose();
      this._handle = null;
      this._teardown();
      console.error('ObjectViewer: build() failed, viewer not opened', e);
      return;
    }

    this._overlay.classList.add('open');
    this._open = true;
    this._last = performance.now();
    this._raf = requestAnimationFrame((t) => this._loop(t));
    if (this._onOpen) this._onOpen();
  }

  /** Build the DOM overlay + renderer/camera/controls from scratch (called by
   *  every open(), since close() tears all of this back down again). */
  _build() {
    const overlay = document.createElement('div');
    overlay.className = 'codex-viewer';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'codex-viewer-close';
    closeBtn.textContent = 'Закрыть';
    closeBtn.addEventListener('click', () => this.close());
    overlay.appendChild(closeBtn);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setSize(window.innerWidth, window.innerHeight);
    overlay.appendChild(renderer.domElement);
    document.body.appendChild(overlay);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.05, 4000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    this._overlay = overlay;
    this._renderer = renderer;
    this._camera = camera;
    this._controls = controls;
    this._onResize = onResize;
  }

  /** Frame the camera: a bounding-box fit over the handle's `focus` object when
   *  one was named, else over everything build() added — works whether the find
   *  is a small baked ship or a planet sitting far from the origin on its orbit. */
  _frame() {
    // Nothing has rendered yet, so every world matrix is still stale —
    // without this the box lands wherever the LAST frame's matrices point
    // (identity, for a fresh scene) instead of on the object.
    this._scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject((this._handle && this._handle.focus) || this._scene);
    const size = new THREE.Vector3();
    const target = new THREE.Vector3();
    if (box.isEmpty()) {
      size.set(1, 1, 1);
    } else {
      box.getSize(size);
      box.getCenter(target);
    }
    const dist = Math.max(size.x, size.y, size.z, 0.5) * 1.7 + 1.5;
    this._camera.position.set(target.x + dist * 0.34, target.y + dist * 0.24, target.z + dist * 0.9);
    this._camera.lookAt(target);
    this._controls.target.copy(target);
    this._controls.minDistance = Math.max(0.08, dist * 0.1);
    this._controls.maxDistance = dist * 6 + 40;
    this._controls.update();
  }

  _loop(now) {
    if (!this._open) return; // a stray rAF landing right after close() is a no-op
    const dt = Math.min((now - this._last) / 1000, 0.05);
    this._last = now;
    if (this._handle && this._handle.update) this._handle.update(dt);
    this._controls.update();
    this._renderer.render(this._scene, this._camera);
    this._raf = requestAnimationFrame((t) => this._loop(t));
  }

  /** Tear the whole viewer back down: stop the loop, let `build`'s own handle
   *  free whatever it created, then fully dispose the renderer + controls +
   *  DOM + listeners this instance owns outright. Idempotent — calling
   *  close() with nothing open is a no-op and does not fire onClose. */
  close() {
    if (!this._open) return;
    this._open = false;
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    if (this._handle && this._handle.dispose) this._handle.dispose();
    this._handle = null;
    this._teardown();
    if (this._onClose) this._onClose();
  }

  /** Free everything _build() created (shared by close() and open()'s error
   *  path, which must clean up while `_open` is still false). */
  _teardown() {
    this._scene = null; // see the file header for why not a blind traversal here
    if (this._controls) {
      this._controls.dispose();
      this._controls = null;
    }
    if (this._renderer) {
      this._renderer.dispose();
      // dispose() alone frees GPU objects but keeps the WebGL CONTEXT alive
      // until the canvas is garbage-collected; browsers cap live contexts and
      // evict the OLDEST when the cap is hit — which would be the main galaxy
      // canvas. Force-losing the context here releases it deterministically.
      this._renderer.forceContextLoss();
      this._renderer = null;
    }
    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
      this._onResize = null;
    }
    if (this._overlay && this._overlay.parentNode) this._overlay.parentNode.removeChild(this._overlay);
    this._overlay = null;
    this._camera = null;
  }
}
