// Finite archetype catalogs for the codex — the source of truth for its
// honest "N of M" counters. Every catalog here enumerates a closed, countable
// set of discoverable ARCHETYPES (not individual finds: two different seeds'
// scout ships from the same faction are the same archetype, recorded once).
// Nothing here is copied from another module's value list — ships/stations/
// planet-kinds/biomes/civ-levels are all imported straight from their real
// source (ships/roles.js, ships/factions.js, systemData.js) so this catalog
// can never silently drift out of sync with what the generator can actually
// produce.

import { GEN } from '../systems/genParams.js';
import { BIOME_KEYS, CIV_LEVELS, PLANET_KINDS, RUIN_BIOMES, RUIN_TYPES } from '../systems/systemData.js';
import { FACTIONS, FACTION_BY_ID } from '../systems/ships/factions.js';
import { ROLES } from '../systems/ships/roles.js';
import { STATION_TYPES } from '../systems/stations.js';

const ROLE_BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r]));

// --- ships: 9 roles × 6 factions = 54 --------------------------------------
// archetypeKey `${factionId}:${roleId}` mirrors buildShip(role, faction)'s own
// argument order (ships.js) so codexViewer.js can split it straight back out.
const SHIP_CATALOG = [];
for (const faction of FACTIONS) {
  for (const role of ROLES) {
    SHIP_CATALOG.push({
      archetypeKey: `${faction.id}:${role.id}`,
      label: `${faction.name} · ${role.name}`,
      factionId: faction.id,
      roleId: role.id,
    });
  }
}

// --- stations: 3 (STATION_TYPES already carries an RU name each) ----------
const STATION_CATALOG = STATION_TYPES.map((t) => ({
  archetypeKey: t.id,
  label: t.name,
  stationType: t.id,
}));

// --- planets: 7 kinds. PLANET_KINDS has no RU label of its own (its fields
// are shader/colour data) — these mirror ui/hud.js's TYPE_LABEL wording (that
// module doesn't export it, so it's re-authored here, not imported: keep the
// two in sync by eye if either changes). -------------------------------------
const PLANET_KIND_LABELS = {
  lava: 'Лавовая планета',
  rocky: 'Каменистая планета',
  desert: 'Пустынная планета',
  terran: 'Планета земного типа',
  ocean: 'Океаническая планета',
  ice: 'Ледяная планета',
  gas: 'Газовый гигант',
};
const PLANET_CATALOG = Object.keys(PLANET_KINDS).map((kind) => ({
  archetypeKey: kind,
  label: PLANET_KIND_LABELS[kind] || kind,
  kind,
}));

// --- living races: 16 reachable (GENERATION.md's reachability table) -------
// {earthlike, ocean, jungle, tundra, desert} × {tribal, industrial,
// spacefaring} = 15, plus city × spacefaring only = 1. `city` is a
// civilisation overlay (GEN.world.cityOverlayChance), never a natural climate
// biome, so it's reachable at the spacefaring level alone — city×tribal and
// city×industrial are NOT in this catalog because generateSystem() can never
// produce them.
const LIVING_BIOMES = Object.keys(BIOME_KEYS).filter((b) => b !== 'city');
const CIV_LEVEL_KEYS = Object.keys(CIV_LEVELS);
const RACE_CATALOG = [];
for (const biome of LIVING_BIOMES) {
  for (const civLevel of CIV_LEVEL_KEYS) {
    RACE_CATALOG.push({
      archetypeKey: `${biome}:${civLevel}`,
      label: `${BIOME_KEYS[biome].label} · ${CIV_LEVELS[civLevel].label}`,
      biome,
      civLevel,
    });
  }
}
RACE_CATALOG.push({
  archetypeKey: 'city:spacefaring',
  label: `${BIOME_KEYS.city.label} · ${CIV_LEVELS.spacefaring.label}`,
  biome: 'city',
  civLevel: 'spacefaring',
});

