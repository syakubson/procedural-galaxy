// Alliance — the baseline faction, and the first faction to get its OWN ship
// LINE (stage 8): every role is a bespoke builder in the Alliance "space, not
// airplane" design language — SW Old Republic / Clone Wars (Hammerhead, Venator,
// Republic gunships) + Halo UNSC (blocky functional hulls, MAC prows, comms
// dishes, engine banks). Shared vocabulary: welded blocky segments, a blue
// running-light line, gunmetal steel, radiator panels, cluster engines, command
// BLISTERS (not jet canopies), classic dishes. Small ships (scout/fighter/
// interceptor) carry light engine PILONS; large ships are pure block, no wings.
//   • roles.<id>(style)  — bespoke per-faction silhouette;
//   • station(grp, type, style) — faction station signature.

import {
  C, ACC, GLOW, box, cyl, sph, part, addRot, group,
  navLight, runningLights, antenna,
  barrel, nozzle, panelZ, panelX, greeble, dish, blister, radiatorPanel, rcsQuad, nacelle,
} from './style.js';

// FIGHTER — a Clone-Wars-era Republic starfighter read (ARC-170 / V-19) crossed
// with a Halo Broadsword: a substantial blunt fuselage (NOT a jet dart), a
// command blister instead of a canopy, and two engine nacelles on short pilons —
// the "wings" are engine mounts. Clean, no aero surfaces beyond minimal fins.
function makeAllianceFighter(s) {
  const grp = group();
  grp.add(part(box(0.08, 0.07, 0.2), C(s, 'hull'), 0, 0, -0.02)); // main body
  grp.add(part(box(0.07, 0.06, 0.09), C(s, 'hull2'), 0, 0, 0.11)); // forward body
  grp.add(part(box(0.055, 0.05, 0.06), C(s, 'dark'), 0, -0.004, 0.16)); // blunt nose block
  greeble(grp, s, 'dark', 0, -0.03, 0.15, 0.04, 0.02, 0.04); // chin sensor
  blister(grp, s, 0, 0.04, 0.05, 0.028); // command blister, not a canopy
  grp.add(part(box(0.003, 0.012, 0.24), ACC(s), 0.042, 0.006, -0.02)); // blue line stbd
  grp.add(part(box(0.003, 0.012, 0.24), ACC(s), -0.042, 0.006, -0.02)); // blue line port
  panelZ(grp, s, 0.041, 0.02, -0.02, 0.16);
  panelZ(grp, s, -0.041, 0.02, -0.02, 0.16);
  for (const x of [-1, 1]) {
    grp.add(part(box(0.055, 0.02, 0.06), C(s, 'dark'), x * 0.072, 0, -0.03)); // pilon
    nacelle(grp, s, x * 0.108, 0, -0.03, 0.026, 0.18); // engine nacelle
    const fin = part(box(0.006, 0.05, 0.05), C(s, 'hull2'), x * 0.108, 0.036, -0.1); // minimal canted fin
    fin.rotation.z = x * 0.3;
    grp.add(fin);
    navLight(grp, s, x > 0 ? 'star' : 'port', x * 0.126, 0, 0.02, 0.009);
    barrel(grp, s, x * 0.058, -0.018, 0.08, 0.005, 0.13); // forward cannon
  }
  radiatorPanel(grp, s, 0, 0.038, -0.09, 0.05, 0.07); // dorsal radiator
  for (const x of [-1, 1]) rcsQuad(grp, s, x * 0.034, 0.018, 0.17, 0.009);
  return grp;
}

// CORVETTE — an Old-Republic Hammerhead / Halo UNSC frigate: an elongated hull
// of welded blocks, an INTEGRATED low bridge superstructure (no tall thin spine),
// a blunt MAC prow, tidy turret rows, a proportionate comms dish, side radiators
// and a stern engine BANK (cluster of nozzles). Pure block, no wings.
function makeAllianceCorvette(s) {
  const grp = group();
  grp.add(part(box(0.14, 0.1, 0.26), C(s, 'hull'), 0, 0, -0.12)); // aft block
  grp.add(part(box(0.145, 0.105, 0.02), C(s, 'dark'), 0, 0, 0.01)); // weld collar
  grp.add(part(box(0.12, 0.09, 0.22), C(s, 'hull2'), 0, 0.002, 0.13)); // forward block
  grp.add(part(box(0.09, 0.075, 0.08), C(s, 'dark'), 0, 0.002, 0.26)); // blunt prow
  addRot(grp, cyl(0.013, 0.013, 0.09, 8), C(s, 'dark'), 0, 0, 0.31, Math.PI / 2); // spinal MAC gun
  // integrated low bridge (wide base → narrower upper → blister), fixes the spine look
  grp.add(part(box(0.09, 0.045, 0.1), C(s, 'hull'), 0, 0.072, 0.02));
  grp.add(part(box(0.06, 0.03, 0.06), C(s, 'dark'), 0, 0.1, 0.0));
  blister(grp, s, 0, 0.118, 0.03, 0.02);
  dish(grp, s, 0.05, 0.06, -0.17, 0.03, 0.5); // comms dish, proportionate
  for (const z of [0.14, 0.0, -0.14]) {
    for (const x of [-0.05, 0.05]) {
      grp.add(part(cyl(0.016, 0.02, 0.014, 8), C(s, 'hull2'), x, 0.055, z)); // turret base
      addRot(grp, cyl(0.005, 0.005, 0.05, 6), C(s, 'dark'), x, 0.062, z + 0.02, Math.PI / 2); // barrel
    }
  }
  for (const x of [-1, 1]) radiatorPanel(grp, s, x * 0.088, -0.02, -0.12, 0.03, 0.16); // side radiators
  for (const x of [-0.05, 0, 0.05]) for (const y of [-0.025, 0.025]) nozzle(grp, s, x, y, -0.26, 0.022, 0.05); // engine bank
  grp.add(part(box(0.004, 0.014, 0.46), ACC(s), 0.073, 0.0, -0.02)); // blue line stbd
  grp.add(part(box(0.004, 0.014, 0.46), ACC(s), -0.073, 0.0, -0.02)); // blue line port
  panelZ(grp, s, 0.072, 0.03, -0.1, 0.2);
  panelZ(grp, s, -0.072, 0.03, -0.1, 0.2);
  runningLights(grp, s, 0.076, 0.0, 0.24);
  return grp;
}

