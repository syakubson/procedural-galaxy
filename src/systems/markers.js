// Real, explorable systems inside the galaxy.
//
// A seeded subset of points on the spiral arms become "systems". Each gets a
// glowing marker sprite (tinted by status) that the user can hover (name
// tooltip) and click (warp in). Markers rotate on the CPU using the SAME
// differential-rotation formula as the suns shader, and fade with view distance
// so they read as embedded in the disk rather than as a flat HUD.

import * as THREE from 'three';
import { createRng } from '../rng.js';
import { buildSystemCatalog } from './systemCatalog.js';

const TAU = Math.PI * 2;

// vivid status palette — bright enough to read against the busy disk; the
// charted markers also carry a dark outline, so they pop on any background.
const STATUS_COLOR = {
  inhabited: '#5fe0a0', // jade — alive
  ruins: '#f0a24e', // amber — dead
  wild: '#74c4f2', // sky-blue — untouched
};

// magenta — hand-crafted easter-egg systems (#13/#19/#20), marked distinctly
const SPECIAL_COLOR = '#d98ae8';

// uncharted marker tint — warm ivory, matching the cartographer chrome (the
// hollow «survey ring»); inks into a solid charted disc on discovery.
const UNCHARTED_COLOR = '#e7dcbe';

// hover accent — bright brass, the UI's interaction colour. A hovered marker
// grows and tints toward this so the pointer target is unmistakable (#1).
const HOVER_COLOR = '#e7c074';

const _v = new THREE.Vector3();
const _hoverCol = new THREE.Color(HOVER_COLOR);
const _col = new THREE.Color();

export class Systems {
  /** `overlay` is the party's WorldOverlay (src/state/overlay.js) — the sole
   *  source of "is this system visited" now that markers.js no longer reads
   *  or writes localStorage itself. */
  constructor(config, { overlay } = {}) {
    this.config = config;
    this._overlay = overlay || null;
    this.group = new THREE.Group();
    this.sprites = [];
    this.list = [];
    this._hovered = null; // the marker currently under the pointer (#1)
    this._build();
  }

  /** Whether `systemId` has been charted, per the party's overlay. Falls back
   *  to "not visited" if this instance was built without one (defensive only —
   *  every real call site passes one). */
  _isVisited(systemId) {
    const p = this._overlay && this._overlay.get(systemId);
    return !!(p && p.visited);
  }

