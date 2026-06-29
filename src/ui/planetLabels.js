// Diegetic in-world labels for the system view: a small, low-distraction pill
// floating next to each planet, flagship and orbital structure, projected from
// its 3D position to screen space each frame. Engagement is visual (you SEE what
// is worth looking at), not achievement-UI. The pills are CLICKABLE (#5/#6):
// clicking one focuses + opens that object, exactly like clicking it in 3D.

import * as THREE from 'three';
import { planetLabel, planetMiniDesc, planetAccent, planetStatusIcon, structureCard } from './hud.js';

// every label sub/mini reads as a caption, so it must start with a capital —
// the source strings ('флагман', 'форпост', 'дом цивилизации', …) come in lower-case.
const capFirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export class PlanetLabels {
  constructor(onPick) {
    this.onPick = onPick; // (kind, ref) => void
    this.root = document.createElement('div');
    this.root.id = 'planet-labels';
    document.body.appendChild(this.root);
    this.items = [];
    this._v = new THREE.Vector3();
    this.visible = false;
  }

  /** Build labels for every planet, the flagship(s) and every orbital structure
   *  in the view. `view` is the SystemView (planets + ships + stations). */
  setSystem(view, data) {
    this.clear();
    if (!view || !data || !view.planets) {
      this.setVisible(false);
      return;
    }
    const planets = view.planets;
    planets.forEach((pl, i) => {
      const pd = (data.planets && data.planets[i]) || {};
      const name = pd.label || `${data.name} ${String.fromCharCode(98 + i)}`;
      this._add(pl.body, name, planetLabel(pd), planetMiniDesc(pd), planetAccent(pd), 'planet', pl, planetStatusIcon(pd));
    });
    // flagships only (not every fighter/transport — that would be noise)
    for (const s of view.ships || []) {
      if (s.type && s.type.cat === 'flagship') {
        this._add(s.mesh, s.name || s.type.name, 'флагман', null, '#bcd0ff', 'ship', s, '🛰');
      }
    }
    // orbital structures (stations, gas collectors, hubs)
    for (const pl of planets) {
      if (pl.station) {
        const card = structureCard(pl);
        this._add(pl.station, card.name, card.kindLabel.replace('Станция · ', ''), null, '#bcd0ff', 'structure', pl, '⬡');
      }
    }
    // the battle station (#10)
    if (view.deathStar) {
      this._add(view.deathStar.group, 'Звезда Смерти «Длань»', 'боевая станция', null, '#ffcf6e', 'deathstar', view.deathStar, '✦');
    }
    // the Ishimura planet-cracker (#5)
    if (view.ishimura) {
      this._add(view.ishimura.group, 'USG Ishimura', 'корабль-трещинник', null, '#ffcf6e', 'ishimura', view.ishimura, '✦');
    }
    // the Crew Dragon en route to Mars (#8)
    if (view.dragon) {
      this._add(view.dragon.group, 'Crew Dragon', 'к Марсу', null, '#bcd0ff', 'dragon', view.dragon, '✦');
    }
    this.setVisible(this.items.length > 0);
  }

  _add(body, name, sub, mini, accent, kind, ref, icon) {
    const el = document.createElement('div');
    el.className = 'plabel plabel--' + kind;
    const pin = document.createElement('span');
    pin.className = 'plabel__pin';
    pin.style.background = accent;
    pin.style.boxShadow = `0 0 8px ${accent}`;
    const txt = document.createElement('span');
    txt.className = 'plabel__txt';
    const b = document.createElement('b');
    if (icon) {
      const ic = document.createElement('span');
      ic.className = 'plabel__icon';
      ic.textContent = icon;
      b.appendChild(ic);
    }
    b.appendChild(document.createTextNode(name));
    txt.appendChild(b);
    if (sub) {
      const s = document.createElement('i');
      s.textContent = capFirst(sub);
      txt.appendChild(s);
    }
    if (mini) {
      const m = document.createElement('small');
      m.textContent = capFirst(mini);
      txt.appendChild(m);
    }
    el.append(pin, txt);
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onPick) this.onPick(kind, ref);
    });
    this.root.appendChild(el);
    this.items.push({ el, body, kind });
  }

  setVisible(v) {
    this.visible = v;
    // fade the whole layer (opacity) instead of display:none so toggling labels
    // glides (#3); update() early-returns when hidden, freezing them mid-fade.
    this.root.style.opacity = v ? '1' : '0';
    this.root.style.pointerEvents = v ? '' : 'none';
  }

  clear() {
    for (const it of this.items) it.el.remove();
    this.items = [];
  }

  /** Project each tracked object to screen space and place its label. Called
   *  per-frame in system mode (skipped during the entry zoom to avoid jitter).
   *  `nearCutoff` > 0 means focus mode: only objects within that world-distance
   *  of the camera are labelled (so a close-up shows the focused planet + its
   *  station, not every world). At overview (cutoff 0) the cramped structure
   *  labels are hidden — planets + the flagship carry the scene. */
  update(camera, w, h, nearCutoff = 0, focusedBody = null) {
    if (!this.visible || !this.items.length) return;
    const overview = nearCutoff <= 0;
    const vis = [];
    for (const it of this.items) {
      // the focused object carries its info in the side callout, so hide its
      // own in-world label to keep the reticle clean (#15)
      if (!it.body || it.body === focusedBody) {
        it.el.classList.add('is-hidden');
        continue;
      }
      // declutter: structures only show up close (#6); never at overview
      if (overview && it.kind === 'structure') {
        it.el.classList.add('is-hidden');
        continue;
      }
      it.body.getWorldPosition(this._v);
      if (!overview && camera.position.distanceTo(this._v) > nearCutoff) {
        it.el.classList.add('is-hidden'); // too far for this close-up
        continue;
      }
      this._v.project(camera);
      if (this._v.z >= 1) {
        it.el.classList.add('is-hidden'); // behind the camera
        continue;
      }
      it.sx = (this._v.x * 0.5 + 0.5) * w;
      it.sy = (-this._v.y * 0.5 + 0.5) * h;
      it.el.classList.remove('is-hidden');
      vis.push(it);
    }
    // de-overlap: nudge labels that land too close apart in Y (a few relaxation
    // passes). Cheap — no DOM measuring, just constants for the pill footprint.
    const MIN_DX = 158;
    const MIN_DY = 38;
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
