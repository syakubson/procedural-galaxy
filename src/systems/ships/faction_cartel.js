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

import {
  group, C, ACC, GLOW, NAV, box, cyl, sph, cone, wedge, addRot, part,
  engineGlow, runningLights, antenna, barrel, nozzle, navLight,
  panelZ, panelX, greeble, dish, blister, dome, rcsQuad, radiatorPanel,
} from './style.js';

export const FACTION = {
  id: 'cartel',
  name: 'Картель',
  colors: { hull: 0x6b5240, hull2: 0x4d3e2f, accent: 0x8a4a28, dark: 0x231a12, glass: 0xff9440, gold: 0x9c7c3c },
  accent: 0xff6a1e,
  glow: 0xff7a2a,
  nav: { port: 0xff3a2a, star: 0xffae3a, top: 0xffae3a },
  lore: 'Сборный флот картеля из чужого хлама: разномастные корпуса, приваренные баки и ржавые заплаты держатся на честном слове и оранжевом пламени.',

  // Full bespoke line — every role has its own cobbled, ASYMMETRIC salvage hull
  // (no shared flourish; each ship welds its own lopsided junk).
  roles: {
    scout: makeCartelScout,
    fighter: makeCartelFighter,
    interceptor: makeCartelInterceptor,
    gunship: makeCartelGunship,
    corvette: makeCartelCorvette,
    freighter: makeCartelFreighter,
    tanker: makeCartelTanker,
    liner: makeCartelLiner,
    flagship: makeCartelFlagship,
  },
  // Bespoke stations: COMPLETELY different geometry per type (not a recolour).
  stations: { ring: makeCartelRing, outpost: makeCartelOutpost, collector: makeCartelCollector },
};

// === BESPOKE FLEET — 8 cobbled, ASYMMETRIC salvage hulls =======================
// Rusty browns + ORANGE, welded from mismatched scrap, junk bunched to ONE side,
// exposed orange pipes, off-centre everything. NOT symmetric about X — that
// lopsidedness IS the Cartel signature. Refs: Firefly / Mad-Max-in-space / salvage.

// SCOUT — a small ragged salvage runner: a mismatched cobbled hull, a crooked
// scavenged dish canted to starboard, exposed orange pipes, two mismatched small
// orange engines. NO weapons. Leans STARBOARD (+X). NOSE = +Z.
function makeCartelScout(s) {
  const grp = group();

  // cobbled hull: two DIFFERENT-sized salvaged parts welded end to end
  grp.add(part(box(0.082, 0.062, 0.14), C(s, 'hull'), 0, 0, -0.03)); // big rusty aft box
  addRot(grp, box(0.06, 0.022, 0.12), C(s, 'dark'), 0.006, -0.036, -0.03, 0, 0, 0.03); // crooked keel plate
  addRot(grp, cyl(0.032, 0.036, 0.095, 7), C(s, 'hull2'), -0.01, 0.006, 0.07, Math.PI / 2, 0.06, 0.05); // repurposed fuel-drum nose
  addRot(grp, box(0.072, 0.056, 0.02), C(s, 'dark'), -0.004, 0.003, 0.03, 0, 0, 0.05); // dark weld collar over the seam
  addRot(grp, cone(0.03, 0.05, 7), C(s, 'accent'), -0.012, 0.008, 0.126, Math.PI / 2, 0.0, 0.06); // rusty nose fairing, off-centre
  addRot(grp, box(0.026, 0.024, 0.05), C(s, 'hull2'), -0.03, 0.024, 0.0, 0.1, 0.12, 0.16); // avionics box crooked on the port shoulder

  // off-centre pilot viewport: a crude orange-lit glass box, welded to PORT
  addRot(grp, box(0.04, 0.02, 0.036), C(s, 'dark'), -0.016, 0.034, -0.005, 0, 0, 0.14); // socket
  addRot(grp, box(0.034, 0.016, 0.03), C(s, 'glass'), -0.016, 0.044, -0.005, 0, 0, 0.14); // orange-lit glass

  // HERO sensor: a scavenged parabolic DISH canted hard to starboard
  const mast = group();
  dish(mast, s, 0, 0, 0, 0.052, 0.28);
  mast.position.set(0.03, 0.03, -0.05);
  mast.rotation.set(0.14, 0.06, -0.46);
  grp.add(mast);

  // a SECOND, mismatched salvaged sensor pod low on the starboard bow
  addRot(grp, cyl(0.016, 0.018, 0.05, 7), C(s, 'hull'), 0.036, 0.016, 0.058, Math.PI / 2 - 0.25, 0.24, 0.0); // housing
  grp.add(part(sph(0.014, 6), C(s, 'glass'), 0.052, 0.022, 0.078)); // orange lens staring off-axis

  // starboard junk pile: mismatched scrap bunched + welded crooked to ONE side
  addRot(grp, cyl(0.022, 0.026, 0.07, 7), C(s, 'hull'), 0.04, -0.008, -0.072, Math.PI / 2 + 0.15, 0.1, 0.0); // drum tank
  addRot(grp, box(0.04, 0.03, 0.036), C(s, 'accent'), 0.038, 0.03, -0.05, 0.12, -0.18, 0.24); // crooked crate
  addRot(grp, box(0.05, 0.006, 0.05), C(s, 'hull2'), 0.02, 0.033, -0.015, 0.0, 0.0, -0.16); // patch plate
  addRot(grp, box(0.02, 0.034, 0.014), C(s, 'hull2'), 0.05, 0.006, -0.058, 0, 0, 0.3); // bracket clamping the pile
  addRot(grp, box(0.024, 0.018, 0.02), C(s, 'dark'), 0.043, -0.026, -0.02, 0.08, 0.15, -0.1); // grubby greeble box
  addRot(grp, box(0.018, 0.014, 0.03), C(s, 'accent'), 0.03, 0.036, -0.085, 0.1, 0.0, 0.2); // small stacked box

  // exposed ORANGE pipes (thin ACC cyls) snaking across the hull
  addRot(grp, cyl(0.005, 0.005, 0.19, 6), ACC(s), 0.041, 0.01, -0.02, Math.PI / 2 + 0.03, 0.02, 0.05);
  addRot(grp, cyl(0.004, 0.004, 0.085, 6), ACC(s), 0.032, 0.02, -0.045, Math.PI / 2 - 0.5, 0.35, 0.1);
  addRot(grp, cyl(0.004, 0.004, 0.08, 6), ACC(s), -0.002, 0.032, 0.005, 0.0, 0.0, Math.PI / 2 - 0.25);
  addRot(grp, cyl(0.004, 0.004, 0.06, 6), ACC(s), 0.03, -0.018, -0.088, Math.PI / 2, 0.2, 0.0);

  // MISMATCHED engines: two DIFFERENT sizes, off-balance
  addRot(grp, box(0.058, 0.05, 0.018), C(s, 'dark'), 0.003, -0.004, -0.102, 0, 0, 0.05); // crooked engine deck
  addRot(grp, cyl(0.024, 0.03, 0.05, 8), C(s, 'dark'), -0.018, 0.0, -0.106, Math.PI / 2); // big housing (port)
  engineGlow(grp, s, -0.018, 0.0, -0.13, 0.02); // big orange plume
  addRot(grp, cyl(0.015, 0.019, 0.04, 7), C(s, 'dark'), 0.022, -0.008, -0.104, Math.PI / 2 + 0.08, 0.12, 0.0); // small housing (starboard)
  engineGlow(grp, s, 0.024, -0.01, -0.128, 0.015); // small plume
  engineGlow(grp, s, 0.004, 0.017, -0.116, 0.01); // little extra flicker

  // lights: stray amber beacons on the junk + a crooked antenna + nav lights
  grp.add(part(sph(0.008, 6), NAV(s, 'star'), 0.05, 0.052, -0.048));
  grp.add(part(sph(0.006, 6), NAV(s, 'star'), 0.045, -0.012, -0.072));
  antenna(grp, s, -0.022, 0.032, -0.088, 0.05);
  navLight(grp, s, 'port', -0.03, -0.006, 0.1, 0.006);
  navLight(grp, s, 'star', 0.03, -0.006, 0.1, 0.006);

  return grp;
}

// FIGHTER — a Cartel junk raider: mismatched welded fuselage blocks, a scavenged
// orange-glass cockpit skewed STARBOARD, welded guns of two DIFFERENT sizes past
// the nose, and — the signature — MISMATCHED sides: a salvaged flat wing droops
// off STARBOARD while a welded fuel drum + its own engine hangs where the PORT
// wing should be. One big off-centre orange engine, exposed pipes. NOSE = +Z.
function makeCartelFighter(s) {
  const grp = group();

  // cobbled fuselage: mismatched welded blocks, seams don't line up
  grp.add(part(box(0.075, 0.062, 0.16), C(s, 'hull'), 0, 0, -0.03)); // main body
  grp.add(part(box(0.066, 0.05, 0.02), C(s, 'dark'), 0, 0.002, 0.05)); // mismatched weld collar
  grp.add(part(box(0.06, 0.055, 0.08), C(s, 'hull2'), 0.008, -0.004, 0.09)); // forward block, off-centre +X
  addRot(grp, box(0.046, 0.04, 0.05), C(s, 'dark'), -0.006, -0.006, 0.135, 0, 0.12, -0.06); // blunt ragged nose
  addRot(grp, cyl(0.026, 0.03, 0.1, 6), C(s, 'hull'), 0.022, -0.042, -0.03, Math.PI / 2 - 0.05, 0, -0.04); // belly fuel drum

  // scavenged cockpit: an orange-glass canopy skewed off-centre (+X)
  grp.add(part(box(0.032, 0.028, 0.052), C(s, 'dark'), 0.014, 0.03, 0.03)); // dark recess, starboard
  addRot(grp, box(0.044, 0.02, 0.036), C(s, 'glass'), 0.014, 0.046, 0.052, -0.4, 0.1, 0); // orange windscreen
  addRot(grp, box(0.05, 0.009, 0.026), C(s, 'dark'), 0.014, 0.062, 0.038, -0.5, 0.1, 0); // crooked brow ridge

  // welded guns of MISMATCHED size, reaching past the ragged nose
  grp.add(part(box(0.028, 0.028, 0.07), C(s, 'dark'), 0.032, 0.006, 0.04)); // big salvaged housing
  barrel(grp, s, 0.032, 0.006, 0.075, 0.009, 0.21); // fat barrel past the beak
  grp.add(part(box(0.018, 0.018, 0.022), ACC(s), 0.032, 0.006, 0.178)); // orange muzzle tip
  grp.add(part(sph(0.009, 6), GLOW(s), 0.032, 0.006, 0.188)); // hot orange charge pip
  grp.add(part(box(0.016, 0.016, 0.04), C(s, 'dark'), -0.026, -0.018, 0.05)); // small housing, low port
  barrel(grp, s, -0.026, -0.018, 0.08, 0.005, 0.15); // thin shorter barrel
  grp.add(part(box(0.011, 0.011, 0.016), ACC(s), -0.026, -0.018, 0.152)); // orange tip

  // SIGNATURE ASYMMETRY: a real wing to STARBOARD, a welded drum to PORT
  const wing = group();
  addRot(wing, wedge(0.085, 0.013, 0.12), C(s, 'hull'), 0.07, 0, 0, 0, -Math.PI / 2, 0); // scavenged plate, sharp tip +X
  wing.add(part(box(0.11, 0.004, 0.016), ACC(s), 0.058, 0.009, 0)); // exposed orange edge strip
  addRot(wing, box(0.034, 0.007, 0.032), C(s, 'hull2'), 0.035, 0.008, 0.02, 0, 0.2, 0.12); // crooked mismatched patch
  wing.add(part(box(0.06, 0.006, 0.014), C(s, 'dark'), 0.06, -0.007, -0.024)); // dark stiffener rib
  addRot(wing, box(0.02, 0.03, 0.04), C(s, 'dark'), 0.024, 0.006, -0.008, 0, 0.3, 0.1); // welded hardpoint pod
  navLight(wing, s, 'star', 0.13, 0, 0, 0.009); // amber wingtip beacon
  wing.position.set(0.036, -0.004, -0.02);
  wing.rotation.z = -0.13;
  wing.rotation.y = 0.14;
  grp.add(wing);
  addRot(grp, cyl(0.032, 0.035, 0.12, 7), C(s, 'hull2'), -0.064, -0.006, -0.02, Math.PI / 2 + 0.06, 0, 0.05); // port fat drum
  addRot(grp, cyl(0.036, 0.036, 0.012, 7), C(s, 'dark'), -0.066, -0.006, 0.037, Math.PI / 2, 0, 0.05); // end band
  addRot(grp, box(0.032, 0.05, 0.012), C(s, 'dark'), -0.042, 0, -0.01, 0, 0, 0.2); // clamp bracket
  nozzle(grp, s, -0.064, -0.006, -0.09, 0.021, 0.036); // the drum's own little engine
  navLight(grp, s, 'port', -0.082, 0.026, 0.0, 0.008); // red beacon on the drum

  // ONE big ORANGE engine, shoved off-centre to starboard
  grp.add(part(box(0.06, 0.05, 0.03), C(s, 'dark'), 0.008, -0.004, -0.1)); // engine mount housing
  nozzle(grp, s, 0.016, -0.004, -0.13, 0.034, 0.05); // big orange bell
  engineGlow(grp, s, 0.016, -0.004, -0.15, 0.03); // extra plume

  // exposed orange pipes snaking crookedly
  addRot(grp, cyl(0.005, 0.005, 0.2, 6), ACC(s), 0.032, 0.028, -0.03, Math.PI / 2 + 0.05, 0, 0.04);
  addRot(grp, cyl(0.004, 0.004, 0.14, 6), ACC(s), -0.03, -0.03, -0.02, Math.PI / 2 - 0.03, 0.1, 0);
  addRot(grp, cyl(0.004, 0.004, 0.06, 6), ACC(s), 0.0, 0.02, -0.09, 0, 0, Math.PI / 2 - 0.2);

  // crooked patch plates + ragged greebles + bent antenna + orange beacons
  addRot(grp, box(0.05, 0.006, 0.06), C(s, 'hull'), 0.006, 0.034, -0.05, 0, 0.0, -0.14);
  addRot(grp, box(0.038, 0.006, 0.05), C(s, 'hull2'), -0.02, 0.028, 0.02, 0.0, 0.15, 0.12);
  addRot(grp, box(0.055, 0.05, 0.006), C(s, 'dark'), 0.04, 0.0, -0.02, 0, 0.2, 0); // side armour plate
  greeble(grp, s, 'dark', -0.006, -0.03, 0.11, 0.03, 0.016, 0.03); // chin targeting sensor
  grp.add(part(sph(0.006, 6), NAV(s, 'star'), -0.006, -0.03, 0.126)); // orange sensor eye
  greeble(grp, s, 'accent', 0.02, 0.03, -0.08, 0.018, 0.012, 0.024); // dorsal avionics box
  addRot(grp, box(0.03, 0.024, 0.03), C(s, 'accent'), -0.022, 0.036, -0.02, 0.1, 0.2, -0.15); // welded crate, port dorsal
  addRot(grp, cyl(0.004, 0.004, 0.07, 6), ACC(s), 0.036, -0.01, 0.02, Math.PI / 2 + 0.1, 0, 0.06); // extra pipe by the big gun
  grp.add(part(box(0.026, 0.02, 0.024), C(s, 'hull2'), 0.01, -0.04, 0.02)); // welded junk box under belly
  addRot(grp, box(0.03, 0.006, 0.036), C(s, 'dark'), 0.03, 0.03, -0.02, 0, 0.15, 0.1); // extra patch, starboard dorsal
  grp.add(part(sph(0.006, 6), NAV(s, 'star'), 0.05, 0.02, -0.09)); // stray orange spark
  antenna(grp, s, -0.026, 0.048, -0.07, 0.07); // bent antenna mast port

  return grp;
}

