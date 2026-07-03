// Default galaxy configuration + quality presets.
//
// Everything procedural lives here. The GUI mutates this object; structural
// changes (counts, shape) trigger a rebuild, while live changes (rotation
// speed, sizes, bloom) only update shader uniforms — see gui.js.

export const QUALITY_PRESETS = {
  low: {
    label: 'Низкое (слабый ПК)',
    starCount: 16000,
    sunCount: 95,
    backgroundStars: 1500,
    nebula: true,
    antialias: false,
    maxPixelRatio: 1.0,
  },
  medium: {
    label: 'Среднее',
    starCount: 38000,
    sunCount: 175,
    backgroundStars: 2600,
    nebula: true,
    antialias: true,
    maxPixelRatio: 1.5,
  },
  high: {
    label: 'Высокое',
    starCount: 78000,
    sunCount: 280,
    backgroundStars: 4000,
    nebula: true,
    antialias: true,
    maxPixelRatio: 2.0,
  },
};

/** Build a fresh default config. `quality` seeds the count/effect fields. */
export function createDefaultConfig(quality = 'medium') {
  const q = QUALITY_PRESETS[quality] || QUALITY_PRESETS.medium;
  return {
    // --- identity ---
    seed: 'andromeda',
    palette: 'spore',
    quality,

    // --- shape (structural: changing these rebuilds geometry) ---
    starCount: q.starCount,
    arms: 5, // number of spiral arms
    radius: 100, // disk radius in world units
    spin: 4.6, // how tightly arms wind (radians accumulated across the disk)
    armWidth: 0.16, // tangential scatter as a fraction of radius -> arm thickness
    randomness: 0.065, // overall positional jitter
    randomnessPower: 3.6, // >1 keeps jitter tight near arm centre lines (crisp outer arms)
    coreSize: 0.24, // bulge radius as a fraction of disk radius (larger = smearier core)
    coreDensity: 0.20, // fraction of stars packed into the central bulge
    thickness: 0.05, // disk vertical thickness as a fraction of radius

    // --- suns (the little coloured solar systems) ---
    sunCount: q.sunCount,
    sunSize: 1.4, // size multiplier for suns (bigger, fewer-stars Spore look)

    // --- explorable real systems ---
    realSystemFraction: 0.4, // share of suns that become explorable systems (#11: more to explore)
    showMarkers: true, // glowing halo markers on explorable systems

    // --- background ---
    backgroundStars: q.backgroundStars,
    nebula: q.nebula,
    nebulaIntensity: 0.55, // brighter gas glowing along the arms (#14 Spore look)

    // --- motion (live: handled on the GPU) ---
    rotationSpeed: 0.045, // base angular velocity (radians/sec at the rim)
    differential: 0.4, // 0 = rigid, 1 = strong inner speed-up (lower = arms shear less over time)
    twinkle: 0.5, // star brightness shimmer amount
    cameraAutoRotate: true, // slow auto-orbit of the galaxy view by default (#13)

    // --- look (live) ---
    starSize: 1.0, // global star size multiplier
    exposure: 1.0, // overall brightness

    // --- renderer hints (read at init / quality change) ---
    antialias: q.antialias,
    maxPixelRatio: q.maxPixelRatio,
  };
}

/** Apply a quality preset onto an existing config in place. */
export function applyQuality(config, quality) {
  const q = QUALITY_PRESETS[quality] || QUALITY_PRESETS.medium;
  config.quality = quality;
  config.starCount = q.starCount;
  config.sunCount = q.sunCount;
  config.backgroundStars = q.backgroundStars;
  config.nebula = q.nebula;
  config.antialias = q.antialias;
  config.maxPixelRatio = q.maxPixelRatio;
  return config;
}

