// Seeded pseudo-random number generator.
//
// A galaxy is fully determined by its seed: same seed -> identical galaxy.
// We use mulberry32 (tiny, fast, good statistical quality for visuals) plus a
// few convenience samplers used by the generators.

/** Hash an arbitrary string/number into a 32-bit unsigned integer seed. */
export function hashSeed(value) {
  const str = String(value);
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  // final avalanche
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 — returns a function producing floats in [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a small RNG toolkit bound to a seed.
 * All procedural code draws from here so the result is deterministic.
 */
export function createRng(seed) {
  const next = mulberry32(hashSeed(seed));

  // Cache one value from the Box–Muller pair for cheap Gaussian sampling.
  let spareGauss = null;

  const api = {
    /** Float in [0, 1). */
    next,
    /** Float in [min, max). */
    range(min, max) {
      return min + (max - min) * next();
    },
    /** Integer in [min, max]. */
    int(min, max) {
      return Math.floor(min + (max - min + 1) * next());
    },
    /** +1 or -1. */
    sign() {
      return next() < 0.5 ? -1 : 1;
    },
    /** Standard normal (mean 0, stddev 1) via Box–Muller. */
    gauss() {
      if (spareGauss !== null) {
        const v = spareGauss;
        spareGauss = null;
        return v;
      }
      let u = 0;
      let v = 0;
      let s = 0;
      do {
        u = next() * 2 - 1;
        v = next() * 2 - 1;
        s = u * u + v * v;
      } while (s >= 1 || s === 0);
      const mul = Math.sqrt((-2 * Math.log(s)) / s);
      spareGauss = v * mul;
      return u * mul;
    },
    /** Pick a random element of an array. */
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },
  };
  return api;
}