// --- ruins: RUIN_BIOMES × RUIN_TYPES = 6 × 4 = 24 reachable ----------------
// The FULL cross product is reachable — GENERATION.md's reachability table is
// explicit that a ruin can land on any of the six biomes (city included) at
// any of the four flavours, so no combination is excluded here.
const RUIN_TYPE_LABELS = {
  plain: 'Безжизненные руины',
  robotic: 'Мир машин',
  destroyed: 'Разрушенный мир',
  obliterated: 'Уничтоженный мир',
};
const RUIN_CATALOG = [];
for (const biome of RUIN_BIOMES) {
  for (const ruinType of RUIN_TYPES) {
    RUIN_CATALOG.push({
      archetypeKey: `${biome}:${ruinType}`,
      label: `${BIOME_KEYS[biome].label} · ${RUIN_TYPE_LABELS[ruinType]}`,
      biome,
      ruinType,
    });
  }
}

// --- phenomena: 6, hand-listed from the special/easter-egg scenes ---------
// One entry per one-of-a-kind object systemView.js builds its own class for
// (BlackHole ×2 variants, Endurance, Ishimura, DeathStar, Dragon) — there is
// no generator table to derive these from, they're inherently a fixed list.
// Names match the in-fiction names systemData.js/main.js already use.
const PHENOMENON_CATALOG = [
  { archetypeKey: 'blackhole-galactic', label: 'Чёрная дыра · Стрелец A*' },
  { archetypeKey: 'blackhole-gargantua', label: 'Чёрная дыра · Гаргантюа' },
  { archetypeKey: 'endurance', label: 'Станция «Эндюранс»' },
  { archetypeKey: 'ishimura', label: 'USG Ishimura' },
  { archetypeKey: 'deathstar', label: 'Звезда Смерти «Длань»' },
  { archetypeKey: 'dragon', label: 'Crew Dragon' },
];

const CATALOGS = {
  ship: SHIP_CATALOG,
  station: STATION_CATALOG,
  planet: PLANET_CATALOG,
  race: RACE_CATALOG,
  ruin: RUIN_CATALOG,
  phenomenon: PHENOMENON_CATALOG,
};

/** The 6 finite codex categories (in a stable, catalog-declaration order —
 *  handy for a tab strip). 'system' is NOT one of these: it has no finite
 *  catalog, see codex.js's progress(). */
export const CATEGORIES = Object.keys(CATALOGS);

/** @returns {Array|null} the archetype list for `category`, or null if
 *  `category` has no finite catalog (e.g. 'system'). */
export function catalogFor(category) {
  return CATALOGS[category] || null;
}

// Rarest ruin flavour by roll width, derived from genParams.js's own
// thresholds rather than a guessed constant: robotic/destroyed/obliterated/
// plain split a 0..1 roll into 0.25/0.25/0.35/0.15-wide bands respectively
// (today) — whichever is narrowest is statistically the rarest to land on.
const RUIN_TYPE_WIDTH = {
  robotic: GEN.ruinRobotic,
  destroyed: GEN.ruinDestroyed - GEN.ruinRobotic,
  obliterated: GEN.ruinObliterated - GEN.ruinDestroyed,
  plain: 1 - GEN.ruinObliterated,
};
const RAREST_RUIN_TYPE = RUIN_TYPES.reduce(
  (rarest, t) => (RUIN_TYPE_WIDTH[t] < RUIN_TYPE_WIDTH[rarest] ? t : rarest),
  RUIN_TYPES[0],
);

