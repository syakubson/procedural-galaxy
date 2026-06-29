// Procedural star-system data (pure, deterministic from a seed).
//
// Grounded loosely in real physics:
//   - orbital angular speed follows Kepler's third law: omega ∝ a^-1.5 (outer
//     planets move much slower than inner ones);
//   - gas giants are clearly larger than terrestrials but always smaller than
//     the star; moons are small and slow;
//   - only terrestrial worlds in the habitable zone can be inhabited, and only
//     around long-lived stars (F/G/K/M) — hot short-lived O/B never host life.
//
// Inhabited worlds get a biome (earthlike / ocean / jungle / tundra / desert /
// city) and a civilisation stage (tribal / industrial / spacefaring) that drives
// city-light brightness, orbital satellites/stations, colonies on sister worlds,
// and interplanetary ships. No meshes here — systemView/planet build those.

import { createRng } from '../rng.js';
import { GEN } from './genParams.js';
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
// star always dominates). `habit` = can host life (long-lived enough).
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
const PLANET_DEFS = {
  lava: { kind: 3, c1: '#2a1610', c2: '#5a2a18', c3: '#140a08', hot: '#ff6a1e', atmo: '#ff6a30', atmoS: 0.32, clouds: 0, rMin: 0.45, rMax: 0.85 },
  rocky: { kind: 0, c1: '#7a6858', c2: '#998a78', c3: '#34302a', hot: '#000000', atmo: '#6a5a44', atmoS: 0.1, clouds: 0, rMin: 0.4, rMax: 0.9 },
  desert: { kind: 0, c1: '#b89366', c2: '#cdb083', c3: '#6a4a28', hot: '#000000', atmo: '#b89360', atmoS: 0.2, clouds: 0, rMin: 0.5, rMax: 1.0 },
  terran: { kind: 1, c1: '#16406f', c2: '#3f8a4a', c3: '#8a7a55', hot: '#ffd27a', atmo: '#7fb4ff', atmoS: 0.5, clouds: 1, rMin: 0.55, rMax: 1.05 },
  ocean: { kind: 1, c1: '#0e3a66', c2: '#2f7a60', c3: '#6f9a8a', hot: '#ffd27a', atmo: '#88c0ff', atmoS: 0.5, clouds: 1, rMin: 0.6, rMax: 1.1 },
  ice: { kind: 2, c1: '#cfe2f0', c2: '#a0c4e0', c3: '#6f96b4', hot: '#000000', atmo: '#bcd8ee', atmoS: 0.28, clouds: 0, rMin: 0.5, rMax: 1.0 },
  gas: { kind: 4, c1: '#d98c5a', c2: '#a8623a', c3: '#ecd6a8', hot: '#000000', atmo: '#e8c79a', atmoS: 0.35, clouds: 0, rMin: 2.0, rMax: 3.0 },
};

// Habitable-world biomes (Star-Wars-style variety). Colours override the kind-1
// surface; `biome` selects the sub-branch in the planet shader.
const BIOMES = {
  earthlike: { label: 'Земного типа', biome: 0, ocean: '#16406f', land: '#3f8a4a', land2: '#8a7a55' },
  ocean: { label: 'Океанический', biome: 1, ocean: '#0e3a66', land: '#3a8a72', land2: '#6f9a8a' },
  jungle: { label: 'Мир джунглей', biome: 2, ocean: '#15506a', land: '#2f7a2e', land2: '#5e8a36' },
  tundra: { label: 'Ледяной мир', biome: 3, ocean: '#2a4a66', land: '#d4e4ee', land2: '#9ab0c0' },
  desert: { label: 'Пустынный мир', biome: 4, ocean: '#3a6a78', land: '#c9a36b', land2: '#8a6238' },
  city: { label: 'Планета-город', biome: 5, ocean: '#22324a', land: '#6f7588', land2: '#474c5e' },
};

const CIV = {
  tribal: { label: 'Племена', light: 0.3, sats: [0, 0], station: false, colonies: 0, ships: 0 },
  industrial: { label: 'Индустриальная эпоха', light: 1.0, sats: [2, 5], station: false, colonies: 0, ships: 0 },
  spacefaring: { label: 'Космическая цивилизация', light: 1.5, sats: [3, 7], station: true, colonies: 2, ships: 4 },
};

const ZONES = {
  inner: ['lava', 'rocky', 'desert'],
  mid: ['terran', 'ocean', 'rocky', 'desert'],
  outer: ['gas', 'ice', 'gas'],
};

function weightedStar(rng, habitableOnly) {
  const pool = habitableOnly ? STAR_TYPES.filter((t) => t.habit) : STAR_TYPES;
  const total = pool.reduce((s, t) => s + t.weight, 0);
  let x = rng.next() * total;
  for (const t of pool) {
    x -= t.weight;
    if (x <= 0) return t;
  }
  return pool[pool.length - 1];
}