// SCOUT — Alliance "eyes of the fleet": a small blunt Pelican-nosed pod with a
// command blister, a prominent classic comms dish (its sensor), a chin sensor,
// two small nacelles on light pilons, blue running line, corner RCS.
function makeAllianceScout(s) {
  const grp = group();
  grp.add(part(box(0.07, 0.055, 0.15), C(s, 'hull'), 0, 0, -0.01)); // main body
  grp.add(part(box(0.062, 0.05, 0.02), C(s, 'dark'), 0, 0, 0.07)); // weld collar
  grp.add(part(box(0.058, 0.048, 0.07), C(s, 'hull2'), 0, -0.004, 0.115)); // forward block
  grp.add(part(box(0.046, 0.038, 0.04), C(s, 'dark'), 0, -0.008, 0.165)); // blunt nose
  greeble(grp, s, 'dark', 0, -0.032, 0.14, 0.036, 0.018, 0.05); // chin sensor pod
  blister(grp, s, 0, 0.032, 0.055, 0.024); // command blister
  dish(grp, s, 0, 0.03, -0.04, 0.045, 0.18); // signature classic dish
  grp.add(part(box(0.003, 0.011, 0.21), ACC(s), 0.037, 0.004, -0.005));
  grp.add(part(box(0.003, 0.011, 0.21), ACC(s), -0.037, 0.004, -0.005));
  panelZ(grp, s, 0.036, 0.018, -0.01, 0.14);
  panelZ(grp, s, -0.036, 0.018, -0.01, 0.14);
  for (const x of [-1, 1]) {
    grp.add(part(box(0.03, 0.016, 0.045), C(s, 'dark'), x * 0.058, -0.006, -0.02)); // light pilon
    nacelle(grp, s, x * 0.086, -0.006, -0.025, 0.019, 0.12);
    navLight(grp, s, x > 0 ? 'star' : 'port', x * 0.1, -0.006, 0.02, 0.008);
  }
  for (const x of [-1, 1]) rcsQuad(grp, s, x * 0.03, 0.014, 0.15, 0.008);
  return grp;
}

// INTERCEPTOR — Alliance's fastest hull: a thin command pod with a blister, two
// LONG outboard nacelles on slim pilons (all length = speed), paired forward
// guns that reach past the nose, blue running line, minimal detail. No dish.
function makeAllianceInterceptor(s) {
  const grp = group();
  grp.add(part(box(0.05, 0.045, 0.18), C(s, 'hull'), 0, 0, -0.04)); // aft body
  grp.add(part(box(0.052, 0.048, 0.018), C(s, 'dark'), 0, 0, 0.06)); // weld collar
  grp.add(part(box(0.046, 0.04, 0.1), C(s, 'hull2'), 0, -0.002, 0.12)); // forward body
  grp.add(part(box(0.03, 0.026, 0.06), C(s, 'dark'), 0, -0.004, 0.19)); // pointed prow
  greeble(grp, s, 'dark', 0, -0.024, 0.15, 0.024, 0.014, 0.05); // chin sensor
  blister(grp, s, 0, 0.028, 0.02, 0.02);
  barrel(grp, s, 0.018, -0.008, 0.17, 0.005, 0.17); // paired guns past the prow
  barrel(grp, s, -0.018, -0.008, 0.17, 0.005, 0.17);
  grp.add(part(box(0.003, 0.011, 0.26), ACC(s), 0.027, 0.004, -0.02));
  grp.add(part(box(0.003, 0.011, 0.26), ACC(s), -0.027, 0.004, -0.02));
  panelZ(grp, s, 0.026, 0.02, -0.03, 0.2);
  panelZ(grp, s, -0.026, 0.02, -0.03, 0.2);
  for (const x of [-1, 1]) {
    const pilon = part(box(0.07, 0.012, 0.03), C(s, 'dark'), x * 0.05, -0.004, 0.0);
    pilon.rotation.y = x * 0.12;
    grp.add(pilon);
    nacelle(grp, s, x * 0.088, -0.004, -0.02, 0.02, 0.26); // long nacelle = speed
    navLight(grp, s, x > 0 ? 'star' : 'port', x * 0.088, -0.004, 0.11, 0.008);
  }
  for (const x of [-1, 1]) rcsQuad(grp, s, x * 0.022, 0.012, 0.2, 0.007);
  return grp;
}

// Small inline turret for the gunship: welded base collar + rotating body + a gun
// housing with twin forward barrels. `by` mounting y; `dir` +1 dorsal / -1 chin.
function gunTurret(grp, s, z, by, dir, r, gunLen) {
  grp.add(part(cyl(r * 1.15, r * 1.3, 0.018, 12), C(s, 'dark'), 0, by, z)); // base collar
  grp.add(part(cyl(r, r, r * 0.9, 12), C(s, 'hull2'), 0, by + dir * (0.012 + r * 0.45), z)); // body
  const gy = by + dir * (0.012 + r * 0.9);
  grp.add(part(box(r * 1.9, r * 0.9, r * 1.5), C(s, 'dark'), 0, gy, z + r * 0.35)); // gun housing
  for (const x of [-r * 0.45, r * 0.45]) barrel(grp, s, x, gy, z + r * 1.6, r * 0.2, gunLen);
}