// INTERCEPTOR — the Cartel's cobbled junk HOT-ROD: a slim scavenged blade-hull
// carrying ONE absurdly OVERSIZED salvaged orange engine slung onto STARBOARD
// (way too big, canted like it was welded angry) with a smaller mismatched port
// engine — a lopsided twin. Two DIFFERENT welded guns, exposed pipes, a crooked
// cockpit. Mass leans hard STARBOARD → reckless & unbalanced. NOSE = +Z.
function makeCartelInterceptor(s) {
  const grp = group();

  grp.add(part(wedge(0.05, 0.03, 0.22), C(s, 'hull'), 0, 0, 0.0)); // slim rusty wedge
  grp.add(part(wedge(0.034, 0.014, 0.19), C(s, 'dark'), 0, -0.019, 0.0)); // dark belly keel
  addRot(grp, box(0.03, 0.012, 0.14), C(s, 'hull2'), -0.009, 0.02, -0.01, 0.0, 0.0, -0.14); // crooked dorsal patch, port
  grp.add(part(box(0.04, 0.03, 0.065), C(s, 'hull2'), 0.006, -0.003, 0.09)); // grafted-on nose block
  addRot(grp, cone(0.013, 0.045, 7), C(s, 'accent'), 0.004, -0.005, 0.13, Math.PI / 2, 0.0, 0.09); // crooked scrap nose spike

  addRot(grp, box(0.028, 0.02, 0.042), C(s, 'dark'), -0.012, 0.022, 0.045, 0.0, 0.0, -0.1); // brow housing, port
  addRot(grp, box(0.02, 0.011, 0.034), C(s, 'glass'), -0.012, 0.031, 0.05, 0.0, 0.0, -0.1); // orange visor slit

  // welded-on guns: TWO MISMATCHED cannons, not a mirrored pair
  grp.add(part(box(0.022, 0.02, 0.048), C(s, 'dark'), -0.03, -0.004, 0.02)); // scrap clamp mount
  barrel(grp, s, -0.03, -0.002, 0.045, 0.006, 0.15); // long barrel past the prow
  grp.add(part(box(0.012, 0.012, 0.026), ACC(s), -0.03, -0.002, 0.135)); // orange muzzle tip
  grp.add(part(box(0.011, 0.011, 0.012), GLOW(s), -0.03, -0.002, 0.15)); // glowing charge
  addRot(grp, box(0.03, 0.026, 0.048), C(s, 'hull2'), 0.024, 0.016, 0.038, 0.06, -0.12, 0.16); // stubby twin block, starboard
  for (const dx of [-0.006, 0.006]) barrel(grp, s, 0.024 + dx, 0.018, 0.065, 0.004, 0.08); // short twin barrels
  grp.add(part(box(0.02, 0.008, 0.014), ACC(s), 0.024, 0.02, 0.11)); // orange twin muzzle bar

  // exposed orange feed-pipes
  addRot(grp, cyl(0.006, 0.006, 0.2, 6), ACC(s), 0.035, 0.008, -0.02, Math.PI / 2 - 0.1, 0.05, 0.12);
  addRot(grp, cyl(0.005, 0.005, 0.12, 6), ACC(s), -0.004, 0.028, -0.02, Math.PI / 2 + 0.06, 0.0, -0.18);
  addRot(grp, cyl(0.005, 0.005, 0.1, 6), ACC(s), -0.024, 0.004, -0.05, Math.PI / 2, 0.14, 0.0);

  // THE HERO — an ABSURDLY OVERSIZED salvaged engine slung onto STARBOARD (+X)
  const ex = 0.062;
  grp.add(part(box(0.032, 0.022, 0.055), C(s, 'hull2'), ex - 0.032, -0.006, -0.03)); // scrap pylon bracket
  addRot(grp, cyl(0.05, 0.046, 0.15, 8), C(s, 'hull2'), ex, -0.008, -0.04, Math.PI / 2 - 0.06, 0.0, 0.07); // huge housing, canted
  addRot(grp, cyl(0.055, 0.055, 0.016, 8), C(s, 'dark'), ex + 0.004, -0.006, 0.03, Math.PI / 2 - 0.06, 0.0, 0.07); // armour collar
  addRot(grp, cyl(0.05, 0.042, 0.02, 8), C(s, 'accent'), ex + 0.002, -0.007, 0.018, Math.PI / 2 - 0.06, 0.0, 0.07); // rusty intake ring
  addRot(grp, cyl(0.048, 0.048, 0.01, 8), ACC(s), ex - 0.003, -0.01, -0.11, Math.PI / 2 - 0.06, 0.0, 0.07); // hot orange mouth band
  nozzle(grp, s, ex - 0.004, -0.01, -0.12, 0.046, 0.055); // OVERSIZED bell, vents starboard

  // smaller MISMATCHED port engine + a third stray thruster
  addRot(grp, cyl(0.026, 0.023, 0.09, 7), C(s, 'hull'), -0.022, 0.0, -0.07, Math.PI / 2, 0.0, 0.0); // small housing
  nozzle(grp, s, -0.022, 0.0, -0.12, 0.024, 0.045); // small bell + glow
  addRot(grp, cyl(0.016, 0.014, 0.05, 6), C(s, 'dark'), 0.006, -0.02, -0.075, Math.PI / 2); // little scrap thruster
  engineGlow(grp, s, 0.006, -0.02, -0.105, 0.015);

  // scavenged junk welded to STARBOARD
  addRot(grp, cyl(0.016, 0.018, 0.05, 7), C(s, 'hull'), 0.038, 0.02, 0.02, Math.PI / 2 + 0.2, 0.1, 0.0); // welded drum
  addRot(grp, box(0.028, 0.024, 0.024), C(s, 'accent'), 0.03, 0.028, -0.01, 0.12, -0.2, 0.24); // crooked crate
  addRot(grp, box(0.05, 0.008, 0.04), C(s, 'hull2'), 0.008, 0.016, 0.02, 0.0, 0.0, -0.12); // patch plate
  addRot(grp, box(0.022, 0.016, 0.02), C(s, 'hull2'), -0.024, -0.014, -0.03, 0.08, 0.15, -0.1); // grubby port greeble

  antenna(grp, s, -0.018, 0.03, -0.06, 0.045);
  grp.add(part(sph(0.009, 6), GLOW(s), 0.024, 0.03, -0.02)); // orange spark at a bad weld
  panelZ(grp, s, 0.012, 0.016, 0.0, 0.1);
  panelZ(grp, s, -0.02, 0.014, -0.02, 0.07);
  rcsQuad(grp, s, -0.02, 0.016, 0.08, 0.006);
  navLight(grp, s, 'port', -0.045, -0.002, -0.01, 0.007);
  navLight(grp, s, 'star', 0.06, 0.028, -0.05, 0.007);

  return grp;
}

// A crude SCAVENGED cannon of any calibre, welded on at an ODD angle. Built in a
// sub-group so the whole gun cants as one weld. `hot` adds an additive bloom so
// the battery looks mismatched, not a matched set.
function carJunkGun(grp, s, x, y, z, r, len, rx = 0, ry = 0, rz = 0, hot = false) {
  const gun = group();
  gun.add(part(box(r * 3.4, r * 3.0, r * 2.2), C(s, 'dark'), 0, 0, -len * 0.28)); // rough breech clamp
  gun.add(part(box(r * 2.4, r * 2.4, r * 0.8), C(s, 'hull2'), 0, 0, -len * 0.02)); // welded collar
  addRot(gun, cyl(r, r * 0.86, len, 6), C(s, 'dark'), 0, 0, len * 0.5, Math.PI / 2); // barrel tube
  addRot(gun, cyl(r * 1.5, r * 1.15, r * 1.4, 6), ACC(s), 0, 0, len, Math.PI / 2); // orange muzzle brake
  if (hot) gun.add(part(sph(r * 0.82, 6), GLOW(s), 0, 0, len + r * 0.7)); // charged bore glow
  gun.position.set(x, y, z);
  gun.rotation.set(rx, ry, rz);
  grp.add(gun);
}

// GUNSHIP — a heavy junk ATTACK BARGE: a thick COBBLED hull of mismatched welded
// boxes (fatter to PORT, a raised patch deck to starboard), bristling with
// SCAVENGED guns of mismatched calibres welded lopsided, a crude off-centre
// turret, bolted patch plates, exposed pipes and a CLUSTER of mismatched-size
// orange engines. NOSE = +Z. ASYMMETRIC about X.
function makeCartelGunship(s) {
  const grp = group();

  // Cobbled hull: mismatched welded boxes, off-centre
  grp.add(part(box(0.185, 0.155, 0.11), C(s, 'hull2'), 0.008, 0.0, -0.15)); // aft engine block (starboard-shifted)
  grp.add(part(box(0.192, 0.162, 0.02), C(s, 'dark'), 0.008, 0.0, -0.088)); // weld collar
  grp.add(part(box(0.2, 0.17, 0.16), C(s, 'hull'), 0.0, 0.0, 0.0)); // mid core (biggest)
  grp.add(part(box(0.17, 0.15, 0.018), C(s, 'dark'), 0.0, 0.0, 0.083)); // weld collar
  grp.add(part(box(0.15, 0.13, 0.1), C(s, 'hull'), -0.012, -0.008, 0.135)); // forward hull (port)
  grp.add(part(box(0.12, 0.1, 0.05), C(s, 'dark'), 0.006, -0.016, 0.198)); // blunt ram plate
  addRot(grp, box(0.07, 0.115, 0.14), C(s, 'hull2'), -0.115, -0.01, 0.02, 0.06, 0.0, -0.12); // fat port bulge (kills symmetry)
  addRot(grp, box(0.1, 0.05, 0.18), C(s, 'hull'), 0.05, 0.092, -0.01, 0.0, 0.0, -0.05); // raised starboard patch deck
  addRot(grp, cone(0.06, 0.14, 7), C(s, 'accent'), 0.012, -0.014, 0.23, Math.PI / 2, 0.0, 0.06); // ragged ram cone off-axis
  addRot(grp, cyl(0.045, 0.052, 0.16, 7), C(s, 'hull2'), 0.12, -0.02, -0.05, Math.PI / 2 + 0.16, 0.1, 0.0); // starboard drum tank
  addRot(grp, box(0.08, 0.07, 0.075), C(s, 'accent'), 0.07, 0.075, 0.11, 0.1, -0.16, 0.2); // lopsided crate

  // Bolted-on crooked patch armour plates
  addRot(grp, box(0.16, 0.016, 0.15), C(s, 'hull2'), -0.02, 0.088, 0.03, 0.0, 0.0, 0.12);
  addRot(grp, box(0.014, 0.09, 0.12), C(s, 'accent'), -0.108, 0.012, -0.02, 0.0, 0.0, 0.18);
  addRot(grp, box(0.09, 0.014, 0.1), C(s, 'hull'), 0.062, 0.078, -0.11, 0.0, 0.14, -0.1);
  addRot(grp, box(0.13, 0.014, 0.12), C(s, 'hull2'), 0.02, -0.086, -0.01, 0.0, 0.0, -0.08);
  panelZ(grp, s, 0.092, 0.06, -0.03, 0.2);
  panelZ(grp, s, -0.09, 0.05, 0.02, 0.16);
  panelX(grp, s, 0.0, 0.09, -0.04, 0.14);

  // Exposed ORANGE pipes
  addRot(grp, cyl(0.011, 0.011, 0.34, 6), ACC(s), 0.1, 0.05, -0.03, Math.PI / 2 + 0.05, 0.0, 0.06);
  addRot(grp, cyl(0.009, 0.009, 0.24, 6), ACC(s), -0.098, -0.03, 0.03, Math.PI / 2, 0.09, 0.0);
  addRot(grp, cyl(0.008, 0.008, 0.15, 6), ACC(s), 0.02, 0.104, -0.07, 0.0, 0.0, Math.PI / 2 + 0.2);

  // SCAVENGED guns of mismatched calibres, welded lopsided
  carJunkGun(grp, s, 0.08, 0.03, 0.13, 0.021, 0.22, 0.12, 0.12, 0.0, true); // BIG main, starboard
  carJunkGun(grp, s, 0.05, -0.048, 0.15, 0.014, 0.16, -0.08, 0.05); // medium, low starboard
  carJunkGun(grp, s, -0.055, 0.05, 0.12, 0.011, 0.16, 0.34, -0.12, 0.0, true); // steep dorsal gun, port
  carJunkGun(grp, s, -0.082, -0.028, 0.11, 0.009, 0.1, -0.04, -0.24); // stubby, low port
  carJunkGun(grp, s, 0.028, 0.108, 0.03, 0.012, 0.15, 0.28, 0.05); // gun jutting UP off the deck
  carJunkGun(grp, s, 0.114, -0.01, 0.0, 0.011, 0.11, 0.05, 0.62); // pointing OUT to starboard
  carJunkGun(grp, s, -0.1, 0.02, -0.02, 0.008, 0.08, 0.1, -0.66); // small stub pointing OUT to port

  // Crude salvaged TURRET, welded off-centre on the starboard deck
  {
    const tx = 0.045, tz = -0.03, by = 0.118;
    grp.add(part(cyl(0.05, 0.056, 0.016, 8), C(s, 'dark'), tx, by, tz));
    grp.add(part(cyl(0.04, 0.043, 0.036, 7), C(s, 'hull2'), tx, by + 0.026, tz));
    const gy = by + 0.05;
    addRot(grp, box(0.076, 0.036, 0.05), C(s, 'dark'), tx, gy, tz + 0.01, 0.0, 0.12, 0.05);
    grp.add(part(box(0.032, 0.016, 0.012), C(s, 'glass'), tx, gy + 0.004, tz - 0.03));
    carJunkGun(grp, s, tx - 0.016, gy + 0.006, tz + 0.032, 0.01, 0.11, 0.14, 0.12, 0.0, true);
    carJunkGun(grp, s, tx + 0.02, gy + 0.001, tz + 0.032, 0.009, 0.08, 0.1, 0.16);
  }

  // Cluster of MISMATCHED-SIZE orange engines
  grp.add(part(box(0.2, 0.14, 0.03), C(s, 'dark'), 0.005, 0.0, -0.207));
  addRot(grp, cyl(0.036, 0.042, 0.07, 7), C(s, 'dark'), -0.115, 0.035, -0.185, Math.PI / 2);
  nozzle(grp, s, -0.056, -0.02, -0.216, 0.05, 0.06); // BIG main, port-low
  nozzle(grp, s, 0.062, 0.012, -0.212, 0.034, 0.05); // medium, starboard
  nozzle(grp, s, 0.112, -0.03, -0.198, 0.022, 0.04); // small, far starboard
  engineGlow(grp, s, -0.115, 0.035, -0.222, 0.03);
  engineGlow(grp, s, 0.018, 0.05, -0.206, 0.02);
  engineGlow(grp, s, -0.02, -0.062, -0.209, 0.017);

  // Scavenged sensor + lopsided antenna + orange beacons
  dish(grp, s, -0.055, 0.098, -0.135, 0.028, 0.5);
  antenna(grp, s, 0.06, 0.115, -0.16, 0.075);
  grp.add(part(sph(0.014, 6), NAV(s, 'star'), 0.075, 0.128, -0.05));
  grp.add(part(sph(0.012, 6), NAV(s, 'star'), -0.108, 0.03, 0.0));

  navLight(grp, s, 'star', 0.1, 0.0, 0.14, 0.011);
  navLight(grp, s, 'port', -0.1, 0.0, 0.14, 0.011);
  runningLights(grp, s, 0.104, -0.02, -0.14);
  rcsQuad(grp, s, 0.09, 0.05, 0.12, 0.01);
  rcsQuad(grp, s, -0.096, -0.05, -0.14, 0.01);

  return grp;
}

// A mismatched SALVAGED turret: a welded base collar, a rusty blister body and a
// stubby scavenged gun that overhangs forward. `cant` aims the gun off-axis so no
// two turrets read aligned — the Cartel never bolts anything on straight.
function carJunkTurret(s, grp, x, y, z, r, cant = 0) {
  grp.add(part(cyl(r * 1.35, r * 1.6, r * 0.5, 6), C(s, 'dark'), x, y, z)); // welded base collar
  grp.add(part(sph(r, 6), C(s, 'hull2'), x, y + r * 0.4, z)); // rusty blister body
  const gy = y + r * 0.4;
  const bl = r * 2.7;
  const cx = x - Math.sin(cant) * (r + bl / 2);
  const cz = z + Math.cos(cant) * (r + bl / 2);
  addRot(grp, cyl(r * 0.3, r * 0.22, bl, 6), C(s, 'dark'), cx, gy, cz, Math.PI / 2, 0, cant);
  grp.add(part(box(r * 0.34, r * 0.34, r * 0.11), ACC(s),
    x - Math.sin(cant) * (r + bl), gy, z + Math.cos(cant) * (r + bl))); // orange muzzle tip
}

