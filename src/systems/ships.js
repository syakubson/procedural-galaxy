// Ship fleet barrel (#11, role×faction matrix). A ship = a ROLE silhouette
// (roles.js) restyled by a FACTION palette (factions.js): 9 roles × 6 factions
// = 54 mixable ships. This module is the public API used by the in-system
// traffic (systemView) and the codex (its 3D find viewer + thumbnails).

import * as THREE from 'three';
import { ROLES, ROLE_BY_ID } from './ships/roles.js';
import { FACTIONS, FACTION_BY_ID, ALLIANCE } from './ships/factions.js';
import { bake } from './ships/style.js';

export { ROLES, FACTIONS, ALLIANCE };

/** Resolve a faction id (or style object) to a style-kit; defaults to Alliance. */
export function getFaction(faction) {
  return !faction ? ALLIANCE : typeof faction === 'string' ? FACTION_BY_ID[faction] || ALLIANCE : faction;
}

/**
 * Build a ship mesh for a (role, faction) pair. `role` is a ROLES id or object;
 * `faction` is a FACTIONS id, a style object, or omitted (defaults to Alliance).
 * A faction may override a role with a bespoke builder (style.roles[id]) — used
 * e.g. for unique per-faction flagships. The role's scale is applied either way.
 */
export function buildShip(role, faction) {
  const r = (typeof role === 'string' ? ROLE_BY_ID[role] : role) || ROLES[0];
  const style = getFaction(faction);
  const make = (style.roles && style.roles[r.id]) || r.make;
  const grp = make(style);
  // optional faction-signature detail on top of the shared silhouette (e.g.
  // Imperial angular plating, Swarm organic bulges, Precursor glowing rings).
  if (typeof style.flourish === 'function') style.flourish(grp, r.id, style);
  // bake ~25 small meshes → 2 draw calls (opaque + additive) for performance
  const baked = bake(grp);
  baked.scale.setScalar(r.scale);
  return baked;
}

/**
 * Build a ship as SEPARATE parts for animation + lighting (stage 8 exemplar):
 * one merged HULL geometry (position + normal + palette vertex-colour, ready for
 * ANY material — matcap, lit toon/standard, shadow caster/receiver) plus the list
 * of engine/nav EMITTERS pulled OUT of the bake so they can be animated live
 * (flame flicker, nav-light blink) instead of frozen into the additive mesh.
 * Emitters are classified by the engine-glow z-stretch (style.js engineGlow sets
 * scale.z = 1.7): a stretched additive sphere is a `flame`, the rest are `light`.
 *
 * @param {string|object} role a ROLES id/object
 * @param {string|object} faction a FACTIONS id/style/omitted
 * @returns {{ hull: THREE.BufferGeometry, emitters: Array<{x:number,y:number,z:number,color:number,kind:'flame'|'light',r:number}> }}
 */
export function buildShipParts(role, faction) {
  const r = (typeof role === 'string' ? ROLE_BY_ID[role] : role) || ROLES[0];
  const style = getFaction(faction);
  const make = (style.roles && style.roles[r.id]) || r.make;
  const grp = make(style);
  if (typeof style.flourish === 'function') style.flourish(grp, r.id, style);
  grp.scale.setScalar(r.scale);
  grp.updateMatrixWorld(true);

  const opaque = [];
  const emitters = [];
  const p = new THREE.Vector3();
  grp.traverse((o) => {
    if (!o.isMesh) return;
    if (o.material.blending === THREE.AdditiveBlending) {
      p.setFromMatrixPosition(o.matrixWorld);
      const kind = o.scale.z > 1.3 ? 'flame' : 'light'; // engineGlow stretches z=1.7
      const rad = (o.geometry.parameters && o.geometry.parameters.radius) || 0.02;
      emitters.push({ x: p.x, y: p.y, z: p.z, color: o.material.color.getHex(), kind, r: rad * r.scale });
      return;
    }
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    geo.applyMatrix4(o.matrixWorld);
    if (!geo.attributes.normal) geo.computeVertexNormals();
    const n = geo.attributes.position.count;
    const col = o.material.color;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal') geo.deleteAttribute(k);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    opaque.push(geo);
  });

  let total = 0;
  for (const geo of opaque) total += geo.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  let off = 0;
  for (const geo of opaque) {
    pos.set(geo.attributes.position.array, off * 3);
    nor.set(geo.attributes.normal.array, off * 3);
    col.set(geo.attributes.color.array, off * 3);
    off += geo.attributes.position.count;
    geo.dispose();
  }
  const hull = new THREE.BufferGeometry();
  hull.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  hull.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  hull.setAttribute('color', new THREE.BufferAttribute(col, 3));
  hull.computeBoundingSphere();
  return { hull, emitters };
}
