// Ship style toolkit (#11, role×faction matrix). A ship = a ROLE builder (the
// silhouette + greebles + size) parameterised by a FACTION style-kit (palette,
// signature accent, engine/nav colours). This file holds the shared geometry
// cache, the per-style material cache, and the detail helpers (engine glow,
// running lights, antennas, lit windows, wedge hull) that every role builder
// draws from. Geometry is style-independent and shared; materials are cached
// per (faction, slot) so each faction gets its own colours without re-allocating.

import * as THREE from 'three';

// --- per-faction material cache -------------------------------------------
const _mats = {};
function smat(style, slot, hex, extra) {
  const key = style.id + ':' + slot;
  return _mats[key] || (_mats[key] = new THREE.MeshBasicMaterial(Object.assign({ color: hex }, extra)));
}
const ADD = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };

/** Hull/structure colour from the faction palette (slot: hull|hull2|accent|dark|glass|gold). */
export const C = (style, slot) => smat(style, slot, style.colors[slot]);
/** The faction signature accent (stripes, fins, markings). */
export const ACC = (style) => smat(style, 'sig', style.accent);
/** Additive engine-glow colour. */
export const GLOW = (style) => smat(style, 'glow', style.glow, ADD);
/** Additive running-light colour (which: port|star|top). */
export const NAV = (style, which) => smat(style, 'nav_' + which, style.nav[which], ADD);

// --- shared geometry cache (style-independent) -----------------------------
const _geo = {};
export const g = (key, make) => (_geo[key] || (_geo[key] = make()));
export const box = (sx, sy, sz) => g(`b${sx}_${sy}_${sz}`, () => new THREE.BoxGeometry(sx, sy, sz));
export const cyl = (r1, r2, h, s = 8) => g(`c${r1}_${r2}_${h}_${s}`, () => new THREE.CylinderGeometry(r1, r2, h, s));
export const sph = (r, s = 8) => g(`s${r}_${s}`, () => new THREE.SphereGeometry(r, s, s));
export const cone = (r, h, s = 10) => g(`k${r}_${h}_${s}`, () => new THREE.ConeGeometry(r, h, s));

// --- mesh helpers ----------------------------------------------------------
// A fresh Group — lets bespoke per-faction builders create their root without
// importing THREE (so faction files stay THREE-free, just like flourish hooks).
export const group = () => new THREE.Group();

export function part(geo, m, x, y, z) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  return mesh;
}
// create + position + rotate + add, returning the MESH. (group.add returns the
// group, so never chain `.rotation` off group.add(...).)
export function addRot(grp, geo, m, x, y, z, rx = 0, ry = 0, rz = 0) {
  const mesh = part(geo, m, x, y, z);
  mesh.rotation.set(rx, ry, rz);
  grp.add(mesh);
  return mesh;
}
export function engineGlow(grp, style, x, y, z, r) {
  const m = part(sph(r), GLOW(style), x, y, z);
  m.scale.z = 1.7;
  grp.add(m);
}
export function navLight(grp, style, which, x, y, z, r = 0.012) {
  grp.add(part(sph(r, 6), NAV(style, which), x, y, z));
}
export function runningLights(grp, style, halfW, y, z) {
  navLight(grp, style, 'port', -halfW, y, z);
  navLight(grp, style, 'star', halfW, y, z);
}
export function antenna(grp, style, x, y, z, len) {
  grp.add(part(box(0.006, len, 0.006), C(style, 'accent'), x, y + len / 2, z));
  navLight(grp, style, 'top', x, y + len, z, 0.008);
}

// Bake a built ship/station group (dozens of small unlit meshes) down to TWO
// draw calls: one opaque mesh + one additive mesh, with each part's material
// colour written into a vertex-colour attribute. This is the key optimisation —
// a detailed ship costs ~2 draw calls instead of ~25, so a whole fleet stays
// cheap. Shared source geometries are never mutated (we clone/expand); the
// per-bake clones are disposed after merging.
export function bake(group) {
  group.updateMatrixWorld(true);
  const opaque = [];
  const additive = [];
  group.traverse((o) => {
    if (!o.isMesh) return;
    const src = o.geometry;
    const geo = src.index ? src.toNonIndexed() : src.clone();
    geo.applyMatrix4(o.matrixWorld);
    const n = geo.attributes.position.count;
    const col = o.material.color;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    // keep only position + colour (unlit vertex-colour material needs no normals/uv)
    for (const k of Object.keys(geo.attributes)) if (k !== 'position') geo.deleteAttribute(k);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    (o.material.blending === THREE.AdditiveBlending ? additive : opaque).push(geo);
  });

  const out = new THREE.Group();
  const op = mergeColored(opaque, false);
  if (op) out.add(op);
  const ad = mergeColored(additive, true);
  if (ad) out.add(ad);
  return out;
}

function mergeColored(geos, additive) {
  if (!geos.length) return null;
  let total = 0;
  for (const geo of geos) total += geo.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  let off = 0;
  for (const geo of geos) {
    const p = geo.attributes.position.array;
    const c = geo.attributes.color.array;
    pos.set(p, off * 3);
    col.set(c, off * 3);
    off += geo.attributes.position.count;
    geo.dispose();
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.MeshBasicMaterial(
    additive
      ? { vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }
      : { vertexColors: true },
  );
  return new THREE.Mesh(merged, m);
}

// A flat-ish tapered wedge hull: width tapers from `wStern` (back) to a near
// point at the bow. Cached by dimensions (style-independent).
export function wedge(wStern, h, len) {
  return g(`w${wStern}_${h}_${len}`, () => {
    const geo = new THREE.BoxGeometry(wStern, h, len, 1, 1, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      if (p.getZ(i) > 0) {
        p.setX(i, p.getX(i) * 0.12);
        p.setY(i, p.getY(i) * 0.55);
      }
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  });
}