// CORVETTE — a Cartel salvage warship: a cobbled elongated hull welded from
// clearly MISMATCHED modules (a boxy stern gun-block, a scavenged drum-tank hull
// segment, a wide cargo box, a crooked forward module, a blunt ram prow), each a
// different size/shape/colour with visible weld collars. An OFF-CENTRE bridge on
// the PORT shoulder, mismatched turrets, a lopsided orange engine cluster, exposed
// pipes, junk bunched to STARBOARD. NOSE = +Z. NEVER symmetric about X.
function makeCartelCorvette(s) {
  const grp = group();

  grp.add(part(box(0.135, 0.128, 0.12), C(s, 'dark'), 0.006, -0.01, -0.195)); // stern engine/gun block (low)
  grp.add(part(box(0.14, 0.118, 0.016), C(s, 'hull2'), 0.004, -0.004, -0.128)); // weld-collar flange
  addRot(grp, cyl(0.078, 0.082, 0.15, 8), C(s, 'hull2'), -0.008, -0.014, -0.045, Math.PI / 2, 0, 0.05); // drum hull segment
  grp.add(part(box(0.03, 0.09, 0.018), C(s, 'dark'), 0.0, -0.014, -0.045)); // strap band over the drum
  grp.add(part(box(0.128, 0.108, 0.014), C(s, 'hull'), 0.0, -0.002, 0.035)); // weld collar
  grp.add(part(box(0.12, 0.1, 0.135), C(s, 'hull'), -0.009, 0.008, 0.092)); // main cargo module (high, port)
  addRot(grp, box(0.058, 0.05, 0.11), C(s, 'accent'), 0.03, 0.078, 0.04, 0.0, 0.05, -0.09); // raised welded container, starboard
  grp.add(part(box(0.09, 0.084, 0.012), C(s, 'dark'), -0.006, 0.004, 0.162)); // weld collar
  addRot(grp, box(0.076, 0.066, 0.1), C(s, 'accent'), 0.016, -0.016, 0.185, 0, 0.08, -0.06); // forward module (accent, starboard)
  addRot(grp, cone(0.046, 0.11, 7), C(s, 'hull2'), 0.02, -0.018, 0.255, Math.PI / 2, 0, 0.05); // salvaged ram prow off-centre
  addRot(grp, box(0.055, 0.017, 0.065), C(s, 'dark'), 0.014, -0.038, 0.2, 0.12, 0, 0); // chin ram plate

  // OFF-CENTRE command bridge — bolted onto the PORT (-X) shoulder, canted
  addRot(grp, box(0.072, 0.06, 0.092), C(s, 'hull2'), -0.05, 0.084, -0.03, 0.0, 0.14, 0.07);
  addRot(grp, box(0.06, 0.036, 0.016), C(s, 'glass'), -0.062, 0.094, 0.014, 0.0, 0.14, 0.07); // orange windshield
  addRot(grp, box(0.062, 0.008, 0.008), GLOW(s), -0.062, 0.073, 0.02, 0.0, 0.14, 0.07); // orange glow strip
  addRot(grp, box(0.05, 0.03, 0.03), C(s, 'dark'), -0.048, 0.12, -0.06, 0.0, 0.14, 0.05); // crooked crown
  antenna(grp, s, -0.062, 0.134, -0.06, 0.075);

  // MISMATCHED salvaged turrets
  carJunkTurret(s, grp, 0.038, 0.062, -0.185, 0.024, 0.14); // BIG, starboard-aft
  carJunkTurret(s, grp, -0.054, 0.052, 0.06, 0.013, -0.12); // small, port-mid
  carJunkTurret(s, grp, 0.03, 0.066, 0.12, 0.017, 0.05); // medium, starboard-fore
  addRot(grp, cyl(0.008, 0.006, 0.075, 6), C(s, 'dark'), -0.03, -0.006, 0.24, Math.PI / 2, 0, 0); // fixed forward battery, port
  grp.add(part(box(0.011, 0.011, 0.022), ACC(s), -0.03, -0.006, 0.28)); // orange muzzle

  // STARBOARD welded JUNK pile
  addRot(grp, cyl(0.036, 0.042, 0.16, 7), C(s, 'accent'), 0.088, -0.008, 0.02, Math.PI / 2 + 0.14, 0.1, 0.0);
  addRot(grp, box(0.05, 0.05, 0.06), C(s, 'hull2'), 0.086, 0.06, -0.07, 0.1, -0.18, 0.22);
  addRot(grp, box(0.04, 0.03, 0.045), C(s, 'accent'), 0.09, 0.05, 0.11, 0.08, 0.2, -0.16);
  addRot(grp, box(0.03, 0.03, 0.036), C(s, 'hull'), 0.092, 0.088, -0.02, 0.14, -0.1, 0.18);
  greeble(grp, s, 'dark', 0.082, -0.05, -0.12, 0.03, 0.03, 0.04);
  antenna(grp, s, 0.084, 0.088, 0.0, 0.05);
  dish(grp, s, -0.036, 0.05, -0.155, 0.026, 0.34);

  // CROOKED patch plates + rivet strips (different on each side)
  addRot(grp, box(0.09, 0.01, 0.1), C(s, 'hull'), -0.01, 0.056, -0.085, 0.0, 0.0, -0.13);
  addRot(grp, box(0.06, 0.01, 0.07), C(s, 'accent'), -0.03, 0.062, 0.13, 0.0, 0.16, 0.12);
  addRot(grp, box(0.008, 0.058, 0.085), C(s, 'hull2'), 0.062, 0.004, 0.09, 0.0, 0.12, 0.0);
  greeble(grp, s, 'hull2', -0.06, 0.0, 0.09, 0.012, 0.052, 0.1);
  for (const z of [-0.06, -0.02, 0.02, 0.06]) greeble(grp, s, 'dark', 0.058, 0.03, z, 0.01, 0.01, 0.012);
  for (const z of [-0.03, 0.01, 0.05, 0.1, 0.14]) greeble(grp, s, 'dark', -0.06, 0.028, z, 0.009, 0.009, 0.011);
  greeble(grp, s, 'dark', -0.03, 0.05, -0.12, 0.028, 0.014, 0.03);
  greeble(grp, s, 'hull', 0.036, 0.052, -0.09, 0.022, 0.016, 0.026);

  // EXPOSED orange pipes (different on each side) + radiator + belly plumbing
  addRot(grp, cyl(0.013, 0.013, 0.44, 6), ACC(s), 0.066, 0.038, -0.02, Math.PI / 2 + 0.04, 0.0, 0.04);
  addRot(grp, cyl(0.011, 0.011, 0.34, 6), ACC(s), -0.062, -0.028, 0.03, Math.PI / 2, 0.06, 0.0);
  addRot(grp, cyl(0.008, 0.008, 0.16, 6), ACC(s), 0.052, -0.046, -0.1, Math.PI / 2 - 0.2, 0.0, 0.15);
  addRot(grp, cyl(0.007, 0.007, 0.12, 6), ACC(s), -0.05, 0.05, 0.14, Math.PI / 2 + 0.1, 0.0, -0.1);
  radiatorPanel(grp, s, -0.078, 0.02, -0.11, 0.03, 0.13);
  addRot(grp, cyl(0.014, 0.016, 0.09, 6), C(s, 'hull2'), -0.028, -0.062, -0.03, Math.PI / 2, 0.0, 0.1);
  addRot(grp, cyl(0.012, 0.012, 0.24, 6), ACC(s), 0.02, -0.058, -0.12, Math.PI / 2 - 0.06, 0.0, -0.08);
  greeble(grp, s, 'dark', 0.03, -0.058, 0.05, 0.026, 0.02, 0.05);
  greeble(grp, s, 'dark', -0.038, -0.05, 0.11, 0.022, 0.018, 0.04);
  panelZ(grp, s, 0.03, 0.055, 0.02, 0.2);
  panelZ(grp, s, -0.035, 0.05, -0.02, 0.16);

  // MISMATCHED engine cluster
  grp.add(part(box(0.13, 0.1, 0.028), C(s, 'dark'), 0.004, -0.006, -0.27));
  nozzle(grp, s, -0.042, 0.006, -0.288, 0.031, 0.05); // big main, port
  nozzle(grp, s, 0.038, -0.026, -0.282, 0.022, 0.042); // medium, starboard-low
  nozzle(grp, s, 0.012, 0.05, -0.28, 0.016, 0.032); // small, upper
  engineGlow(grp, s, -0.078, -0.028, -0.272, 0.019);
  engineGlow(grp, s, 0.07, 0.036, -0.268, 0.014);

  navLight(grp, s, 'port', -0.06, 0.006, 0.12, 0.011);
  navLight(grp, s, 'star', 0.062, -0.01, 0.16, 0.011);
  grp.add(part(sph(0.012, 6), NAV(s, 'star'), 0.086, 0.09, -0.05));
  grp.add(part(sph(0.01, 6), GLOW(s), -0.05, 0.05, 0.045));
  rcsQuad(grp, s, -0.045, 0.02, 0.155, 0.007);

  return grp;
}

// FREIGHTER — the definitive Cartel junk hauler: a patched keel spine with
// MISMATCHED containers + salvaged drum tanks of DIFFERENT sizes welded on at
// crooked angles, bunched lopsidedly to STARBOARD while port stays near-bare,
// crooked patch plates, exposed ORANGE pipes everywhere, a small off-centre grubby
// cockpit tucked on the CLEAR (port) side, and a CLUSTER of mismatched engines.
// NOSE = +Z. ASYMMETRIC about X.
function makeCartelFreighter(s) {
  const grp = group();

  // A. COBBLED KEEL SPINE
  grp.add(part(box(0.09, 0.10, 0.40), C(s, 'hull2'), 0, 0, -0.05));
  addRot(grp, box(0.075, 0.085, 0.17), C(s, 'dark'), 0.008, -0.006, 0.16, 0, 0.03, 0.02); // patched forward keel
  for (const [z, w] of [[0.10, 0.115], [-0.02, 0.12], [-0.12, 0.11], [-0.20, 0.10]]) {
    grp.add(part(box(w, 0.115, 0.014), C(s, 'accent'), 0, 0, z)); // rusty frame collars (uneven z)
  }

  // B. RAGGED BLUNT NOSE
  grp.add(part(box(0.082, 0.078, 0.07), C(s, 'hull'), 0.004, -0.004, 0.235));
  addRot(grp, cone(0.05, 0.10, 7), C(s, 'accent'), 0.018, 0.004, 0.285, Math.PI / 2, 0, 0.12); // crooked bolted snout
  greeble(grp, s, 'dark', -0.02, -0.028, 0.245, 0.03, 0.02, 0.05);

  // C. THE JUNK LOAD — mismatched containers + drum tanks bunched to STARBOARD
  addRot(grp, box(0.10, 0.11, 0.15), C(s, 'hull'), 0.10, 0.035, 0.05, 0.04, 0.10, 0.14);
  addRot(grp, box(0.078, 0.088, 0.11), C(s, 'gold'), 0.115, 0.115, -0.06, 0.14, -0.16, 0.22);
  addRot(grp, cyl(0.058, 0.062, 0.23, 8), C(s, 'hull2'), 0.11, -0.05, -0.03, Math.PI / 2 - 0.09, 0.12, 0.0);
  addRot(grp, cyl(0.042, 0.046, 0.15, 7), C(s, 'accent'), 0.135, 0.055, -0.185, Math.PI / 2 + 0.12, -0.14, 0.0);
  addRot(grp, box(0.07, 0.06, 0.08, 1), C(s, 'hull2'), 0.155, -0.02, 0.12, 0.1, -0.22, 0.18);
  addRot(grp, box(0.085, 0.10, 0.14), C(s, 'accent'), 0.10, 0.02, -0.16, 0.06, 0.14, -0.15);
  addRot(grp, box(0.055, 0.055, 0.07), C(s, 'gold'), 0.165, 0.095, 0.04, 0.12, -0.1, 0.22);
  addRot(grp, cyl(0.032, 0.036, 0.12, 8), C(s, 'gold'), 0.07, 0.085, -0.02, 0.14, 0.0, 0.28);
  addRot(grp, cyl(0.05, 0.05, 0.17, 7), C(s, 'hull'), -0.085, -0.02, 0.02, Math.PI / 2 + 0.05, 0.06, 0.0); // lone port drum

  // D. CROOKED PATCH PLATES
  addRot(grp, box(0.15, 0.012, 0.17), C(s, 'hull'), 0.02, 0.062, 0.05, 0, 0.0, -0.09);
  addRot(grp, box(0.02, 0.11, 0.13), C(s, 'hull2'), 0.155, 0.03, -0.02, 0.10, 0.0, 0.09);
  addRot(grp, box(0.09, 0.011, 0.11), C(s, 'accent'), -0.02, -0.058, -0.15, 0, 0.12, 0.12);
  panelZ(grp, s, 0.1, 0.093, 0.05, 0.13);
  panelZ(grp, s, -0.045, 0.052, -0.06, 0.2);

  // E. EXPOSED ORANGE PIPES
  addRot(grp, cyl(0.011, 0.011, 0.44, 6), ACC(s), 0.095, 0.05, -0.03, Math.PI / 2 + 0.03, 0.0, 0.05);
  addRot(grp, cyl(0.009, 0.009, 0.34, 6), ACC(s), -0.072, -0.03, 0.0, Math.PI / 2, 0.06, 0.0);
  addRot(grp, cyl(0.008, 0.008, 0.17, 6), ACC(s), 0.055, 0.095, 0.09, 0.35, 0.2, 0.95);
  addRot(grp, cyl(0.008, 0.008, 0.14, 6), ACC(s), 0.13, 0.0, -0.11, 0.12, 0.0, 0.45);
  addRot(grp, cyl(0.007, 0.007, 0.12, 6), ACC(s), 0.02, -0.06, -0.02, Math.PI / 2 - 0.2, 0.5, 0.0);
  addRot(grp, cyl(0.008, 0.008, 0.22, 6), ACC(s), 0.12, 0.06, -0.13, Math.PI / 2 + 0.18, 0.0, 0.1);
  addRot(grp, cyl(0.007, 0.007, 0.16, 6), ACC(s), 0.06, -0.04, 0.14, 0.9, 0.3, 0.4);
  addRot(grp, box(0.02, 0.05, 0.03), C(s, 'dark'), 0.145, 0.06, 0.0, 0.0, 0.0, 0.2); // pipe bracket clamping the pile

  // F. GRUBBY OFF-CENTRE COCKPIT (clear port side)
  addRot(grp, box(0.062, 0.052, 0.078), C(s, 'dark'), -0.04, 0.058, 0.145, 0.0, 0.0, 0.08);
  grp.add(part(box(0.052, 0.009, 0.02), C(s, 'hull2'), -0.04, 0.08, 0.16)); // dark brow
  grp.add(part(box(0.05, 0.022, 0.014), C(s, 'glass'), -0.04, 0.053, 0.184)); // orange glass viewport
  grp.add(part(box(0.054, 0.006, 0.006), ACC(s), -0.04, 0.038, 0.187)); // bright orange sill
  antenna(grp, s, -0.052, 0.085, 0.115, 0.10);

  // G. MISMATCHED ENGINE CLUSTER
  addRot(grp, box(0.14, 0.11, 0.05), C(s, 'dark'), 0.008, 0.0, -0.25);
  addRot(grp, cyl(0.054, 0.058, 0.055, 8), C(s, 'hull2'), -0.035, -0.008, -0.265, Math.PI / 2);
  addRot(grp, cyl(0.04, 0.044, 0.05, 8), C(s, 'hull2'), 0.06, 0.015, -0.265, Math.PI / 2);
  nozzle(grp, s, -0.035, -0.008, -0.285, 0.05, 0.05); // BIG main (low-port)
  nozzle(grp, s, 0.06, 0.015, -0.285, 0.036, 0.045); // medium (up-starboard)
  addRot(grp, cyl(0.028, 0.03, 0.04, 8), C(s, 'dark'), 0.115, -0.02, -0.265, Math.PI / 2);
  engineGlow(grp, s, 0.115, -0.02, -0.30, 0.026);
  addRot(grp, cyl(0.026, 0.028, 0.04, 8), C(s, 'dark'), -0.10, 0.028, -0.265, Math.PI / 2);
  engineGlow(grp, s, -0.10, 0.028, -0.30, 0.024);
  engineGlow(grp, s, 0.02, -0.065, -0.29, 0.02);
  addRot(grp, cyl(0.022, 0.024, 0.035, 8), C(s, 'dark'), -0.06, 0.045, -0.265, Math.PI / 2);
  engineGlow(grp, s, -0.06, 0.045, -0.295, 0.021);

  // H. LIGHTS + grubby detail
  runningLights(grp, s, 0.1, 0.05, 0.2);
  grp.add(part(sph(0.014, 6), NAV(s, 'star'), 0.13, 0.115, -0.02));
  grp.add(part(sph(0.012, 6), NAV(s, 'star'), 0.1, -0.075, -0.17));
  navLight(grp, s, 'top', 0.155, 0.02, 0.12, 0.008);
  greeble(grp, s, 'dark', -0.05, 0.0, -0.1, 0.03, 0.05, 0.06);
  greeble(grp, s, 'hull', 0.06, -0.06, 0.12, 0.04, 0.03, 0.05);
  rcsQuad(grp, s, -0.05, 0.05, 0.19, 0.009);
  rcsQuad(grp, s, 0.11, -0.04, -0.15, 0.009);

  return grp;
}

