// Debris field (#12 / #8): what remains after an alien race blows a planet
// apart — a slowly tumbling cloud of rocky chunks, a faint dust haze, AND the
// planet's exposed former CORE still glowing molten at the centre, with a few
// red-hot ember shards scattered through the cloud. Geometry/materials/textures
// are shared singletons; dispose() is a no-op (assets persist for reuse).

import * as THREE from 'three';
import { createRng } from '../rng.js';

let _rock, _rockDark, _rockWarm, _core, _ember, _g0, _g1, _g2;
const rock = () => (_rock || (_rock = new THREE.MeshBasicMaterial({ color: 0x5a514a })));
const rockDark = () => (_rockDark || (_rockDark = new THREE.MeshBasicMaterial({ color: 0x352f2a })));
const rockWarm = () => (_rockWarm || (_rockWarm = new THREE.MeshBasicMaterial({ color: 0x7a4326 })));
// HDR-bright molten materials — bloom warm through ACES
const coreMat = () => (_core || (_core = new THREE.MeshBasicMaterial({ color: 0xffd27a })));
const emberMat = () => (_ember || (_ember = new THREE.MeshBasicMaterial({ color: 0xff5a1e })));
const geo0 = () => (_g0 || (_g0 = new THREE.IcosahedronGeometry(1, 0)));
const geo1 = () => (_g1 || (_g1 = new THREE.DodecahedronGeometry(1, 0)));
const geo2 = () => (_g2 || (_g2 = new THREE.TetrahedronGeometry(1, 0)));
const GEOS = [geo0, geo1, geo2];
const MATS = [rock, rockDark, rock, rockWarm];

// shared glow textures + sprite materials
let _dustTex, _hotTex, _dustMat, _coreGlowMat, _emberGlowMat;
function softTexture(cache, stops) {
  if (cache.v) return cache.v;
  const s = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  const gr = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, s, s);
  cache.v = new THREE.CanvasTexture(cv);
  cache.v.colorSpace = THREE.SRGBColorSpace;
  return cache.v;
}
const _dustCache = {};
const _hotCache = {};
const dustTexture = () =>
  softTexture(_dustCache, [
    [0, 'rgba(120,100,90,0.5)'],
    [0.5, 'rgba(90,75,68,0.18)'],
    [1, 'rgba(70,60,55,0)'],
  ]);
const hotTexture = () =>
  softTexture(_hotCache, [
    [0, 'rgba(255,220,150,0.95)'],
    [0.35, 'rgba(255,130,40,0.5)'],
    [1, 'rgba(200,60,10,0)'],
  ]);
const dustMat = () =>
  (_dustMat ||
    (_dustMat = new THREE.SpriteMaterial({
      map: dustTexture(),
      color: 0x8a7568,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    })));
const glowMat = (ref, color) =>
  ref ||
  new THREE.SpriteMaterial({
    map: hotTexture(),
    color,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
const coreGlowMat = () => (_coreGlowMat || (_coreGlowMat = glowMat(null, 0xffcaa0)));
const emberGlowMat = () => (_emberGlowMat || (_emberGlowMat = glowMat(null, 0xff7a30)));

export class Debris {
  /** @param {number} radius former planet radius. @param {number} seed */
  constructor(radius, seed) {
    const rng = createRng('debris-' + seed);
    this.group = new THREE.Group();
    this._chunks = [];
    this._t = 0;

    // exposed molten core remnant at the centre + its hot glow
    this._core = new THREE.Mesh(geo0(), coreMat());
    this._core.scale.setScalar(radius * 0.42);
    this.group.add(this._core);
    this._coreGlow = new THREE.Sprite(coreGlowMat());
    this._coreGlow.scale.setScalar(radius * 2.6);
    this.group.add(this._coreGlow);

    const N = 30;
    for (let i = 0; i < N; i++) {
      const molten = i < 6; // a few red-hot ember shards (#8)
      const geoFn = GEOS[rng.int(0, GEOS.length - 1)];
      const m = new THREE.Mesh(geoFn(), molten ? emberMat() : MATS[rng.int(0, MATS.length - 1)]());
      const dir = new THREE.Vector3(rng.gauss(), rng.gauss() * 0.5, rng.gauss()).normalize();
      const d = radius * rng.range(0.3, 1.5);
      m.position.copy(dir.multiplyScalar(d));
      const sz = radius * rng.range(0.05, 0.2);
      m.scale.setScalar(sz);
      m.rotation.set(rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28));
      this.group.add(m);
      this._chunks.push({ mesh: m, sx: rng.range(-0.4, 0.4), sy: rng.range(-0.4, 0.4) });

      if (molten) {
        const g = new THREE.Sprite(emberGlowMat());
        g.scale.setScalar(sz * 5);
        g.position.copy(m.position);
        this.group.add(g);
      }
    }

    this.dust = new THREE.Sprite(dustMat());
    this.dust.scale.setScalar(radius * 3.2);
    this.group.add(this.dust);
  }

  /** Spun by the owning Planet (shares the orbit/holder transform). */
  update(dt) {
    this._t += dt;
    for (const c of this._chunks) {
      c.mesh.rotation.x += c.sx * dt;
      c.mesh.rotation.y += c.sy * dt;
    }
    // gentle molten-core flicker (shared glow material → all embers pulse together)
    this._coreGlow.material.opacity = 0.85 * (1 + 0.12 * Math.sin(this._t * 2.0));
  }

  dispose() {
    // all geometries/materials/textures are shared singletons — nothing per-instance
  }
}
