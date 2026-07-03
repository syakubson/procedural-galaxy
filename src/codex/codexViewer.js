// Rebuilds "the exact find" behind a codex entry for objectViewer.js, purely
// by re-driving the SAME generators/classes the live game already uses — no
// new generators, no new visual designs. Dispatches on entry.category using
// entry.sourceRef (see codex.js's record() JSDoc for the 4 shapes):
//   ship       -> {role, faction}       -> the existing buildShip() builder
//   station    -> {seed}                -> the existing createStation() builder
//   planet/race -> {seed, planetIndex}  -> the same system data + the SAME
//                                          hashStr-derived seedBase + Planet
//   phenomenon -> {phenomenonId}        -> the existing special-object classes

import * as THREE from 'three';
import { buildShip, getFaction } from '../systems/ships.js';
import { createStation } from '../systems/stations.js';
import { Planet } from '../systems/planet.js';
import { hashStr } from '../systems/systemView.js';
import { BlackHole } from '../systems/blackHole.js';
import { Endurance } from '../systems/endurance.js';
import { DeathStar } from '../systems/deathStar.js';
import { Ishimura } from '../systems/ishimura.js';
import { Dragon } from '../systems/dragon.js';
import {
  generateSystem,
  generateGalacticCore,
  generateInterstellar,
  generateDeathStar,
  generateSolarSystem,
  generateDeadSpace,
  generateFilmWorlds,
} from '../systems/systemData.js';

// Fixed hand-crafted seeds -> their own generate*() function, mirroring the
// exact mapping systemCatalog.js uses to build the galaxy's system list. Any
// seed NOT in this table (and not one of the film-world seeds below) is a
// procedural seed (`<partyId>::sys<N>`) and goes through generateSystem().
const SPECIAL_BUILDERS = {
  'galactic-core': generateGalacticCore,
  interstellar: generateInterstellar,
  'death-star': generateDeathStar,
  'sol-system': generateSolarSystem,
  deadspace: generateDeadSpace,
};

// generateFilmWorlds() returns all 4 easter-egg systems at once from a fixed,
// input-free build — cache the one call per module lifetime rather than
// rebuilding all four every time a codex entry from one of them is opened.
let _filmWorlds = null;
function filmWorldBySeed(seed) {
  if (!_filmWorlds) _filmWorlds = generateFilmWorlds();
  return _filmWorlds.find((d) => d.seed === seed) || null;
}

/**
 * Resolve a stored seed back to its system data, through the SAME generator
 * the game used to produce it in the first place. `overlay`, if given, layers
 * the party's discovery patch on top exactly like SystemView does, so a
 * patched fact shows up here too.
 *
 * @param {string} seed
 * @param {import('../state/overlay.js').WorldOverlay} [overlay]
 * @returns {object} the effective system data (base, or base+patch)
 */
export function resolveSystemData(seed, overlay) {
  const special = SPECIAL_BUILDERS[seed];
  const base = special ? special() : filmWorldBySeed(seed) || generateSystem(seed);
  return overlay ? overlay.effective(seed, base) : base;
}

/** Free a BAKED group's own geometry/material. Safe ONLY because
 *  buildShip()/createStation() bake() their output into a fresh, private
 *  merged geometry + a fresh vertex-colour material (ships/style.js's
 *  bake()/mergeColored()) — none of the shared per-faction material cache or
 *  shared per-part geometry cache those builders draw from is reachable from
 *  the baked result, so this can't touch anything another ship or station
 *  elsewhere in the app still needs. */
function disposeBaked(group) {
  group.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
}

function buildShipFind(entry) {
  const ref = entry.sourceRef || {};
  let { role, faction } = ref;
  if (!role || !faction) {
    // Fallback: archetypeKey is `${factionId}:${roleId}` (see codexData.js's
    // SHIP_CATALOG comment) — split it if sourceRef didn't spell both out.
    const [f, r] = String(entry.archetypeKey || '').split(':');
    role = role || r;
    faction = faction || f;
  }
  return (scene) => {
    const group = buildShip(role, faction);
    scene.add(group);
    return { dispose: () => disposeBaked(group) };
  };
}

function buildStationFind(entry, overlay) {
  const ref = entry.sourceRef || {};
  return (scene) => {
    // The faction skin this station was ACTUALLY seen in. sourceRef.faction is
    // authoritative: an inhabited system's faction comes from the catalog's
    // round-robin over inhabited systems (an index, not derivable from the
    // seed), so re-generating from the seed alone can land on the wrong fleet.
    // Regeneration remains only as the fallback for entries without the field.
    const data = ref.faction ? null : ref.seed ? resolveSystemData(ref.seed, overlay) : null;
    const style = getFaction(ref.faction || (data && data.faction));
    const group = createStation(entry.archetypeKey, 1, style);
    scene.add(group);
    return { dispose: () => disposeBaked(group) };
  };
}