// TANKER — a cobbled salvage fuel/chem bowser: MISMATCHED scavenged tanks (fat
// cylinders of DIFFERENT diameters + fat spheres of DIFFERENT sizes) lashed to a
// crooked frame at odd angles, a tangle of exposed ORANGE pipes + valves + pump
// greebles, crooked patch plates, a tiny off-centre cockpit, and a CLUSTER of
// mismatched orange engines. NOSE = +Z. ASYMMETRIC about X.
function makeCartelTanker(s) {
  const grp = group();

  // cobbled FRAME the junk is lashed to
  grp.add(part(box(0.055, 0.05, 0.4), C(s, 'hull2'), -0.004, -0.03, -0.02)); // main keel beam
  addRot(grp, box(0.028, 0.028, 0.3), C(s, 'dark'), 0.016, 0.03, -0.03, 0, 0.05, 0.03); // upper chord, offset +X
  addRot(grp, box(0.17, 0.012, 0.02), C(s, 'accent'), 0.0, 0.02, 0.075, 0, 0, 0.2); // lashing strap
  addRot(grp, box(0.2, 0.012, 0.02), C(s, 'accent'), -0.006, -0.006, -0.055, 0, 0, -0.15);
  addRot(grp, box(0.15, 0.012, 0.02), C(s, 'hull'), 0.012, 0.05, -0.13, 0, 0, 0.1);

  // MISMATCHED SALVAGED TANKS — different SHAPES and SIZES, welded lopsided
  addRot(grp, cyl(0.062, 0.07, 0.26, 8), C(s, 'hull'), -0.052, -0.002, -0.01, Math.PI / 2 + 0.05, 0.04, 0.1); // BIG main drum, port
  addRot(grp, cyl(0.075, 0.075, 0.02, 10), C(s, 'dark'), -0.046, 0.004, 0.085, Math.PI / 2 + 0.05, 0.04, 0.1); // seam band
  addRot(grp, cyl(0.067, 0.067, 0.02, 10), C(s, 'dark'), -0.058, -0.008, -0.085, Math.PI / 2 + 0.05, 0.04, 0.1); // seam band
  grp.add(part(box(0.024, 0.03, 0.03), C(s, 'dark'), -0.052, 0.066, 0.0)); // dome valve cap
  grp.add(part(box(0.006, 0.02, 0.12), ACC(s), -0.052, 0.012, 0.0)); // gauge stripe
  addRot(grp, cyl(0.046, 0.052, 0.2, 8), C(s, 'hull2'), 0.056, 0.026, 0.045, Math.PI / 2 - 0.04, -0.06, -0.13); // second cylinder, starboard
  addRot(grp, cyl(0.057, 0.057, 0.018, 10), C(s, 'dark'), 0.05, 0.02, -0.03, Math.PI / 2 - 0.04, -0.06, -0.13); // seam band
  addRot(grp, cyl(0.05, 0.05, 0.014, 8), C(s, 'accent'), 0.062, 0.03, 0.14, Math.PI / 2 - 0.04, -0.06, -0.13); // mismatched head flange
  grp.add(part(box(0.005, 0.018, 0.1), ACC(s), 0.058, 0.05, 0.03)); // gauge stripe
  grp.add(part(sph(0.07, 8), C(s, 'hull'), 0.026, 0.062, -0.03)); // BIG sphere tank, top-starboard
  addRot(grp, cyl(0.073, 0.073, 0.016, 12), C(s, 'dark'), 0.026, 0.062, -0.03, Math.PI / 2); // reinforcing band
  grp.add(part(box(0.024, 0.024, 0.024), C(s, 'accent'), 0.026, 0.128, -0.03)); // top valve block
  grp.add(part(sph(0.045, 7), C(s, 'hull2'), -0.058, -0.042, -0.11)); // small sphere, low port-aft
  addRot(grp, cyl(0.028, 0.034, 0.15, 6), C(s, 'hull'), 0.064, -0.03, -0.12, Math.PI / 2 - 0.12, 0.22, -0.1); // stray little drum

  // TANGLE of exposed ORANGE pipes (ACC) + valves + pump greebles
  addRot(grp, cyl(0.013, 0.013, 0.34, 6), ACC(s), 0.0, 0.052, -0.02, Math.PI / 2 + 0.03, 0.05, 0.04);
  addRot(grp, cyl(0.011, 0.011, 0.24, 6), ACC(s), 0.024, 0.088, 0.0, Math.PI / 2 - 0.08, 0.14, -0.06);
  addRot(grp, cyl(0.01, 0.01, 0.11, 6), ACC(s), 0.02, 0.05, 0.0, 0.5, 0.4, 0.2);
  addRot(grp, cyl(0.009, 0.009, 0.12, 6), ACC(s), -0.045, -0.018, -0.09, Math.PI / 2 + 0.3, -0.2, 0.3);
  addRot(grp, cyl(0.01, 0.01, 0.11, 6), ACC(s), 0.002, 0.03, 0.055, 0.2, 0.0, Math.PI / 2 - 0.1);
  addRot(grp, cyl(0.011, 0.011, 0.26, 6), ACC(s), -0.056, -0.03, -0.01, Math.PI / 2 - 0.05, 0.0, -0.06);
  addRot(grp, cyl(0.008, 0.008, 0.06, 6), ACC(s), -0.02, 0.075, 0.11, 0.0, 0.0, 0.3);
  grp.add(part(sph(0.015, 6), ACC(s), 0.0, 0.055, 0.085)); // valve wheel
  grp.add(part(sph(0.013, 6), ACC(s), 0.03, 0.05, -0.1)); // valve wheel
  grp.add(part(sph(0.012, 6), ACC(s), -0.02, 0.108, 0.11)); // valve wheel on the riser
  greeble(grp, s, 'dark', -0.006, 0.008, 0.11, 0.04, 0.036, 0.03); // fore pump box
  greeble(grp, s, 'dark', 0.012, -0.008, -0.155, 0.05, 0.04, 0.036); // aft pump box

  // CROOKED PATCH PLATES
  addRot(grp, box(0.085, 0.01, 0.1), C(s, 'hull'), -0.02, 0.052, 0.05, 0.04, 0.1, -0.14);
  addRot(grp, box(0.065, 0.01, 0.075), C(s, 'hull2'), 0.045, 0.03, 0.11, 0.0, -0.2, 0.18);
  addRot(grp, box(0.055, 0.01, 0.065), C(s, 'accent'), -0.03, -0.028, -0.135, 0.15, 0.0, 0.22);

  // small OFF-CENTRE grubby COCKPIT, forward-port
  grp.add(part(box(0.058, 0.05, 0.02), C(s, 'dark'), -0.03, 0.035, 0.155)); // weld collar
  addRot(grp, box(0.052, 0.05, 0.062), C(s, 'hull2'), -0.034, 0.062, 0.198, 0.0, 0.16, 0.05); // cockpit box
  grp.add(part(box(0.044, 0.03, 0.018), C(s, 'glass'), -0.042, 0.07, 0.23)); // grubby orange windscreen
  grp.add(part(box(0.05, 0.012, 0.016), C(s, 'dark'), -0.034, 0.092, 0.226)); // brow visor
  antenna(grp, s, -0.052, 0.088, 0.175, 0.06);
  addRot(grp, cyl(0.05, 0.045, 0.03, 8), C(s, 'accent'), -0.05, 0.002, 0.15, Math.PI / 2 + 0.05, 0.04, 0.1); // fuel-cap head

  // CLUSTER of MISMATCHED ORANGE engines
  grp.add(part(box(0.12, 0.09, 0.04), C(s, 'dark'), -0.006, -0.006, -0.225));
  nozzle(grp, s, -0.05, -0.012, -0.25, 0.032, 0.05); // BIG main, port-low
  nozzle(grp, s, 0.044, 0.02, -0.244, 0.023, 0.045); // medium, starboard-up
  addRot(grp, cyl(0.024, 0.03, 0.05, 8), C(s, 'dark'), 0.008, -0.05, -0.23, Math.PI / 2);
  engineGlow(grp, s, 0.008, -0.05, -0.26, 0.02);
  engineGlow(grp, s, -0.09, 0.03, -0.225, 0.016);
  engineGlow(grp, s, 0.078, -0.018, -0.21, 0.014);

  navLight(grp, s, 'port', -0.11, 0.0, 0.02, 0.01);
  navLight(grp, s, 'star', 0.12, 0.05, 0.04, 0.01);
  grp.add(part(sph(0.014, 6), NAV(s, 'star'), 0.026, 0.135, -0.03));
  grp.add(part(sph(0.012, 6), NAV(s, 'star'), -0.05, 0.07, 0.04));

  return grp;
}

// LINER — a Cartel refugee/migrant BARGE: a cobbled rusty spine with mismatched
// welded-on habitat modules / cargo-containers-turned-cabins (different sizes,
// BUNCHED LOPSIDEDLY to starboard) with rows of uneven ORANGE-lit windows, crooked
// patch plates, exposed pipes, laundry-line antennae, a grubby off-centre bridge,
// and a CLUSTER of mismatched engines. Lived-in, overcrowded. NOSE = +Z. ASYMMETRIC.
function makeCartelLiner(s) {
  const grp = group();

  // A row of uneven orange-lit windows on a wall facing ±X, along Z.
  function winRow(target, x, y, z0, z1, step) {
    let i = 0;
    for (let z = z0; z <= z1 + 1e-6; z += step) {
      i++;
      const k = (i * 3 + Math.round((y + 1) * 90)) % 7;
      if (k === 0) continue; // an occasional dark cabin
      const h = 0.006 + (i % 3) * 0.0018;
      target.add(part(box(0.0045, h, 0.011), GLOW(s), x, y, z));
    }
  }
  function frontWin(target, w, h, zf) {
    for (const yy of [-h * 0.22, h * 0.16]) {
      for (const xx of [-w * 0.28, 0, w * 0.28]) target.add(part(box(0.007, 0.006, 0.004), GLOW(s), xx, yy, zf));
    }
  }
  function cabin(slot, w, h, d, nx, ys, z0, z1, step, front = false) {
    const m = group();
    m.add(part(box(w, h, d), C(s, slot), 0, 0, 0));
    for (const y of ys) winRow(m, nx * (w / 2 + 0.002), y, z0, z1, step);
    if (front) frontWin(m, w, h, d / 2 + 0.002);
    return m;
  }
  function weld(child, x, y, z, rx = 0, ry = 0, rz = 0) {
    child.position.set(x, y, z);
    child.rotation.set(rx, ry, rz);
    grp.add(child);
  }

  // cobbled core spine: mismatched welded segments, blunt (a hauler)
  grp.add(part(box(0.11, 0.115, 0.13), C(s, 'hull2'), 0.0, -0.008, -0.245)); // aft engineering block
  grp.add(part(box(0.118, 0.122, 0.02), C(s, 'dark'), 0, 0, -0.178)); // dark weld collar
  grp.add(part(box(0.095, 0.10, 0.30), C(s, 'hull'), 0, 0, -0.01)); // MAIN HULL — deck run
  grp.add(part(box(0.10, 0.105, 0.016), C(s, 'dark'), 0, 0, 0.14)); // forward weld collar
  grp.add(part(box(0.078, 0.08, 0.085), C(s, 'hull2'), 0, -0.006, 0.185)); // blunt bow block
  grp.add(part(box(0.05, 0.052, 0.05), C(s, 'dark'), 0, -0.012, 0.226)); // snub nose
  addRot(grp, cone(0.05, 0.075, 8), C(s, 'accent'), 0.006, -0.006, 0.255, Math.PI / 2, 0, 0.06); // crooked nose cap

  // lower-deck windows: starboard denser, port sparse (lopsided)
  winRow(grp, 0.0505, 0.0, -0.12, 0.10, 0.02);
  winRow(grp, 0.0505, -0.032, -0.12, 0.10, 0.02);
  winRow(grp, -0.0505, 0.004, -0.10, 0.08, 0.03);

  // STARBOARD (+X) HABITAT PILE
  weld(cabin('hull', 0.085, 0.16, 0.155, 1, [-0.05, -0.005, 0.045], -0.058, 0.062, 0.017, true), 0.095, 0.055, 0.055, 0.0, 0.0, -0.05);
  weld(cabin('accent', 0.06, 0.055, 0.09, 1, [0.0], -0.032, 0.032, 0.02, true), 0.11, 0.155, 0.05, 0.0, 0.12, -0.04);
  weld(cabin('hull', 0.06, 0.07, 0.13, 1, [-0.014, 0.022], -0.045, 0.045, 0.02), 0.11, -0.085, -0.15, 0.05, 0.0, -0.08);
  weld(cabin('hull2', 0.052, 0.062, 0.09, 1, [0.0], -0.03, 0.03, 0.02, true), 0.088, 0.01, 0.155, 0.0, 0.0, -0.06);
  addRot(grp, cyl(0.05, 0.055, 0.16, 8), C(s, 'hull2'), 0.112, -0.05, -0.05, Math.PI / 2 + 0.05, 0.0, 0.06); // converted drum cabin
  for (const z of [-0.09, -0.04, 0.01]) grp.add(part(box(0.004, 0.008, 0.011), GLOW(s), 0.168, -0.05, z)); // drum portholes

  // PORT (−X): a SINGLE small cabin — the only thing this side (lopsided)
  weld(cabin('hull2', 0.055, 0.078, 0.11, -1, [-0.018, 0.024], -0.04, 0.04, 0.022), -0.086, 0.016, 0.06, 0.0, 0.0, 0.05);

  // DORSAL SHANTY-STACK
  weld(cabin('hull', 0.06, 0.075, 0.09, 1, [0.0], -0.03, 0.03, 0.02, true), 0.012, 0.098, -0.085, 0.0, -0.06, -0.04);
  weld(cabin('hull2', 0.055, 0.05, 0.075, 1, [0.0], -0.026, 0.026, 0.02, true), 0.03, 0.088, 0.02, 0.03, 0.08, -0.05);
  weld(cabin('accent', 0.048, 0.065, 0.065, -1, [0.0], -0.022, 0.022, 0.02, true), -0.018, 0.09, 0.09, 0.0, -0.1, 0.05);
  for (const z of [-0.055, -0.02, 0.015, 0.05]) grp.add(part(box(0.008, 0.0035, 0.008), GLOW(s), 0.02, 0.128, z)); // roof skylights

  // crooked patch plates
  addRot(grp, box(0.09, 0.01, 0.13), C(s, 'hull'), 0.03, 0.056, -0.02, 0.0, 0.0, -0.12);
  addRot(grp, box(0.06, 0.01, 0.10), C(s, 'hull2'), -0.03, -0.056, 0.06, 0.0, 0.1, 0.1);
  addRot(grp, box(0.05, 0.01, 0.08), C(s, 'accent'), 0.11, 0.10, -0.11, 0.1, 0.0, 0.22);

  // exposed ORANGE pipes
  addRot(grp, cyl(0.007, 0.007, 0.44, 6), ACC(s), 0.085, 0.05, -0.02, Math.PI / 2 + 0.03, 0.0, 0.06);
  addRot(grp, cyl(0.006, 0.006, 0.30, 6), ACC(s), 0.018, 0.088, 0.02, Math.PI / 2, 0.05, 0.0);
  addRot(grp, cyl(0.005, 0.005, 0.17, 6), ACC(s), 0.115, -0.02, -0.10, Math.PI / 2 - 0.2, 0.1, 0.12);

  // grubby OFF-CENTRE bridge (starboard-forward)
  addRot(grp, box(0.055, 0.062, 0.065), C(s, 'dark'), 0.04, 0.10, 0.15, 0.06, 0.0, -0.05);
  grp.add(part(box(0.045, 0.024, 0.012), C(s, 'glass'), 0.042, 0.112, 0.183)); // orange bridge glass
  grp.add(part(box(0.012, 0.02, 0.03), C(s, 'glass'), 0.07, 0.108, 0.15)); // orange side window
  greeble(grp, s, 'hull2', 0.03, 0.135, 0.135, 0.03, 0.014, 0.03);

  // laundry-line antennae/greebles
  antenna(grp, s, -0.03, 0.105, -0.05, 0.10);
  antenna(grp, s, 0.06, 0.145, 0.02, 0.085);
  addRot(grp, box(0.10, 0.0018, 0.0018), C(s, 'dark'), 0.015, 0.205, -0.014, 0.0, 0.18, 0.06); // slack laundry line
  for (const [lx, lz, sl] of [[-0.02, -0.03, 'accent'], [0.015, -0.005, 'hull2'], [0.045, 0.015, 'accent']]) {
    grp.add(part(box(0.007, 0.011, 0.002), C(s, sl), lx, 0.197, lz)); // hanging rag
  }
  greeble(grp, s, 'dark', -0.055, 0.03, -0.12, 0.02, 0.03, 0.04);

  // MISMATCHED engine cluster
  addRot(grp, box(0.12, 0.10, 0.014), C(s, 'dark'), 0.0, 0.0, -0.305, 0.0, 0.0, 0.04);
  addRot(grp, cyl(0.045, 0.05, 0.05, 8), C(s, 'dark'), -0.03, -0.005, -0.30, Math.PI / 2);
  addRot(grp, cyl(0.032, 0.036, 0.045, 8), C(s, 'dark'), 0.038, 0.012, -0.29, Math.PI / 2);
  addRot(grp, cyl(0.024, 0.028, 0.04, 7), C(s, 'hull2'), 0.062, -0.03, -0.285, Math.PI / 2);
  addRot(grp, cyl(0.028, 0.03, 0.04, 7), C(s, 'dark'), -0.052, 0.04, -0.285, Math.PI / 2);
  engineGlow(grp, s, -0.03, -0.005, -0.34, 0.045);
  engineGlow(grp, s, 0.038, 0.012, -0.328, 0.03);
  engineGlow(grp, s, 0.062, -0.03, -0.318, 0.02);
  engineGlow(grp, s, -0.052, 0.04, -0.32, 0.024);
  engineGlow(grp, s, 0.0, -0.052, -0.312, 0.016);

  runningLights(grp, s, 0.055, -0.02, 0.16);
  navLight(grp, s, 'star', 0.06, 0.23, 0.02, 0.01);
  grp.add(part(sph(0.01, 6), NAV(s, 'star'), 0.122, 0.145, -0.05));
  grp.add(part(sph(0.008, 6), NAV(s, 'star'), 0.1, -0.09, -0.15));

  return grp;
}

