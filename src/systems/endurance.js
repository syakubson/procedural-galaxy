// A stylised "Endurance" (Interstellar) spacecraft: a wheel of 12 boxy modules
// around a central docking hub. The ring spins about its axis (~5.6 rpm) for
// artificial gravity; the whole craft slowly orbits the black hole (driven by
// systemView). NASA-ish white/grey hull with gold thermal-foil accents.

import * as THREE from 'three';

// Shared materials (unlit, but with subtly different shades so the wheel reads
// as 3D); never disposed.
let _hull, _gold, _dark, _glow, _box, _conn, _hub, _dock;
const hull = () => (_hull || (_hull = new THREE.MeshBasicMaterial({ color: 0xdcdde2 })));
const gold = () => (_gold || (_gold = new THREE.MeshBasicMaterial({ color: 0xc9a24b })));
const dark = () => (_dark || (_dark = new THREE.MeshBasicMaterial({ color: 0x2b2d30 })));
const glow = () => (_glow || (_glow = new THREE.MeshBasicMaterial({ color: 0x8fd0ff })));
const boxGeo = () => (_box || (_box = new THREE.BoxGeometry(0.42, 0.34, 0.5)));
const connGeo = () => (_conn || (_conn = new THREE.BoxGeometry(0.16, 0.14, 0.28)));
const hubGeo = () => (_hub || (_hub = new THREE.CylinderGeometry(0.18, 0.18, 0.7, 12)));
const dockGeo = () => (_dock || (_dock = new THREE.BoxGeometry(0.26, 0.12, 0.26)));

export class Endurance {
  /** @param {number} scale overall size (wheel radius ≈ scale). */
  constructor(scale = 1) {
    this.group = new THREE.Group(); // whole craft (orbits the hole)
    this.ring = new THREE.Group(); // spins for gravity
    this.group.add(this.ring);

    const N = 12;
    const R = scale;
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2;
      const x = Math.cos(ang) * R;
      const z = Math.sin(ang) * R;

      // a module box, every 3rd module is gold (engine/cargo accent)
      const mat = i % 3 === 0 ? gold() : hull();
      const m = new THREE.Mesh(boxGeo(), mat);
      m.scale.setScalar(scale);
      m.position.set(x, 0, z);
      m.lookAt(0, 0, 0); // face the hub so boxes sit tangentially
      this.ring.add(m);

      // a small running light on the rim
      const light = new THREE.Mesh(dockGeo(), glow());
      light.scale.setScalar(scale * 0.4);
      light.position.set(Math.cos(ang) * R * 1.06, 0, Math.sin(ang) * R * 1.06);
      this.ring.add(light);

      // a connector tunnel toward the next module
      const ang2 = ((i + 0.5) / N) * Math.PI * 2;
      const conn = new THREE.Mesh(connGeo(), dark());
      conn.scale.setScalar(scale);
      conn.position.set(Math.cos(ang2) * R, 0, Math.sin(ang2) * R);
      conn.lookAt(0, 0, 0);
      this.ring.add(conn);
    }

    // central docking hub on the spin axis (does NOT spin with the ring)
    const hubMesh = new THREE.Mesh(hubGeo(), hull());
    hubMesh.scale.setScalar(scale);
    this.group.add(hubMesh);
    const d1 = new THREE.Mesh(dockGeo(), dark());
    d1.scale.setScalar(scale);
    d1.position.set(0, scale * 0.42, 0);
    this.group.add(d1);

    this.scale = scale;
  }

  addTo(scene) {
    scene.add(this.group);
  }

  /** dt for the gravity spin; position/orientation is set by the caller. */
  update(dt) {
    this.ring.rotation.y += dt * 0.5; // steady, readable turn (~5 rpm)
  }

  dispose() {
    // geometries/materials are shared module singletons — nothing per-instance
  }
}