/**
 * Is this discovered archetype a "curiosity" — the rare/showcase-worthy
 * subset the codex highlights separately from its plain progress counters?
 * `meta` is whatever codex.js's record() was called with, plus its own
 * `archetypeKey` folded in (so this can split biome/civLevel/ruinType back
 * out of the key even if the caller didn't pass them individually).
 *
 * Each rule below is derived from something already true about the generator
 * (a roll width, a reachability gap) rather than a guessed constant:
 * - phenomenon: EVERY entry in this catalog is a hand-placed easter egg —
 *   there's no "common" phenomenon to contrast against, so all 6 qualify.
 * - ruin: the ruinType with the narrowest roll window (see RAREST_RUIN_TYPE
 *   above) is the rarest flavour to land on.
 * - race: 'city' is the one biome GENERATION.md's reachability table marks
 *   spacefaring-only — the sole structurally rare biome among living races.
 * - planet: a terraformed colony (`colonyKind: 'terraformed'`) is flagged via
 *   meta directly, since colony status isn't part of a planet's archetypeKey
 *   (only its planet *kind* is).
 * - ship / station: no rarity signal exists across either matrix (54 ship
 *   archetypes / 3 station types are all equally reachable) — never curious.
 *
 * @param {string} category
 * @param {object} [meta]
 * @returns {boolean}
 */
export function isCuriosity(category, meta = {}) {
  switch (category) {
    case 'phenomenon':
      return true;
    case 'ruin': {
      const ruinType = meta.ruinType ?? (meta.archetypeKey ? meta.archetypeKey.split(':')[1] : undefined);
      return ruinType === RAREST_RUIN_TYPE;
    }
    case 'race': {
      const biome = meta.biome ?? (meta.archetypeKey ? meta.archetypeKey.split(':')[0] : undefined);
      return biome === 'city';
    }
    case 'planet':
      return meta.colonyKind === 'terraformed';
    default:
      return false;
  }
}

/** RU category headings — used by the codex tab strip and the detail dialog's
 *  subtitle. 'system' is included here (unlike CATEGORIES) because the codex
 *  UI still shows it as a tab even though it has no finite catalog. */
export const CATEGORY_LABELS = {
  system: 'Система',
  planet: 'Планета',
  race: 'Раса',
  ruin: 'Руины',
  ship: 'Корабль',
  station: 'Станция',
  phenomenon: 'Явление',
};

// One-line RU flavour per fixed archetype, for the codex detail dialog. Kept
// here beside the catalogs (not in hud.js) so the codex owns its own copy —
// the HUD cards inside a system stay independent.
const PLANET_DESC = {
  lava: 'Раскалённый мир вулканов и лавовых морей — слишком близко к звезде для жизни.',
  rocky: 'Каменистый безводный мир с изрытой кратерами корой.',
  desert: 'Сухая планета песков и растрескавшихся равнин под жёстким солнцем.',
  terran: 'Мир земного типа: вода, атмосфера, умеренный пояс — колыбель жизни.',
  ocean: 'Планета сплошного океана с редкими архипелагами.',
  ice: 'Промёрзший мир на дальней орбите — ледяные щиты и азотный иней.',
  gas: 'Огромный газовый гигант с полосами облаков и системой колец.',
};
const STATION_DESC = {
  ring: 'Кольцевой хаб над родным миром цивилизации — её орбитальная столица.',
  outpost: 'Колониальный аванпост: скромная орбитальная станция над колонией.',
  collector: 'Газосборщик — скиммер, черпающий топливо из атмосферы газового гиганта.',
};
const RUIN_TYPE_DESC = {
  plain: 'Молчаливые руины давно вымершей цивилизации — ни тел, ни ответа почему.',
  robotic: 'Мир, где остались одни машины: заводы всё ещё работают на мёртвых хозяев.',
  destroyed: 'Разрушенный войной мир — расплавленные города, орбита в обломках.',
  obliterated: 'Уничтоженный мир: от целой цивилизации почти ничего не уцелело.',
};
const PHENOMENON_INFO = {
  'blackhole-galactic': {
    desc: 'Сверхмассивная чёрная дыра в самом сердце галактики. Аккреционный диск раскалён добела, а вокруг искривлён сам свет.',
    facts: [['Тип', 'сверхмассивная ЧД'], ['Прообраз', 'Стрелец A*'], ['Где', 'ядро галактики']],
  },
  'blackhole-gargantua': {
    desc: 'Гигантская вращающаяся чёрная дыра с ярким тонким диском — та самая Гаргантюа из «Интерстеллара».',
    facts: [['Тип', 'вращающаяся ЧД'], ['Прообраз', 'Гаргантюа'], ['Рядом', 'станция «Эндюранс»']],
  },
  endurance: {
    desc: 'Кольцевая исследовательская станция, медленно вращающаяся ради искусственной гравитации, — «Эндюранс» у Гаргантюа.',
    facts: [['Тип', 'кольцевая станция'], ['Гравитация', 'вращением'], ['Экспедиция', 'к чёрной дыре']],
  },
  ishimura: {
    desc: 'Корабль-трещинник, разламывающий планеты ради руды. Команда погибла — на борту некроморфы. (Dead Space)',
    facts: [['Класс', 'planetcracker'], ['Длина', '~1,6 км'], ['Команда', 'погибла']],
  },
  deathstar: {
    desc: 'Бронированная боевая станция размером с малую луну; её суперлазер раскалывает планету одним залпом.',
    facts: [['Тип', 'боевая станция'], ['Размер', '~160 км'], ['Орудие', 'суперлазер']],
  },
  dragon: {
    desc: 'Частный многоразовый корабль с экипажем на пути к Марсу — капсула-«капля» на разгонном модуле.',
    facts: [['Тип', 'пилотируемая капсула'], ['Экипаж', 'до 4'], ['Курс', 'Земля → Марс']],
  },
};

