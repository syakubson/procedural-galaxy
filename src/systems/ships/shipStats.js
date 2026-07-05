// Ship characteristics for the codex (#stage6): a 1–10 profile per (role,
// faction) pair, built as role baseline + the faction's engineering bias.
// Pure data + one pure function — display-only for now; if gameplay ever
// consumes these numbers, THIS stays the single source of truth.

// Role baselines on a 1–10 scale. Anchored to the existing ROLES table
// (speed/lengthM/crew/arm in roles.js) so the numbers never contradict the
// dossier facts: interceptors are the fastest hulls, flagships the toughest.
const ROLE_BASE = {
  scout: { speed: 9, agility: 8, armor: 2, firepower: 1, range: 9, autonomy: 6 },
  fighter: { speed: 8, agility: 7, armor: 4, firepower: 5, range: 4, autonomy: 3 },
  interceptor: { speed: 10, agility: 9, armor: 3, firepower: 4, range: 5, autonomy: 3 },
  gunship: { speed: 5, agility: 4, armor: 6, firepower: 8, range: 5, autonomy: 4 },
  corvette: { speed: 6, agility: 5, armor: 6, firepower: 6, range: 6, autonomy: 6 },
  freighter: { speed: 3, agility: 2, armor: 5, firepower: 1, range: 7, autonomy: 7 },
  tanker: { speed: 3, agility: 2, armor: 4, firepower: 1, range: 8, autonomy: 8 },
  liner: { speed: 4, agility: 3, armor: 5, firepower: 1, range: 8, autonomy: 9 },
  flagship: { speed: 2, agility: 1, armor: 10, firepower: 10, range: 7, autonomy: 10 },
};

// Faction engineering bias (added to the baseline, clamped to 1–10) + the
// fleet-wide quirk line the codex shows as «Особенность». Precursor hulls
// return NO numbers at all — instruments give no readings (unknown: true).
const FACTION_PROFILE = {
  alliance: {
    mods: { armor: 1, autonomy: 1, agility: -1 },
    quirk: 'Каждый борт несёт лишнюю койку и запас кислорода на чужую расу — эвакуация считается боевой задачей.',
  },
  imperial: {
    mods: { armor: 2, firepower: 1, speed: -1, agility: -1 },
    quirk: 'В киле вварен осколок Хешта; переборки двойные — корабль дерётся, пока держит хоть одна.',
  },
  swarm: {
    mods: { agility: 2, autonomy: 1, firepower: -1 },
    quirk: 'Живой корпус заращивает пробоины; двух одинаковых кораблей у Роя не бывает.',
  },
  syndicate: {
    mods: { speed: 2, range: 1, armor: -2 },
    quirk: 'Гарантийное обслуживание в любом порту сети; маршрутные лицензии дают приоритетные коридоры.',
  },
  cartel: {
    mods: { autonomy: 2, agility: 1, speed: -1, armor: -1 },
    quirk: 'Сшит из чужих плит и чинится чем попало где попало — и всё-таки долетает.',
  },
  precursor: {
    unknown: true,
    quirk: 'Приборы не находят ни двигателя, ни орудий — только результат их работы.',
  },
};

export const STAT_LABELS = [
  ['speed', 'Скорость'],
  ['agility', 'Манёвренность'],
  ['armor', 'Броня'],
  ['firepower', 'Огневая мощь'],
  ['range', 'Дальность'],
  ['autonomy', 'Автономность'],
];

const clamp = (v) => Math.max(1, Math.min(10, v));

/**
 * The codex stat block for a (role, faction) ship.
 *
 * @param {string} roleId a ROLES id ('scout' … 'flagship')
 * @param {string} factionId a FACTIONS id ('alliance' … 'precursor')
 * @returns {{rows: Array<[string, number|null]>, quirk: string, unknown: boolean}|null}
 *   rows are [RU label, 1–10] pairs (values null when unknown); null for an
 *   unknown role.
 */
export function getShipStats(roleId, factionId) {
  const base = ROLE_BASE[roleId];
  if (!base) return null;
  const prof = FACTION_PROFILE[factionId] || { mods: {}, quirk: '' };
  const rows = STAT_LABELS.map(([key, label]) => [
    label,
    prof.unknown ? null : clamp(base[key] + (prof.mods[key] || 0)),
  ]);
  return { rows, quirk: prof.quirk || '', unknown: !!prof.unknown };
}
