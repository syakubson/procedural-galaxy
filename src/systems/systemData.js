// Procedural star-system data (pure, deterministic from a seed).
//
// Grounded loosely in real physics:
//   - orbital angular speed follows Kepler's third law: omega ∝ a^-1.5 (outer
//     planets move much slower than inner ones);
//   - gas giants are clearly larger than terrestrials but always smaller than
//     the star; moons are small and slow;
//   - habitability is a CONSEQUENCE of the star, not an independent roll: the
//     star is picked first and unconditionally, its class sets four climate
//     bands across the orbital slots (GEN.world.bands), and only a terran/
//     ocean world landing in the temperate band is a "life candidate". O/B
//     stars carry a zero-width temperate band, so their systems are lifeless
//     by construction — no separate "can this be inhabited" flag needed.
//
// Inhabited/ruined worlds get a natural biome from where they sit in the
// temperate band (GEN.world.biomes) plus their star class, then — only for a
// spacefaring civilisation — a city may pave over it. Civilisation stage
// (tribal / industrial / spacefaring) drives city-light brightness, orbital
// satellites/stations, colonies on sister worlds, and interplanetary ships.
// No meshes here — systemView/planet build those.

import { createRng } from '../rng.js';
import { GEN, GEN_VERSION } from './genParams.js';
import {
  generateName,
  generateLore,
  generateHistory,
  generateResources,
  generateRace,
  generateExtinctRace,
  generateFlagship,
  generateStationName,
  generateFact,
  roboticRuinLine,
  catastropheLine,
  obliterationLine,
} from './lore.js';

const TAU = Math.PI * 2;

// Fleet faction ids (the 6 ship style-kits in ships/factions.js). A system's
// civilisation flies one faction, so different civs field visually different
// fleets (the "mix per civilisation" goal). Kept as plain ids here so this data
// module stays mesh-free.
export const FLEET_FACTIONS = ['alliance', 'imperial', 'swarm', 'syndicate', 'cartel', 'precursor'];

// Star spectral classes. `radius` is visual (kept well above any planet so the
// star always dominates). `habit` = long-lived enough to gate an age-matched
// binary companion (see the binary roll below); it no longer filters the
// primary star roll itself — the primary is unconditional (see generateSystem).
const STAR_TYPES = [
  { key: 'O', label: 'Голубой сверхгигант (O)', desc: 'горячий, яркий и недолговечный', color: '#aac0ff', radius: 7.0, weight: 1, habit: false, activity: 0.35, solarMass: 22 },
  { key: 'B', label: 'Бело-голубая звезда (B)', desc: 'массивная и очень горячая', color: '#cdddff', radius: 5.6, weight: 2, habit: false, activity: 0.3, solarMass: 7 },
  { key: 'A', label: 'Белая звезда (A)', desc: 'главной последовательности, бело-голубая', color: '#f2f5ff', radius: 4.6, weight: 3, habit: true, activity: 0.28, solarMass: 1.9 },
  { key: 'F', label: 'Жёлто-белая звезда (F)', desc: 'чуть горячее и ярче Солнца', color: '#fff7ea', radius: 4.0, weight: 4, habit: true, activity: 0.3, solarMass: 1.3 },
  { key: 'G', label: 'Жёлтый карлик (G)', desc: 'спокойная звезда, как наше Солнце', color: '#fff0cc', radius: 3.5, weight: 6, habit: true, activity: 0.45, solarMass: 1.0 },
  { key: 'K', label: 'Оранжевый карлик (K)', desc: 'тёплый, стабильный и долгоживущий', color: '#ffce8e', radius: 3.0, weight: 6, habit: true, activity: 0.5, solarMass: 0.75 },
  { key: 'M', label: 'Красный карлик (M)', desc: 'тусклый, но живёт почти вечно', color: '#ff9470', radius: 2.6, weight: 7, habit: true, activity: 0.6, solarMass: 0.35 },
];

// rough main-sequence mass (in Suns) by spectral class — used for hand-built
// special systems whose star label carries its class in parentheses.
const CLASS_SOLAR_MASS = { O: 22, B: 7, A: 1.9, F: 1.3, G: 1.0, K: 0.75, M: 0.35 };
function solarMassFromLabel(label) {
  const m = /\(([OBAFGKM])\)/.exec(label || '');
  return m ? CLASS_SOLAR_MASS[m[1]] : 1.0;
}

// Planet archetypes. `kind` selects the surface branch in the planet shader.
// Exported so the codex catalog can enumerate the 7 planet kinds without
// keeping its own copy of this table.
export const PLANET_KINDS = {
  lava: { kind: 3, c1: '#2a1610', c2: '#5a2a18', c3: '#140a08', hot: '#ff6a1e', atmo: '#ff6a30', atmoS: 0.32, clouds: 0, rMin: 0.45, rMax: 0.85 },
  rocky: { kind: 0, c1: '#7a6858', c2: '#998a78', c3: '#34302a', hot: '#000000', atmo: '#6a5a44', atmoS: 0.1, clouds: 0, rMin: 0.4, rMax: 0.9 },
  desert: { kind: 0, c1: '#b89366', c2: '#cdb083', c3: '#6a4a28', hot: '#000000', atmo: '#b89360', atmoS: 0.2, clouds: 0, rMin: 0.5, rMax: 1.0 },
  terran: { kind: 1, c1: '#16406f', c2: '#3f8a4a', c3: '#8a7a55', hot: '#ffd27a', atmo: '#7fb4ff', atmoS: 0.5, clouds: 1, rMin: 0.55, rMax: 1.05 },
  ocean: { kind: 1, c1: '#0e3a66', c2: '#2f7a60', c3: '#6f9a8a', hot: '#ffd27a', atmo: '#88c0ff', atmoS: 0.5, clouds: 1, rMin: 0.6, rMax: 1.1 },
  ice: { kind: 2, c1: '#cfe2f0', c2: '#a0c4e0', c3: '#6f96b4', hot: '#000000', atmo: '#bcd8ee', atmoS: 0.28, clouds: 0, rMin: 0.5, rMax: 1.0 },
  gas: { kind: 4, c1: '#d98c5a', c2: '#a8623a', c3: '#ecd6a8', hot: '#000000', atmo: '#e8c79a', atmoS: 0.35, clouds: 0, rMin: 2.0, rMax: 3.0 },
};

// Habitable-world biomes (Star-Wars-style variety). Colours override the kind-1
// surface; `biome` selects the sub-branch in the planet shader. Exported: this
// IS the exhaustive reachable biome-key set for both living and ruined worlds
// (see RUIN_BIOMES below, derived from these same keys) — the codex catalog and
// lore.js's EXTINCT_WHO table must cover exactly this key set.
export const BIOME_KEYS = {
  earthlike: { label: 'Земного типа', biome: 0, ocean: '#16406f', land: '#3f8a4a', land2: '#8a7a55' },
  ocean: { label: 'Океанический', biome: 1, ocean: '#0e3a66', land: '#3a8a72', land2: '#6f9a8a' },
  jungle: { label: 'Мир джунглей', biome: 2, ocean: '#15506a', land: '#2f7a2e', land2: '#5e8a36' },
  tundra: { label: 'Ледяной мир', biome: 3, ocean: '#2a4a66', land: '#d4e4ee', land2: '#9ab0c0' },
  desert: { label: 'Пустынный мир', biome: 4, ocean: '#3a6a78', land: '#c9a36b', land2: '#8a6238' },
  city: { label: 'Планета-город', biome: 5, ocean: '#22324a', land: '#6f7588', land2: '#474c5e' },
};

// Reachable ruin-biome key set — a ruin rolls the SAME biome table a living
// world would (see ruinWeights below) plus a flat "city" baseline, so it can
// land on any of BIOME_KEYS' keys, never more/fewer. Derived, not duplicated,
// so it can never silently drift out of sync with BIOME_KEYS (or with
// lore.js's EXTINCT_WHO, which must carry one entry per key here).
export const RUIN_BIOMES = Object.keys(BIOME_KEYS);

// Ruin flavours a ruined homeworld can end up with, in roll order (see the
// threshold chain a few lines below in generateSystem, which must keep
// assigning these same 4 values in this same order).
export const RUIN_TYPES = ['plain', 'robotic', 'destroyed', 'obliterated'];

export const CIV_LEVELS = {
  tribal: { label: 'Племена', light: 0.3, sats: [0, 0], station: false, colonies: 0, ships: 0 },
  industrial: { label: 'Индустриальная эпоха', light: 1.0, sats: [2, 5], station: false, colonies: 0, ships: 0 },
  spacefaring: { label: 'Космическая цивилизация', light: 1.5, sats: [3, 7], station: true, colonies: 2, ships: 4 },
};

/** Weighted spectral-class pick from an optional pool (defaults to all seven). */
function weightedStar(rng, pool = STAR_TYPES) {
  const total = pool.reduce((s, t) => s + t.weight, 0);
  let x = rng.next() * total;
  for (const t of pool) {
    x -= t.weight;
    if (x <= 0) return t;
  }
  return pool[pool.length - 1];
}

/** Weighted pick of an object-key from `{key: weight}`, with an optional
 *  per-key multiplier map layered on top (missing keys default to ×1). Used
 *  for both the band→archetype roll and the insolation→biome roll — the
 *  "absence = banned" contract lives in the caller's weight table, not here. */
