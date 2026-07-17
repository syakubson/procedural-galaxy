// Finite archetype catalogs for the codex — the source of truth for its
// honest "N of M" counters and the encyclopedia content behind each find.
// Ship/planet/biome/civ/station data is imported straight from its real
// source so the catalogs can never drift from what the generator produces;
// the hand-crafted special content (easter-egg systems, objects, planets,
// named races) is enumerated here because there's no generator table for it.

import { PLANET_KINDS, RUIN_TYPES } from '../systems/systemData.js';
import { FACTIONS, FACTION_BY_ID } from '../systems/ships/factions.js';
import { ROLES } from '../systems/ships/roles.js';
import { STATION_TYPES } from '../systems/stations.js';
import { FLAGSHIP_LORE, STATION_LORE, FACTION_LORE } from './fleetLore.js';
import { getShipStats } from '../systems/ships/shipStats.js';

const ROLE_BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r]));

// --- ships: 9 roles × 6 factions = 54, grouped by faction ------------------
// archetypeKey `${factionId}:${roleId}` mirrors buildShip(role, faction)'s own
// argument order (ships.js). `group` (the faction name) drives the section
// headers on the Ships tab.
const SHIP_CATALOG = [];
for (const faction of FACTIONS) {
  for (const role of ROLES) {
    SHIP_CATALOG.push({
      archetypeKey: `${faction.id}:${role.id}`,
      // a faction MAY name its ships itself (Swarm's grown beasts); else the shared role name
      label: (faction.names && faction.names[role.id]) || role.name,
      group: faction.name,
      factionId: faction.id,
      roleId: role.id,
    });
  }
}

// --- stations: 3 types × 6 factions = 18, grouped by faction ---------------
// Each faction styles the same three station shapes differently (createStation
// takes a faction style), so a station archetype is faction × type, keyed
// `${factionId}:${type}` — the same shape as a ship archetype.
const STATION_CATALOG = [];
for (const faction of FACTIONS) {
  for (const st of STATION_TYPES) {
    STATION_CATALOG.push({
      archetypeKey: `${faction.id}:${st.id}`,
      label: st.name,
      group: faction.name,
      factionId: faction.id,
      stationType: st.id,
    });
  }
}

// --- planets: the 7 kinds, as an encyclopedia of TYPES (not instances) ------
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

// --- ruins: the 4 flavours, as a reference of TYPES -------------------------
// Was a biome×type grid (24), but a single galaxy only holds ~15 ruined worlds,
// so it could never complete; the honest, stable unit is the flavour itself.
const RUIN_TYPE_LABELS = {
  plain: 'Безжизненные руины',
  robotic: 'Мир машин',
  destroyed: 'Разрушенный мир',
  obliterated: 'Уничтоженный мир',
};
const RUIN_CATALOG = RUIN_TYPES.map((t) => ({
  archetypeKey: t,
  label: RUIN_TYPE_LABELS[t] || t,
  ruinType: t,
}));

// --- races: NAMED species (not the generic biome×civ inhabitants) -----------
// Real ones live on a hand-crafted planet and are discovered by visiting it —
// each carries a planetRef so «Перейти к объекту» warps to its homeworld.
// `future: true` races are announced but not yet in the game: they show as
// named-but-locked "coming" cards (grouped under Скоро), never discoverable.
const RACE_CATALOG = [
  { archetypeKey: 'humanity', label: 'Человечество', group: 'Виды', planetRef: { seed: 'sol-system', label: 'Земля' } },
  { archetypeKey: 'fremen', label: 'Фримены', group: 'Виды', planetRef: { seed: 'film-spice', label: 'Арракис' } },
  { archetypeKey: 'navi', label: 'На’ви', group: 'Виды', planetRef: { seed: 'film-jungle', label: 'Пандора' } },
  {
    archetypeKey: 'signbuilders',
    label: 'Строители Знаков',
    group: 'Виды',
    planetRef: { seed: 'deadspace', label: 'Тау-Волантис' },
  },
  // the faction homeworld races (#stage6) — unlocked by visiting their capital
  { archetypeKey: 'aelari', label: 'Аэлары', group: 'Виды', planetRef: { seed: 'capital-alliance', label: 'Аэла' } },
  { archetypeKey: 'hesht', label: 'Хешты', group: 'Виды', planetRef: { seed: 'capital-imperial', label: 'Наковальня' } },
  { archetypeKey: 'porosl', label: 'Приплод', group: 'Виды', planetRef: { seed: 'capital-swarm', label: 'Прародина' } },
  { archetypeKey: 'precursors', label: 'Предтечи', group: 'Виды', planetRef: { seed: 'capital-precursor', label: 'Скрижаль' } },
  { archetypeKey: 'necromorphs', label: 'Некроморфы', group: 'Скоро', future: true },
  { archetypeKey: 'generative-1', label: 'Неизвестный вид', group: 'Скоро', future: true },
  { archetypeKey: 'generative-2', label: 'Неизвестный вид', group: 'Скоро', future: true },
];
const RACE_BY_KEY = Object.fromEntries(RACE_CATALOG.map((r) => [r.archetypeKey, r]));

