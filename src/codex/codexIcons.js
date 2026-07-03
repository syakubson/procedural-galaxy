// Per-category line-art icons for the codex, drawn in the cartographer stroke
// style (thin `currentColor` strokes, round joins). Two uses:
//   1. placeholder art on an UNDISCOVERED slot — each category gets a DISTINCT
//      silhouette so a locked shelf still reads as "planets" vs "ships" at a
//      glance, never a wall of identical "?".
//   2. the thumbnail for a 'system' entry, which has no 3D object to render.
// Pure strings, no DOM — the caller drops them into innerHTML.

const ICONS = {
  // a star: core + eight rays
  system: `<circle cx="24" cy="24" r="6"/><g stroke-linecap="round">
    <path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4"/></g>`,
  // a ringed planet
  planet: `<circle cx="24" cy="23" r="11"/><ellipse cx="24" cy="26" rx="19" ry="6" transform="rotate(-18 24 26)"/>`,
  // a settlement skyline (domes + towers)
  race: `<path d="M8 34h32" stroke-linecap="round"/><path d="M12 34V22a5 5 0 0 1 10 0v12"/><path d="M24 34V16l7 5v13"/><path d="M31 34V25l5 3v6"/>`,
  // a broken colonnade — two cracked pillars
  ruin: `<path d="M13 34V15M23 34V19M13 15l-3-4h9l-3 4M23 19l7-6" stroke-linecap="round"/><path d="M9 34h30" stroke-linecap="round"/><path d="M31 34V22l6 4v8"/>`,
  // a fighter, seen from above
  ship: `<path d="M24 7l4 22-4 5-4-5 4-22Z"/><path d="M20 24l-11 6 3 4 9-3M28 24l11 6-3 4-9-3" stroke-linejoin="round"/>`,
  // an orbital ring station: hub + wheel + spokes
  station: `<circle cx="24" cy="24" r="13"/><circle cx="24" cy="24" r="4"/><path d="M24 11v6M24 31v6M11 24h6M31 24h6"/>`,
  // a black hole: event horizon + swept accretion arc
  phenomenon: `<circle cx="24" cy="24" r="7"/><path d="M17 24a7 12 0 0 1 14 0M31 24a7 12 0 0 1-14 0" transform="rotate(24 24 24)"/><path d="M8 24a16 8 0 0 1 32 0" opacity="0.5"/>`,
};

/**
 * Inline SVG markup for a category's icon, sized to fill its container.
 *
 * @param {string} category one of the codex categories (or 'system').
 * @returns {string} an `<svg>…</svg>` string using `currentColor`.
 */
export function categoryIcon(category) {
  const body = ICONS[category] || ICONS.system;
  return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
}