// GUNSHIP — an Alliance "flying battery": a SHORT, THICK, blocky armoured hull of
// welded segments, bristling with turrets and heavy nose cannons that overhang
// the prow. Stern engine cluster, side radiators, blue running line (LAAT/Halo).
function makeAllianceGunship(s) {
  const grp = group();
  grp.add(part(box(0.17, 0.15, 0.13), C(s, 'hull'), 0, 0, -0.11)); // aft engine block
  grp.add(part(box(0.178, 0.156, 0.02), C(s, 'dark'), 0, 0, -0.04)); // weld collar
  grp.add(part(box(0.2, 0.166, 0.15), C(s, 'hull'), 0, 0, 0.035)); // mid battery core
  grp.add(part(box(0.19, 0.15, 0.018), C(s, 'dark'), 0, 0, 0.115)); // weld collar
  grp.add(part(box(0.16, 0.13, 0.1), C(s, 'hull2'), 0, -0.006, 0.18)); // forward hull
  grp.add(part(box(0.12, 0.1, 0.055), C(s, 'dark'), 0, -0.012, 0.25)); // armoured prow
  grp.add(part(box(0.13, 0.065, 0.055), C(s, 'dark'), 0, -0.02, 0.26)); // gun mantlet
  for (const x of [-0.046, 0.046]) {
    grp.add(part(box(0.032, 0.045, 0.06), C(s, 'hull2'), x, -0.022, 0.19)); // breech block
    barrel(grp, s, x, -0.022, 0.26, 0.018, 0.24); // heavy nose cannon (overhangs)
  }
  gunTurret(grp, s, 0.02, 0.083, 1, 0.042, 0.15); // main dorsal
  gunTurret(grp, s, -0.1, 0.077, 1, 0.03, 0.09); // aft dorsal
  gunTurret(grp, s, 0.15, -0.062, -1, 0.03, 0.08); // chin
  for (const x of [-1, 1]) {
    grp.add(part(box(0.028, 0.055, 0.075), C(s, 'dark'), x * 0.104, -0.01, 0.03)); // sponson
    grp.add(part(sph(0.03, 8), C(s, 'hull2'), x * 0.116, -0.01, 0.03)); // ball turret
    barrel(grp, s, x * 0.116, -0.01, 0.09, 0.006, 0.09);
  }
  grp.add(part(box(0.075, 0.032, 0.07), C(s, 'dark'), 0, 0.078, 0.175)); // bridge riser
  blister(grp, s, 0, 0.097, 0.175, 0.03);
  for (const x of [-1, 1]) radiatorPanel(grp, s, x * 0.103, -0.05, -0.09, 0.03, 0.14);
  for (const x of [-0.06, 0, 0.06]) for (const y of [-0.04, 0.04]) nozzle(grp, s, x, y, -0.175, 0.025, 0.055);
  grp.add(part(box(0.004, 0.018, 0.44), ACC(s), 0.102, 0.0, -0.02));
  grp.add(part(box(0.004, 0.018, 0.44), ACC(s), -0.102, 0.0, -0.02));
  panelZ(grp, s, 0.101, 0.05, -0.07, 0.22);
  panelZ(grp, s, -0.101, 0.05, -0.07, 0.22);
  dish(grp, s, 0.06, 0.083, -0.15, 0.03, 0.5);
  antenna(grp, s, -0.06, 0.083, -0.15, 0.08);
  for (const x of [-1, 1]) { rcsQuad(grp, s, x * 0.096, 0.06, 0.22, 0.01); rcsQuad(grp, s, x * 0.088, -0.06, -0.15, 0.01); }
  runningLights(grp, s, 0.105, 0.0, 0.24);
  return grp;
}

// FREIGHTER — GR-75 / Canterbury ice-hauler: a central SPINE keel with rows of
// MODULAR CONTAINERS around it, an armoured command block with a bridge blister,
// a stern engine cluster. Pure block, no wings.
function makeAllianceFreighter(s) {
  const grp = group();
  grp.add(part(box(0.05, 0.11, 0.4), C(s, 'dark'), 0, 0.018, -0.02)); // keel truss
  for (const z of [0.115, 0.01, -0.095, -0.19]) grp.add(part(box(0.064, 0.12, 0.012), C(s, 'accent'), 0, 0.018, z)); // frames
  grp.add(part(box(0.13, 0.135, 0.024), C(s, 'dark'), 0, 0.018, 0.17)); // weld collar
  grp.add(part(box(0.115, 0.12, 0.11), C(s, 'hull'), 0, 0.018, 0.225)); // command block
  grp.add(part(box(0.075, 0.055, 0.05), C(s, 'dark'), 0, 0.0, 0.295)); // blunt nose
  grp.add(part(box(0.07, 0.04, 0.06), C(s, 'hull2'), 0, 0.088, 0.21)); // bridge riser
  blister(grp, s, 0, 0.116, 0.215, 0.026);
  dish(grp, s, -0.042, 0.08, 0.185, 0.026, 0.5);
  panelZ(grp, s, 0.05, 0.08, 0.22, 0.08);
  panelZ(grp, s, -0.05, 0.08, 0.22, 0.08);
  const cols = [['hull2', 'gold'], ['gold', 'hull'], ['accent', 'hull2'], ['hull', 'gold']];
  const zs = [0.06, -0.045, -0.145, -0.225];
  const lens = [0.086, 0.086, 0.062, 0.05];
  for (let i = 0; i < zs.length; i++) {
    for (const x of [-1, 1]) {
      grp.add(part(box(0.062, 0.05, lens[i]), C(s, cols[i][0]), x * 0.058, -0.008, zs[i]));
      grp.add(part(box(0.062, 0.05, lens[i]), C(s, cols[i][1]), x * 0.058, 0.046, zs[i]));
    }
  }
  grp.add(part(box(0.13, 0.115, 0.05), C(s, 'dark'), 0, 0.012, -0.245)); // engine block
  for (const x of [-0.045, 0.045]) for (const y of [-0.018, 0.038]) nozzle(grp, s, x, y, -0.27, 0.024, 0.05);
  grp.add(part(box(0.004, 0.014, 0.42), ACC(s), 0.091, 0.02, -0.02));
  grp.add(part(box(0.004, 0.014, 0.42), ACC(s), -0.091, 0.02, -0.02));
  for (const x of [-1, 1]) rcsQuad(grp, s, x * 0.055, 0.06, 0.27, 0.009);
  runningLights(grp, s, 0.062, 0.075, 0.27);
  return grp;
}

// TANKER — Nostromo refinery / Expanse fuel hauler: a truss SPINE carrying a row
// of big SPHERICAL pressure tanks, broad side radiators, a forward command block
// with a bridge blister, a stern engine cluster. Pure block, no wings.
function makeAllianceTanker(s) {
  const grp = group();
  grp.add(part(box(0.034, 0.038, 0.4), C(s, 'dark'), 0, -0.02, -0.02)); // main keel beam
  grp.add(part(box(0.022, 0.022, 0.4), C(s, 'hull2'), 0, 0.03, -0.02)); // upper chord
  for (const z of [0.15, 0.045, -0.06, -0.16]) grp.add(part(box(0.05, 0.08, 0.012), C(s, 'accent'), 0, 0.0, z)); // frames
  for (const x of [-1, 1]) {
    grp.add(part(box(0.06, 0.012, 0.02), C(s, 'dark'), x * 0.09, -0.01, -0.02)); // boom
    radiatorPanel(grp, s, x * 0.135, -0.01, -0.02, 0.05, 0.28);
  }
  const tanks = [[0.095, 'hull'], [-0.005, 'hull2'], [-0.105, 'hull']];
  for (const [z, slot] of tanks) {
    grp.add(part(sph(0.072, 8), C(s, slot), 0, 0.008, z)); // pressure tank
    addRot(grp, cyl(0.075, 0.075, 0.018, 12), C(s, 'dark'), 0, 0.008, z, Math.PI / 2); // band
    grp.add(part(box(0.026, 0.02, 0.026), C(s, 'dark'), 0, 0.082, z)); // valve cap
    grp.add(part(box(0.006, 0.02, 0.11), ACC(s), 0.07, 0.008, z));
    grp.add(part(box(0.006, 0.02, 0.11), ACC(s), -0.07, 0.008, z));
  }
  grp.add(part(box(0.1, 0.09, 0.022), C(s, 'dark'), 0, 0.0, 0.165)); // weld collar
  grp.add(part(box(0.092, 0.082, 0.1), C(s, 'hull'), 0, 0.0, 0.215)); // command block
  grp.add(part(box(0.058, 0.045, 0.05), C(s, 'dark'), 0, -0.004, 0.28)); // blunt nose
  grp.add(part(box(0.055, 0.032, 0.055), C(s, 'hull2'), 0, 0.055, 0.2)); // bridge riser
  blister(grp, s, 0, 0.084, 0.205, 0.024);
  dish(grp, s, 0.04, 0.045, 0.185, 0.024, 0.5);
  grp.add(part(box(0.1, 0.088, 0.05), C(s, 'dark'), 0, 0, -0.225)); // engine block
  for (const x of [-0.04, 0.04]) for (const y of [-0.025, 0.025]) nozzle(grp, s, x, y, -0.25, 0.023, 0.05);
  for (const x of [-1, 1]) rcsQuad(grp, s, x * 0.048, 0.02, 0.26, 0.009);
  runningLights(grp, s, 0.05, 0.05, 0.27);
  return grp;
}

