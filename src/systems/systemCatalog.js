// The full roster of star systems in a galaxy — data only, no THREE, no DOM.
// markers.js consumes this to place/render sprites; anything else that needs
// to know "what exists in this galaxy" consumes the SAME list. Keeping this
// pure and side-effect free is what lets every consumer trust "same config ->
// same systems" without re-deriving the generation rules.

import {
  generateSystem,
  generateGalacticCore,
  generateInterstellar,
  generateSolarSystem,
  generateDeadSpace,
  generateFilmWorlds,
  generateDeathStar,
  FLEET_FACTIONS,
} from './systemData.js';

/**
 * @typedef {{ id: string, kind: 'system'|'special', data: object }} CatalogEntry
 * `id` is always `data.seed` — the one identifier every layer that addresses
 * systems (the world overlay first among them) keys on, so nothing needs a
 * second, synthetic id scheme.
 */

/**
 * Build the full list of systems for a config: the procedurally-generated
 * "real" systems first, in the SAME order markers.js used to generate them
 * inline (`i` -> `seed::sys<i>`, with the inhabited-faction round-robin), then
 * the hand-crafted special systems, in the SAME call order as before.
 *
 * This is a straight extraction, not a rewrite: it must not shift a single
 * rng draw relative to the previous inline version. That's safe here because
 * generateSystem()/each generateXxx() creates its own rng from its own seed
 * argument — none of them share state across calls — so moving WHERE the
 * loop lives changes nothing about what it produces.
 *
 * @param {object} config
 * @param {object} [opts]
 * @param {object} [opts.specialOverrides] Reserved for a later stage that lets
 *   a special system's generator take an override (e.g. an in-progress
 *   capture changing the Death Star's faction/label). Not consumed yet —
 *   every generate*() call below still runs with no arguments.
 * @returns {CatalogEntry[]}
 */
// eslint-disable-next-line no-unused-vars -- `opts` is a reserved param for a later stage (see JSDoc above), not consumed yet
export function buildSystemCatalog(config, opts = {}) {
  const c = config;
  const entries = [];

  const count = Math.max(1, Math.round(c.sunCount * c.realSystemFraction));
  let inhabIdx = 0; // round-robins the 6 fleet factions across inhabited systems
  for (let i = 0; i < count; i++) {
    const data = generateSystem(c.seed + '::sys' + i);
    if (data.status === 'inhabited') {
      data.faction = FLEET_FACTIONS[inhabIdx % FLEET_FACTIONS.length];
      inhabIdx++;
    }
    entries.push({ id: data.seed, kind: 'system', data });
  }

  // Hand-crafted / easter-egg systems, in the exact order markers.js placed
  // them — callers that slice past the procedural systems (markers.js) rely
  // on this order to line entries back up with their fixed positions.
  const addSpecial = (data) => entries.push({ id: data.seed, kind: 'special', data });
  addSpecial(generateGalacticCore());
  addSpecial(generateInterstellar());
  addSpecial(generateSolarSystem());
  addSpecial(generateDeadSpace());
  generateFilmWorlds().forEach(addSpecial);
  addSpecial(generateDeathStar());

  return entries;
}