function weightedKey(rng, weights, mul) {
  const keys = Object.keys(weights);
  const w = keys.map((k) => weights[k] * (mul && mul[k] != null ? mul[k] : 1));
  const total = w.reduce((s, x) => s + x, 0);
  let x = rng.next() * total;
  for (let i = 0; i < keys.length; i++) {
    x -= w[i];
    if (x <= 0) return keys[i];
  }
  return keys[keys.length - 1];
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** Climate band for every orbital slot of a star (GEN.world.bands, R2), plus
 *  the deterministic snap-promotion of one slot to `temperate` when the
 *  discrete index grid misses the band entirely (R3). Zero rng draws — a
 *  pure function of the star's class and how many planets the system has. */
function computeBands(starKey, n) {
  const edges = GEN.world.bands[starKey];
  const fracs = [];
  const bands = [];
  for (let i = 0; i < n; i++) {
    const f = n <= 1 ? 0 : i / (n - 1);
    fracs.push(f);
    bands.push(f < edges[0] ? 'scorch' : f < edges[1] ? 'temperate' : f < edges[2] ? 'cold' : 'frigid');
  }
  let snapIndex = -1;
  // edges[0] < edges[1] excludes O/B (zero-width temperate edge) automatically —
  // no separate per-class check needed.
  if (GEN.world.bandSnap && edges[0] < edges[1] && !bands.includes('temperate')) {
    const mid = (edges[0] + edges[1]) / 2;
    let bestI = 0;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(fracs[i] - mid);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }
    bands[bestI] = 'temperate';
    snapIndex = bestI;
  }
  return { bands, fracs, snapIndex };
}

/** A candidate's relative position inside the temperate band (0 = inner edge,
 *  1 = outer edge), used to pick its insolation tercile for the biome table. */
function tercileFromInsol(insol) {
  return insol < 1 / 3 ? 'hot' : insol < 2 / 3 ? 'mild' : 'cool';
}