// LINER — Alliance colonist EVACUATOR: a long welded hull, a raised promenade
// deck, tiers of lit windows along the flanks, two observation blisters, escape-
// pod rows on the lower flank, a forward bridge blister, a big stern cluster,
// gilded civilian rails, blue running line. No wings, no guns (civilian).
function makeAllianceLiner(s) {
  const grp = group();
  grp.add(part(box(0.11, 0.11, 0.16), C(s, 'hull'), 0, 0, -0.18)); // stern engineering
  grp.add(part(box(0.115, 0.115, 0.02), C(s, 'dark'), 0, 0, -0.10)); // weld collar
  grp.add(part(box(0.1, 0.115, 0.26), C(s, 'hull2'), 0, 0.003, 0.03)); // passenger spine
  grp.add(part(box(0.105, 0.12, 0.02), C(s, 'dark'), 0, 0.003, 0.16)); // weld collar
  grp.add(part(box(0.085, 0.1, 0.1), C(s, 'hull'), 0, 0.004, 0.22)); // forward block
  grp.add(part(box(0.06, 0.075, 0.05), C(s, 'hull2'), 0, 0.004, 0.285)); // bow shoulder
  grp.add(part(box(0.035, 0.05, 0.05), C(s, 'dark'), 0, 0.004, 0.32)); // blunt prow
  grp.add(part(box(0.07, 0.032, 0.3), C(s, 'hull'), 0, 0.076, 0.0)); // promenade deck
  grp.add(part(box(0.074, 0.014, 0.018), C(s, 'dark'), 0, 0.076, 0.1));
  grp.add(part(box(0.074, 0.014, 0.018), C(s, 'dark'), 0, 0.076, -0.08));
  for (const x of [-1, 1]) grp.add(part(box(0.003, 0.004, 0.29), C(s, 'gold'), x * 0.036, 0.092, 0.0)); // gilded rail
  for (const x of [-1, 1]) {
    for (const y of [-0.03, 0.006, 0.042]) {
      for (let z = -0.09; z <= 0.19; z += 0.02) grp.add(part(box(0.004, 0.007, 0.01), C(s, 'glass'), x * 0.052, y, z));
    }
    for (let z = -0.11; z <= 0.11; z += 0.022) grp.add(part(box(0.004, 0.009, 0.012), C(s, 'glass'), x * 0.037, 0.078, z));
  }
  blister(grp, s, 0, 0.092, 0.02, 0.03); // grand observation dome
  blister(grp, s, 0, 0.092, -0.1, 0.022); // aft dome
  grp.add(part(box(0.052, 0.03, 0.06), C(s, 'hull'), 0, 0.08, 0.205)); // bridge
  grp.add(part(box(0.056, 0.006, 0.012), C(s, 'gold'), 0, 0.096, 0.228));
  blister(grp, s, 0, 0.098, 0.2, 0.022);
  for (const x of [-1, 1]) {
    grp.add(part(box(0.006, 0.026, 0.28), C(s, 'dark'), x * 0.051, -0.042, 0.01)); // escape-pod bay
    for (let z = -0.1; z <= 0.13; z += 0.026) grp.add(part(box(0.012, 0.017, 0.018), C(s, 'hull2'), x * 0.056, -0.042, z));
  }
  for (const x of [-1, 1]) radiatorPanel(grp, s, x * 0.07, -0.025, -0.18, 0.03, 0.12);
  dish(grp, s, 0.048, 0.055, -0.2, 0.028, 0.5);
  addRot(grp, cyl(0.062, 0.062, 0.02, 12), C(s, 'dark'), 0, 0, -0.27, Math.PI / 2); // engine mount
  nozzle(grp, s, 0, 0, -0.28, 0.026, 0.05);
  for (const [dx, dy] of [[0.045, 0], [0.0225, 0.039], [-0.0225, 0.039], [-0.045, 0], [-0.0225, -0.039], [0.0225, -0.039]]) {
    nozzle(grp, s, dx, dy, -0.28, 0.018, 0.045);
  }
  for (const x of [-1, 1]) {
    grp.add(part(box(0.004, 0.01, 0.44), ACC(s), x * 0.053, -0.014, 0.0));
    panelZ(grp, s, x * 0.052, 0.062, 0.02, 0.24);
  }
  runningLights(grp, s, 0.05, 0.0, 0.33);
  return grp;
}

