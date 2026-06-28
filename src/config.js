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