/**
 * Rich display info for one discovered entry, for the codex detail dialog:
 * a title, an RU category subtitle, a one-line description, and a small list
 * of `[label, value]` facts. Everything is derived from the same real
 * constants the catalogs are built from (ship ROLES/FACTIONS, biome/civ
 * tables) plus the flavour tables above — no per-instance data is needed, so
 * this works for any entry whether or not its find still exists in the world.
 *
 * @param {object} entry a codex.js Entry ({category, archetypeKey, label, ...})
 * @returns {{category: string, title: string, subtitle: string, desc: string, facts: Array<[string, string]>}}
 */
export function describeEntry(entry) {
  const category = entry.category;
  const subtitle = CATEGORY_LABELS[category] || category;
  const title = entry.label || entry.archetypeKey;
  const facts = [];
  let desc = '';
  const key = entry.archetypeKey || '';

  switch (category) {
    case 'ship': {
      const [factionId, roleId] = key.split(':');
      const role = ROLE_BY_ID[roleId];
      const faction = FACTION_BY_ID[factionId];
      if (role) {
        desc = role.desc;
        facts.push(['Назначение', role.purpose], ['Длина', `${role.lengthM} м`], ['Экипаж', String(role.crew)], ['Вооружение', role.arm]);
      }
      if (faction) {
        facts.push(['Флот', faction.name]);
        if (faction.lore) desc += (desc ? ' ' : '') + faction.lore;
      }
      break;
    }
    case 'station':
      desc = STATION_DESC[key] || '';
      break;
    case 'planet':
      desc = PLANET_DESC[key] || '';
      break;
    case 'race': {
      const [biome, civLevel] = key.split(':');
      desc = `Разумная жизнь: ${CIV_LEVELS[civLevel]?.label?.toLowerCase() || civLevel} на планете биома «${BIOME_KEYS[biome]?.label || biome}».`;
      facts.push(['Биом', BIOME_KEYS[biome]?.label || biome], ['Развитие', CIV_LEVELS[civLevel]?.label || civLevel]);
      break;
    }
    case 'ruin': {
      const [biome, ruinType] = key.split(':');
      desc = RUIN_TYPE_DESC[ruinType] || '';
      facts.push(['Биом', BIOME_KEYS[biome]?.label || biome], ['Тип гибели', RUIN_TYPE_LABELS[ruinType] || ruinType]);
      break;
    }
    case 'phenomenon': {
      const info = PHENOMENON_INFO[key];
      if (info) {
        desc = info.desc;
        facts.push(...info.facts);
      }
      break;
    }
    case 'system':
      desc = 'Звёздная система, нанесённая на карту в этой галактике.';
      break;
    default:
      break;
  }
  return { category, title, subtitle, desc, facts };
}
