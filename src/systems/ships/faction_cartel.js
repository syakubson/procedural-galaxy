// Faction style-kit: CARTEL (scrap pirates). One of the six kits that
// restyle every role in roles.js. Schema matches ALLIANCE in factions.js.
//
// Identity: rusty browns + scavenged panels, ORANGE engines/markings, and —
// the signature — ASYMMETRY. The `flourish` hook welds a cobbled-together pile
// of mismatched tanks, boxes, a patch plate and an exposed orange pipe onto ONE
// side of the hull at odd, lopsided angles, so no two ships read the same and
// none of them read symmetric. Freighter / tanker / flagship get extra junk.
//
// Helpers only (MeshBasicMaterial, baker-safe): opaque via C/ACC, glow via NAV.
// No `import * as THREE`, no new geometry, no mutation, no bake call.

import { group, C, ACC, GLOW, NAV, box, cyl, sph, cone, addRot, part, engineGlow, runningLights, antenna } from './style.js';

export const FACTION = {
  id: 'cartel',
  name: 'Картель',
  colors: { hull: 0x6b5240, hull2: 0x4d3e2f, accent: 0x8a4a28, dark: 0x231a12, glass: 0xff9440, gold: 0x9c7c3c },
  accent: 0xff6a1e,
  glow: 0xff7a2a,
  nav: { port: 0xff3a2a, star: 0xffae3a, top: 0xffae3a },
  lore: 'Сборный флот картеля из чужого хлама: разномастные корпуса, приваренные баки и ржавые заплаты держатся на честном слове и оранжевом пламени.',

  // Bespoke silhouette: the flagship is a junk MOTHERSHIP, not the shared wedge.
  roles: { flagship: makeCartelFlagship },
  // Bespoke stations: COMPLETELY different geometry per type (not a recolour).
  stations: { ring: makeCartelRing, outpost: makeCartelOutpost, collector: makeCartelCollector },

  // Weld a lopsided pile of scavenged junk onto the STARBOARD (+X) side only.
  flourish(grp, roleId, style) {
    const bulk = { scout: 0.45, fighter: 0.5, interceptor: 0.5, gunship: 0.8,
      corvette: 1.0, freighter: 1.05, tanker: 1.05, liner: 0.95, flagship: 1.7 }[roleId] ?? 0.8;
    const heavy = roleId === 'freighter' || roleId === 'tanker' || roleId === 'flagship';
    const u = 0.02 * (0.6 + bulk);   // junk unit: ~0.021 (scout) … ~0.046 (flagship)
    const sx = 0.035 + 0.05 * bulk;  // starboard offset, grows with hull width

    // 1) scavenged drum tank — mismatched hull2, tilted off-axis, welded low
    addRot(grp, cyl(u * 0.8, u * 0.95, u * 2.6, 7), C(style, 'hull2'),
      sx, u * 0.6, -0.04 - u, Math.PI / 2 + 0.16, 0.1, 0.08);
    // 2) lopsided crate — accent panel, stacked crooked on the same side
    addRot(grp, box(u * 1.7, u * 1.2, u * 1.4), C(style, 'accent'),
      sx * 0.85, u * 1.5, 0.02, 0.12, -0.18, 0.24);
    // 3) crooked patch plate slapped over the hull
    addRot(grp, box(u * 2.4, u * 0.14, u * 2.0), C(style, 'hull2'),
      sx * 0.55, u * 0.9, -0.01, 0.05, 0.0, -0.17);
    // 4) exposed orange pipe (ACC) snaking across the junk
    addRot(grp, cyl(u * 0.2, u * 0.2, u * 3.4, 6), ACC(style),
      sx * 0.7, u * 0.1, 0.05, Math.PI / 2 - 0.12, 0.05, 0.13);

    if (heavy) {
      // 5) a second mismatched drum, jammed on even more off-kilter
      addRot(grp, cyl(u * 1.0, u * 0.8, u * 2.2, 6), C(style, 'accent'),
        sx * 1.05, -u * 0.4, -0.07, Math.PI / 2 + 0.22, -0.1, -0.06);
      // 6) bracket box clamping the pile on
      addRot(grp, box(u * 0.9, u * 1.6, u * 0.5), C(style, 'hull2'),
        sx * 1.1, u * 0.2, -0.07, 0.0, 0.0, 0.3);
      // 7) stray orange spark light at a welded joint
      grp.add(part(sph(u * 0.35, 6), NAV(style, 'star'), sx * 0.9, u * 1.1, 0.04));
    } else {
      // 5) one extra grubby greeble box, low on the same side
      addRot(grp, box(u * 1.1, u * 0.8, u * 0.9), C(style, 'hull2'),
        sx * 0.9, -u * 0.5, -0.06, 0.08, 0.15, -0.1);
    }
  },
};