// FLAGSHIP "Тихая Гавань" — Alliance twin-hull fleet CARRIER. Two long welded
// pontoons flank a wide flat FLIGHT DECK (central ACC landing strip, deck lights,
// parked-craft bumps); a low integrated central command island (blister + big
// dish + masts); stern engine BANKS per pontoon; radiators; MAC/spinal guns
// forward; turret rows along the pontoons; hangar mouths; a prominent blue
// running line. Ref: BSG Galactica / Homeworld mothership / Venator. Nose = +Z.
function makeAllianceFlagship(s) {
  const grp = group();
  const PX = 0.16;             // pontoon centre |x|
  const HW = 0.12, HH = 0.13;  // pontoon cross-section
  const OUT = PX + HW / 2;     // outer flank x
  const IN = PX - HW / 2;      // inner flank x

  // twin-barrel turret; `main` gives it a boxy gun-house (heavy dorsal battery)
  const turret = (x, y, z, r, main = false) => {
    grp.add(part(cyl(r * 1.15, r * 1.3, r * 0.5, 10), C(s, 'dark'), x, y, z));   // base collar
    if (main) {
      grp.add(part(box(r * 1.9, r * 1.1, r * 1.6, 8), C(s, 'hull2'), x, y + r * 0.55, z)); // gun house
      grp.add(part(box(r * 1.4, r * 0.4, r * 0.4), C(s, 'dark'), x, y + r * 0.55, z + r)); // mantlet
    } else {
      grp.add(part(sph(r, 8), C(s, 'hull2'), x, y + r * 0.5, z));                // ball
    }
    for (const bx of [-r * 0.45, r * 0.45]) barrel(grp, s, x + bx, y + r * 0.55, z + r * 0.7, r * 0.18, r * (main ? 3.4 : 2.6));
  };

  for (const sx of [-1, 1]) {
    const x = sx * PX;
    // welded pontoon: aft engine block → mid (thickest) → forward → bow, dark welds.
    // Alternating hull / hull2 tones read as sections cut from salvaged docks.
    grp.add(part(box(HW, HH, 0.15), C(s, 'hull2'), x, -0.02, -0.37));                   // aft engine block
    grp.add(part(box(HW + 0.006, HH + 0.006, 0.016), C(s, 'dark'), x, -0.02, -0.285));  // weld
    grp.add(part(box(HW + 0.005, HH + 0.005, 0.25), C(s, 'hull'), x, -0.02, -0.15));    // mid
    grp.add(part(box(HW + 0.006, HH + 0.006, 0.016), C(s, 'dark'), x, -0.02, -0.02));   // weld
    grp.add(part(box(HW - 0.01, HH - 0.008, 0.24), C(s, 'hull2'), x, -0.018, 0.11));    // forward
    grp.add(part(box(HW - 0.005, HH - 0.005, 0.014), C(s, 'dark'), x, -0.018, 0.235));  // weld
    grp.add(part(box(HW - 0.03, HH - 0.03, 0.12), C(s, 'hull'), x, -0.016, 0.31));      // bow block
    grp.add(part(box(HW - 0.055, HH - 0.05, 0.05), C(s, 'dark'), x, -0.016, 0.39));     // blunt prow cap
    for (const z of [-0.285, -0.02, 0.235]) panelX(grp, s, x, 0.045, z, HW - 0.01);     // dorsal weld seams
    panelZ(grp, s, x, 0.045, -0.05, 0.5);                                               // dorsal centre seam

    barrel(grp, s, x, -0.016, 0.42, 0.013, 0.16); // spinal MAC per pontoon, muzzle ~0.5

    // engine bank: recessed dark housing + 2x2 nozzle cluster (each nozzle glows)
    grp.add(part(box(HW - 0.01, HH - 0.01, 0.02), C(s, 'dark'), x, -0.02, -0.44));
    for (const ex of [-0.03, 0.03]) for (const ey of [-0.032, 0.032]) nozzle(grp, s, x + ex, ey - 0.02, -0.455, 0.024, 0.05);

    // prominent blue running line + panel seams on the outer flank
    grp.add(part(box(0.006, 0.02, 0.72), ACC(s), sx * OUT, -0.01, -0.02));
    panelZ(grp, s, sx * (OUT - 0.004), 0.03, -0.02, 0.6);
    panelZ(grp, s, sx * (OUT - 0.004), -0.05, -0.02, 0.55);

    // aft radiator: a canted dark fin off the outer flank with a slim hull2 rib
    addRot(grp, box(0.004, 0.1, 0.18), C(s, 'dark'), sx * (OUT + 0.05), -0.02, -0.3, 0, 0, sx * 0.5);
    addRot(grp, box(0.005, 0.02, 0.15), C(s, 'hull2'), sx * (OUT + 0.055), -0.02, -0.3, 0, 0, sx * 0.5);
    radiatorPanel(grp, s, sx * (OUT + 0.02), 0.04, -0.35, 0.05, 0.12);

    turret(sx * PX, 0.06, 0.24, 0.03, true);                              // forward main dorsal battery
    for (const z of [0.09, -0.04, -0.17]) turret(sx * (PX + 0.032), 0.052, z, 0.02); // PD turret row (outer shoulder)

    // hangar mouths on the inner flank (facing the deck gap): a recessed dark bay
    // carries the shape; a thin lit floor line reads as an active hangar deck
    for (const z of [0.13, -0.05]) {
      grp.add(part(box(0.012, 0.075, 0.12), C(s, 'dark'), sx * IN, -0.006, z));         // recessed bay
      grp.add(part(box(0.006, 0.05, 0.095), C(s, 'hull2'), sx * (IN + 0.006), -0.006, z)); // interior back wall (depth)
      grp.add(part(box(0.004, 0.012, 0.09), GLOW(s), sx * (IN - 0.005), -0.028, z));     // hangar floor light
    }

    rcsQuad(grp, s, sx * OUT, 0.04, 0.34, 0.012);
    rcsQuad(grp, s, sx * OUT, -0.06, -0.38, 0.012);
  }

  // FLIGHT DECK bridging the pontoons
  grp.add(part(box(0.34, 0.02, 0.7), C(s, 'hull2'), 0, 0.055, -0.02));  // deck plate
  for (const sx of [-1, 1]) grp.add(part(box(0.01, 0.022, 0.66), C(s, 'dark'), sx * 0.155, 0.07, -0.02)); // deck coaming rails
  grp.add(part(box(0.36, 0.014, 0.03), C(s, 'dark'), 0, 0.05, 0.32));   // forward deck lip
  grp.add(part(box(0.3, 0.024, 0.05), C(s, 'dark'), 0, 0.056, 0.315));  // bow hangar mouth (recess)
  grp.add(part(box(0.26, 0.02, 0.02), GLOW(s), 0, 0.058, 0.322));       // lit hangar interior
  grp.add(part(box(0.05, 0.008, 0.6), ACC(s), 0, 0.067, 0.0));          // central landing strip
  for (const px of [-0.15, 0.15]) panelZ(grp, s, px, 0.066, -0.02, 0.66, 0.004); // deck edge seams
  panelX(grp, s, 0, 0.066, -0.31, 0.32); panelX(grp, s, 0, 0.066, 0.29, 0.32);    // deck end seams
  for (let z = 0.26; z > -0.3; z -= 0.055) {                            // deck edge lights (both sides of strip)
    navLight(grp, s, 'top', 0.037, 0.068, z, 0.008);
    navLight(grp, s, 'top', -0.037, 0.068, z, 0.008);
  }
  for (const cz of [0.19, 0.06]) grp.add(part(box(0.014, 0.005, 0.11), ACC(s), 0, 0.066, cz)); // catapult strips
  grp.add(part(box(0.09, 0.006, 0.11), C(s, 'dark'), 0.1, 0.066, -0.05)); // deck elevator outline (starboard)
  grp.add(part(box(0.09, 0.006, 0.11), C(s, 'dark'), -0.1, 0.066, 0.1));  // deck elevator outline (port)
  for (const px of [-0.1, 0.1]) for (const pz of [0.17, 0.05, -0.08]) {   // parked craft (tiny welded shuttles)
    grp.add(part(box(0.028, 0.012, 0.05), C(s, 'hull'), px, 0.073, pz));
    grp.add(part(box(0.016, 0.009, 0.02), C(s, 'hull2'), px, 0.082, pz + 0.004));
    grp.add(part(box(0.006, 0.005, 0.006), C(s, 'glass'), px, 0.088, pz + 0.014)); // cockpit
    grp.add(part(sph(0.006, 6), GLOW(s), px, 0.073, pz - 0.028)); // engine dot
  }
  for (const z of [0.2, 0.0, -0.2]) grp.add(part(box(0.2, 0.03, 0.04), C(s, 'accent'), 0, 0.02, z)); // cross struts

  // central command island (aft, symmetric, low + integrated)
  grp.add(part(box(0.15, 0.05, 0.17), C(s, 'hull'), 0, 0.09, -0.2));
  grp.add(part(box(0.155, 0.014, 0.02), C(s, 'dark'), 0, 0.078, -0.12));
  grp.add(part(box(0.1, 0.035, 0.11), C(s, 'hull2'), 0, 0.125, -0.19));
  blister(grp, s, 0, 0.15, -0.14, 0.032);                              // bridge blister
  grp.add(part(box(0.05, 0.02, 0.04), C(s, 'glass'), 0, 0.135, -0.1)); // forward bridge windows
  for (const bx of [-0.05, 0.05]) blister(grp, s, bx, 0.13, -0.12, 0.016); // secondary sensor domes
  dish(grp, s, 0, 0.16, -0.26, 0.055, 0.32);                           // flagship comms dish
  for (const ax of [-0.05, 0.05]) antenna(grp, s, ax, 0.15, -0.25, 0.1);
  antenna(grp, s, 0, 0.17, -0.22, 0.14);

  // central spinal super-MAC (keel gun on the bow)
  grp.add(part(box(0.09, 0.06, 0.4), C(s, 'hull'), 0, -0.06, 0.14));
  grp.add(part(box(0.095, 0.02, 0.02), C(s, 'dark'), 0, -0.06, 0.3));
  barrel(grp, s, 0, -0.06, 0.36, 0.02, 0.22);

  runningLights(grp, s, OUT, -0.02, 0.44);
  navLight(grp, s, 'top', 0, 0.18, -0.08, 0.01);

  return grp;
}

