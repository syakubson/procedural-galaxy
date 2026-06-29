// Camera framing for focused objects — all the «how close does the camera sit»
// tuning lives here, one entry per object type, so distances are easy to adjust.
//
//   dist    — camera distance as a multiple of the object's radius (bigger = farther)
//   reticle — the ranging-bracket size as a fraction of the object's radius
//
// `radius` is the planet's sphere radius for planets, or the object's true
// bounding-sphere radius for ships / structures / special craft.

export const FOCUS_FRAMING = {
  planet: { dist: 4.2, reticle: 1.0 }, // a touch farther — see the whole world + its rings
  ship: { dist: 3.0, reticle: 0.72 }, // close, visor hugging the hull
  structure: { dist: 3.0, reticle: 0.78 },
  ishimura: { dist: 2.8, reticle: 0.72 },
  deathstar: { dist: 3.0, reticle: 0.8 },
  dragon: { dist: 2.8, reticle: 0.72 },
  endurance: { dist: 3.0, reticle: 0.82 },
  default: { dist: 3.0, reticle: 0.8 },
};

/** Resolve a [cameraDistance, reticleRadius] pair for an object of `kind`
 *  whose radius is `r`. The distance is floored so tiny objects aren't hugged
 *  so close the camera clips into them. */
export function framingFor(kind, r) {
  const f = FOCUS_FRAMING[kind] || FOCUS_FRAMING.default;
  return { dist: Math.max(0.7, r * f.dist), reticleRadius: r * f.reticle };
}
