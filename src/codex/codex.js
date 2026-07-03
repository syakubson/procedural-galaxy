// The codex: a PERMANENT, cross-party record of every archetype the player
// has ever discovered (a ship role/faction combo, a planet kind, a living or
// extinct race, a hand-placed phenomenon...). Persisted via storage.js's
// NAMESPACES.CODEX only — never window.localStorage directly (storage.js is
// the sole owner of that). Deliberately NOT keyed by party id or GEN_VERSION:
// starting a new galaxy (or a generator rules bump) must never wipe what's
// already been found. Each entry instead carries its discovery context
// (`batchId`, `genVersion`) as plain fields, so the permanent record still
// remembers WHEN/under-which-rules each thing was first seen.

import { GEN_VERSION } from '../systems/genParams.js';
import { NAMESPACES, read, write } from '../state/storage.js';
import { catalogFor, isCuriosity } from './codexData.js';

const SCOPE_KEY = 'entries';

// The one persisted object is { [id]: Entry }, id = "category::archetypeKey"
// — O(1) has()/record() instead of scanning an array on every discovery.
// Read lazily (never at import time — storage.js may not be reachable yet in
// every context, e.g. a headless script) and cached for the module's life;
// every record() call keeps this cache and the persisted copy in lockstep.
let _entries = null;

function load() {
  if (_entries === null) _entries = read(NAMESPACES.CODEX, SCOPE_KEY, {}) || {};
  return _entries;
}

function persist() {
  write(NAMESPACES.CODEX, SCOPE_KEY, _entries);
}

function idFor(category, archetypeKey) {
  return `${category}::${archetypeKey}`;
}

/**
 * Record a discovered archetype. Call this on a MEANINGFUL discovery (a real
 * player action) — the one sanctioned bulk exception is main.js's reveal-all,
 * which records the whole galaxy at once via `opts.defer` + flush() below.
 *
 * Idempotent: re-recording an archetype the codex already knows returns the
 * EXISTING entry (`isNew: false`) — `firstSeenAt` never moves. The ONE field a
 * re-record may change is `curiosity`, upward only: a planet KIND is usually
 * discovered on an ordinary world first, and a later rare find of the same
 * kind (say, a terraformed colony) would otherwise never reach the showcase
 * because its archetype is already logged.
 *
 * @param {string} category one of codexData.js's CATEGORIES ('ship',
 *   'station', 'planet', 'race', 'ruin', 'phenomenon'), or 'system' (which
 *   has no finite catalog — see progress()).
 * @param {string} archetypeKey stable key within `category`'s catalog (or,
 *   for 'system', any per-system identity the caller chooses).
 * @param {object} [meta] discovery context:
 *   - `batchId` — the party/seed this was first found under.
 *   - `sourceRef` — enough to rebuild the exact find later (codexViewer.js):
 *     `{role, faction}` | `{seed, planetIndex}` | `{phenomenonId}` | `{seed}`.
 *   - `genVersion` — defaults to the current GEN_VERSION if omitted.
 *   - `label` — fallback display label, used only when `archetypeKey` isn't
 *     found in `category`'s catalog (always true for 'system').
 *   - anything else `isCuriosity()` needs for this category (e.g.
 *     `colonyKind`, `ruinType`, `biome` — see codexData.js).
 * @param {object} [opts]
 * @param {boolean} [opts.defer] skip the localStorage write and mutate only the
 *   in-memory map — for a bulk caller (reveal-all) that persists ONCE with
 *   flush() afterward, instead of one full-map serialize per entry.
 * @returns {{entry: object, isNew: boolean}}
 */
export function record(category, archetypeKey, meta = {}, opts = {}) {
  const entries = load();
  const id = idFor(category, archetypeKey);
  const existing = entries[id];
  if (existing) {
    if (!existing.curiosity && isCuriosity(category, { ...meta, archetypeKey })) {
      existing.curiosity = true; // upgrade only — see the JSDoc above
      if (!opts.defer) persist();
    }
    return { entry: existing, isNew: false };
  }

  const catalog = catalogFor(category);
  const catalogEntry = catalog && catalog.find((c) => c.archetypeKey === archetypeKey);
  const label = (catalogEntry && catalogEntry.label) || meta.label || archetypeKey;

  const entry = {
    id,
    category,
    archetypeKey,
    label,
    firstSeenAt: Date.now(),
    batchId: meta.batchId ?? null,
    sourceRef: meta.sourceRef ?? null,
    curiosity: isCuriosity(category, { ...meta, archetypeKey }),
    genVersion: meta.genVersion ?? GEN_VERSION,
  };
  entries[id] = entry;
  if (!opts.defer) persist();
  return { entry, isNew: true };
}

/** Persist the in-memory codex to storage once. Pairs with record(..., {defer:true})
 *  so a bulk recorder serializes the map a single time instead of per entry. */
export function flush() {
  persist();
}

/** All discovered entries in `category`, oldest discovery first. */
export function list(category) {
  return Object.values(load())
    .filter((e) => e.category === category)
    .toSorted((a, b) => a.firstSeenAt - b.firstSeenAt);
}

/** Has this exact archetype already been recorded? */
export function has(category, archetypeKey) {
  return idFor(category, archetypeKey) in load();
}

/** Has the player ever discovered ANYTHING? The onboarding uses this as its
 *  veteran check: a browser with codex finds predates the tutorial and gets
 *  silently grandfathered instead of being lectured on the mouse wheel. */
export function hasAnyEntries() {
  return Object.keys(load()).length > 0;
}

/** Every entry ever flagged a curiosity, across all categories — the
 *  showcase list, oldest discovery first. */
export function curiosities() {
  return Object.values(load())
    .filter((e) => e.curiosity)
    .toSorted((a, b) => a.firstSeenAt - b.firstSeenAt);
}

/**
 * Discovery progress for `category`: distinct archetypes found over the
 * catalog total. Categories backed by a finite codexData.js catalog compute
 * their own total automatically; 'system' has none (a galaxy is generated,
 * not enumerated), so its caller MUST pass the current party's system count
 * as `total` — see main.js.
 *
 * @param {string} category
 * @param {number} [total] required for 'system'; also overrides the catalog
 *   size for any other category, if a caller ever needs a different scope.
 * @returns {{found: number, total: number}}
 */
export function progress(category, total) {
  const catalog = catalogFor(category);
  // Count only entries whose archetypeKey is STILL in the catalog. The codex is
  // permanent and unversioned, so a returning player may hold entries under an
  // old key scheme (a pre-reorg `biome:type` ruin, a `type`-only station); those
  // orphans must not inflate the numerator past the catalog total. A category
  // with no catalog ('system') keeps its raw count.
  let found;
  if (catalog) {
    const keys = new Set(catalog.map((c) => c.archetypeKey));
    found = list(category).filter((e) => keys.has(e.archetypeKey)).length;
  } else {
    found = list(category).length;
  }
  if (typeof total === 'number') return { found, total };
  return { found, total: catalog ? catalog.length : 0 };
}
