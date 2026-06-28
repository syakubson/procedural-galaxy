// Real, explorable systems inside the galaxy.
//
// A seeded subset of points on the spiral arms become "systems". Each gets a
// glowing marker sprite (tinted by status) that the user can hover (name
// tooltip) and click (warp in). Markers rotate on the CPU using the SAME
// differential-rotation formula as the suns shader, and fade with view distance
// so they read as embedded in the disk rather than as a flat HUD.

import * as THREE from 'three';
import { createRng } from '../rng.js';
import {
  generateSystem,
  generateGalacticCore,
  generateInterstellar,
  generateSolarSystem,
  generateDeadSpace,
  generateFilmWorlds,
  FLEET_FACTIONS,
} from './systemData.js';

const TAU = Math.PI * 2;

const STATUS_COLOR = {
  inhabited: '#7dffb0', // green — alive
  ruins: '#ffb066', // amber — dead
  wild: '#5aa0ff', // saturated cyan-blue — untouched
};

// magenta — hand-crafted easter-egg systems (#13/#19/#20), marked distinctly
const SPECIAL_COLOR = '#e879ff';

const _v = new THREE.Vector3();

export class Systems {
  constructor(config) {
    this.config = config;
    this.group = new THREE.Group();
    this.sprites = [];
    this.list = [];
    this._build();
  }

  _build() {
    const c = this.config;
    const rng = createRng(c.seed + '::systems');
    const radius = c.radius;
    const count = Math.max(1, Math.round(c.sunCount * c.realSystemFraction));
    const tex = getMarkerTexture();

    // keep markers from piling on top of each other so every system is easy to
    // click (#12), and place them clear of the central black hole (#21).
    const placed = [];
    const minSep = radius * 0.05;
    let inhabIdx = 0; // round-robins factions across inhabited systems (#24)
    for (let i = 0; i < count; i++) {
      let base;
      let tries = 0;
      do {
        // place tight on an arm so the marker sits on visible disk brightness,
        // with an inner clear zone around the galactic centre (#21)
        const r = rng.range(0.34, 0.82) * radius;
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
        tries < 16 &&
        placed.some((p) => (p.x - base.x) ** 2 + (p.z - base.z) ** 2 < minSep * minSep)
      );
      placed.push({ x: base.x, z: base.z });

      const data = generateSystem(c.seed + '::sys' + i);
      // #24: guarantee all 6 fleet factions appear across inhabited systems so
      // every ship kit is used. Dead/robotic worlds keep their random faction.
      if (data.status === 'inhabited') {
        data.faction = FLEET_FACTIONS[inhabIdx % FLEET_FACTIONS.length];
        inhabIdx++;
      }

      const mat = new THREE.SpriteMaterial({
        map: tex,
        color: new THREE.Color(STATUS_COLOR[data.status]),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        // NormalBlending (default): a bright, OPAQUE icon that never washes out
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
      };
      sprite.userData.system = entry; // fast pick, no array scan

      this.group.add(sprite);
      this.list.push(entry);
      this.sprites.push(sprite);
    }

    // --- special objects ---
    // supermassive black hole, fixed at the galactic centre — a real black void
    this._addGalacticBlackHole();
    // the "Interstellar" system, sitting on an arm
    const ir = 0.6 * radius;
    const ia = (1 / c.arms) * TAU + (ir / radius) * c.spin;
    this._addSpecial(
      new THREE.Vector3(Math.cos(ia) * ir, 0, Math.sin(ia) * ir),
      generateInterstellar(),
      '#ffc89c',
      7,
    );

    // hand-crafted easter-egg systems (#13/#19/#20), pinned on the arms
    const eggPos = (arm, frac) => {
      const rr = frac * radius;
      const ang = (arm / c.arms) * TAU + (rr / radius) * c.spin;
      return new THREE.Vector3(Math.cos(ang) * rr, 0, Math.sin(ang) * rr);
    };
    // one distinct colour for ALL easter-egg systems so they read as "special"
    const SPECIAL = SPECIAL_COLOR;
    this._addSpecialSystem(eggPos(2, 0.5), generateSolarSystem(), SPECIAL, 5.2);
    this._addSpecialSystem(eggPos(4, 0.72), generateDeadSpace(), SPECIAL, 5.0);
    const filmSpots = [
      [0, 0.46],
      [1, 0.62],
      [3, 0.56],
      [2, 0.78],
    ];
    generateFilmWorlds().forEach((data, k) => {
      this._addSpecialSystem(eggPos(filmSpots[k][0], filmSpots[k][1]), data, SPECIAL, 4.8);
    });
  }

  // The galactic-centre black hole: a fully-opaque BLACK disk that punches a
  // void in the bright bulge (so nothing shows through it) + a glowing additive
  // accretion ring around it. It sits at the origin, so it never moves under the
  // disk rotation. The black disk is the pickable marker (warps to the BH view).
  _addGalacticBlackHole() {
    const data = generateGalacticCore();
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
    const mat = new THREE.SpriteMaterial({
      map: getMarkerTexture(),
      color: new THREE.Color(color),
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.setScalar(scale);
    sprite.renderOrder = 8;
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

  /** Differential galaxy rotation, matching the suns vertex shader. */
  _omega(r) {
    const c = this.config;
    const coreSoft = c.coreSize * c.radius;
    return c.rotationSpeed * (1 + c.differential * (coreSoft / (r + coreSoft)));
  }

  update(time, camera) {
    if (!this.group.visible) return; // markers hidden -> skip the CPU work
    for (const s of this.list) {
      const a = this._omega(s.r) * time;
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

      // Markers stay BRIGHT and OPAQUE at any distance (#12) — no fading into the
      // disk. Unexplored ones pulse a little; explored ones dim only slightly so
      // they're still distinguishable.
      const seen = s.visited;
      // "event" objects pulse harder to read as a special encounter on the map
      const amp = s.data && s.data.event ? 0.24 : seen ? 0.05 : 0.12;
      const pulse = 1 + amp * Math.sin(time * 2.0 + s.index * 0.7);
      const base = s.special ? s.baseScale : seen ? 3.7 : 4.4;
      s.sprite.scale.setScalar(base * pulse);
      s.sprite.material.opacity = seen ? 0.82 : 1.0;
    }
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

// A soft glowing star-with-halo-ring sprite, built once and shared across all
// Systems instances (so rebuilds never leak a CanvasTexture).
let _markerTex = null;
function getMarkerTexture() {
  if (_markerTex) return _markerTex;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  // SOLID, opaque core (#12): a bright filled dot with a crisp ring, so with
  // NormalBlending + a status-colour tint it reads as a clear icon on any
  // background (deep space OR the bright bulge) and never washes out.
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.34);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(0.62, 'rgba(255,255,255,1)');
  core.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);

  // crisp bright ring around the dot
  ctx.lineWidth = size * 0.05;
  ctx.strokeStyle = 'rgba(255,255,255,1)';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.42, 0, Math.PI * 2);
  ctx.stroke();

  _markerTex = new THREE.CanvasTexture(canvas);
  _markerTex.colorSpace = THREE.SRGBColorSpace;
  return _markerTex;
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