// === BESPOKE FLAGSHIP — a colossal, richly detailed junk MOTHERSHIP ============

// A crude SCAVENGED cannon of any calibre, welded on at an ODD angle (own sub-
// group so it cants as one weld). `hot` adds a bore-glow so the batteries read as
// a junk collection, not a factory row.
function carFlagGun(grp, s, x, y, z, r, len, rx = 0, ry = 0, rz = 0, hot = false) {
  const gun = group();
  gun.add(part(box(r * 3.4, r * 3.0, r * 2.2), C(s, 'dark'), 0, 0, -len * 0.28)); // rough breech clamp
  gun.add(part(box(r * 2.4, r * 2.4, r * 0.8), C(s, 'hull2'), 0, 0, -len * 0.02)); // welded collar
  addRot(gun, cyl(r, r * 0.86, len, 6), C(s, 'dark'), 0, 0, len * 0.5, Math.PI / 2); // barrel tube
  addRot(gun, cyl(r * 1.5, r * 1.15, r * 1.4, 6), ACC(s), 0, 0, len, Math.PI / 2); // orange muzzle brake
  if (hot) gun.add(part(sph(r * 0.82, 6), GLOW(s), 0, 0, len + r * 0.7)); // charged bore glow
  gun.position.set(x, y, z);
  gun.rotation.set(rx, ry, rz);
  grp.add(gun);
}

// A crude salvaged TURRET welded off-centre: a base collar, a rusty rotating drum,
// an armoured gun-house with an orange targeting slit, TWO mismatched barrels
// overhanging forward at a `cant` off-axis.
function carFlagTurret(grp, s, x, y, z, r, cant = 0) {
  grp.add(part(cyl(r * 1.45, r * 1.7, r * 0.45, 7), C(s, 'dark'), x, y, z)); // welded base collar
  grp.add(part(cyl(r * 1.1, r * 1.2, r * 0.75, 7), C(s, 'hull2'), x, y + r * 0.5, z)); // rotating drum
  const gy = y + r * 0.72;
  addRot(grp, box(r * 2.0, r * 1.0, r * 1.5), C(s, 'dark'), x, gy, z + r * 0.3, 0, cant, 0.05); // gun-house
  grp.add(part(box(r * 0.9, r * 0.42, r * 0.35), C(s, 'glass'), x - r * 0.2, gy + r * 0.4, z - r * 0.6)); // orange targeting slit
  const bl = r * 2.9;
  for (const by of [-r * 0.42, r * 0.5]) {
    const cx = x - Math.sin(cant) * (r + bl / 2);
    const cz = z + Math.cos(cant) * (r + bl / 2);
    addRot(grp, cyl(r * 0.32, r * 0.24, bl, 6), C(s, 'dark'), cx, gy + by * 0.55, cz, Math.PI / 2, 0, cant);
    grp.add(part(box(r * 0.4, r * 0.4, r * 0.14), ACC(s),
      x - Math.sin(cant) * (r + bl), gy + by * 0.55, z + Math.cos(cant) * (r + bl))); // orange muzzle tip
  }
}

// FLAGSHIP — a COLOSSAL Cartel junk MOTHERSHIP: a cobbled central core of clearly
// MISMATCHED welded segments, with a WHOLE second salvaged drum-ship welded onto
// the PORT flank, a lopsided container/tank pile bunched to STARBOARD, rows of
// mismatched-calibre scavenged guns welded at odd angles, an OFF-CENTRE cobbled
// command tower, a belly hangar-mouth glowing orange, exposed orange pipes, crooked
// patch plates, greeble clutter, and a CLUSTER of MISMATCHED-SIZE orange engines
// with radiators. NOSE = +Z. Local Z-length ~1.05. NEVER symmetric about X.
function makeCartelFlagship(s) {
  const grp = group();

  // ── A. COBBLED CORE HULL — mismatched welded segments end to end, off-centre ──
  grp.add(part(box(0.24, 0.215, 0.18), C(s, 'hull2'), 0.015, -0.006, -0.42)); // aft engineering block (biggest)
  grp.add(part(box(0.255, 0.228, 0.024), C(s, 'dark'), 0.015, -0.006, -0.322)); // weld collar
  grp.add(part(box(0.27, 0.235, 0.30), C(s, 'hull'), 0.0, 0.0, -0.12)); // mid core
  addRot(grp, box(0.11, 0.15, 0.34), C(s, 'hull2'), -0.145, -0.028, -0.09, 0.05, 0.0, -0.1); // fat PORT bulge (breaks symmetry)
  grp.add(part(box(0.245, 0.205, 0.022), C(s, 'dark'), -0.006, 0.0, 0.045)); // weld collar
  grp.add(part(box(0.205, 0.178, 0.24), C(s, 'hull'), -0.022, -0.01, 0.185)); // forward hull (port-nudged)
  grp.add(part(box(0.165, 0.145, 0.02), C(s, 'dark'), -0.012, -0.01, 0.31)); // weld collar
  grp.add(part(box(0.125, 0.112, 0.1), C(s, 'hull2'), 0.006, -0.016, 0.36)); // blunt ragged nose block
  addRot(grp, cone(0.078, 0.18, 8), C(s, 'accent'), 0.024, -0.012, 0.475, Math.PI / 2, 0.0, 0.07); // ragged ram cone off-axis
  addRot(grp, box(0.09, 0.026, 0.09), C(s, 'dark'), 0.012, -0.052, 0.4, 0.14, 0.0, 0.0); // chin ram plate
  addRot(grp, box(0.145, 0.052, 0.34), C(s, 'hull'), 0.092, 0.128, -0.04, 0.0, 0.0, -0.05); // raised STARBOARD patch deck

  // ── B. A WHOLE SECOND SALVAGED SHIP welded to the PORT (−X) flank ─────────────
  const dRot = [Math.PI / 2 + 0.05, 0.07, 0.0];
  addRot(grp, cyl(0.094, 0.106, 0.62, 9), C(s, 'hull2'), -0.208, 0.02, -0.05, ...dRot); // wreck drum body (2nd ship)
  addRot(grp, cyl(0.11, 0.11, 0.024, 10), C(s, 'dark'), -0.198, 0.028, 0.13, ...dRot); // seam band
  addRot(grp, cyl(0.11, 0.11, 0.024, 10), C(s, 'accent'), -0.218, 0.012, -0.2, ...dRot); // rusty seam band
  addRot(grp, cone(0.098, 0.22, 8), C(s, 'accent'), -0.236, 0.03, 0.335, ...dRot); // wreck's OWN nose cone (2nd prow)
  addRot(grp, cyl(0.1, 0.1, 0.024, 10), C(s, 'dark'), -0.224, 0.028, 0.235, ...dRot); // collar where the nose was welded
  addRot(grp, box(0.078, 0.062, 0.08), C(s, 'dark'), -0.225, 0.108, 0.06, 0.0, 0.1, 0.05); // wreck's repurposed bridge
  addRot(grp, box(0.056, 0.024, 0.032), C(s, 'glass'), -0.242, 0.128, 0.088, 0.0, 0.1, 0.05); // orange bridge glass
  addRot(grp, box(0.03, 0.1, 0.05), C(s, 'dark'), -0.1, 0.02, 0.06, 0.0, 0.0, 0.16); // weld strap binding wreck to core
  addRot(grp, box(0.03, 0.1, 0.05), C(s, 'dark'), -0.095, -0.01, -0.2, 0.0, 0.0, -0.12); // second weld strap
  addRot(grp, box(0.028, 0.1, 0.048), C(s, 'hull'), -0.11, 0.0, -0.05, 0.0, 0.0, 0.05); // third strap
  nozzle(grp, s, -0.205, 0.004, -0.38, 0.046, 0.055); // wreck's own relit engine bell
  for (const z of [0.12, 0.04, -0.04, -0.12]) grp.add(part(box(0.008, 0.014, 0.014), GLOW(s), -0.312, 0.03, z)); // orange portholes

  // ── C. STARBOARD (+X) CONTAINER / TANK PILE — mismatched, bunched, lopsided ───
  grp.add(part(box(0.11, 0.16, 0.19), C(s, 'accent'), 0.165, 0.045, 0.1)); // big rusty container
  addRot(grp, box(0.095, 0.128, 0.15), C(s, 'hull'), 0.17, 0.135, -0.05, 0.0, 0.12, 0.18); // second container, crooked
  addRot(grp, cyl(0.058, 0.062, 0.26, 8), C(s, 'hull2'), 0.178, -0.048, -0.19, Math.PI / 2 - 0.1, 0.14, 0.0); // welded drum tank
  addRot(grp, cyl(0.066, 0.066, 0.02, 10), C(s, 'dark'), 0.178, -0.048, -0.07, Math.PI / 2 - 0.1, 0.14, 0.0); // tank seam band
  addRot(grp, box(0.085, 0.085, 0.1), C(s, 'accent'), 0.186, 0.078, -0.32, 0.1, -0.2, 0.22); // crate stacked on top
  addRot(grp, box(0.07, 0.07, 0.088), C(s, 'gold'), 0.205, 0.155, 0.02, 0.12, -0.1, 0.2); // gold cargo pod
  grp.add(part(sph(0.062, 8), C(s, 'hull'), 0.135, 0.165, -0.16)); // spherical gas tank
  addRot(grp, cyl(0.065, 0.065, 0.016, 12), C(s, 'dark'), 0.135, 0.165, -0.16, Math.PI / 2); // sphere reinforcing band
  addRot(grp, cyl(0.04, 0.044, 0.18, 7), C(s, 'hull'), 0.205, -0.02, 0.12, Math.PI / 2 + 0.12, -0.14, 0.0); // stray small drum
  addRot(grp, box(0.024, 0.075, 0.04), C(s, 'dark'), 0.135, 0.06, 0.02, 0.0, 0.0, 0.24); // bracket clamping the pile
  greeble(grp, s, 'hull2', 0.2, 0.02, -0.08, 0.05, 0.05, 0.06); // grubby junk box
  for (const y of [0.09, 0.05, 0.01]) for (const z of [0.15, 0.1, 0.05]) grp.add(part(box(0.006, 0.009, 0.011), GLOW(s), 0.222, y, z)); // container windows
  for (const z of [0.24, 0.2, 0.16, 0.12]) grp.add(part(box(0.006, 0.011, 0.013), GLOW(s), -0.126, 0.02, z)); // forward-hull windows
  for (const z of [-0.34, -0.4]) for (const y of [0.05, 0.0, -0.05]) grp.add(part(box(0.006, 0.009, 0.011), GLOW(s), 0.137, y, z)); // aft-block windows

  // ── D. CROOKED PATCH PLATES slapped over the core (different each side) ───────
  addRot(grp, box(0.2, 0.014, 0.26), C(s, 'hull'), 0.0, 0.108, 0.1, 0.0, 0.0, -0.07);
  addRot(grp, box(0.14, 0.014, 0.18), C(s, 'hull2'), -0.03, -0.088, -0.16, 0.0, 0.12, 0.09);
  addRot(grp, box(0.016, 0.11, 0.16), C(s, 'accent'), 0.14, 0.02, -0.02, 0.0, 0.0, 0.16); // starboard side plate
  addRot(grp, box(0.12, 0.014, 0.14), C(s, 'accent'), 0.03, -0.096, 0.12, 0.0, 0.0, 0.1); // belly patch
  panelZ(grp, s, 0.09, 0.12, -0.02, 0.34);
  panelZ(grp, s, -0.09, 0.09, 0.05, 0.24);
  panelX(grp, s, 0.0, 0.12, -0.15, 0.2);
  panelX(grp, s, 0.0, 0.12, 0.16, 0.16);

  // ── E. OFF-CENTRE COBBLED COMMAND TOWER (starboard-dorsal, aft) ───────────────
  const TR = [0.05, 0.0, -0.09];
  addRot(grp, box(0.12, 0.15, 0.15), C(s, 'dark'), 0.078, 0.19, -0.18, ...TR); // tower base block
  addRot(grp, box(0.095, 0.11, 0.11), C(s, 'hull2'), 0.084, 0.295, -0.19, ...TR); // upper tower
  addRot(grp, box(0.062, 0.05, 0.07), C(s, 'dark'), 0.089, 0.365, -0.2, ...TR); // crooked crown
  addRot(grp, box(0.1, 0.048, 0.02), C(s, 'glass'), 0.076, 0.208, -0.098, ...TR); // orange bridge glass (+Z)
  addRot(grp, box(0.1, 0.01, 0.012), GLOW(s), 0.076, 0.18, -0.096, ...TR); // orange glow sill
  addRot(grp, box(0.014, 0.032, 0.04), C(s, 'glass'), 0.13, 0.2, -0.15, ...TR); // orange side window
  antenna(grp, s, 0.09, 0.4, -0.22, 0.14); // main mast
  antenna(grp, s, 0.05, 0.36, -0.26, 0.09); // second bent mast
  dish(grp, s, 0.03, 0.26, -0.3, 0.05, 0.5); // salvaged comms dish
  grp.add(part(sph(0.016, 6), NAV(s, 'star'), 0.089, 0.4, -0.2)); // orange beacon on the crown

  // ── F. BELLY HANGAR-MOUTH RECESS (off to PORT) with an orange interior glow ───
  grp.add(part(box(0.15, 0.07, 0.15), C(s, 'dark'), -0.055, -0.098, 0.16)); // recessed bay mouth
  grp.add(part(box(0.1, 0.05, 0.1), C(s, 'hull2'), -0.055, -0.098, 0.14)); // interior back wall
  grp.add(part(box(0.085, 0.03, 0.085), GLOW(s), -0.055, -0.098, 0.16)); // orange interior glow
  for (const sx of [-1, 1]) grp.add(part(box(0.01, 0.05, 0.15), C(s, 'dark'), -0.055 + sx * 0.078, -0.098, 0.16)); // bay-door frame lips
  addRot(grp, box(0.05, 0.016, 0.06), C(s, 'hull'), -0.055, -0.108, 0.185, 0.12, 0.0, 0.0); // parked shuttle silhouette
  grp.add(part(box(0.075, 0.008, 0.008), ACC(s), -0.055, -0.128, 0.24)); // orange approach-light bar

  // ── G. ROWS of SCAVENGED MISMATCHED-CALIBRE GUNS welded at odd angles ────────
  carFlagGun(grp, s, 0.11, 0.075, 0.28, 0.026, 0.32, 0.1, 0.1, 0.0, true); // BIG main, forward starboard
  carFlagGun(grp, s, 0.085, -0.085, 0.3, 0.017, 0.22, -0.1, 0.05); // medium, low starboard
  carFlagGun(grp, s, -0.055, 0.13, 0.16, 0.013, 0.2, 0.32, -0.12, 0.0, true); // steep dorsal gun, port
  carFlagGun(grp, s, -0.115, -0.05, 0.16, 0.011, 0.14, -0.05, -0.26); // stubby, low port
  carFlagGun(grp, s, 0.04, 0.235, -0.02, 0.014, 0.2, 0.34, 0.05); // gun jutting UP off the deck
  carFlagGun(grp, s, 0.175, 0.0, -0.06, 0.013, 0.15, 0.05, 0.72); // pointing OUT to starboard
  carFlagGun(grp, s, -0.27, 0.05, -0.1, 0.01, 0.11, 0.1, -0.7); // small stub OUT to port (on the wreck)
  carFlagGun(grp, s, 0.06, 0.14, 0.32, 0.011, 0.16, 0.15, 0.14, 0.0, true); // extra forward battery, dorsal
  carFlagGun(grp, s, 0.14, 0.05, 0.16, 0.015, 0.24, 0.02, 0.42); // long gun angled OUT starboard-forward
  carFlagGun(grp, s, -0.05, -0.03, 0.34, 0.012, 0.18, -0.16, -0.05, 0.0, true); // chin gun by the nose
  carFlagGun(grp, s, 0.02, 0.2, 0.1, 0.012, 0.17, 0.24, -0.1); // second deck gun, canted
  carFlagTurret(grp, s, 0.055, 0.155, -0.05, 0.05, 0.16); // HERO salvaged turret
  carFlagTurret(grp, s, -0.03, 0.132, 0.16, 0.034, -0.12); // second smaller turret
  carFlagGun(grp, s, -0.12, 0.03, 0.02, 0.013, 0.16, 0.05, -0.55); // port-flank gun pointing OUT

  // ── H. EXPOSED ORANGE PIPES snaking everywhere ───────────────────────────────
  addRot(grp, cyl(0.013, 0.013, 0.62, 6), ACC(s), 0.11, 0.06, -0.04, Math.PI / 2 + 0.03, 0.0, 0.05);
  addRot(grp, cyl(0.011, 0.011, 0.46, 6), ACC(s), -0.1, -0.04, 0.0, Math.PI / 2, 0.08, 0.0);
  addRot(grp, cyl(0.01, 0.01, 0.34, 6), ACC(s), 0.14, 0.11, -0.02, Math.PI / 2 + 0.1, -0.12, 0.0);
  addRot(grp, cyl(0.009, 0.009, 0.2, 6), ACC(s), 0.02, 0.128, -0.06, 0.0, 0.0, Math.PI / 2 + 0.2);
  addRot(grp, cyl(0.009, 0.009, 0.22, 6), ACC(s), -0.18, 0.03, 0.05, Math.PI / 2 - 0.08, 0.1, 0.0);
  addRot(grp, cyl(0.008, 0.008, 0.18, 6), ACC(s), 0.05, -0.1, -0.05, Math.PI / 2 - 0.2, 0.0, 0.14);
  addRot(grp, box(0.024, 0.05, 0.03), C(s, 'dark'), 0.145, 0.075, 0.02, 0.0, 0.0, 0.2); // pipe bracket
  addRot(grp, box(0.024, 0.05, 0.03), C(s, 'dark'), 0.1, 0.075, -0.28, 0.0, 0.0, 0.16); // second bracket

  // ── I. GREEBLE CLUTTER + sensor blisters across the decks ────────────────────
  greeble(grp, s, 'dark', -0.04, 0.11, -0.05, 0.05, 0.03, 0.06);
  greeble(grp, s, 'hull2', 0.02, 0.15, 0.12, 0.04, 0.025, 0.05);
  greeble(grp, s, 'dark', 0.11, -0.09, -0.32, 0.04, 0.03, 0.05);
  greeble(grp, s, 'hull', -0.05, -0.02, 0.28, 0.04, 0.04, 0.04);
  blister(grp, s, -0.02, 0.115, 0.2, 0.026); // forward sensor blister
  blister(grp, s, 0.11, 0.02, 0.19, 0.022); // sensor blister on the pile
  for (const [gx, gz] of [[-0.02, 0.02], [0.05, -0.12], [-0.06, -0.14], [0.08, 0.05]]) greeble(grp, s, 'dark', gx, 0.12, gz, 0.028, 0.02, 0.04);
  for (const [gx, gz] of [[0.0, 0.14], [-0.04, -0.02]]) greeble(grp, s, 'hull2', gx, 0.124, gz, 0.03, 0.016, 0.055);
  antenna(grp, s, -0.06, 0.128, 0.03, 0.1);
  dish(grp, s, -0.11, 0.05, -0.16, 0.032, 0.42); // salvaged dish welded low on the port flank
  addRot(grp, cyl(0.008, 0.008, 0.16, 6), ACC(s), -0.04, 0.126, -0.08, 0.0, 0.0, Math.PI / 2 - 0.15); // deck pipe
  greeble(grp, s, 'dark', -0.18, -0.02, -0.28, 0.04, 0.036, 0.05); // junk box on the wreck's tail

  // ── J. CLUSTER of MISMATCHED-SIZE ORANGE ENGINES (deliberately off-balance) ──
  grp.add(part(box(0.26, 0.2, 0.03), C(s, 'dark'), 0.01, 0.0, -0.51)); // engine mount face plate
  addRot(grp, cyl(0.07, 0.078, 0.07, 8), C(s, 'dark'), -0.07, -0.028, -0.49, Math.PI / 2); // BIG housing, low-port
  nozzle(grp, s, -0.07, -0.028, -0.535, 0.062, 0.07); // BIG main bell
  addRot(grp, cyl(0.046, 0.05, 0.06, 8), C(s, 'dark'), 0.065, 0.02, -0.49, Math.PI / 2); // medium housing
  nozzle(grp, s, 0.065, 0.02, -0.525, 0.04, 0.055); // medium bell, center-starboard
  nozzle(grp, s, 0.145, -0.04, -0.5, 0.026, 0.045); // small bell, far starboard
  nozzle(grp, s, -0.015, 0.075, -0.51, 0.03, 0.05); // medium bell, upper-port
  engineGlow(grp, s, 0.11, 0.05, -0.5, 0.02);
  engineGlow(grp, s, -0.12, 0.04, -0.5, 0.024);
  engineGlow(grp, s, 0.03, -0.07, -0.51, 0.018);

  // ── K. RADIATORS off the stern flanks (mismatched, one each side) ────────────
  addRot(grp, box(0.008, 0.13, 0.2), C(s, 'dark'), 0.2, 0.02, -0.4, 0.0, 0.0, 0.5); // canted starboard fin
  radiatorPanel(grp, s, 0.165, 0.06, -0.42, 0.05, 0.16); // ribbed radiator plate
  addRot(grp, box(0.006, 0.09, 0.14), C(s, 'dark'), -0.24, 0.0, -0.36, 0.0, 0.0, -0.5); // smaller port fin (mismatched)

  // ── L. LIGHTS, BEACONS & RCS ─────────────────────────────────────────────────
  runningLights(grp, s, 0.19, 0.0, 0.22);
  runningLights(grp, s, 0.16, -0.02, -0.46);
  grp.add(part(sph(0.018, 6), NAV(s, 'star'), 0.2, 0.14, -0.28)); // orange beacon on the pile
  grp.add(part(sph(0.014, 6), NAV(s, 'star'), -0.22, 0.06, 0.2)); // orange beacon on the wreck
  grp.add(part(sph(0.012, 6), GLOW(s), 0.06, 0.15, 0.3)); // stray spark at a bad weld
  rcsQuad(grp, s, 0.13, 0.06, 0.26, 0.012);
  rcsQuad(grp, s, -0.13, -0.05, -0.4, 0.012);

  return grp;
}

