// Still-image thumbnails of discovered finds for the codex shelf. Each is a
// one-frame render of the SAME object codexViewer.js rebuilds for the big
// «Рассмотреть» viewer — so a card shows the actual ship/planet/phenomenon,
// not a stand-in. One small offscreen renderer is shared across every
// thumbnail and every data-URL is cached for the module's life, so opening
// the codex a second time costs nothing.
//
// 'system' has no 3D object (see codexViewer.buildFor) — thumbnailFor() returns
// null for it and the UI falls back to codexIcons.js's star glyph.

import * as THREE from 'three';
import { buildFor } from './codexViewer.js';

const SIZE = 300; // square render target; the card scales it down
const _cache = new Map(); // entry.id -> data URL (or null once known unrenderable)
let _renderer = null;

function getRenderer() {
  if (!_renderer) {
    // preserveDrawingBuffer is required for toDataURL to read a stable frame;
    // alpha lets the card's own background show through around the object.
    _renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    _renderer.setPixelRatio(1);
    _renderer.setSize(SIZE, SIZE);
    _renderer.toneMapping = THREE.ACESFilmicToneMapping;
  }
  return _renderer;
}

/** Frame the camera on the handle's `focus` object (a planet body) or the whole
 *  scene, mirroring objectViewer.js's fit so a thumbnail is composed like the
 *  full viewer. Matrices are refreshed first — nothing has rendered yet. */
function frame(camera, scene, handle) {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject((handle && handle.focus) || scene);
  const size = new THREE.Vector3();
  const target = new THREE.Vector3();
  if (box.isEmpty()) {
    size.set(1, 1, 1);
  } else {
    box.getSize(size);
    box.getCenter(target);
  }
  // tighter than the full viewer's fit (1.7 + 1.5): a thumbnail wants the
  // object to fill the frame, and there's no user orbit to leave room for.
  const dist = Math.max(size.x, size.y, size.z, 0.4) * 1.5 + 0.55;
  camera.position.set(target.x + dist * 0.32, target.y + dist * 0.22, target.z + dist * 0.9);
  camera.lookAt(target);
}

/**
 * A data-URL thumbnail for a discovered entry, or null if the entry has no
 * standalone 3D object ('system') or the rebuild failed. Cached by entry.id.
 *
 * @param {object} entry a codex.js Entry.
 * @param {object} [ctx] passed straight to codexViewer.buildFor ({overlay}).
 * @returns {string|null}
 */
export function thumbnailFor(entry, ctx) {
  if (_cache.has(entry.id)) return _cache.get(entry.id);
  if (entry.category === 'system') {
    _cache.set(entry.id, null);
    return null;
  }

  const build = buildFor(entry, ctx);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 4000);
  // a soft rig for lit materials (ships/stations); planets self-light through
  // their shader and ignore scene lights, so this never flattens them. The
  // Ishimura/Death Star builders ship their OWN light rig (matching the big
  // viewer), so skip ours for them — else the thumbnail is double-lit.
  const selfLit = entry.archetypeKey === 'ishimura' || entry.archetypeKey === 'deathstar';
  if (!selfLit) {
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(5, 6, 7);
    scene.add(key, new THREE.AmbientLight(0x556070, 1.0));
  }

  let handle = null;
  let url = null;
  try {
    handle = build(scene) || null;
    frame(camera, scene, handle);
    if (handle && handle.update) handle.update(0.6); // one tick: shader time, orbit-tech visibility
    const renderer = getRenderer();
    renderer.render(scene, camera);
    url = renderer.domElement.toDataURL('image/webp', 0.85);
  } catch (e) {
    url = null;
  } finally {
    if (handle && handle.dispose) handle.dispose();
  }
  _cache.set(entry.id, url);
  return url;
}

/** Free the shared renderer's WebGL context — called when the codex closes so
 *  an idle codex never holds a second live context. The data-URL cache stays,
 *  so reopening re-renders nothing; the renderer lazily rebuilds on demand. */
export function releaseThumbnailRenderer() {
  if (_renderer) {
    _renderer.dispose();
    _renderer.forceContextLoss();
    _renderer = null;
  }
}
