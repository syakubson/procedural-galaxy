// Deep-space nebula clouds (#3): a handful of large, soft, additive billboards
// in varied colours scattered across the far background, giving both the galaxy
// view and the in-system void the moody coloured haze of the reference shots.
// A few sprites + a couple of shared procedural textures — very cheap.

import * as THREE from 'three';
import { createRng } from './rng.js';

// Default varied palette — purples, magentas, blues, teal, rose.
export const NEBULA_HUES = ['#7a3cff', '#c64cff', '#3f6cff', '#2bd6c0', '#ff5aa6', '#5a3cff', '#1f8bff'];

// --- shared puffy cloud textures (built once) ------------------------------
let _texes = null;
function cloudTextures() {
  if (_texes) return _texes;
  _texes = [];
  for (let t = 0; t < 3; t++) {
    const s = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const ctx = cv.getContext('2d');
    const rng = createRng('nebula-cloud-' + t);
    ctx.globalCompositeOperation = 'lighter';
    // stack many soft white blobs into an irregular puff (tinted later per sprite)
    for (let k = 0; k < 18; k++) {
      const x = rng.range(0.2, 0.8) * s;
      const y = rng.range(0.2, 0.8) * s;
      const r = rng.range(0.12, 0.42) * s;
      const a = rng.range(0.04, 0.16);
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,' + a + ')');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // fade the sprite's square edges so clouds never show a hard border
    ctx.globalCompositeOperation = 'destination-out';
    const vg = ctx.createRadialGradient(s / 2, s / 2, s * 0.32, s / 2, s / 2, s * 0.5);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    _texes.push(tex);
  }
  return _texes;
}

export class NebulaClouds {
  /**
   * @param {object} o
   *   seed: string; count: number; radius: shell distance; sizeMin/sizeMax;
   *   colors?: hex[]; opacity?: base alpha; flatten?: 0..1 squash toward the
   *   galactic plane (1 = spread on the shell sphere, lower = hug the disk).
   */
  constructor(o) {
    this.group = new THREE.Group();
    this._mats = [];
    const rng = createRng(o.seed || 'nebula');
    const texes = cloudTextures();
    const colors = o.colors || NEBULA_HUES;
    const flatten = o.flatten != null ? o.flatten : 1;
    const baseOpacity = o.opacity != null ? o.opacity : 0.42;

    for (let i = 0; i < o.count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: texes[rng.int(0, texes.length - 1)],
        color: new THREE.Color(rng.pick(colors)).multiplyScalar(rng.range(0.5, 0.95)),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        opacity: baseOpacity * rng.range(0.6, 1.0),
        rotation: rng.range(0, Math.PI * 2),
      });
      const spr = new THREE.Sprite(mat);

      // a direction on a (optionally flattened) shell, well behind the scene
      const dir = new THREE.Vector3(rng.gauss(), rng.gauss() * flatten, rng.gauss());
      if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0);
      dir.normalize().multiplyScalar(o.radius * rng.range(0.85, 1.15));
      spr.position.copy(dir);
      spr.scale.setScalar(rng.range(o.sizeMin, o.sizeMax));
      spr.renderOrder = -2; // behind stars
      this.group.add(spr);
      this._mats.push(mat);
    }
  }

  dispose() {
    for (const m of this._mats) m.dispose();
  }
}
