// Faction style-kit (#11): СИНДИКАТ — a sleek hi-tech corporate fleet. Bright
// white hulls, lots of glass, CYAN glowing accents/engines. Beyond the palette,
// `flourish` stamps the signature look: thin additive CYAN light-lines running
// along the hull flanks + a dorsal spine line, a sleek glass sensor dome on the
// nose-top, and clean swept accent fins. More lines on the liner & flagship.
//
// Consumed by every role builder in roles.js, so one kit restyles all 9 ships.
// Schema matches ALLIANCE in factions.js (named export FACTION here).

import { C, ACC, GLOW, NAV, group, box, cyl, sph, cone, part, addRot, engineGlow, navLight, runningLights, antenna } from './style.js';

// Per-role greeble metrics (sizes follow the silhouettes built in roles.js):
//   hw   half-width — x of the flank light-lines
//   ll   line length along Z; lz its centre
//   sy   y of the dorsal spine line (just above the hull top)
//   fin  fin height (0 = no fins for that role)
//   dome [x, y, z, r] of the glass sensor dome
//   ribs y-offsets of flank-line PAIRS (more entries = more lines)
const M = {
  scout:       { hw: 0.05,  ll: 0.13, lz: 0.0,   sy: 0.032, fin: 0,    dome: [0, 0.03,  0.045, 0.013], ribs: [0.0] },
  fighter:     { hw: 0.042, ll: 0.17, lz: 0.0,   sy: 0.034, fin: 0.03, dome: [0, 0.028, 0.06,  0.014], ribs: [0.0] },
  interceptor: { hw: 0.04,  ll: 0.24, lz: -0.02, sy: 0.026, fin: 0,    dome: [0, 0.022, 0.035, 0.011], ribs: [0.0] },
  gunship:     { hw: 0.054, ll: 0.22, lz: 0.0,   sy: 0.044, fin: 0.04, dome: [0, 0.085, -0.06, 0.018], ribs: [0.0] },
  corvette:    { hw: 0.052, ll: 0.42, lz: 0.0,   sy: 0.066, fin: 0.04, dome: [0, 0.105, -0.1,  0.02 ], ribs: [0.0] },
  freighter:   { hw: 0.079, ll: 0.28, lz: -0.02, sy: 0.04,  fin: 0,    dome: [0, 0.085, 0.13,  0.018], ribs: [0.0] },
  tanker:      { hw: 0.072, ll: 0.34, lz: -0.02, sy: 0.065, fin: 0,    dome: [0, 0.035, 0.27,  0.016], ribs: [-0.02] },
  liner:       { hw: 0.053, ll: 0.38, lz: 0.0,   sy: 0.052, fin: 0,    dome: [0, 0.07,  0.18,  0.02 ], ribs: [0.024, -0.024] },
  flagship:    { hw: 0.16,  ll: 0.8,  lz: 0.05,  sy: 0.1,   fin: 0.06, dome: [0, 0.205, -0.24, 0.03 ], ribs: [0.06, -0.04] },
};

// The signature detailing pass. Adds 3–8 small additive/glass/accent meshes that
// read as polished, expensive, luminous hi-tech trim — distinct from the palette.
function flourish(grp, roleId, style) {
  const m = M[roleId];
  if (!m) return;

  // Glowing CYAN light-lines down both flanks (one pair per `ribs` entry).
  for (const ry of m.ribs) {
    for (const sx of [-1, 1]) grp.add(part(box(0.004, 0.004, m.ll), GLOW(style), sx * m.hw, ry, m.lz));
  }

  // A single bright dorsal spine line along the top.
  grp.add(part(box(0.005, 0.004, m.ll * 0.85), GLOW(style), 0, m.sy, m.lz));

  // Sleek glass sensor dome on the nose/top.
  const [dx, dy, dz, dr] = m.dome;
  grp.add(part(sph(dr, 10), C(style, 'glass'), dx, dy, dz));

  // Thin clean swept accent fins at the rear flanks (combat / capital roles only).
  if (m.fin) {
    for (const sx of [-1, 1]) {
      addRot(grp, box(0.004, m.fin, m.fin * 1.3), C(style, 'accent'), sx * m.hw * 0.85, m.fin * 0.3, m.lz - m.ll * 0.34, 0, sx * 0.35, 0);
    }
  }
}

