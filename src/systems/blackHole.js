// A stylised black hole: a true-black event-horizon sphere, a flat accretion
// disk, a vertical "lensing" copy of the disk that fakes the light wrapping
// over and under the silhouette (the Interstellar / Gargantua look), and a
// thin bright photon ring hugging the shadow. No GR ray-marching — the disk
// shader + additive blending + ACES tone-mapping do the work.

import * as THREE from 'three';
import { diskVertexShader, diskFragmentShader } from '../shaders/blackHoleShader.js';

const col = (hex) => new THREE.Color(hex);

export class BlackHole {
  /**
   * @param {object} o
   *   radius   horizon radius
   *   inner/outer  disk radii (in world units)
   *   beta     Doppler beaming (0 = symmetric Gargantua look)
   *   colors   {in, mid, out} disk temperature ramp
   *   tilt     rig tilt toward camera (radians)
   */
  constructor(o = {}) {
    const R = o.radius || 6;
    const inner = o.inner || R * 1.6;
    const outer = o.outer || R * 5.5;
    const colors = o.colors || { in: '#fff1d0', mid: '#f2a93b', out: '#7a2206' };

    this.group = new THREE.Group();
    this.group.rotation.x = o.tilt != null ? o.tilt : -0.32; // 3/4 view

    // event horizon — pure black, writes depth so it occludes the far disk
    this._horizonGeo = new THREE.SphereGeometry(R, 48, 48);
    const horizon = new THREE.Mesh(this._horizonGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    this._horizonMat = horizon.material;
    this.group.add(horizon);

    // disk material — a flat equatorial copy and a vertical "lensing" copy that
    // shows only its top/bottom arcs (uVertical fades the equatorial sides).
    const mkDiskMat = (vertical, ri, ro) =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uInner: { value: ri },
          uOuter: { value: ro },
          uBeta: { value: o.beta != null ? o.beta : 0.0 },
          uSpin: { value: 1 },
          uVertical: { value: vertical },
          uColIn: { value: col(colors.in) },
          uColMid: { value: col(colors.mid) },
          uColOut: { value: col(colors.out) },
        },
        vertexShader: diskVertexShader,
        fragmentShader: diskFragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      });

    // TWO distinct light rings (#5): a big horizontal accretion disk and a
    // clearly SMALLER vertical "lensed" ring rising over and under the hole.
    const lensInner = inner * 0.82;
    const lensOuter = outer * 0.55;
    this.diskMat = mkDiskMat(0, inner, outer);
    this.lensMat = mkDiskMat(1, lensInner, lensOuter);

    this._diskGeo = new THREE.RingGeometry(inner, outer, 200, 6);
    const flat = new THREE.Mesh(this._diskGeo, this.diskMat);
    flat.rotation.x = -Math.PI / 2; // equatorial plane
    this.group.add(flat);

    // vertical copy (smaller) → its top & bottom arcs read as the lensed light
    // wrapping over and under the hole
    this._lensGeo = new THREE.RingGeometry(lensInner, lensOuter, 200, 6);
    const lens = new THREE.Mesh(this._lensGeo, this.lensMat);
    this.group.add(lens);

    // photon ring — a thin bright camera-facing circle just outside the shadow
    const ringSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: photonRingTexture(),
        color: 0xfff6e0,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    ringSprite.scale.setScalar(R * 2.4);
    this._ringMat = ringSprite.material;
    this.group.add(ringSprite);
  }

  addTo(scene) {
    scene.add(this.group);
  }

  update(time) {
    this.diskMat.uniforms.uTime.value = time;
    this.lensMat.uniforms.uTime.value = time;
  }

  dispose() {
    this._horizonGeo.dispose();
    this._horizonMat.dispose();
    this.diskMat.dispose();
    this.lensMat.dispose();
    this._diskGeo.dispose();
    this._lensGeo.dispose();
    this._ringMat.dispose();
  }
}

// Thin bright ring texture for the photon ring (shared singleton).
let _ringTex;
function photonRingTexture() {
  if (_ringTex) return _ringTex;
  const s = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  ctx.lineWidth = s * 0.013;
  ctx.strokeStyle = 'rgba(255,250,236,1)';
  ctx.shadowColor = 'rgba(255,244,224,0.9)';
  ctx.shadowBlur = s * 0.03;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s * 0.45, 0, Math.PI * 2);
  ctx.stroke();
  _ringTex = new THREE.CanvasTexture(cv);
  _ringTex.colorSpace = THREE.SRGBColorSpace;
  return _ringTex;
}
