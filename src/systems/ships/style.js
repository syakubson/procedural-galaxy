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

// --- detail helpers (the "greeble language" the role builders share) -------
// Introduced with the v2 detailed hulls: a gun barrel, an engine nozzle bell,
// recessed panel lines and a plain surface greeble. Keeping them here means
// every role (and every faction override) details in one consistent visual
// vocabulary, and the whole lot still bakes down to 2 draw calls.

// A gun barrel along +Z, centred at (x,y,z): a thin tube with a muzzle brake at
// the front tip. `r` = bore radius, `len` = length.
export function barrel(grp, style, x, y, z, r, len) {
  addRot(grp, cyl(r, r * 0.82, len, 6), C(style, 'dark'), x, y, z, Math.PI / 2);
  addRot(grp, cyl(r * 1.5, r * 1.5, r * 1.3, 6), C(style, 'hull2'), x, y, z + len / 2, Math.PI / 2);
}

// An engine nozzle bell firing down -Z; `z` is the rear opening. A flared dark
// cone that narrows forward, a bright inner throat ring, and the additive glow
// plume behind it. `r` = mouth radius, `len` = bell depth.
export function nozzle(grp, style, x, y, z, r, len = 0.04) {
  addRot(grp, cyl(r, r * 0.6, len, 12), C(style, 'dark'), x, y, z + len / 2, Math.PI / 2);
  addRot(grp, cyl(r * 0.66, r * 0.66, 0.008, 12), ACC(style), x, y, z + len - 0.005, Math.PI / 2);
  engineGlow(grp, style, x, y, z - 0.006, r * 0.62);
}

// A recessed panel line — a thin dark strip proud of the hull. `panelZ` runs
// along Z (length `len`), `panelX` along X. Read as engraved plating seams.
export function panelZ(grp, style, x, y, z, len, w = 0.003) {
  grp.add(part(box(w, 0.0016, len), C(style, 'dark'), x, y, z));
}
export function panelX(grp, style, x, y, z, len, w = 0.003) {
  grp.add(part(box(len, 0.0016, w), C(style, 'dark'), x, y, z));
}

// A plain surface greeble — a small box of any palette slot (sensor bump, vent,
// avionics box). Just `part(box(...))` with a name that says "detail, not structure".
export function greeble(grp, style, slot, x, y, z, sx, sy, sz) {
  grp.add(part(box(sx, sy, sz), C(style, slot), x, y, z));
}

// --- "space, not airplane" details (SW Old Republic/Clone Wars + Halo language) ---
// A dome half-sphere geometry, cached — the base of a command blister.
export const dome = (r) => g(`dome${r}`, () => new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2));

// A classic parabolic comms/radar dish (scouts + capital ships) — a shallow pan
// on a short stalk with a feed pin. Faces +Y (up); `tilt` (rad about X) aims it.
// `r` = pan radius. Reads unmistakably as "spacecraft sensor", not an aero mast.
export function dish(grp, style, x, y, z, r, tilt = 0) {
  grp.add(part(box(r * 0.2, r * 0.7, r * 0.2), C(style, 'dark'), x, y + r * 0.35, z)); // stalk
  addRot(grp, cyl(r, r * 0.34, r * 0.5, 14), C(style, 'hull2'), x, y + r * 0.85, z, tilt); // pan (bowl)
  grp.add(part(box(r * 0.07, r * 0.55, r * 0.07), C(style, 'dark'), x, y + r * 1.35, z)); // feed arm
  grp.add(part(sph(r * 0.13, 6), ACC(style), x, y + r * 1.58, z)); // feed pin
}

// A command blister — a glass dome + a dark rim collar. Reads as a bridge/cockpit
// bubble WITHOUT the jet-canopy-on-a-fuselage look. Flat side sits on the hull.
export function blister(grp, style, x, y, z, r) {
  grp.add(part(cyl(r * 1.06, r * 1.12, r * 0.12, 14), C(style, 'dark'), x, y, z)); // rim collar
  grp.add(part(dome(r), C(style, 'glass'), x, y + r * 0.05, z));
}

// A flat radiator panel (a space heat cue, NOT an airfoil): a thin dark plate
// `w` across × `len` along Z, with a bright accent rib down its length.
export function radiatorPanel(grp, style, x, y, z, w, len) {
  grp.add(part(box(w, 0.004, len), C(style, 'dark'), x, y, z));
  grp.add(part(box(w * 0.45, 0.006, len * 0.9), ACC(style), x, y + 0.0015, z));
}

// A reaction-control thruster block (RCS) — a small dark box at a hull corner.
export function rcsQuad(grp, style, x, y, z, s = 0.012) {
  grp.add(part(box(s, s, s), C(style, 'dark'), x, y, z));
  grp.add(part(box(s * 0.5, s * 0.5, s * 0.5), C(style, 'hull2'), x, y, z + s * 0.4));
}

// A short engine nacelle: a capped cylinder pod along Z with a nozzle bell + glow
// at the tail. The "wing" of a space fighter is an ENGINE MOUNT, not an airfoil.
// `z` is the pod centre; the bell sits at z - len/2 - 0.02.
export function nacelle(grp, style, x, y, z, r, len) {
  addRot(grp, cyl(r, r * 0.9, len, 10), C(style, 'hull'), x, y, z, Math.PI / 2);
  addRot(grp, cyl(r * 0.86, r * 0.7, len * 0.16, 10), C(style, 'dark'), x, y, z + len * 0.42, Math.PI / 2); // intake ring
  nozzle(grp, style, x, y, z - len / 2 - 0.015, r * 0.85, len * 0.28);
}

