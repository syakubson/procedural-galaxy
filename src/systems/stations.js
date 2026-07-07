// Orbital stations, now FACTION-STYLED (#11 follow-up). Three kinds — ring hub,
// colony outpost, gas-giant collector — built from the faction's palette via the
// shared style toolkit, then given an optional faction signature through
// `style.station(grp, type, style)`. So each civilisation's stations look unique,
// matching its fleet. Baked to a few draw calls; the ring's habitat wheel is
// kept separate so it can still spin.

import * as THREE from 'three';
import { C, NAV, bake } from './ships/style.js';
import { ALLIANCE } from './ships/factions.js';

const _geo = {};
const g = (k, make) => (_geo[k] || (_geo[k] = make()));
const mesh = (geo, m, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  return o;
};
const navMesh = (style, which, r) => mesh(g('navL' + r, () => new THREE.SphereGeometry(r, 6, 6)), NAV(style, which));

// Two solar arrays on a transverse mast through the hub (along ±X).
function solarMast(style) {
  const grp = new THREE.Group();
  grp.add(mesh(g('stMast', () => new THREE.BoxGeometry(3.0, 0.04, 0.04)), C(style, 'accent')));
  const pgeo = g('stPanel', () => new THREE.BoxGeometry(1.1, 0.015, 0.7));
  for (const x of [-1.4, 1.4]) grp.add(mesh(pgeo, C(style, 'dark'), x, 0, 0));
  return grp;
}

/** Ring habitat wheel (home world). The wheel spins about its Z axis. */
function makeRing(style) {
  const s = new THREE.Group();
  const hub = mesh(g('stHub', () => new THREE.CylinderGeometry(0.18, 0.18, 0.7, 12)), C(style, 'hull'));
  hub.rotation.x = Math.PI / 2;
  s.add(hub);

  const wheel = new THREE.Group();
  wheel.add(mesh(g('stRing', () => new THREE.TorusGeometry(1.0, 0.085, 10, 40)), C(style, 'hull')));
  const modGeo = g('stMod', () => new THREE.BoxGeometry(0.22, 0.16, 0.16));
  const N = 8;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const m = mesh(modGeo, i % 2 ? C(style, 'accent') : C(style, 'hull2'), Math.cos(a), Math.sin(a), 0);
    m.lookAt(0, 0, 0);
    wheel.add(m);
  }
  const spokeGeo = g('stSpoke', () => new THREE.BoxGeometry(0.035, 1.0, 0.035));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const sp = mesh(spokeGeo, C(style, 'accent'), Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0);
    sp.rotation.z = a + Math.PI / 2;
    wheel.add(sp);
  }
  const r = navMesh(style, 'star', 0.05);
  r.position.set(1.0, 0, 0.1);
  wheel.add(r);
  const grnL = navMesh(style, 'port', 0.05);
  grnL.position.set(-1.0, 0, -0.1);
  wheel.add(grnL);
  s.add(wheel);
  s.userData.spin = wheel;

  s.add(solarMast(style));
  const dish = mesh(g('stDish', () => new THREE.ConeGeometry(0.14, 0.12, 10, 1, true)), C(style, 'accent'), 0, 0, 0.42);
  dish.rotation.x = -Math.PI / 2;
  s.add(dish);
  return s;
}

/** Small modular colony outpost (sister world). */
function makeOutpost(style) {
  const s = new THREE.Group();
  const core = mesh(g('opCore', () => new THREE.CylinderGeometry(0.3, 0.3, 0.7, 10)), C(style, 'hull'));
  core.rotation.z = Math.PI / 2;
  s.add(core);
  const podGeo = g('opPod', () => new THREE.BoxGeometry(0.34, 0.3, 0.3));
  s.add(mesh(podGeo, C(style, 'accent'), 0, 0.34, 0.1));
  const p2 = mesh(podGeo, C(style, 'hull2'), 0, -0.3, -0.12);
  p2.scale.setScalar(0.8);
  s.add(p2);
  s.add(mesh(g('opArm', () => new THREE.BoxGeometry(0.9, 0.03, 0.03)), C(style, 'accent'), 0.6, 0, 0));
  s.add(mesh(g('opWing', () => new THREE.BoxGeometry(0.7, 0.015, 0.5)), C(style, 'dark'), 1.1, 0, 0));
  s.add(mesh(g('opMast', () => new THREE.BoxGeometry(0.02, 0.5, 0.02)), C(style, 'accent'), 0, 0.5, 0));
  const lite = navMesh(style, 'star', 0.05);
  lite.position.set(0, 0.78, 0);
  s.add(lite);
  return s;
}

