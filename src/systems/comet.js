// Comets (#13): a small icy nucleus + a soft coma glow + a glowing tail that
// always streams away from the star (origin). Comets fly STRAIGHT through the
// system on a flyby (#2) — they enter from one side, cross past the star, and
// leave the far side, then respawn somewhere new. They are deliberately small
// (#1). No closed orbit — a comet is a visitor, not a planet.

import * as THREE from 'three';

const _away = new THREE.Vector3();
const _XP = new THREE.Vector3(1, 0, 0);

// --- shared textures (built once) ------------------------------------------
let _glowTex, _tailTex;
function glowTexture() {
  if (_glowTex) return _glowTex;
  const s = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  const gr = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, 'rgba(255,255,255,0.95)');
  gr.addColorStop(0.3, 'rgba(200,230,255,0.4)');
  gr.addColorStop(1, 'rgba(160,200,255,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, s, s);
  _glowTex = new THREE.CanvasTexture(cv);
  _glowTex.colorSpace = THREE.SRGBColorSpace;
  return _glowTex;
}
function tailTexture() {
  if (_tailTex) return _tailTex;
  const w = 256;
  const h = 64;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  const gr = ctx.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, 'rgba(220,240,255,0.85)');
  gr.addColorStop(0.4, 'rgba(180,215,255,0.32)');
  gr.addColorStop(1, 'rgba(150,200,255,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, w, h);
  const vg = ctx.createLinearGradient(0, 0, 0, h);
  vg.addColorStop(0, 'rgba(0,0,0,1)');
  vg.addColorStop(0.5, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
  _tailTex = new THREE.CanvasTexture(cv);
  _tailTex.colorSpace = THREE.SRGBColorSpace;
  return _tailTex;
}

export class Comet {
  /**
   * @param {object} o  { reach, scale, speed, rng }
   *   reach: system outer radius; scale: nucleus size (small!); speed: world
   *   units/sec; rng: seeded RNG for spawn directions.
   */
  constructor(o) {
    this.reach = o.reach;
    this.speed = o.speed;
    this._rng = o.rng;
    const r = o.scale;

    this.group = new THREE.Group();
    this.nucleus = new THREE.Mesh(
      new THREE.IcosahedronGeometry(r, 0),
      new THREE.MeshBasicMaterial({ color: 0xdce9ff }),
    );
    this.group.add(this.nucleus);

    this.coma = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture(),
        color: 0xbfe0ff,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.coma.scale.setScalar(r * 5);
    this.group.add(this.coma);

    // tail — two crossed planes streaming along +X (re-aimed away from the star)
    this.tailGroup = new THREE.Group();
    const len = this.reach * 0.28;
    const wid = r * 4;
    const tmat = new THREE.MeshBasicMaterial({
      map: tailTexture(),
      color: 0xaad2ff,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this._tailMat = tmat;
    const tgeo = new THREE.PlaneGeometry(len, wid);
    for (let i = 0; i < 2; i++) {
      const pl = new THREE.Mesh(tgeo, tmat);
      pl.position.x = len / 2; // bright (near) edge at the nucleus
      pl.rotation.x = i * (Math.PI / 2);
      this.tailGroup.add(pl);
    }
    this._tailGeo = tgeo;
    this.group.add(this.tailGroup);

    this._pos = new THREE.Vector3();
    this._vel = new THREE.Vector3();
    this._spawn();
  }

  /** Place the comet far out and aim it on a chord that sails PAST the star —
   *  never through the system centre. We pick the closest-approach point
   *  (perihelion) at a safe distance, then fly perpendicular to it so that point
   *  IS the nearest the comet ever gets to the star. */
  _spawn() {
    const rng = this._rng;
    const reach = this.reach;
    const minMiss = Math.max(reach * 0.4, 4.5); // never closer to the star than this

    // perihelion: a random point at a safe distance, mostly in the disk plane
    const peri = new THREE.Vector3(rng.gauss(), rng.gauss() * 0.35, rng.gauss());
    if (peri.lengthSq() < 1e-4) peri.set(1, 0, 0);
    peri.normalize().multiplyScalar(minMiss + rng.next() * reach * 0.4);

    // velocity ⊥ to the perihelion radius → perihelion is the closest approach
    const vdir = new THREE.Vector3(rng.gauss(), rng.gauss() * 0.35, rng.gauss());
    vdir.addScaledVector(peri, -vdir.dot(peri) / peri.lengthSq()); // strip radial part
    if (vdir.lengthSq() < 1e-4) vdir.set(-peri.z, 0, peri.x); // fallback perpendicular
    vdir.normalize();

    this._pos.copy(peri).addScaledVector(vdir, -reach * 1.6); // start far out, before perihelion
    this._vel.copy(vdir).multiplyScalar(this.speed);
    this.group.position.copy(this._pos);
  }

  addTo(scene) {
    scene.add(this.group);
  }

  update(dt) {
    this._pos.addScaledVector(this._vel, dt);
    const dist = this._pos.length() || 1;
    if (dist > this.reach * 1.7) {
      this._spawn(); // left the system → re-enter elsewhere
      return;
    }
    this.group.position.copy(this._pos);

    _away.copy(this._pos).multiplyScalar(1 / dist);
    this.tailGroup.quaternion.setFromUnitVectors(_XP, _away);

    // tail/coma brighten & grow as it passes close to the star
    const near = THREE.MathUtils.clamp(1.4 - dist / this.reach, 0.4, 1.3);
    this.tailGroup.scale.setScalar(near);
    this._tailMat.opacity = THREE.MathUtils.clamp(near * 0.7, 0.12, 0.85);
    this.nucleus.rotation.y += dt * 1.5;
  }

  dispose() {
    this.nucleus.geometry.dispose();
    this.nucleus.material.dispose();
    this.coma.material.dispose();
    this._tailGeo.dispose();
    this._tailMat.dispose();
  }
}