// ---------------------------------------------------------------------------
// BESPOKE FLAGSHIP — a junk MOTHERSHIP: a central core hull with whole other
// ships, tanks and containers welded onto it (mostly bunched to STARBOARD),
// mismatched engines of varied sizes, exposed orange pipes and patch plates.
// NOSE = +Z, tail = −Z. ~1.0 long, ~0.36 wide. Never symmetric.
// ---------------------------------------------------------------------------
function makeCartelFlagship(s) {
  const grp = group();

  // central core hull — the spine everything is welded onto
  grp.add(part(box(0.16, 0.14, 0.76), C(s, 'hull2'), 0, 0, 0));
  // ragged nose cone bolted to the front, slightly off-axis
  addRot(grp, cone(0.085, 0.2, 8), C(s, 'accent'), 0.012, -0.005, 0.44, Math.PI / 2, 0, 0.06);

  // --- a whole second drum-ship welded to PORT (−X), tilted off-axis ---
  addRot(grp, cyl(0.07, 0.08, 0.6, 9), C(s, 'hull'), -0.115, 0.01, -0.07, Math.PI / 2 + 0.04, 0.05, 0.0);
  addRot(grp, cone(0.07, 0.13, 8), C(s, 'hull'), -0.118, 0.02, 0.26, Math.PI / 2 + 0.04, 0.05, 0.0);

  // --- starboard (+X) container / tank pile — mismatched, bunched, lopsided ---
  grp.add(part(box(0.1, 0.15, 0.18), C(s, 'accent'), 0.135, 0.02, 0.12));
  addRot(grp, box(0.09, 0.12, 0.14), C(s, 'hull'), 0.14, 0.09, -0.06, 0.0, 0.12, 0.18);
  addRot(grp, cyl(0.055, 0.055, 0.24, 8), C(s, 'hull2'), 0.15, -0.06, -0.2, Math.PI / 2 - 0.1, 0.14, 0.0);
  addRot(grp, box(0.08, 0.08, 0.1), C(s, 'accent'), 0.16, 0.07, -0.3, 0.1, -0.2, 0.22);

  // --- crooked patch plates slapped over the core ---
  addRot(grp, box(0.17, 0.012, 0.22), C(s, 'hull'), 0.02, 0.075, 0.1, 0.0, 0.0, -0.08);
  addRot(grp, box(0.12, 0.012, 0.16), C(s, 'hull2'), -0.03, -0.07, -0.18, 0.0, 0.12, 0.1);

  // --- off-center command tower (asymmetry) + bridge glass + antenna ---
  addRot(grp, box(0.1, 0.16, 0.16), C(s, 'dark'), 0.045, 0.14, -0.2, 0.06, 0.0, -0.1);
  grp.add(part(box(0.08, 0.04, 0.05), C(s, 'glass'), 0.05, 0.21, -0.15));
  antenna(grp, s, 0.05, 0.22, -0.25, 0.12);

  // --- exposed orange pipes (thin ACC cyls) running down the flanks ---
  addRot(grp, cyl(0.012, 0.012, 0.58, 6), ACC(s), 0.1, 0.06, -0.04, Math.PI / 2 + 0.03, 0.0, 0.05);
  addRot(grp, cyl(0.01, 0.01, 0.4, 6), ACC(s), -0.09, -0.05, 0.0, Math.PI / 2, 0.08, 0.0);

  // --- hangar mouth on the underside, off to one side ---
  grp.add(part(box(0.12, 0.05, 0.1), C(s, 'glass'), -0.03, -0.08, 0.34));

  // --- welded engine nacelle housings (opaque) ---
  addRot(grp, cyl(0.05, 0.06, 0.08, 8), C(s, 'dark'), -0.05, 0.0, -0.38, Math.PI / 2);
  addRot(grp, cyl(0.035, 0.045, 0.07, 8), C(s, 'dark'), 0.07, 0.02, -0.37, Math.PI / 2);

  // --- mismatched engine cluster: DIFFERENT sizes, deliberately off-balance ---
  engineGlow(grp, s, -0.05, 0.0, -0.43, 0.055);  // big main
  engineGlow(grp, s, 0.07, 0.02, -0.42, 0.038);  // medium
  engineGlow(grp, s, 0.15, -0.04, -0.39, 0.026); // small, far starboard
  engineGlow(grp, s, -0.14, 0.03, -0.4, 0.03);   // medium port (on the welded drum)
  engineGlow(grp, s, 0.0, -0.06, -0.41, 0.02);   // little extra

  // running lights + a stray orange beacon on the junk pile
  runningLights(grp, s, 0.18, 0, 0.2);
  grp.add(part(sph(0.018, 6), NAV(s, 'star'), 0.15, 0.12, -0.22));

  return grp;
}