/** Gas-giant skimmer — a big downward intake funnel + storage tanks + frame. */
function makeCollector(style) {
  const s = new THREE.Group();
  const funnel = mesh(g('coFunnel', () => new THREE.ConeGeometry(0.9, 0.9, 16, 1, true)), C(style, 'accent'), 0, -0.5, 0);
  s.add(funnel);
  s.add(mesh(g('coThroat', () => new THREE.CylinderGeometry(0.18, 0.18, 0.4, 12)), C(style, 'hull')));
  const tankGeo = g('coTank', () => new THREE.SphereGeometry(0.26, 12, 10));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    s.add(mesh(tankGeo, C(style, 'hull2'), Math.cos(a) * 0.55, 0.35, Math.sin(a) * 0.55));
    const strut = mesh(g('coStrut', () => new THREE.BoxGeometry(0.04, 0.04, 0.55)), C(style, 'accent'), Math.cos(a) * 0.3, 0.3, Math.sin(a) * 0.3);
    strut.lookAt(Math.cos(a) * 0.55, 0.35, Math.sin(a) * 0.55);
    s.add(strut);
  }
  s.add(solarMast(style));
  s.add(mesh(g('coMast', () => new THREE.BoxGeometry(0.03, 0.5, 0.03)), C(style, 'accent'), 0, 0.7, 0));
  const lite = navMesh(style, 'star', 0.06);
  lite.position.y = 0.95;
  s.add(lite);
  return s;
}

export const STATION_TYPES = [
  { id: 'ring', name: 'Хаб (родной мир)' },
  { id: 'outpost', name: 'Колониальный аванпост' },
  { id: 'collector', name: 'Газосборщик' },
];

// shared fallback builders (used when a faction provides no bespoke station)
const DEFAULT_MAKE = { ring: makeRing, outpost: makeOutpost, collector: makeCollector };

/**
 * @param {'ring'|'outpost'|'collector'} type
 * @param {number} scale  overall size (canonical extent ≈ 1 ring-radius unit)
 * @param {object} [style] faction style-kit (defaults to Alliance)
 * @returns {THREE.Group} with optional `userData.spin` to rotate per frame.
 *
 * A faction may supply BESPOKE station builders (completely different geometry)
 * via `style.stations[type]`; otherwise the shared shape is used, faction-coloured.
 * An optional `style.station(grp,type,style)` adds a final signature flourish.
 */
export function createStation(type, scale = 1, style) {
  const st = style || ALLIANCE;
  const make = (st.stations && st.stations[type]) || DEFAULT_MAKE[type] || makeRing;
  const raw = make(st);
  // optional faction signature on the station (beacons, plating, banners…)
  if (typeof st.station === 'function') st.station(raw, type, st);
  // bake to a few draw calls; keep the habitat wheel separate so it can spin
  const spin = raw.userData.spin;
  let out;
  if (spin) {
    raw.remove(spin);
    out = bake(raw);
    const wheel = bake(spin);
    out.add(wheel);
    out.userData.spin = wheel;
  } else {
    out = bake(raw);
  }
  // Optional wheel spin axis ('y' for a horizontal carousel); default handled by
  // the system view. Undefined for the usual vertical (Z) habitat wheels.
  out.userData.spinAxis = raw.userData.spinAxis;
  out.scale.setScalar(scale);
  return out;
}