// --- special: hand-crafted content, grouped системы / объекты / планеты -----
// `seed` — the system to warp to. `view` — a special-object builder key (see
// codexViewer) for «Рассмотреть», where one exists. `planetLabel` — a signature
// planet inside `seed`. `race` — the named race that lives on this planet.
const SPECIAL_CATALOG = [
  // --- системы ---
  { archetypeKey: 'sys-sagittarius', label: 'Стрелец A*', group: 'Системы', seed: 'galactic-core', view: 'blackhole-galactic' },
  { archetypeKey: 'sys-gargantua', label: 'Гаргантюа', group: 'Системы', seed: 'interstellar', view: 'blackhole-gargantua' },
  { archetypeKey: 'sys-sol', label: 'Солнечная система', group: 'Системы', seed: 'sol-system' },
  { archetypeKey: 'sys-quarantine', label: 'Чёрный Карантин', group: 'Системы', seed: 'deadspace' },
  { archetypeKey: 'sys-alderaan', label: 'Сектор Альдераан', group: 'Системы', seed: 'death-star' },
  { archetypeKey: 'sys-twinsun', label: 'Двусолнечье', group: 'Системы', seed: 'film-twinsun' },
  { archetypeKey: 'sys-spice', label: 'Пряный Предел', group: 'Системы', seed: 'film-spice' },
  { archetypeKey: 'sys-jungle', label: 'Спутник Бурь', group: 'Системы', seed: 'film-jungle' },
  { archetypeKey: 'sys-hoth', label: 'Хот', group: 'Системы', seed: 'film-ice' },
  // --- столицы фракций (#stage6) ---
  { archetypeKey: 'sys-cap-alliance', label: 'Первая Верфь', group: 'Системы', seed: 'capital-alliance' },
  { archetypeKey: 'sys-cap-imperial', label: 'Зольный Престол', group: 'Системы', seed: 'capital-imperial' },
  { archetypeKey: 'sys-cap-swarm', label: 'Первый Сад', group: 'Системы', seed: 'capital-swarm' },
  { archetypeKey: 'sys-cap-syndicate', label: 'Меридиан-Ноль', group: 'Системы', seed: 'capital-syndicate' },
  { archetypeKey: 'sys-cap-cartel', label: 'Вольная Гавань', group: 'Системы', seed: 'capital-cartel' },
  { archetypeKey: 'sys-cap-precursor', label: 'Чертог Молчания', group: 'Системы', seed: 'capital-precursor' },
  // --- объекты ---
  { archetypeKey: 'endurance', label: 'Станция «Эндюранс»', group: 'Объекты', view: 'endurance', seed: 'interstellar' },
  { archetypeKey: 'ishimura', label: 'USG Ishimura', group: 'Объекты', view: 'ishimura', seed: 'deadspace' },
  { archetypeKey: 'deathstar', label: 'Звезда Смерти «Длань»', group: 'Объекты', view: 'deathstar', seed: 'death-star' },
  { archetypeKey: 'dragon', label: 'Crew Dragon', group: 'Объекты', view: 'dragon', seed: 'sol-system' },
  // --- планеты ---
  { archetypeKey: 'pl-earth', label: 'Земля', group: 'Планеты', seed: 'sol-system', planetLabel: 'Земля', race: 'humanity' },
  { archetypeKey: 'pl-mars', label: 'Марс', group: 'Планеты', seed: 'sol-system', planetLabel: 'Марс' },
  { archetypeKey: 'pl-alderaan', label: 'Альдераан', group: 'Планеты', seed: 'death-star', planetLabel: 'Альдераан' },
  { archetypeKey: 'pl-aegis7', label: 'Эгида VII', group: 'Планеты', seed: 'deadspace', planetLabel: 'Эгида VII' },
  { archetypeKey: 'pl-tau', label: 'Тау-Волантис', group: 'Планеты', seed: 'deadspace', planetLabel: 'Тау-Волантис', race: 'signbuilders' },
  { archetypeKey: 'pl-tatooine', label: 'Татуин', group: 'Планеты', seed: 'film-twinsun', planetLabel: 'Татуин' },
  { archetypeKey: 'pl-arrakis', label: 'Арракис', group: 'Планеты', seed: 'film-spice', planetLabel: 'Арракис', race: 'fremen' },
  { archetypeKey: 'pl-pandora', label: 'Пандора', group: 'Планеты', seed: 'film-jungle', planetLabel: 'Пандора', race: 'navi' },
  { archetypeKey: 'pl-hoth', label: 'Хот', group: 'Планеты', seed: 'film-ice', planetLabel: 'Хот' },
  // --- миры столиц фракций (#stage6) ---
  { archetypeKey: 'pl-aela', label: 'Аэла', group: 'Планеты', seed: 'capital-alliance', planetLabel: 'Аэла', race: 'aelari' },
  { archetypeKey: 'pl-hesht', label: 'Хешт', group: 'Планеты', seed: 'capital-imperial', planetLabel: 'Хешт' },
  { archetypeKey: 'pl-anvil', label: 'Наковальня', group: 'Планеты', seed: 'capital-imperial', planetLabel: 'Наковальня', race: 'hesht' },
  { archetypeKey: 'pl-firstgarden', label: 'Прародина', group: 'Планеты', seed: 'capital-swarm', planetLabel: 'Прародина', race: 'porosl' },
  { archetypeKey: 'pl-prime', label: 'Прайм', group: 'Планеты', seed: 'capital-syndicate', planetLabel: 'Прайм' },
  { archetypeKey: 'pl-fatman', label: 'Толстяк', group: 'Планеты', seed: 'capital-cartel', planetLabel: 'Толстяк' },
  { archetypeKey: 'pl-tablet', label: 'Скрижаль', group: 'Планеты', seed: 'capital-precursor', planetLabel: 'Скрижаль', race: 'precursors' },
];
const SPECIAL_BY_KEY = Object.fromEntries(SPECIAL_CATALOG.map((s) => [s.archetypeKey, s]));
const SPECIAL_SYSTEM_BY_SEED = Object.fromEntries(
  SPECIAL_CATALOG.filter((s) => s.group === 'Системы').map((s) => [s.seed, s.archetypeKey]),
);
const SPECIAL_PLANET_BY_SEED_LABEL = {};
for (const s of SPECIAL_CATALOG) {
  if (s.group === 'Планеты') SPECIAL_PLANET_BY_SEED_LABEL[`${s.seed}::${s.planetLabel}`] = s;
}

