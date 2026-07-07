// Faction style-kit: EMPIRE (imperial). A menacing militaristic fleet — black
// angular armoured wedges, blood-red trench-lines & markings, red-orange engines,
// cold red lights. A FULL bespoke line: all nine roles + three stations are
// hand-built here in the Imperial visual language (Star Wars Imperial Star
// Destroyer / Venator, WH40k Imperial Navy). Schema matches the Alliance exemplar.

import {
  C, ACC, GLOW, NAV, box, cyl, sph, cone, wedge, part, addRot, group,
  engineGlow, navLight, runningLights, antenna, barrel, nozzle,
  panelZ, panelX, greeble, dish, blister, radiatorPanel, rcsQuad,
} from './style.js';

export const FACTION = {
  id: 'imperial',
  name: 'Империя',
  colors: { hull: 0x2b2e34, hull2: 0x3b3f47, accent: 0x50555f, dark: 0x141619, glass: 0xff5247, gold: 0x7d828c },
  accent: 0xe01e10,
  glow: 0xff5a2a,
  nav: { port: 0xff3024, star: 0xff3024, top: 0xd0d6e0 },
  lore: 'Угрожающий имперский флот: чёрная угловатая броня, красные клинки маркировки и раскалённые до оранжа дюзы.',

  // Full bespoke line — every role has its own Imperial-language hull (no shared
  // silhouette, so no `flourish`; each ship carries its own trench-lines/plating).
  roles: {
    scout: makeImperialScout,
    fighter: makeImperialFighter,
    interceptor: makeImperialInterceptor,
    gunship: makeImperialGunship,
    corvette: makeImperialCorvette,
    freighter: makeImperialFreighter,
    tanker: makeImperialTanker,
    liner: makeImperialLiner,
    flagship: makeImperialFlagship,
  },

  // Bespoke station builders — completely different geometry per type, NOT a
  // recolour of the shared ring/outpost/collector.
  stations: { ring: makeImperialRing, outpost: makeImperialOutpost, collector: makeImperialCollector },
};

// === BESPOKE FLEET — 8 role hulls in the Imperial angular-wedge language ======
// Each a sharp black armoured wedge with blood-red trench-lines, red glass and
// red-orange engines. NOSE = +Z, symmetric about X=0. Baked + faction-coloured
// by buildShip and scaled by the role's display scale.

// SCOUT — Imperial "forward eye". A lean angular arrowhead recon dart: a sharp
// charcoal wedge hull with a stepped dorsal deck, a single red glowing sensor-
// eye glaring forward, a blood-red spine trench, twin red-orange tail engines
// and a pair of red nav beacons. Black, sharp, hostile — NO weapons. NOSE = +Z.
function makeImperialScout(s) {
  const grp = group();

  // --- dagger hull: a flat charcoal wedge tapering to a sharp +Z beak --------
  grp.add(part(wedge(0.11, 0.036, 0.25), C(s, 'hull'), 0, 0, 0));
  // Stepped dorsal deck (lighter plate) layers the armoured wedge profile.
  grp.add(part(wedge(0.066, 0.02, 0.19), C(s, 'hull2'), 0, 0.022, -0.02));
  // Dark ventral keel plate under the belly.
  grp.add(part(box(0.058, 0.012, 0.17), C(s, 'dark'), 0, -0.022, -0.02));
  // Sharp dark prow chine capping the nose into a crisp armoured beak.
  grp.add(part(box(0.018, 0.012, 0.05), C(s, 'dark'), 0, 0, 0.135));

  // --- angular flank armour plates, canted outward (imperial signature) ------
  for (const x of [-1, 1]) {
    addRot(grp, box(0.05, 0.006, 0.12), C(s, 'dark'), x * 0.04, 0.006, -0.04, 0, 0, x * -0.5);
  }

  // --- blood-red trench-lines: one down the spine, one along each flank ------
  grp.add(part(box(0.006, 0.006, 0.2), ACC(s), 0, 0.033, -0.03)); // central spine trench
  for (const x of [-1, 1]) {
    addRot(grp, box(0.004, 0.005, 0.17), ACC(s), x * 0.036, 0.006, -0.03, 0, 0, x * -0.32); // flank leading-edge trench
  }

  // --- single blood-red cyclops sensor-eye glaring forward (hostile, no dish) -
  grp.add(part(box(0.034, 0.02, 0.034), C(s, 'dark'), 0, 0.032, 0.05)); // angular eye socket
  grp.add(part(box(0.04, 0.006, 0.014), ACC(s), 0, 0.046, 0.05)); // red brow slit / visor over the eye
  addRot(grp, cyl(0.017, 0.017, 0.008, 8), C(s, 'hull2'), 0, 0.031, 0.066, Math.PI / 2); // light bezel so the eye pops off the dark hull
  grp.add(part(sph(0.014, 8), ACC(s), 0, 0.031, 0.069)); // blood-red eye lens
  engineGlow(grp, s, 0, 0.031, 0.072, 0.01); // hot core so the eye reads lit and menacing

  // --- low angular dorsal sensor fin behind the eye --------------------------
  addRot(grp, box(0.005, 0.028, 0.05), C(s, 'dark'), 0, 0.044, -0.02, -0.3, 0, 0);

  // --- twin red-orange tail engines ------------------------------------------
  for (const x of [-1, 1]) nozzle(grp, s, x * 0.026, 0, -0.124, 0.016, 0.03);

  // --- red nav beacons at the stern wingtips ---------------------------------
  navLight(grp, s, 'port', -0.05, 0.004, -0.1, 0.007);
  navLight(grp, s, 'star', 0.05, 0.004, -0.1, 0.007);

  // --- panel seams for plated detail -----------------------------------------
  panelZ(grp, s, 0.03, 0.014, -0.03, 0.12);
  panelZ(grp, s, -0.03, 0.014, -0.03, 0.12);

  return grp;
}

// FIGHTER — the iconic Imperial line fighter (the "eye of the fleet"). An angular
// hexagonal command pod with a red cockpit visor-slit facing +Z, flanked by TWO
// armoured hexagonal wing-vanes on short struts (TIE solar panels reimagined as
// black armour plates, NOT lifting airfoils), twin cannons that reach PAST the
// nose with red muzzle tips, and a single red-orange engine at the tail. Sharp,
// symmetric, menacing — reads as WH40k Imperial Navy / Star Wars TIE. Nose = +Z.
function makeImperialFighter(s) {
  const grp = group();

  // --- central command pod: a hex-prism drum (angular, not a TIE ball) --------
  // Flat top/bottom, points at ±X (where the wing struts bolt on). Tapers a hair
  // toward the nose. Dark rear housing caps the tail behind it.
  addRot(grp, cyl(0.05, 0.055, 0.14, 6), C(s, 'hull'), 0, 0, -0.01, Math.PI / 2, 0, 0); // hex drum
  addRot(grp, cyl(0.05, 0.055, 0.04, 6), C(s, 'dark'), 0, 0, -0.09, Math.PI / 2, 0, 0); // rear engine housing

  // Sharp faceted nose spike (4-sided pyramid, diamond-canted) — the beak.
  addRot(grp, cyl(0.006, 0.05, 0.06, 4), C(s, 'dark'), 0, 0, 0.09, Math.PI / 2, 0, Math.PI / 4);

  // Red cockpit visor-slit facing +Z, set into a dark brow + chin (menacing eye).
  grp.add(part(box(0.03, 0.05, 0.03), C(s, 'dark'), 0, 0.004, 0.05)); // dark visor recess (frames the red)
  grp.add(part(box(0.06, 0.024, 0.01), C(s, 'glass'), 0, 0.006, 0.066)); // red glass slit, proud
  addRot(grp, box(0.062, 0.012, 0.03), C(s, 'dark'), 0, 0.034, 0.05, -0.35, 0, 0); // angled brow ridge
  greeble(grp, s, 'dark', 0, -0.032, 0.055, 0.052, 0.016, 0.03); // chin sensor block

  // Signature dark keel + blood-red dorsal spine trench (imperial marking).
  grp.add(part(box(0.03, 0.014, 0.1), C(s, 'dark'), 0, -0.046, -0.01)); // ventral keel
  grp.add(part(box(0.01, 0.012, 0.12), ACC(s), 0, 0.046, -0.01)); // red spine trench
  panelZ(grp, s, 0.024, 0.043, -0.01, 0.09); // dorsal plate seams
  panelZ(grp, s, -0.024, 0.043, -0.01, 0.09);
  greeble(grp, s, 'accent', 0, 0.05, -0.055, 0.024, 0.012, 0.03); // dorsal avionics box

  // --- twin cannons: reach PAST the nose, red muzzle tips ---------------------
  for (const x of [-0.03, 0.03]) {
    grp.add(part(box(0.026, 0.026, 0.07), C(s, 'dark'), x, -0.008, 0.03)); // cannon housing on pod
    barrel(grp, s, x, -0.008, 0.06, 0.007, 0.19); // muzzle brake ends ~z=0.155, well past the beak
    grp.add(part(box(0.016, 0.016, 0.02), ACC(s), x, -0.008, 0.156)); // red muzzle tip
    grp.add(part(sph(0.008, 6), GLOW(s), x, -0.008, 0.163)); // hot charge pip
  }

  // --- armoured hexagonal wing-vanes on short struts (TIE panels as armour) ----
  // Built in a local sub-group (plate in the Y-Z plane, thin in X, cross-ribbed
  // both faces), then bolted out to ±X. Space hardware: a plate, not an airfoil.
  for (const side of [-1, 1]) {
    const w = group();
    addRot(w, cyl(0.1, 0.1, 0.02, 6), C(s, 'hull'), 0, 0, 0, 0, 0, Math.PI / 2); // hex armour plate
    addRot(w, cyl(0.112, 0.112, 0.012, 6), C(s, 'dark'), 0, 0, 0, 0, 0, Math.PI / 2); // dark frame rim
    w.add(part(box(0.028, 0.185, 0.016), C(s, 'dark'), 0, 0, 0)); // vertical structural rib
    w.add(part(box(0.028, 0.016, 0.185), C(s, 'dark'), 0, 0, 0)); // fore-aft structural rib
    w.add(part(box(0.03, 0.13, 0.02), ACC(s), 0, 0, 0)); // red blade marking down the panel
    w.add(part(sph(0.014, 6), GLOW(s), 0, 0, 0)); // red-orange hub "eye"
    w.position.set(side * 0.15, 0, -0.01);
    w.rotation.y = side * -0.09; // slight toe-in cant → aggressive stance
    grp.add(w);

    // stubby armoured strut pod → wing, with a dark end collar + red rib
    grp.add(part(box(0.11, 0.026, 0.055), C(s, 'hull2'), side * 0.095, 0, -0.01)); // strut
    grp.add(part(box(0.02, 0.032, 0.06), C(s, 'dark'), side * 0.142, 0, -0.01)); // wing-root collar
    grp.add(part(box(0.1, 0.006, 0.01), ACC(s), side * 0.095, 0.016, -0.01)); // strut red line
    navLight(grp, s, side > 0 ? 'star' : 'port', side * 0.152, 0.098, -0.01, 0.011); // red wingtip beacon
    rcsQuad(grp, s, side * 0.045, 0.024, 0.04, 0.008); // pod corner RCS
  }

  // --- single central engine at the tail (red-orange) -------------------------
  nozzle(grp, s, 0, 0, -0.12, 0.04, 0.05); // bell fires -Z (adds its own glow)
  engineGlow(grp, s, 0, 0, -0.135, 0.028); // modest central plume (don't drown the hull)

  return grp;
}

