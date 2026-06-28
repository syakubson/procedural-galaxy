// Post-processing pipeline.
//
// Renders into a multisampled (MSAA) HalfFloat (HDR) target, so:
//   - additive star/core accumulation can exceed 1.0 (rolled off by ACES below
//     instead of hard-clipping to flat white), and
//   - geometry edges (planets, orbit lines, the star disc) are antialiased.
// The final OutputPass applies ACES tone-mapping + sRGB. No UnrealBloom — its
// 5-level chain is the heaviest effect and the procedural star/core glow plus
// HDR rolloff already cover it.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export class PostFX {
  constructor(renderer, scene, camera, samples = 0) {
    this.renderer = renderer;
    this._samples = samples;
    this.composer = new EffectComposer(renderer, this._makeTarget(samples));
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(new OutputPass()); // tone-map (ACES) + sRGB
  }

  _makeTarget(samples) {
    const size = this.renderer.getSize(new THREE.Vector2());
    return new THREE.WebGLRenderTarget(Math.max(1, size.width), Math.max(1, size.height), {
      type: THREE.HalfFloatType,
      samples,
    });
  }

  /** Toggle MSAA sample count (quality change). 0 = off. */
  setSamples(samples) {
    if (samples === this._samples) return;
    this._samples = samples;
    this.composer.reset(this._makeTarget(samples));
    this.setSize(window.innerWidth, window.innerHeight);
  }

  /** Point the pipeline at a different scene/camera (galaxy <-> system view). */
  setView(scene, camera) {
    this.renderPass.scene = scene;
    this.renderPass.camera = camera;
  }

  setSize(width, height) {
    this.composer.setSize(width, height);
  }

  setPixelRatio(ratio) {
    this.composer.setPixelRatio(ratio);
  }

  render() {
    this.composer.render();
  }

  dispose() {
    this.composer.dispose();
  }
}