// ===========================================================================
// BESPOKE STATIONS — detailed scavenged, asymmetric JUNK builds. Builders return
// a raw group(); createStation() bakes it (and keeps userData.spin separate).
// ===========================================================================

// One rim ARM of the habitat wheel: an uneven spoke (doubled by an orange cable),
// a MISMATCHED module at the rim (box / drum / blistered crate by `i`), a dark
// weld clamp, and orange-lit windows. Added to the spinning `wheel` group in its
// LOCAL XY plane (z≈0) so the whole wheel stays coaxial with the spin axis.
function carRingArm(s, wheel, a, R, i) {
  const cx = Math.cos(a) * R;
  const cy = Math.sin(a) * R;
  const cols = ['hull', 'hull2', 'accent', 'hull', 'dark', 'hull2', 'accent'];
  const col = cols[i % cols.length];

  const sw = 0.04 + (i % 3) * 0.016;
  addRot(wheel, box(sw, R - 0.06, sw), C(s, 'dark'), cx * 0.52, cy * 0.52, 0, 0, 0, a + Math.PI / 2); // uneven spoke
  addRot(wheel, box(0.012, R - 0.06, 0.012), ACC(s), cx * 0.5 + 0.024, cy * 0.5, 0.036, 0, 0, a + Math.PI / 2); // orange tension cable

  const t = i % 3;
  const sz = 0.19 + (i % 4) * 0.034;
  const nx = Math.cos(a);
  const ny = Math.sin(a);
  if (t === 0) {
    addRot(wheel, box(sz, sz * 0.86, 0.22), C(s, col), cx, cy, 0, 0, 0, a + 0.16); // canted cabin box
    wheel.add(part(box(sz * 0.95, 0.02, 0.23), C(s, 'dark'), cx, cy + sz * 0.46, 0)); // roof plate
  } else if (t === 1) {
    addRot(wheel, cyl(sz * 0.56, sz * 0.62, 0.24, 8), C(s, col), cx, cy, 0, Math.PI / 2, 0, 0); // drum-can pod
    addRot(wheel, cyl(sz * 0.64, sz * 0.64, 0.024, 8), C(s, 'dark'), cx, cy, 0.115, Math.PI / 2, 0, 0); // end band
  } else {
    addRot(wheel, box(sz * 0.96, sz * 0.96, 0.2), C(s, col), cx, cy, 0, 0, 0, a - 0.22); // crate cabin
    wheel.add(part(sph(sz * 0.5, 5), C(s, 'hull2'), cx, cy, 0.11)); // bolted-on blister dome
  }
  addRot(wheel, box(sz * 0.56, sz * 0.46, 0.26), C(s, 'dark'), cx * 0.9, cy * 0.9, 0, 0, 0, a); // dark weld clamp

  for (const wo of [-0.055, 0.055]) {
    wheel.add(part(box(0.028, 0.03, 0.05), GLOW(s), cx + nx * (sz * 0.5) - ny * wo, cy + ny * (sz * 0.5) + nx * wo, 0.02)); // window
  }
  wheel.add(part(box(0.034, 0.034, 0.008), GLOW(s), cx - ny * 0.02, cy + nx * 0.02, 0.11)); // z-face porthole
}

