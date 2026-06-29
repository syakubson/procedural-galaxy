// A detailed "Death Star"-style battle station (#12, redrawn #4): an armoured,
// panelled moon-sized sphere with a recessed equatorial trench, a perpendicular
// meridian trench (the famous "trench run"), and a CONCAVE superlaser dish on
// the northern hemisphere with concentric focusing rings and a green eye.
// Lightly anonymised. Lit by the directional + ambient light that
// systemView._loadDeathStar adds (the only lit object in that view).
//
// Modelled from canonical references: battleship-grey panelled hull, equatorial
// trench separating the hemispheres, north-pole concave focusing dish.

import * as THREE from 'three';

const TAU = Math.PI * 2;

// --- baked textures (one-off canvases) -------------------------------------

let _hullTex = null;
/** Panelled battleship-grey hull: a fine plate grid with per-panel value noise,
 *  a couple of darker sector bands and a hint of the equatorial trench. */
function hullTexture() {
  if (_hullTex) return _hullTex;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#888c94';
  x.fillRect(0, 0, c.width, c.height);
  // plate grid with slight per-panel shading
  const cols = 64;
  const rows = 32;
  const cw = c.width / cols;
  const ch = c.height / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const v = 132 + Math.floor(Math.random() * 34); // 132..166 grey
      x.fillStyle = `rgb(${v},${v + 3},${v + 8})`;
      x.fillRect(i * cw, j * ch, cw - 0.6, ch - 0.6); // thin gaps = grid lines
    }
  }
  // a few darker structural bands (sector seams)
  x.fillStyle = 'rgba(40,44,50,0.55)';
  for (const fy of [0.18, 0.34, 0.66, 0.82]) x.fillRect(0, fy * c.height, c.width, 2);
  for (let k = 0; k < 8; k++) x.fillRect((k / 8) * c.width, 0, 2, c.height);
  // scattered greeble blocks (turbolaser emplacements / domes)
  x.fillStyle = 'rgba(30,33,38,0.6)';
  for (let k = 0; k < 240; k++) {
    const px = Math.random() * c.width;
    const py = Math.random() * c.height;
    const s = 1.5 + Math.random() * 3.5;
    x.fillRect(px, py, s, s);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  _hullTex = tex;
  return tex;
}

let _dishTex = null;
/** Concave focusing dish: a dark central pit ringed by concentric panel bands,
 *  brightening toward the raised rim — reads as a recessed bowl. */
function dishTexture() {
  if (_dishTex) return _dishTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const cx = 128;
  const g = x.createRadialGradient(cx, cx, 4, cx, cx, 128);
  g.addColorStop(0.0, '#0c0e12'); // dark pit
  g.addColorStop(0.45, '#3a3e46');
  g.addColorStop(0.8, '#6b6f78');
  g.addColorStop(1.0, '#9a9ea8'); // bright rim
  x.fillStyle = g;
  x.beginPath();
  x.arc(cx, cx, 128, 0, TAU);
  x.fill();
  // concentric focusing rings
  x.strokeStyle = 'rgba(20,22,26,0.7)';
  for (let r = 18; r < 128; r += 16) {
    x.lineWidth = 2;
    x.beginPath();
    x.arc(cx, cx, r, 0, TAU);
    x.stroke();
  }
  // eight tributary beam emitters around the dish
  x.fillStyle = 'rgba(20,22,26,0.85)';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    x.beginPath();
    x.arc(cx + Math.cos(a) * 78, cx + Math.sin(a) * 78, 7, 0, TAU);
    x.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  _dishTex = tex;
  return tex;
}

let _glowTex = null;
function greenGlowTexture() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(150,255,110,0.95)');
  g.addColorStop(0.3, 'rgba(110,240,80,0.5)');
  g.addColorStop(1, 'rgba(110,240,80,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  _glowTex = new THREE.CanvasTexture(c);
  return _glowTex;
}