// ===========================================================================
// BESPOKE STATIONS — completely different geometry per type, not a recolour of
// the shared shapes. Each is a scavenged, asymmetric JUNK build. Builders return
// a raw group(); createStation() bakes it (and keeps userData.spin separate).
// ===========================================================================

// RING (home HUB, biggest) — a captured lumpy ASTEROID with mismatched modules,
// tanks and containers welded onto it, plus a crude welded habitat WHEEL that
// spins (sub-grouped). Pipes + beacons. Nothing about it is symmetric.
function makeCartelRing(s) {
  const grp = group();

  // captured lumpy asteroid core — overlapping low-poly spheres, off-centre
  grp.add(part(sph(0.42, 6), C(s, 'hull2'), 0, 0, 0));
  grp.add(part(sph(0.3, 6), C(s, 'dark'), 0.22, 0.12, -0.1));
  grp.add(part(sph(0.26, 5), C(s, 'hull'), -0.2, -0.14, 0.12));
  grp.add(part(sph(0.2, 5), C(s, 'hull2'), 0.05, -0.26, 0.18));

  // mismatched modules / tanks / containers welded on, bunched to +X, tilted
  addRot(grp, box(0.34, 0.26, 0.26), C(s, 'accent'), 0.48, 0.18, 0.02, 0.12, 0.2, -0.16);
  addRot(grp, cyl(0.12, 0.14, 0.42, 8), C(s, 'hull'), 0.52, -0.12, 0.18, Math.PI / 2 + 0.2, 0.1, 0.0);
  addRot(grp, box(0.22, 0.2, 0.3), C(s, 'hull2'), 0.4, 0.34, -0.22, 0.0, 0.16, 0.22);
  addRot(grp, box(0.18, 0.16, 0.18), C(s, 'accent'), 0.18, 0.42, 0.16, 0.18, 0.0, -0.2);
  // one lone module welded the OTHER way — ragged, never balanced
  addRot(grp, cyl(0.1, 0.1, 0.3, 7), C(s, 'hull2'), -0.46, 0.16, -0.1, Math.PI / 2 - 0.15, 0.0, 0.12);

  // exposed orange pipes snaking across the rock
  addRot(grp, cyl(0.022, 0.022, 0.9, 6), ACC(s), 0.3, 0.2, 0.1, 0.5, 0.3, 0.2);
  addRot(grp, cyl(0.018, 0.018, 0.6, 6), ACC(s), 0.45, -0.1, 0.0, Math.PI / 2 + 0.3, 0.1, 0.4);

  // fixed orange beacon on the asteroid
  grp.add(part(sph(0.06, 6), GLOW(s), 0.0, 0.5, 0.3));

  // crude welded habitat WHEEL (spins about Z) — uneven spokes, mismatched modules
  const wheel = group();
  const ringR = 1.0;
  const spokes = [0.0, 0.9, 1.7, 2.9, 3.7, 5.1]; // deliberately uneven spacing
  const cols = ['accent', 'hull', 'hull2', 'dark'];
  spokes.forEach((a, i) => {
    const cx = Math.cos(a) * ringR;
    const cy = Math.sin(a) * ringR;
    const sz = 0.16 + (i % 3) * 0.06; // mismatched module sizes
    addRot(wheel, box(sz, sz * 0.8, 0.2), C(s, cols[i % cols.length]), cx, cy, 0, 0, 0, a);
    addRot(wheel, box(0.04, ringR, 0.04), C(s, 'accent'), cx * 0.5, cy * 0.5, 0, 0, 0, a + Math.PI / 2);
  });
  // orange beacon riding the wheel
  wheel.add(part(sph(0.06, 6), NAV(s, 'star'), Math.cos(spokes[0]) * ringR, Math.sin(spokes[0]) * ringR, 0.1));
  grp.add(wheel);
  grp.userData.spin = wheel;

  return grp;
}