const CATALOGS = {
  planet: PLANET_CATALOG,
  race: RACE_CATALOG,
  ruin: RUIN_CATALOG,
  ship: SHIP_CATALOG,
  station: STATION_CATALOG,
  special: SPECIAL_CATALOG,
};

/** The finite codex categories, in a stable order. 'system' is NOT one of
 *  these — it has no finite catalog (see codex.js's progress()). */
export const CATEGORIES = Object.keys(CATALOGS);

/** @returns {Array|null} the archetype list for `category`, or null if it has
 *  no finite catalog (e.g. 'system'). */
export function catalogFor(category) {
  return CATALOGS[category] || null;
}

// --- recording helpers (main.js) -------------------------------------------

/** The special-system codex key for a system seed, or null if it isn't one of
 *  the hand-crafted systems. Called when the player warps into a system. */
export function specialSystemKey(seed) {
  return SPECIAL_SYSTEM_BY_SEED[seed] || null;
}

// --- the «Фракции» shelf (#stage6) ------------------------------------------
// One section per fleet faction: its chronicle, its capital/race/flagship refs
// and its slice of the ship + station catalogs. Which codex keys belong to
// which faction is enumerated here (there's no generator table for it).
const FACTION_CODEX_REFS = {
  alliance: { capitalKey: 'sys-cap-alliance', raceKey: 'aelari' },
  imperial: { capitalKey: 'sys-cap-imperial', raceKey: 'hesht' },
  swarm: { capitalKey: 'sys-cap-swarm', raceKey: 'porosl' },
  syndicate: { capitalKey: 'sys-cap-syndicate', raceKey: null }, // многорасовый — по контракту
  cartel: { capitalKey: 'sys-cap-cartel', raceKey: null }, // сброд всех рас
  precursor: { capitalKey: 'sys-cap-precursor', raceKey: 'precursors' },
};