// ALLIANCE HAB-RING — the faction capital: a big rotating habitat wheel (R≈1.0)
// welded from blocky sections, hung off a central Z-axis hub by spokes, with
// habitat/dock blocks round the rim, a blue running line, solar wings + radiators
// on the static hub, a big command dish and a bright blue beacon. Wheel spins
// about Z (grp.userData.spin). Nose/front = +Z. BSG/Halo ring language.
function makeAllianceRing(s) {
  const grp = group();
  const R = 1.0;

  // ---------------- static central hub (does NOT spin) ----------------------
  addRot(grp, cyl(0.2, 0.2, 1.0, 16), C(s, 'hull'), 0, 0, 0, Math.PI / 2); // hub barrel along Z
  addRot(grp, cyl(0.24, 0.24, 0.07, 16), C(s, 'dark'), 0, 0, 0.5, Math.PI / 2); // front collar
  addRot(grp, cyl(0.24, 0.24, 0.07, 16), C(s, 'dark'), 0, 0, -0.5, Math.PI / 2); // rear collar
  addRot(grp, cyl(0.22, 0.18, 0.14, 16), C(s, 'hull2'), 0, 0, 0.58, Math.PI / 2); // front dock nose

  // docking arms fanned off the front hub cap (ships dock at the still hub)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    grp.add(part(box(0.05, 0.05, 0.22), C(s, 'hull2'), Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0.62));
    navLight(grp, s, 'star', Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0.74, 0.02);
  }

  // command tower + blister on top of the hub
  grp.add(part(box(0.16, 0.12, 0.22), C(s, 'hull'), 0, 0.24, 0)); // tower base
  greeble(grp, s, 'dark', 0, 0.31, 0.06, 0.14, 0.05, 0.14); // tower cap
  blister(grp, s, 0, 0.35, 0.06, 0.05);
  grp.add(part(box(0.03, 0.04, 0.05), C(s, 'glass'), 0, 0.28, -0.09)); // tower window

  // big command dish on a spar aft of the hub
  dish(grp, s, 0, 0.24, -0.32, 0.22, 0.4);

  // solar wings on a transverse mast at the front (clear of the ring plane).
  // Each wing = a framed photovoltaic array: dark cells + hull2 frame + blue ribs.
  grp.add(part(box(2.4, 0.04, 0.04), C(s, 'accent'), 0, 0, 0.4)); // mast
  for (const x of [-1, 1]) {
    grp.add(part(box(0.92, 0.03, 0.74), C(s, 'hull2'), x * 0.95, -0.002, 0.4)); // frame
    grp.add(part(box(0.86, 0.02, 0.68), C(s, 'dark'), x * 0.95, 0.006, 0.4)); // cell field
    for (const ry of [0.014, -0.008]) { // blue ribs on both faces (unlit back reads too)
      for (const cz of [0.13, -0.13]) grp.add(part(box(0.86, 0.02, 0.02), ACC(s), x * 0.95, ry, 0.4 + cz)); // cell ribs
      grp.add(part(box(0.02, 0.02, 0.68), ACC(s), x * 0.95, ry, 0.4)); // spine rib
    }
    grp.add(part(box(0.03, 0.02, 0.74), C(s, 'hull'), x * 0.5, 0, 0.4)); // spar to hub
  }

  // radiator fins on a transverse mast at the rear (heat cue)
  for (const x of [-1, 1]) radiatorPanel(grp, s, x * 0.55, 0, -0.42, 0.5, 0.7);

  // bright blue beacon on the front dock nose (halo + core)
  grp.add(part(sph(0.13, 12), GLOW(s), 0, 0, 0.7));
  grp.add(part(sph(0.07, 10), GLOW(s), 0, 0, 0.7));

  // ---------------- rotating habitat wheel (spins about Z) ------------------
  const wheel = group();
  const N = 36;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const cx = Math.cos(a) * R;
    const cy = Math.sin(a) * R;
    // welded band segment (alternating hull/hull2 reads as welded plating)
    addRot(wheel, box(0.19, 0.11, 0.16), i % 2 ? C(s, 'hull') : C(s, 'hull2'), cx, cy, 0, 0, 0, a + Math.PI / 2);
    // blue running line on the outer edge
    addRot(wheel, box(0.19, 0.02, 0.05), ACC(s), Math.cos(a) * (R + 0.06), Math.sin(a) * (R + 0.06), 0, 0, 0, a + Math.PI / 2);
  }

  // habitat / dock blocks round the rim (8), each a chunky welded module
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const dir = [Math.cos(a), Math.sin(a)];
    const rr = R + 0.02;
    addRot(wheel, box(0.2, 0.18, 0.24), C(s, 'hull'), dir[0] * rr, dir[1] * rr, 0, 0, 0, a + Math.PI / 2); // block
    addRot(wheel, box(0.22, 0.05, 0.26), C(s, 'dark'), dir[0] * (R - 0.02), dir[1] * (R - 0.02), 0, 0, 0, a + Math.PI / 2); // inner weld collar
    // two rows of lit windows on the block's axial faces
    for (const zz of [-0.09, 0.09]) {
      addRot(wheel, box(0.14, 0.05, 0.01), C(s, 'glass'), dir[0] * (rr + 0.06), dir[1] * (rr + 0.06), zz, 0, 0, a + Math.PI / 2);
    }
  }

  // spokes: 6 struts from hub region to the rim
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    addRot(wheel, box(0.05, 0.78, 0.05), C(s, 'accent'), Math.cos(a) * 0.58, Math.sin(a) * 0.58, 0, 0, 0, a + Math.PI / 2);
  }
  // inner hub ring the spokes meet (gives them a clean root)
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    addRot(wheel, box(0.06, 0.05, 0.1), C(s, 'accent'), Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0, 0, 0, a + Math.PI / 2);
  }

  grp.add(wheel);
  grp.userData.spin = wheel;
  return grp;
}