// INTERCEPTOR — the Empire's anti-fighter hunter: a NARROW needle wedge, sharper
// and thinner than the fighter, with swept-back angular armour vanes / bent tips,
// LONG forward twin cannons whose blood-red muzzles reach well past the nose, and
// an OVERSIZED twin engine block at the tail for raw speed. Black angular armour,
// red trench-lines + muzzles, a red cockpit slit. NOSE = +Z, tail = -Z.
function makeImperialInterceptor(s) {
  const grp = group();

  // --- narrow needle wedge hull (arrowhead core, tapered to a point at +Z) ---
  grp.add(part(wedge(0.072, 0.042, 0.3), C(s, 'hull'), 0, 0, 0.0)); // main armoured wedge
  // stacked dorsal ridge — a thin raised spine (ISD layered look), narrower still
  grp.add(part(wedge(0.03, 0.024, 0.22), C(s, 'hull2'), 0, 0.028, 0.02));
  // dark belly keel to sharpen the underside into a blade
  grp.add(part(wedge(0.046, 0.018, 0.24), C(s, 'dark'), 0, -0.026, 0.0));

  // --- extended needle prow: a slim dark spike carrying the nose point forward ---
  grp.add(part(box(0.016, 0.013, 0.09), C(s, 'dark'), 0, 0.001, 0.17));

  // --- LONG forward twin cannons — reach WELL past the nose (interceptor punch) ---
  for (const x of [-0.026, 0.026]) {
    barrel(grp, s, x, -0.004, 0.075, 0.006, 0.26); // muzzle at ~0.205, far past the prow
    grp.add(part(box(0.013, 0.013, 0.04), ACC(s), x, -0.004, 0.2)); // blood-red muzzle tip
  }

  // --- red cockpit slit (glass) set into a dark brow on the ridge front ---
  grp.add(part(box(0.03, 0.015, 0.055), C(s, 'dark'), 0, 0.04, 0.065)); // brow housing
  grp.add(part(box(0.022, 0.01, 0.045), C(s, 'glass'), 0, 0.049, 0.07)); // red slit, proud of the brow

  // --- red trench-lines that hug the hull: one spine + two short rear flank seams ---
  grp.add(part(box(0.007, 0.008, 0.17), ACC(s), 0, 0.036, -0.04)); // spine trench (set into the ridge)
  for (const x of [-0.03, 0.03]) grp.add(part(box(0.005, 0.006, 0.11), ACC(s), x, 0.006, -0.05)); // rear flank seams

  // --- swept-back angular armour vanes with bent tips (interceptor signature) ---
  for (const sgn of [-1, 1]) {
    // root vane: a wide angular plate swept back + canted down (anhedral, aggressive)
    const v = part(box(0.12, 0.009, 0.075), C(s, 'hull'), sgn * 0.078, -0.004, -0.06);
    v.rotation.set(0, sgn * 0.6, -sgn * 0.4);
    grp.add(v);
    // bent outer tip: sharper sweep + steeper cant
    const t = part(box(0.06, 0.008, 0.05), C(s, 'dark'), sgn * 0.145, -0.032, -0.095);
    t.rotation.set(0, sgn * 0.95, -sgn * 0.65);
    grp.add(t);
    // red edge accent down the vane leading edge
    const r = part(box(0.11, 0.006, 0.007), ACC(s), sgn * 0.074, 0.001, -0.026);
    r.rotation.set(0, sgn * 0.6, -sgn * 0.4);
    grp.add(r);
    // wing-tip red nav light
    navLight(grp, s, sgn > 0 ? 'star' : 'port', sgn * 0.17, -0.036, -0.105, 0.008);
  }

  // --- canted flank armour plates (imperial fleet greeble language) ---
  for (const sgn of [-1, 1]) {
    addRot(grp, box(0.028, 0.006, 0.09), C(s, 'dark'), sgn * 0.034, 0.016, 0.04, 0, 0, sgn * -0.5);
  }

  // --- OVERSIZED twin engines at the tail (raw speed) ---
  for (const x of [-0.034, 0.034]) {
    addRot(grp, cyl(0.032, 0.03, 0.1, 8), C(s, 'hull2'), x, 0, -0.1, Math.PI / 2); // big engine housing
    addRot(grp, cyl(0.034, 0.034, 0.014, 8), C(s, 'dark'), x, 0, -0.06, Math.PI / 2); // armour ring
    nozzle(grp, s, x, 0, -0.155, 0.028, 0.05); // oversized bell + red-orange glow
  }

  // --- detail: panel seams, RCS, running lights ---
  panelZ(grp, s, 0.028, 0.026, -0.03, 0.12);
  panelZ(grp, s, -0.028, 0.026, -0.03, 0.12);
  for (const x of [-1, 1]) rcsQuad(grp, s, x * 0.028, 0.026, 0.11, 0.007); // bow RCS
  runningLights(grp, s, 0.045, -0.018, 0.12);

  return grp;
}

// A single heavy cannon (gunship): the shared dark barrel + muzzle brake, capped
// with a blood-red muzzle ring. `back` = breech z, `len` = tube length, so the
// muzzle sits at back+len and overhangs the prow.
function cannon(grp, s, x, y, back, len, r) {
  barrel(grp, s, x, y, back + len / 2, r, len);
  addRot(grp, cyl(r * 1.35, r * 1.1, 0.018, 6), ACC(s), x, y, back + len + 0.008, Math.PI / 2); // red muzzle
}

// GUNSHIP — a brutal armoured assault WEDGE, the fleet's slow, mean battery. A
// wide chunky stacked-box wedge (widest & thickest at the stern, blunt-nosed), a
// heavy forward battery block whose FIVE red-tipped cannons bristle past the bow,
// a dorsal drum-turret with an angled twin barrel, canted red-edged dark side-
// armour, a compact command tower with a red-glass bridge, and a DENSE bank of
// red-orange engines at the tail. NOSE = +Z, symmetric about X=0.
function makeImperialGunship(s) {
  const grp = group();

  // ── Thick armoured WEDGE hull (stacked boxes, wide→blunt like the flagship) ──
  // [z-centre, width, height, length] — widest & thickest at the stern, stepping
  // down to a blunt forward block. Chunky, not a needle.
  const segs = [
    [-0.16, 0.26, 0.10, 0.10], // stern engine block (widest, thickest)
    [-0.05, 0.24, 0.095, 0.13], // mid-aft
    [0.06, 0.185, 0.085, 0.12], // mid-forward
    [0.145, 0.12, 0.07, 0.08], // blunt forward block (battery mounts ahead)
  ];
  for (const [z, w, h, l] of segs) grp.add(part(box(w, h, l), C(s, 'hull'), 0, 0, z));
  grp.add(part(box(0.20, 0.05, 0.26), C(s, 'dark'), 0, -0.052, -0.09)); // dark ventral keel mass
  grp.add(part(box(0.16, 0.024, 0.30), C(s, 'hull2'), 0, 0.055, -0.04)); // raised dorsal armour deck
  grp.add(part(box(0.185, 0.022, 0.03), C(s, 'dark'), 0, 0.006, -0.20)); // stern armour lip

  // Dark weld / armour belts + centre seam (heavy-plating cue).
  for (const z of [0.08, -0.05, -0.16]) panelX(grp, s, 0, 0.068, z, 0.15);
  panelZ(grp, s, 0, 0.068, -0.04, 0.30);

  // ── Blood-red signature trench-lines down the spine + flanks ────────────────
  grp.add(part(box(0.012, 0.012, 0.40), ACC(s), 0, 0.07, -0.02)); // central spine trench
  for (const sx of [-1, 1]) grp.add(part(box(0.008, 0.01, 0.26), ACC(s), sx * 0.058, 0.06, -0.05)); // flank trenches

  // ── Canted dark side-armour plates (addRot), each with a red rib ────────────
  // Sit on the wide aft flanks, cant outward at the top — sharp and armoured.
  for (const sx of [-1, 1]) {
    for (const [z, px] of [[-0.05, 0.121], [-0.155, 0.129]]) {
      addRot(grp, box(0.008, 0.075, 0.13), C(s, 'dark'), sx * px, 0.0, z, 0, 0, sx * -0.34);
      addRot(grp, box(0.004, 0.055, 0.10), ACC(s), sx * (px + 0.006), 0.012, z, 0, 0, sx * -0.34);
    }
  }

  // ── Heavy forward battery block + FIVE red-tipped cannons past the bow ───────
  grp.add(part(box(0.165, 0.085, 0.055), C(s, 'hull2'), 0, -0.004, 0.135)); // breech mass (behind the mantlet)
  grp.add(part(box(0.18, 0.09, 0.07), C(s, 'dark'), 0, -0.004, 0.19)); // heavy gun mantlet at the prow
  grp.add(part(box(0.14, 0.012, 0.012), ACC(s), 0, 0.035, 0.19)); // red targeting strip across the mantlet
  // Five cannons spread in Y so they bristle in profile, not stack into one line.
  cannon(grp, s, 0, 0.0, 0.115, 0.205, 0.019); // central heavy (tip ~0.32)
  for (const bx of [-0.042, 0.042]) cannon(grp, s, bx, -0.028, 0.125, 0.185, 0.014); // lower inner pair
  for (const bx of [-0.08, 0.08]) cannon(grp, s, bx, 0.024, 0.135, 0.17, 0.012); // upper outer pair

  // ── Dorsal drum-turret with an up-angled twin barrel ────────────────────────
  {
    const z = 0.02;
    const by = 0.067; // deck top
    grp.add(part(cyl(0.052, 0.058, 0.014, 12), C(s, 'dark'), 0, by + 0.007, z)); // base collar
    grp.add(part(cyl(0.04, 0.043, 0.032, 8), C(s, 'hull2'), 0, by + 0.03, z)); // rotating drum
    const gy = by + 0.052;
    grp.add(part(box(0.08, 0.036, 0.05), C(s, 'dark'), 0, gy, z + 0.008)); // gun housing / mantlet
    grp.add(part(box(0.05, 0.02, 0.016), C(s, 'glass'), 0, gy + 0.004, z - 0.024)); // rear red targeting glass
    for (const bx of [-0.022, 0.022]) {
      addRot(grp, box(0.014, 0.014, 0.11), C(s, 'dark'), bx, gy + 0.01, z + 0.055, -0.2); // barrel, muzzle raised
      grp.add(part(box(0.017, 0.017, 0.014), ACC(s), bx, gy + 0.022, z + 0.108)); // red muzzle tip
    }
  }

  // ── Compact command tower with a red-glass bridge (aft dorsal) ───────────────
  grp.add(part(box(0.075, 0.055, 0.085), C(s, 'dark'), 0, 0.092, -0.105)); // tower base
  grp.add(part(box(0.05, 0.04, 0.055), C(s, 'hull2'), 0, 0.137, -0.105)); // armoured crown
  grp.add(part(box(0.06, 0.022, 0.018), C(s, 'glass'), 0, 0.12, -0.062)); // forward bridge (red glass)
  for (const sx of [-1, 1]) grp.add(part(box(0.028, 0.06, 0.05), C(s, 'dark'), sx * 0.058, 0.072, -0.11)); // flank sub-towers
  antenna(grp, s, 0, 0.157, -0.105, 0.07); // spire mast (adds its own top nav light)
  navLight(grp, s, 'port', 0, 0.17, -0.06, 0.013); // red command beacon

  // ── DENSE red-orange engine bank at the tail ────────────────────────────────
  grp.add(part(box(0.24, 0.085, 0.03), C(s, 'dark'), 0, 0.0, -0.205)); // recessed engine housing
  for (const x of [-0.088, -0.03, 0.03, 0.088]) nozzle(grp, s, x, -0.022, -0.218, 0.026, 0.05); // main row (4 bells)
  for (const x of [-0.06, 0.0, 0.06]) engineGlow(grp, s, x, 0.035, -0.208, 0.02); // raised secondaries (3)

  // ── Lights + bow RCS ────────────────────────────────────────────────────────
  runningLights(grp, s, 0.125, 0.0, -0.145); // red port/star at the wide stern flanks
  navLight(grp, s, 'star', 0.055, -0.008, 0.21, 0.011);
  navLight(grp, s, 'port', -0.055, -0.008, 0.21, 0.011);
  for (const sx of [-1, 1]) {
    rcsQuad(grp, s, sx * 0.06, 0.04, 0.15, 0.011);
    rcsQuad(grp, s, sx * 0.115, -0.05, -0.16, 0.011);
  }

  return grp;
}