// Bespoke Syndicate flagship — a unique silhouette that REPLACES the shared wedge
// for this faction (wired via FACTION.roles.flagship). Concept: a long, clean
// corporate cruiser — a smooth cylindrical hull with a tapered prow, a forward
// glass sensor dish, a full-length glowing CYAN spine, glass dome panels, a
// command blister, and twin sleek outboard engine nacelles. NOSE = +Z.
function makeSyndicateFlagship(s) {
  const grp = group();

  // Long smooth cylindrical main hull (axis along Z), tapered prow ahead of it.
  addRot(grp, cyl(0.075, 0.075, 0.8, 18), C(s, 'hull'), 0, 0, -0.02, Math.PI / 2);
  addRot(grp, cone(0.075, 0.22, 18), C(s, 'hull2'), 0, 0, 0.49, Math.PI / 2);
  // Forward sensor dish: a thin wide glass cyl flaring at the prow.
  addRot(grp, cyl(0.11, 0.07, 0.018, 22), C(s, 'glass'), 0, 0, 0.42, Math.PI / 2);

  // Dorsal ridge plate + a full-length glowing CYAN spine line, plus a belly line.
  grp.add(part(box(0.05, 0.04, 0.62), C(s, 'hull2'), 0, 0.068, -0.05));
  grp.add(part(box(0.01, 0.006, 0.74), GLOW(s), 0, 0.095, -0.05));
  grp.add(part(box(0.008, 0.006, 0.6), GLOW(s), 0, -0.078, -0.02));
  // Signature accent strake along the spine.
  grp.add(part(box(0.012, 0.03, 0.4), ACC(s), 0, 0.082, -0.05));

  // Glass dome panels marching down the spine.
  for (const z of [0.18, 0.04, -0.12]) grp.add(part(sph(0.028, 12), C(s, 'glass'), 0, 0.05, z));
  // Command blister + bridge glass near the stern-top.
  grp.add(part(box(0.09, 0.05, 0.12), C(s, 'dark'), 0, 0.1, -0.26));
  grp.add(part(box(0.075, 0.02, 0.04), C(s, 'glass'), 0, 0.135, -0.22));

  // Twin sleek outboard engine nacelles on short pylons (tail).
  for (const x of [-0.12, 0.12]) {
    addRot(grp, cyl(0.03, 0.04, 0.26, 12), C(s, 'hull'), x, 0, -0.28, Math.PI / 2);
    grp.add(part(box(0.02, 0.012, 0.18), C(s, 'accent'), x, 0, -0.2)); // pylon
    grp.add(part(box(0.006, 0.006, 0.2), GLOW(s), x, 0.036, -0.26)); // nacelle light-line
    engineGlow(grp, s, x, 0, -0.42, 0.034);
  }
  engineGlow(grp, s, 0, 0, -0.45, 0.04); // central main engine

  runningLights(grp, s, 0.14, 0, 0.12);
  navLight(grp, s, 'top', 0, 0.12, 0.0);
  antenna(grp, s, 0, 0.1, -0.32, 0.12);
  return grp;
}

// ---------------------------------------------------------------------------
// BESPOKE STATIONS — completely different geometry per Syndicate station type,
// not a recolour of the shared shapes. Aesthetic: sleek crystalline glass-and-cyan.
// Each builder receives the style-kit and returns a Group (createStation bakes it).
// Only box/cyl/sph/cone via the toolkit; no THREE import, no bake call.
// ---------------------------------------------------------------------------

// HOME HUB (biggest): a luminous habitat ring built from faceted glass SEGMENTS
// around a circle (no torus) that spins about Z, wrapped around a static
// crystalline core spire (a glass bicone with a glowing cyan core line).
function makeSyndicateRing(s) {
  const grp = group();

  // --- spinning glass habitat wheel (segments + spokes + cyan rim, in the XY plane) ---
  const wheel = group();
  const R = 1.0;
  const N = 16;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const x = Math.cos(a) * R;
    const y = Math.sin(a) * R;
    // faceted glass ring segment, tangent to the circle
    addRot(wheel, box(0.07, 0.09, 0.45), i % 2 ? C(s, 'glass') : C(s, 'hull2'), x, y, 0, 0, 0, a + Math.PI / 2);
    // cyan-green light node just inside each segment
    wheel.add(part(sph(0.028, 6), NAV(s, 'star'), Math.cos(a) * (R - 0.09), Math.sin(a) * (R - 0.09), 0));
    // glowing cyan rim-line ribbon flush inside the ring
    addRot(wheel, box(0.012, 0.012, 0.45), GLOW(s), Math.cos(a) * (R - 0.02), Math.sin(a) * (R - 0.02), 0, 0, 0, a + Math.PI / 2);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2; // clean glass spokes hub -> rim
    addRot(wheel, box(0.86, 0.025, 0.025), C(s, 'glass'), Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0, 0, 0, a);
  }
  grp.add(wheel);
  grp.userData.spin = wheel; // rotated about Z each frame by the system view

  // --- static crystalline core spire (glass bicone along Z + glowing cyan core) ---
  addRot(grp, cone(0.17, 0.42, 6), C(s, 'glass'), 0, 0, 0.21, Math.PI / 2); // forward prism
  addRot(grp, cone(0.17, 0.42, 6), C(s, 'hull'), 0, 0, -0.21, -Math.PI / 2); // aft prism
  grp.add(part(box(0.02, 0.02, 0.86), GLOW(s), 0, 0, 0)); // glowing cyan core line
  grp.add(part(sph(0.1, 12), C(s, 'glass'), 0, 0, 0)); // crystal heart
  grp.add(part(sph(0.05, 8), C(s, 'glass'), 0, 0.16, 0));
  grp.add(part(sph(0.05, 8), C(s, 'glass'), 0, -0.16, 0));
  navLight(grp, s, 'top', 0, 0, 0.46, 0.04);
  return grp;
}

