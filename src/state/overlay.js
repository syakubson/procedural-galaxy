// The world the player sees = an immutable BASE (whatever generateSystem() /
// the special generateXxx() functions return for a seed) plus a small,
// mutable PATCH layered on top. Keeping the base pure means the galaxy stays
// a deterministic function of its seed forever; only the sparse patch needs
// to persist, and only the FACT of a change (visited, captured, destroyed) —
// never the underlying generated data itself.

import { loadPatches, savePatches } from './party.js';

/**
 * Merge `patch` onto `base`, producing the object the player actually sees.
 * Pure — never mutates either argument. Without a patch, returns `base` BY
 * THE SAME REFERENCE (no allocation): most systems in a fresh party have no
 * patch at all, so the common case stays free.
 *
 * SystemPatch fields — all optional, sparse:
 *   visited?, visitedAt?                       — used today (fog-of-war)
 *   capturedBy?, capturedAt?                   — later: nation ownership
 *   planets?: { [planetIndex]: { destroyed?, controlledBy? } } — later: combat
 *   flags?: { [key]: any }                     — later: per-arc state machine
 */
export function applyOverlay(base, patch) {
  if (!patch) return base;
  const merged = { ...base, ...patch };
  if (patch.planets) {
    const basePlanets = base.planets || [];
    merged.planets = basePlanets.map((p, i) => (patch.planets[i] ? Object.assign({}, p, patch.planets[i]) : p));
  }
  if (patch.flags) {
    merged.flags = { ...base.flags, ...patch.flags };
  }
  return merged;
}

/**
 * One party's mutable layer over the deterministic base galaxy. Patches are
 * keyed by systemId (== data.seed, the same id the catalog/markers/codex all
 * share) and persisted as ONE object per party — a party touches at most a
 * few dozen systems, so per-system keys would buy nothing, and keeping it one
 * object is what lets patchMany() reveal/patch a whole batch in a single
 * localStorage round-trip instead of one per system.
 *
 * Persistence itself is delegated to party.js (loadPatches/savePatches),
 * which in turn is the only thing that calls storage.js for this data — this
 * class never touches localStorage directly.
 */
export class WorldOverlay {
  constructor(partyId) {
    this.partyId = partyId;
    this._patches = loadPatches(partyId);
  }

  /** The raw SystemPatch for a system, or undefined if it's untouched. */
  get(systemId) {
    return this._patches[systemId];
  }

  /** Merge `partial` into one system's patch and persist. */
  patch(systemId, partial) {
    this._patches[systemId] = { ...this._patches[systemId], ...partial };
    this._persist();
  }

  /** Apply the SAME partial to many systems with a single persist — e.g.
   *  "reveal every system" would otherwise be one localStorage write per
   *  system instead of one write total. */
  patchMany(systemIds, partial) {
    for (const id of systemIds) {
      this._patches[id] = { ...this._patches[id], ...partial };
    }
    this._persist();
  }

  /** The effective (base + patch) view of one system. Every consumer that
   *  shows a system to the player — markers, the system viewer, later the
   *  codex's 3D re-render — reads through this, never the raw generate*()
   *  output, so a patched fact (once patches carry more than `visited`)
   *  always shows up everywhere at once. */
  effective(systemId, base) {
    return applyOverlay(base, this._patches[systemId]);
  }

  /** Drop every patch for this party. Nothing calls this yet — a later
   *  campaign stage retires/archives a party wholesale; see the endParty()
   *  note in party.js. */
  clear() {
    this._patches = {};
    this._persist();
  }

  _persist() {
    savePatches(this.partyId, this._patches);
  }
}