// CORVETTE — an Imperial destroyer-escort: a small, mean cousin of the flagship
// dreadnought. An elongated angular WEDGE hull tapering to a sharp ram prow; a
// low aft command tower with a red-glass bridge slit; rows of small side turret
// blisters (drums with short red-tipped guns); blood-red trench-lines down the
// spine; a raised rear engine bank. Reads instantly as "small Star Destroyer".
function makeImperialCorvette(s) {
  const grp = group();

  // --- tapered spear hull: stacked box segments narrowing to the +Z bow -------
  // [z-centre, width, height, length] — the same wedge grammar as the flagship,
  // scaled down. Armoured wide stern → knife-edge bow block, then a ram cone.
  const segs = [
    [-0.22, 0.14, 0.082, 0.1], // armoured stern block
    [-0.12, 0.132, 0.074, 0.12],
    [-0.005, 0.11, 0.062, 0.14], // mid (widest deck)
    [0.11, 0.068, 0.05, 0.12],
    [0.19, 0.036, 0.04, 0.08], // knife bow block
  ];
  for (const [z, w, h, l] of segs) grp.add(part(box(w, h, l), C(s, 'hull'), 0, 0, z));
  // Sharp ram prow cone pointing +Z (menacing Imperial bow, not an aero nose).
  addRot(grp, cone(0.026, 0.075, 8), C(s, 'dark'), 0, 0, 0.255, Math.PI / 2);

  // Lighter dorsal deck plate layers the wedge profile (like the flagship deck).
  grp.add(part(box(0.09, 0.014, 0.46), C(s, 'hull2'), 0, 0.043, -0.05));
  // Dark chined belly keel — reads as an armoured underside, not a flat slab.
  grp.add(part(box(0.06, 0.02, 0.4), C(s, 'dark'), 0, -0.04, -0.05));

  // --- blood-red trench-lines down the spine (signature accent) ---------------
  grp.add(part(box(0.012, 0.012, 0.5), ACC(s), 0, 0.052, -0.02)); // central spine trench
  for (const x of [-0.042, 0.042]) grp.add(part(box(0.008, 0.01, 0.34), ACC(s), x, 0.04, -0.06)); // flank trenches

  // Recessed dorsal plating seams flanking the spine.
  for (const x of [-0.026, 0.026]) panelZ(grp, s, x, 0.051, -0.05, 0.4);

  // --- low aft command tower: dark armoured blocks + a red-glass bridge band ---
  grp.add(part(box(0.066, 0.066, 0.1), C(s, 'dark'), 0, 0.078, -0.17)); // tower base
  grp.add(part(box(0.058, 0.05, 0.032), C(s, 'hull2'), 0, 0.088, -0.118)); // forward bridge face block
  grp.add(part(box(0.052, 0.024, 0.012), C(s, 'glass'), 0, 0.094, -0.101)); // red bridge window band (faces +Z)
  grp.add(part(box(0.042, 0.056, 0.06), C(s, 'dark'), 0, 0.14, -0.185)); // tower crown
  for (const x of [-0.045, 0.045]) grp.add(part(box(0.03, 0.044, 0.05), C(s, 'dark'), x, 0.05, -0.16)); // flank sub-towers

  // --- side turret blisters: a small drum + a short red-tipped gun -------------
  // A row down each flank on the dorsal shoulder — small drums that read as
  // point-defence batteries, guns overhang forward with a glowing red muzzle.
  const turret = (x, y, z, r) => {
    grp.add(part(cyl(r * 1.25, r * 1.4, r * 0.4, 6), C(s, 'dark'), x, y, z)); // base collar
    grp.add(part(cyl(r, r, r * 0.7, 6), C(s, 'hull2'), x, y + r * 0.5, z)); // drum body
    const gy = y + r * 0.5;
    const bl = r * 2.4; // barrel length (overhangs the drum forward)
    addRot(grp, cyl(r * 0.3, r * 0.24, bl, 6), C(s, 'dark'), x, gy, z + r + bl / 2, Math.PI / 2); // gun barrel
    grp.add(part(box(r * 0.34, r * 0.34, r * 0.14), ACC(s), x, gy, z + r + bl)); // red muzzle tip
  };
  for (const sx of [-1, 1]) {
    for (const z of [0.11, 0.035, -0.04, -0.115]) turret(sx * 0.052, 0.038, z, 0.014);
  }

  // Forward bow gun tips (fixed spinal-ish battery, red weapon glow like flagship).
  for (const x of [-0.026, 0.026]) grp.add(part(box(0.011, 0.011, 0.04), ACC(s), x, 0.02, 0.15));

  // --- raised rear engine bank: a three-tier thruster block -------------------
  // Upper raised deck + main mid row + a lower underslung pair — reads as a dense
  // "small flagship" engine bank, thrusters firing -Z with the additive glow.
  grp.add(part(box(0.15, 0.08, 0.03), C(s, 'dark'), 0, -0.008, -0.265)); // main engine face plate
  for (const x of [-0.078, -0.026, 0.026, 0.078]) nozzle(grp, s, x, -0.004, -0.28, 0.019, 0.045); // main mid row
  grp.add(part(box(0.1, 0.036, 0.05), C(s, 'dark'), 0, 0.05, -0.235)); // upper raised engine deck
  for (const x of [-0.032, 0.032]) engineGlow(grp, s, x, 0.056, -0.285, 0.016); // raised secondaries
  for (const x of [-0.05, 0.05]) nozzle(grp, s, x, -0.05, -0.278, 0.015, 0.038); // lower underslung pair

  // --- canted flank armour plates (Imperial signature aggression) -------------
  // Two rows of dark plates raked outward down each flank fill the mid-hull.
  for (const sx of [-1, 1]) {
    for (const z of [0.05, -0.09]) {
      addRot(grp, box(0.04, 0.006, 0.11), C(s, 'dark'), sx * 0.062, 0.018, z, 0, 0, sx * -0.5);
    }
  }

  // Dorsal avionics greebles between the tower and the engine deck.
  for (const x of [-0.024, 0.024]) grp.add(part(box(0.022, 0.016, 0.04), C(s, 'hull2'), x, 0.052, -0.115));
  grp.add(part(box(0.03, 0.014, 0.05), C(s, 'dark'), 0, 0.05, -0.235)); // sensor spine box behind tower

  // Flank plating seams (engraved plate lines down each side).
  for (const x of [-0.05, 0.05]) panelZ(grp, s, x, 0.0, -0.03, 0.24);

  // --- lights, sensor mast + red command beacon -------------------------------
  runningLights(grp, s, 0.06, -0.005, 0.13); // red nav down the flanks
  antenna(grp, s, 0, 0.155, -0.19, 0.09); // sensor mast off the tower crown
  navLight(grp, s, 'port', 0, 0.1, -0.21, 0.012); // red command beacon
  for (const sx of [-1, 1]) rcsQuad(grp, s, sx * 0.05, 0.03, 0.16, 0.008); // bow RCS

  return grp;
}

// FREIGHTER — a MILITARISED armoured cargo hauler of the Imperial navy (NOT a
// civilian tramp). A heavy armoured keel spine runs the whole length; rows of
// dark boxy container modules are clamped along both flanks inside an angular
// armoured cradle; a compact armoured command citadel with a single red viewport
// slit sits forward; blood-red hazard trench-lines band the spine and cargo; a
// pair of heavy red-orange engines aft. NOSE = +Z, symmetric about X=0.
function makeImperialFreighter(s) {
  const grp = group();

  // ---------------------------------------------------------------------------
  // A. ARMOURED SPINE / KEEL — the structural backbone the whole ship hangs on.
  //    Thick central hull beam + a ventral keel spar + a dorsal deck cap, banded
  //    by dark armour ribs (frame stations). Everything else clamps onto this.
  // ---------------------------------------------------------------------------
  grp.add(part(box(0.062, 0.075, 0.44), C(s, 'hull'), 0, 0.0, -0.02)); // main keel beam
  grp.add(part(box(0.03, 0.032, 0.46), C(s, 'dark'), 0, -0.052, -0.02)); // ventral keel spar
  grp.add(part(box(0.05, 0.026, 0.44), C(s, 'hull2'), 0, 0.05, -0.02)); // dorsal deck cap
  for (const z of [0.14, 0.055, -0.03, -0.115, -0.2]) {
    grp.add(part(box(0.078, 0.088, 0.014), C(s, 'dark'), 0, 0.0, z)); // dark armour ribs
  }

  // Blood-red hazard trench down the spine (Imperial signature) + plating seams.
  grp.add(part(box(0.016, 0.012, 0.42), ACC(s), 0, 0.066, -0.02));
  panelZ(grp, s, 0.03, 0.066, -0.02, 0.4);
  panelZ(grp, s, -0.03, 0.066, -0.02, 0.4);

  // ---------------------------------------------------------------------------
  // B. CLAMPED CONTAINER RACKS — rows of dark boxy cargo modules gripped in an
  //    angular armoured cradle on each flank. Clear 2-tier stacks (dark lower /
  //    lighter proud upper, split by a red hazard seam), framed top and end by
  //    the cradle, separated bay-to-bay by dark dividers. 2-high × 4 bays × 2
  //    sides = 16 modules.
  // ---------------------------------------------------------------------------
  const bayZ = [0.12, 0.035, -0.05, -0.135]; // four cargo bays along Z
  for (const sx of [-1, 1]) {
    const x = sx * 0.092; // rack centre |x|
    grp.add(part(box(0.016, 0.02, 0.4), C(s, 'accent'), sx * 0.128, 0.056, -0.02)); // top rack rail (frames the load)
    for (const z of [0.165, -0.185]) grp.add(part(box(0.094, 0.13, 0.016), C(s, 'dark'), x, 0.0, z)); // end bulkheads
    for (let i = 0; i < bayZ.length; i++) {
      const z = bayZ[i];
      grp.add(part(box(0.072, 0.05, 0.072), C(s, 'dark'), x, -0.024, z)); // lower crate (dark)
      grp.add(part(box(0.072, 0.05, 0.072), C(s, 'hull2'), x, 0.03, z)); // upper crate (lighter, proud)
      grp.add(part(box(0.076, 0.006, 0.05), ACC(s), x, 0.004, z)); // red hazard seam between tiers
      grp.add(part(box(0.014, 0.11, 0.01), C(s, 'dark'), sx * 0.128, 0.006, z + 0.041)); // bay divider on outer face
    }
  }
  // Ventral cradle underframe — a ladder basket (two long rails + transverse
  // ribs) with canted side clamp-struts (addRot) biting the stacks: the armoured
  // cradle that grips the cargo. Reads as structure, not dangling legs.
  for (const sx of [-1, 1]) grp.add(part(box(0.012, 0.016, 0.42), C(s, 'dark'), sx * 0.075, -0.062, -0.02)); // long rails
  for (const z of [0.16, 0.078, -0.008, -0.093, -0.178]) {
    grp.add(part(box(0.24, 0.012, 0.012), C(s, 'dark'), 0, -0.062, z)); // transverse rib
    for (const sx of [-1, 1]) {
      addRot(grp, box(0.014, 0.12, 0.012), C(s, 'hull2'), sx * 0.124, -0.006, z, 0, 0, sx * 0.24); // canted clamp-strut
    }
  }

  // ---------------------------------------------------------------------------
  // C. ARMOURED COMMAND CITADEL (forward) — a compact armoured block topped by a
  //    raised bridge tower whose red slit is the ship's single "eye"; a bevelled
  //    prow, hazard chevron, sensor masts, and light PD barrels.
  // ---------------------------------------------------------------------------
  grp.add(part(box(0.14, 0.13, 0.02), C(s, 'dark'), 0, 0.0, 0.185)); // forward weld bulkhead
  grp.add(part(box(0.12, 0.11, 0.09), C(s, 'hull'), 0, 0.006, 0.238)); // command citadel body
  grp.add(part(box(0.1, 0.055, 0.05), C(s, 'dark'), 0, -0.006, 0.292)); // bevelled armoured prow
  grp.add(part(box(0.096, 0.02, 0.016), C(s, 'glass'), 0, 0.024, 0.286)); // red prow viewport slit
  // raised bridge tower with a forward red slit + hazard chevron
  grp.add(part(box(0.08, 0.055, 0.06), C(s, 'hull2'), 0, 0.088, 0.226)); // bridge tower
  grp.add(part(box(0.086, 0.012, 0.012), C(s, 'dark'), 0, 0.106, 0.226)); // tower armour cap
  grp.add(part(box(0.06, 0.018, 0.012), C(s, 'glass'), 0, 0.092, 0.258)); // red bridge slit (forward eye)
  grp.add(part(box(0.09, 0.008, 0.006), ACC(s), 0, 0.056, 0.284)); // hazard chevron on the prow brow
  panelX(grp, s, 0, 0.052, 0.24, 0.1);
  for (const sx of [-1, 1]) {
    antenna(grp, s, sx * 0.032, 0.11, 0.205, 0.08); // sensor masts atop the tower
    barrel(grp, s, sx * 0.05, 0.052, 0.245, 0.008, 0.05); // light point-defence barrel (navy)
  }

  // ---------------------------------------------------------------------------
  // D. HEAVY STERN ENGINE BLOCK — an armoured thrust frame carrying a pair of big
  //    red-orange main engines, capped by a red hazard band.
  // ---------------------------------------------------------------------------
  grp.add(part(box(0.2, 0.13, 0.06), C(s, 'dark'), 0, 0.0, -0.235)); // engine mount block
  grp.add(part(box(0.2, 0.01, 0.05), ACC(s), 0, 0.062, -0.235)); // dorsal red hazard band
  for (const sx of [-1, 1]) {
    addRot(grp, cyl(0.036, 0.03, 0.05, 8), C(s, 'hull'), sx * 0.05, 0.0, -0.262, Math.PI / 2); // engine housing
    engineGlow(grp, s, sx * 0.05, 0.0, -0.278, 0.027); // big main engine glow
  }

  // ---------------------------------------------------------------------------
  // Lights + RCS.
  // ---------------------------------------------------------------------------
  runningLights(grp, s, 0.135, 0.03, 0.26); // red nav at the forward shoulders
  navLight(grp, s, 'top', 0, 0.12, 0.2, 0.01);
  for (const sx of [-1, 1]) {
    rcsQuad(grp, s, sx * 0.132, 0.05, 0.14, 0.01);
    rcsQuad(grp, s, sx * 0.132, -0.05, -0.15, 0.01);
    navLight(grp, s, sx > 0 ? 'star' : 'port', sx * 0.09, 0.0, -0.29, 0.012); // engine flank markers
  }
  return grp;
}

