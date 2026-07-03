// Ship fleet barrel (#11, role×faction matrix). A ship = a ROLE silhouette
// (roles.js) restyled by a FACTION palette (factions.js): 9 roles × 6 factions
// = 54 mixable ships. This module is the public API used by the in-system
// traffic (systemView) and the codex (its 3D find viewer + thumbnails).

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
