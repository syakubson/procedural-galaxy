// A "party" is one playthrough of the galaxy: a seed, when it started, and
// whatever progress ends up attached to it. Today that's just
// enough to key the world overlay's patches and to detect a stale save when
// the generator rules change underneath it. Everything here persists through
// storage.js's PARTY/META namespaces; nothing here touches localStorage
// directly.

import { GEN_VERSION } from '../systems/genParams.js';
import { NAMESPACES, read, write, hasKeyWithPrefix } from './storage.js';

const GLOBAL_META_SCOPE = 'global';

/** The party currently in play. Solo mode has exactly one party per seed, so
 *  the seed doubles as its id; a server-backed weekly mode (later) would give
 *  parties an id independent of the galaxy seed — this indirection point is
 *  why callers go through this function instead of reading config.seed. */
export function currentPartyId(config) {
  return config.seed;
}

function partiesScopeKey(gen, partyId) {
  return `${gen}::${partyId}`;
}

function patchesScopeKey(gen, partyId) {
  return `patches::${gen}::${partyId}`;
}

/**
 * Find (or create) this party's metadata record, and report whether the
 * generator rules moved since we last saw this browser.
 *
 * The party's own key is namespaced by GEN_VERSION, so a rules bump can never
 * collide with — or silently reinterpret — a save from the old rules: it
 * simply starts a brand new record. `versionChanged` instead answers a
 * different question, "has GEN_VERSION moved AT ALL since last boot", via a
 * single global pointer (META/global.lastGenVersion) — that's what main.js
 * uses to show a one-time "the universe was regenerated" notice, independent
 * of which particular party the player happens to be in right now.
 *
 * Returns `{ meta, versionChanged, fromVersion }`. `fromVersion` is whatever
 * lastGenVersion held BEFORE this call (null on a first-ever boot) — callers
 * that also want to catch a returning pre-overlay player (GEN_VERSION never
 * bumped, but this is their first boot on the new save format) check
 * `fromVersion === null` themselves; see main.js.
 */
export function ensureParty(config) {
  const partyId = currentPartyId(config);
  const partyKey = partiesScopeKey(GEN_VERSION, partyId);

  const globalMeta = read(NAMESPACES.META, GLOBAL_META_SCOPE, null);
  const fromVersion = globalMeta ? globalMeta.lastGenVersion : null;
  const versionChanged = fromVersion != null && fromVersion !== GEN_VERSION;

  let meta = read(NAMESPACES.PARTY, partyKey, null);
  if (!meta) {
    meta = {
      partyId,
      // Solo mode has no separate "week" concept — the party's week seed is
      // just its own id. A weekly-remote mode would derive this differently
      // (a shared seed for everyone that week) behind the same field name.
      weekSeed: partyId,
      genVersion: GEN_VERSION,
      mode: config.worldMode || 'off',
      startedAt: Date.now(),
      endsAt: null,
      status: 'active',
    };
    write(NAMESPACES.PARTY, partyKey, meta);
  }

  write(NAMESPACES.META, GLOBAL_META_SCOPE, { lastGenVersion: GEN_VERSION });

  return { meta, versionChanged, fromVersion };
}

/** Load this party's sparse world-overlay patches (systemId -> SystemPatch),
 *  or `{}` for a party with no patches yet. Used only by WorldOverlay. */
export function loadPatches(partyId) {
  return read(NAMESPACES.PARTY, patchesScopeKey(GEN_VERSION, partyId), {}) || {};
}

/** Persist the FULL patches object for a party in one write — WorldOverlay's
 *  patchMany() relies on this being a single round-trip regardless of how
 *  many systemIds it touched. */
export function savePatches(partyId, patches) {
  return write(NAMESPACES.PARTY, patchesScopeKey(GEN_VERSION, partyId), patches);
}

// endParty()/an ArchiveEntry list of past playthroughs are NOT implemented —
// there's no UI that ends a party, and no player list to render one against.
// If that day comes: endParty(partyId) marks PartyMeta.status 'ended' and
// appends an ArchiveEntry, and a party picker reads that archive instead of
// scanning localStorage keys.

/** One-shot detector for the pre-overlay per-seed keys
 *  (`galaxy.charted.<seed>`) this module's patches replace. Used to catch a
 *  returning player whose GEN_VERSION never actually changed but who still
 *  has old-format discovery data lying around — see the `fromVersion === null`
 *  check in main.js. The old keys are deliberately left alone: there's no
 *  useful migration path from a flat visited-index set to id-keyed patches,
 *  and deleting other data isn't this function's job. */
export function hasLegacyCharted() {
  return hasKeyWithPrefix('galaxy.charted.');
}