// TANKER — an armoured Imperial fuel barge: three dark cylindrical tanks banded
// onto a shallow armour flatbed inside an open cradle, a bold blood-red hazard
// trench down the spine, round tank heads + a small red-slit cockpit forward, a
// rear dorsal armour shroud partly covering the tanks, and a heavy 3-nozzle
// engine bank with a red engineering band. NOSE = +Z, symmetric about X=0.
function makeImperialTanker(s) {
  const grp = group();

  // Tank-row constants — reused for cradle, heads, straps and engines.
  const TR = 0.035; // tank radius
  const TL = 0.36; // tank length (runs along Z)
  const TY = 0.026; // tank-axis height (bottom nestles in the flatbed lip)
  const TZ = -0.01; // bundle centre Z
  const FRONT = TZ + TL / 2; // forward head plane
  const REAR = TZ - TL / 2; // aft head plane
  const TOP = TY + TR; // exposed tank crown
  const tankX = [-0.075, 0, 0.075]; // three tanks across, valleys between
  const ZFRAMES = [0.13, 0.04, -0.07, -0.16]; // cradle cross-frame stations

  // --- shallow armoured FLATBED the tanks ride on: deck + ventral belly plate ---
  grp.add(part(box(0.205, 0.026, TL + 0.01), C(s, 'hull2'), 0, -0.018, TZ)); // deck bed (mid grey)
  grp.add(part(box(0.155, 0.016, TL - 0.05), C(s, 'dark'), 0, -0.04, TZ)); // ventral belly plate

  // --- the fuel TANKS: three dark cylinders in a row, crowns fully exposed ---
  for (const x of tankX) {
    addRot(grp, cyl(TR, TR, TL, 8), C(s, 'hull'), x, TY, TZ, Math.PI / 2); // tank body (dark)
    // reinforced HEAD flange + filler cap on the exposed forward rim (fuel cue)
    addRot(grp, cyl(TR * 1.24, TR * 1.24, 0.02, 8), C(s, 'accent'), x, TY, FRONT - 0.006, Math.PI / 2);
    addRot(grp, cyl(TR * 0.9, TR * 0.9, 0.01, 8), C(s, 'dark'), x, TY, FRONT + 0.006, Math.PI / 2); // domed head cap
    addRot(grp, cyl(TR * 0.42, TR * 0.42, 0.028, 8), C(s, 'accent'), x, TY, FRONT + 0.016, Math.PI / 2); // filler stub
  }

  // --- open cradle CROSS-FRAMES: valley uprights + outer uprights + top straps ---
  for (const z of ZFRAMES) {
    grp.add(part(box(0.225, 0.011, 0.015), C(s, 'accent'), 0, TOP + 0.006, z)); // strap over the crowns
    for (const x of [-0.0375, 0.0375]) grp.add(part(box(0.011, 0.08, 0.015), C(s, 'accent'), x, TY, z)); // valley upright
    for (const x of [-0.108, 0.108]) grp.add(part(box(0.011, 0.06, 0.015), C(s, 'accent'), x, TY - 0.006, z)); // outer upright
  }

  // --- low canted CHEEK plates over the two outer-lower flanks (partly shroud) ---
  for (const x of [-1, 1]) {
    addRot(grp, box(0.02, 0.042, TL - 0.06), C(s, 'hull2'), x * 0.106, -0.002, TZ, 0, 0, x * -0.26);
  }

  // --- rear dorsal ARMOUR SHROUD over the aftmost bay: some tanks covered, the
  // forward crowns/heads left open — reads "partly shrouded, not fully exposed" ---
  grp.add(part(box(0.222, 0.03, 0.1), C(s, 'hull2'), 0, TOP + 0.006, REAR + 0.05)); // shroud roof
  addRot(grp, box(0.05, 0.014, 0.1), ACC(s), 0, TOP + 0.024, REAR + 0.05, 0, 0.6, 0); // hazard slash on the shroud
  grp.add(part(box(0.222, 0.014, 0.012), C(s, 'accent'), 0, TOP + 0.021, REAR + 0.1)); // shroud front lip rail

  // --- BOLD blood-red hazard trench down the centre tank + hazard chevrons ---
  grp.add(part(box(0.019, 0.014, TL - 0.01), ACC(s), 0, TOP - 0.002, TZ)); // spine trench
  for (const z of [0.13, 0.04, -0.07]) grp.add(part(box(0.05, 0.008, 0.012), ACC(s), 0, TOP + 0.014, z)); // hazard chevrons

  // --- small armoured COCKPIT forward: sits ON the front crowns, leaving the three
  // round tank HEADS exposed and jutting forward below it ---
  grp.add(part(box(0.07, 0.05, 0.08), C(s, 'hull2'), 0, 0.078, FRONT - 0.03)); // cockpit block, on the crowns
  grp.add(part(box(0.082, 0.014, 0.05), C(s, 'dark'), 0, 0.106, FRONT + 0.0)); // armoured brow
  grp.add(part(box(0.044, 0.012, 0.01), C(s, 'glass'), 0, 0.08, FRONT + 0.012)); // red vision slit
  grp.add(part(box(0.046, 0.05, 0.05), C(s, 'dark'), 0, 0.05, FRONT + 0.03)); // pointed armoured prow above centre head
  panelZ(grp, s, 0.024, 0.104, FRONT - 0.03, 0.05);
  panelZ(grp, s, -0.024, 0.104, FRONT - 0.03, 0.05);

  // --- heavy rear ENGINE bank: 3 mains aligned to the tanks + 2 raised secondaries ---
  grp.add(part(box(0.185, 0.11, 0.05), C(s, 'dark'), 0, 0.02, REAR - 0.02)); // engine deck block
  grp.add(part(box(0.16, 0.024, 0.045), ACC(s), 0, 0.082, REAR - 0.02)); // red engineering band
  for (const x of tankX) nozzle(grp, s, x, 0.016, REAR - 0.04, 0.03, 0.05); // 3 main nozzles
  for (const x of [-0.04, 0.04]) engineGlow(grp, s, x, 0.08, REAR - 0.05, 0.016); // 2 raised secondaries

  // --- keel panel seams + ring seams for scale ---
  panelZ(grp, s, 0.098, -0.018, TZ, 0.32);
  panelZ(grp, s, -0.098, -0.018, TZ, 0.32);
  panelX(grp, s, 0, -0.041, 0.1, 0.14);
  panelX(grp, s, 0, -0.041, -0.12, 0.14);

  // --- greebles: ventral pump housings + corner RCS ---
  greeble(grp, s, 'hull2', 0, -0.036, 0.07, 0.045, 0.028, 0.04); // fore pump box
  greeble(grp, s, 'hull2', 0, -0.036, -0.11, 0.045, 0.028, 0.04); // aft pump box
  for (const x of [-1, 1]) rcsQuad(grp, s, x * 0.088, 0.0, FRONT - 0.05, 0.011);

  // --- lights: red running lights + a red command beacon + short comms mast ---
  runningLights(grp, s, 0.106, 0.0, FRONT - 0.02);
  navLight(grp, s, 'port', 0, 0.114, FRONT - 0.03, 0.011); // red command beacon on the cockpit
  antenna(grp, s, 0.024, 0.104, FRONT - 0.06, 0.05); // short comms mast
  return grp;
}

// LINER — Imperial troop/colonist barge. A cold institutional PRISON-BARGE, not
// a friendly cruise liner: a long armoured slab hull with a flat constant-width
// cell-block flank, three rows of red-lit window-slits down both sides, a squat
// stepped armoured superstructure amidships-aft with a wide red-glass bridge,
// canted dark armour plates, blood-red trench-lines, and a rear engine bank.
function makeImperialLiner(s) {
  const grp = group();

  // --- armoured slab hull along Z (nose +Z, stern -Z). Deliberately long, blunt
  //     and constant-width in the middle so the window rows sit on one flat wall. ---
  grp.add(part(box(0.15, 0.10, 0.14), C(s, 'hull'), 0, 0, -0.26));    // stern engineering block
  grp.add(part(box(0.156, 0.108, 0.02), C(s, 'dark'), 0, 0, -0.19));  // armour weld collar
  grp.add(part(box(0.15, 0.10, 0.40), C(s, 'hull'), 0, 0, 0.0));      // MAIN SLAB — the long cell-block
  grp.add(part(box(0.13, 0.024, 0.40), C(s, 'hull2'), 0, 0.052, 0.0)); // lighter dorsal deck plate
  grp.add(part(box(0.156, 0.108, 0.02), C(s, 'dark'), 0, 0, 0.185));  // forward armour weld collar
  grp.add(part(box(0.11, 0.085, 0.10), C(s, 'hull'), 0, -0.004, 0.24)); // bow shoulder (chamfered)
  grp.add(part(box(0.07, 0.06, 0.07), C(s, 'dark'), 0, -0.006, 0.31)); // blunt armoured prow
  grp.add(part(box(0.09, 0.03, 0.05), C(s, 'hull2'), 0, 0.028, 0.30)); // prow ram plate
  grp.add(part(box(0.11, 0.03, 0.42), C(s, 'dark'), 0, -0.056, -0.02)); // ventral keel spine

  // --- red-lit window-slit rows: dense cell-block lighting along both flanks.
  //     Each slit is a tiny additive GLOW box sitting PROUD of the hull inside a
  //     recessed dark band, so three tiers read unmistakably as lit prison decks. ---
  for (const x of [-1, 1]) {
    for (const y of [-0.028, 0.004, 0.036]) {
      grp.add(part(box(0.004, 0.016, 0.35), C(s, 'dark'), x * 0.0765, y, -0.01)); // recessed window band
      for (let z = -0.17; z <= 0.16; z += 0.021) {
        grp.add(part(box(0.005, 0.008, 0.012), GLOW(s), x * 0.079, y, z)); // lit red slit
      }
    }
  }

  // --- armoured superstructure (deckhouse) amidships-aft: a tall stepped command
  //     island. Its forward wall is a recessed DARK face carrying a wide red-glass
  //     bridge viewport, mounted well above the deck so it never merges with the
  //     dorsal trench-line. Stepped back + up as it rises. ---
  grp.add(part(box(0.12, 0.07, 0.19), C(s, 'dark'), 0, 0.088, -0.08));   // armoured deckhouse base
  grp.add(part(box(0.09, 0.06, 0.13), C(s, 'hull'), 0, 0.14, -0.09));    // upper block
  grp.add(part(box(0.06, 0.05, 0.08), C(s, 'dark'), 0, 0.185, -0.10));   // crown block
  grp.add(part(box(0.11, 0.05, 0.02), C(s, 'dark'), 0, 0.108, 0.018));   // recessed forward bridge wall
  grp.add(part(box(0.085, 0.022, 0.012), C(s, 'glass'), 0, 0.112, 0.03)); // wide red-glass bridge viewport
  grp.add(part(box(0.07, 0.016, 0.01), C(s, 'glass'), 0, 0.152, -0.028)); // upper command slit (red)

  // --- canted dark armour plates along the dorsal flanks (Imperial signature) ---
  for (const x of [-1, 1]) {
    for (const z of [-0.15, 0.06, 0.16]) {
      addRot(grp, box(0.05, 0.01, 0.10), C(s, 'dark'), x * 0.058, 0.056, z, 0, 0, x * -0.5);
    }
  }

  // --- blood-red trench-lines framing the command island: a bow-deck spine + a
  //     stern-deck spine (gap left clear at the tower) + two upper-flank strakes. ---
  grp.add(part(box(0.012, 0.012, 0.22), ACC(s), 0, 0.066, 0.14));          // bow-deck spine trench
  grp.add(part(box(0.012, 0.012, 0.1), ACC(s), 0, 0.066, -0.26));          // stern-deck spine trench
  for (const x of [-1, 1]) grp.add(part(box(0.004, 0.01, 0.42), ACC(s), x * 0.078, 0.05, -0.01)); // upper-flank strake

  // --- institutional greebles: ventral cargo/pod hatches + deck seams ---
  for (const x of [-1, 1]) {
    for (const z of [-0.12, 0.0, 0.12]) greeble(grp, s, 'dark', x * 0.045, -0.056, z, 0.03, 0.02, 0.05);
    panelZ(grp, s, x * 0.05, 0.064, 0.0, 0.36);
  }

  // --- rear engine bank: an armoured deck with a row of red-orange thrusters ---
  grp.add(part(box(0.16, 0.10, 0.02), C(s, 'dark'), 0, 0, -0.335));          // engine armour plate
  for (const x of [-0.05, 0, 0.05]) nozzle(grp, s, x, 0, -0.345, 0.022, 0.05); // main thrusters
  for (const x of [-0.025, 0.025]) engineGlow(grp, s, x, 0, -0.36, 0.016);     // fill glows
  for (const x of [-0.04, 0.04]) engineGlow(grp, s, x, 0.032, -0.35, 0.013);   // raised secondaries

  // --- comms mast + a small sensor dish on the deckhouse; cold + red lights ---
  antenna(grp, s, 0, 0.21, -0.1, 0.1);          // command mast on the crown + cold-white top light
  dish(grp, s, 0, 0.123, -0.15, 0.03, 0.4);     // sensor dish on the deckhouse aft roof
  runningLights(grp, s, 0.079, 0.02, 0.14);     // red port/star lights near the bow flanks
  navLight(grp, s, 'port', 0, 0.215, -0.1, 0.012); // red command beacon on the crown

  return grp;
}

// === BESPOKE FLAGSHIP — a colossal, richly detailed dreadnought ==============

// A bristling flank turret — the Imperial dreadnought's signature detail, tiled
// in rows down both dorsal shoulders. A hex base collar + a rotating drum + TWIN
// short barrels overhanging forward with blood-red muzzle tips. `heavy` swaps in
// a boxy gun-house + longer guns for the big fore-dorsal batteries. Low-poly
// (6-seg drums/barrels) so a whole bristling row stays inside the tri budget.
function impTurret(grp, s, x, y, z, r, heavy = false) {
  grp.add(part(cyl(r * 1.35, r * 1.55, r * 0.4, 6), C(s, 'dark'), x, y, z)); // hex base collar
  grp.add(part(cyl(r, r, r * 0.95, 6), C(s, 'hull2'), x, y + r * 0.52, z)); // rotating drum (tall, reads as a turret)
  const gy = y + r * 0.72;
  if (heavy) {
    grp.add(part(box(r * 2.2, r * 0.9, r * 1.7), C(s, 'dark'), x, gy, z + r * 0.4)); // armoured gun-house
    grp.add(part(box(r * 1.5, r * 0.5, r * 0.4), C(s, 'glass'), x, gy + r * 0.5, z - r * 0.7)); // rear targeting glass
  }
  const bl = heavy ? r * 3.4 : r * 2.9; // barrel length (overhangs forward, reads as guns)
  const el = heavy ? 0.22 : 0.34; // muzzle ELEVATION — barrels poke up so the row bristles against the sky
  const ca = Math.cos(el), sa = Math.sin(el);
  for (const bx of [-r * 0.42, r * 0.42]) {
    addRot(grp, cyl(r * 0.3, r * 0.24, bl, 6), C(s, 'dark'), x + bx, gy + (bl / 2) * sa, z + r + (bl / 2) * ca, Math.PI / 2 - el); // barrel
    grp.add(part(box(r * 0.44, r * 0.44, r * 0.16), ACC(s), x + bx, gy + bl * sa, z + r + bl * ca)); // blood-red muzzle tip
  }
}