/** Everything the codex «Фракции» tab lays out, one item per faction, in the
 *  canonical FACTIONS order. Pure data lookups — no discovery state here. */
export function factionShelf() {
  return FACTIONS.map((f) => {
    const refs = FACTION_CODEX_REFS[f.id] || {};
    const cap = refs.capitalKey ? SPECIAL_BY_KEY[refs.capitalKey] : null;
    const race = refs.raceKey ? RACE_BY_KEY[refs.raceKey] : null;
    return {
      id: f.id,
      name: f.name,
      tagline: f.lore || '',
      capitalKey: refs.capitalKey || null,
      capitalName: cap ? cap.label : '',
      raceName: race ? race.label : 'смешанный состав',
      flagshipName: (FLAGSHIP_LORE[f.id] || {}).name || '',
      lore: FACTION_LORE[f.id] || null,
      ships: SHIP_CATALOG.filter((c) => c.factionId === f.id),
      stations: STATION_CATALOG.filter((c) => c.factionId === f.id),
    };
  });
}

/** The special-planet catalog entry for a (system seed, planet label), or null.
 *  Its `race` (if any) is the named race that planet unlocks. */
export function specialPlanetFor(seed, label) {
  return SPECIAL_PLANET_BY_SEED_LABEL[`${seed}::${label}`] || null;
}

/** The homeworld ref (seed + planet label) a race entry links to, or null for a
 *  future race with no planet yet. Used by «Перейти к объекту» for races. */
export function racePlanetRef(archetypeKey) {
  const r = RACE_BY_KEY[archetypeKey];
  return (r && r.planetRef) || null;
}

/** The special-object builder key for a special entry (system black hole or a
 *  one-off object), or null — drives «Рассмотреть» / the thumbnail. */
export function specialViewKey(archetypeKey) {
  const s = SPECIAL_BY_KEY[archetypeKey];
  return (s && s.view) || null;
}

/** The (seed, planetLabel) a special-planet entry rebuilds from, or null. */
export function specialPlanetRef(archetypeKey) {
  const s = SPECIAL_BY_KEY[archetypeKey];
  return s && s.group === 'Планеты' ? { seed: s.seed, label: s.planetLabel } : null;
}

/** The system seed a special entry lives in (for «Перейти к объекту»). */
export function specialSeed(archetypeKey) {
  const s = SPECIAL_BY_KEY[archetypeKey];
  return (s && s.seed) || null;
}

/** Does this entry have a standalone 3D form «Рассмотреть» can open? Systems
 *  and races have none; a special is viewable only if it's a black-hole/object
 *  builder or a signature planet with a recorded instance. */
export function isRebuildable(entry) {
  switch (entry.category) {
    case 'ship':
    case 'station':
    case 'planet':
    case 'ruin':
      return true;
    case 'special':
      return !!(specialViewKey(entry.archetypeKey) || (entry.sourceRef && entry.sourceRef.planetIndex != null));
    default:
      return false; // 'system', 'race'
  }
}

// Signature specials (phenomena / named objects) that have a hand-painted card.
// Other specials — planets, races, ordinary systems — have none and keep the
// live 3D render / group glyph.
const HERO_SPECIALS = new Set(['deathstar', 'ishimura', 'dragon', 'endurance', 'sys-sagittarius', 'sys-gargantua']);

/** Optional hand-painted hero illustration for a find. Ships (54: 9 roles × 6
 *  factions, incl. flagship) and stations (18) have a full painted set under
 *  media/hero/<faction>_<role|type>.webp — keyed straight off archetypeKey with
 *  ':' → '_'; the signature specials above live under media/hero/special/<key>.webp.
 *  Everything else has no card and keeps the live 3D render. Returns null then. */
