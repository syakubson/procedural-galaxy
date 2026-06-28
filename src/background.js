// Deep-space background: a static far star field (distant pinpoints filling the
// void) plus the flat nebula gas disk. Both are cheap — the star field is a
// single built-in Points material, the nebula a single shader disk.

import * as THREE from 'three';
import { createRng } from './rng.js';
import { getPalette } from './palettes.js';
import {
  nebulaVertexShader,
  nebulaFragmentShader,
} from './shaders/nebulaShader.js';
import { NebulaClouds } from './nebulaClouds.js';

export class Background {
  constructor(config) {
    this.config = config;
    this.group = new THREE.Group();
    this._buildStarfield();
    this._buildNebula();
    this._buildNebulaClouds();
    this._buildSkybox();
  }

  // Optional deep-space nebula SKYBOX for the galaxy view (#4). Drop an
  // equirectangular image at `textures/galaxy_skybox.jpg` and it appears as the
  // backdrop (and the procedural nebula clouds hide to avoid doubling). No file
  // → nothing happens, the procedural background stays.
  _buildSkybox() {
    const geo = new THREE.SphereGeometry(this.config.radius * 12, 48, 32);
    const mat = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      color: 0x9c9caa, // same dimmed procedural nebula as the system view
      depthWrite: false,
      fog: false,
    });
    const sky = new THREE.Mesh(geo, mat);
    sky.renderOrder = -3;
    sky.frustumCulled = false;
    sky.visible = false; // shown only once a texture actually loads
    this.group.add(sky);
    this._skyGeo = geo;
    this._skyMat = mat;
    new THREE.TextureLoader().load(
      'textures/galaxy_skybox.jpg',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        mat.map = tex;
        mat.needsUpdate = true;
        sky.visible = true;
        if (this.nebulaClouds) this.nebulaClouds.group.visible = false;
      },
      undefined,
      () => {}, // no file: keep the procedural background
    );
  }

  _buildNebulaClouds() {
    const c = this.config;
    // coloured nebula patches in the deep background around the disk (#3)
    this.nebulaClouds = new NebulaClouds({
      seed: c.seed + '::clouds',
      count: 9,
      radius: c.radius * 4.5,
      sizeMin: c.radius * 1.8,
      sizeMax: c.radius * 3.6,
      opacity: 0.34,
      flatten: 0.65, // hug the galactic plane somewhat, but still fill the void
    });
    this.group.add(this.nebulaClouds.group);
  }

  _buildStarfield() {
    const c = this.config;
    const rng = createRng(c.seed + '::field');
    const n = c.backgroundStars;
    const shell = c.radius * 9; // far away, behind everything

    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const col = new THREE.Color();

    for (let i = 0; i < n; i++) {
      // uniform direction on a sphere
      const u = rng.next();
      const v = rng.next();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const rr = shell * (0.7 + rng.next() * 0.3);
      positions[i * 3 + 0] = rr * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = rr * Math.cos(phi);
      positions[i * 3 + 2] = rr * Math.sin(phi) * Math.sin(theta);

      // mostly cool-white, a few warm — faint
      const hue = rng.next() < 0.5 ? rng.range(0.55, 0.66) : rng.range(0.05, 0.12);
      col.setHSL(hue, rng.range(0.0, 0.4), rng.range(0.6, 0.97));
      const dim = rng.range(0.4, 1.05);
      colors[i * 3 + 0] = col.r * dim;
      colors[i * 3 + 1] = col.g * dim;
      colors[i * 3 + 2] = col.b * dim;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.6,
      sizeAttenuation: false, // crisp constant-size distant pinpoints
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.starfieldGeo = geo;
    this.starfieldMat = mat;
    this.starfield = new THREE.Points(geo, mat);
    this.starfield.frustumCulled = false;
    this.group.add(this.starfield);
  }

  _buildNebula() {
    const c = this.config;
    const palette = getPalette(c.palette);
    // EXACTLY the galaxy radius — so the nebula's normalised radius matches the
    // star vertex shader's world radius / radius, making the gas arms' winding +
    // differential rotation identical to the stars' (no drift apart, #2).
    const nr = c.radius;

    const geo = new THREE.CircleGeometry(nr, 96);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRadius: { value: nr },
        uIntensity: { value: c.nebula ? c.nebulaIntensity : 0.0 },
        uArms: { value: c.arms },
        uSpin: { value: c.spin },
        uSwirl: { value: 0.02 },
        uCoreSize: { value: c.coreSize * 1.6 },
        uRotationSpeed: { value: c.rotationSpeed },
        uDifferential: { value: c.differential },
        uCoreSoftN: { value: c.coreSize },
        uColorCore: { value: new THREE.Color(palette.nebula.core) },
        uColorMid: { value: new THREE.Color(palette.nebula.mid) },
        uColorEdge: { value: new THREE.Color(palette.nebula.edge) },
      },
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2; // lay the disk flat into the galaxy plane
    mesh.renderOrder = -1; // draw behind the stars
    mesh.frustumCulled = false;

    this.nebulaGeo = geo;
    this.nebulaMat = mat;
    this.nebula = mesh;
    this.group.add(mesh);
  }

  update(time) {
    this.nebulaMat.uniforms.uTime.value = time;
  }

  applyLiveUniforms() {
    const c = this.config;
    this.nebulaMat.uniforms.uIntensity.value = c.nebula ? c.nebulaIntensity : 0.0;
    this.nebulaMat.uniforms.uRotationSpeed.value = c.rotationSpeed;
    this.nebulaMat.uniforms.uDifferential.value = c.differential;
  }

  dispose() {
    this.starfieldGeo.dispose();
    this.starfieldMat.dispose();
    this.nebulaGeo.dispose();
    this.nebulaMat.dispose();
    if (this.nebulaClouds) this.nebulaClouds.dispose();
    if (this._skyGeo) this._skyGeo.dispose();
    if (this._skyMat) {
      if (this._skyMat.map) this._skyMat.map.dispose();
      this._skyMat.dispose();
    }
  }
}