// A heavy spinal/side cannon whose muzzle overhangs PAST the bow. The shared dark
// barrel + muzzle brake, capped by a glowing red muzzle ring + a hot charge pip so
// it reads as a charged main gun. `back` = breech z, `len` = tube length.
function impCannon(grp, s, x, y, back, len, r) {
  barrel(grp, s, x, y, back + len / 2, r, len); // tube + muzzle brake (ends ~back+len)
  addRot(grp, cyl(r * 1.5, r * 1.2, 0.02, 6), ACC(s), x, y, back + len + 0.01, Math.PI / 2); // red muzzle ring
  grp.add(part(sph(r * 0.9, 6), GLOW(s), x, y, back + len + 0.024)); // hot charge pip
}

// FLAGSHIP "Длань Императора" — a COLOSSAL Imperial dreadnought. A long tapered
// arrowhead: a wide armoured stern stepping down to a needle bow, a TERRACED
// dorsal superstructure (the ISD stacked-deck pyramid) rising aft into a tall
// command-tower island crowned by TWIN deflector domes + a spire, blood-red
// trench-lines fore-and-aft, bristling turret rows down both dorsal flanks, heavy
// spinal cannons overhanging the bow, a red-lit ventral hangar recess, and a
// DENSE stepped rear engine bank. NOSE = +Z, tail = -Z, symmetric about X=0.
// Clearly the biggest, most detailed hull in the fleet. Local Z-length ~1.05.
function makeImperialFlagship(s) {
  const grp = group();

  // ── A. MAIN ARROWHEAD HULL — stacked box segments narrowing to the +Z bow ────
  // [z-centre, width, height, length] — widest & thickest armoured stern stepping
  // down through the body to a knife-edge needle bow. The proven wedge grammar,
  // scaled up huge.
  const segs = [
    [-0.44, 0.34, 0.10, 0.16], // armoured stern block (widest)
    [-0.28, 0.31, 0.095, 0.18],
    [-0.08, 0.25, 0.088, 0.26], // mid body (main deck)
    [0.16, 0.16, 0.072, 0.24],
    [0.34, 0.085, 0.058, 0.18], // forward wedge
    [0.47, 0.03, 0.045, 0.1], // needle bow block
  ];
  for (const [z, w, h, l] of segs) grp.add(part(box(w, h, l), C(s, 'hull'), 0, 0, z));
  // Sharp dark ram spike carrying the nose to a crisp Imperial beak.
  addRot(grp, cone(0.026, 0.11, 8), C(s, 'dark'), 0, 0, 0.55, Math.PI / 2);
  // Dark chined ventral keel mass + two under-rails → an armoured underside blade.
  grp.add(part(box(0.16, 0.032, 0.66), C(s, 'dark'), 0, -0.058, -0.06));
  for (const sx of [-1, 1]) grp.add(part(box(0.03, 0.026, 0.5), C(s, 'hull2'), sx * 0.11, -0.05, -0.08)); // ventral chine rails

  // ── B. TERRACED DORSAL SUPERSTRUCTURE — the ISD stacked-deck pyramid ─────────
  // Four progressively narrower/shorter plates, each stepped UP and shifted AFT,
  // so the profile climbs in clear terraces toward the aft command tower. Each
  // terrace gets a dark vertical RISER at its forward face so the step reads
  // unmistakably as a wedding-cake tier in side profile (not one flat slab).
  const decks = [
    [0.066, 0.27, 0.62, -0.06, 'hull2', 0.31], // [y, w, l, z, slot, riserFrontZ]
    [0.104, 0.21, 0.46, -0.13, 'hull', 0.10],
    [0.142, 0.155, 0.32, -0.20, 'hull2', -0.04],
    [0.180, 0.11, 0.20, -0.29, 'hull', -0.19], // T4 tower plaza
  ];
  for (const [y, w, l, z, slot, fz] of decks) {
    grp.add(part(box(w, 0.036, l), C(s, slot), 0, y, z)); // terrace plate (thick, reads as a deck)
    grp.add(part(box(w, 0.05, 0.02), C(s, 'dark'), 0, y - 0.008, fz)); // forward riser face (the step)
  }
  // Raised armour-plate strips flanking the main deck (heavy-plating cue).
  for (const sx of [-1, 1]) grp.add(part(box(0.03, 0.038, 0.56), C(s, 'dark'), sx * 0.108, 0.072, -0.06));
  // Dark armour belts banding the deck across (frame stations).
  for (const z of [0.16, 0.02, -0.12, -0.24]) panelX(grp, s, 0, 0.086, z, 0.24);

  // ── C. BLOOD-RED SIGNATURE TRENCH-LINES (dorsal spine + flanks + ventral) ─────
  grp.add(part(box(0.016, 0.014, 0.58), ACC(s), 0, 0.088, 0.02)); // dorsal central spine trench (forward deck)
  for (const sx of [-1, 1]) grp.add(part(box(0.01, 0.012, 0.46), ACC(s), sx * 0.09, 0.088, 0.0)); // dorsal flank trenches
  grp.add(part(box(0.012, 0.012, 0.52), ACC(s), 0, -0.074, -0.06)); // ventral spine trench
  for (const sx of [-1, 1]) panelZ(grp, s, sx * 0.05, 0.088, 0.0, 0.46); // dorsal plating seams

  // ── D. CANTED FLANK ARMOUR PLATES (Imperial faceted aggression), red-ribbed ──
  // Rows of dark plates raked outward down each flank of the base wedge.
  for (const sx of [-1, 1]) {
    for (const [z, px] of [[-0.34, 0.165], [-0.16, 0.15], [0.04, 0.115]]) {
      addRot(grp, box(0.01, 0.075, 0.14), C(s, 'dark'), sx * px, -0.005, z, 0, 0, sx * -0.36);
      addRot(grp, box(0.005, 0.05, 0.11), ACC(s), sx * (px + 0.006), 0.006, z, 0, 0, sx * -0.36);
    }
  }

  // ── E. COMMAND-TOWER ISLAND (aft) — the dreadnought's citadel ────────────────
  // A stepped dark tower rising from the T4 plaza, a wide red-glass bridge facing
  // +Z, TWIN deflector domes, a central spire mast, and two flank sub-towers.
  const TZ = -0.31; // tower centre Z
  grp.add(part(box(0.15, 0.14, 0.17), C(s, 'dark'), 0, 0.255, TZ)); // tower base block (massive)
  grp.add(part(box(0.115, 0.11, 0.125), C(s, 'hull'), 0, 0.365, TZ)); // upper tower
  grp.add(part(box(0.075, 0.066, 0.085), C(s, 'dark'), 0, 0.44, TZ - 0.005)); // crown
  grp.add(part(box(0.14, 0.05, 0.022), C(s, 'glass'), 0, 0.29, TZ + 0.092)); // wide red-glass bridge (faces +Z)
  grp.add(part(box(0.09, 0.024, 0.012), C(s, 'glass'), 0, 0.385, TZ + 0.065)); // upper command slit (red)
  grp.add(part(box(0.155, 0.016, 0.016), ACC(s), 0, 0.325, TZ + 0.088)); // red targeting strip across the bridge
  // TWIN deflector/sensor domes flanking the spire (the iconic ISD globes).
  for (const dx of [-0.046, 0.046]) blister(grp, s, dx, 0.475, TZ, 0.04);
  // Central spire mast between the domes + a red command beacon.
  antenna(grp, s, 0, 0.47, TZ, 0.15); // mast + its own top nav light
  navLight(grp, s, 'port', 0, 0.56, TZ, 0.018); // red command beacon on the mast
  navLight(grp, s, 'port', 0, 0.35, TZ + 0.07, 0.013); // red bridge beacon
  // Flank sub-towers with their own red slits.
  for (const sx of [-1, 1]) {
    grp.add(part(box(0.055, 0.15, 0.1), C(s, 'dark'), sx * 0.115, 0.185, TZ + 0.02)); // sub-tower
    grp.add(part(box(0.044, 0.036, 0.056), C(s, 'hull2'), sx * 0.115, 0.28, TZ + 0.02)); // sub-tower cap
    grp.add(part(box(0.032, 0.016, 0.01), C(s, 'glass'), sx * 0.115, 0.25, TZ + 0.072)); // red slit
  }
  // A sensor dish + short comms masts on the aft tower shoulder (extra citadel detail).
  dish(grp, s, 0, 0.3, TZ - 0.1, 0.05, 0.35);
  for (const sx of [-1, 1]) antenna(grp, s, sx * 0.055, 0.3, TZ - 0.06, 0.08);

  // ── F. BRISTLING TURRET ROWS down both dorsal flanks ─────────────────────────
  // An outer row of seven point-defence turrets per side along the deck-edge
  // gunwale, plus a big fore-dorsal heavy battery per side and two centreline
  // turrets — the ship reads as bristling with guns.
  for (const sx of [-1, 1]) {
    for (const z of [0.23, 0.13, 0.03, -0.07, -0.17, -0.27, -0.37]) impTurret(grp, s, sx * 0.118, 0.092, z, 0.023);
    impTurret(grp, s, sx * 0.062, 0.096, 0.15, 0.034, true); // heavy fore-dorsal battery
  }
  // Two centreline dorsal turrets on the terraces for extra bristle.
  impTurret(grp, s, 0, 0.168, -0.02, 0.028);
  impTurret(grp, s, 0, 0.092, 0.24, 0.024);
  // Dorsal deck greebles between the turret rows — avionics boxes, vents + a pair
  // of sensor blisters — so the broad main deck reads as a dense city, not a slab.
  for (const z of [0.19, 0.07, -0.05]) {
    for (const sx of [-1, 1]) greeble(grp, s, 'hull2', sx * 0.05, 0.09, z, 0.03, 0.016, 0.05); // avionics boxes
    grp.add(part(box(0.055, 0.01, 0.01), ACC(s), 0, 0.094, z + 0.03)); // red hazard chevrons on the spine
  }
  for (const sx of [-1, 1]) greeble(grp, s, 'dark', sx * 0.088, 0.09, -0.2, 0.024, 0.02, 0.06); // aft vent blocks
  blister(grp, s, 0, 0.096, 0.12, 0.022); // forward sensor blister
  blister(grp, s, 0, 0.096, -0.12, 0.02); // mid sensor blister

  // ── G. HEAVY SPINAL & SIDE CANNONS overhanging the bow ───────────────────────
  grp.add(part(box(0.13, 0.065, 0.1), C(s, 'hull2'), 0, 0.014, 0.28)); // forward battery breech mass
  grp.add(part(box(0.15, 0.075, 0.05), C(s, 'dark'), 0, 0.01, 0.35)); // heavy gun mantlet at the prow
  grp.add(part(box(0.12, 0.014, 0.014), ACC(s), 0, 0.052, 0.35)); // red targeting strip
  impCannon(grp, s, 0, 0.016, 0.34, 0.36, 0.018); // central heavy spinal (muzzle ~0.70, well past the bow tip)
  for (const bx of [-0.045, 0.045]) impCannon(grp, s, bx, -0.008, 0.32, 0.32, 0.014); // flanking side cannons (muzzle ~0.64)

  // ── H. VENTRAL HANGAR RECESS — a dark bay mouth with a faint red interior glow ─
  grp.add(part(box(0.13, 0.04, 0.16), C(s, 'dark'), 0, -0.05, -0.16)); // recessed bay mouth (belly)
  grp.add(part(box(0.09, 0.028, 0.12), C(s, 'hull2'), 0, -0.05, -0.16)); // interior back wall (depth)
  grp.add(part(box(0.075, 0.016, 0.1), GLOW(s), 0, -0.05, -0.16)); // faint red hangar interior glow
  for (const sx of [-1, 1]) grp.add(part(box(0.008, 0.03, 0.14), C(s, 'dark'), sx * 0.066, -0.05, -0.16)); // bay-door frame lips

  // ── I. DENSE STEPPED REAR ENGINE BANK — 6 big thrusters + fill glows ─────────
  grp.add(part(box(0.32, 0.11, 0.04), C(s, 'dark'), 0, -0.005, -0.52)); // main engine face plate
  grp.add(part(box(0.2, 0.05, 0.04), C(s, 'dark'), 0, 0.075, -0.5)); // stepped upper engine deck
  grp.add(part(box(0.3, 0.014, 0.045), ACC(s), 0, 0.055, -0.5)); // red engineering band
  for (const x of [-0.11, -0.037, 0.037, 0.11]) nozzle(grp, s, x, -0.02, -0.54, 0.034, 0.05); // main row (4 big bells)
  for (const x of [-0.06, 0.06]) nozzle(grp, s, x, 0.075, -0.53, 0.026, 0.045); // raised row (2 bells)
  for (const x of [-0.09, 0.0, 0.09]) engineGlow(grp, s, x, 0.03, -0.53, 0.018); // fill glows between bells

  // ── J. RADIATOR FINS off the stern flanks (space heat cue) ───────────────────
  for (const sx of [-1, 1]) {
    addRot(grp, box(0.006, 0.11, 0.18), C(s, 'dark'), sx * 0.2, 0.0, -0.36, 0, 0, sx * 0.5); // canted fin
    radiatorPanel(grp, s, sx * 0.165, 0.055, -0.4, 0.05, 0.14); // ribbed radiator plate
  }

  // ── K. LIGHTS, BEACONS & RCS ─────────────────────────────────────────────────
  runningLights(grp, s, 0.14, 0.0, 0.18); // red port/star at the forward shoulders
  runningLights(grp, s, 0.17, 0.0, -0.42); // red port/star at the wide stern
  navLight(grp, s, 'star', 0.05, 0.02, 0.44, 0.012); // bow markers
  navLight(grp, s, 'port', -0.05, 0.02, 0.44, 0.012);
  for (const sx of [-1, 1]) {
    rcsQuad(grp, s, sx * 0.07, 0.05, 0.3, 0.012); // bow-shoulder RCS
    rcsQuad(grp, s, sx * 0.16, -0.05, -0.42, 0.012); // stern-corner RCS
  }
  greeble(grp, s, 'hull2', 0, 0.155, -0.02, 0.06, 0.02, 0.05); // dorsal sensor spine box (fore of tower)

  return grp;
}

