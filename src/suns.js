// The "suns": a small set of larger, vividly coloured stars scattered along
// the spiral arms — each reads as an individual solar system. Full-spectrum
// saturated hues so they pop against the palette. Their own draw call.

import * as THREE from 'three';
import { createRng } from './rng.js';
import { sunVertexShader, sunFragmentShader } from './shaders/sunShader.js';

const TAU = Math.PI * 2;

export class Suns {
  constructor(config) {
    this.config = config;
    this.points = null;
    this._build();
  }

  _build() {
    const c = this.config;
    const rng = createRng(c.seed + '::suns');
    const radius = c.radius;
    const count = c.sunCount;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    const col = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // sit in the populated mid-disk, snapped near an arm — but keep a clear
      // zone around the central black hole (#21): no suns hug the very centre.
      const r = rng.range(0.30, 0.95) * radius;
      const arm = rng.int(0, c.arms - 1);
      const branch = (arm / c.arms) * TAU;
      const spin = (r / radius) * c.spin;
      const angle = branch + spin + rng.gauss() * c.armWidth * 0.5;

      const jitter = c.armWidth * 0.4 * r;
      const x = Math.cos(angle) * r + rng.gauss() * jitter;
      const z = Math.sin(angle) * r + rng.gauss() * jitter;
      const y = rng.gauss() * c.thickness * radius * 0.6;

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // mostly warm orange/amber suns (#15), with a minority of blue-white and
      // yellow for variety — so the galaxy reads orange, not washed-out white.
      const roll = rng.next();
      let hue, sat, light;
      if (roll < 0.72) {
        hue = rng.range(0.02, 0.09); // red-orange → amber
        sat = rng.range(0.85, 1.0);
        light = rng.range(0.48, 0.58);
      } else if (roll < 0.88) {
        hue = rng.range(0.10, 0.15); // golden yellow
        sat = rng.range(0.75, 0.95);
        light = rng.range(0.55, 0.64);
      } else {
        hue = rng.range(0.55, 0.63); // cool blue-white outliers
        sat = rng.range(0.45, 0.75);
        light = rng.range(0.6, 0.7);
      }
      col.setHSL(hue, sat, light);
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      sizes[i] = rng.range(2.6, 5.6);
      seeds[i] = rng.next();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), radius * 1.8);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRotTime: { value: 0 }, // rotation clock — frozen on interaction
        uSize: { value: c.sunSize },
        uPixelRatio: { value: 1 },
        uRotationSpeed: { value: c.rotationSpeed },
        uDifferential: { value: c.differential },
        uCoreSoft: { value: c.coreSize * radius },
        uExposure: { value: c.exposure },
        uMaxPointSize: { value: 1024 },
      },
      vertexShader: sunVertexShader,
      fragmentShader: sunFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    this.geometry = geometry;
    this.material = material;
    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
  }

  update(time, rotTime, pixelRatio) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uRotTime.value = rotTime;
    this.material.uniforms.uPixelRatio.value = pixelRatio;
  }

  applyLiveUniforms() {
    const c = this.config;
    const u = this.material.uniforms;
    u.uSize.value = c.sunSize;
    u.uRotationSpeed.value = c.rotationSpeed;
    u.uDifferential.value = c.differential;
    // overall brightness is driven by renderer.toneMappingExposure, not here
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