// Bake a built ship/station group (dozens of small unlit meshes) down to TWO
// draw calls: one opaque mesh + one additive mesh, with each part's material
// colour written into a vertex-colour attribute. This is the key optimisation —
// a detailed ship costs ~2 draw calls instead of ~25, so a whole fleet stays
// cheap. Shared source geometries are never mutated (we clone/expand); the
// per-bake clones are disposed after merging.
export function bake(grp) {
  grp.updateMatrixWorld(true);
  // Smooth matcap needs per-vertex normals on the OPAQUE mesh; the flat/off
  // paths (and the additive glow, always) don't — so we classify first, then
  // decide per branch whether to keep the normal attribute (research 2026-07-07).
  const wantNormals = _matcap.enabled && !_matcap.flat;
  const opaque = [];
  const additive = [];
  grp.traverse((o) => {
    if (!o.isMesh) return;
    const src = o.geometry;
    const geo = src.index ? src.toNonIndexed() : src.clone();
    geo.applyMatrix4(o.matrixWorld); // transforms normals too (inverse-transpose + renormalize)
    const isAdd = o.material.blending === THREE.AdditiveBlending;
    const keepNormal = wantNormals && !isAdd;
    if (keepNormal && !geo.attributes.normal) geo.computeVertexNormals();
    const n = geo.attributes.position.count;
    const col = o.material.color;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    // keep position (+ normal for smooth matcap); write the palette colour
    for (const k of Object.keys(geo.attributes)) {
      if (k === 'position' || (keepNormal && k === 'normal')) continue;
      geo.deleteAttribute(k);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    (isAdd ? additive : opaque).push(geo);
  });

  const out = new THREE.Group();
  const op = mergeColored(opaque, false, wantNormals);
  if (op) out.add(op);
  const ad = mergeColored(additive, true, false);
  if (ad) out.add(ad);
  return out;
}

function mergeColored(geos, additive, withNormals) {
  if (!geos.length) return null;
  let total = 0;
  for (const geo of geos) total += geo.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  const nor = withNormals ? new Float32Array(total * 3) : null;
  let off = 0;
  for (const geo of geos) {
    pos.set(geo.attributes.position.array, off * 3);
    col.set(geo.attributes.color.array, off * 3);
    if (nor && geo.attributes.normal) nor.set(geo.attributes.normal.array, off * 3);
    off += geo.attributes.position.count;
    geo.dispose();
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (nor) merged.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  let m;
  if (additive) {
    m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  } else if (_matcap.enabled) {
    // matcap MULTIPLIES the vertex-colour palette (r160, bug #18831 fixed) —
    // fakes lit metal / rim shading with NO scene lights, still one draw call.
    m = new THREE.MeshMatcapMaterial({ matcap: _matcap.tex, vertexColors: true, flatShading: _matcap.flat });
  } else {
    m = new THREE.MeshBasicMaterial({ vertexColors: true });
  }
  return new THREE.Mesh(merged, m);
}

// --- opt-in matcap "texture" for the fleet (research 2026-07-07) ------------
// One shared, self-generated grayscale matcap multiplies the baked vertex-colour
// palette, so every faction keeps its colours but hulls read as shaded metal —
// with ZERO scene lights and no per-ship textures. `flat` picks faceted shading
// (no normal attribute needed); `kind` picks a smooth metal ramp or a stepped
// cel ramp baked into the matcap itself (unlit toon, no MeshToonMaterial/light).
const _matcap = { enabled: false, flat: false, tex: null };
const _matcapCache = {};

/** Configure the fleet matcap. `{ enabled, flat, kind:'metal'|'cel' }`. The
 *  texture is generated once per kind and shared across every baked ship. */
export function setShipMatcap(opts = {}) {
  _matcap.enabled = !!opts.enabled;
  _matcap.flat = !!opts.flat;
  if (_matcap.enabled) {
    const kind = opts.kind || 'metal';
    _matcap.tex = _matcapCache[kind] || (_matcapCache[kind] = makeMatcap(kind));
  }
}

// Procedural grayscale matcap: a lit sphere (upper-left key light) with a rim
// highlight and a spec hotspot. Grayscale so it only shades — the palette tint
// comes from vertex colours. Biased bright (floor ~0.42) so the palette doesn't
// dim too far under the multiply. `cel` quantizes to 4 luminance bands.
function makeMatcap(kind) {
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const R = size * 0.5;
  const L = [-0.42, -0.5, 0.76]; // key light, upper-left, toward viewer
  const ll = Math.hypot(L[0], L[1], L[2]);
  const bands = [0.44, 0.64, 0.84, 1.0];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = (x - R) / R;
      const ny = (y - R) / R;
      const r2 = nx * nx + ny * ny;
      if (r2 > 1) {
        d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
        continue;
      }
      const nz = Math.sqrt(1 - r2);
      const ndl = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / ll);
      let v = 0.42 + 0.5 * ndl; // wrapped diffuse, bright floor
      v += Math.pow(1 - nz, 2.4) * ndl * 0.5; // rim on the lit edge
      v += Math.pow(ndl, 26) * 0.6; // spec hotspot
      v = Math.min(1, v);
      if (kind === 'cel') {
        let q = bands[0];
        for (let k = 0; k < bands.length; k++) if (v >= k / bands.length) q = bands[k];
        v = q;
      }
      const c = Math.round(v * 255);
      d[i] = d[i + 1] = d[i + 2] = c;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
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