/** Build a full system description from any seed value. */
export function generateSystem(seed) {
  const rng = createRng(seed);

  // Warm the generator a couple of steps — mulberry32's first draws off a
  // string seed are mildly biased, which skewed shares across systems.
  rng.next();
  rng.next();

  // The star is rolled FIRST and unconditionally (no status to satisfy yet —
  // status is now a downstream consequence of the star + planets, see below).
  const star = weightedStar(rng);

  // system age (Gyr): hot massive stars are necessarily young
  const ageMax = star.key === 'O' ? 0.04 : star.key === 'B' ? 2 : star.key === 'A' ? 4 : 13.2;
  const ageGyr = Math.round(rng.range(0.3, ageMax) * 10) / 10;

  // ~28% of systems are a close binary (two suns near each other, #10). Planets
  // then orbit the barycentre (circumbinary). An old system can't host a
  // short-lived O/B companion, so gate the companion's class by age.
  let binary = null;
  if (rng.next() < GEN.binaryChance) {
    const star2 = weightedStar(rng, ageGyr > 3 ? STAR_TYPES.filter((t) => t.habit) : STAR_TYPES);
    const separation = (star.radius + star2.radius) * 1.3;
    binary = { star2, separation };
  }

  const planetCount = rng.int(GEN.planetCount[0], GEN.planetCount[1]);
  const planets = [];

  // Climate bands for every slot follow from the star class + slot count
  // alone — a pure lookup, zero rng draws (R2/R3 in GENERATION.md).
  const { bands, fracs, snapIndex } = computeBands(star.key, planetCount);
  const starEdges = GEN.world.bands[star.key];

  // --- spacing model (#7/#11): every body owns an in-plane "half-extent" — its
  // radius plus any ring or moon reach. No two bodies' disks may come within
  // MIN_GAP, and the innermost planet keeps a generous gap from the star
  // surface. Each planet is fully sized (radius + rings + moons) BEFORE it is
  // placed, so the orbit is chosen to clear the previous body exactly — this is
  // what stops Saturn-like ringed worlds from grazing each other. ---
  const MIN_GAP = 2.6; // empty space between two adjacent planet disks
  const FIRST_GAP = star.radius * 0.9 + 3.2; // extra clearance from the star
  let prevOrbit = 0;
  let prevHalf = star.radius; // the star occupies up to its visual radius
  if (binary) prevHalf = Math.max(prevHalf, binary.separation * 0.5 + binary.star2.radius);

  for (let i = 0; i < planetCount; i++) {
    const band = bands[i];
    // R4: the band's archetype table IS the compatibility rule — an absent
    // key is a ban (lava can't sit in `cold`, ice/gas can't sit in `scorch`).
    const type = weightedKey(rng, GEN.world.archetypes[band]);
    const def = PLANET_KINDS[type];
    const radius = rng.range(def.rMin, def.rMax);
    const hasRings = type === 'gas' ? rng.next() < 0.55 : type === 'ice' ? rng.next() < 0.12 : false;
    const ringOuter = hasRings ? radius * 2.25 : 0;

    // moons — small, slow, ALL prograde (#6). Stacked outside any ring with a
    // guaranteed gap so they never overlap each other or the rings.
    const moonMax = type === 'gas' ? 3 : type === 'terran' || type === 'ocean' ? 2 : 1;
    const moonCount = rng.int(0, moonMax);
    const moons = [];
    let moonOrbit = Math.max(radius * 1.8, ringOuter + radius * 0.6);
    for (let m = 0; m < moonCount; m++) {
      const mr = radius * rng.range(0.06, 0.18);
      moonOrbit += mr + radius * 0.5 + rng.range(0.2, 0.6); // clear the previous moon
      moons.push({
        radius: mr,
        orbit: moonOrbit,
        angularSpeed: rng.range(0.22, 0.6), // prograde — same sense as the planet
        phase: rng.range(0, TAU),
      });
      moonOrbit += mr;
    }

    // this body's in-plane half-extent (planet, rings and moons all count)
    const moonReach = moons.length ? moons[moons.length - 1].orbit + moons[moons.length - 1].radius : 0;
    const half = Math.max(radius, ringOuter, moonReach);

    // place so this disk clears the previous body by the required gap
    const gap = (i === 0 ? FIRST_GAP : MIN_GAP) + rng.range(0.4, 2.2);
    let orbit = prevOrbit + prevHalf + gap + half;
    // circumbinary stability: keep the nearest planet well outside the pair
    if (binary && i === 0) orbit = Math.max(orbit, binary.separation * 2.8 + half);

    // R5: "candidate for life" is a lookup, not a roll — a terran/ocean world
    // that happens to land in the temperate band. The snap slot has no real
    // position inside the band, so it's pinned to the band's midpoint (mild).
    const lifeCandidate = band === 'temperate' && GEN.world.lifeArchetypes.includes(type);
    const insol =
      band !== 'temperate'
        ? null
        : i === snapIndex
          ? 0.5
          : starEdges[1] > starEdges[0]
            ? clamp01((fracs[i] - starEdges[0]) / (starEdges[1] - starEdges[0]))
            : 0.5;

    const planet = {
      type,
      def,
      radius,
      orbit,
      // Kepler's third law: omega ∝ a^-1.5, scaled so the inner worlds drift
      // calmly and the outer ones crawl. All prograde.
      angularSpeed: (1.4 / Math.pow(orbit, 1.5)) * rng.range(0.9, 1.1),
      spinSpeed: rng.range(0.05, 0.22),
      tilt: rng.range(-0.42, 0.42),
      inclination: rng.range(-0.06, 0.06),
      phase: rng.range(0, TAU),
      hasRings,
      inhabited: false,
      ruined: false,
      colony: false,
      biome: type === 'ocean' ? 1 : 0,
      band, // 'scorch' | 'temperate' | 'cold' | 'frigid' — this slot's climate
      insol, // 0..1 position inside the temperate band, else null
      lifeCandidate,
      moons,
    };

    planets.push(planet);
    prevOrbit = orbit;
    prevHalf = half;
  }

  // --- status as a consequence of the star + planets already rolled ---
  const candidates = planets.filter((p) => p.lifeCandidate);

  // R6: exactly three rolls happen here, ALWAYS — even with zero candidates —
  // so that adding/removing candidates never shifts every later rng draw.
  const lifeRoll = rng.next();
  const fateRoll = rng.next();
  const homeRoll = rng.next();

  let status = 'wild'; // no candidates ⇒ wild, unconditionally (O/B always land here)
  if (candidates.length > 0) {
    const ageFactor = Math.min(1, ageGyr / GEN.life.rampGyr);
    const lifeMul = GEN.life.starLifeMul[star.key] != null ? GEN.life.starLifeMul[star.key] : 1;
    const pLife = clamp01(GEN.life.given * lifeMul * ageFactor);
    if (lifeRoll < pLife) {
      const extinctMul = GEN.life.starExtinctMul[star.key] != null ? GEN.life.starExtinctMul[star.key] : 1;
      const pExtinct = clamp01(GEN.life.extinctShare * extinctMul);
      status = fateRoll < pExtinct ? 'ruins' : 'inhabited';
    }
    // else: conditions were there, the spark never happened — still wild.
  }
  const home = status !== 'wild' ? candidates[Math.min(candidates.length - 1, Math.floor(homeRoll * candidates.length))] : null;

  let civLevel = null;
  let roboticTraffic = false; // #8: machines keep cargo moving in a dead world
  let fleetDwelling = false; // #10: survivors live aboard a roaming flagship
  if (status === 'inhabited') {
    // civilisation stage
    const cRoll = rng.next();
    civLevel = cRoll < GEN.civTribal ? 'tribal' : cRoll < GEN.civIndustrial ? 'industrial' : 'spacefaring';
    const civ = CIV_LEVELS[civLevel];

    // R8/R9: the natural biome ALWAYS gets rolled from insolation × archetype ×
    // star class, then (R10) a spacefaring civ MAY pave a city over it — city
    // is a civilisation overlay, never a substitute for the natural roll.
    const tercile = tercileFromInsol(home.insol);
    const natureBiome = weightedKey(rng, GEN.world.biomes[tercile][home.type], GEN.world.biomeStarMul[star.key]);
    const biomeName = civLevel === 'spacefaring' && rng.next() < GEN.world.cityOverlayChance ? 'city' : natureBiome;
    applyBiome(home, biomeName);
    home.natureBiome = natureBiome; // what the city (if any) was built over

    home.inhabited = true;
    home.civLevel = civLevel;
    home.civLabel = civ.label;
    home.lightBoost = civ.light;
    home.civObjects = {
      satellites: rng.int(civ.sats[0], civ.sats[1]),
      station: civ.station,
    };
    home.race = generateRace(rng, { civLevel, biome: biomeName });

    // colonies on other worlds (spacefaring only, #16). Colonisability is NOT
    // tied to a life-friendly climate (owner decision, 2026-07-03): a
    // spacefaring civilisation plants ordinary settlements where the band
    // allows, and pressurised dome bases everywhere with a solid surface —
    // only gas giants stay colony-free (they get skimmer stations instead).
    // Comfortable worlds are still taken first, so a settlement beats a dome
    // whenever the system offers the choice, and a temperate rocky/desert
    // colony may turn out terraformed (flavour only, no shader change yet).
    if (civ.colonies > 0) {
      const comfy = (p) =>
        (p.band === 'temperate' || p.band === 'cold') &&
        (p.type === 'terran' || p.type === 'ocean' || p.type === 'rocky' || p.type === 'desert');
      const pool = [
        ...shuffled(planets.filter((p) => p !== home && comfy(p)), rng),
        ...shuffled(planets.filter((p) => p !== home && !comfy(p) && p.type !== 'gas'), rng),
      ];
      const want = Math.min(civ.colonies, pool.length);
      for (let k = 0; k < want; k++) {
        const p = pool[k];
        p.colony = true;
        p.colonyStation = true; // #2: every colony gets its own little orbital hub
        if (comfy(p)) {
          p.colonyLight = 0.6; // clearly visible settlement glow on the night side
          const canTerraform = p.band === 'temperate' && (p.type === 'rocky' || p.type === 'desert');
          p.colonyKind =
            canTerraform && rng.next() < GEN.world.terraformChance ? 'terraformed' : 'settlement';
        } else {
          p.colonyKind = 'dome'; // scorch/frigid surface — life under pressurised domes
          p.colonyLight = 0.45; // dimmer: a handful of domes, not open cities
        }
      }
    }

    // gas-giant skimmer stations (#11) — spacefaring civs harvest the giants
    if (civLevel === 'spacefaring') {
      for (const gp of planets.filter((p) => p.type === 'gas')) {
        if (rng.next() < 0.6) gp.gasStation = true;
      }
    }
  } else if (status === 'ruins') {
    // ruins: a former living world, greyed out. The ruin flavour is rolled
    // BEFORE the biome (R11 — reversed from the old order) because the
    // flavour reshapes the biome odds (robotic ruins lean toward "city"):
    //   robotic     — everyone died, machines keep the depot running
    //   destroyed   — a catastrophe crater scars the surface
    //   obliterated — blown to pieces by an alien race: a debris field
    //   (else)      — a plain, lifeless greyed-out ruin
    const rRoll = rng.next();
    let ruinType = RUIN_TYPES[0]; // 'plain'
    if (rRoll < GEN.ruinRobotic) ruinType = RUIN_TYPES[1]; // 'robotic'
    else if (rRoll < GEN.ruinDestroyed) ruinType = RUIN_TYPES[2]; // 'destroyed'
    else if (rRoll < GEN.ruinObliterated) ruinType = RUIN_TYPES[3]; // 'obliterated'

    // R11: same insolation table a living world would use (this WAS a living
    // climate), plus a "was it a whole planet-city?" baseline that robotic
    // ruins lean into hard. The reachable key set here is exactly RUIN_BIOMES.
    const tercile = tercileFromInsol(home.insol);
    const ruinWeights = { ...GEN.world.biomes[tercile][home.type], city: 1 };
    const ruinMul = GEN.world.ruinBiomeMul[ruinType];
    if (ruinMul) for (const k in ruinMul) if (ruinWeights[k] != null) ruinWeights[k] *= ruinMul[k];
    const ruinBiome = weightedKey(rng, ruinWeights, GEN.world.biomeStarMul[star.key]);
    applyBiome(home, ruinBiome);
    home.ruined = true;
    if (ruinType === 'robotic') home.robotic = true;
    else if (ruinType === 'destroyed') home.destroyed = true;
    else if (ruinType === 'obliterated') home.obliterated = true;
    // #7: who lived here and HOW they died (the cause matches the ruin type)
    home.race = generateExtinctRace(rng, ruinBiome, ruinType);

    if (home.robotic) {
      // #8: machines still run the place — a maintained depot station + a few
      // cargo haulers, but nothing alive.
      home.colonyStation = true;
      roboticTraffic = true;
    } else if (home.destroyed || home.obliterated) {
      // #9/#10: the inhabitants wrecked their own world. Survivors either fled
      // to a colony on a sister world (with an orbital hub right beside the
      // dead planet, same band gate as living colonies — R13), or — if
      // nothing else is habitable — now live aboard a roaming flagship.
      const refuge = shuffled(
        planets.filter(
          (p) =>
            p !== home &&
            (p.band === 'temperate' || p.band === 'cold') &&
            (p.type === 'rocky' || p.type === 'desert' || p.type === 'ice' || p.type === 'terran' || p.type === 'ocean'),
        ),
        rng,
      );
      if (refuge.length && rng.next() < GEN.ruinRefugeChance) {
        const r0 = refuge[0];
        r0.colony = true;
        r0.colonyLight = 0.55;
        r0.colonyStation = true; // survivors' hub right by the dead world (#9)
      } else {
        fleetDwelling = true; // no refuge → they live on the flagship (#10)
      }
    }
  }

  // #25: some wild, uninhabited systems host a lone roaming flagship scouting
  // for planets fit for a new colony — an explorer just passing through.
  let scoutFlagship = false;
  if (status === 'wild' && rng.next() < GEN.scoutFlagshipChance) scoutFlagship = true;

  const planetKinds = new Set(planets.map((p) => p.type));
  const name = generateName(rng);
  const lore = generateLore(rng, status, planetKinds);
  const res = generateResources(rng, planetKinds, status);
  let ships = 0;
  if (status === 'inhabited' && civLevel === 'spacefaring') ships = CIV_LEVELS.spacefaring.ships;
  else if (roboticTraffic) ships = rng.int(GEN.roboticShips[0], GEN.roboticShips[1]); // robot cargo haulers (#8)
  else if (fleetDwelling) ships = rng.int(GEN.fleetShips[0], GEN.fleetShips[1]); // the surviving fleet (#10)
  else if (scoutFlagship) ships = 1; // a lone colony-scout flagship (#25)
  // a few icy comets sweep most systems on long elliptical orbits (#13)
  const comets = rng.next() < GEN.cometChance ? rng.int(GEN.cometCount[0], GEN.cometCount[1]) : 0;

  let description = lore.description;
  let statusLabel = lore.statusLabel;
  if (home && home.robotic) {
    description = roboticRuinLine(rng) + ' ' + description;
    statusLabel = 'Руины · роботы';
  } else if (home && home.destroyed) {
    description = catastropheLine(rng) + ' ' + description;
    statusLabel = 'Руины · катастрофа';
  } else if (home && home.obliterated) {
    description = obliterationLine(rng) + ' ' + description;
    statusLabel = 'Руины · уничтожена';
  }
  if (scoutFlagship) {
    description += ' Сквозь систему медленно идёт одинокий флагман-разведчик, высматривающий планету под новую колонию.';
  }

  // #H: name the flagship this system fields (if any) + a context-aware story
  const hasFlagship = !roboticTraffic && (fleetDwelling || scoutFlagship || ships >= 3);
  const habitable = planetKinds.has('terran') || planetKinds.has('ocean');
  const flagship = hasFlagship
    ? generateFlagship(rng, { status, fleetDwelling, scoutFlagship, habitable, systemName: name })
    : null;
  // #H: give every orbital station its own name
  for (const p of planets) {
    if ((p.civObjects && p.civObjects.station) || p.colonyStation || p.gasStation) {
      p.stationName = generateStationName(rng);
    }
  }

  return {
    seed: String(seed),
    kind: 'star',
    genVersion: GEN_VERSION, // rule set this system was generated under
    name,
    status,
    statusLabel,
    description,
    star,
    binary,
    ageGyr,
    flagship,
    history: generateHistory(rng, { status, ageGyr, star }),
    resources: res.list,
    useFor: res.use,
    fact: generateFact(rng),
    planets,
    ships,
    comets,
    civLevel,
    roboticTraffic, // robots-only cargo traffic in a dead world (#8)
    fleetDwelling, // survivors live aboard a roaming flagship (#10)
    scoutFlagship, // lone roaming colony-scout in a wild system (#25)
    faction: rng.pick(FLEET_FACTIONS), // styles this system's fleet (#11)
  };
}