export class DeathStar {
  constructor(radius = 8) {
    const R = radius;
    this.R = R;
    this.spin = 0.04; // y-spin rate; set to 0 to hold a fired-beam pose
    this.group = new THREE.Group();
    this._geos = [];
    this._mats = [];

    const hull = new THREE.MeshStandardMaterial({
      map: hullTexture(),
      roughness: 0.92,
      metalness: 0.35,
    });
    const dark = new THREE.MeshStandardMaterial({ color: 0x26282e, roughness: 1.0, metalness: 0.2 });
    const edge = new THREE.MeshStandardMaterial({ color: 0xb6bac4, roughness: 0.8, metalness: 0.4 });
    this._mats.push(hull, dark, edge);

    // --- armoured sphere ---
    const bodyGeo = new THREE.SphereGeometry(R, 96, 64);
    this._geos.push(bodyGeo);
    this.group.add(new THREE.Mesh(bodyGeo, hull));

    // --- equatorial trench: a recessed dark channel with two bright lip rails ---
    const chGeo = new THREE.TorusGeometry(R * 0.985, R * 0.055, 12, 120);
    this._geos.push(chGeo);
    const channel = new THREE.Mesh(chGeo, dark);
    channel.rotation.x = Math.PI / 2;
    this.group.add(channel);
    for (const off of [R * 0.07, -R * 0.07]) {
      const lipGeo = new THREE.TorusGeometry(R * 1.0, R * 0.01, 8, 120);
      this._geos.push(lipGeo);
      const lip = new THREE.Mesh(lipGeo, edge);
      lip.rotation.x = Math.PI / 2;
      lip.position.y = off;
      this.group.add(lip);
    }

    // --- a perpendicular meridian trench (the trench-run groove) ---
    const merGeo = new THREE.TorusGeometry(R * 0.992, R * 0.022, 8, 120, Math.PI); // half great-circle
    this._geos.push(merGeo);
    const meridian = new THREE.Mesh(merGeo, dark);
    meridian.rotation.y = Math.PI / 2;
    this.group.add(meridian);

    // --- concave superlaser dish on the upper-front hemisphere ---
    const dir = new THREE.Vector3(0.4, 0.55, 0.72).normalize();
    const out = dir.clone().multiplyScalar(R * 3);

    // a slightly raised rim well around the dish
    const wellGeo = new THREE.TorusGeometry(R * 0.34, R * 0.03, 10, 64);
    this._geos.push(wellGeo);
    const wellMat = new THREE.MeshStandardMaterial({ color: 0x6d7178, roughness: 0.85, metalness: 0.4 });
    this._mats.push(wellMat);
    const well = new THREE.Mesh(wellGeo, wellMat);
    well.position.copy(dir).multiplyScalar(R * 0.955);
    well.lookAt(out);
    this.group.add(well);

    // the dish face (textured concave bowl), recessed just under the rim
    const dishGeo = new THREE.CircleGeometry(R * 0.33, 64);
    this._geos.push(dishGeo);
    const dishMat = new THREE.MeshStandardMaterial({
      map: dishTexture(),
      roughness: 1.0,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    this._mats.push(dishMat);
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.copy(dir).multiplyScalar(R * 0.9);
    dish.lookAt(out);
    this.group.add(dish);

    // green superlaser eye + soft glow at the dish centre
    const eyeGeo = new THREE.SphereGeometry(R * 0.05, 16, 16);
    this._geos.push(eyeGeo);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x9bff63 });
    this._mats.push(eyeMat);
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.copy(dir).multiplyScalar(R * 0.9);
    this.group.add(eye);

    const glowMat = new THREE.SpriteMaterial({
      map: greenGlowTexture(),
      color: 0x9bff63,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this._mats.push(glowMat);
    const glow = new THREE.Sprite(glowMat);
    glow.scale.setScalar(R * 0.5);
    glow.position.copy(dir).multiplyScalar(R * 0.92);
    this.group.add(glow);
    this._eye = eye;
    this._glow = glow;
  }

  addTo(scene) {
    scene.add(this.group);
  }

  update(dt, time = 0) {
    if (this.spin) this.group.rotation.y += dt * this.spin; // slow, ominous spin
    // the superlaser eye pulses faintly
    const p = 0.8 + 0.2 * Math.sin(time * 2.0);
    if (this._glow) this._glow.material.opacity = p;
  }

  dispose() {
    for (const g of this._geos) g.dispose();
    for (const m of this._mats) m.dispose();
  }
}
