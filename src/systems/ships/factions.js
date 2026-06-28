// Faction style-kits (#11). Each kit is consumed by EVERY role builder in
// roles.js, so one kit restyles all 9 ships into a coherent fleet (the "× 6" of
// the 9 × 6 = 54 matrix). Each faction lives in its own file (parallel-agent
// friendly) and is joined here into the registry.
//
// Style schema (what role builders + buildShip read):
//   {
//     id, name,
//     colors: { hull, hull2, accent, dark, glass, gold },  // hex ints
//     accent,   // signature colour — fins, stripes, markings, weapon tips
//     glow,     // additive engine-glow colour
//     nav: { port, star, top },                 // running-light colours (additive)
//     lore,     // one-line faction flavour
//     roles?:   { <roleId>: (style) => Group }, // OPTIONAL bespoke per-role builder
//     station?: (grp, type, style) => void,     // OPTIONAL station signature
//     flourish?:(grp, roleId, style) => void,   // OPTIONAL ship signature detail
//   }

import { FACTION as ALLIANCE } from './faction_alliance.js';
import { FACTION as IMPERIAL } from './faction_imperial.js';
import { FACTION as SWARM } from './faction_swarm.js';
import { FACTION as SYNDICATE } from './faction_syndicate.js';
import { FACTION as CARTEL } from './faction_cartel.js';
import { FACTION as PRECURSOR } from './faction_precursor.js';

export { ALLIANCE };
export const FACTIONS = [ALLIANCE, IMPERIAL, SWARM, SYNDICATE, CARTEL, PRECURSOR];
export const FACTION_BY_ID = Object.fromEntries(FACTIONS.map((f) => [f.id, f]));