// RING (home HUB, biggest) — a captured lumpy ASTEROID (overlapping low-poly
// spheres, off-centre) crusted with MANY mismatched welded modules / tanks /
// containers / salvaged ship-bits bunched lopsidedly, exposed orange pipes,
// crooked patch plates, greeble clutter, scavenged dishes + antenna masts, orange
// beacons — plus a crude welded habitat WHEEL bolted onto the +Z axle (default Z
// spin, coaxial → clear of the rock). Nothing about it is symmetric.
function makeCartelRing(s) {
  const grp = group();

  // A. CAPTURED LUMPY ASTEROID CORE
  grp.add(part(sph(0.5, 6), C(s, 'hull2'), 0, 0, 0)); // main mass
  grp.add(part(sph(0.34, 6), C(s, 'hull'), 0.28, 0.17, -0.05));
  grp.add(part(sph(0.3, 5), C(s, 'dark'), -0.24, -0.18, 0.11));
  grp.add(part(sph(0.27, 6), C(s, 'hull'), 0.09, -0.31, 0.16));
  grp.add(part(sph(0.22, 5), C(s, 'hull2'), -0.15, 0.35, -0.02));
  grp.add(part(sph(0.2, 5), C(s, 'dark'), 0.36, -0.08, 0.22));
  grp.add(part(sph(0.17, 5), C(s, 'hull'), -0.33, 0.05, -0.22));

  // B. ROCK DETAIL — flat dark crater discs + jagged spikes
  addRot(grp, cyl(0.12, 0.1, 0.02, 7), C(s, 'dark'), -0.02, 0.44, 0.02, 0.3, 0, 0.1);
  addRot(grp, cyl(0.09, 0.07, 0.02, 6), C(s, 'dark'), -0.34, -0.02, 0.26, 0, Math.PI / 2 - 0.3, 0);
  addRot(grp, cyl(0.07, 0.055, 0.02, 6), C(s, 'dark'), 0.14, -0.36, 0.14, Math.PI / 2 - 0.2, 0, 0);
  addRot(grp, cone(0.06, 0.16, 5), C(s, 'hull'), -0.4, 0.2, 0.02, 0, 0, 1.1);
  addRot(grp, cone(0.05, 0.13, 5), C(s, 'hull2'), -0.12, -0.42, -0.1, -0.5, 0, 0.2);
  for (const [gx, gy, gz] of [[0.3, 0.3, 0.18], [-0.28, 0.24, 0.2], [-0.2, -0.3, -0.1]]) greeble(grp, s, 'dark', gx, gy, gz, 0.05, 0.04, 0.03);

  // C. CRUSTED JUNK — mismatched welded modules / tanks / containers, lopsided +X/+Y
  addRot(grp, box(0.32, 0.26, 0.28), C(s, 'accent'), 0.5, 0.2, 0.02, 0.12, 0.2, -0.16);
  addRot(grp, box(0.2, 0.024, 0.3), C(s, 'dark'), 0.5, 0.34, 0.02, 0.12, 0.2, -0.16); // lid plate
  addRot(grp, cyl(0.13, 0.15, 0.44, 8), C(s, 'hull'), 0.56, -0.14, 0.15, Math.PI / 2 + 0.2, 0.1, 0.0); // fat drum tank
  addRot(grp, cyl(0.155, 0.155, 0.02, 10), C(s, 'dark'), 0.56, -0.14, 0.35, Math.PI / 2 + 0.2, 0.1, 0.0);
  addRot(grp, cyl(0.14, 0.14, 0.02, 10), C(s, 'dark'), 0.56, -0.14, -0.05, Math.PI / 2 + 0.2, 0.1, 0.0);
  addRot(grp, box(0.24, 0.22, 0.3), C(s, 'hull2'), 0.34, 0.42, -0.16, 0.0, 0.16, 0.22); // second container (top)
  addRot(grp, box(0.18, 0.16, 0.18), C(s, 'accent'), 0.13, 0.46, 0.16, 0.18, 0.0, -0.2); // stacked crate
  grp.add(part(sph(0.15, 6), C(s, 'hull'), 0.5, 0.36, -0.08)); // spherical fuel tank
  addRot(grp, cyl(0.157, 0.157, 0.016, 10), C(s, 'dark'), 0.5, 0.36, -0.08, 0, 0, 0.4);
  grp.add(part(box(0.04, 0.05, 0.04), C(s, 'accent'), 0.5, 0.5, -0.08)); // fuel-tank valve cap
  grp.add(part(sph(0.1, 5), C(s, 'hull2'), 0.64, 0.05, -0.16)); // small satellite tank
  addRot(grp, box(0.14, 0.13, 0.16), C(s, 'hull'), 0.62, -0.02, 0.32, 0.2, -0.24, 0.16); // welded junk box (+Z)
  addRot(grp, cyl(0.1, 0.11, 0.3, 7), C(s, 'hull2'), -0.5, 0.16, -0.06, Math.PI / 2 - 0.15, 0.0, 0.12); // lone port drum
  addRot(grp, box(0.16, 0.14, 0.14), C(s, 'accent'), -0.44, -0.24, 0.02, 0.1, 0.2, -0.24); // lone port crate
  addRot(grp, box(0.11, 0.1, 0.12), C(s, 'hull2'), 0.66, 0.24, 0.08, 0.14, -0.1, 0.2);
  addRot(grp, box(0.09, 0.12, 0.1), C(s, 'accent'), 0.4, 0.06, 0.36, 0.0, 0.2, -0.16);
  addRot(grp, box(0.1, 0.09, 0.11), C(s, 'hull'), 0.24, 0.4, 0.12, 0.2, 0.0, 0.1);
  addRot(grp, box(0.2, 0.18, 0.17), C(s, 'hull2'), -0.14, -0.05, 0.42, 0.1, 0.22, 0.14); // front-face module
  addRot(grp, box(0.03, 0.19, 0.18), C(s, 'accent'), -0.24, -0.05, 0.44, 0.1, 0.22, 0.14); // its end plate
  addRot(grp, box(0.15, 0.13, 0.14), C(s, 'accent'), -0.38, -0.28, 0.12, 0.14, 0.2, -0.2); // port-belly crate
  addRot(grp, cyl(0.09, 0.1, 0.26, 7), C(s, 'hull'), 0.06, -0.46, 0.04, Math.PI / 2 + 0.1, 0.1, 0.1); // belly drum
  addRot(grp, box(0.12, 0.11, 0.12), C(s, 'hull2'), -0.42, 0.32, 0.06, 0.2, 0.1, 0.16); // port-top crate

  // D. SALVAGED SHIP-BITS — a broken ship nose cone + a dead engine bell
  addRot(grp, cone(0.1, 0.28, 7), C(s, 'accent'), 0.36, -0.28, 0.3, Math.PI / 2 - 0.4, 0.3, 0.0); // wrecked ship nose
  addRot(grp, cyl(0.05, 0.07, 0.1, 6), C(s, 'dark'), 0.36, -0.24, 0.16, Math.PI / 2 - 0.4, 0.3, 0.0); // severed collar
  addRot(grp, cyl(0.14, 0.09, 0.18, 8), C(s, 'dark'), 0.24, -0.36, -0.22, Math.PI / 2 + 0.2, 0.16, 0.0); // dead engine bell
  addRot(grp, cyl(0.09, 0.09, 0.02, 8), C(s, 'hull2'), 0.24, -0.36, -0.31, Math.PI / 2 + 0.2, 0.16, 0.0); // bell throat ring

  // E. CROOKED PATCH PLATES
  addRot(grp, box(0.34, 0.02, 0.28), C(s, 'hull'), 0.28, 0.36, 0.06, 0.0, 0.0, -0.16);
  addRot(grp, box(0.22, 0.02, 0.2), C(s, 'hull2'), -0.18, 0.28, 0.16, 0.12, 0.1, 0.14);
  addRot(grp, box(0.02, 0.24, 0.26), C(s, 'accent'), 0.62, 0.02, 0.06, 0.0, 0.12, 0.1);
  addRot(grp, box(0.24, 0.02, 0.18), C(s, 'accent'), 0.16, -0.36, 0.2, 0.14, 0.0, 0.16);
  panelZ(grp, s, 0.5, 0.3, 0.02, 0.24);
  panelX(grp, s, 0.34, 0.4, -0.02, 0.2);

  // F. EXPOSED ORANGE PIPES
  addRot(grp, cyl(0.022, 0.022, 0.92, 6), ACC(s), 0.34, 0.22, 0.1, 0.5, 0.3, 0.2);
  addRot(grp, cyl(0.018, 0.018, 0.66, 6), ACC(s), 0.5, -0.06, 0.08, Math.PI / 2 + 0.3, 0.1, 0.4);
  addRot(grp, cyl(0.016, 0.016, 0.5, 6), ACC(s), 0.32, 0.44, -0.06, Math.PI / 2 - 0.1, 0.2, 0.9);
  addRot(grp, cyl(0.015, 0.015, 0.44, 6), ACC(s), -0.36, 0.12, 0.06, Math.PI / 2 + 0.2, 0.0, -0.2);
  addRot(grp, cyl(0.013, 0.013, 0.36, 6), ACC(s), 0.58, 0.14, -0.02, 0.4, 0.2, 0.5);
  addRot(grp, box(0.03, 0.07, 0.04), C(s, 'dark'), 0.52, 0.28, 0.0, 0.0, 0.0, 0.2); // pipe clamp bracket
  grp.add(part(sph(0.026, 6), ACC(s), 0.42, 0.12, 0.2)); // valve wheel

  // G. SCAVENGED DISHES + ANTENNA MASTS (masts rise +Y, in the z≈0 plane)
  dish(grp, s, 0.3, 0.42, 0.22, 0.17, 0.55);
  dish(grp, s, -0.36, 0.1, -0.16, 0.12, -0.6);
  antenna(grp, s, -0.1, 0.5, -0.14, 0.34);
  antenna(grp, s, 0.44, 0.32, 0.18, 0.22);
  antenna(grp, s, -0.42, 0.28, 0.12, 0.18);

  // H. ORANGE BEACONS / SLIT-LIGHTS
  grp.add(part(sph(0.055, 6), NAV(s, 'star'), 0.12, 0.62, 0.06));
  grp.add(part(sph(0.04, 6), NAV(s, 'star'), 0.68, 0.26, 0.08));
  grp.add(part(sph(0.036, 6), NAV(s, 'star'), -0.5, 0.18, -0.18));
  grp.add(part(sph(0.03, 6), NAV(s, 'star'), 0.34, -0.42, 0.16));
  for (const [wx, wy, wz] of [[0.66, 0.02, 0.12], [0.36, 0.5, -0.14], [-0.36, -0.1, 0.28], [0.5, -0.3, -0.02]]) grp.add(part(box(0.05, 0.03, 0.02), GLOW(s), wx, wy, wz));

  // I. DOCKING GANTRY off the −X side with a docked shuttle
  addRot(grp, box(0.46, 0.03, 0.03), C(s, 'accent'), -0.62, -0.1, 0.1, 0.0, 0.2, 0.12); // gantry boom
  addRot(grp, box(0.05, 0.09, 0.12), C(s, 'dark'), -0.82, -0.12, 0.18, 0.0, 0.2, 0.12); // clamp head
  addRot(grp, box(0.14, 0.1, 0.2), C(s, 'hull2'), -0.9, -0.1, 0.22, 0.05, 0.3, 0.1); // small docked shuttle
  addRot(grp, cone(0.05, 0.12, 6), C(s, 'accent'), -0.9, -0.1, 0.34, Math.PI / 2 - 0.2, 0.3, 0.0); // shuttle nose
  grp.add(part(box(0.03, 0.02, 0.02), GLOW(s), -0.86, -0.06, 0.28)); // shuttle window
  grp.add(part(sph(0.028, 6), NAV(s, 'port'), -0.82, -0.05, 0.18)); // red approach light

  // J. AXLE — a stubby boom off the +Z face carrying the habitat wheel (static)
  addRot(grp, cyl(0.05, 0.06, 0.55, 8), C(s, 'dark'), 0.0, 0.0, 0.7, Math.PI / 2); // axle boom
  addRot(grp, cyl(0.1, 0.1, 0.05, 10), C(s, 'hull2'), 0.0, 0.0, 0.5, Math.PI / 2); // root collar on the rock
  addRot(grp, cyl(0.085, 0.085, 0.04, 10), C(s, 'dark'), 0.0, 0.0, 0.9, Math.PI / 2); // bearing collar at the hub
  for (const ba of [0.7, 2.4, 4.4]) addRot(grp, box(0.02, 0.34, 0.02), C(s, 'hull'), Math.cos(ba) * 0.12, Math.sin(ba) * 0.12, 0.6, 0, 0, Math.PI / 2); // support braces
  addRot(grp, cyl(0.014, 0.014, 0.5, 6), ACC(s), 0.06, 0.05, 0.66, Math.PI / 2 + 0.1, 0.1, 0.0); // orange power line

  // K. SPINNING HABITAT WHEEL — mismatched modules on UNEVEN spokes; offset to
  // z=+0.98 so its spin plane clears the rock. Default Z spin (rickety Ferris ring).
  const wheel = group();
  const R = 0.64;
  const angles = [0.0, 0.82, 1.7, 2.46, 3.24, 4.15, 5.35]; // UNEVEN spacing
  addRot(wheel, cyl(0.16, 0.16, 0.18, 8), C(s, 'hull2'), 0, 0, 0, Math.PI / 2); // hub drum
  addRot(wheel, cyl(0.19, 0.19, 0.03, 10), C(s, 'dark'), 0, 0, 0.1, Math.PI / 2); // hub face plate
  addRot(wheel, cyl(0.19, 0.19, 0.03, 10), C(s, 'dark'), 0, 0, -0.1, Math.PI / 2); // hub face plate (back)
  wheel.add(part(box(0.08, 0.08, 0.05), C(s, 'accent'), 0, 0, 0.14)); // hub cap greeble
  angles.forEach((a, i) => carRingArm(s, wheel, a, R, i));
  for (let i = 0; i < angles.length; i++) {
    const a0 = angles[i];
    const a1 = angles[(i + 1) % angles.length] + (i === angles.length - 1 ? Math.PI * 2 : 0);
    const am = (a0 + a1) / 2;
    const seg = 2 * R * Math.sin((a1 - a0) / 2);
    addRot(wheel, box(0.04, seg, 0.06), C(s, i % 2 ? 'dark' : 'hull'), Math.cos(am) * R, Math.sin(am) * R, 0, 0, 0, am + Math.PI / 2); // rim chord
    addRot(wheel, box(0.014, seg * 0.92, 0.016), ACC(s), Math.cos(am) * R, Math.sin(am) * R, 0.036, 0, 0, am + Math.PI / 2); // orange rim strip
    addRot(wheel, box(0.024, R * 0.62, 0.024), C(s, 'dark'), Math.cos(am) * R * 0.66, Math.sin(am) * R * 0.66, 0, 0, 0, am); // inner brace
  }
  for (const i of [0, 3, 5]) wheel.add(part(sph(0.038, 6), NAV(s, 'star'), Math.cos(angles[i]) * (R + 0.03), Math.sin(angles[i]) * (R + 0.03), 0.12));
  wheel.position.set(0, 0, 0.98); // bolt onto the +Z axle — clear of the core
  grp.add(wheel);
  grp.userData.spin = wheel;

  return grp;
}

// A salvaged shipping CONTAINER sub-group: the box, corrugation ribs down its two
// long (±X) faces, a dark top weld band and a grubby orange-lit hatch (+Z face).
function carOutCrate(s, slot, w, h, d, ribs = 3) {
  const c = group();
  c.add(part(box(w, h, d), C(s, slot), 0, 0, 0)); // container body
  for (let i = 0; i < ribs; i++) {
    const z = -d / 2 + (d * (i + 0.5)) / ribs;
    c.add(part(box(0.01, h * 0.9, 0.022), C(s, 'dark'), w / 2 + 0.004, 0, z)); // +X face rib
    c.add(part(box(0.01, h * 0.9, 0.022), C(s, 'dark'), -w / 2 - 0.004, 0, z)); // -X face rib
  }
  c.add(part(box(w * 1.02, 0.022, d * 1.02), C(s, 'dark'), 0, h / 2, 0)); // top weld band
  c.add(part(box(w * 0.36, h * 0.32, 0.006), C(s, 'glass'), w * 0.08, -h * 0.06, d / 2 + 0.003)); // orange hatch
  return c;
}

// A crude SCAVENGED gun stub welded on at an ODD angle (own sub-group).
function carOutGun(grp, s, x, y, z, r, len, rx = 0, ry = 0, rz = 0, hot = false) {
  const gun = group();
  gun.add(part(box(r * 3.0, r * 2.6, r * 2.0), C(s, 'dark'), 0, 0, -len * 0.22)); // breech clamp
  gun.add(part(box(r * 2.2, r * 2.2, r * 0.8), C(s, 'hull2'), 0, 0, 0)); // welded collar
  addRot(gun, cyl(r, r * 0.85, len, 6), C(s, 'dark'), 0, 0, len * 0.5, Math.PI / 2); // barrel tube
  addRot(gun, cyl(r * 1.5, r * 1.15, r * 1.3, 6), ACC(s), 0, 0, len, Math.PI / 2); // orange muzzle brake
  if (hot) gun.add(part(sph(r * 0.8, 6), GLOW(s), 0, 0, len + r * 0.65)); // charged bore glow
  gun.position.set(x, y, z);
  gun.rotation.set(rx, ry, rz);
  grp.add(gun);
}

// OUTPOST — a cobbled JUNK waystation: a crooked cluster of MISMATCHED welded
// cargo containers + salvaged tanks/pods bunched lopsidedly, crooked patch plates,
// exposed ORANGE pipes + valves + greeble clutter — with a rickety welded docking
// GANTRY reaching +Z to an orange-lit collar, a scavenged dish + antenna masts,
// two crude gun stubs, orange slit-lights + beacons. Up = +Y. NOTHING symmetric.
function makeCartelOutpost(s) {
  const grp = group();
  const weld = (child, x, y, z, rx = 0, ry = 0, rz = 0) => {
    child.position.set(x, y, z);
    child.rotation.set(rx, ry, rz);
    grp.add(child);
  };

  // A. CROOKED CLUSTER OF MISMATCHED WELDED CONTAINERS
  weld(carOutCrate(s, 'hull', 0.46, 0.42, 0.52, 4), 0.0, 0.0, 0.0, 0.03, 0.05, 0.06); // big core can
  weld(carOutCrate(s, 'accent', 0.32, 0.3, 0.38, 3), 0.28, 0.3, -0.05, 0.12, 0.16, -0.22); // up-starboard
  weld(carOutCrate(s, 'hull2', 0.3, 0.26, 0.34, 3), -0.2, -0.05, 0.16, 0.07, -0.12, 0.16); // low forward-port

  // B. SALVAGED TANKS / PODS — different SHAPES + SIZES, welded lopsided
  addRot(grp, cyl(0.17, 0.19, 0.44, 8), C(s, 'hull'), -0.29, 0.06, -0.1, Math.PI / 2 + 0.12, 0.1, 0.0); // big port drum
  addRot(grp, cyl(0.2, 0.2, 0.02, 10), C(s, 'dark'), -0.24, 0.11, 0.06, Math.PI / 2 + 0.12, 0.1, 0.0);
  addRot(grp, cyl(0.2, 0.2, 0.02, 10), C(s, 'dark'), -0.34, 0.01, -0.26, Math.PI / 2 + 0.12, 0.1, 0.0);
  grp.add(part(box(0.05, 0.055, 0.05), C(s, 'dark'), -0.29, 0.24, -0.1)); // dome valve cap
  grp.add(part(sph(0.19, 8), C(s, 'hull2'), 0.11, 0.35, 0.13)); // fat sphere storage tank
  addRot(grp, cyl(0.2, 0.2, 0.016, 12), C(s, 'dark'), 0.11, 0.35, 0.13, Math.PI / 2);
  grp.add(part(box(0.05, 0.05, 0.05), C(s, 'accent'), 0.11, 0.52, 0.13)); // top valve block
  addRot(grp, cyl(0.12, 0.14, 0.34, 7), C(s, 'hull'), -0.1, -0.34, 0.08, Math.PI / 2 + 0.2, 0.14, 0.0); // hanging pod
  addRot(grp, cyl(0.14, 0.14, 0.02, 7), C(s, 'dark'), -0.16, -0.42, -0.16, Math.PI / 2 + 0.2, 0.14, 0.0); // end cap
  for (const z of [-0.06, 0.02, 0.1]) grp.add(part(box(0.006, 0.01, 0.012), GLOW(s), -0.02, -0.32, z)); // portholes

  // C. WELD COLLARS straddling the seams
  addRot(grp, box(0.26, 0.24, 0.03, 1), C(s, 'dark'), 0.16, 0.16, -0.03, 0.08, 0.12, -0.14);
  addRot(grp, box(0.24, 0.03, 0.24), C(s, 'dark'), -0.1, 0.2, 0.06, 0.0, 0.1, 0.1);
  addRot(grp, box(0.03, 0.22, 0.2), C(s, 'hull2'), -0.24, 0.0, 0.05, 0.0, 0.12, 0.0);

  // D. CROOKED PATCH PLATES
  addRot(grp, box(0.34, 0.02, 0.3), C(s, 'hull'), 0.02, 0.24, 0.1, 0.0, 0.1, -0.12);
  addRot(grp, box(0.22, 0.02, 0.26), C(s, 'accent'), 0.18, 0.14, 0.24, 0.14, 0.0, 0.16);
  addRot(grp, box(0.2, 0.02, 0.24), C(s, 'hull2'), -0.12, -0.16, -0.12, 0.15, 0.0, 0.22);
  panelZ(grp, s, 0.08, 0.22, 0.02, 0.3);
  panelX(grp, s, -0.02, 0.22, 0.1, 0.22);

  // E. GREEBLE CLUTTER
  addRot(grp, box(0.11, 0.1, 0.1), C(s, 'accent'), 0.34, 0.5, 0.05, 0.14, -0.2, 0.24);
  addRot(grp, box(0.08, 0.09, 0.07), C(s, 'hull2'), 0.42, 0.34, -0.14, 0.1, 0.2, -0.16);
  greeble(grp, s, 'dark', -0.14, 0.28, -0.06, 0.09, 0.07, 0.06);
  greeble(grp, s, 'dark', 0.06, -0.02, 0.28, 0.07, 0.05, 0.04);
  greeble(grp, s, 'hull2', 0.24, -0.14, 0.06, 0.06, 0.05, 0.08);
  addRot(grp, box(0.04, 0.24, 0.03), C(s, 'dark'), 0.42, 0.2, 0.0, 0.0, 0.0, 0.16); // clamp bracket
  addRot(grp, box(0.03, 0.2, 0.03), C(s, 'dark'), -0.22, 0.18, -0.16, 0.1, 0.0, -0.14);
  for (const z of [-0.12, -0.02, 0.08]) greeble(grp, s, 'dark', -0.24, 0.16, z, 0.02, 0.02, 0.024); // rivet studs

  // F. EXPOSED ORANGE PIPES + valve wheels
  addRot(grp, cyl(0.017, 0.017, 0.62, 6), ACC(s), 0.16, 0.19, 0.02, Math.PI / 2 + 0.05, 0.0, 0.06);
  addRot(grp, cyl(0.014, 0.014, 0.46, 6), ACC(s), -0.17, 0.04, 0.02, Math.PI / 2, 0.08, 0.0);
  addRot(grp, cyl(0.01, 0.01, 0.3, 6), ACC(s), 0.24, 0.28, -0.08, 0.4, 0.2, 0.9);
  addRot(grp, cyl(0.01, 0.01, 0.24, 6), ACC(s), -0.06, -0.14, 0.14, Math.PI / 2 - 0.2, 0.0, 0.3);
  addRot(grp, cyl(0.009, 0.009, 0.2, 6), ACC(s), 0.2, 0.04, 0.22, 0.9, 0.3, 0.4);
  grp.add(part(sph(0.026, 6), ACC(s), 0.11, 0.44, 0.13));
  grp.add(part(sph(0.022, 6), ACC(s), -0.29, 0.18, 0.02));
  grp.add(part(sph(0.02, 6), ACC(s), 0.16, 0.28, 0.18));
  addRot(grp, box(0.035, 0.06, 0.04), C(s, 'dark'), 0.2, 0.1, 0.24, 0.0, 0.0, 0.2); // pipe bracket

  // G. RICKETY DOCKING GANTRY reaching +Z → an ORANGE-LIT collar
  const gantry = group();
  const GL = 0.62;
  gantry.add(part(box(0.028, 0.028, GL), C(s, 'hull2'), -0.075, -0.02, 0.0)); // lower-port rail
  gantry.add(part(box(0.028, 0.028, GL), C(s, 'hull'), 0.075, -0.02, 0.0)); // lower-star rail
  gantry.add(part(box(0.028, 0.028, GL * 0.92), C(s, 'dark'), 0.0, 0.055, 0.02)); // top chord
  for (const z of [-0.22, -0.09, 0.04, 0.17]) {
    addRot(gantry, box(0.16, 0.013, 0.013), C(s, 'hull2'), 0.0, -0.02, z, 0, 0, z > 0 ? 0.55 : -0.55); // cross-brace
    addRot(gantry, box(0.013, 0.11, 0.013), C(s, 'dark'), 0.0, 0.02, z, 0.5, 0, 0); // vertical tie
  }
  addRot(gantry, cyl(0.008, 0.008, GL, 6), ACC(s), 0.055, -0.05, 0.0, Math.PI / 2, 0.0, 0.0); // exposed pipe
  const cz = GL / 2 + 0.02;
  addRot(gantry, cyl(0.13, 0.15, 0.07, 8), C(s, 'hull2'), 0, 0, cz, Math.PI / 2); // collar ring
  addRot(gantry, cyl(0.1, 0.1, 0.1, 8), C(s, 'dark'), 0, 0, cz + 0.02, Math.PI / 2); // dock throat
  addRot(gantry, cyl(0.145, 0.145, 0.014, 8), ACC(s), 0, 0, cz + 0.055, Math.PI / 2); // orange guide ring
  addRot(gantry, cyl(0.05, 0.045, 0.03, 8), GLOW(s), 0, 0, cz + 0.06, Math.PI / 2); // orange throat glow
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    gantry.add(part(box(0.03, 0.03, 0.08), C(s, 'dark'), Math.cos(a) * 0.12, Math.sin(a) * 0.12, cz)); // berthing latch
  }
  navLight(gantry, s, 'star', 0.12, 0.0, cz + 0.02, 0.016);
  navLight(gantry, s, 'top', -0.06, 0.11, cz + 0.02, 0.014);
  navLight(gantry, s, 'star', -0.11, -0.06, cz + 0.02, 0.012);
  weld(gantry, 0.06, -0.06, 0.32, 0.0, 0.18, -0.08);

  // H. SCAVENGED SENSOR DISH + ANTENNA MASTS
  const mast = group();
  dish(mast, s, 0, 0, 0, 0.17, 0.34);
  mast.position.set(-0.04, 0.44, -0.14);
  mast.rotation.set(0.16, 0.24, -0.42);
  grp.add(mast);
  antenna(grp, s, 0.32, 0.56, 0.02, 0.24);
  antenna(grp, s, -0.02, 0.46, -0.16, 0.16);
  greeble(grp, s, 'accent', 0.02, 0.42, -0.18, 0.06, 0.04, 0.05);

  // I. TWO CRUDE SALVAGED GUN STUBS
  carOutGun(grp, s, 0.44, 0.28, 0.06, 0.03, 0.28, 0.1, 0.7, 0.0, true); // bigger, out +X
  carOutGun(grp, s, -0.14, -0.02, 0.28, 0.02, 0.18, 0.24, -0.12, 0.0); // smaller, low forward-port

  // J. LIGHTS
  for (const [x, y, z] of [[0.24, 0.06, 0.27], [-0.18, 0.1, 0.18], [0.28, 0.44, 0.0]]) grp.add(part(box(0.05, 0.016, 0.008), GLOW(s), x, y, z));
  grp.add(part(sph(0.03, 6), NAV(s, 'star'), 0.42, 0.58, 0.05));
  grp.add(part(sph(0.024, 6), NAV(s, 'star'), -0.32, 0.2, -0.14));
  grp.add(part(box(0.024, 0.34, 0.024), C(s, 'accent'), 0.16, 0.5, -0.1)); // crooked beacon mast
  grp.add(part(sph(0.045, 6), NAV(s, 'star'), 0.16, 0.7, -0.1));

  return grp;
}