function buildPlanetFind(entry, overlay) {
  const ref = entry.sourceRef || {};
  return (scene) => {
    const data = resolveSystemData(ref.seed, overlay);
    const planetData = data.planets[ref.planetIndex];
    // Bit-for-bit the SAME seedBase systemView.js derives for this planet —
    // copied call-for-call from systemView.js's load(): `seedBase =
    // floor(abs(hashStr(data.seed)) % 100000)`, then `seedBase + i*131` per
    // planet index (systemView.js:144-147). Do not change this formula
    // without checking that file's load() in lockstep — a mismatch would
    // silently reseed the planet's shader noise/moons/rings differently from
    // what the player originally saw.
    const seedBase = Math.floor(Math.abs(hashStr(data.seed)) % 100000) + ref.planetIndex * 131;
    // sourceRef.faction over the regenerated data's: see buildStationFind —
    // the live game assigns inhabited factions round-robin outside the seed.
    const style = getFaction(ref.faction || data.faction);
    // Showcase pose, not orbital motion: freeze the orbit (`angularSpeed: 0` —
    // the body keeps its axial spin) so the planet doesn't drift out of the
    // framed shot, and park it at phase -π/2 so its lit hemisphere (the
    // planet shader lights from the star at the scene origin) faces the
    // camera's default vantage. Neither field feeds the visual seed — the
    // surface/moons/rings stay exactly what the player originally saw.
    const planet = new Planet({ ...planetData, angularSpeed: 0, phase: -Math.PI / 2 }, seedBase, style);
    planet.addTo(scene);
    planet.trail.visible = false; // an orbit-scale ribbon — noise in a close-up
    let elapsed = 0;
    return {
      focus: planet.body, // frame the body, not the (orbit-sized) whole group
      update(dt) {
        elapsed += dt;
        // no camera passed in -> orbitTech (satellites/station) always
        // visible (planet.js: `!camera || ...`), which suits a close-up showcase.
        planet.update(dt, elapsed);
      },
      dispose: () => planet.dispose(),
    };
  };
}

/** dt-driven wrapper that also accumulates an elapsed-time value, for classes
 *  whose update() wants absolute time rather than a per-frame delta
 *  (BlackHole, DeathStar). */
function elapsedUpdater(fn) {
  let t = 0;
  return (dt) => {
    t += dt;
    fn(dt, t);
  };
}

function addStandardLights(scene, color, intensity, position, ambientColor, ambientIntensity) {
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(position[0], position[1], position[2]);
  scene.add(light);
  scene.add(new THREE.AmbientLight(ambientColor, ambientIntensity));
}

// One builder per PHENOMENON_CATALOG archetypeKey (codexData.js) — each is a
// stock instance of the existing class, matching how systemView.js builds it
// (same scale/light-rig where one exists), not a new design.
const PHENOMENON_BUILDERS = {
  'blackhole-galactic': (scene) => {
    const bh = new BlackHole(generateGalacticCore().blackHole);
    bh.addTo(scene);
    return { update: elapsedUpdater((dt, t) => bh.update(t)), dispose: () => bh.dispose() };
  },
  'blackhole-gargantua': (scene) => {
    const bh = new BlackHole(generateInterstellar().blackHole);
    bh.addTo(scene);
    return { update: elapsedUpdater((dt, t) => bh.update(t)), dispose: () => bh.dispose() };
  },
  endurance: (scene) => {
    const end = new Endurance(2.2); // systemView._loadBlackHole's `new Endurance(2.2)`
    end.addTo(scene);
    return { update: (dt) => end.update(dt), dispose: () => end.dispose() };
  },
  ishimura: (scene) => {
    // MeshStandardMaterial hull needs real lights (systemView._buildIshimura's rig)
    addStandardLights(scene, 0xffffff, 2.0, [5, 8, 4], 0x40383a, 1.1);
    const ship = new Ishimura(1);
    ship.addTo(scene);
    return { update: () => ship.update(), dispose: () => ship.dispose() };
  },
  deathstar: (scene) => {
    // MeshStandardMaterial hull needs real lights (systemView._loadDeathStar's rig
    // — the standalone "hero" Death Star scene, not the smaller in-system variant)
    addStandardLights(scene, 0xffffff, 2.4, [4, 5, 6], 0x4a4e58, 1.1);
    const ds = new DeathStar(8);
    ds.addTo(scene);
    return { update: elapsedUpdater((dt, t) => ds.update(dt, t)), dispose: () => ds.dispose() };
  },
  dragon: (scene) => {
    const d = new Dragon(0.5); // systemView._buildDragon's `new Dragon(0.5)`
    d.addTo(scene);
    return { update: (dt) => d.update(dt), dispose: () => d.dispose() };
  },
};

function buildPhenomenonFind(entry) {
  const id = (entry.sourceRef && entry.sourceRef.phenomenonId) || entry.archetypeKey;
  return PHENOMENON_BUILDERS[id] || (() => null);
}

/**
 * Build the `build(scene)` function objectViewer.js's open() expects for a
 * given codex entry — dispatches purely on entry.category.
 *
 * @param {object} entry a codex.js Entry ({category, archetypeKey, sourceRef, ...})
 * @param {object} [ctx]
 * @param {import('../state/overlay.js').WorldOverlay} [ctx.overlay] the
 *   current party's world overlay, so a patched fact shows up in the find —
 *   everything else resolves from entry.sourceRef alone.
 * @returns {(scene: THREE.Scene) => ({dispose?: Function, update?: Function}|void)}
 */
export function buildFor(entry, ctx = {}) {
  const { overlay } = ctx;
  switch (entry.category) {
    case 'ship':
      return buildShipFind(entry);
    case 'station':
      return buildStationFind(entry, overlay);
    case 'planet':
    case 'race':
    case 'ruin':
      // a ruined world IS a planet — its sourceRef carries the same
      // {seed, planetIndex}, and generateSystem rebuilds it with its ruin state.
      return buildPlanetFind(entry, overlay);
    case 'phenomenon':
      return buildPhenomenonFind(entry);
    default:
      // 'system' (and anything else) has no standalone find to rebuild —
      // codexUI.js should not offer «Рассмотреть» for it.
      return () => null;
  }
}