export function heroPathFor(entry) {
  if (!entry) return null;
  const key = String(entry.archetypeKey || '');
  if (entry.category === 'ship' || entry.category === 'station') {
    return key.includes(':') ? `media/hero/${key.replace(':', '_')}.webp` : null;
  }
  if (entry.category === 'special' && HERO_SPECIALS.has(key)) {
    return `media/hero/special/${key}.webp`;
  }
  return null;
}

/** The Особое sub-group ('Системы'|'Объекты'|'Планеты') for a special key, so a
 *  recorded entry (which stores no group) can pick the right placeholder glyph. */
export function specialGroup(archetypeKey) {
  const s = SPECIAL_BY_KEY[archetypeKey];
  return (s && s.group) || null;
}

// --- detail-dialog descriptions --------------------------------------------

/** RU category headings — the tab strip and the detail dialog's subtitle. */
export const CATEGORY_LABELS = {
  system: 'Система',
  planet: 'Планета',
  race: 'Раса',
  ruin: 'Руины',
  ship: 'Корабль',
  station: 'Станция',
  special: 'Особое',
};

// Planet-type encyclopedia: what it is, typical climate, resources, and how a
// world of this type comes to be.
const PLANET_INFO = {
  lava: {
    desc: 'Раскалённый мир вулканов и лавовых морей — слишком близко к звезде для жизни. Образуется у самой звезды или разогревается приливами соседних гигантов.',
    climate: 'Расплавленная кора, сотни градусов',
    resources: 'Тяжёлые металлы, сера, редкие изотопы',
  },
  rocky: {
    desc: 'Каменистый безводный мир с изрытой кратерами корой. Малое тело, не удержавшее атмосферу и воду — выжженное близостью звезды или промороженное далью.',
    climate: 'Безводно, резкие перепады день/ночь',
    resources: 'Руды, силикаты, строительный камень',
  },
  desert: {
    desc: 'Сухая планета песков и растрескавшихся равнин под жёстким солнцем. Обычно это мир умеренного пояса, потерявший почти всю воду.',
    climate: 'Жарко и сухо, пыльные бури',
    resources: 'Кремний, соли, лёд у полюсов',
  },
  terran: {
    desc: 'Мир земного типа: вода, атмосфера, умеренный пояс — колыбель жизни. Возникает в обитаемом поясе звезды, где вода держится жидкой, а атмосфера — стабильной.',
    climate: 'Умеренный, жидкая вода и воздух',
    resources: 'Вода, органика, плодородные почвы',
  },
  ocean: {
    desc: 'Планета сплошного океана с редкими архипелагами. Тёплый мир обитаемого пояса, где воды набралось больше, чем суши.',
    climate: 'Влажный, глобальный океан',
    resources: 'Вода, биомасса, растворённые соли',
  },
  ice: {
    desc: 'Промёрзший мир на дальней орбите — ледяные щиты и азотный иней. Формируется за снеговой линией, где до звезды слишком далеко для тепла.',
    climate: 'Мороз, азотный и водяной лёд',
    resources: 'Лёд, летучие соединения, чистая вода',
  },
  gas: {
    desc: 'Огромный газовый гигант с полосами облаков и системой колец. Массивное ядро набрало толстую водородно-гелиевую оболочку в холодной внешней части системы.',
    climate: 'Нет твёрдой поверхности, вечные штормы',
    resources: 'Водород, гелий — топливо для скиммеров',
  },
};

// Ruin-flavour reference: what a ruined world of this flavour looks like and
// how it got that way.
const RUIN_INFO = {
  plain: {
    desc: 'Молчаливые руины давно вымершей цивилизации — ни тел, ни ответа почему. Жизнь угасла тихо: болезнь, климат или медленный упадок.',
    fate: 'Вымерли без катастрофы',
  },
  robotic: {
    desc: 'Мир, где остались одни машины: заводы и депо всё ещё работают на давно мёртвых хозяев, гоняя грузы по пустым орбитам.',
    fate: 'Люди исчезли, автоматика жива',
  },
  destroyed: {
    desc: 'Разрушенный войной или катастрофой мир — расплавленные города, шрам на коре, орбита в обломках. Кто-то уцелел и бежал на соседний мир.',
    fate: 'Катастрофа, часть спаслась',
  },
  obliterated: {
    desc: 'Уничтоженный мир: от целой цивилизации не осталось почти ничего, планета расколота на облако щебня чужим оружием.',
    fate: 'Планету раскололи извне',
  },
};