// OUTPOST (small colony) — a couple of mismatched cargo containers welded
// together crookedly, plus a hanging pod, a crooked docking arm and a beacon.
function makeCartelOutpost(s) {
  const grp = group();

  // two mismatched containers welded together at an angle
  addRot(grp, box(0.5, 0.42, 0.42), C(s, 'hull'), 0, 0, 0, 0.0, 0.0, 0.12);
  addRot(grp, box(0.4, 0.36, 0.5), C(s, 'accent'), 0.34, 0.22, -0.06, 0.15, 0.18, -0.2);
  // a third scavenged pod hanging off one side
  addRot(grp, cyl(0.16, 0.18, 0.4, 8), C(s, 'hull2'), -0.28, -0.2, 0.16, Math.PI / 2 + 0.2, 0.1, 0.0);
  // crooked patch plate over the seam
  addRot(grp, box(0.46, 0.03, 0.34), C(s, 'hull2'), 0.05, 0.26, 0.12, 0.0, 0.1, -0.14);
  // exposed orange pipe + a crooked docking arm
  addRot(grp, cyl(0.02, 0.02, 0.7, 6), ACC(s), 0.1, 0.05, 0.0, Math.PI / 2 + 0.2, 0.0, 0.3);
  grp.add(part(box(0.5, 0.025, 0.025), C(s, 'accent'), 0.42, -0.18, 0.0));
  // off-centre antenna mast + orange beacon
  grp.add(part(box(0.02, 0.45, 0.02), C(s, 'accent'), 0.2, 0.42, -0.1));
  grp.add(part(sph(0.05, 6), NAV(s, 'star'), 0.2, 0.66, -0.1));

  return grp;
}

// COLLECTOR (gas skimmer) — a rusty downward (−Y) intake funnel under a patched
// main tank, with mismatched smaller tanks welded to one side and exposed pipes.
function makeCartelCollector(s) {
  const grp = group();

  // rusty intake funnel, wide mouth pointing DOWN (−Y), slightly ragged
  addRot(grp, cone(0.7, 0.8, 12), C(s, 'accent'), 0.04, -0.46, 0.0, 0.0, 0.0, 0.1);
  // patched throat
  addRot(grp, cyl(0.16, 0.2, 0.4, 10), C(s, 'hull'), 0.0, -0.08, 0.0, 0.0, 0.0, 0.05);
  // off-centre patched main storage tank
  grp.add(part(sph(0.34, 7), C(s, 'hull2'), 0.06, 0.28, 0.0));
  // mismatched smaller tanks welded to ONE side, crooked
  addRot(grp, cyl(0.16, 0.16, 0.42, 8), C(s, 'hull'), 0.42, 0.22, 0.1, Math.PI / 2 + 0.18, 0.0, 0.12);
  addRot(grp, box(0.26, 0.24, 0.24), C(s, 'accent'), 0.34, 0.46, -0.16, 0.14, 0.2, -0.18);
  // crooked patch plate over the main tank
  addRot(grp, box(0.3, 0.025, 0.24), C(s, 'hull2'), -0.1, 0.42, 0.1, 0.0, 0.1, -0.12);
  // exposed orange pipes from funnel up to the tanks
  addRot(grp, cyl(0.022, 0.022, 0.8, 6), ACC(s), 0.2, 0.0, 0.12, 0.35, 0.2, 0.15);
  addRot(grp, cyl(0.018, 0.018, 0.5, 6), ACC(s), -0.18, 0.1, -0.1, Math.PI / 2 + 0.2, 0.0, 0.2);
  // antenna mast + orange beacon up top
  grp.add(part(box(0.025, 0.4, 0.025), C(s, 'accent'), 0.1, 0.62, 0.0));
  grp.add(part(sph(0.05, 6), NAV(s, 'star'), 0.1, 0.84, 0.0));

  return grp;
}