  _build() {
    const c = this.config;
    const rng = createRng(c.seed + '::systems');
    const radius = c.radius;
    const ringTex = getRingTexture(); // uncharted: hollow survey ring
    const discTex = getDiscTexture(); // charted: filled status disc (tinted)

    // keep markers from piling on top of each other so every system is easy to
    // click (#12/#3) and never visually overlap, and clear of the central black
    // hole (#21). Specials reuse this list so they respect the same gap.
    const placed = [];
    const minSep = radius * 0.12; // wider gap so systems never crowd on screen (#3)
    this._placed = placed;
    this._minSep = minSep;

    // Data comes from the shared catalog (no THREE/DOM in there); this loop
    // only handles placement + visuals. The catalog's procedural systems come
    // first, followed by the hand-crafted specials, in the same fixed order
    // the inline generation used to run in — see systemCatalog.js.
    const catalog = buildSystemCatalog(c);
    const firstSpecial = catalog.findIndex((e) => e.kind === 'special');
    const regular = firstSpecial === -1 ? catalog : catalog.slice(0, firstSpecial);
    const specials = firstSpecial === -1 ? [] : catalog.slice(firstSpecial);

    for (let i = 0; i < regular.length; i++) {
      let base;
      let tries = 0;
      do {
        // place tight on an arm so the marker sits on visible disk brightness,
        // with an inner clear zone around the galactic centre (#21)
        const r = rng.range(0.30, 0.86) * radius;
        const arm = rng.int(0, c.arms - 1);
        const branch = (arm / c.arms) * TAU;
        const spin = (r / radius) * c.spin;
        const angle = branch + spin + rng.gauss() * c.armWidth * 0.35;
        // off-arm jitter that does NOT grow linearly with r (keeps outer markers on the arm)
        const jitter = c.armWidth * 0.22 * radius * (0.4 + 0.6 * (r / radius));
        base = new THREE.Vector3(
          Math.cos(angle) * r + rng.gauss() * jitter,
          rng.gauss() * c.thickness * radius * 0.6,
          Math.sin(angle) * r + rng.gauss() * jitter,
        );
        tries++;
      } while (
        tries < 40 &&
        placed.some((p) => (p.x - base.x) ** 2 + (p.z - base.z) ** 2 < minSep * minSep)
      );
      placed.push({ x: base.x, z: base.z });

      const data = regular[i].data;
      const visited = this._isVisited(data.seed);
      const statusColor = STATUS_COLOR[data.status] || UNCHARTED_COLOR;
      // both icons are baked WHITE and tinted by material.color, so the hover
      // highlight can blend the resting colour → brass with a single lerp (#1).
      const restColor = visited ? statusColor : UNCHARTED_COLOR;
      const mat = new THREE.SpriteMaterial({
        // uncharted → hollow survey ring; charted → a filled status disc with a
        // dark rim (a DIFFERENT icon, not just a recolour)
        map: visited ? discTex : ringTex,
        color: new THREE.Color(restColor),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        // NormalBlending (default): a crisp, OPAQUE icon that never washes out
        // against the bright bulge and always reads on top (#12)
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.setScalar(4.3);
      sprite.renderOrder = 8;

      const entry = {
        index: i,
        base,
        r: Math.hypot(base.x, base.z),
        data,
        sprite,
        worldPos: new THREE.Vector3(),
        visited,
        statusColor,
        _restCol: new THREE.Color(restColor),
        _hov: 0,
      };
      sprite.userData.system = entry; // fast pick, no array scan

      this.group.add(sprite);
      this.list.push(entry);
      this.sprites.push(sprite);
    }

    // --- special objects (catalog order: core, interstellar, sol, deadspace,
    // 4x film worlds, death star — see systemCatalog.js's addSpecial() calls) ---
    let s = 0;
    // supermassive black hole, fixed at the galactic centre — a real black void
    this._addGalacticBlackHole(specials[s++].data);
    // the "Interstellar" system, sitting on an arm — a "special" encounter,
    // marked magenta like the other special systems (special)
    const ir = 0.6 * radius;
    const ia = (1 / c.arms) * TAU + (ir / radius) * c.spin;
    this._addSpecialSystem(
      new THREE.Vector3(Math.cos(ia) * ir, 0, Math.sin(ia) * ir),
      specials[s++].data,
      SPECIAL_COLOR,
      4.2,
    );

    // hand-crafted easter-egg systems (#13/#19/#20), pinned on the arms
    const eggPos = (arm, frac) => {
      const rr = frac * radius;
      const ang = (arm / c.arms) * TAU + (rr / radius) * c.spin;
      return new THREE.Vector3(Math.cos(ang) * rr, 0, Math.sin(ang) * rr);
    };
    // one distinct colour for ALL easter-egg systems so they read as "special"
    const SPECIAL = SPECIAL_COLOR;
    this._addSpecialSystem(eggPos(2, 0.5), specials[s++].data, SPECIAL, 4.1);
    this._addSpecialSystem(eggPos(4, 0.72), specials[s++].data, SPECIAL, 4.0);
    const filmSpots = [
      [0, 0.46],
      [1, 0.62],
      [3, 0.56],
      [2, 0.78],
    ];
    for (const [arm, frac] of filmSpots) {
      this._addSpecialSystem(eggPos(arm, frac), specials[s++].data, SPECIAL, 4.0);
    }

    // the "Death Star" system (#12), pinned on its own arm — a special encounter,
    // marked magenta like the other special systems (special)
    this._addSpecialSystem(eggPos(5, 0.42), specials[s++].data, SPECIAL, 4.2);
  }

  // The galactic-centre black hole: a fully-opaque BLACK disk that punches a
  // void in the bright bulge (so nothing shows through it) + a glowing additive
  // accretion ring around it. It sits at the origin, so it never moves under the
  // disk rotation. The black disk is the pickable marker (warps to the BH view).
  _addGalacticBlackHole(data) {
    const scale = 7; // a bit smaller (#21)

    const horizonMat = new THREE.SpriteMaterial({
      map: galacticHorizonTexture(),
      transparent: true,
      depthWrite: false,
      depthTest: false, // normal blending → the black actually occludes the bulge
    });
    const horizon = new THREE.Sprite(horizonMat);
    horizon.scale.setScalar(scale);
    horizon.renderOrder = 6;

    const ringMat = new THREE.SpriteMaterial({
      map: galacticRingTexture(),
      color: new THREE.Color('#ffd9a8'),
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending, // a glowing, blooming accretion ring
    });
    const ring = new THREE.Sprite(ringMat);
    ring.scale.setScalar(scale * 1.4);
    ring.renderOrder = 7;
    this.group.add(ring); // static at origin, not pickable
    this._bhRingMat = ringMat;

    const entry = {
      index: this.list.length,
      base: new THREE.Vector3(0, 0, 0),
      r: 0,
      data,
      sprite: horizon,
      worldPos: new THREE.Vector3(),
      special: true,
      baseScale: scale,
      noFade: true, // the void stays pure black at any distance
    };
    horizon.userData.system = entry;
    this.group.add(horizon);
    this.list.push(entry);
    this.sprites.push(horizon);
  }

  _addSpecial(base, data, color, scale) {
    const mat = new THREE.SpriteMaterial({
      map: blackHoleMarkerTexture(),
      color: new THREE.Color(color),
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.setScalar(scale);
    sprite.renderOrder = 6;
    const entry = {
      index: this.list.length,
      base: base.clone(),
      r: Math.hypot(base.x, base.z),
      data,
      sprite,
      worldPos: new THREE.Vector3(),
      special: true,
      baseScale: scale,
    };
    sprite.userData.system = entry;
    this.group.add(sprite);
    this.list.push(entry);
    this.sprites.push(sprite);
  }

  // A pickable marker for a hand-crafted easter-egg STAR system (#13/#19/#20):
  // the normal star-marker look in a distinct colour, flagged special so it's
  // excluded from the discovery counter (it's a bonus find).
  _addSpecialSystem(base, data, color, scale) {
    const idx = this.list.length;
    const pos = this._avoidOverlap(base.clone()); // keep clear of other markers (#3)
    const visited = this._isVisited(data.seed);
    const restColor = visited ? color : UNCHARTED_COLOR;
    const mat = new THREE.SpriteMaterial({
      map: visited ? getDiscTexture() : getRingTexture(),
      color: new THREE.Color(restColor),
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.setScalar(scale);
    sprite.renderOrder = 8;
    const entry = {
      index: idx,
      base: pos,
      r: Math.hypot(pos.x, pos.z),
      data,
      sprite,
      worldPos: new THREE.Vector3(),
      special: true,
      baseScale: scale,
      visited,
      statusColor: color,
      _restCol: new THREE.Color(restColor),
      _hov: 0,
    };
    sprite.userData.system = entry;
    this.group.add(sprite);
    this.list.push(entry);
    this.sprites.push(sprite);
  }

  /** Rigid galaxy rotation, matching the suns/star vertex shader — one angular
   *  speed for all radii, so the disk turns as a whole and the arms never wind
   *  into a coil over a long idle. */
  _omega() {
    return this.config.rotationSpeed;
  }

  /** `rotTime` is the freezable galaxy-spin clock (markers rotate with the disk
   *  and FREEZE on interaction); `pulseTime` is the always-running clock, so the
   *  "uncharted" markers keep breathing even when the disk is held still (#10). */
  update(rotTime, pulseTime, _camera) {
    if (!this.group.visible) return; // markers hidden -> skip the CPU work
    for (const s of this.list) {
      const a = this._omega(s.r) * rotTime;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      // MUST match the suns/galaxy vertex shader `mat2(c,-s,s,c) * p.xz`,
      // i.e. x' = c*x + s*z, z' = -s*x + c*z — otherwise markers spin the
      // opposite way to the disk and look detached.
      const x = ca * s.base.x + sa * s.base.z;
      const z = -sa * s.base.x + ca * s.base.z;
      s.sprite.position.set(x, s.base.y, z);
      s.worldPos.set(x, s.base.y, z);

      // the central black hole stays a steady, pure-black void (no pulse/fade)
      if (s.noFade) {
        s.sprite.scale.setScalar(s.baseScale);
        s.sprite.material.opacity = 1;
        continue;
      }

      // Markers stay BRIGHT and OPAQUE at any distance (#12). A VERY subtle, slow
      // «breath» draws the eye (#4) — uncharted breathe a touch more (they invite
      // a visit). The hover highlight is the strong signal: the marker eases up in
      // size (far more than the breath) and tints toward brass while it's under
      // the pointer, so a hovered system is unmistakable.
      const seen = s.visited;
      const isHover = s === this._hovered;
      s._hov += ((isHover ? 1 : 0) - s._hov) * 0.22; // smooth, interruptible hover ease
      const breathAmp = seen ? 0.03 : 0.05; // tiny
      const breath = 1 + breathAmp * Math.sin(pulseTime * 0.6 + s.index * 0.9); // slow
      const base = s.special ? s.baseScale : seen ? 3.6 : 3.9;
      s.sprite.scale.setScalar(base * breath * (1 + 0.5 * s._hov)); // hover ≫ breath
      s.sprite.material.opacity = seen ? 0.95 : 1.0;
      // resting colour → brass, blended by the hover amount
      _col.copy(s._restCol).lerp(_hoverCol, s._hov);
      s.sprite.material.color.copy(_col);
    }
  }

  /** Mark `entry` (or null) as the marker under the pointer so update() can grow
   *  and brass-tint it. Called from the galaxy hover pick each frame (#1). */
  setHovered(entry) {
    this._hovered = entry || null;
  }

  /** Nudge `base` outward along its radial until it clears every already-placed
   *  marker by `minSep`, then register it. Keeps the pinned special systems from
   *  landing on top of a random one (#3). */
  _avoidOverlap(base) {
    const placed = this._placed;
    const minSep = this._minSep;
    if (!placed) return base;
    const dir = new THREE.Vector3(base.x, 0, base.z);
    if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0);
    dir.normalize();
    let tries = 0;
    while (
      tries < 24 &&
      placed.some((p) => (p.x - base.x) ** 2 + (p.z - base.z) ** 2 < minSep * minSep)
    ) {
      base.addScaledVector(dir, minSep * 0.5);
      tries++;
    }
    placed.push({ x: base.x, z: base.z });
    return base;
  }

  /** Chart a system: persist it via the party overlay + swap its marker from
   *  the hollow reticle to the solid status diamond (a different icon, not
   *  just a recolour). */
  markVisited(entry) {
    entry.visited = true;
    if (entry.sprite && entry.statusColor) {
      entry.sprite.material.map = getDiscTexture();
      entry.sprite.material.color.set(entry.statusColor);
      entry.sprite.material.needsUpdate = true;
      if (entry._restCol) entry._restCol.set(entry.statusColor);
    }
    if (this._overlay) this._overlay.patch(entry.data.seed, { visited: true, visitedAt: Date.now() });
  }

  /** Chart EVERY system at once (#13) — inks all markers to their status colour
   *  and persists in a SINGLE overlay write. Skips the central black-hole void
   *  (it has no status). */
  markAllVisited() {
    const ids = [];
    for (const s of this.list) {
      if (s.noFade) continue; // the galactic-core void isn't a chartable system
      s.visited = true;
      if (s.sprite && s.statusColor) {
        s.sprite.material.map = getDiscTexture();
        s.sprite.material.color.set(s.statusColor);
        s.sprite.material.needsUpdate = true;
        if (s._restCol) s._restCol.set(s.statusColor);
      }
      ids.push(s.data.seed);
    }
    if (this._overlay && ids.length) this._overlay.patchMany(ids, { visited: true, visitedAt: Date.now() });
  }

  setVisible(v) {
    this.group.visible = v;
  }

  /** Raycast pointer against markers; returns the nearest system entry or null. */
  pick(raycaster) {
    const hits = raycaster.intersectObjects(this.sprites, false);
    return hits.length ? hits[0].object.userData.system : null;
  }

  randomSystem() {
    const real = this.list.filter((s) => !s.special);
    return real[Math.floor(Math.random() * real.length)];
  }

  dispose() {
    for (const s of this.sprites) s.material.dispose();
    if (this._bhRingMat) this._bhRingMat.dispose();
    this.group.clear();
    this.sprites = [];
    this.list = [];
    // NOTE: the marker textures are shared module singletons — never disposed here.
  }
}

// Uncharted marker — the cartographer's «survey ring»: a fine engraved double
// ring (a crisp inner hairline + a softer outer range ring) with four short
// cardinal ticks and a tiny centre pip, on a soft dark halo. Reads as a precise
// chart annotation rather than a plain UI circle. Rendered at 256px for crisp
// edges, baked WHITE and tinted by the sprite material (ivory at rest, brass on
// hover). Built once, shared.
let _ringTex = null;
function getRingTexture() {
  if (_ringTex) return _ringTex;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  ctx.lineCap = 'round';

  // soft dark halo → the hairlines stay legible over the bright galactic core
  const halo = ctx.createRadialGradient(cx, cy, size * 0.04, cx, cy, size * 0.46);
  halo.addColorStop(0, 'rgba(7,9,18,0.5)');
  halo.addColorStop(0.7, 'rgba(7,9,18,0.22)');
  halo.addColorStop(1, 'rgba(7,9,18,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  const Rin = size * 0.24; // crisp inner ring
  const Rout = size * 0.36; // faint outer range ring

  // outer range ring — thin and dim, gives the «instrument» double-ring feel
  ctx.lineWidth = size * 0.012;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(cx, cy, Rout, 0, Math.PI * 2);
  ctx.stroke();

  // four short cardinal ticks bridging the two rings — a surveyor's reticle
  ctx.lineWidth = size * 0.018;
  ctx.strokeStyle = 'rgba(255,255,255,0.78)';
  for (let k = 0; k < 4; k++) {
    const a = k * (Math.PI / 2);
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(cx + dx * (Rin + size * 0.02), cy + dy * (Rin + size * 0.02));
    ctx.lineTo(cx + dx * (Rout - size * 0.012), cy + dy * (Rout - size * 0.012));
    ctx.stroke();
  }

  // crisp inner ring — the main mark
  ctx.lineWidth = size * 0.026;
  ctx.strokeStyle = 'rgba(255,255,255,1)';
  ctx.beginPath();
  ctx.arc(cx, cy, Rin, 0, Math.PI * 2);
  ctx.stroke();

  // faint centre pip — the plotted position
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.028, 0, Math.PI * 2);
  ctx.fill();

  _ringTex = new THREE.CanvasTexture(canvas);
  _ringTex.colorSpace = THREE.SRGBColorSpace;
  _ringTex.anisotropy = 4;
  return _ringTex;
}

// Charted marker — a DIFFERENT icon: a «catalogued star», a filled core disc
// inside a thin concentric ring (so it shares the ring family but reads as
// logged), on a soft dark halo with a crisp dark rim. Rendered at 256px, baked
// WHITE (NOT per-colour) and tinted by the sprite material to the status colour,
// so the hover highlight can blend it toward brass in a single lerp.
let _discTex = null;
function getDiscTexture() {
  if (_discTex) return _discTex;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  // soft dark halo → separates the mark from any background it sits on
  const halo = ctx.createRadialGradient(cx, cy, size * 0.06, cx, cy, size * 0.47);
  halo.addColorStop(0, 'rgba(7,8,16,0.6)');
  halo.addColorStop(0.7, 'rgba(7,8,16,0.26)');
  halo.addColorStop(1, 'rgba(7,8,16,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  const Rring = size * 0.32;

  // thin concentric ring (ties it to the uncharted survey ring)
  ctx.lineWidth = size * 0.026;
  ctx.strokeStyle = 'rgba(255,255,255,1)';
  ctx.beginPath();
  ctx.arc(cx, cy, Rring, 0, Math.PI * 2);
  ctx.stroke();
  // dark rim just inside the ring for contrast on bright backgrounds
  ctx.lineWidth = size * 0.014;
  ctx.strokeStyle = 'rgba(9,11,20,0.85)';
  ctx.beginPath();
  ctx.arc(cx, cy, Rring - size * 0.022, 0, Math.PI * 2);
  ctx.stroke();

  // filled core (tinted to the status colour by material.color)
  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.16, 0, Math.PI * 2);
  ctx.fill();

  _discTex = new THREE.CanvasTexture(canvas);
  _discTex.colorSpace = THREE.SRGBColorSpace;
  _discTex.anisotropy = 4;
  return _discTex;
}

// Marker for black-hole objects: a dark core punched out + a bright ring.
let _bhTex = null;
function blackHoleMarkerTexture() {
  if (_bhTex) return _bhTex;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;
  ctx.fillStyle = 'rgba(6,6,14,0.95)';
  ctx.beginPath();
  ctx.arc(c, c, size * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = size * 0.03;
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.shadowColor = 'rgba(255,236,205,0.9)';
  ctx.shadowBlur = size * 0.08;
  ctx.beginPath();
  ctx.arc(c, c, size * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  _bhTex = new THREE.CanvasTexture(canvas);
  _bhTex.colorSpace = THREE.SRGBColorSpace;
  return _bhTex;
}

// Galactic-centre event horizon: a fully-opaque BLACK disk with a soft edge,
// drawn with normal blending so it occludes the bright bulge → a true black void.
let _ghTex = null;
function galacticHorizonTexture() {
  if (_ghTex) return _ghTex;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, size * 0.5);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.66, 'rgba(0,0,0,1)');
  g.addColorStop(0.82, 'rgba(0,0,0,0.9)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  _ghTex = new THREE.CanvasTexture(canvas);
  _ghTex.colorSpace = THREE.SRGBColorSpace;
  return _ghTex;
}

// Glowing additive accretion / photon ring that hugs the black void.
let _grTex = null;
function galacticRingTexture() {
  if (_grTex) return _grTex;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;
  ctx.lineWidth = size * 0.03;
  ctx.strokeStyle = 'rgba(255,242,214,1)';
  ctx.shadowColor = 'rgba(255,206,150,0.95)';
  ctx.shadowBlur = size * 0.07;
  ctx.beginPath();
  ctx.arc(c, c, size * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = size * 0.13;
  ctx.lineWidth = size * 0.014;
  ctx.strokeStyle = 'rgba(255,180,120,0.55)';
  ctx.beginPath();
  ctx.arc(c, c, size * 0.46, 0, Math.PI * 2);
  ctx.stroke();
  _grTex = new THREE.CanvasTexture(canvas);
  _grTex.colorSpace = THREE.SRGBColorSpace;
  return _grTex;
}