// Named-race flavour (real ones; future ones show a "coming" note instead).
const RACE_INFO = {
  humanity: 'Любопытный вид, едва вышедший за пределы родной планеты, но уже мечтающий о звёздах.',
  fremen: 'Суровый народ пустынь, живущий по воде и оседлавший песчаных исполинов родного мира.',
  navi: 'Рослый народ, вросший в живую сеть своей луны-джунглей и защищающий её всем племенем.',
  signbuilders: 'Давно исчезнувшая раса зодчих, оставившая на промёрзшем мире загадочные Знаки.',
  aelari: 'Негромкий народ верфей — лучшие сварщики и навигаторы Альянса, одна из рас-основательниц Договора.',
  hesht: 'Народ расколотого мира, превративший траур в дисциплину, а клятву — в государство.',
  porosl: 'Монораса-коллектив Роя; выводок исполинских выращенных тварей, кочующих между звёзд. Имя дали чужие картографы.',
  precursors: 'Высокие тихие силуэты старшей расы; их видят редко, издалека и всегда за работой.',
};

// Special-content flavour + facts, by archetypeKey.
const SPECIAL_INFO = {
  'sys-sagittarius': { desc: 'Сверхмассивная чёрная дыра в самом сердце галактики; вокруг искривлён сам свет.', facts: [['Тип', 'сверхмассивная ЧД'], ['Масса', '≈ 4 млн солнц']] },
  'sys-gargantua': { desc: 'Гигантская вращающаяся чёрная дыра с ярким тонким диском — та самая Гаргантюа из «Интерстеллара».', facts: [['Тип', 'вращающаяся ЧД'], ['Рядом', '«Эндюранс»']] },
  'sys-sol': { desc: 'Наша родная система: восемь планет вокруг жёлтого карлика, колыбель Человечества.', facts: [['Звезда', 'жёлтый карлик'], ['Планет', '8']] },
  'sys-quarantine': { desc: 'Мёртвая система под карантином: над Эгидой VII завис корабль-трещинник, команда мертва.', facts: [['Статус', 'карантин'], ['Угроза', 'некроморфы']] },
  'sys-alderaan': { desc: 'Сектор, где боевая станция расколола целый мир одним залпом — на память осталось облако щебня.', facts: [['Событие', 'уничтожение Альдераана']] },
  'sys-twinsun': { desc: 'Мир двух солнц: под сдвоенным светом лежит пустынный Татуин.', facts: [['Звёзд', '2']] },
  'sys-spice': { desc: 'Пустынный предел, где добывают драгоценную пряность, а под песком ходят исполины.', facts: [['Ресурс', 'пряность']] },
  'sys-jungle': { desc: 'Спутник газового гиганта, заросший живыми джунглями, — дом народа На’ви.', facts: [['Тип', 'луна-джунгли']] },
  'sys-hoth': { desc: 'Промёрзшая планета вечных снегов и ледяных бурь.', facts: [['Климат', 'вечная мерзлота']] },
  endurance: { desc: 'Кольцевая исследовательская станция, вращающаяся ради искусственной гравитации, — «Эндюранс» у Гаргантюа.', facts: [['Тип', 'кольцевая станция']] },
  ishimura: { desc: 'Корабль-трещинник, разламывающий планеты ради руды. Команда погибла — на борту некроморфы. (Dead Space)', facts: [['Класс', 'planetcracker'], ['Длина', '~1,6 км']] },
  deathstar: { desc: 'Бронированная боевая станция размером с малую луну; суперлазер раскалывает планету одним залпом.', facts: [['Тип', 'боевая станция'], ['Размер', '~160 км']] },
  dragon: { desc: 'Частный многоразовый корабль с экипажем на пути к Марсу — капсула-«капля» на разгонном модуле.', facts: [['Экипаж', 'до 4'], ['Курс', 'Земля → Марс']] },
  'pl-earth': { desc: 'Голубой мир воды и воздуха — единственный известный дом жизни и разума.', facts: [['Биом', 'земной'], ['Раса', 'Человечество']] },
  'pl-mars': { desc: 'Ржавая пустынная планета, ближайшая цель первой межпланетной экспедиции Человечества.', facts: [['Биом', 'пустыня'], ['Спутников', '2']] },
  'pl-alderaan': { desc: 'Мирная планета, уничтоженная боевой станцией одним залпом, — теперь поле обломков.', facts: [['Статус', 'уничтожена']] },
  'pl-aegis7': { desc: 'Мёртвый шахтёрский мир: из его недр подняли Красный Обелиск, после чего колония сошла с ума.', facts: [['Статус', 'мёртв'], ['Над ним', 'Ishimura']] },
  'pl-tau': { desc: 'Промёрзший мир, хранящий Знаки исчезнувшей расы зодчих.', facts: [['Биом', 'лёд'], ['Раса', 'Строители Знаков']] },
  'pl-tatooine': { desc: 'Пустынная планета под двумя солнцами — родина не одного героя.', facts: [['Биом', 'пустыня'], ['Звёзд', '2']] },
  'pl-arrakis': { desc: 'Пустынный мир пряности и песчаных исполинов, дом Фрименов.', facts: [['Биом', 'пустыня'], ['Раса', 'Фримены']] },
  'pl-pandora': { desc: 'Живая луна-джунгли газового гиганта, дом народа На’ви.', facts: [['Биом', 'джунгли'], ['Раса', 'На’ви']] },
  'pl-hoth': { desc: 'Планета вечных снегов и ледяных бурь.', facts: [['Биом', 'лёд']] },
  // --- столицы фракций (#stage6) ---
  'sys-cap-alliance': { desc: 'Первая общая верфь галактики над родным миром аэларов: здесь сваркой подписали Договор.', facts: [['Фракция', 'Альянс'], ['Флагман', '«Тихая Гавань»']] },
  'sys-cap-imperial': { desc: 'Поле обломков расколотого Хешта и тронная Наковальня — рана, вокруг которой построена Империя.', facts: [['Фракция', 'Империя Пепла'], ['Флагман', '«Тризна»']] },
  'sys-cap-swarm': { desc: 'Прародина-сад, океан-питомник и пастбища полипов; все имена здесь дали чужие картографы.', facts: [['Фракция', 'Рой'], ['Флагман', '«Исполин»']] },
  'sys-cap-syndicate': { desc: 'Нулевой меридиан всех маршрутов галактики: эталонные часы Прайма заверяют сделки половины флотов.', facts: [['Фракция', 'Синдикат'], ['Флагман', '«Контрольный пакет»']] },
  'sys-cap-cartel': { desc: 'Старейший вольный порт галактики: толчея бортов у Толстяка и доки, где плиты не гаснут.', facts: [['Фракция', 'Картель'], ['Флагман', '«Мамаша»']] },
  'sys-cap-precursor': { desc: 'Система, которую все карты помечают одинаково: не мешать. Города выметены, сад поливают — хозяев не видно.', facts: [['Фракция', 'Предтечи'], ['Флагман', '«Тот, Кто Остался»']] },
  'pl-aela': { desc: 'Родной мир аэларов: города вдоль побережий, кольцевой хаб-верфь над экватором и старые песни в ритме работы.', facts: [['Биом', 'земной'], ['Раса', 'Аэлары']] },
  'pl-hesht': { desc: 'Расколотый родной мир хештов — святыня и рана; сюда приходят молчать, заглушив двигатель.', facts: [['Статус', 'уничтожен'], ['Память', 'осколки в килях кораблей']] },
  'pl-anvil': { desc: 'Тронный мир Империи: чёрные города-арсеналы и небо, в котором всегда виден расколотый Хешт.', facts: [['Биом', 'скальный'], ['Раса', 'Хешты']] },
  'pl-firstgarden': { desc: 'Мир-сад без единого огня городов: города здесь не строят, здесь растут.', facts: [['Биом', 'джунгли'], ['Раса', 'Приплод']] },
  'pl-prime': { desc: 'Мир-штаб под стеклом: от его нулевого меридиана отсчитываются маршруты и время половины галактики.', facts: [['Биом', 'город'], ['Владелец', 'Синдикат «Меридиан»']] },
  'pl-fatman': { desc: 'Полосатый гигант, кормящий половину Картеля: газосборщики, доки и очередь, которую уважают больше законов.', facts: [['Тип', 'газовый гигант'], ['Роль', 'главный порт']] },
  'pl-tablet': { desc: 'Древний мир, чьи города с орбиты читаются как строки текста; единственный сад поливают до сих пор.', facts: [['Биом', 'пустыня'], ['Раса', 'Предтечи']] },
};