// ALLIANCE COLONY OUTPOST — compact modular station (R≈0.6). "First a hospital
// and a dock": a welded core drum + a big ship-dock collar up front, a couple of
// clean med/habitat pods, a control turret with a command blister, solar + heat
// wings, and a blue beacon. Front/dock = +Z, up = +Y. Medium detail.
function makeAllianceOutpost(s) {
  const grp = group();

  // ---- welded modular core stretched along Z: dock (front) → hab drum → utility ----
  addRot(grp, cyl(0.18, 0.18, 0.34, 14), C(s, 'hull2'), 0, 0, 0.02, Math.PI / 2); // habitation drum along Z
  grp.add(part(box(0.28, 0.26, 0.16), C(s, 'hull'), 0, -0.01, -0.22)); // rear utility block
  grp.add(part(box(0.3, 0.28, 0.035), C(s, 'dark'), 0, -0.01, -0.13)); // weld collar
  grp.add(part(box(0.3, 0.28, 0.035), C(s, 'dark'), 0, -0.01, -0.3)); // weld collar
  // lit window band round the hab drum (habitat/hospital read)
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    grp.add(part(box(0.028, 0.045, 0.012), C(s, 'glass'), Math.cos(a) * 0.185, Math.sin(a) * 0.185, 0.08));
    grp.add(part(box(0.028, 0.045, 0.012), C(s, 'glass'), Math.cos(a) * 0.185, Math.sin(a) * 0.185, -0.05));
  }

  // ---- front ship-dock collar (the "dock" — ships berth here) ----
  addRot(grp, cyl(0.23, 0.23, 0.09, 16), C(s, 'dark'), 0, 0, 0.24, Math.PI / 2); // collar ring
  addRot(grp, cyl(0.19, 0.13, 0.08, 16), C(s, 'hull'), 0, 0, 0.32, Math.PI / 2); // dock throat
  for (let i = 0; i < 4; i++) { // 4 berthing latches + guide lights round the collar
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    grp.add(part(box(0.04, 0.04, 0.11), C(s, 'hull2'), Math.cos(a) * 0.23, Math.sin(a) * 0.23, 0.24));
    navLight(grp, s, i % 2 ? 'star' : 'port', Math.cos(a) * 0.23, Math.sin(a) * 0.23, 0.36, 0.018);
  }

  // ---- clean med/habitat pods on side arms (white-ish glass domes) ----
  for (const x of [-1, 1]) {
    grp.add(part(box(0.06, 0.035, 0.035), C(s, 'accent'), x * 0.24, 0.0, 0.02)); // pod arm
    grp.add(part(cyl(0.1, 0.1, 0.13, 10), C(s, 'hull'), x * 0.32, 0.0, 0.02)); // pod body
    grp.add(part(cyl(0.105, 0.105, 0.02, 10), C(s, 'dark'), x * 0.32, 0.0, 0.02)); // pod band
    grp.add(part(sph(0.1, 10), C(s, 'glass'), x * 0.32, 0.0, 0.09)); // pod dome (bright)
  }

  // ---- control turret + command blister on top of the core ----
  grp.add(part(box(0.14, 0.1, 0.16), C(s, 'hull'), 0, 0.2, -0.02)); // turret base
  greeble(grp, s, 'dark', 0, 0.26, -0.05, 0.12, 0.04, 0.12); // turret cap
  blister(grp, s, 0, 0.3, -0.05, 0.05);
  grp.add(part(box(0.03, 0.035, 0.04), C(s, 'glass'), 0, 0.23, 0.06)); // turret window
  dish(grp, s, 0.08, 0.2, -0.12, 0.11, 0.5); // small comms dish

  // ---- solar wing (+X) and radiator wing (-X) on a transverse mast off the rear ----
  grp.add(part(box(1.0, 0.03, 0.03), C(s, 'accent'), 0, -0.03, -0.24)); // mast
  // solar array on +X
  grp.add(part(box(0.42, 0.03, 0.42), C(s, 'hull2'), 0.52, -0.03, -0.24)); // frame
  grp.add(part(box(0.38, 0.02, 0.38), C(s, 'dark'), 0.52, -0.021, -0.24)); // cells
  for (const ry of [-0.006, 0.006]) grp.add(part(box(0.38, 0.02, 0.02), ACC(s), 0.52, -0.015 + ry, -0.24)); // cell rib
  // radiators on -X
  radiatorPanel(grp, s, -0.52, -0.03, -0.24, 0.42, 0.38);

  // ---- blue beacon on a short mast up top ----
  grp.add(part(box(0.02, 0.12, 0.02), C(s, 'accent'), 0, 0.32, -0.02)); // beacon mast
  grp.add(part(sph(0.06, 12), GLOW(s), 0, 0.4, -0.02)); // beacon halo
  grp.add(part(sph(0.032, 10), GLOW(s), 0, 0.4, -0.02)); // beacon core

  return grp;
}