// === BESPOKE STATIONS — angular FORTRESS aesthetic, own geometry =============
// Each builder returns a fresh group (createStation faction-colours + bakes it).
// Nothing like the round Alliance hub: dark faceted hulls, wedge arms, red slits.

// A fortress gun EMPLACEMENT — a dark armoured drum battery with an up-cropped
// mantlet, a red targeting-glass eye and twin blood-red-tipped barrels. Built in
// a local frame where the barrels fire +X (radial-out when the caller spins it
// into place) and the drum rises +Z (out of the mounting surface), so one helper
// serves both the spinning ring arms and the fixed core batteries.
function fortTurret(s, r) {
  const t = group();
  addRot(t, cyl(r * 1.5, r * 1.7, r * 0.45, 6), C(s, 'dark'), 0, 0, 0, Math.PI / 2); // base collar (drum axis +Z)
  addRot(t, cyl(r, r, r * 0.95, 8), C(s, 'hull2'), 0, 0, r * 0.55, Math.PI / 2); // rotating drum
  const gz = r * 0.62; // gun bore height above the surface
  t.add(part(box(r * 1.15, r * 2.0, r), C(s, 'dark'), r * 0.5, 0, gz)); // gun mantlet, forward +X
  t.add(part(box(r * 0.35, r * 1.1, r * 0.4), C(s, 'glass'), -r * 0.55, 0, gz + r * 0.42)); // red targeting eye (rear)
  for (const by of [-r * 0.5, r * 0.5]) {
    addRot(t, cyl(r * 0.3, r * 0.24, r * 2.6, 6), C(s, 'dark'), r * 2.1, by, gz, 0, 0, Math.PI / 2); // barrel tube
    t.add(part(box(r * 0.42, r * 0.42, r * 0.42), ACC(s), r * 3.45, by, gz)); // blood-red muzzle tip
  }
  return t;
}

// One angular DOCKING ARM of the defence ring, built radially along +X (the arm
// is rotated about Z into its slot). A wedge armour spar with red trench-lines,
// a strut truss biting back toward the core, a recessed red-lit docking bay with
// clamp rails at the tip, a fortress turret riding its dorsal face, and a red
// arm-tip beacon. Everything hangs off this so the whole arm spins as one.
function dockArm(s) {
  const arm = group();
  // radial wedge spar (spans r≈0.48 → 1.16), lighter so it reads as a spoke against
  // the dark frame; dark armour caps; bright accent edge rails; a THIN red trench.
  arm.add(part(box(0.7, 0.15, 0.2), C(s, 'hull2'), 0.82, 0, 0)); // main spar (lighter)
  arm.add(part(box(0.72, 0.04, 0.21), C(s, 'dark'), 0.82, 0.095, 0)); // dorsal armour cap
  arm.add(part(box(0.72, 0.04, 0.21), C(s, 'dark'), 0.82, -0.095, 0)); // ventral armour cap
  for (const sz of [-1, 1]) {
    arm.add(part(box(0.74, 0.025, 0.02), C(s, 'accent'), 0.82, 0.11, sz * 0.088)); // bright edge rail (catches light)
    arm.add(part(box(0.62, 0.05, 0.008), ACC(s), 0.82, 0, sz * 0.105)); // thin red trench-line, both faces
  }
  panelX(arm, s, 0.82, 0.072, 0.05, 0.52); // plating seam

  // strut truss to the core: a dark X-brace + cross tie with a short red rib (structure)
  addRot(arm, box(0.42, 0.04, 0.04), C(s, 'dark'), 0.46, 0.09, 0.07, 0, 0, 0.42);
  addRot(arm, box(0.42, 0.04, 0.04), C(s, 'dark'), 0.46, -0.09, 0.07, 0, 0, -0.42);
  arm.add(part(box(0.05, 0.24, 0.05), C(s, 'hull2'), 0.49, 0, 0)); // cross tie (lighter, reads as a node)
  arm.add(part(box(0.03, 0.16, 0.02), ACC(s), 0.49, 0, 0.055)); // red rib on the tie

  // recessed docking BAY at the tip: a chunky LIGHTER module (marks each arm at the
  // ring) framed by dark armour lips, with a dark mouth, a bold red-lit interior and
  // clamp rails carrying red guide lights.
  arm.add(part(box(0.3, 0.3, 0.34), C(s, 'hull2'), 1.15, 0, 0)); // bay module (reads at the rim)
  for (const sy of [-1, 1]) arm.add(part(box(0.32, 0.06, 0.36), C(s, 'dark'), 1.15, sy * 0.15, 0)); // frame lips
  arm.add(part(box(0.18, 0.2, 0.24), C(s, 'dark'), 1.2, 0, 0)); // recessed dark mouth
  arm.add(part(box(0.04, 0.16, 0.22), GLOW(s), 1.3, 0, 0)); // red-lit interior back wall
  for (const sy of [-1, 1]) {
    arm.add(part(box(0.05, 0.05, 0.28), C(s, 'dark'), 1.24, sy * 0.13, 0)); // clamp rail
    arm.add(part(box(0.05, 0.05, 0.04), GLOW(s), 1.31, sy * 0.13, 0.12)); // red guide light
  }

  // fortress turret riding the dorsal (+Z) face, firing radially outward
  const t = fortTurret(s, 0.1);
  t.position.set(0.66, 0, 0.11);
  arm.add(t);

  // blood-red arm-tip beacon
  arm.add(part(sph(0.05, 6), NAV(s, 'port'), 1.36, 0, 0));
  return arm;
}

// HOME HUB — a dark faceted battle-fortress: a cut-gemstone armoured CORE (layered
// tilted boxes + pole spikes) girdled by an armour belt of red equatorial slit-
// lights, a slow-spinning defence RING of angular wedge docking-arms (bays, strut
// trusses, turret emplacements, red arm-tip beacons) held in an octagon frame,
// plus core batteries, sensor dishes, antenna masts and a command spire crowned by
// a red beacon. Core centred at origin; the ring spins about Z. Biggest of the three.
function makeImperialRing(s) {
  const grp = group();

  // ── Faceted armoured CORE — overlapping tilted boxes read as a cut-gemstone fort.
  //    The main diamond is the LIGHTER hull2 so the fortress reads as a solid mass
  //    against the void; darker facets + pole spikes carve the gem cut into it. ──
  addRot(grp, box(0.62, 0.6, 0.62), C(s, 'hull2'), 0, 0, 0, 0, Math.PI / 4, 0); // main diamond (top-down)
  addRot(grp, box(0.5, 0.74, 0.5), C(s, 'hull'), 0, 0, 0, 0, 0, Math.PI / 4); // tall canted facet (height)
  addRot(grp, box(0.5, 0.5, 0.5), C(s, 'dark'), 0, 0, 0, Math.PI / 4, 0, Math.PI / 4); // dark cross facet
  addRot(grp, cone(0.34, 0.4, 4), C(s, 'dark'), 0, 0.34, 0, 0, Math.PI / 4, 0); // top gem spike
  addRot(grp, cone(0.34, 0.4, 4), C(s, 'hull'), 0, -0.34, 0, Math.PI, Math.PI / 4, 0); // bottom gem spike

  // ── Armour BELT girdling the waist (octagon) + red equatorial SLIT-LIGHTS ──
  for (const ry of [0, Math.PI / 4]) addRot(grp, box(0.92, 0.22, 0.92), C(s, 'dark'), 0, 0, 0, 0, ry, 0); // faceted belt drum
  addRot(grp, box(0.86, 0.05, 0.86), ACC(s), 0, 0.115, 0, 0, Math.PI / 4, 0); // red rim line, upper
  addRot(grp, box(0.86, 0.05, 0.86), ACC(s), 0, -0.115, 0, 0, Math.PI / 4, 0); // red rim line, lower
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const cx = Math.cos(a);
    const cz = Math.sin(a);
    addRot(grp, box(0.16, 0.08, 0.05), C(s, 'accent'), cx * 0.46, 0, cz * 0.46, 0, -a, 0); // lit-grey slit bezel
    addRot(grp, box(0.12, 0.11, 0.04), GLOW(s), cx * 0.49, 0, cz * 0.49, 0, -a, 0); // menacing red slit glow
  }

  // ── Gem-facet detail (reads even flat-shaded): bright grey structural EDGES at the
  //    four diamond points, blood-red TRENCH seams climbing the faces between them,
  //    and armoured shoulder blocks — line-art faceting the flat shading can't give. ──
  for (let i = 0; i < 4; i++) {
    const p = (i / 4) * Math.PI * 2; // diamond point (N/S/E/W)
    const f = p + Math.PI / 4; // face centre (diagonals)
    addRot(grp, box(0.035, 0.56, 0.035), C(s, 'accent'), Math.cos(p) * 0.42, 0, Math.sin(p) * 0.42, 0, -p, 0); // point edge
    addRot(grp, box(0.028, 0.52, 0.02), ACC(s), Math.cos(f) * 0.26, 0.02, Math.sin(f) * 0.26, 0, -f, 0); // red face trench
    greeble(grp, s, 'hull2', Math.cos(f) * 0.3, 0.17, Math.sin(f) * 0.3, 0.09, 0.06, 0.09); // shoulder armour block
  }

  // ── Fixed core BATTERIES on the upper shoulders (twin barrels, red muzzles) ──
  for (const sx of [-1, 1]) {
    grp.add(part(box(0.11, 0.09, 0.12), C(s, 'dark'), sx * 0.22, 0.26, 0.12)); // battery housing
    for (const bx of [-0.03, 0.03]) {
      barrel(grp, s, sx * 0.22 + bx, 0.27, 0.2, 0.012, 0.18); // fixed barrel firing +Z
      grp.add(part(box(0.02, 0.02, 0.02), ACC(s), sx * 0.22 + bx, 0.27, 0.29)); // red muzzle tip
    }
  }

  // ── Sensor DISHES + antenna MASTS + avionics greebles on the core faces ──
  dish(grp, s, 0.28, 0.16, -0.14, 0.11, 0.6); // starboard sensor dish (tilted outward)
  dish(grp, s, -0.28, 0.16, -0.14, 0.11, 0.6); // port sensor dish
  antenna(grp, s, 0.24, 0.2, 0.16, 0.16); // comms mast
  greeble(grp, s, 'accent', 0, 0.16, -0.34, 0.14, 0.05, 0.06); // aft sensor spine box
  for (const sx of [-1, 1]) greeble(grp, s, 'hull2', sx * 0.16, 0.24, 0.22, 0.05, 0.04, 0.05); // forward avionics
  panelZ(grp, s, 0.2, 0.24, -0.02, 0.34); // face plating seams
  panelZ(grp, s, -0.2, 0.24, -0.02, 0.34);

  // ── Command SPIRE on top (+Y): stepped armour tower, red bridge slit, flank
  //    sub-spires, sensor masts, and a blood-red command beacon at the peak ──
  grp.add(part(box(0.18, 0.16, 0.18), C(s, 'dark'), 0, 0.5, 0)); // spire base
  grp.add(part(box(0.12, 0.22, 0.12), C(s, 'hull2'), 0, 0.66, 0)); // spire shaft
  grp.add(part(box(0.15, 0.03, 0.15), C(s, 'dark'), 0, 0.76, 0)); // armour cap ring
  grp.add(part(box(0.08, 0.16, 0.08), C(s, 'dark'), 0, 0.84, 0)); // crown block
  grp.add(part(box(0.13, 0.05, 0.03), C(s, 'glass'), 0, 0.63, 0.085)); // red bridge slit (+Z)
  for (const sx of [-1, 1]) {
    grp.add(part(box(0.05, 0.14, 0.05), C(s, 'dark'), sx * 0.11, 0.58, 0)); // flank sub-spire
    antenna(grp, s, sx * 0.08, 0.72, -0.02, 0.12); // sensor mast off the crown
  }
  grp.add(part(box(0.03, 0.16, 0.03), C(s, 'accent'), 0, 0.92, 0)); // beacon mast
  grp.add(part(sph(0.06, 8), NAV(s, 'port'), 0, 1.02, 0)); // red command beacon (halo)
  grp.add(part(sph(0.034, 6), GLOW(s), 0, 1.02, 0)); // hot core

  // ── Red running lights on the core flanks ──
  for (const x of [-1, 1]) navLight(grp, s, 'port', x * 0.52, 0, 0, 0.022);

  // ── SPINNING defence RING (about Z): octagon frame + red line, four docking arms ──
  const ring = group();
  const RF = 1.26; // frame vertex radius (near the arm bays)
  for (let i = 0; i < 8; i++) {
    const am = ((i + 0.5) / 8) * Math.PI * 2; // edge-midpoint angle
    const rr = RF * Math.cos(Math.PI / 8);
    const seg = 2 * RF * Math.sin(Math.PI / 8);
    addRot(ring, box(seg, 0.12, 0.16), C(s, 'dark'), Math.cos(am) * rr, Math.sin(am) * rr, 0, 0, 0, am + Math.PI / 2); // frame bar
    addRot(ring, box(seg * 0.95, 0.03, 0.06), ACC(s), Math.cos(am) * (rr + 0.02), Math.sin(am) * (rr + 0.02), 0, 0, 0, am + Math.PI / 2); // red running line
  }
  for (let i = 0; i < 4; i++) { // red beacon nodes at the frame vertices (between arms)
    const a = (i / 4) * Math.PI * 2;
    ring.add(part(sph(0.04, 6), NAV(s, 'star'), Math.cos(a) * RF, Math.sin(a) * RF, 0));
  }
  // four docking arms, offset 45° so none collides with the +Y command spire
  for (let i = 0; i < 4; i++) {
    const arm = dockArm(s);
    arm.rotation.z = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ring.add(arm);
  }
  grp.add(ring);
  grp.userData.spin = ring; // createStation rotates this group per frame

  return grp;
}

