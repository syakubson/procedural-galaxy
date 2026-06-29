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
  generateDeathStar,
  FLEET_FACTIONS,
} from './systemData.js';

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

// uncharted marker tint — a cool, bright hairline reticle (NOT the old yellowish
// ivory, which washed out); inks into a solid charted marker on discovery.
const UNCHARTED_COLOR = '#dfe6f5';

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
    const minSep = radius * 0.075; // larger gap so systems don't pile up on screen
    this._visitedSet = this._loadVisited(); // charted systems persist across reloads
    let inhabIdx = 0; // round-robins factions across inhabited systems (#24)
    for (let i = 0; i < count; i++) {
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

      const data = generateSystem(c.seed + '::sys' + i);
      // #24: guarantee all 6 fleet factions appear across inhabited systems so
      // every ship kit is used. Dead/robotic worlds keep their random faction.
      if (data.status === 'inhabited') {
        data.faction = FLEET_FACTIONS[inhabIdx % FLEET_FACTIONS.length];
        inhabIdx++;
      }

      const visited = this._visitedSet.has(i);
      const statusColor = STATUS_COLOR[data.status] || UNCHARTED_COLOR;
      const mat = new THREE.SpriteMaterial({
        // uncharted → hollow reticle (tinted); charted → a solid colour diamond
        // with a dark outline (a DIFFERENT icon, not just a recolour)
        map: visited ? getChartedTexture(statusColor) : tex,
        color: new THREE.Color(visited ? '#ffffff' : UNCHARTED_COLOR),
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
        visited,
        statusColor,
      };
      sprite.userData.system = entry; // fast pick, no array scan

      this.group.add(sprite);
      this.list.push(entry);
      this.sprites.push(sprite);
    }

    // --- special objects ---
    // supermassive black hole, fixed at the galactic centre — a real black void
    this._addGalacticBlackHole();
    // the "Interstellar" system, sitting on an arm — a "special" encounter,
    // marked magenta like the other special systems (#особые)
    const ir = 0.6 * radius;
    const ia = (1 / c.arms) * TAU + (ir / radius) * c.spin;
    this._addSpecialSystem(
      new THREE.Vector3(Math.cos(ia) * ir, 0, Math.sin(ia) * ir),
      generateInterstellar(),
      SPECIAL_COLOR,
      5.4,
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

    // the "Death Star" system (#12), pinned on its own arm — a special encounter,
    // marked magenta like the other special systems (#особые)
    this._addSpecialSystem(eggPos(5, 0.42), generateDeathStar(), SPECIAL, 5.2);
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
    const idx = this.list.length;
    const visited = this._visitedSet ? this._visitedSet.has(idx) : false;
    const mat = new THREE.SpriteMaterial({
      map: visited ? getChartedTexture(color) : getMarkerTexture(),
      color: new THREE.Color(visited ? '#ffffff' : UNCHARTED_COLOR),
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.setScalar(scale);
    sprite.renderOrder = 8;
    const entry = {
      index: idx,
      base: base.clone(),
      r: Math.hypot(base.x, base.z),
      data,
      sprite,
      worldPos: new THREE.Vector3(),
      special: true,
      baseScale: scale,
      visited,
      statusColor: color,
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
  update(rotTime, pulseTime, camera) {
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

      // Markers stay BRIGHT and OPAQUE at any distance (#12) — no fading into the
      // disk. Unexplored ones pulse a little; explored ones dim only slightly so
      // they're still distinguishable.
      const seen = s.visited;
      // "event" objects pulse harder to read as a special encounter on the map;
      // uncharted markers breathe noticeably to invite a click (#11). Pulse is on
      // the always-running clock, so it never freezes with the disk (#10).
      const amp = s.data && s.data.event ? 0.26 : seen ? 0.05 : 0.2;
      const pulse = 1 + amp * Math.sin(pulseTime * 2.0 + s.index * 0.7);
      const base = s.special ? s.baseScale : seen ? 4.6 : 5.6;
      s.sprite.scale.setScalar(base * pulse);
      s.sprite.material.opacity = seen ? 0.82 : 1.0;
    }
  }

  _visitedKey() {
    return 'galaxy.charted.' + this.config.seed;
  }
  _loadVisited() {
    try {
      const raw = localStorage.getItem(this._visitedKey());
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) {
      return new Set();
    }
  }
  /** Chart a system: persist it + swap its marker from the hollow reticle to the
   *  solid status diamond (a different icon, not just a recolour). */
  markVisited(entry) {
    entry.visited = true;
    if (entry.sprite && entry.statusColor) {
      entry.sprite.material.map = getChartedTexture(entry.statusColor);
      entry.sprite.material.color.set('#ffffff');
      entry.sprite.material.needsUpdate = true;
    }
    if (!this._visitedSet) this._visitedSet = new Set();
    this._visitedSet.add(entry.index);
    try {
      localStorage.setItem(this._visitedKey(), JSON.stringify([...this._visitedSet]));
    } catch (e) {
      /* storage unavailable — discovery just won't persist this session */
    }
  }

  /** Chart EVERY system at once (#13) — inks all markers to their status colour
   *  and persists. Skips the central black-hole void (it has no status). */
  markAllVisited() {
    if (!this._visitedSet) this._visitedSet = new Set();
    for (const s of this.list) {
      if (s.noFade) continue; // the galactic-core void isn't a chartable system
      s.visited = true;
      if (s.sprite && s.statusColor) {
        s.sprite.material.map = getChartedTexture(s.statusColor);
        s.sprite.material.color.set('#ffffff');
        s.sprite.material.needsUpdate = true;
      }
      this._visitedSet.add(s.index);
    }
    try {
      localStorage.setItem(this._visitedKey(), JSON.stringify([...this._visitedSet]));
    } catch (e) {
      /* storage unavailable — reveal just won't persist this session */
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

  // Circular «target-lock» mark (round variant of the bracket reticle): four arc
  // segments on the diagonals with open gaps at the cardinals, each ending in a
  // small outward hook — a target frame that reads as «system, not yet locked».
  // Tinted by the sprite material (ivory = uncharted, status colour = charted).
  ctx.strokeStyle = 'rgba(255,255,255,1)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.05;
  const R = size * 0.33;
  const hook = size * 0.085;
  const half = Math.PI * 0.2; // each arc ≈ 72°, gaps ≈ 18° at N/E/S/W
  for (let k = 0; k < 4; k++) {
    const a = Math.PI * 0.25 + k * (Math.PI / 2); // arcs centred on the diagonals
    ctx.beginPath();
    ctx.arc(cx, cy, R, a - half, a + half);
    ctx.stroke();
    // a short outward hook at each arc end (the «bracket» feel from the ref)
    for (const e of [a - half, a + half]) {
      const dx = Math.cos(e);
      const dy = Math.sin(e);
      ctx.beginPath();
      ctx.moveTo(cx + dx * R, cy + dy * R);
      ctx.lineTo(cx + dx * (R + hook), cy + dy * (R + hook));
      ctx.stroke();
    }
  }
  // a faint centre pip marks the exact system point
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.035, 0, Math.PI * 2);
  ctx.fill();

  _markerTex = new THREE.CanvasTexture(canvas);
  _markerTex.colorSpace = THREE.SRGBColorSpace;
  return _markerTex;
}

// Charted marker — a DIFFERENT icon from the uncharted reticle: a solid colour
// diamond with a dark outline + a soft dark halo, so a discovered system reads at
// a glance and pops against the bright disk. The colour is baked in (one cached
// texture per status colour), so the sprite is drawn with a white tint.
const _chartedCache = {};
function getChartedTexture(color) {
  if (_chartedCache[color]) return _chartedCache[color];
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.3;

  // soft dark halo → separates the marker from any background it sits on
  const halo = ctx.createRadialGradient(cx, cy, size * 0.08, cx, cy, size * 0.46);
  halo.addColorStop(0, 'rgba(6,7,14,0.62)');
  halo.addColorStop(1, 'rgba(6,7,14,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  const diamond = () => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
  };
  // solid status-colour fill
  diamond();
  ctx.fillStyle = color;
  ctx.fill();
  // crisp dark outline for contrast
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.05;
  ctx.strokeStyle = 'rgba(9,11,20,0.9)';
  diamond();
  ctx.stroke();
  // bright inner highlight
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.058, 0, Math.PI * 2);
  ctx.fill();

  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  _chartedCache[color] = t;
  return t;
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
