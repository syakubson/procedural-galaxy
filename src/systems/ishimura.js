// The USG Ishimura (#5): a stylised "planetcracker"-class mining starship from
// Dead Space, hovering over Aegis VII. A compact ship, no held cargo.
//
// Modelled from references: a long central spine, twin cylindrical habitation
// pods, a flared forward gravity-tether array, twin rear engine pods, and a
// rust/orange industrial mining-deck. Lit by the directional + ambient light
// systemView adds for it (planets use custom shaders and ignore lights).

import * as THREE from 'three';

export class Ishimura {
  /** @param scale overall length scale (the ship is ~3.4*scale long). */
  constructor(scale = 1) {
    this.group = new THREE.Group();
    this._geos = [];
    this._mats = [];
    const S = scale;

    const hull = new THREE.MeshStandardMaterial({ color: 0x5a5650, roughness: 0.9, metalness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a2824, roughness: 1.0, metalness: 0.3 });
    const rust = new THREE.MeshStandardMaterial({ color: 0xa5642a, roughness: 0.85, metalness: 0.45 });
    const engine = new THREE.MeshBasicMaterial({ color: 0x7fb6ff });
    this._mats.push(hull, dark, rust, engine);

    const add = (geo, mat, x, y, z, rot) => {
      this._geos.push(geo);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
      this.group.add(m);
      return m;
    };

    // ship points along +Z (nose forward). Spine is the structural axis.
    add(new THREE.BoxGeometry(0.22 * S, 0.3 * S, 3.0 * S), hull, 0, 0, 0); // central beam

    // twin cylindrical habitation pods flanking the spine (mid-section)
    for (const sx of [-1, 1]) {
      add(
        new THREE.CylinderGeometry(0.34 * S, 0.34 * S, 1.5 * S, 18),
        hull,
        sx * 0.5 * S,
        0,
        -0.2 * S,
        [Math.PI / 2, 0, 0],
      );
      // pod end caps (darker)
      add(new THREE.CylinderGeometry(0.36 * S, 0.36 * S, 0.12 * S, 18), dark, sx * 0.5 * S, 0, 0.55 * S, [Math.PI / 2, 0, 0]);
      add(new THREE.CylinderGeometry(0.36 * S, 0.36 * S, 0.12 * S, 18), dark, sx * 0.5 * S, 0, -0.95 * S, [Math.PI / 2, 0, 0]);
    }

    // mining deck (rust/orange) on the underside, mid-ship
    add(new THREE.BoxGeometry(1.0 * S, 0.18 * S, 1.2 * S), rust, 0, -0.32 * S, -0.1 * S);

    // forward gravity-tether array: a flared boom + a ring of emitters
    add(new THREE.CylinderGeometry(0.55 * S, 0.22 * S, 0.7 * S, 6), hull, 0, 0, 1.7 * S, [Math.PI / 2, 0, 0]);
    const ringGeo = new THREE.TorusGeometry(0.5 * S, 0.06 * S, 8, 6);
    add(ringGeo, dark, 0, 0, 2.05 * S);
    // four tether emitters around the ring
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      add(new THREE.BoxGeometry(0.1 * S, 0.1 * S, 0.3 * S), dark, Math.cos(a) * 0.5 * S, Math.sin(a) * 0.5 * S, 2.0 * S);
    }

    // twin rear engine pods with glowing bells
    for (const sx of [-1, 1]) {
      add(new THREE.CylinderGeometry(0.26 * S, 0.32 * S, 0.7 * S, 14), dark, sx * 0.34 * S, 0, -1.7 * S, [Math.PI / 2, 0, 0]);
      add(new THREE.CylinderGeometry(0.22 * S, 0.1 * S, 0.18 * S, 14), engine, sx * 0.34 * S, 0, -2.05 * S, [Math.PI / 2, 0, 0]);
    }
  }

  addTo(scene) {
    scene.add(this.group);
  }

  update() {
    // static hull; the engine glow is constant. (No moving parts now.)
  }

  dispose() {
    for (const g of this._geos) g.dispose();
    for (const m of this._mats) m.dispose();
  }
}