// Per-profile performance budgets, keyed the same as QUALITY_PRESETS. These
// numbers are a starting hypothesis, not measured ceilings — calibrate them
// against a real headed perf run (see scripts/perf_bench.py) on a reference
// machine before trusting them. Low is the only tier that hard-gates hero
// textures (maxHeroTextureMB: 0): weak PCs get the procedural material,
// never a network request for a texture.
// maxBundleKB is judged against the UNCOMPRESSED transfer weight (what the
// local dev server actually serves — vendored three.module.js alone is
// ~1.24 MB of it); a CDN's gzip/brotli ships the same page 3-4x smaller, so
// these ceilings track "did the bundle grow", not "what does prod download".
// Galaxy view has its own draw-call/triangle ceilings: it's a different scene
// (point cloud + marker sprites) that sits nowhere near the system-view
// numbers, and judging it by the system budget made every measurement flap
// within 1-2 calls of the limit.
export const PERF_BUDGETS = {
  low: {
    targetFps: 60,
    maxDrawCallsGalaxyView: 90,
    maxTrianglesGalaxyView: 20000,
    maxDrawCallsSystemView: 60,
    maxTrianglesSystemView: 250000,
    maxHeroTextureMB: 0,
    maxSystemAssetMB: 6,
    maxColdLoadMs: 3500,
    maxBundleKB: 2200,
  },
  medium: {
    targetFps: 60,
    maxDrawCallsGalaxyView: 140,
    maxTrianglesGalaxyView: 30000,
    maxDrawCallsSystemView: 90,
    maxTrianglesSystemView: 450000,
    maxHeroTextureMB: 8,
    maxSystemAssetMB: 12,
    maxColdLoadMs: 4500,
    maxBundleKB: 2400,
  },
  high: {
    targetFps: 60,
    maxDrawCallsGalaxyView: 200,
    maxTrianglesGalaxyView: 50000,
    maxDrawCallsSystemView: 140,
    maxTrianglesSystemView: 800000,
    maxHeroTextureMB: 16,
    maxSystemAssetMB: 24,
    maxColdLoadMs: 6000,
    maxBundleKB: 2800,
  },
};

// Housekeeping ceilings for offline tooling (check_assets.py et al.) — never
// read at runtime, so they stay out of the shipped bundle either way.
export const ASSET_LIMITS = {
  maxCommittedBinaryMB: 10, // a single binary above this belongs on CDN/Blob, not in git
  maxRepoBinariesMB: 150, // total committed binary weight across the repo
};

// Maps each metrics.* key to the PERF_BUDGETS field that judges it. The
// budget key can depend on the metrics bag itself: drawCalls/triangles pick
// the galaxy- or system-view ceiling by `metrics.view` (galaxy is the default
// — it's the boot scene, and a caller that never set `view` is looking at it).
// `dir` is the direction of failure, carried into each violation so printers
// can render "fps=15<60" instead of the lying "fps=15>60" — fps is the one
// metric where *lower* than target is the violation.
const BUDGET_CHECKS = [
  ['fps', () => 'targetFps', '<', (value, budget) => value < budget],
  ['drawCalls', (m) => (m.view === 'system' ? 'maxDrawCallsSystemView' : 'maxDrawCallsGalaxyView'), '>', (value, budget) => value > budget],
  ['triangles', (m) => (m.view === 'system' ? 'maxTrianglesSystemView' : 'maxTrianglesGalaxyView'), '>', (value, budget) => value > budget],
  ['heroTextureMB', () => 'maxHeroTextureMB', '>', (value, budget) => value > budget],
  ['systemAssetMB', () => 'maxSystemAssetMB', '>', (value, budget) => value > budget],
  ['coldLoadMs', () => 'maxColdLoadMs', '>', (value, budget) => value > budget],
  ['bundleKB', () => 'maxBundleKB', '>', (value, budget) => value > budget],
];

/** An unknown profile falls back to medium; callers that report the profile
 *  back to a human should echo the *applied* key, not the raw input. */
export function resolveBudgetProfile(profile) {
  return PERF_BUDGETS[profile] ? profile : 'medium';
}

/** Pure comparison: a `profile` (low/medium/high) against a `metrics` bag.
 *  Only metrics that are actually present get judged — a caller that hasn't
 *  measured e.g. coldLoadMs yet just omits it, rather than passing 0 and
 *  tripping a false violation. `metrics.view` ('galaxy' | 'system') selects
 *  which draw-call/triangle ceiling applies; it is context, not a judged
 *  metric. No DOM/console access, so it's safe to call from perf_bench.py's
 *  page.evaluate() as well as from the browser. */
export function checkBudget(profile, metrics) {
  const budget = PERF_BUDGETS[resolveBudgetProfile(profile)];
  const violations = [];
  for (const [metricKey, budgetKeyFor, dir, isViolation] of BUDGET_CHECKS) {
    const value = metrics[metricKey];
    if (value === undefined) continue;
    const budgetValue = budget[budgetKeyFor(metrics)];
    if (isViolation(value, budgetValue)) {
      violations.push({ metric: metricKey, value, budget: budgetValue, dir });
    }
  }
  return { ok: violations.length === 0, violations };
}