// ALLIANCE GAS COLLECTOR — an honest industrial workhorse platform hung over a
// gas giant (R≈0.7). A wide downward intake BELL (-Y, so the game aims it at the
// planet) feeding a central throat up into a machinery deck ringed with storage
// TANKS, plus radiators, a control blister and a blue beacon. Medium-high detail.
function makeAllianceCollector(s) {
  const grp = group();

  // ---- wide intake bell facing DOWN (-Y): a flared frustum + dark mouth ----
  addRot(grp, cyl(0.24, 0.74, 0.52, 20), C(s, 'hull2'), 0, -0.36, 0); // funnel bell (narrow top → wide mouth)
  grp.add(part(cyl(0.4, 0.4, 0.03, 20), C(s, 'dark'), 0, -0.24, 0)); // upper weld ring band
  grp.add(part(cyl(0.58, 0.58, 0.03, 20), C(s, 'dark'), 0, -0.46, 0)); // lower weld ring band
  grp.add(part(cyl(0.5, 0.5, 0.025, 20), ACC(s), 0, -0.35, 0)); // blue intake ring (running line)
  grp.add(part(cyl(0.68, 0.68, 0.025, 20), ACC(s), 0, -0.6, 0)); // blue rim ring near the mouth
  grp.add(part(cyl(0.77, 0.77, 0.05, 20), C(s, 'dark'), 0, -0.63, 0)); // dark mouth lip
  addRot(grp, cyl(0.66, 0.2, 0.42, 20), C(s, 'dark'), 0, -0.42, 0); // inner throat cone (reads as opening)
  // intake vane grooves down the bell (industrial grille cue, dark for contrast)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    addRot(grp, box(0.03, 0.52, 0.06), C(s, 'dark'), Math.cos(a) * 0.5, -0.36, Math.sin(a) * 0.5, 0, -a, 0);
  }

  // ---- central throat stack up into the machinery deck ----
  grp.add(part(cyl(0.2, 0.24, 0.24, 14), C(s, 'hull'), 0, 0.0, 0)); // throat stack
  grp.add(part(cyl(0.26, 0.26, 0.04, 14), C(s, 'dark'), 0, -0.11, 0)); // weld collar

  // ---- machinery deck (octagonal platform on top) ----
  grp.add(part(cyl(0.46, 0.46, 0.12, 8), C(s, 'hull'), 0, 0.2, 0)); // deck slab
  grp.add(part(cyl(0.48, 0.48, 0.03, 8), C(s, 'dark'), 0, 0.14, 0)); // deck under-rim
  greeble(grp, s, 'hull2', 0, 0.28, 0, 0.5, 0.03, 0.14); // deck spine gantry

  // ---- storage tanks ringing the deck (the workhorse cue): capsule tanks ----
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const tx = Math.cos(a) * 0.5;
    const tz = Math.sin(a) * 0.5;
    grp.add(part(sph(0.19, 12), C(s, 'hull2'), tx, 0.24, tz)); // tank body
    grp.add(part(cyl(0.195, 0.195, 0.06, 12), C(s, 'dark'), tx, 0.24, tz)); // tank band
    addRot(grp, cyl(0.02, 0.02, 0.24, 6), C(s, 'accent'), tx * 0.62, 0.22, tz * 0.62, 0, -a, Math.PI / 2); // feed pipe to deck
    grp.add(part(sph(0.05, 8), ACC(s), tx, 0.4, tz)); // tank cap valve (blue)
  }

  // ---- control turret + blister + comms on the deck ----
  grp.add(part(box(0.14, 0.14, 0.16), C(s, 'hull'), 0, 0.34, 0.0)); // control tower
  greeble(grp, s, 'dark', 0, 0.42, 0, 0.12, 0.04, 0.12); // tower cap
  blister(grp, s, 0, 0.46, 0, 0.05);
  grp.add(part(box(0.03, 0.035, 0.04), C(s, 'glass'), 0, 0.37, 0.075)); // control window

  // ---- radiator fins on two deck flanks (heat cue) ----
  for (const x of [-1, 1]) {
    grp.add(part(box(0.05, 0.03, 0.05), C(s, 'accent'), x * 0.5, 0.2, 0)); // radiator root
    radiatorPanel(grp, s, x * 0.72, 0.2, 0, 0.32, 0.44);
  }

  // ---- blue beacon on a short mast up top ----
  grp.add(part(box(0.02, 0.13, 0.02), C(s, 'accent'), 0, 0.55, 0)); // beacon mast
  grp.add(part(sph(0.07, 12), GLOW(s), 0, 0.63, 0)); // beacon halo
  grp.add(part(sph(0.038, 10), GLOW(s), 0, 0.63, 0)); // beacon core
  navLight(grp, s, 'star', 0.46, 0.26, 0, 0.02);
  navLight(grp, s, 'port', -0.46, 0.26, 0, 0.02);

  return grp;
}


export const FACTION = {
  id: 'alliance',
  name: 'Альянс',
  colors: { hull: 0x7e8a9e, hull2: 0x5e6878, accent: 0x49546a, dark: 0x262c36, glass: 0x8fc4ff, gold: 0xbfae7a },
  accent: 0x2f6bff,
  glow: 0x8fc4ff,
  nav: { port: 0xff4036, star: 0x49ff84, top: 0xffffff },
  lore: 'Флот оружейной стали: утилитарный, надёжный, авианосцы вместо линкоров.',
  roles: {
    scout: makeAllianceScout,
    fighter: makeAllianceFighter,
    interceptor: makeAllianceInterceptor,
    gunship: makeAllianceGunship,
    corvette: makeAllianceCorvette,
    freighter: makeAllianceFreighter,
    tanker: makeAllianceTanker,
    liner: makeAllianceLiner,
    flagship: makeAllianceFlagship,
  },
  stations: { ring: makeAllianceRing, outpost: makeAllianceOutpost, collector: makeAllianceCollector },
};
