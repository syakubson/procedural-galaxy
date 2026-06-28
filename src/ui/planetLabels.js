// Diegetic in-world planet labels for the system view: a small, low-distraction
// pill floating next to each planet, projected from its 3D position to screen
// space each frame. Engagement is visual (you SEE what's worth looking at), not
// achievement-UI. Plain DOM positioned by THREE projection; no per-planet meshes.

import * as THREE from 'three';
import { planetLabel } from './hud.js';

export class PlanetLabels {
  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'planet-labels';
    this.root.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.root);
    this.items = [];
    this._v = new THREE.Vector3();
    this.visible = false;
  }

  /** Build one label per planet, named `<System> b/c/d…` (or the hand-named
   *  label for special systems), with a muted type/biome sub-line. */
  setSystem(planets, data) {
    this.clear();
    if (!data || !planets || !planets.length) {
      this.setVisible(false);
      return;
    }
    planets.forEach((pl, i) => {
      const pd = (data.planets && data.planets[i]) || {};
      const name = pd.label || `${data.name} ${String.fromCharCode(98 + i)}`;
      const sub = planetLabel(pd);
      const el = document.createElement('div');
      el.className = 'plabel';
      const pin = document.createElement('span');
      pin.className = 'plabel__pin';
      const txt = document.createElement('span');
      txt.className = 'plabel__txt';
      const b = document.createElement('b');
      b.textContent = name;
      txt.appendChild(b);
      if (sub && sub !== name) {
        const s = document.createElement('i');
        s.textContent = sub;
        txt.appendChild(s);
      }
      el.append(pin, txt);
      this.root.appendChild(el);
      this.items.push({ el, body: pl.body });
    });
    this.setVisible(true);
  }

  setVisible(v) {
    this.visible = v;
    this.root.style.display = v ? '' : 'none';
  }

  clear() {
    for (const it of this.items) it.el.remove();
    this.items = [];
  }

  /** Project each planet to screen space and place its label. Called per-frame
   *  in system mode (skipped during the entry zoom to avoid jitter). */
  update(camera, w, h) {
    if (!this.visible || !this.items.length) return;
    const vis = [];
    for (const it of this.items) {
      if (!it.body) {
        it.el.style.display = 'none';
        continue;
      }
      it.body.getWorldPosition(this._v);
      this._v.project(camera);
      if (this._v.z >= 1) {
        it.el.style.display = 'none'; // behind the camera
        continue;
      }
      it.sx = (this._v.x * 0.5 + 0.5) * w;
      it.sy = (-this._v.y * 0.5 + 0.5) * h;
      it.el.style.display = '';
      vis.push(it);
    }
    // de-overlap: nudge labels that land too close apart in Y (a few relaxation
    // passes). Cheap — no DOM measuring, just constants for the pill footprint.
    const MIN_DX = 158;
    const MIN_DY = 36;
    vis.sort((a, b) => a.sy - b.sy);
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < vis.length; i++) {
        for (let j = i + 1; j < vis.length; j++) {
          const a = vis[i];
          const b = vis[j];
          const dy = b.sy - a.sy;
          if (Math.abs(a.sx - b.sx) < MIN_DX && dy < MIN_DY) {
            const push = (MIN_DY - dy) / 2 + 0.5;
            a.sy -= push;
            b.sy += push;
          }
        }
      }
    }
    for (const it of vis) {
      it.el.style.transform = `translate(${Math.round(it.sx)}px, ${Math.round(it.sy)}px)`;
    }
  }
}