// A scavenged fuel DRUM welded onto the rig (own sub-group so it cants as one
// weld): a rusty barrel with two dark seam bands, a valve cap and an orange
// valve wheel, plus a rusty gauge stripe.
function carSkimmerDrum(grp, s, slot, x, y, z, r, h, rx = 0, ry = 0, rz = 0) {
  const d = group();
  d.add(part(cyl(r, r, h, 8), C(s, slot), 0, 0, 0)); // drum body
  d.add(part(cyl(r * 1.08, r * 1.08, h * 0.1, 8), C(s, 'dark'), 0, h * 0.32, 0)); // upper seam band
  d.add(part(cyl(r * 1.08, r * 1.08, h * 0.1, 8), C(s, 'dark'), 0, -h * 0.32, 0)); // lower seam band
  d.add(part(box(r * 0.7, r * 0.34, r * 0.5), C(s, 'dark'), 0, h * 0.5 + r * 0.1, 0)); // valve cap block
  d.add(part(sph(r * 0.2, 6), ACC(s), 0, h * 0.5 + r * 0.32, 0)); // orange valve wheel
  d.add(part(box(r * 0.16, h * 0.72, r * 1.14), ACC(s), 0, 0, 0)); // rusty gauge stripe
  d.position.set(x, y, z);
  d.rotation.set(rx, ry, rz);
  grp.add(d);
}

// COLLECTOR (gas skimmer) — a cobbled Cartel junk fuel-siphon rig. A rusty ragged
// intake FUNNEL flares its wide mouth DOWN (-Y) with a hot ORANGE mouth-ring +
// ragged teeth, feeding up through a patched throat into an OFF-CENTRE patched
// main tank crusted with MISMATCHED welded drums, pump housings + valve greebles,
// a tangle of exposed ORANGE pipes, crooked patch plates, a scavenged dish +
// antenna masts and orange beacons. Junk bunched to STARBOARD. UP = +Y, intake -Y.
function makeCartelCollector(s) {
  const grp = group();

  // A. OFF-CENTRE PATCHED MAIN STORAGE TANK — a big rusty drum, shoved +X
  addRot(grp, cyl(0.3, 0.33, 0.46, 12), C(s, 'hull2'), 0.06, 0.34, 0.0, 0, 0, 0.04); // tank body
  grp.add(part(cyl(0.34, 0.34, 0.045, 12), C(s, 'dark'), 0.06, 0.5, 0.0)); // top rim band
  grp.add(part(cyl(0.35, 0.35, 0.035, 12), C(s, 'accent'), 0.062, 0.19, 0.0)); // lower hazard band
  grp.add(part(cyl(0.335, 0.335, 0.025, 12), C(s, 'dark'), 0.06, 0.35, 0.0)); // mid strap band
  grp.add(part(dome(0.31), C(s, 'hull'), 0.06, 0.5, 0.0)); // domed top cap
  addRot(grp, box(0.18, 0.06, 0.15), C(s, 'dark'), -0.08, 0.6, 0.08, 0.12, 0.25, -0.14); // crooked crate on the dome
  grp.add(part(box(0.09, 0.07, 0.09), C(s, 'hull2'), 0.08, 0.65, -0.02)); // dome vent block
  addRot(grp, box(0.02, 0.24, 0.2), C(s, 'hull'), -0.28, 0.36, 0.08, 0.0, 0.12, 0.12); // patch plate
  addRot(grp, box(0.02, 0.2, 0.15), C(s, 'accent'), -0.26, 0.3, -0.14, 0.0, -0.14, -0.1);
  addRot(grp, box(0.16, 0.02, 0.2), C(s, 'hull2'), 0.0, 0.55, 0.16, 0.1, 0.0, -0.12); // roof patch
  panelZ(grp, s, 0.06, 0.51, -0.18, 0.38);
  grp.add(part(box(0.012, 0.34, 0.012), ACC(s), -0.24, 0.42, 0.18)); // gauge riser

  // B. PATCHED THROAT
  addRot(grp, cyl(0.14, 0.2, 0.3, 10), C(s, 'hull'), 0.03, -0.02, 0.0, 0, 0, -0.05);
  grp.add(part(cyl(0.21, 0.21, 0.035, 10), C(s, 'dark'), 0.03, 0.11, 0.0)); // upper collar
  grp.add(part(cyl(0.155, 0.155, 0.03, 10), ACC(s), 0.02, -0.14, 0.0)); // rusty lower ring
  addRot(grp, box(0.14, 0.22, 0.012), C(s, 'accent'), 0.2, -0.02, 0.05, 0.15, 0.45, 0.1); // patch weld
  addRot(grp, box(0.11, 0.17, 0.012), C(s, 'hull2'), -0.15, 0.0, -0.07, 0.1, -0.35, -0.12);

  // C. RAGGED INTAKE FUNNEL — wide mouth flaring DOWN (-Y)
  addRot(grp, cone(0.38, 0.46, 12), C(s, 'hull2'), 0.0, -0.37, 0.0, 0.03, 0, 0.04); // funnel shell
  grp.add(part(cyl(0.4, 0.4, 0.045, 12), C(s, 'dark'), 0.0, -0.57, 0.0)); // dark mouth rim
  grp.add(part(cyl(0.37, 0.37, 0.03, 12), ACC(s), 0.0, -0.59, 0.0)); // ORANGE mouth-ring
  addRot(grp, cyl(0.26, 0.15, 0.18, 12), C(s, 'dark'), 0.0, -0.45, 0.0, Math.PI, 0, 0); // recessed inner throat
  grp.add(part(cyl(0.2, 0.2, 0.016, 12), GLOW(s), 0.0, -0.53, 0.0)); // orange glow disc
  grp.add(part(sph(0.12, 7), GLOW(s), 0.0, -0.44, 0.0)); // recessed intake glow
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    const rr = 0.35 + (i % 3) * 0.035;
    const th = 0.09 + (i % 4) * 0.03;
    addRot(grp, box(0.06, 0.028, th), C(s, i % 2 ? 'dark' : 'hull'), Math.cos(a) * rr, -0.575, Math.sin(a) * rr, 0.5, -a, 0); // ragged tooth
  }
  addRot(grp, box(0.22, 0.02, 0.17), C(s, 'accent'), 0.22, -0.33, 0.14, 0.28, 0.45, 0.12); // funnel patch
  addRot(grp, box(0.17, 0.02, 0.14), C(s, 'hull'), -0.19, -0.29, -0.12, 0.22, -0.45, -0.1);
  addRot(grp, box(0.02, 0.16, 0.13), C(s, 'dark'), 0.29, -0.36, -0.06, 0.35, 0.0, 0.1); // dented plate

  // D. THE JUNK CRUST — MISMATCHED welded drums bunched to +X
  carSkimmerDrum(grp, s, 'hull', 0.5, 0.3, 0.05, 0.15, 0.38, Math.PI / 2 + 0.18, 0.1, 0.12); // BIG drum, starboard
  carSkimmerDrum(grp, s, 'accent', 0.44, 0.58, -0.14, 0.1, 0.28, 0.24, 0.0, -0.3); // medium, up-starboard
  carSkimmerDrum(grp, s, 'hull2', 0.42, 0.04, 0.22, 0.078, 0.22, Math.PI / 2 - 0.22, 0.26, 0.12); // small, low starboard
  carSkimmerDrum(grp, s, 'hull', 0.26, -0.02, -0.3, 0.085, 0.2, 0.42, 0.2, -0.32); // stray drum near the throat
  grp.add(part(sph(0.15, 7), C(s, 'hull'), 0.38, 0.62, 0.13)); // BIG sphere tank, top-starboard
  addRot(grp, cyl(0.16, 0.16, 0.02, 10), C(s, 'dark'), 0.38, 0.62, 0.13, Math.PI / 2 + 0.1);
  grp.add(part(box(0.05, 0.06, 0.05), C(s, 'accent'), 0.38, 0.76, 0.13)); // sphere valve block
  grp.add(part(sph(0.09, 6), C(s, 'hull2'), 0.56, 0.44, -0.04)); // small sphere far out
  carSkimmerDrum(grp, s, 'hull2', -0.36, 0.24, 0.03, 0.09, 0.24, Math.PI / 2 - 0.16, 0.0, 0.18); // lone PORT drum

  // E. PUMP HOUSINGS + VALVE GREEBLES
  greeble(grp, s, 'dark', 0.3, 0.14, 0.28, 0.1, 0.13, 0.1);
  grp.add(part(sph(0.032, 6), ACC(s), 0.3, 0.22, 0.28));
  greeble(grp, s, 'dark', 0.42, 0.44, 0.22, 0.08, 0.1, 0.08);
  grp.add(part(sph(0.026, 6), ACC(s), 0.42, 0.51, 0.22));
  greeble(grp, s, 'hull2', -0.26, 0.08, 0.2, 0.09, 0.09, 0.09);
  grp.add(part(sph(0.024, 6), ACC(s), -0.26, 0.15, 0.2));
  greeble(grp, s, 'dark', 0.14, 0.13, -0.28, 0.11, 0.11, 0.09);

  // F. TANGLE OF EXPOSED ORANGE PIPES
  addRot(grp, cyl(0.02, 0.02, 0.82, 6), ACC(s), 0.3, 0.12, 0.2, 0.12, 0.0, 0.06);
  addRot(grp, cyl(0.017, 0.017, 0.64, 6), ACC(s), 0.26, 0.16, -0.2, 0.1, 0.0, -0.06);
  addRot(grp, cyl(0.016, 0.016, 0.5, 6), ACC(s), -0.24, 0.16, 0.14, 0.14, 0.0, -0.07);
  addRot(grp, cyl(0.015, 0.015, 0.46, 6), ACC(s), 0.44, 0.34, 0.0, 0.08, 0.0, 0.22);
  addRot(grp, cyl(0.015, 0.015, 0.4, 6), ACC(s), 0.16, -0.16, 0.26, 0.32, 0.0, 0.1);
  addRot(grp, cyl(0.014, 0.014, 0.34, 6), ACC(s), -0.15, -0.1, -0.16, 0.34, 0.0, -0.1);
  addRot(grp, cyl(0.014, 0.014, 0.24, 6), ACC(s), 0.48, 0.5, 0.02, 0.0, 0.0, 0.5);
  grp.add(part(sph(0.026, 6), ACC(s), 0.32, 0.02, 0.24));
  grp.add(part(sph(0.022, 6), ACC(s), -0.14, 0.24, -0.14));
  addRot(grp, box(0.03, 0.07, 0.045), C(s, 'dark'), 0.46, 0.02, 0.18, 0.0, 0.0, 0.2); // pipe clamp

  // G. RIVET STRIPS + hazard chevron
  for (const yy of [0.24, 0.32, 0.4, 0.48]) greeble(grp, s, 'dark', 0.34, yy, -0.18, 0.012, 0.012, 0.014);
  addRot(grp, box(0.07, 0.012, 0.02), ACC(s), -0.2, 0.5, -0.12, 0, -0.6, 0);
  addRot(grp, box(0.07, 0.012, 0.02), ACC(s), -0.13, 0.5, -0.12, 0, 0.6, 0);

  // H. SCAVENGED DISH, ANTENNA MASTS + ORANGE BEACONS
  dish(grp, s, -0.14, 0.56, -0.16, 0.11, 0.42);
  antenna(grp, s, 0.14, 0.62, 0.14, 0.18);
  antenna(grp, s, -0.05, 0.66, -0.04, 0.13);
  grp.add(part(box(0.03, 0.36, 0.03), C(s, 'accent'), 0.02, 0.74, 0.0)); // central beacon mast
  grp.add(part(sph(0.05, 6), NAV(s, 'star'), 0.02, 0.94, 0.0));
  grp.add(part(sph(0.075, 7), GLOW(s), 0.02, 0.94, 0.0)); // beacon halo
  grp.add(part(sph(0.032, 6), NAV(s, 'star'), 0.46, 0.72, -0.12));
  grp.add(part(sph(0.026, 6), NAV(s, 'star'), 0.36, 0.84, 0.13));
  navLight(grp, s, 'port', -0.35, 0.14, 0.02, 0.014);
  navLight(grp, s, 'star', 0.52, 0.3, 0.05, 0.014);

  return grp;
}