/** Deterministic Fisher–Yates shuffle driven by the system rng. */
function shuffled(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/** The supermassive black hole at the galactic centre (a selectable object). */
export function generateGalacticCore() {
  return {
    seed: 'galactic-core',
    kind: 'blackhole',
    variant: 'galactic',
    name: 'Стрелец A*',
    status: 'blackhole',
    statusLabel: 'Чёрная дыра',
    description:
      'В самом сердце галактики прячется сверхмассивная чёрная дыра. Вокруг неё на бешеной скорости носятся звёзды, а свет, подошедший слишком близко, исчезает навсегда.',
    star: { label: 'Сверхмассивная чёрная дыра', desc: 'масса ≈ 4 млн Солнц', color: '#000000', radius: 8, activity: 0 },
    ageGyr: 13.6,
    history:
      'Она росла вместе с галактикой больше 13 миллиардов лет, поглощая газ, звёзды и целые скопления. Сегодня на ней держится вся форма Млечного Пути.',
    resources: [],
    useFor: 'центр галактики и предел, за который нет возврата',
    fact: 'У горизонта чёрной дыры время для стороннего наблюдателя будто застывает.',
    planets: [],
    ships: 0,
    blackHole: { radius: 8, inner: 13, outer: 44, beta: 0.45, colors: { in: '#fff1d0', mid: '#ffae46', out: '#7a2206' } },
  };
}

/** A special "Interstellar" system: Gargantua + the Endurance ship. */
export function generateInterstellar() {
  return {
    seed: 'interstellar',
    kind: 'blackhole',
    variant: 'gargantua',
    special: true, // a special encounter — magenta "special" marker + badge
    name: 'Гаргантюа',
    status: 'blackhole',
    statusLabel: 'Чёрная дыра · «Интерстеллар»',
    description:
      'Гигантская вращающаяся чёрная дыра, оплетённая сияющим диском: из-за искривления света он будто оборачивается над и под ней. В её свете медленно парит станция-кольцо «Эндюранс».',
    star: { label: 'Гаргантюа', desc: 'вращающаяся сверхмассивная чёрная дыра', color: '#000000', radius: 9, activity: 0 },
    ageGyr: 10.0,
    history:
      'Возле неё время течёт иначе: час на ближней планете стоит семи лет снаружи. Сюда пришли те, кто искал человечеству новый дом.',
    resources: [],
    useFor: 'врата к другим мирам и ловушка времени',
    fact: 'Возле чёрной дыры время идёт медленнее — на этом и построен сюжет «Интерстеллара».',
    planets: [],
    ships: 0,
    endurance: true,
    blackHole: { radius: 9, inner: 13.5, outer: 46, beta: 0.0, colors: { in: '#fff1d0', mid: '#f2a93b', out: '#9a3a08' } },
  };
}

/** A special "Death Star" event (#12/#10): the imperial battle station inside a
 *  real star system, having just destroyed Alderaan — recreating the film scene,
 *  with Yavin + its rebel moon nearby. Lightly anonymised. */
export function generateDeathStar() {
  return makeSpecialSystem({
    seed: 'death-star',
    name: 'Сектор Альдераан',
    status: 'ruins',
    statusLabel: 'Звезда Смерти · уничтожение Альдераана',
    starLabel: 'Жёлтая звезда (G)',
    starDesc: 'равнодушно светит на обломки Альдераана',
    starColor: '#ffe7a0',
    starRadius: 3.4,
    ageGyr: 6.0,
    description:
      'Здесь Империя показала, на что способна её новая боевая станция: мирный Альдераан разлетелся обломками за один залп её главного орудия. Теперь станция уходит дальше — к джунглям луны Явин-4, где укрылись повстанцы.',
    history:
      'Бронированная станция размером с малую луну способна расколоть планету одним выстрелом. Её собирали десятилетиями в полной тайне; вокруг патрулирует имперский флот клиновидных разрушителей.',
    resources: [],
    useFor: 'абсолютное оружие и символ имперской власти',
    fact: 'Один выстрел её главного орудия высвобождает энергию небольшой звезды.',
    ships: 4,
    comets: 0,
    civLevel: 'spacefaring',
    faction: 'imperial',
    deathStar: { radius: 0.62 }, // moon-sized — smaller than the planets
    planetSpecs: [
      {
        label: 'Альдераан',
        biome: 'earthlike',
        radius: 0.7,
        obliterated: true,
        ref: 'Альдераан — мирный безоружный мир-сад, родина принцессы Леи Органы. Звезда Смерти уничтожила его одним залпом как демонстрацию силы — и это подняло всю галактику на восстание. (Star Wars)',
      },
      {
        label: 'Явин',
        biome: 'gas',
        radius: 3.0,
        color: '#c4763e',
        moonCount: 0,
        ref: 'Явин — красный газовый гигант, вокруг которого вращается покрытая джунглями луна Явин-4 с тайной базой повстанцев. (Star Wars)',
      },
      {
        label: 'Явин-4',
        biome: 'jungle',
        radius: 0.6,
        ref: 'Явин-4 — четвёртая луна газового гиганта Явин, сплошь покрытая джунглями и древними пирамидами массасси. Отсюда повстанцы запустили атаку, уничтожившую первую Звезду Смерти (Битва при Явине). (Star Wars)',
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Special hand-crafted "easter egg" systems (#13/#19/#20). They reuse the
// normal star+planets system view; we just hand-build the data from a compact
// planet spec instead of rolling it procedurally.
// ---------------------------------------------------------------------------

// biome keyword (from the specs) → planet type / optional biome palette
const BIOME_KEYWORD = {
  earthlike: { type: 'terran', biome: 'earthlike' },
  ocean: { type: 'terran', biome: 'ocean' },
  jungle: { type: 'terran', biome: 'jungle' },
  tundra: { type: 'terran', biome: 'tundra' },
  rocky: { type: 'rocky' },
  desert: { type: 'desert' },
  lava: { type: 'lava' },
  ice: { type: 'ice' },
  gas: { type: 'gas' },
};

function specPlanet(spec, rng) {
  const kw = BIOME_KEYWORD[spec.biome] || { type: 'rocky' };
  let def;
  let biomeVal = 0;
  let biomeLabel;
  if (kw.biome) {
    const b = BIOME_KEYS[kw.biome];
    def = { ...PLANET_KINDS.terran, c1: b.ocean, c2: b.land, c3: b.land2, biome: b.biome };
    biomeVal = b.biome;
    biomeLabel = b.label;
  } else {
    def = PLANET_KINDS[kw.type] || PLANET_KINDS.rocky;
  }
  if (spec.color) def = { ...def, c2: spec.color };
  const radius = Math.min(Math.max(spec.radius != null ? spec.radius : (def.rMin + def.rMax) * 0.5, 0.3), 3.4);

  const moons = [];
  let moonOrbit = radius * 1.8;
  for (let m = 0; m < (spec.moonCount || 0); m++) {
    const mr = radius * 0.12;
    moonOrbit += mr + radius * 0.5 + 0.4;
    moons.push({ radius: mr, orbit: moonOrbit, angularSpeed: rng.range(0.22, 0.6), phase: rng.range(0, TAU) });
    moonOrbit += mr;
  }

  const planet = {
    type: kw.type,
    def,
    radius,
    orbit: 0, // filled in by makeSpecialSystem once spacing is known
    angularSpeed: 0,
    spinSpeed: rng.range(0.05, 0.22),
    tilt: rng.range(-0.42, 0.42),
    inclination: rng.range(-0.05, 0.05),
    phase: rng.range(0, TAU),
    hasRings: !!spec.hasRings,
    inhabited: !!spec.inhabited,
    ruined: !!spec.dead,
    destroyed: !!spec.destroyed,
    colony: false,
    biome: biomeVal,
    biomeName: kw.biome,
    biomeLabel,
    label: spec.label, // shown verbatim in the planet list (e.g. "Меркурий")
    ref: spec.ref || null, // hand-written reference blurb for the planet card (#2)
    moons,
  };
  if (spec.obliterated) {
    planet.ruined = true;
    planet.obliterated = true;
  }
  if (spec.ishimura) planet.ishimura = true; // Dead Space planet-cracker over it (#5)
  if (spec.inhabited) {
    planet.civLevel = 'spacefaring';
    planet.civLabel = spec.civLabel || 'Космическая цивилизация';
    planet.lightBoost = 1.5;
    // a realistic young world (#8) can override the orbital tech: a modest station
    // kind (ISS) + its own satellite count instead of the default ring-city + 4.
    planet.civObjects = {
      satellites: spec.satellites != null ? spec.satellites : 4,
      station: true,
      stationKind: spec.homeStationKind || null,
    };
  }
  if (spec.colony) {
    planet.colony = true;
    planet.colonyLight = 0.6;
    planet.colonyStation = true;
  }
  // a hand-built gas giant may host a fuel-skimmer platform (collector), like
  // the procedural colonies' gas stations — used by the faction capitals.
  if (spec.gasStation) planet.gasStation = true;
  // a hand-written race may be attached to a living OR a dead world (the extinct
  // builders of a ruined planet still tell their story on its card).
  if (spec.race) planet.race = spec.race;
  return planet;
}

function makeSpecialSystem(o) {
  const rng = createRng(o.seed);
  const star = {
    key: 'S',
    label: o.starLabel,
    desc: o.starDesc,
    color: o.starColor,
    radius: o.starRadius || 3.4,
    habit: true,
    activity: o.activity != null ? o.activity : 0.45,
    solarMass: o.solarMass != null ? o.solarMass : solarMassFromLabel(o.starLabel),
  };
  if (o.binary && o.binary.star2 && o.binary.star2.solarMass == null) {
    o.binary.star2.solarMass = solarMassFromLabel(o.binary.star2.label);
  }

  const FIRST_GAP = star.radius * 0.9 + 3.2;
  const MIN_GAP = 2.6;
  let prevOrbit = 0;
  let prevHalf = star.radius;
  if (o.binary) prevHalf = Math.max(prevHalf, o.binary.separation * 0.5 + o.binary.star2.radius);

  const planets = o.planetSpecs.map((spec, i) => {
    const p = specPlanet(spec, rng);
    const ringOuter = p.hasRings ? p.radius * 2.25 : 0;
    const moonReach = p.moons.length ? p.moons[p.moons.length - 1].orbit + p.moons[p.moons.length - 1].radius : 0;
    const half = Math.max(p.radius, ringOuter, moonReach);
    const gap = (i === 0 ? FIRST_GAP : MIN_GAP) + rng.range(0.4, 1.6);
    let orbit = prevOrbit + prevHalf + gap + half;
    if (o.binary && i === 0) orbit = Math.max(orbit, o.binary.separation * 2.8 + half);
    p.orbit = orbit;
    p.angularSpeed = (1.4 / Math.pow(orbit, 1.5)) * rng.range(0.9, 1.1);
    prevOrbit = orbit;
    prevHalf = half;
    return p;
  });

  // #H: flagship + station names for the hand-built systems too. A hand-written
  // flagship (name + lore) may be pinned via `flagshipOverride` — the faction
  // capitals fly their CANONICAL named flagship instead of a coined one.
  const ships = o.ships || 0;
  const habitable = planets.some((p) => p.type === 'terran' || p.type === 'ocean');
  const flagship =
    o.flagshipOverride ||
    (!o.roboticTraffic && (o.fleetDwelling || ships >= 3)
      ? generateFlagship(rng, {
          status: o.status,
          fleetDwelling: !!o.fleetDwelling,
          scoutFlagship: false,
          habitable,
          systemName: o.name,
        })
      : null);
  for (const p of planets) {
    if ((p.civObjects && p.civObjects.station) || p.colonyStation || p.gasStation) {
      p.stationName = generateStationName(rng);
    }
  }

  return {
    seed: o.seed,
    kind: 'star',
    name: o.name,
    status: o.status,
    statusLabel: o.statusLabel,
    description: o.description,
    star,
    binary: o.binary || null,
    ageGyr: o.ageGyr,
    flagship,
    history: o.history,
    resources: o.resources || [],
    useFor: o.useFor,
    fact: o.fact || '',
    planets,
    ships,
    comets: o.comets || 0,
    civLevel: o.civLevel || null,
    roboticTraffic: !!o.roboticTraffic,
    fleetDwelling: !!o.fleetDwelling,
    scoutFlagship: false,
    faction: o.faction || 'alliance',
    capital: o.capital || null, // faction id when this system is that fleet's home (#stage6)
    dragonToMars: !!o.dragonToMars, // #8: a Crew Dragon cruising Earth → Mars
    special: true,
    event: !!o.event,
    deathStar: o.deathStar || null, // an in-system battle station (#10)
  };
}

/** #13 — a 1:1 replica of our Solar System. */
export function generateSolarSystem() {
  return makeSpecialSystem({
    seed: 'sol-system',
    name: 'Солнечная система',
    status: 'inhabited',
    statusLabel: 'Дом · Земля',
    starLabel: 'Солнце (G)',
    starDesc: 'жёлтый карлик — наш дом',
    starColor: '#ffd66b',
    starRadius: 4.0,
    activity: 0.45,
    ageGyr: 4.6,
    description:
      'Восемь миров на нитях гравитации вокруг жёлтого карлика. Третий от Солнца — голубая капля жизни, единственный известный дом разума.',
    history:
      'Сформировалась 4,6 млрд лет назад из газопылевого диска. На третьей планете зажглась жизнь, а затем и разум, впервые посмотревший на звёзды.',
    resources: ['вода', 'железо и никель', 'редкие металлы', 'гелий-3'],
    useFor: 'колыбель человечества',
    fact: 'Свет от Солнца идёт до Земли около 8 минут.',
    ships: 1,
    comets: 2,
    civLevel: 'spacefaring',
    faction: 'alliance',
    dragonToMars: true, // a Crew Dragon cruising from Earth to Mars (#8)
    planetSpecs: [
      { label: 'Меркурий', biome: 'rocky', radius: 0.35, color: '#8c7853' },
      { label: 'Венера', biome: 'desert', radius: 0.6, color: '#e8c879' },
      {
        label: 'Земля',
        biome: 'earthlike',
        radius: 0.65,
        moonCount: 1,
        inhabited: true,
        // realistic level (#8): the ISS — a modest modular station, not a ring-city —
        // plus a busy belt of small satellites; no interstellar fleet.
        homeStationKind: 'outpost',
        satellites: 7,
        civLabel: 'Ранняя космическая эра',
        ref: 'Земля — голубой мир воды и воздуха, единственный известный дом жизни и разума. Низкую орбиту опоясывают спутники и одна обитаемая станция; к соседним мирам пока летят лишь зонды да первые корабли.',
        race: {
          name: 'Человечество',
          stageLabel: 'Ранняя космическая эра',
          lore: [
            'Любопытный вид, что едва оторвался от родной планеты: пара отпечатков на Луне, горстка зондов у соседних миров — и уже неутолимая тяга к Марсу и дальше.',
            'Их низкая орбита плотно увешана спутниками связи и наблюдения, а единственную обитаемую станцию они делят на всех по очереди.',
          ],
          description: 'Любопытный вид, едва вышедший за пределы родной планеты, но уже мечтающий о звёздах.',
        },
      },
      { label: 'Марс', biome: 'desert', radius: 0.4, color: '#c1440e', moonCount: 2 },
      // Only Saturn wears visible rings: the real ring systems of Jupiter, Uranus
      // and Neptune are far too faint to read at this art scale, and four ringed
      // giants in a row made the system look wrong (owner report, 2026-07-03).
      { label: 'Юпитер', biome: 'gas', radius: 3.2, color: '#d8a06b', moonCount: 4 },
      { label: 'Сатурн', biome: 'gas', radius: 2.9, color: '#e3c681', hasRings: true, moonCount: 4 },
      { label: 'Уран', biome: 'ice', radius: 1.8, color: '#9fe3e0', moonCount: 4 },
      { label: 'Нептун', biome: 'ice', radius: 1.75, color: '#2a5ccb', moonCount: 4 },
    ],
  });
}

/** #19 — a Dead Space-flavoured dead world easter egg (frozen race + living moon). */
export function generateDeadSpace() {
  return makeSpecialSystem({
    seed: 'deadspace',
    name: 'Чёрный Карантин',
    status: 'ruins',
    statusLabel: 'Руины · карантин',
    starLabel: 'Тусклый красный карлик (M)',
    starDesc: 'еле тлеет над мёртвой колонией',
    starColor: '#ff7a55',
    starRadius: 2.6,
    activity: 0.3,
    ageGyr: 4.6,
    description:
      'Колония молчит уже двенадцать лет, но что-то внутри по-прежнему дышит. Шахтёры подняли из недр Эгиды VII древний красный обелиск — и мёртвые перестали быть мёртвыми. А на промёрзшем краю системы, под километрами льда Тау-Волантиса, спит то, ради чего всё и затевалось.',
    history:
      'Здесь рвали расколотую планету ради руды, пока из глубин не подняли Знак. Сначала колония оглохла от шёпота, потом спасательный корабль застрял на орбите как плавучий саркофаг. Позже выяснилось: исток заразы — на ледяной Тау-Волантис, куда и ушла последняя экспедиция.',
    resources: ['плотная руда', 'обломки Знака', 'красный изотоп', 'брошенный реголит'],
    useFor: 'заброшенная шахтёрская колония / зона карантина',
    fact: 'Иногда самые ценные находки лучше оставить там, где они спали.',
    ships: 0,
    comets: 1,
    planetSpecs: [
      { label: 'Угли Тенебра', biome: 'lava', radius: 0.55, dead: true }, // scorched inner world
      {
        label: 'Эгида VII',
        biome: 'rocky',
        radius: 0.7,
        dead: true,
        destroyed: true,
        ishimura: true, // the USG Ishimura hangs over it, cracking the crust (#5)
        ref: 'Эгида VII — каменистый чёрно-оранжевый мир с расплавленным ядром, истерзанный нелегальной добычей. Здесь из недр подняли древний Красный Обелиск — и колония сошла с ума, а мёртвые перестали быть мёртвыми. Над планетой до сих пор висит корабль-трещинник USG Ishimura. (Dead Space)',
      },
      {
        label: 'Тау-Волантис',
        biome: 'ice',
        radius: 0.85,
        dead: true,
        moonCount: 1,
        ref: 'Тау-Волантис — промёрзшая планета на дальнем краю изученного космоса. Под её вечными льдами древняя цивилизация заморозила Лунного Брата — колоссальный разум-некроморф, рождённый Знаками. Экспедиция, пришедшая оборвать эпидемию в зародыше, нашла здесь её исток. (Dead Space)',
        race: {
          name: 'Строители Знаков',
          stageLabel: 'Погибшая цивилизация',
          extinct: true,
          lore: [
            'Древний народ, что миллионы лет назад ценой собственной гибели заморозил Лунного Брата под километрами льда — лишь бы тот не проснулся.',
            'От них остались только машины подо льдом да сами Знаки, чей шёпот пережил своих создателей.',
          ],
        },
      },
    ],
  });
}

/** #20 — easter-egg worlds nodding to famous sci-fi (lightly anonymised). */
export function generateFilmWorlds() {
  const K = { label: 'Оранжевый карлик (K)', desc: 'тёплый спутник главной звезды', color: '#ffce8e', radius: 3.0 };
  return [
    makeSpecialSystem({
      seed: 'film-twinsun',
      name: 'Двусолнечье',
      status: 'wild',
      statusLabel: 'Окраина · два солнца',
      starLabel: 'Жёлтая звезда (G)',
      starDesc: 'старшая из двух звёзд',
      starColor: '#ffd98a',
      starRadius: 3.5,
      binary: { star2: K, separation: 9 },
      ageGyr: 8.0,
      description:
        'Пыльная окраина галактики, где закат приходит дважды. Фермеры выжимают влагу из раскалённого воздуха, а в прокуренной таверне сходятся охотники за головами и пилоты сомнительной репутации.',
      history: 'Говорят, именно с этого захолустья начал путь мальчишка, которому предстояло перевернуть судьбу галактики.',
      resources: ['влага из воздуха', 'запчасти дроидов', 'контрабанда', 'дешёвое топливо'],
      useFor: 'перевалочный пункт контрабандистов',
      fact: 'Два солнца на закате — и две тени за спиной.',
      ships: 2,
      planetSpecs: [
        {
          label: 'Татуин',
          biome: 'desert',
          radius: 0.7,
          color: '#d8b46a',
          ref: 'Татуин — пустынный мир под двумя солнцами на дальней окраине Галактики, у перекрёстка контрабандных троп. Родина Люка Скайуокера; в космопорте Мос-Айсли здесь сходятся торговцы, охотники за головами и пилоты сомнительной репутации. (Star Wars)',
        },
        { label: 'Песчаный Скит', biome: 'rocky', radius: 0.5 },
      ],
    }),
    makeSpecialSystem({
      seed: 'film-spice',
      name: 'Пряный Предел',
      status: 'inhabited',
      statusLabel: 'Пустыня · Пряность',
      starLabel: 'Бело-голубой гигант (B)',
      starDesc: 'жжёт безводный мир',
      starColor: '#cdddff',
      starRadius: 4.4,
      ageGyr: 6.0,
      description:
        'Мир без единой капли дождя — и дороже всех остальных вместе взятых. Под бескрайними дюнами спят колоссальные черви, и каждый неосторожный шаг в ритме песка способен их разбудить.',
      history: 'Кто держит эти пески, держит за горло всю галактику: без Пряности нет дальних перелётов.',
      resources: ['Пряность', 'вода на вес золота', 'зубы червей', 'соляные копи'],
      useFor: 'единственный источник Пряности',
      fact: 'Тот, кто контролирует Пряность, контролирует Вселенную.',
      ships: 3,
      civLevel: 'spacefaring',
      faction: 'imperial',
      planetSpecs: [
        {
          label: 'Арракис',
          biome: 'desert',
          radius: 0.9,
          color: '#caa35f',
          inhabited: true,
          ref: 'Арракис (Дюна) — самый опасный и самый ценный мир известной вселенной: сплошная пустыня и единственный источник специи-меланжа, без которой невозможны межзвёздные перелёты. Под дюнами спят колоссальные черви-шаи-хулуды, а коренные фримены берегут каждую каплю воды. (Dune)',
          race: {
            name: 'Фримены',
            stageLabel: 'Космическая цивилизация',
            description: 'Закалённые жители дюн в дистикомбах, что по капле собирают влагу тела; глаза их синие от Пряности.',
          },
        },
      ],
    }),
    makeSpecialSystem({
      seed: 'film-jungle',
      name: 'Спутник Бурь',
      status: 'inhabited',
      statusLabel: 'Луна-джунгли',
      starLabel: 'Жёлтая звезда (G)',
      starDesc: 'согревает далёкую луну',
      starColor: '#ffe7a0',
      starRadius: 3.6,
      ageGyr: 3.0,
      description:
        'Луна-джунгли, что светится в ночи и дышит как единое существо. Леса мерцают в темноте, а целые горы парят в небе на магнитных потоках.',
      history: 'Синекожий народ живёт в согласии с лесом, сплетённым в одну живую сеть. Пришельцы рвутся вглубь за бесценным камнем, не понимая, что воюют против самой планеты.',
      resources: ['парящий минерал', 'биолюминесцентная флора', 'редкие сплавы', 'живая древесная сеть'],
      useFor: 'добыча сверхредкого минерала',
      fact: 'Здесь каждое дерево хранит память предков.',
      ships: 3,
      civLevel: 'spacefaring',
      faction: 'precursor',
      planetSpecs: [
        {
          label: 'Полифем',
          biome: 'gas',
          radius: 3.0,
          color: '#b9a06a',
          hasRings: true,
          moonCount: 2,
          ref: 'Полифем — газовый гигант в системе Альфа Центавра, названный в честь циклопа из мифов. У него четырнадцать спутников, и самый знаменитый из них — обитаемая луна Пандора. (Avatar)',
        },
        {
          label: 'Пандора',
          biome: 'jungle',
          radius: 0.85,
          inhabited: true,
          moonCount: 1,
          ref: 'Пандора — обитаемая луна газового гиганта Полифема, сплошь покрытая биолюминесцентными джунглями и парящими в небе горами. Дом синекожего народа На’ви; ради редчайшего анобтаниума сюда рвутся люди, не понимая, что воюют против самой живой планеты. (Avatar)',
          race: {
            name: 'На’ви',
            stageLabel: 'Племенная цивилизация',
            description: 'Рослые синекожие охотники, сплетённые нервущей связью с живой нейросетью своего леса.',
          },
        },
      ],
    }),
    makeSpecialSystem({
      seed: 'film-ice',
      name: 'Ледяная Глушь',
      status: 'inhabited',
      statusLabel: 'Ледяной мир · база',
      starLabel: 'Бело-голубая звезда (A)',
      starDesc: 'светит, но не греет',
      starColor: '#dfe8ff',
      starRadius: 4.0,
      ageGyr: 9.0,
      description:
        'Замёрзший мир, где ночь убивает быстрее любого врага. Вечная метель хоронит под снегом всё живое, а в ледяных пещерах таится зверь, чьи когти не знают пощады.',
      history: 'Повстанцы укрылись в туннелях подо льдом и патрулируют белую пустыню верхом на лохматых ящерах.',
      resources: ['лёд', 'геотермальное тепло', 'шкуры ящеров', 'укрытие во льдах'],
      useFor: 'тайная база мятежников',
      fact: 'Когда с орбиты сходят шагающие крепости, бой за ледник решает всё.',
      ships: 3,
      civLevel: 'spacefaring',
      faction: 'alliance',
      planetSpecs: [
        {
          label: 'Хот',
          biome: 'tundra',
          radius: 0.8,
          inhabited: true,
          ref: 'Хот — ледяная планета, где ночь убивает быстрее любого врага. В её пещерах укрылась повстанческая база «Эхо», пока Империя не обрушила на неё шагающие крепости AT-AT. Местные таунтауны служат верховыми животными, а в ледяных норах таится свирепый вампа. (Star Wars)',
          race: {
            name: 'Повстанцы базы «Эхо»',
            stageLabel: 'Космическая цивилизация',
            description: 'Упрямые повстанцы, что прячут флот в ледяных пещерах и не сдаются даже на краю гибели.',
          },
        },
        { label: 'Стылый Спутник', biome: 'ice', radius: 0.4 },
      ],
    }),
  ];
}

/** #stage6 — the six faction HOME systems ("capitals"): one hand-crafted system
 *  per fleet faction, settled by it (fixed `faction`, no round-robin), flying
 *  its CANONICAL named flagship and flagged `capital: <factionId>` so the map
 *  can ink their markers in the faction colour. Appended to the catalog AFTER
 *  every existing special — adding them shifts no prior rng draw. */
export function generateFactionCapitals() {
  return [
    makeSpecialSystem({
      seed: 'capital-alliance',
      name: 'Первая Верфь',
      status: 'inhabited',
      statusLabel: 'Столица · Альянс',
      capital: 'alliance',
      faction: 'alliance',
      civLevel: 'spacefaring',
      starLabel: 'Оранжевый карлик (K)',
      starDesc: 'спокойный очаг над общими стапелями',
      starColor: '#ffce8e',
      starRadius: 3.0,
      activity: 0.5,
      ageGyr: 6.2,
      description:
        'Спокойная система у оранжевого карлика, где над родным миром аэларов висит первая общая верфь галактики. Сюда не прилетают завоёвывать — сюда прилетают чиниться, учиться и подписывать. Синий маяк Первой Верфи виден раньше самой станции.',
      history:
        'После Войны Ста Флагов уцелевшие привели сюда то, что осталось от их доков, и состыковали обломки в одну станцию. На её переборке подписали Договор — без трона, без столицы, с одним обещанием на сотне языков. С тех пор вся система зовётся так, как звалась та станция: Первая Верфь.',
      resources: ['корабельная сталь', 'сварочные сплавы', 'топливный гелий Балласта', 'навигационные карты маршрутов'],
      useFor: 'столица Альянса Свободных Верфей',
      fact: 'Договор подписан не чернилами, а сваркой: подписи выварены на переборке старого дока, и её никогда не красят.',
      ships: 5,
      comets: 1,
      flagshipOverride: {
        name: 'Тихая Гавань',
        lore: [
          '«Тихая Гавань» — двухкорпусный авианосец, головной корабль класса «Гавань»: два корпуса, соединённые доковым пролётом, куда помещается и звено истребителей, и повреждённый корвет целиком.',
          'Её собрали из двух недостроенных корпусов, брошенных войной на разбитых стапелях, — и доковый пролёт стал общим цехом уцелевших ещё до подписания Договора. На переборке пролёта выбиты имена экипажей, снятых ею с обречённых кораблей на рубежах Империи и Роя, — список давно перевалил за шесть тысяч. У навигаторов Альянса есть поговорка: не знаешь, куда идти, — иди к «Гавани».',
        ],
      },
      planetSpecs: [
        {
          label: 'Аэла',
          biome: 'earthlike',
          radius: 0.72,
          moonCount: 1,
          inhabited: true,
          civLabel: 'Родной мир аэларов',
          ref: 'Родной мир аэларов: невысокие города вдоль побережий, посадочные поля вместо космопортов, старые песни в ритме работы. Над экватором висит кольцевой хаб-верфь — первое, что видит любой корабль, идущий в систему. Аэлары говорят, что планета — это тоже док, просто очень старый.',
          race: {
            name: 'Аэлары',
            stageLabel: 'Космическая цивилизация',
            lore: [
              'Аэлары не любят громких слов и длинных клятв: у них считается, что обещание, произнесённое дважды, наполовину съедено. Поэтому Договор они подписали молча — и держат его дольше всех.',
              'Их дети учатся варить шов раньше, чем писать: первый знак аэларской азбуки — сварочный стежок. Старые песни аэларов поют в ритме работы, и в доках их подхватывают на всех языках Альянса.',
              'Навигаторы-аэлары славятся тем, что возвращаются. Не самым быстрым маршрутом и не самым коротким — тем, который приведёт домой весь конвой.',
            ],
            description: 'Негромкий народ верфей: лучшие сварщики и навигаторы Альянса.',
          },
        },
        {
          label: 'Стапель',
          biome: 'rocky',
          radius: 0.55,
          colony: true,
          ref: 'Промышленный мир-доки: открытые литейные поля, орбитальные краны, смены, которые не прекращаются со дня подписания Договора. Здесь катают броневой лист для половины флота Альянса. Имя планете дали докеры — и оно прижилось раньше, чем попало в атласы.',
        },
        {
          label: 'Балласт',
          biome: 'gas',
          radius: 2.6,
          moonCount: 3,
          gasStation: true,
          ref: 'Газовый гигант с тремя лунами — топливный причал системы. У его облаков дежурят сборщики, а на лунах живут заправочные команды, знающие каждый танкер флота по голосу двигателей. Тихое место с самой скучной и самой важной работой в системе.',
        },
      ],
    }),
    makeSpecialSystem({
      seed: 'capital-imperial',
      name: 'Зольный Престол',
      status: 'inhabited',
      statusLabel: 'Столица · Империя Пепла',
      capital: 'imperial',
      faction: 'imperial',
      civLevel: 'spacefaring',
      starLabel: 'Белая звезда (A)',
      starDesc: 'холодный и яркий свет над пепелищем',
      starColor: '#f2f5ff',
      starRadius: 4.6,
      activity: 0.28,
      ageGyr: 3.8,
      description:
        'Домашняя система Империи Пепла под холодной белой звездой класса A. Здесь висит поле обломков расколотого Хешта — рана, вокруг которой построено государство, — и тронный мир Наковальня, самая укреплённая верфь галактики.',
      history:
        'До Войны Ста Флагов система носила другое имя; теперь его произносят только в поминальных списках. Когда Хешт раскололся, уцелевшие не ушли к чужим солнцам — остались среди обломков и отстроились на соседней Наковальне. С тех пор это единственная столица галактики, над которой всегда видно, чем кончается слабость.',
      resources: ['броневая оружейная сталь', 'военные верфи полного цикла', 'дейтериевый лёд Бдения', 'осколки Хешта — святыня, не товар'],
      useFor: 'столица Империи Пепла',
      fact: 'Каждый корабль Империи несёт в киле осколок расколотого Хешта — его вваривают раньше всякой стали.',
      ships: 5,
      comets: 1,
      flagshipOverride: {
        name: 'Тризна',
        lore: [
          '«Тризна» — чёрный четырёхсотметровый дредноут с алыми клинками маркировки, флагманский класс Империи Пепла: боевой корабль и поминальный зал под одной бронёй.',
          'Головная «Тризна» собрана из брони кораблей, погибших при расколе Хешта, а её киль отлит вокруг самого крупного осколка, какой когда-либо поднимали с поля обломков. Класс не участвует в парадах: «Тризна» покидает док только тогда, когда Империя уже решила стрелять.',
        ],
      },
      planetSpecs: [
        {
          label: 'Хешт',
          biome: 'rocky',
          radius: 0.7,
          dead: true,
          destroyed: true,
          ref: 'Расколотый родной мир хештов: вместо планеты — медленно вращающееся поле обломков. Святыня и рана; сюда не садятся — сюда приходят молчать, заглушив двигатель на границе поля. Единственное, что отсюда берут, — осколки коры для килей новых кораблей.',
        },
        {
          label: 'Наковальня',
          biome: 'rocky',
          radius: 0.62,
          moonCount: 1,
          inhabited: true,
          civLabel: 'Тронный мир хештов',
          ref: 'Тронный мир Империи: чёрные города-арсеналы, вкопанные в скальные хребты, кольцевой хаб-крепость на орбите и небо, в котором всегда виден расколотый Хешт. Здесь стоит Пепельный Трон и куётся весь имперский флот.',
          race: {
            name: 'Хешты',
            stageLabel: 'Космическая цивилизация',
            lore: [
              'Хешты — народ Империи Пепла, переживший гибель собственного мира в Войну Ста Флагов. Их культура выстроена вокруг памяти: имена погибших носят корабли, улицы и дети.',
              'Траур у хештов — не слабость, а дисциплина: скорбит тот, кто помнит, а помнит тот, кто не допустит повторения. Отсюда их клятва — больше никогда не быть уязвимыми.',
              'К другим народам хешты не жестоки, но и не равны с ними: чужак может жить под защитой Империи и строить её корабли, а гражданином не станет. Империя называет это честностью.',
            ],
            description: 'Народ расколотого мира, превративший траур в дисциплину, а клятву — в государство.',
          },
        },
        {
          label: 'Бдение',
          biome: 'ice',
          radius: 0.9,
          colony: true,
          ref: 'Ледяной гарнизонный мир на внешнем рубеже системы. Под коркой льда — казармы, склады на десятилетия осады и доки быстрого развёртывания; вахту здесь несут молча и называют её бдением.',
        },
      ],
    }),
    makeSpecialSystem({
      seed: 'capital-swarm',
      name: 'Первый Сад',
      status: 'inhabited',
      statusLabel: 'Столица · Рой',
      capital: 'swarm',
      faction: 'swarm',
      civLevel: 'spacefaring',
      starLabel: 'Жёлтый карлик (G)',
      starDesc: 'тёплое солнце над миром-садом',
      starColor: '#fff0cc',
      starRadius: 3.5,
      activity: 0.45,
      ageGyr: 5.1,
      description:
        'Тёплый жёлтый карлик и три мира при деле: прародина-сад под сплошными джунглями, океан-питомник, где зреют молодые кили, и газовый гигант с пастбищами полипов. Ни одно имя здесь не дано хозяевами — систему назвали чужие картографы, а Рой не возразил, потому что не заметил.',
      history:
        'Картографы нашли систему через десятилетия после первого контакта — шли по течениям спор против потока, как ищут исток реки. Старейшие панцири в орбитальном кольце-улье старше Войны Ста Флагов; что было до них, не знает никто, и меньше всех — сам Рой.',
      resources: ['корабельный хитин', 'споры-семена', 'биолюминесцентная смола', 'полипный газ'],
      useFor: 'прародина Роя',
      fact: 'Все названия в этой системе дали чужие — сам Рой не назвал здесь ничего, даже себя.',
      ships: 4,
      comets: 2,
      flagshipOverride: {
        name: 'Идущий лес',
        lore: [
          '«Идущий лес» — выращенный левиафан флагманской роли: четыреста метров живого хитина, рощи мшистых гребней и медленный зелёный свет вдоль борта. Экипаж ему не нужен — он сам себе экипаж.',
          'Имя дали скауты Альянса, годами наблюдавшие, как он ведёт цветение вдоль рубежа: издали его силуэт с гребнями похож на лес, снявшийся с места. Однажды он прошёл сквозь имперскую блокаду, не изменив курса и не открыв огня. Единственное, перед чем он когда-либо свернул, — маршрут Предтеч.',
        ],
      },
      planetSpecs: [
        {
          label: 'Прародина',
          biome: 'jungle',
          radius: 0.8,
          inhabited: true,
          civLabel: 'Мир-сад Роя',
          ref: 'Мир-сад, с орбиты сплошь зелёный, без единого огня городов — города здесь не строят, здесь растут. На орбите висит выращенное кольцо-улей; с поверхности оно видно ночью как медленная зелёная звезда. Считается прародиной Поросли, хотя сама Поросль ничего не считает.',
          race: {
            name: 'Поросль',
            stageLabel: 'Космическая цивилизация',
            lore: [
              '«Поросль» — имя из чужих атласов: первые картографы записали её как погодное явление, «цветение», и поправку внесли лишь наполовину. Сама она себя не зовёт никак — имя нужно тому, кто отличает себя от других.',
              'Что такое отдельная особь Поросли — вопрос без ответа: корабль, риф, гребень мха на скале и волна света в стае — одно существо или миллиард, зависит от того, где резать. Поросль не режет.',
              'Она не зла и не добра. Она растёт — как лес поднимается по склону: медленно, без намерения и без остановки.',
            ],
            description: 'Монораса-коллектив; лес, научившийся расти между звёзд.',
          },
        },
        {
          label: 'Питомник',
          biome: 'ocean',
          radius: 0.75,
          colony: true,
          ref: 'Океанский мир: в тёплых отмелях зреют молодые кили, и по ночам вода светится вдоль всей береговой линии. Сюда же приходят умирать старые корабли — их панцири ложатся рифами, и на рифах прорастает новое поколение. Кладбище и родильный дом здесь неразличимы.',
        },
        {
          label: 'Пастбище',
          biome: 'gas',
          radius: 2.4,
          moonCount: 2,
          gasStation: true,
          ref: 'Газовый гигант, в верхних облаках которого пасутся стада газовых полипов. Среди диких ходят сборщики Роя — наевшись, они тяжелеют, тускнеют и всплывают к орбите отдавать. Чужие танкеры держатся выше и завидуют молча.',
        },
      ],
    }),
    makeSpecialSystem({
      seed: 'capital-syndicate',
      name: 'Меридиан-Ноль',
      status: 'inhabited',
      statusLabel: 'Столица · Синдикат',
      capital: 'syndicate',
      faction: 'syndicate',
      civLevel: 'spacefaring',
      starLabel: 'Белая звезда (A)',
      starDesc: 'стерильный свет над нулевым меридианом',
      starColor: '#f2f5ff',
      starRadius: 4.6,
      activity: 0.28,
      ageGyr: 4.4,
      description:
        'Белая звезда класса A и три актива на её балансе — штаб-квартира Синдиката «Меридиан». Здесь сходятся все маршруты галактики: не физически — юридически. Каждый тариф, каждое расписание и само галактическое время отсчитываются от нулевого меридиана Прайма.',
      history:
        'Систему не колонизировали — её приобрели: после Войны Ста Флагов Синдикат выкупил её вместе с долгами прежних владельцев и перенёс сюда головной офис. С тех пор Прайм застроен сплошным городом под стеклом, а на орбите запущены эталонные часы, заверяющие сделки половины галактики.',
      resources: ['маршрутные лицензии', 'эталонное время', 'редкие металлы Актива-2', 'топливные фьючерсы Резерва'],
      useFor: 'штаб-квартира Синдиката «Меридиан»',
      fact: 'Ни одна сделка в галактике не считается закрытой, пока её не заверили эталонные часы Прайма.',
      ships: 4,
      comets: 1,
      flagshipOverride: {
        name: 'Контрольный пакет',
        lore: [
          '«Контрольный пакет» — четырёхсотметровый белоснежный лайнер-штаб: гладкий корпус, стеклянные купола вдоль хребта, циановая линия от носа до дюз. Не боевой корабль — головной офис, который приходит к вам сам.',
          'Заложен сразу после Войны Ста Флагов на стапелях верфи, выкупленной у погибшего флота, — Синдикат считает это не иронией, а рачительностью. За всю историю корабль не сделал ни одного выстрела; тем не менее в дюжине систем его появление на орбите записано в хрониках словом «поглощение».',
        ],
      },
      planetSpecs: [
        {
          label: 'Прайм',
          biome: 'earthlike',
          radius: 0.7,
          satellites: 9,
          inhabited: true,
          civLabel: 'Штаб-квартира Синдиката',
          ref: 'Мир-штаб: сплошной город под стеклом, над ним — кольцевой хаб «нулевого меридиана», от которого отсчитываются все маршруты галактики. За соседними столами здесь сидят десятки рас — Синдикат нанимает всех, кто подписывает. Единственная сегрегация — по классам акций.',
        },
        {
          label: 'Актив-2',
          biome: 'rocky',
          radius: 0.5,
          colony: true,
          ref: 'Добывающий актив: скальный мир, выработанный на треть и переоценённый в большую сторону. Шахтные города арендуют воздух у корпорации — вычет из жалования, пункт стандартный.',
        },
        {
          label: 'Резерв',
          biome: 'gas',
          radius: 2.8,
          moonCount: 2,
          gasStation: true,
          ref: 'Газовый гигант, у которого торгуют топливом половины галактики. Белые газосборщики висят в верхних слоях, как канделябры; цена дейтерия рождается здесь дважды в сутки.',
        },
      ],
    }),
    makeSpecialSystem({
      seed: 'capital-cartel',
      name: 'Вольная Гавань',
      status: 'inhabited',
      statusLabel: 'Столица · Картель',
      capital: 'cartel',
      faction: 'cartel',
      civLevel: 'spacefaring',
      starLabel: 'Красный карлик (M)',
      starDesc: 'тусклый очаг окраины',
      starColor: '#ff8a55',
      starRadius: 2.6,
      activity: 0.55,
      ageGyr: 7.3,
      description:
        'Тусклый красный карлик на краю рукава, который не был нужен никому — пока не понадобился всем, кому некуда было лететь. Вокруг него вырос старейший вольный порт галактики: толчея бортов у газового гиганта, свалка-верфь и доки, где плиты не гаснут.',
      history:
        'Первые корабли пришли сюда в конце Войны Ста Флагов — дезертиры и беженцы, которых не ждали ни под одним флагом. Первый док они собрали из собственных разбитых бортов, а следующих гостей уже не прогоняли: прогонять беглеца — значит делать то, от чего бежал сам. Так место, которого не было на картах, стало домом для всех, кого с карт вычеркнули.',
      resources: ['корабельный лом', 'топливный газ', 'сварные корпуса', 'контрабанда'],
      useFor: 'главный вольный порт Картеля',
      fact: 'За всю историю Гавани отсюда не выдали ни одного человека — единственная статистика, которую здесь ведут честно.',
      ships: 5,
      comets: 2,
      flagshipOverride: {
        name: 'Мамаша',
        lore: [
          '«Мамаша» — флагман-матка Вольного Картеля: четыреста метров сшитых воедино чужих корпусов, сорок шлюзов, доки, рынок и две тысячи экипажа. Не столько боевой корабль, сколько летающий порт, который приходит туда, где своего порта нет.',
          'Её начали варить в последний год Войны Ста Флагов — из кораблей тех, кто ушёл из своих флотов и не мог вернуться. В корпусе до сих пор различимы плиты шести разных верфей, и ни одну не стали перекрашивать: пусть видно, из чего сделан дом. Когда в порту говорят «мамка пришла», это значит: всё, теперь есть куда отступать.',
        ],
      },
      planetSpecs: [
        {
          label: 'Толстяк',
          biome: 'gas',
          radius: 3.0,
          moonCount: 3,
          gasStation: true,
          ref: 'Полосатый газовый гигант, вокруг которого крутится вся жизнь Гавани: газосборщики, сотни доков, вечная толчея бортов на подходах. Диспетчеров нет — есть очередь, и её здесь уважают больше законов. Говорят, Толстяк кормит половину Картеля, и это почти не преувеличение.',
        },
        {
          label: 'Куча',
          biome: 'rocky',
          radius: 0.5,
          inhabited: true,
          homeStationKind: 'outpost',
          civLabel: 'Вольный порт',
          ref: 'Каменный мир, заваленный корабельным ломом трёх веков: здесь корабли разбирают, пересобирают и отпускают летать дальше. Живёт на Куче сброд всех рас — дезертиры, старатели и их внуки, давно переставшие делить друг друга по крови. На орбите висит аванпост: наполовину таможня, наполовину рынок, и обе половины врут.',
        },
        {
          label: 'Погреб',
          biome: 'ice',
          radius: 0.7,
          ref: 'Ледяной мир на дальней орбите, в трещинах которого прячут груз, которого не должно существовать, и людей, которых не должны найти. Карт Погреба нет — есть люди, которые помнят, и этого достаточно.',
        },
      ],
    }),
    makeSpecialSystem({
      seed: 'capital-precursor',
      name: 'Чертог Молчания',
      status: 'inhabited',
      statusLabel: 'Столица · Предтечи',
      capital: 'precursor',
      faction: 'precursor',
      civLevel: 'spacefaring',
      starLabel: 'Жёлто-белая звезда (F)',
      starDesc: 'очень старый ровный свет',
      starColor: '#fff7ea',
      starRadius: 4.0,
      activity: 0.3,
      ageGyr: 11.8,
      description:
        'Система очень старой жёлто-белой звезды, вокруг которой всё стоит на своих местах — так, будто его только что поправили. Над пустынной Скрижалью висит золотой хаб из парящих осколков, а подо льдом Архива спят незапертые хранилища. Карты всех шести флотов помечают систему одинаково: не мешать.',
      history:
        'Никто не помнит эту систему молодой: она была такой на самых старых картах и не изменилась ни на одной новой. Война Ста Флагов прошла мимо неё, как река мимо камня. Хозяева ушли задолго до всех хроник — но города выметены, а сад на Скрижали поливают до сих пор.',
      resources: ['руническая бронза', 'удерживающий свет', 'древние сплавы осколков', 'спящие архивы'],
      useFor: 'последняя гавань Предтеч',
      fact: 'Здесь никто не встречал хозяев — но пыли нет нигде.',
      ships: 3,
      comets: 1,
      flagshipOverride: {
        name: 'Тот, Кто Остался',
        lore: [
          '«Тот, Кто Остался» — золотой корабль-руна: монолит-обелиск в кольце парящих осколков, самый большой из кораблей Предтеч. Имя — перевод руны на его борту, сделанный чужими картографами.',
          'Единственный корабль Предтеч с кольцевым маршрутом: он никуда не идёт — он обходит. В Войну Ста Флагов его линия трижды пересекала фронты, и трижды он прошёл сквозь строй, не открывая огня; строй не восстановился ни разу. Аэларские навигаторы переводят руну на его борту тремя словами и до сих пор спорят о четвёртом.',
        ],
      },
      planetSpecs: [
        {
          label: 'Скрижаль',
          biome: 'desert',
          radius: 0.85,
          inhabited: true,
          civLabel: 'Старшая раса',
          ref: 'Пустынный древний мир, чьи города с орбиты читаются как строки текста. Улицы почти пусты, но выметены; единственный сад поливают, хотя дождей не было тысячелетиями. Над планетой висит золотой хаб — осколки, удерживаемые тёплым светом.',
          race: {
            name: 'Предтечи',
            stageLabel: 'Старшая раса',
            lore: [
              'Старшая раса галактики ушла задолго до всех войн и всех хроник — куда и зачем, не записано нигде. Остались корабли на маршрутах, прибранные города и руины на мёртвых мирах.',
              'Тех, кто остался, видят редко: высокие силуэты в конце улицы, всегда за работой — поправляют, выметают, поливают. С гостями они не заговаривают, но и не прогоняют их; разговор просто не складывается.',
              'С Предтечами не воюют. Не потому, что нельзя, — потому что никто не знает, что будет, если начать.',
            ],
            description: 'Высокие тихие силуэты старшей расы; их видят редко, издалека и всегда за работой.',
          },
        },
        {
          label: 'Архив',
          biome: 'ice',
          radius: 0.8,
          ref: 'Ледяной мир спящих хранилищ. Двери не заперты и теплы на ощупь — именно поэтому внутрь никто не входит. Раз в поколение одно из хранилищ ненадолго освещается изнутри.',
        },
      ],
    }),
  ];
}

function applyBiome(planet, biomeName) {
  const b = BIOME_KEYS[biomeName];
  planet.type = 'terran';
  planet.biomeName = biomeName;
  planet.biomeLabel = b.label;
  planet.biome = b.biome;
  // synthesise a kind-1 def with the biome palette
  planet.def = { ...PLANET_KINDS.terran, c1: b.ocean, c2: b.land, c3: b.land2, biome: b.biome };
}
