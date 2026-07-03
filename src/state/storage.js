// The single owner of window.localStorage in this codebase. Every module that
// needs to persist something — the world overlay, party lifecycle, anything
// else that ever comes up — goes through read()/write()/remove() here instead
// of touching localStorage directly. Centralising it means one
// place enforces the key format and the schema version, and one place absorbs
// storage failures (quota exceeded, private-mode Safari, a locked-down embed)
// so every call site is spared its own try/catch.

// Bump when the on-disk ENVELOPE shape changes (the `{v, writtenAt, data}`
// wrapper below) — not when a namespace's own payload shape changes, that's
// each caller's concern. A schema bump changes every key this module
// produces, so old data is simply orphaned under its old key, never migrated
// (see party.js: the same trade-off applies one level up, to GEN_VERSION).
export const STORAGE_SCHEMA_VERSION = 1;

// Top-level buckets. PARTY holds the current playthrough's state (world
// overlay patches, party metadata), META holds cross-party pointers (e.g.
// "what GEN_VERSION did we last see"), CODEX holds the permanent cross-party
// discovery log (src/codex/codex.js), and PLAYER holds per-device player
// state (the onboarding tour's progress; future per-device settings) —
// declared up front so anything persisted lands in one of these four buckets
// instead of a fifth appearing ad hoc.
export const NAMESPACES = {
  PARTY: 'party',
  CODEX: 'codex', // permanent cross-party records — the codex discovery log
  PLAYER: 'player', // per-device player state (onboarding; future settings)
  META: 'meta',
};

/** The actual localStorage key for a (namespace, scopeKey) pair. */
export function keyFor(namespace, scopeKey) {
  return `galaxy.${namespace}.v${STORAGE_SCHEMA_VERSION}.${scopeKey}`;
}

/** Read a stored value, unwrapping the envelope. Returns `fallback` on a miss,
 *  a parse error, a malformed envelope, or when storage itself throws —
 *  callers never need their own try/catch. */
export function read(namespace, scopeKey, fallback = null) {
  try {
    const raw = localStorage.getItem(keyFor(namespace, scopeKey));
    if (!raw) return fallback;
    const envelope = JSON.parse(raw);
    if (!envelope || typeof envelope !== 'object' || !('data' in envelope)) return fallback;
    return envelope.data;
  } catch (e) {
    return fallback;
  }
}

/** Persist `data` under (namespace, scopeKey), wrapped in `{v, writtenAt, data}`.
 *  Returns true on success, false on ANY failure — quota exceeded, private-mode
 *  Safari throwing on setItem, storage disabled entirely. Same fail-soft
 *  pattern the old per-file localStorage calls used: a write failure just
 *  means this session's progress won't persist, never a thrown exception. */
export function write(namespace, scopeKey, data) {
  try {
    const envelope = { v: STORAGE_SCHEMA_VERSION, writtenAt: Date.now(), data };
    localStorage.setItem(keyFor(namespace, scopeKey), JSON.stringify(envelope));
    return true;
  } catch (e) {
    return false;
  }
}

/** Remove one stored value. Returns true unless storage itself throws. */
export function remove(namespace, scopeKey) {
  try {
    localStorage.removeItem(keyFor(namespace, scopeKey));
    return true;
  } catch (e) {
    return false;
  }
}

/** Scan for ANY existing localStorage key starting with `prefix`. For one-off
 *  detections OUTSIDE this module's own key format — e.g. party.js checking
 *  for the pre-overlay `galaxy.charted.<seed>` keys it superseded. Kept here
 *  (rather than in the caller) because this file is the only one allowed to
 *  touch `window.localStorage` at all, even for a raw scan like this one. */
export function hasKeyWithPrefix(prefix) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}
