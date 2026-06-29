// A stylised SpaceX Crew Dragon (#8): a gumdrop capsule (pale hull, dark nose)
// on a cylindrical trunk with two solar-panel wings + an engine glow. Tiny — a
// real near-future craft among the alien fleets. The nose points down +Z, so the
// caller can just lookAt(Mars) to aim it forward.

import * as THREE from 'three';

// shared, never-disposed singletons (one Dragon per system, models are reused)
let _hull, _dark, _panel, _glow, _capGeo, _noseGeo, _trunkGeo, _panelGeo;
const hull = () => (_hull || (_hull = new THREE.MeshBasicMaterial({ color: 0xe9ebf0 })));
const dark = () => (_dark || (_dark = new THREE.MeshBasicMaterial({ color: 0x23252b })));
const panel = () => (_panel || (_panel = new THREE.MeshBasicMaterial({ color: 0x1b3a6b, side: THREE.DoubleSide })));
const glow = () => (_glow || (_glow = new THREE.MeshBasicMaterial({ color: 0x8fd0ff })));
const capGeo = () => (_capGeo || (_capGeo = new THREE.CylinderGeometry(0.16, 0.3, 0.42, 16)));
const noseGeo = () => (_noseGeo || (_noseGeo = new THREE.SphereGeometry(0.16, 12, 10)));
const trunkGeo = () => (_trunkGeo || (_trunkGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.36, 16)));
const panelGeo = () => (_panelGeo || (_panelGeo = new THREE.BoxGeometry(0.66, 0.012, 0.3)));

export class Dragon {
  /** @param {number} scale overall size. */
  constructor(scale = 1) {
    this.group = new THREE.Group();
    const s = scale;

    // capsule body — a truncated cone, axis rotated from Y to Z (nose toward +Z)
    const cap = new THREE.Mesh(capGeo(), hull());
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.12 * s;
    cap.scale.setScalar(s);
    this.group.add(cap);

    // dark nose cap (docking adapter)
    const nose = new THREE.Mesh(noseGeo(), dark());
    nose.position.z = 0.34 * s;
    nose.scale.set(s, s * 0.7, s);
    this.group.add(nose);

    // trunk behind the capsule
    const trunk = new THREE.Mesh(trunkGeo(), dark());
    trunk.rotation.x = Math.PI / 2;
    trunk.position.z = -0.22 * s;
    trunk.scale.setScalar(s);
    this.group.add(trunk);

    // two solar-panel wings on the trunk
    for (const dir of [-1, 1]) {
      const p = new THREE.Mesh(panelGeo(), panel());
      p.position.set(dir * 0.48 * s, 0, -0.22 * s);
      p.scale.setScalar(s);
      this.group.add(p);
    }

    // engine glow at the aft
    const flame = new THREE.Mesh(noseGeo(), glow());
    flame.position.z = -0.44 * s;
    flame.scale.set(s * 0.5, s * 0.5, s * 0.9);
    this.group.add(flame);

    this.scale = scale;
  }

  addTo(scene) {
    scene.add(this.group);
  }

  // position + orientation are driven by systemView (Earth → Mars transit)
  update() {}

  dispose() {
    // geometries/materials are shared module singletons — nothing per-instance
  }
}
