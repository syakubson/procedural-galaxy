// Procedural galaxy geometry.
//
// All stars live in ONE BufferGeometry rendered as a single THREE.Points draw
// call. The disk is built from logarithmic spiral arms with tight-core scatter;
// a separate Gaussian bulge fills the bright centre. Colour is interpolated by
// radius (warm core -> cool rim) with sprinkled hot-blue stars in the arms.

import * as THREE from 'three';
import { createRng } from './rng.js';
import { getPalette } from './palettes.js';
import { starVertexShader, starFragmentShader } from './shaders/starShader.js';

const TAU = Math.PI * 2;

export class Galaxy {
  constructor(config) {
    this.config = config;
    this.points = null;
    this.geometry = null;
    this.material = null;
    this._build();
  }

  _build() {
    const c = this.config;
    const rng = createRng(c.seed);
    const palette = getPalette(c.palette);

    const count = c.starCount;
    const radius = c.radius;
    const coreCount = Math.floor(count * c.coreDensity);
    const diskCount = count - coreCount;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);

    // Reusable colour scratch objects (avoid per-star allocation).
    const cCore = new THREE.Color(palette.core);
    const cInner = new THREE.Color(palette.inner);
    const cOuter = new THREE.Color(palette.outer);
    const cHot = new THREE.Color(palette.hot);
    // arm accents (#14 R/B/Y/V): red + magenta star-forming knots, gold dust,
    // hot blue — sprinkled along the arms for Spore-like multi-colour variety.
    const cRed = new THREE.Color('#ff5a6e');
    const cPink = new THREE.Color('#ff6ec7');
    const cGold = new THREE.Color('#ffd27a');
    const tmp = new THREE.Color();

    let ptr = 0; // index into positions/colors (×3) and sizes/seeds (×1)

    // --- disk: spiral arms ---
    for (let i = 0; i < diskCount; i++) {
      // center-weighted radius (mild, so the arms stay well populated)
      const r = Math.pow(rng.next(), 1.3) * radius;
      const arm = i % c.arms;
      const branch = (arm / c.arms) * TAU;
      const spin = (r / radius) * c.spin; // logarithmic winding
      const angle = branch + spin;

      // tight-core scatter: pow(rand, power) keeps most stars near the arm
      // centre line, with a diffuse halo trailing off.
      const armScatterX = Math.pow(rng.next(), c.randomnessPower) * rng.sign() * c.armWidth * r;
      const armScatterZ = Math.pow(rng.next(), c.randomnessPower) * rng.sign() * c.armWidth * r;
      const fuzzX = (rng.next() - 0.5) * c.randomness * r;
      const fuzzZ = (rng.next() - 0.5) * c.randomness * r;
      const vy =
        Math.pow(rng.next(), c.randomnessPower) *
        rng.sign() *
        c.thickness *
        radius *
        (1.0 - 0.4 * (r / radius));

      const x = Math.cos(angle) * r + armScatterX + fuzzX;
      const z = Math.sin(angle) * r + armScatterZ + fuzzZ;

      positions[ptr * 3 + 0] = x;
      positions[ptr * 3 + 1] = vy;
      positions[ptr * 3 + 2] = z;

      // colour by radius, warm -> cool
      const rNorm = Math.min(r / radius, 1.0);
      tmp.lerpColors(cInner, cOuter, rNorm);
      // sprinkle R/B/Y/V variety onto the arms: red + magenta knots, gold dust, blue
      const roll = rng.next();
      let knot = false;
      if (roll < 0.05) {
        tmp.lerp(cRed, rng.range(0.5, 0.9)); // red star-forming knot
        knot = true;
      } else if (roll < 0.1) {
        tmp.lerp(cPink, rng.range(0.5, 0.85)); // magenta knot
        knot = true;
      } else if (roll < 0.18) {
        tmp.lerp(cGold, rng.range(0.4, 0.8)); // warm gold dust
      } else if (roll < 0.4) {
        tmp.lerp(cHot, rng.range(0.4, 0.85)); // hot blue sparkle
      }
      // brightness variation
      const bright = rng.range(0.55, 1.15);
      colors[ptr * 3 + 0] = tmp.r * bright;
      colors[ptr * 3 + 1] = tmp.g * bright;
      colors[ptr * 3 + 2] = tmp.b * bright;

      // size: mostly small, a few bright foreground sparkles + brighter knots
      let size = rng.range(0.7, 1.3);
      if (knot) size *= rng.range(1.4, 2.2);
      else if (rng.next() < 0.03) size *= rng.range(2.0, 3.4);
      sizes[ptr] = size;
      seeds[ptr] = rng.next();
      ptr++;
    }

    // --- bulge: flattened Gaussian core (#14: wider + softer = a SMEARED,
    // undefined glowing centre rather than a sharp bright dot) ---
    const cr = c.coreSize * radius;
    for (let i = 0; i < coreCount; i++) {
      const x = rng.gauss() * cr * 0.62;
      const z = rng.gauss() * cr * 0.62;
      const y = rng.gauss() * cr * 0.15; // strongly flattened (#2: keep the core thin)

      positions[ptr * 3 + 0] = x;
      positions[ptr * 3 + 1] = y;
      positions[ptr * 3 + 2] = z;

      const d = Math.min(Math.sqrt(x * x + z * z) / cr, 1.0);
      tmp.lerpColors(cCore, cInner, d); // warm centre fading to inner-arm colour
      // softer peak (less concentrated) so the core reads as a haze, not a dot
      const bright = rng.range(0.85, 1.45) * (1.0 + (1.0 - d) * 0.5);
      colors[ptr * 3 + 0] = tmp.r * bright;
      colors[ptr * 3 + 1] = tmp.g * bright;
      colors[ptr * 3 + 2] = tmp.b * bright;

      let size = rng.range(0.9, 1.7);
      if (rng.next() < 0.05) size *= rng.range(1.6, 2.6);
      sizes[ptr] = size;
      seeds[ptr] = rng.next();
      ptr++;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    // Rotation happens in-shader but preserves radius, so a static bounding
    // sphere is correct and lets us skip per-frame bounds recomputation.
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), radius * 1.8);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, // twinkle clock — always advances
        uRotTime: { value: 0 }, // rotation clock — frozen while the user interacts
        uSize: { value: c.starSize },
        uPixelRatio: { value: 1 },
        uRotationSpeed: { value: c.rotationSpeed },
        uDifferential: { value: c.differential },
        uCoreSoft: { value: c.coreSize * radius },
        uTwinkle: { value: c.twinkle },
        uExposure: { value: c.exposure },
        uMaxPointSize: { value: 1024 },
      },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    this.geometry = geometry;
    this.material = material;
    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false; // single centred object; culling is moot
  }

  /** Per-frame: twinkle time + (separately) rotation time + pixel ratio. */
  update(time, rotTime, pixelRatio) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uRotTime.value = rotTime;
    this.material.uniforms.uPixelRatio.value = pixelRatio;
  }

  /** Live tweaks that don't require a geometry rebuild. */
  applyLiveUniforms() {
    const c = this.config;
    const u = this.material.uniforms;
    u.uSize.value = c.starSize;
    u.uRotationSpeed.value = c.rotationSpeed;
    u.uDifferential.value = c.differential;
    u.uTwinkle.value = c.twinkle;
    // overall brightness is driven by renderer.toneMappingExposure, not here
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