// A corner defence tower built facing +X (outward), then rotated to a diagonal
// `a`. Each is a battered angular buttress rising from the base perimeter: a dark
// footing, a canted armour body with a blood-red vertical trench, an angular
// sensor head with a red targeting-glass slit + a short up-cocked PD stub, a slim
// mast with a red beacon, and a red slit-glow low on the wall. Four of them frame
// the turret so the fortlet reads as bristling, not plain. Built at |x| = R.
function cornerTower(grp, s, a) {
  const t = group();
  const R = 0.4; // corner stand-off from the fort centre (on the apron perimeter)

  t.add(part(box(0.13, 0.05, 0.13), C(s, 'dark'), R, -0.345, 0)); // footing pad on the apron
  addRot(t, box(0.11, 0.32, 0.11), C(s, 'hull'), R, -0.18, 0, 0, 0, 0.1); // canted buttress body
  t.add(part(box(0.02, 0.28, 0.09), C(s, 'dark'), R + 0.056, -0.18, 0)); // outer armour face plate
  t.add(part(box(0.02, 0.24, 0.018), ACC(s), R + 0.064, -0.18, 0)); // blood-red vertical trench up the plate

  // angular sensor head + red targeting-glass slit facing outward
  t.add(part(box(0.14, 0.09, 0.13), C(s, 'hull2'), R, -0.005, 0)); // sensor head block
  t.add(part(box(0.15, 0.022, 0.14), C(s, 'dark'), 0 + R, 0.045, 0)); // head armour cap
  t.add(part(box(0.02, 0.03, 0.1), C(s, 'glass'), R + 0.075, -0.005, 0)); // red targeting slit
  addRot(t, cyl(0.015, 0.012, 0.15, 6), C(s, 'dark'), R + 0.1, 0.02, 0, 0, 0, Math.PI / 2 - 0.45); // up-cocked PD stub
  t.add(part(box(0.026, 0.026, 0.02), ACC(s), R + 0.17, 0.083, 0)); // red muzzle tip on the stub

  t.add(part(box(0.014, 0.14, 0.014), C(s, 'accent'), R, 0.11, 0)); // beacon mast
  t.add(part(sph(0.024, 6), NAV(s, 'port'), R, 0.19, 0)); // red corner beacon
  t.add(part(box(0.012, 0.05, 0.055), GLOW(s), R + 0.058, -0.29, 0)); // red slit-glow low on the wall

  t.rotation.y = a;
  grp.add(t);
}

// COLONY OUTPOST — a compact Imperial defence-bunker fortlet. A layered faceted
// armoured base (battered octagonal bunker walls + stepped dark plates), a
// hexagonal turret drum carrying an up-angled TWIN barrel with red muzzle tips and
// a red targeting-glass slit, four corner defence towers / sensor masts, a front
// docking collar, a rear antenna array, red equator slit-lights + running lights,
// and blood-red trench-lines. Base sits low near -Y, turret aims up +Y.
function makeImperialOutpost(s) {
  const grp = group();

  // ── A. LAYERED FACETED ARMOURED BASE ────────────────────────────────────────
  // Battered octagonal walls (wider at the foot) stepped by dark armour belts, so
  // the fort reads as canted faceted plate, not a plain drum. rot.y = π/8 lands a
  // flat wall on every cardinal + diagonal (towers, collar, trenches all bolt on).
  addRot(grp, cyl(0.44, 0.5, 0.06, 8), C(s, 'dark'), 0, -0.37, 0, 0, Math.PI / 8, 0); // widest ground apron
  addRot(grp, cyl(0.32, 0.44, 0.26, 8), C(s, 'hull'), 0, -0.24, 0, 0, Math.PI / 8, 0); // battered bunker wall
  addRot(grp, cyl(0.35, 0.36, 0.03, 8), C(s, 'dark'), 0, -0.12, 0, 0, Math.PI / 8, 0); // armour equator belt
  addRot(grp, cyl(0.3, 0.32, 0.055, 8), C(s, 'hull2'), 0, -0.08, 0, 0, Math.PI / 8, 0); // stepped upper ring (lighter, reads from top)
  addRot(grp, cyl(0.28, 0.28, 0.02, 8), ACC(s), 0, -0.048, 0, 0, Math.PI / 8, 0); // red deck-edge ring
  addRot(grp, cyl(0.26, 0.27, 0.04, 8), C(s, 'dark'), 0, -0.035, 0, 0, Math.PI / 8, 0); // turret deck plate

  // Lighter vertical corner ribs on the 8 octagon edges — catch light so the black
  // mass reads as faceted armoured plate, not a rounded drum.
  for (let i = 0; i < 8; i++) {
    const e = Math.PI / 8 + (i / 8) * Math.PI * 2;
    addRot(grp, box(0.03, 0.26, 0.05), C(s, 'accent'), Math.cos(e) * 0.4, -0.24, Math.sin(e) * 0.4, 0, Math.PI / 2 - e, 0);
  }

  // Canted glacis plates on the cardinal walls (dark, raked outward) — extra facet.
  for (const [dx, dz, rx, rz] of [[0, 0.36, -0.42, 0], [0, -0.36, 0.42, 0], [0.36, 0, 0, 0.42], [-0.36, 0, 0, -0.42]]) {
    addRot(grp, box(dx === 0 ? 0.22 : 0.05, 0.2, dx === 0 ? 0.05 : 0.22), C(s, 'dark'), dx, -0.24, dz, rx, 0, rz);
  }

  // Blood-red vertical trench-lines up the side + rear walls (Imperial signature).
  grp.add(part(box(0.02, 0.22, 0.02), ACC(s), 0, -0.24, -0.4)); // rear trench
  grp.add(part(box(0.02, 0.22, 0.02), ACC(s), 0.4, -0.24, 0)); // starboard trench
  grp.add(part(box(0.02, 0.22, 0.02), ACC(s), -0.4, -0.24, 0)); // port trench

  // Red equator slit-lights round the belt (cold menacing glow, ISD trench read).
  for (let i = 0; i < 8; i++) {
    const b = (i / 8) * Math.PI * 2;
    addRot(grp, box(0.05, 0.06, 0.016), GLOW(s), Math.cos(b) * 0.37, -0.12, Math.sin(b) * 0.37, 0, Math.PI / 2 - b, 0);
  }

  // Deck panel seams + radial armour ribs (read the plated deck from straight above).
  panelX(grp, s, 0, -0.01, 0.13, 0.34);
  panelX(grp, s, 0, -0.01, -0.13, 0.34);
  panelZ(grp, s, 0.13, -0.01, 0, 0.34);
  panelZ(grp, s, -0.13, -0.01, 0, 0.34);
  for (const [rx, rz, lx, lz] of [[0, 0.21, 0.03, 0.13], [0, -0.21, 0.03, 0.13], [0.21, 0, 0.13, 0.03], [-0.21, 0, 0.13, 0.03]]) {
    grp.add(part(box(lx, 0.02, lz), C(s, 'accent'), rx, -0.03, rz)); // radial deck rib
  }
  for (const a of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    greeble(grp, s, 'hull2', Math.cos(a) * 0.2, -0.03, Math.sin(a) * 0.2, 0.05, 0.03, 0.05); // deck vent block between towers
  }

  // ── B. HEXAGONAL TURRET DRUM + UP-ANGLED TWIN BARREL ────────────────────────
  grp.add(part(cyl(0.22, 0.24, 0.05, 8), C(s, 'hull2'), 0, -0.02, 0)); // octagonal turret plinth (lighter pedestal)
  grp.add(part(cyl(0.2, 0.22, 0.035, 6), C(s, 'dark'), 0, 0.02, 0)); // base collar
  grp.add(part(cyl(0.155, 0.175, 0.19, 6), C(s, 'hull2'), 0, 0.135, 0)); // rotating hex drum (tall, reads from every angle)
  grp.add(part(cyl(0.165, 0.165, 0.018, 6), ACC(s), 0, 0.235, 0)); // red drum cap ring
  for (const sx of [-1, 1]) grp.add(part(box(0.02, 0.16, 0.016), ACC(s), sx * 0.16, 0.13, 0)); // red drum flank trenches
  grp.add(part(box(0.3, 0.17, 0.16), C(s, 'dark'), 0, 0.2, 0.05)); // gun mantlet / housing (raised)
  for (const sx of [-1, 1]) addRot(grp, box(0.03, 0.16, 0.15), C(s, 'hull2'), sx * 0.155, 0.2, 0.05, 0, 0, sx * 0.24); // canted cheek plates
  grp.add(part(box(0.18, 0.036, 0.02), C(s, 'glass'), 0, 0.22, 0.13)); // red targeting-glass slit (forward eye)
  grp.add(part(box(0.24, 0.016, 0.016), ACC(s), 0, 0.28, 0.05)); // red targeting strip across the crown
  grp.add(part(box(0.18, 0.036, 0.05), C(s, 'dark'), 0, 0.255, 0.12)); // barrel yoke / trunnion beam

  // Twin barrels, breech at the mantlet, muzzles cocked UP + forward (elevation 0.6).
  const EL = 0.6; // barrel elevation from horizontal
  const dir = [0, Math.sin(EL), Math.cos(EL)];
  for (const bx of [-0.078, 0.078]) {
    const bl = 0.38; // barrel length
    const bBreechY = 0.22, bBreechZ = 0.1; // breech at the mantlet
    const bcx = bx, bcy = bBreechY + (bl / 2) * dir[1], bcz = bBreechZ + (bl / 2) * dir[2]; // barrel centre
    addRot(grp, cyl(0.026, 0.021, bl, 6), C(s, 'dark'), bcx, bcy, bcz, Math.PI / 2 - EL, 0, 0); // barrel tube
    const mx = bx, my = bBreechY + bl * dir[1], mz = bBreechZ + bl * dir[2]; // muzzle tip
    addRot(grp, cyl(0.036, 0.036, 0.032, 6), C(s, 'hull2'), mx, my - 0.022 * dir[1], mz - 0.022 * dir[2], Math.PI / 2 - EL, 0, 0); // muzzle brake
    grp.add(part(box(0.044, 0.044, 0.03), ACC(s), mx, my, mz)); // blood-red muzzle tip
    grp.add(part(sph(0.016, 6), GLOW(s), mx, my + 0.014 * dir[1], mz + 0.014 * dir[2])); // hot charge pip
  }

  // ── C. FRONT DOCKING COLLAR (greeble, +Z low on the bunker face) ────────────
  addRot(grp, cyl(0.11, 0.12, 0.1, 8), C(s, 'hull2'), 0, -0.24, 0.44, Math.PI / 2, 0, 0); // collar ring
  addRot(grp, cyl(0.078, 0.078, 0.12, 8), C(s, 'dark'), 0, -0.24, 0.46, Math.PI / 2, 0, 0); // recessed dock throat
  addRot(grp, cyl(0.125, 0.125, 0.016, 8), ACC(s), 0, -0.24, 0.5, Math.PI / 2, 0, 0); // red guide ring
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    grp.add(part(box(0.03, 0.03, 0.09), C(s, 'dark'), Math.cos(a) * 0.11, -0.24 + Math.sin(a) * 0.11, 0.46)); // berthing latch
  }
  navLight(grp, s, 'port', 0.11, -0.24, 0.52, 0.014); // dock guide lights
  navLight(grp, s, 'star', -0.11, -0.24, 0.52, 0.014);

  // ── D. REAR ANTENNA / SENSOR ARRAY (aft deck, clear of the turret) ──────────
  grp.add(part(box(0.28, 0.06, 0.1), C(s, 'hull'), 0, -0.03, -0.25)); // rear sensor shelf
  grp.add(part(box(0.28, 0.014, 0.014), ACC(s), 0, 0.005, -0.21)); // red hazard band on the shelf lip
  dish(grp, s, -0.08, 0.0, -0.27, 0.05, 0.45); // comms dish (red feed pin)
  antenna(grp, s, 0.06, 0.0, -0.27, 0.15); // tall comms mast
  antenna(grp, s, 0.11, 0.0, -0.23, 0.1); // short comms mast
  greeble(grp, s, 'hull2', -0.02, 0.005, -0.22, 0.05, 0.03, 0.04); // avionics box

  // ── E. LIGHTS + BOW RCS ─────────────────────────────────────────────────────
  runningLights(grp, s, 0.28, -0.24, 0.28); // red port/star at the forward wall shoulders
  navLight(grp, s, 'port', 0, 0.24, -0.27, 0.014); // red command beacon on the mast head
  for (const sx of [-1, 1]) rcsQuad(grp, s, sx * 0.24, -0.34, 0.24, 0.012); // apron corner RCS

  // Four corner defence towers on the diagonal walls.
  for (const a of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) cornerTower(grp, s, a);

  return grp;
}

