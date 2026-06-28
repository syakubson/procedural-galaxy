// A "Death Star"-style battle station (#12): an armoured moon-sized sphere with
// an equatorial trench, a few latitude panel grooves, and a concave superlaser
// dish with a green focus emitter. Lightly anonymised. Lit by a directional +
// ambient light added in systemView._loadDeathStar (the only lit object there).

import * as THREE from 'three';

export class DeathStar {
  constructor(radius = 8) {
    const R = radius;
    this.group = new THREE.Group();
    this._geos = [];

    const hull = new THREE.MeshStandardMaterial({ color: 0x9498a0, roughness: 0.85, metalness: 0.35 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x33363c, roughness: 1.0, metalness: 0.2 });

    // armoured sphere
    const bodyGeo = new THREE.SphereGeometry(R, 64, 48);
    this._geos.push(bodyGeo);
    this.group.add(new THREE.Mesh(bodyGeo, hull));

    // equatorial trench
    const trGeo = new THREE.TorusGeometry(R * 1.002, R * 0.03, 10, 96);
    this._geos.push(trGeo);
    const trench = new THREE.Mesh(trGeo, dark);
    trench.rotation.x = Math.PI / 2;
    this.group.add(trench);

    // a few latitude panel grooves
    for (const lat of [0.45, -0.5, -0.95]) {
      const rr = R * Math.cos(lat);
      const gGeo = new THREE.TorusGeometry(rr, R * 0.012, 8, 80);
      this._geos.push(gGeo);
      const ring = new THREE.Mesh(gGeo, dark);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = R * Math.sin(lat);
      this.group.add(ring);
    }

    // superlaser dish (concave) on the upper-front hemisphere
    const dir = new THREE.Vector3(0.42, 0.5, 0.75).normalize();
    const dishGeo = new THREE.CircleGeometry(R * 0.32, 48);
    this._geos.push(dishGeo);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0x4a4d54, roughness: 1, side: THREE.DoubleSide });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.copy(dir).multiplyScalar(R * 0.95);
    dish.lookAt(dir.clone().multiplyScalar(R * 3));
    this.group.add(dish);

    const dishRingGeo = new THREE.TorusGeometry(R * 0.32, R * 0.025, 8, 48);
    this._geos.push(dishRingGeo);
    const dishRing = new THREE.Mesh(dishRingGeo, dark);
    dishRing.position.copy(dish.position);
    dishRing.quaternion.copy(dish.quaternion);
    this.group.add(dishRing);

    // green superlaser focus emitter
    const focusGeo = new THREE.SphereGeometry(R * 0.055, 14, 14);
    this._geos.push(focusGeo);
    const focusMat = new THREE.MeshBasicMaterial({ color: 0x86ff5a });
    const focus = new THREE.Mesh(focusGeo, focusMat);
    focus.position.copy(dir).multiplyScalar(R * 0.9);
    this.group.add(focus);

    this._mats = [hull, dark, dishMat, focusMat];
  }

  addTo(scene) {
    scene.add(this.group);
  }

  update(dt) {
    this.group.rotation.y += dt * 0.05; // slow, ominous spin
  }

  dispose() {
    for (const g of this._geos) g.dispose();
    for (const m of this._mats) m.dispose();
  }
}