function zoneForIndex(i, n) {
  const f = n <= 1 ? 0 : i / (n - 1);
  if (f < 0.34) return 'inner';
  if (f < 0.67) return 'mid';
  return 'outer';
}

/** Build a full system description from any seed value. */
export function generateSystem(seed) {
  const rng = createRng(seed);

  // status first, so an inhabited system can be constrained to a long-lived star.
  // Warm the generator a couple of steps — mulberry32's first draws off a string
  // seed are mildly biased, which skewed the status mix across systems.
  rng.next();
  rng.next();
  const sRoll = rng.next();
  // #1: roughly a 2/1/1 split — inhabited / wild (untouched) / dead (ruins).
  const status = sRoll < GEN.statusInhabited ? 'inhabited' : sRoll < GEN.statusWild ? 'wild' : 'ruins';
  const star = weightedStar(rng, status === 'inhabited');

  // system age (Gyr): hot massive stars are necessarily young
  const ageMax = star.key === 'O' ? 0.04 : star.key === 'B' ? 2 : star.key === 'A' ? 4 : 13.2;
  const ageGyr = Math.round(rng.range(0.3, ageMax) * 10) / 10;

  // ~28% of systems are a close binary (two suns near each other, #10). Planets
  // then orbit the barycentre (circumbinary). An old system can't host a
  // short-lived O/B companion, so gate the companion's class by age.
  let binary = null;
  if (rng.next() < GEN.binaryChance) {
    const star2 = weightedStar(rng, ageGyr > 3);
    const separation = (star.radius + star2.radius) * 1.3;
    binary = { star2, separation };
  }

  const planetCount = rng.int(GEN.planetCount[0], GEN.planetCount[1]);
  const planets = [];

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
    const zone = zoneForIndex(i, planetCount);
    const type = rng.pick(ZONES[zone]);
    const def = PLANET_DEFS[type];
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
      moons,
    };

    planets.push(planet);
    prevOrbit = orbit;
    prevHalf = half;
  }

  // --- home world for inhabited / ruins systems ---
  let home = null;
  let civLevel = null;
  let roboticTraffic = false; // #8: machines keep cargo moving in a dead world
  let fleetDwelling = false; // #10: survivors live aboard a roaming flagship
  if (status === 'inhabited' || status === 'ruins') {
    let candidates = planets.filter((p) => p.type === 'terran' || p.type === 'ocean');
    if (candidates.length === 0) {
      const mid = planets[Math.min(planets.length - 1, Math.floor(planets.length / 2))];
      mid.type = 'terran';
      mid.def = PLANET_DEFS.terran;
      mid.radius = Math.min(mid.radius, PLANET_DEFS.terran.rMax);
      mid.hasRings = false; // a terran home world shouldn't keep gas-giant rings
      mid.moons = mid.moons.slice(0, 2);
      candidates = [mid];
    }
    home = rng.pick(candidates);

    if (status === 'inhabited') {
      // civilisation stage
      const cRoll = rng.next();
      civLevel = cRoll < GEN.civTribal ? 'tribal' : cRoll < GEN.civIndustrial ? 'industrial' : 'spacefaring';
      const civ = CIV[civLevel];

      // biome — spacefaring leans toward city worlds; others natural variety
      const biomeName =
        civLevel === 'spacefaring' && rng.next() < 0.5
          ? 'city'
          : rng.pick(['earthlike', 'earthlike', 'ocean', 'jungle', 'tundra', 'desert']);
      applyBiome(home, biomeName);

      home.inhabited = true;
      home.civLevel = civLevel;
      home.civLabel = civ.label;
      home.lightBoost = civ.light;
      home.civObjects = {
        satellites: rng.int(civ.sats[0], civ.sats[1]),
        station: civ.station,
      };
      home.race = generateRace(rng, { civLevel, biome: biomeName });

      // colonies on other worlds (spacefaring only, #16) — placed on surfaces
      // whose shader renders settlement lights. We GUARANTEE at least one (so a
      // spacefaring system always reads as colonised) and give some colonies an
      // orbital outpost station, so the colony is unmistakable from space.
      if (civ.colonies > 0) {
        const others = shuffled(
          planets.filter(
            (p) => p !== home && (p.type === 'terran' || p.type === 'ocean' || p.type === 'rocky' || p.type === 'desert'),
          ),
          rng,
        );
        const want = Math.min(civ.colonies, others.length);
        for (let k = 0; k < want; k++) {
          const p = others[k];
          p.colony = true;
          p.colonyLight = 0.6; // clearly visible settlement glow on the night side
          p.colonyStation = true; // #2: every colony gets its own little orbital hub
        }
      }

      // gas-giant skimmer stations (#11) — spacefaring civs harvest the giants
      if (civLevel === 'spacefaring') {
        for (const gp of planets.filter((p) => p.type === 'gas')) {
          if (rng.next() < 0.6) gp.gasStation = true;
        }
      }
    } else {
      // ruins: a former earthlike-ish world, greyed out. More worlds are now
      // actually wrecked (#9), and the catastrophe leaves survivors (#8/#10):
      //   robotic     — everyone died, machines keep the depot running
      //   destroyed   — a catastrophe crater scars the surface
      //   obliterated — blown to pieces by an alien race: a debris field
      //   (else)      — a plain, lifeless greyed-out ruin
      const ruinBiome = rng.pick(['earthlike', 'ocean', 'desert', 'tundra']);
      applyBiome(home, ruinBiome);
      home.ruined = true;
      const rRoll = rng.next();
      let ruinType = 'plain';
      if (rRoll < GEN.ruinRobotic) {
        home.robotic = true;
        ruinType = 'robotic';
      } else if (rRoll < GEN.ruinDestroyed) {
        home.destroyed = true;
        ruinType = 'destroyed';
      } else if (rRoll < GEN.ruinObliterated) {
        home.obliterated = true;
        ruinType = 'obliterated';
      }
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
        // dead planet), or — if nothing else is habitable — now live aboard a
        // roaming flagship.
        const refuge = shuffled(
          planets.filter(
            (p) =>
              p !== home &&
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
  if (status === 'inhabited' && civLevel === 'spacefaring') ships = CIV.spacefaring.ships;
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
    special: true, // a special encounter — magenta «особые» marker + badge
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
    const b = BIOMES[kw.biome];
    def = { ...PLANET_DEFS.terran, c1: b.ocean, c2: b.land, c3: b.land2, biome: b.biome };
    biomeVal = b.biome;
    biomeLabel = b.label;
  } else {
    def = PLANET_DEFS[kw.type] || PLANET_DEFS.rocky;
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
    planet.civLabel = 'Космическая цивилизация';
    planet.lightBoost = 1.5;
    planet.civObjects = { satellites: 4, station: true };
  }
  if (spec.colony) {
    planet.colony = true;
    planet.colonyLight = 0.6;
    planet.colonyStation = true;
  }
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

  // #H: flagship + station names for the hand-built systems too
  const ships = o.ships || 0;
  const habitable = planets.some((p) => p.type === 'terran' || p.type === 'ocean');
  const flagship =
    !o.roboticTraffic && (o.fleetDwelling || ships >= 3)
      ? generateFlagship(rng, {
          status: o.status,
          fleetDwelling: !!o.fleetDwelling,
          scoutFlagship: false,
          habitable,
          systemName: o.name,
        })
      : null;
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
    ships: 4,
    comets: 2,
    civLevel: 'spacefaring',
    faction: 'alliance',
    planetSpecs: [
      { label: 'Меркурий', biome: 'rocky', radius: 0.35, color: '#8c7853' },
      { label: 'Венера', biome: 'desert', radius: 0.6, color: '#e8c879' },
      {
        label: 'Земля',
        biome: 'earthlike',
        radius: 0.65,
        moonCount: 1,
        inhabited: true,
        race: {
          name: 'Человечество',
          stageLabel: 'Космическая цивилизация',
          description: 'Любопытный вид, едва вышедший за пределы родной планеты, но уже мечтающий о звёздах.',
        },
      },
      { label: 'Марс', biome: 'desert', radius: 0.4, color: '#c1440e', moonCount: 2 },
      { label: 'Юпитер', biome: 'gas', radius: 3.2, color: '#d8a06b', hasRings: true, moonCount: 4 },
      { label: 'Сатурн', biome: 'gas', radius: 2.9, color: '#e3c681', hasRings: true, moonCount: 4 },
      { label: 'Уран', biome: 'ice', radius: 1.8, color: '#9fe3e0', hasRings: true, moonCount: 4 },
      { label: 'Нептун', biome: 'ice', radius: 1.75, color: '#2a5ccb', hasRings: true, moonCount: 4 },
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

function applyBiome(planet, biomeName) {
  const b = BIOMES[biomeName];
  planet.type = 'terran';
  planet.biomeName = biomeName;
  planet.biomeLabel = b.label;
  planet.biome = b.biome;
  // synthesise a kind-1 def with the biome palette
  planet.def = { ...PLANET_DEFS.terran, c1: b.ocean, c2: b.land, c3: b.land2, biome: b.biome };
}
