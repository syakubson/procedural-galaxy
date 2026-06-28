// Alliance — the baseline faction, now in its own file (matching the agent
// factions) and the EXEMPLAR for two new hooks every faction now supports:
//   • roles.<id>(style)  — a BESPOKE per-faction builder that replaces the
//     shared role silhouette (here: a unique carrier-style flagship);
//   • station(grp, type, style) — a faction signature added onto stations.
// Palette darkened to a gunmetal steel so the Alliance no longer reads like the
// bright-white Syndicate.

import { C, ACC, GLOW, box, sph, part, group, engineGlow, runningLights, antenna } from './style.js';

// Bespoke Alliance flagship: a twin-hull fleet CARRIER (two long pontoons, a flat
// flight deck, an offset bridge island, engine banks) — clearly not the generic
// wedge. Nose = +Z, ~1.0 long so the flagship role scale fits.
function makeAllianceFlagship(s) {
  const grp = group();
  for (const x of [-0.14, 0.14]) {
    grp.add(part(box(0.11, 0.1, 0.92), C(s, 'hull'), x, -0.02, 0)); // pontoon
    grp.add(part(box(0.07, 0.07, 0.16), C(s, 'dark'), x, -0.02, 0.52)); // bow block
    engineGlow(grp, s, x - 0.03, -0.02, -0.5, 0.03);
    engineGlow(grp, s, x + 0.03, -0.02, -0.5, 0.03);
    for (let z = 0.32; z > -0.42; z -= 0.08) {
      grp.add(part(box(0.012, 0.012, 0.02), C(s, 'glass'), x + (x > 0 ? 0.055 : -0.055), 0, z));
    }
  }
  grp.add(part(box(0.42, 0.02, 0.82), C(s, 'hull2'), 0, 0.06, 0)); // flight deck
  grp.add(part(box(0.03, 0.006, 0.72), ACC(s), 0, 0.073, 0)); // deck centre stripe
  for (const z of [0.36, 0, -0.36]) grp.add(part(box(0.32, 0.04, 0.05), C(s, 'accent'), 0, -0.02, z)); // cross struts
  grp.add(part(box(0.07, 0.1, 0.16), C(s, 'dark'), 0.11, 0.13, -0.22)); // bridge island (offset)
  grp.add(part(box(0.05, 0.03, 0.05), C(s, 'glass'), 0.11, 0.2, -0.2));
  antenna(grp, s, 0.11, 0.23, -0.24, 0.1);
  runningLights(grp, s, 0.2, 0.06, 0.4);
  return grp;
}

// Alliance station signature: a bright blue beacon + a thin accent collar.
function allianceStation(grp, type, s) {
  grp.add(part(sph(0.05, 8), GLOW(s), 0, type === 'collector' ? 1.0 : 0.0, type === 'ring' ? 0.46 : 0.0));
  grp.add(part(sph(0.035, 8), GLOW(s), type === 'outpost' ? 0.0 : 0.3, type === 'outpost' ? 0.82 : 0.0, 0));
}

export const FACTION = {
  id: 'alliance',
  name: 'Альянс',
  colors: { hull: 0x7e8a9e, hull2: 0x5e6878, accent: 0x49546a, dark: 0x262c36, glass: 0x8fc4ff, gold: 0xbfae7a },
  accent: 0x2f6bff,
  glow: 0x8fc4ff,
  nav: { port: 0xff4036, star: 0x49ff84, top: 0xffffff },
  lore: 'Стальной гунметалловый флот Альянса: утилитарный, надёжный, авианосцы вместо линкоров.',
  roles: { flagship: makeAllianceFlagship },
  station: allianceStation,
};