// One armoured CLAW-FINGER of the gas-scoop, clamping DOWN (-Y) and INWARD.
// Built straight onto the main group along the radial direction (dx,dz)=(cosθ,sinθ):
// every segment shares ry=-a so the whole finger stays radially aligned, and the
// mount RADIUS shrinks from shoulder (0.30) to claw-tip (0.13) so the fingers
// converge UNDER the intake — reads as a clamp, not splayed legs. Growing rx tilts
// each lower segment steeper (articulated knuckle → hooked claw). Dark armour with
// a blood-red trench down each face and a glowing red scoop-tip.
function clawFinger(grp, s, a) {
  const dx = Math.cos(a);
  const dz = Math.sin(a);
  const at = (geo, m, rr, yy, rx) => addRot(grp, geo, m, dx * rr, yy, dz * rr, rx, -a, 0);

  // shoulder yoke on the mount ring — a chunky housing, hinge pin + a bracing
  // gusset back to the hull so the finger reads as STRUCTURE, not a spider leg
  at(box(0.17, 0.15, 0.19), C(s, 'hull2'), 0.28, 0.03, 0.12);
  at(box(0.2, 0.06, 0.06), C(s, 'dark'), 0.28, 0.03, 0.12); // hinge pin across the yoke
  at(box(0.13, 0.12, 0.05), C(s, 'dark'), 0.19, 0.02, 0.2); // gusset brace to hull
  // upper arm: heavy dark beam + a lighter proud plate + an outer red trench
  at(box(0.15, 0.3, 0.14), C(s, 'dark'), 0.31, -0.15, 0.5);
  at(box(0.1, 0.24, 0.1), C(s, 'hull2'), 0.34, -0.145, 0.5); // proud plating
  at(box(0.03, 0.25, 0.014), ACC(s), 0.38, -0.15, 0.5); // outer red trench
  // knuckle joint — proud block + a pair of red rivets (structural detail)
  at(box(0.16, 0.13, 0.16), C(s, 'hull2'), 0.3, -0.33, 0.55);
  at(box(0.026, 0.026, 0.026), ACC(s), 0.3, -0.28, 0.55); // upper rivet
  at(box(0.026, 0.026, 0.026), ACC(s), 0.3, -0.38, 0.55); // lower rivet
  // forearm/claw — steeper hook, converging inward under the throat
  at(box(0.125, 0.27, 0.12), C(s, 'dark'), 0.22, -0.5, 0.95);
  at(box(0.085, 0.19, 0.08), C(s, 'hull2'), 0.2, -0.5, 0.95); // proud plating
  at(box(0.026, 0.21, 0.014), ACC(s), 0.16, -0.5, 0.95); // inner red trench
  // claw TIP — a dark spike pointing down-inward with a hot red scoop glow
  addRot(grp, cone(0.062, 0.16, 6), C(s, 'dark'), dx * 0.14, -0.63, dz * 0.14, 2.55, -a, 0);
  grp.add(part(sph(0.044, 6), GLOW(s), dx * 0.125, -0.66, dz * 0.125)); // scoop-tip glow
}

// GAS-GIANT SKIMMER — a heavy ARMOURED Imperial gas-scoop hung over a gas giant.
// A faceted black battle-fortress TOP BODY (up +Y) — armoured drum + tilted facets,
// layered plating, storage TANKS, pump housings & pipework, sensor masts and a red
// command beacon — feeds a central intake THROAT with a glowing red intake mouth,
// clamped by FOUR angular CLAW-FINGERS reaching DOWN (-Y) with red scoop-tip glow.
// Blood-red trench-lines, hazard bands and radiator fins throughout. Reads as a
// mean, industrial, armoured Imperial skimmer. UP = +Y, scoop reaches DOWN = -Y.
function makeImperialCollector(s) {
  const grp = group();

  // ── A. FACETED ARMOURED TOP BODY — a cut-gemstone battle-fortress ────────────
  // An octagonal armour drum interlocked with a 45°-tilted box facet (the Imperial
  // "cut gemstone fort" read), capped and belted with dark armour plate.
  addRot(grp, box(0.46, 0.26, 0.46), C(s, 'hull'), 0, 0.46, 0, 0, Math.PI / 4, 0); // tilted facet body
  grp.add(part(cyl(0.33, 0.37, 0.3, 8), C(s, 'hull2'), 0, 0.46, 0)); // octagonal armour drum
  grp.add(part(cyl(0.4, 0.4, 0.06, 8), C(s, 'dark'), 0, 0.34, 0)); // armoured equator belt
  grp.add(part(cyl(0.415, 0.415, 0.03, 8), ACC(s), 0, 0.4, 0)); // blood-red hazard belt
  grp.add(part(cyl(0.29, 0.24, 0.1, 8), C(s, 'dark'), 0, 0.61, 0)); // armour cap
  grp.add(part(box(0.32, 0.05, 0.32), C(s, 'hull2'), 0, 0.66, 0)); // upper deck plate
  for (const sx of [-1, 1]) addRot(grp, box(0.07, 0.01, 0.014), ACC(s), sx * 0.09, 0.688, 0.09, 0, sx * -0.78, 0); // hazard chevrons
  // engraved plating seams across the deck (armour-panel detail)
  for (const d of [-0.09, 0.09]) {
    panelX(grp, s, 0, 0.686, d, 0.28);
    panelZ(grp, s, d, 0.686, 0, 0.28);
  }
  // radial blood-red trench-lines down four facets (Imperial signature marking)
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    addRot(grp, box(0.024, 0.26, 0.014), ACC(s), Math.cos(a) * 0.35, 0.46, Math.sin(a) * 0.35, 0, -a, 0);
  }
  // dark shoulder mount ring under the body — the fingers' hinge line
  grp.add(part(cyl(0.31, 0.31, 0.07, 8), C(s, 'dark'), 0, 0.06, 0));
  grp.add(part(cyl(0.315, 0.315, 0.02, 8), ACC(s), 0, 0.02, 0)); // red rim on the mount ring

  // ── B. STORAGE TANKS — four dark banded cylinders clamped round the body ─────
  // Angular industrial cylinders (not soft spheres), each with a red hazard band,
  // a dark filler cap and a feed pipe running down into the body. On the ordinal
  // axes so they sit between the claw-fingers.
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const tx = Math.cos(a) * 0.44;
    const tz = Math.sin(a) * 0.44;
    grp.add(part(cyl(0.088, 0.088, 0.32, 8), C(s, 'hull2'), tx, 0.5, tz)); // tank body
    grp.add(part(cyl(0.094, 0.094, 0.05, 8), C(s, 'dark'), tx, 0.44, tz)); // lower band
    grp.add(part(cyl(0.096, 0.096, 0.03, 8), ACC(s), tx, 0.56, tz)); // red hazard band
    grp.add(part(cyl(0.05, 0.05, 0.06, 8), C(s, 'dark'), tx, 0.69, tz)); // filler cap
    grp.add(part(box(0.02, 0.02, 0.05), ACC(s), tx, 0.74, tz)); // filler stub
    addRot(grp, cyl(0.018, 0.018, 0.22, 6), C(s, 'dark'), tx * 0.68, 0.42, tz * 0.68, 0, -a, Math.PI / 2); // feed pipe
  }

  // ── C. PUMP HOUSINGS & PIPEWORK — greebled machinery on the body flanks ──────
  // On the cardinal axes (between the tanks): a pump box, a valve stack and a
  // short pipe run, so the fortress reads as working industrial plant.
  for (const a of [Math.PI / 4, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75]) {
    const px = Math.cos(a);
    const pz = Math.sin(a);
    greeble(grp, s, 'dark', px * 0.34, 0.4, pz * 0.34, 0.09, 0.1, 0.09); // pump housing
    greeble(grp, s, 'hull2', px * 0.34, 0.48, pz * 0.34, 0.05, 0.06, 0.05); // valve stack
    addRot(grp, cyl(0.015, 0.015, 0.16, 6), C(s, 'hull2'), px * 0.36, 0.34, pz * 0.36, 0, -a, 0); // pipe run
  }

  // ── D. CENTRAL INTAKE THROAT + glowing red intake MOUTH ──────────────────────
  // An octagonal throat drops from the body belly; a narrowing dark funnel below
  // it is the mouth, lit by a hot red intake glow (the gas-scoop's business end).
  grp.add(part(cyl(0.18, 0.22, 0.34, 8), C(s, 'hull'), 0, 0.16, 0)); // throat stack
  grp.add(part(cyl(0.24, 0.24, 0.05, 8), C(s, 'dark'), 0, 0.29, 0)); // upper throat collar
  grp.add(part(cyl(0.205, 0.205, 0.03, 8), ACC(s), 0, 0.16, 0)); // red throat ring
  addRot(grp, cyl(0.22, 0.11, 0.17, 12), C(s, 'dark'), 0, -0.03, 0); // narrowing intake funnel (mouth)
  grp.add(part(cyl(0.2, 0.2, 0.028, 12), ACC(s), 0, -0.11, 0)); // red mouth-rim ring
  grp.add(part(cyl(0.17, 0.17, 0.03, 12), GLOW(s), 0, -0.115, 0)); // glowing red intake mouth (faces down)
  grp.add(part(sph(0.12, 8), GLOW(s), 0, -0.05, 0)); // hot red intake core, recessed
  // ring of canted armour VANES round the mouth — an industrial intake grille
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    addRot(grp, box(0.032, 0.13, 0.05), C(s, 'dark'), Math.cos(a) * 0.24, -0.02, Math.sin(a) * 0.24, 0, -a, 0.32);
  }

  // ── E. FOUR ARMOURED CLAW-FINGERS clamping DOWN (-Y) — the scoop ─────────────
  // On the ordinal axes' half-offset so the fingers sit clear of the tanks.
  for (let i = 0; i < 4; i++) clawFinger(grp, s, (i / 4) * Math.PI * 2 + Math.PI / 4);

  // ── F. RADIATOR FINS — canted dark fins with a red rib on the E/W flanks ─────
  for (const sx of [-1, 1]) {
    greeble(grp, s, 'hull2', sx * 0.4, 0.46, 0, 0.05, 0.05, 0.06); // fin root
    addRot(grp, box(0.006, 0.17, 0.26), C(s, 'dark'), sx * 0.53, 0.46, 0, 0, 0, sx * 0.5); // radiator fin
    addRot(grp, box(0.008, 0.04, 0.21), ACC(s), sx * 0.55, 0.46, 0, 0, 0, sx * 0.5); // red rib
  }

  // ── G. SENSOR MASTS, COMMAND DISH + red command beacon ───────────────────────
  antenna(grp, s, 0.14, 0.68, 0.06, 0.14); // sensor mast (adds its own top light)
  antenna(grp, s, -0.14, 0.68, 0.06, 0.14);
  dish(grp, s, 0.0, 0.69, -0.14, 0.09, 0.45); // deck sensor dish
  grp.add(part(box(0.024, 0.3, 0.024), C(s, 'accent'), 0, 0.83, 0)); // command spire
  grp.add(part(sph(0.05, 8), NAV(s, 'port'), 0, 0.99, 0)); // red command beacon core
  grp.add(part(sph(0.075, 10), GLOW(s), 0, 0.99, 0)); // beacon halo

  // ── H. RUNNING + NAV LIGHTS ──────────────────────────────────────────────────
  runningLights(grp, s, 0.42, 0.4, 0); // red port/star beacons on the flanks
  navLight(grp, s, 'port', 0, 0.4, 0.42, 0.018); // forward red marker
  navLight(grp, s, 'star', 0, 0.4, -0.42, 0.018); // aft red marker

  return grp;
}
