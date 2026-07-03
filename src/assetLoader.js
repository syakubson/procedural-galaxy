// Minimal fetch-based asset loader (v1). Fetches an image or a JSON file off
// the network, hands back a ready-to-use THREE.Texture (or parsed JSON), and
// keeps a byte ledger per `tag` so getPerfSnapshot() (main.js) can report how
// much a given bucket of assets (e.g. skyboxes) actually cost.
//
// Deliberately small: no priority queue, no concurrency cap, no cancelTag.
// Nothing in the app needs to interrupt an in-flight load or throttle how
// many run at once — add those the day something does. Every caller here
// awaits load() and treats a rejection as "the asset just doesn't exist"
// (the scene already has a procedural fallback, so a failed skybox fetch is
// cosmetic, not fatal).
//
// texture vs TextureLoader parity: three.js's TextureLoader decodes into an
// <img> and relies on `texture.flipY` (default true) to flip it at GPU-upload
// time. We decode into an ImageBitmap instead (cheaper off-thread decode, no
// <img> DOM element) — but three.js explicitly ignores `.flipY` for
// ImageBitmap-backed textures, so the flip has to happen at decode time via
// `createImageBitmap`'s own `imageOrientation: 'flipY'` option. Everything
// else (colorSpace, wrap, mapping) is left to the caller, same as before —
// this loader only swaps out *how* the bytes get onto the GPU, not what the
// resulting texture looks like.
import * as THREE from 'three';

export class AssetLoader {
  constructor() {
    // tag -> Map<url, { type, bytes, texture? }> — per-tag ledger; dispose(tag)
    // drops one whole bucket (e.g. every texture loaded for one hero object).
    this._tags = new Map();
    // url -> in-flight/settled load promise. Keyed by url (not tag) so two
    // callers requesting the same file — even under different tags — share
    // one fetch instead of downloading it twice.
    this._pending = new Map();
  }

  /** Load `url` once. A second `load()` for the same url — while the first is
   *  still in flight, or after it resolved — returns the same promise instead
   *  of re-fetching. `type` is `'texture'` (default, resolves to a
   *  THREE.Texture) or `'json'` (resolves to the parsed object). `tag` buckets
   *  the byte ledger (see `bytesLoaded`/`dispose`). Rejects on network/decode
   *  failure — the caller decides what "no asset" means for that scene.
   *
   *  Ledger caveat of the url-level dedupe: a url belongs to the FIRST tag
   *  that requested it — a cache-hit under a different tag shares the bytes
   *  but doesn't re-register them, so per-tag accounting (and dispose(tag))
   *  only sees the original owner. Assets whose budget is judged per tag
   *  (hero textures) must therefore use urls of their own, not share files
   *  with other buckets. */
  load(url, { type = 'texture', tag = 'untagged' } = {}) {
    const cached = this._pending.get(url);
    if (cached) return cached;
    const fetchOne = type === 'json' ? this._fetchJson(url) : this._fetchTexture(url);
    const promise = fetchOne.then((entry) => {
      // dispose(tag) may have dropped this url while the fetch was in flight;
      // registering the late arrival would silently resurrect the tag (and
      // leak the GPU texture nobody will ever dispose again). Honour the
      // disposal instead: free what just landed and report the load as gone.
      if (this._pending.get(url) !== promise) {
        if (entry.type === 'texture') entry.texture.dispose();
        throw new Error(`AssetLoader: ${url} was disposed while loading`);
      }
      let bucket = this._tags.get(tag);
      if (!bucket) this._tags.set(tag, (bucket = new Map()));
      bucket.set(url, entry);
      return entry.type === 'texture' ? entry.texture : entry.data;
    });
    // A failed load shouldn't poison this url forever — drop it so a later
    // call (e.g. after the network recovers) gets a fresh attempt instead of
    // replaying the same rejection.
    promise.catch(() => this._pending.delete(url));
    this._pending.set(url, promise);
    return promise;
  }

  async _fetchTexture(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`AssetLoader: ${url} → HTTP ${res.status}`);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'flipY' });
    const texture = new THREE.Texture(bitmap);
    texture.needsUpdate = true;
    return { type: 'texture', bytes: blob.size, texture };
  }

  async _fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`AssetLoader: ${url} → HTTP ${res.status}`);
    const len = Number(res.headers.get('content-length'));
    let bytes = Number.isFinite(len) && len > 0 ? len : 0;
    const data = await res.json();
    // Content-Length is missing for some responses (e.g. a dev server that
    // compresses on the fly) — fall back to the serialized size, which is
    // close enough for a perf-budget estimate.
    if (!bytes) bytes = new Blob([JSON.stringify(data)]).size;
    return { type: 'json', bytes, data };
  }

  /** Bytes loaded so far under one `tag` (0 if nothing under it has resolved
   *  yet). Feeds getPerfSnapshot()'s per-bucket budgets. */
  bytesLoaded(tag) {
    const bucket = this._tags.get(tag);
    if (!bucket) return 0;
    let total = 0;
    for (const entry of bucket.values()) total += entry.bytes;
    return total;
  }

  /** Bytes loaded across every tag — feeds the systemAssetMB perf metric. */
  bytesLoadedTotal() {
    let total = 0;
    for (const bucket of this._tags.values()) {
      for (const entry of bucket.values()) total += entry.bytes;
    }
    return total;
  }

  /** Drop everything loaded under `tag`: disposes any GPU textures and forgets
   *  the byte ledger + cached promises, so a later `load()` for the same url
   *  fetches again instead of replaying a stale result. */
  dispose(tag) {
    const bucket = this._tags.get(tag);
    if (!bucket) return;
    for (const [url, entry] of bucket) {
      if (entry.type === 'texture' && entry.texture) entry.texture.dispose();
      this._pending.delete(url);
    }
    this._tags.delete(tag);
  }
}