// COLONY OUTPOST (small): a sleek floating glass pod inside a slim white collar
// ringed with a cyan light-band, with two mini docking pods on clean arms.
function makeSyndicateOutpost(s) {
  const grp = group();
  grp.add(part(sph(0.32, 14), C(s, 'glass'), 0, 0, 0)); // central glass pod
  addRot(grp, cyl(0.4, 0.4, 0.08, 18), C(s, 'hull'), 0, 0, 0, Math.PI / 2); // structural collar disc
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2; // glowing cyan equator band
    addRot(grp, box(0.012, 0.012, 0.22), GLOW(s), Math.cos(a) * 0.41, Math.sin(a) * 0.41, 0, 0, 0, a + Math.PI / 2);
  }
  for (const x of [-0.6, 0.6]) {
    grp.add(part(box(0.5, 0.02, 0.02), C(s, 'accent'), x * 0.5, 0, 0)); // docking arm
    grp.add(part(sph(0.1, 10), C(s, 'glass'), x, 0, 0)); // mini pod
    navLight(grp, s, x < 0 ? 'port' : 'star', x, 0, 0, 0.035);
  }
  grp.add(part(box(0.02, 0.4, 0.02), C(s, 'hull2'), 0, 0.45, 0)); // mast
  navLight(grp, s, 'top', 0, 0.66, 0, 0.04);
  return grp;
}

// GAS SKIMMER (downward, −Y): a sleek white intake funnel with its wide mouth
// pointing DOWN, ringed by a cyan light-band, feeding a crystalline storage crown.
function makeSyndicateCollector(s) {
  const grp = group();
  grp.add(part(cone(0.62, 0.72, 20), C(s, 'hull'), 0, -0.42, 0)); // intake funnel, mouth down (−Y)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2; // glowing cyan rim around the funnel mouth
    addRot(grp, box(0.025, 0.025, 0.26), GLOW(s), Math.cos(a) * 0.6, -0.78, Math.sin(a) * 0.6, 0, a, 0);
  }
  grp.add(part(cyl(0.15, 0.15, 0.5, 14), C(s, 'glass'), 0, 0, 0)); // glass throat
  grp.add(part(box(0.02, 1.2, 0.02), GLOW(s), 0, -0.1, 0)); // glowing cyan spine line
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2; // crystalline storage crown (glass pods, +Y)
    grp.add(part(sph(0.16, 10), C(s, 'glass'), Math.cos(a) * 0.34, 0.4, Math.sin(a) * 0.34));
  }
  grp.add(part(sph(0.12, 10), C(s, 'hull2'), 0, 0.5, 0)); // crown cap
  navLight(grp, s, 'top', 0, 0.72, 0, 0.05);
  return grp;
}

export const FACTION = {
  id: 'syndicate',
  name: 'Синдикат',
  colors: { hull: 0xe8eef6, hull2: 0xc2cad6, accent: 0x8893a8, dark: 0x283040, glass: 0x44e4ff, gold: 0xcdd8e8 },
  accent: 0x00d4ff,
  glow: 0x46ecff,
  nav: { port: 0xff4060, star: 0x49ffd0, top: 0xffffff },
  lore: 'Безупречный хайтек-флот корпорации: белоснежные корпуса, море стекла и сияющие циановые линии вдоль бортов.',
  flourish,
  roles: { flagship: makeSyndicateFlagship },
  stations: { ring: makeSyndicateRing, outpost: makeSyndicateOutpost, collector: makeSyndicateCollector },
};