/**
 * Rich display info for a discovered (or catalog) entry, for the detail dialog:
 * a title, an RU category subtitle, a description, and a list of `[label, value]`
 * facts. Everything comes from the same constants the catalogs use plus the
 * flavour tables above, so it works for any entry.
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
  let stats = null; // ships only: the 1–10 characteristics block (#stage6)
  const key = entry.archetypeKey || '';

  switch (category) {
    case 'ship': {
      const [factionId, roleId] = key.split(':');
      const role = ROLE_BY_ID[roleId];
      const faction = FACTION_BY_ID[factionId];
      if (role) {
        desc = role.desc;
        // transports keep their payload in `arm` (cargo, fuel, colonists) — an
        // honest «Нагрузка» beats calling 4 000 colonists an armament.
        const armLabel = role.cat === 'transport' ? 'Нагрузка' : 'Вооружение';
        facts.push(['Назначение', role.purpose], ['Длина', `${role.lengthM} м`], ['Экипаж', String(role.crew)], [armLabel, role.arm]);
      }
      if (faction) {
        facts.push(['Флот', faction.name]);
        if (faction.lore) desc += (desc ? ' ' : '') + faction.lore;
      }
      // the flagship of each fleet is a NAMED legend (#stage6) — its story
      // replaces the generic role blurb (the visual style line stays).
      const fl = roleId === 'flagship' && FLAGSHIP_LORE[factionId];
      if (fl) {
        desc = `${fl.desc} ${fl.history}`;
        facts.unshift(['Имя', fl.name]);
      }
      // the 1–10 characteristics block + the fleet-wide quirk (#stage6)
      stats = getShipStats(roleId, factionId);
      if (stats && stats.quirk) facts.push(['Особенность', stats.quirk]);
      break;
    }
    case 'station': {
      const [factionId, type] = key.split(':');
      const faction = FACTION_BY_ID[factionId];
      // per-faction station lore (#stage6) — what a hub/outpost/collector IS
      // to that culture; falls back to the neutral type blurb.
      const STATION_DESC = {
        ring: 'Кольцевой хаб над родным миром цивилизации — её орбитальная столица.',
        outpost: 'Колониальный аванпост: скромная орбитальная станция над колонией.',
        collector: 'Газосборщик — скиммер, черпающий топливо из атмосферы газового гиганта.',
      };
      desc = (STATION_LORE[factionId] && STATION_LORE[factionId][type]) || STATION_DESC[type] || '';
      if (faction) facts.push(['Фракция', faction.name]);
      break;
    }
    case 'planet': {
      const info = PLANET_INFO[key];
      if (info) {
        desc = info.desc;
        facts.push(['Климат', info.climate], ['Ресурсы', info.resources]);
      }
      break;
    }
    case 'ruin': {
      const info = RUIN_INFO[key];
      if (info) {
        desc = info.desc;
        facts.push(['Судьба', info.fate]);
      }
      break;
    }
    case 'race': {
      const r = RACE_BY_KEY[key];
      if (r && r.future) {
        desc = 'Этот вид ещё не появился в игре — карточка-заглушка. Позже он получит свою историю и родную планету.';
        facts.push(['Статус', 'в разработке']);
      } else {
        desc = RACE_INFO[key] || '';
        if (r && r.planetRef) facts.push(['Родной мир', r.planetRef.label]);
      }
      break;
    }
    case 'special': {
      const info = SPECIAL_INFO[key];
      if (info) {
        desc = info.desc;
        facts.push(...(info.facts || []));
      }
      break;
    }
    case 'system':
      desc = 'Звёздная система, нанесённая на карту в этой галактике.';
      break;
    default:
      break;
  }
  return { category, title, subtitle, desc, facts, stats };
}
