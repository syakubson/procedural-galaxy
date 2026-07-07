// Faction style-kit (#11): SYNDICATE — a sleek CRIMINAL syndicate. Dark graphite
// hulls, predatory silhouettes, CYAN glowing accents/engines (the cold glow of
// contraband hi-tech). Beyond the palette, `flourish` stamps the signature look:
// thin additive CYAN light-lines running along the hull flanks + a dorsal spine
// line, a cyan glass sensor dome on the nose-top, and swept accent fins.
//
// Consumed by every role builder in roles.js, so one kit restyles all 9 ships.
// Schema matches ALLIANCE in factions.js (named export FACTION here).

import {
  C, ACC, GLOW, NAV, group, box, cyl, sph, cone, wedge, part, addRot,
  engineGlow, navLight, runningLights, antenna, barrel, nozzle,
  panelZ, panelX, greeble, dish, blister, radiatorPanel, rcsQuad,
} from './style.js';

// === BESPOKE FLEET — 8 role hulls in the Syndicate criminal-raider language ====
// Each a sleek DARK graphite predatory hull lit by CYAN contraband hi-tech glow
// (light-lines, cockpit glass, weapon tips). NOSE = +Z, symmetric about X=0. No
// shared flourish — every ship carries its own cyan identity. Refs: Zann
// Consortium (Empire at War: FoC) + sci-fi space pirates/raiders.

// SCOUT — Syndicate "forward eye" / spy runner. A small, sleek, dark needle: a
// knife-thin graphite blade pinching to a single glaring CYAN sensor eye, a low
// rounded dorsal spine conduit, thin cyan light-lines down the flanks, a canted
// pair of rear blade fins and twin small cyan-glow engines. Fast, stealthy, NO
// weapons. NOSE = +Z.
function makeSyndicateScout(s) {
  const grp = group();

  // --- knife hull: a flat dark graphite blade pinching to a sharp +Z point ----
  grp.add(part(wedge(0.085, 0.024, 0.245), C(s, 'hull'), 0, 0, -0.01));
  grp.add(part(wedge(0.05, 0.01, 0.19), C(s, 'dark'), 0, -0.014, -0.02)); // ventral keel edge

  // --- sleek rounded dorsal spine conduit (smooth hi-tech back, NOT stepped) ---
  addRot(grp, cyl(0.006, 0.013, 0.2, 8), C(s, 'hull2'), 0, 0.013, -0.03, Math.PI / 2);
  grp.add(part(box(0.004, 0.004, 0.17), GLOW(s), 0, 0.026, -0.03)); // cyan spine line

  // --- single CYAN cyclops sensor-eye glaring forward at the prow -------------
  addRot(grp, cyl(0.013, 0.021, 0.028, 8), C(s, 'dark'), 0, 0.005, 0.09, Math.PI / 2); // dark socket
  grp.add(part(sph(0.016, 10), C(s, 'glass'), 0, 0.006, 0.107)); // cyan glass eye
  engineGlow(grp, s, 0, 0.006, 0.113, 0.013); // hot cyan glare forward

  // --- thin CYAN light-lines running down both flanks -------------------------
  for (const sx of [-1, 1]) grp.add(part(box(0.003, 0.003, 0.15), GLOW(s), sx * 0.028, 0.001, -0.04));

  // --- twin canted rear blade fins (predatory V-tail, thin knife blades) ------
  for (const sx of [-1, 1]) {
    addRot(grp, box(0.004, 0.032, 0.055), C(s, 'hull2'), sx * 0.03, 0.015, -0.105, 0, 0, sx * -0.5);
    addRot(grp, box(0.004, 0.03, 0.01), ACC(s), sx * 0.037, 0.021, -0.086, 0, 0, sx * -0.5); // cyan leading edge
    navLight(grp, s, sx < 0 ? 'port' : 'star', sx * 0.041, 0.03, -0.106, 0.008);
  }

  // --- stern engine deck + twin small cyan-glow engines -----------------------
  grp.add(part(box(0.066, 0.022, 0.02), C(s, 'dark'), 0, 0, -0.132));
  for (const sx of [-1, 1]) nozzle(grp, s, sx * 0.022, 0, -0.132, 0.014, 0.028);

  panelZ(grp, s, 0.026, 0.012, -0.03, 0.11);
  panelZ(grp, s, -0.026, 0.012, -0.03, 0.11);

  return grp;
}

// FIGHTER — the Syndicate raider line-fighter. A predatory dark DART: a sharp
// knife-like graphite fuselage tapering to a vertical blade-beak, twin swept-back
// sleek blade-vanes (NOT airfoils — dagger blades), a CYAN cockpit slit facing
// +Z set low in a dark brow, twin chin cannons reaching PAST the nose with CYAN
// muzzle tips, and twin cyan engines at the tail. Sleek & dangerous. NOSE = +Z.
function makeSyndicateFighter(s) {
  const grp = group();

  // --- central knife fuselage: a tapered wedge dagger (sharp bow at +Z) --------
  grp.add(part(wedge(0.056, 0.05, 0.2), C(s, 'hull'), 0, 0, -0.02)); // main dart body
  grp.add(part(wedge(0.018, 0.048, 0.18), C(s, 'dark'), 0, -0.028, -0.02)); // deep raked ventral keel-blade
  grp.add(part(box(0.026, 0.016, 0.1), C(s, 'hull2'), 0, 0.026, -0.05)); // short dorsal ridge deck
  grp.add(part(box(0.004, 0.006, 0.16), GLOW(s), 0, -0.05, -0.02)); // cyan glow along the cutting keel edge

  // Sharp vertical blade-beak beyond the wedge point (diamond-canted 4-pyramid).
  addRot(grp, cone(0.018, 0.08, 4), C(s, 'dark'), 0, 0, 0.11, Math.PI / 2, 0, Math.PI / 4);

  // --- CYAN cockpit slit facing +Z, low in a dark brow (a raider's eye) --------
  grp.add(part(box(0.034, 0.03, 0.06), C(s, 'dark'), 0, 0.018, 0.02)); // dark visor recess
  addRot(grp, box(0.05, 0.018, 0.034), C(s, 'glass'), 0, 0.032, 0.052, -0.42, 0, 0); // cyan glass slit, proud
  addRot(grp, box(0.052, 0.012, 0.028), C(s, 'dark'), 0, 0.05, 0.036, -0.5, 0, 0); // angled dark brow ridge

  // --- signature CYAN light-lines: dorsal spine + both flanks (contraband glow) -
  grp.add(part(box(0.006, 0.005, 0.15), GLOW(s), 0, 0.036, -0.03)); // dorsal spine line
  for (const sx of [-1, 1]) {
    grp.add(part(box(0.004, 0.004, 0.14), GLOW(s), sx * 0.044, 0, -0.02)); // flank light-line
    panelZ(grp, s, sx * 0.028, 0.02, -0.03, 0.12); // dark plating seam
  }

  // --- twin chin cannons: reach PAST the nose, CYAN muzzle tips ---------------
  for (const x of [-0.024, 0.024]) {
    grp.add(part(box(0.02, 0.02, 0.06), C(s, 'dark'), x, -0.008, 0.04)); // cannon housing
    barrel(grp, s, x, -0.008, 0.075, 0.006, 0.18); // tip ends ~z=0.165 (past the beak)
    grp.add(part(box(0.013, 0.013, 0.02), ACC(s), x, -0.008, 0.16)); // cyan muzzle tip
    grp.add(part(sph(0.007, 6), GLOW(s), x, -0.008, 0.168)); // hot cyan charge pip
  }

  // --- twin swept-back sleek blade-vanes (dagger blades, NOT airfoils) ---------
  const sweep = 0.62;
  for (const side of [-1, 1]) {
    const wing = group();
    addRot(wing, wedge(0.075, 0.014, 0.14), C(s, 'hull'), 0.07, 0, 0, 0, Math.PI / 2, 0); // sleek tapered plate
    wing.add(part(box(0.13, 0.005, 0.006), GLOW(s), 0.062, 0.006, 0.026)); // cyan glowing blade-edge line
    wing.add(part(box(0.12, 0.004, 0.014), ACC(s), 0.06, 0.008, 0.0)); // cyan accent stripe
    wing.add(part(box(0.11, 0.005, 0.01), C(s, 'dark'), 0.06, 0.006, -0.024)); // dark trailing-edge rib
    navLight(wing, s, side > 0 ? 'star' : 'port', 0.138, 0.004, 0.0, 0.006); // wingtip beacon
    wing.position.set(side * 0.026, 0, -0.02);
    wing.rotation.y = side > 0 ? sweep : Math.PI - sweep; // sweep back (mirrored per side)
    grp.add(wing);
    grp.add(part(box(0.03, 0.028, 0.08), C(s, 'hull2'), side * 0.03, 0, -0.02)); // wing-root fairing
    rcsQuad(grp, s, side * 0.03, 0.02, 0.05, 0.007); // forward corner RCS
  }

  // --- twin cyan engines at the tail (contraband hi-tech plume) ----------------
  for (const x of [-0.02, 0.02]) nozzle(grp, s, x, -0.004, -0.11, 0.018, 0.038);
  grp.add(part(box(0.008, 0.006, 0.02), GLOW(s), 0, 0.02, -0.11)); // central tail glow accent
  greeble(grp, s, 'accent', 0, 0.03, -0.06, 0.02, 0.012, 0.03); // dorsal avionics box

  // --- extra raider greebling (targeting sensor, dorsal vents, wing hardpoints) -
  greeble(grp, s, 'dark', 0, -0.026, 0.09, 0.026, 0.016, 0.04); // chin targeting sensor
  grp.add(part(sph(0.008, 6), ACC(s), 0, -0.026, 0.108)); // cyan sensor eye
  for (const sx of [-1, 1]) {
    greeble(grp, s, 'hull2', sx * 0.014, 0.036, -0.02, 0.01, 0.01, 0.05); // dorsal cooling vent
    grp.add(part(box(0.012, 0.012, 0.05), C(s, 'dark'), sx * 0.05, -0.014, 0.01)); // underwing hardpoint pod
    grp.add(part(sph(0.006, 6), GLOW(s), sx * 0.05, -0.014, 0.036)); // hardpoint cyan pip (hidden guns)
  }

  return grp;
}

// INTERCEPTOR — the Syndicate's anti-fighter hunter: the fighter's leaner, deadlier
// cousin. A NARROW graphite needle-wedge (a knife hull — Zann-Consortium sleek),
// sharper and thinner than the fighter, with swept-back angular blade-vanes ending
// in bent knife tips, LONG forward twin cannons whose CYAN muzzles reach well past
// the nose, and OVERSIZED CYAN-glow twin engines at the tail for speed. NOSE = +Z.
function makeSyndicateInterceptor(s) {
  const grp = group();

  // --- narrow needle wedge hull — thinner & sharper than the fighter (a blade) ---
  grp.add(part(wedge(0.058, 0.036, 0.3), C(s, 'hull'), 0, 0, 0.0)); // main graphite blade-wedge
  grp.add(part(wedge(0.024, 0.02, 0.24), C(s, 'hull2'), 0, 0.024, 0.02)); // razor dorsal spine ridge
  grp.add(part(wedge(0.04, 0.016, 0.26), C(s, 'dark'), 0, -0.022, 0.0)); // dark belly keel

  // --- extended needle prow: a slim dark spike carried forward to a sharp point ---
  grp.add(part(box(0.014, 0.011, 0.1), C(s, 'dark'), 0, 0.0, 0.17)); // prow spike
  addRot(grp, cone(0.012, 0.05, 8), C(s, 'hull2'), 0, 0.0, 0.208, Math.PI / 2); // sharp nose point
  grp.add(part(box(0.006, 0.005, 0.05), GLOW(s), 0, 0.008, 0.185)); // cyan nose targeting cue

  // --- LONG forward twin cannons — reach WELL past the nose (interceptor punch) ---
  for (const x of [-0.024, 0.024]) {
    barrel(grp, s, x, -0.002, 0.1, 0.005, 0.3); // muzzle brake ~0.25, far past the prow
    grp.add(part(box(0.011, 0.011, 0.045), ACC(s), x, -0.002, 0.255)); // cyan muzzle tip
    grp.add(part(box(0.011, 0.011, 0.012), GLOW(s), x, -0.002, 0.276)); // glowing charge past the nose
  }

  // --- CYAN cockpit slit set into a dark brow on the ridge front ---
  grp.add(part(box(0.028, 0.014, 0.055), C(s, 'dark'), 0, 0.033, 0.072)); // brow housing
  grp.add(part(box(0.02, 0.009, 0.046), C(s, 'glass'), 0, 0.042, 0.078)); // cyan visor slit, proud

  // --- signature glowing CYAN spine line + two flank light-lines (syndicate) ---
  grp.add(part(box(0.006, 0.005, 0.2), GLOW(s), 0, 0.036, -0.02)); // dorsal spine glow
  for (const x of [-0.028, 0.028]) grp.add(part(box(0.004, 0.004, 0.16), GLOW(s), x, 0.004, -0.03)); // flank glow lines

  // --- swept-back angular blade-vanes with bent knife tips (sleek raider signature) ---
  for (const sgn of [-1, 1]) {
    const v = part(box(0.13, 0.007, 0.06), C(s, 'hull'), sgn * 0.072, -0.006, -0.055); // root blade
    v.rotation.set(0, sgn * 0.68, -sgn * 0.42);
    grp.add(v);
    const t = part(box(0.07, 0.006, 0.042), C(s, 'dark'), sgn * 0.14, -0.036, -0.095); // bent outer tip
    t.rotation.set(0, sgn * 1.0, -sgn * 0.7);
    grp.add(t);
    const e = part(box(0.12, 0.004, 0.005), GLOW(s), sgn * 0.07, -0.002, -0.026); // cyan leading edge
    e.rotation.set(0, sgn * 0.68, -sgn * 0.42);
    grp.add(e);
    navLight(grp, s, sgn > 0 ? 'star' : 'port', sgn * 0.168, -0.04, -0.105, 0.008);
  }

  // --- OVERSIZED CYAN-glow twin engines at the tail (raw speed) ---
  for (const x of [-0.032, 0.032]) {
    addRot(grp, cyl(0.03, 0.028, 0.11, 8), C(s, 'hull2'), x, 0, -0.1, Math.PI / 2); // big engine housing
    addRot(grp, cyl(0.033, 0.033, 0.012, 8), C(s, 'dark'), x, 0, -0.055, Math.PI / 2); // armour collar ring
    addRot(grp, cyl(0.031, 0.031, 0.008, 8), GLOW(s), x, 0, -0.148, Math.PI / 2); // glowing cyan mouth ring
    nozzle(grp, s, x, 0, -0.158, 0.026, 0.05); // oversized bell
    engineGlow(grp, s, x, 0, -0.17, 0.022); // tight oversized cyan plume
  }
  grp.add(part(box(0.012, 0.03, 0.09), C(s, 'dark'), 0, 0, -0.11)); // dark tail fairing between engines

  // --- detail: panel seams, bow RCS, running lights ---
  panelZ(grp, s, 0.026, 0.022, -0.03, 0.11);
  panelZ(grp, s, -0.026, 0.022, -0.03, 0.11);
  for (const x of [-1, 1]) rcsQuad(grp, s, x * 0.024, 0.022, 0.1, 0.006); // bow RCS
  runningLights(grp, s, 0.04, -0.016, 0.11);

  return grp;
}

// One heavy cannon (gunship): the shared dark barrel + muzzle brake, capped by a
// CYAN muzzle ring + a glow bloom at the bore (the Syndicate "charged" weapon-tip
// signature). `back` = breech z, `len` = tube length, so the muzzle sits past prow.
function syndicateCannon(grp, s, x, y, back, len, r) {
  barrel(grp, s, x, y, back + len / 2, r, len);
  addRot(grp, cyl(r * 1.4, r * 1.05, 0.016, 6), ACC(s), x, y, back + len + 0.006, Math.PI / 2); // cyan muzzle ring
  grp.add(part(sph(r * 0.66, 6), GLOW(s), x, y, back + len + 0.012)); // charged cyan bore glow
}

// GUNSHIP — a menacing dark predatory raider / boarding gunship. Sleek but heavy:
// a low graphite dagger hull stepping down to a blunt weapon prow, canted black
// armour cheeks with a cyan trench, a forward BOARDING CLAMP (two mandible prongs
// + a chin ram) framing a battery of heavy cyan-charged cannons past the bow, a
// dorsal drum-turret with up-angled twin cyan barrels, a slim cyan-glass bridge
// slit, and a dense bank of cyan engines at the tail. NOSE = +Z, sym about X=0.
function makeSyndicateGunship(s) {
  const grp = group();

  // ── Low graphite dagger hull (stacked boxes, wide stern → blunt weapon prow) ──
  const segs = [
    [-0.155, 0.185, 0.082, 0.10], // stern engine block
    [-0.055, 0.175, 0.076, 0.13], // mid-aft (main mass)
    [0.055, 0.135, 0.064, 0.11], // mid-forward (narrowing)
    [0.135, 0.09, 0.05, 0.07], // blunt forward block (battery mount)
  ];
  for (const [z, w, h, l] of segs) grp.add(part(box(w, h, l), C(s, 'hull'), 0, 0, z));
  grp.add(part(box(0.135, 0.05, 0.30), C(s, 'dark'), 0, -0.05, -0.05)); // deep dark ventral keel
  grp.add(part(box(0.11, 0.022, 0.26), C(s, 'hull2'), 0, 0.05, -0.05)); // raised dorsal armour deck
  grp.add(part(box(0.175, 0.02, 0.03), C(s, 'dark'), 0, 0.006, -0.19)); // stern armour lip

  for (const z of [0.06, -0.05, -0.14]) panelX(grp, s, 0, 0.062, z, 0.12);
  panelZ(grp, s, 0, 0.062, -0.04, 0.26);

  // ── Signature CYAN glow trench-lines down the spine + both flanks ────────────
  grp.add(part(box(0.006, 0.005, 0.34), GLOW(s), 0, 0.063, -0.03)); // dorsal spine line
  for (const sx of [-1, 1]) grp.add(part(box(0.004, 0.004, 0.30), GLOW(s), sx * 0.088, -0.004, -0.03)); // flank lines

  // ── Canted black armour cheeks (addRot), each with a cyan rib ────────────────
  for (const sx of [-1, 1]) {
    for (const [z, px] of [[-0.04, 0.096], [-0.14, 0.101]]) {
      addRot(grp, box(0.009, 0.07, 0.12), C(s, 'dark'), sx * px, 0.004, z, 0, 0, sx * -0.32);
      addRot(grp, box(0.004, 0.05, 0.09), GLOW(s), sx * (px + 0.005), 0.016, z, 0, 0, sx * -0.32); // cyan rib
    }
  }

  // ── Heavy forward battery: mantlet + THREE cyan-charged cannons past the bow ──
  grp.add(part(box(0.135, 0.058, 0.05), C(s, 'dark'), 0, -0.004, 0.12)); // gun mantlet at the prow
  grp.add(part(box(0.1, 0.01, 0.01), GLOW(s), 0, 0.03, 0.122)); // cyan targeting strip
  syndicateCannon(grp, s, 0, 0.012, 0.1, 0.135, 0.019); // central HEAVY (muzzle ~0.24)
  for (const bx of [-0.046, 0.046]) syndicateCannon(grp, s, bx, -0.018, 0.105, 0.1, 0.013); // lower pair

  // ── Forward BOARDING CLAMP: two mandible prongs + a chin ram (the pirate cue) ─
  for (const sx of [-1, 1]) {
    addRot(grp, box(0.022, 0.052, 0.15), C(s, 'dark'), sx * 0.072, 0.006, 0.15, 0, sx * -0.17, 0); // mandible prong
    addRot(grp, cone(0.017, 0.06, 5), C(s, 'hull2'), sx * 0.05, 0.006, 0.225, Math.PI / 2); // converging fang tip
    grp.add(part(sph(0.011, 6), GLOW(s), sx * 0.05, 0.006, 0.23)); // cyan clamp-jaw glow node
    grp.add(part(box(0.004, 0.03, 0.13), GLOW(s), sx * 0.06, 0.006, 0.155)); // cyan inner clamp edge
  }
  addRot(grp, cone(0.03, 0.12, 6), C(s, 'hull2'), 0, -0.038, 0.15, Math.PI / 2); // chin ram spike
  grp.add(part(box(0.008, 0.008, 0.12), GLOW(s), 0, -0.03, 0.16)); // cyan ram edge line

  // ── Dorsal drum-turret with up-angled twin cyan barrels ──────────────────────
  {
    const z = -0.005;
    const by = 0.062;
    grp.add(part(cyl(0.05, 0.056, 0.014, 8), C(s, 'dark'), 0, by + 0.007, z)); // base collar
    grp.add(part(cyl(0.038, 0.041, 0.03, 8), C(s, 'hull2'), 0, by + 0.028, z)); // rotating drum
    const gy = by + 0.05;
    grp.add(part(box(0.072, 0.03, 0.044), C(s, 'dark'), 0, gy, z + 0.006)); // gun housing
    grp.add(part(box(0.048, 0.016, 0.014), C(s, 'glass'), 0, gy + 0.002, z - 0.023)); // rear cyan targeting glass
    for (const bx of [-0.02, 0.02]) {
      addRot(grp, box(0.013, 0.013, 0.1), C(s, 'dark'), bx, gy + 0.008, z + 0.05, -0.2); // barrel, muzzle raised
      grp.add(part(box(0.016, 0.016, 0.012), ACC(s), bx, gy + 0.019, z + 0.097)); // cyan muzzle tip
      grp.add(part(sph(0.008, 6), GLOW(s), bx, gy + 0.021, z + 0.103)); // cyan glow
    }
  }

  // ── Slim command bridge (low & sleek, cyan-glass slit) at the aft dorsal ──────
  grp.add(part(box(0.06, 0.036, 0.075), C(s, 'dark'), 0, 0.083, -0.115)); // bridge riser
  grp.add(part(box(0.044, 0.026, 0.05), C(s, 'hull2'), 0, 0.114, -0.115)); // armoured crown
  grp.add(part(box(0.05, 0.016, 0.014), C(s, 'glass'), 0, 0.096, -0.075)); // forward cyan bridge slit
  grp.add(part(sph(0.014, 8), C(s, 'glass'), 0, 0.05, 0.075)); // cyan nose sensor dome
  antenna(grp, s, 0, 0.13, -0.13, 0.055); // slim aft mast

  // ── Dense bank of CYAN engines at the tail ───────────────────────────────────
  grp.add(part(box(0.19, 0.072, 0.028), C(s, 'dark'), 0, 0.0, -0.195)); // recessed engine housing
  for (const x of [-0.072, -0.024, 0.024, 0.072]) nozzle(grp, s, x, -0.014, -0.205, 0.023, 0.048); // main row (4)
  for (const x of [-0.048, 0.0, 0.048]) engineGlow(grp, s, x, 0.03, -0.198, 0.017); // raised secondaries (3)

  // ── Running lights + bow/stern RCS ───────────────────────────────────────────
  runningLights(grp, s, 0.096, 0.0, -0.13);
  navLight(grp, s, 'star', 0.05, -0.006, 0.14, 0.01);
  navLight(grp, s, 'port', -0.05, -0.006, 0.14, 0.01);
  for (const sx of [-1, 1]) {
    rcsQuad(grp, s, sx * 0.05, 0.035, 0.13, 0.01);
    rcsQuad(grp, s, sx * 0.096, -0.045, -0.15, 0.01);
  }

  return grp;
}

// CORVETTE — the Syndicate's criminal patrol cutter / raider frigate. A long, low,
// PREDATORY graphite hull that narrows hard to a flat knife-blade prow (Zann
// Consortium "Vengeance"/"Aggressor" flavour): a hunched dark aft command bridge
// with a CYAN glass slit, rows of small cyan-tipped side turret blisters, a glowing
// CYAN spine + flank light-lines, and a raised cyan-glow rear engine bank. NOSE = +Z.
function makeSyndicateCorvette(s) {
  const grp = group();

  // --- sleek predatory keel: a faceted dart tapering to a blade prow ----------
  const segs = [
    [-0.18, 0.104, 0.056, 0.11], // armoured stern block
    [-0.07, 0.094, 0.048, 0.13],
    [0.045, 0.074, 0.040, 0.15], // mid deck (widest read)
    [0.15, 0.046, 0.030, 0.10],
    [0.22, 0.024, 0.020, 0.06], // knife fore-block
  ];
  for (const [z, w, h, l] of segs) grp.add(part(box(w, h, l), C(s, 'hull'), 0, 0, z));

  // Long sharp prow: a cone flattened in world-Y into a wide horizontal BLADE.
  const prow = addRot(grp, cone(0.016, 0.12, 8), C(s, 'dark'), 0, 0, 0.27, Math.PI / 2);
  prow.scale.set(1.25, 1, 0.45);

  grp.add(part(box(0.05, 0.02, 0.44), C(s, 'hull2'), 0, 0.036, -0.02)); // raised dorsal ridge
  grp.add(part(box(0.042, 0.026, 0.4), C(s, 'dark'), 0, -0.034, -0.03)); // ventral keel blade
  for (const sx of [-1, 1]) addRot(grp, box(0.03, 0.006, 0.34), C(s, 'hull2'), sx * 0.05, 0.006, 0.0, 0, 0, sx * -0.6); // raked flank blades

  // Forward-swept cheek strakes flanking the prow (raider "mandible" hint).
  for (const sx of [-1, 1]) {
    const st = addRot(grp, box(0.006, 0.012, 0.12), C(s, 'hull2'), sx * 0.03, 0.002, 0.17, 0, sx * 0.5, 0);
    grp.add(part(box(0.007, 0.009, 0.012), GLOW(s), st.position.x + sx * 0.026, 0.002, 0.225)); // cyan tip
  }

  // --- signature CYAN glowing spine + flank light-lines -----------------------
  grp.add(part(box(0.006, 0.006, 0.5), GLOW(s), 0, 0.05, -0.02)); // bright dorsal spine line
  for (const x of [-0.05, 0.05]) grp.add(part(box(0.004, 0.004, 0.34), GLOW(s), x, 0.012, 0.0)); // flank lines
  for (const x of [-0.024, 0.024]) panelZ(grp, s, x, 0.047, -0.03, 0.36); // engraved seams

  // --- low, hunched dark command bridge + a raked dorsal fin (aft) ------------
  grp.add(part(box(0.058, 0.034, 0.095), C(s, 'dark'), 0, 0.052, -0.128)); // bridge base block
  grp.add(part(box(0.05, 0.028, 0.03), C(s, 'hull2'), 0, 0.07, -0.09)); // forward bridge face
  grp.add(part(box(0.044, 0.016, 0.008), C(s, 'glass'), 0, 0.074, -0.073)); // CYAN bridge slit
  for (const x of [-0.04, 0.04]) grp.add(part(box(0.02, 0.028, 0.04), C(s, 'dark'), x, 0.04, -0.138)); // flank sub-blocks
  addRot(grp, box(0.006, 0.05, 0.07), C(s, 'hull2'), 0, 0.096, -0.175, -0.45, 0, 0); // raked dorsal shark-fin
  grp.add(part(box(0.009, 0.05, 0.007), GLOW(s), 0, 0.098, -0.152)); // cyan glow up the fin

  // --- rows of small cyan-tipped side turret blisters -------------------------
  const turret = (x, y, z, r) => {
    grp.add(part(cyl(r * 1.3, r * 1.5, r * 0.35, 6), C(s, 'dark'), x, y, z)); // base collar
    grp.add(part(sph(r, 6), C(s, 'hull2'), x, y + r * 0.3, z)); // blister dome
    const gy = y + r * 0.3;
    const bl = r * 2.1;
    addRot(grp, cyl(r * 0.28, r * 0.22, bl, 6), C(s, 'dark'), x, gy, z + r + bl / 2, Math.PI / 2); // gun
    grp.add(part(box(r * 0.32, r * 0.32, r * 0.12), ACC(s), x, gy, z + r + bl)); // cyan muzzle tip
  };
  for (const sx of [-1, 1]) {
    for (const z of [0.085, 0.0, -0.075, -0.15]) turret(sx * 0.05, 0.03, z, 0.012);
  }
  for (const x of [-0.02, 0.02]) grp.add(part(box(0.009, 0.009, 0.03), ACC(s), x, 0.014, 0.12)); // fixed spinal tips

  // --- raised rear engine bank, CYAN glow -------------------------------------
  grp.add(part(box(0.11, 0.056, 0.026), C(s, 'dark'), 0, 0.0, -0.222)); // main engine face plate
  for (const x of [-0.05, -0.017, 0.017, 0.05]) nozzle(grp, s, x, 0.0, -0.235, 0.016, 0.038); // main row
  grp.add(part(box(0.066, 0.028, 0.04), C(s, 'dark'), 0, 0.05, -0.2)); // upper raised engine deck
  for (const x of [-0.024, 0.024]) engineGlow(grp, s, x, 0.055, -0.238, 0.013); // raised secondaries

  for (const sx of [-1, 1]) addRot(grp, box(0.004, 0.028, 0.05), C(s, 'accent'), sx * 0.05, 0.018, -0.19, 0, sx * 0.4, sx * -0.3); // rear fins

  runningLights(grp, s, 0.05, 0.0, 0.11);
  antenna(grp, s, 0, 0.088, -0.112, 0.05);
  navLight(grp, s, 'star', 0, 0.11, -0.2, 0.011);
  for (const sx of [-1, 1]) rcsQuad(grp, s, sx * 0.04, 0.018, 0.15, 0.007);

  return grp;
}

// FREIGHTER — the syndicate's smuggler hauler. A SLEEK dark cargo runner, NOT a
// rusty tramp: a streamlined graphite spine with a dagger prow, its modular cargo
// pods CONCEALED inside canted sleek flank fairings (only their ends + a lit hatch
// peeking), a small dark cockpit forward with a cyan slit, cyan glow accent lines,
// and a pair of cyan-glow engines tucked aft. NOSE = +Z, sym about X=0.
function makeSyndicateFreighter(s) {
  const grp = group();

  // A. SLEEK HULL SPINE — a low faceted graphite core with a dagger prow.
  grp.add(part(box(0.07, 0.055, 0.30), C(s, 'hull'), 0, 0.006, -0.05)); // core spine body
  grp.add(part(wedge(0.07, 0.055, 0.22), C(s, 'hull2'), 0, 0.006, 0.17)); // dagger prow
  grp.add(part(box(0.014, 0.022, 0.04), C(s, 'dark'), 0, 0.004, 0.263)); // dark nose-tip cap
  grp.add(part(box(0.03, 0.02, 0.12), C(s, 'dark'), 0, -0.018, 0.205)); // predatory ventral chin
  grp.add(part(box(0.042, 0.02, 0.34), C(s, 'hull2'), 0, 0.04, -0.04)); // dorsal ridge
  for (const sx of [-1, 1]) addRot(grp, box(0.026, 0.014, 0.34), C(s, 'hull'), sx * 0.03, 0.03, -0.04, 0, 0, -sx * 0.55); // dorsal bevel
  grp.add(part(box(0.05, 0.024, 0.30), C(s, 'dark'), 0, -0.03, -0.05)); // ventral keel fairing
  for (const sx of [-1, 1]) addRot(grp, box(0.03, 0.012, 0.28), C(s, 'dark'), sx * 0.046, -0.036, -0.05, 0, 0, -sx * 0.4); // belly chines

  // B. CONCEALED CARGO PODS — dark modular containers half-shrouded by fairings.
  const podZ = [0.03, -0.05, -0.13];
  for (const sx of [-1, 1]) {
    for (const z of podZ) {
      grp.add(part(box(0.05, 0.056, 0.066), C(s, 'dark'), sx * 0.052, -0.008, z)); // dark cargo pod
      grp.add(part(box(0.03, 0.02, 0.006), C(s, 'glass'), sx * 0.078, -0.008, z)); // cyan-lit cargo hatch
      for (const cy of [0.022, -0.038]) grp.add(part(box(0.056, 0.008, 0.01), C(s, 'accent'), sx * 0.052, cy, z)); // clamp rails
    }
    grp.add(part(box(0.052, 0.014, 0.28), C(s, 'hull2'), sx * 0.052, 0.028, -0.05)); // fairing LID
    addRot(grp, box(0.014, 0.08, 0.28), C(s, 'hull2'), sx * 0.083, 0.004, -0.05, 0, 0, sx * 0.5); // canted outer fairing skirt
    addRot(grp, box(0.012, 0.03, 0.28), C(s, 'dark'), sx * 0.088, -0.03, -0.05, 0, 0, sx * 0.5); // lower shroud lip
    for (const z of [-0.01, -0.09]) grp.add(part(box(0.012, 0.062, 0.012), C(s, 'dark'), sx * 0.082, -0.006, z)); // pod-divider ribs
    grp.add(part(box(0.004, 0.004, 0.28), GLOW(s), sx * 0.086, -0.03, -0.05)); // cyan glow line
    grp.add(part(box(0.006, 0.008, 0.26), ACC(s), sx * 0.052, 0.05, -0.05)); // cyan sig strake
    panelZ(grp, s, sx * 0.052, 0.036, -0.05, 0.26);
  }
  grp.add(part(box(0.006, 0.004, 0.30), GLOW(s), 0, 0.052, -0.04)); // cyan dorsal spine glow

  // C. FORWARD COCKPIT — small, low, dark, single cyan viewport slit.
  grp.add(part(box(0.052, 0.028, 0.07), C(s, 'dark'), 0, 0.042, 0.10)); // cockpit block
  grp.add(part(box(0.05, 0.008, 0.02), C(s, 'dark'), 0, 0.058, 0.116)); // dark brow visor
  grp.add(part(box(0.044, 0.011, 0.012), C(s, 'glass'), 0, 0.048, 0.138)); // cyan viewport slit
  grp.add(part(box(0.02, 0.02, 0.03), C(s, 'hull2'), 0, 0.068, 0.126)); // forward sensor perch
  grp.add(part(box(0.004, 0.004, 0.14), GLOW(s), 0, 0.03, 0.185)); // cyan glow line up the prow

  // D. ENGINES — a pair of sleek cyan-glow engine pods with intake + glow rings.
  grp.add(part(box(0.09, 0.05, 0.06), C(s, 'hull'), 0, 0.0, -0.225)); // stern engine block
  grp.add(part(box(0.09, 0.005, 0.006), GLOW(s), 0, 0.03, -0.235)); // cyan engine light bar
  for (const sx of [-1, 1]) {
    addRot(grp, box(0.016, 0.05, 0.10), C(s, 'hull2'), sx * 0.055, 0, -0.25, 0, sx * 0.3, 0); // canted aft fairing
    addRot(grp, cyl(0.028, 0.024, 0.10, 12), C(s, 'hull2'), sx * 0.042, 0, -0.23, Math.PI / 2); // sleek engine pod
    addRot(grp, cyl(0.03, 0.026, 0.012, 12), C(s, 'dark'), sx * 0.042, 0, -0.185, Math.PI / 2); // intake ring
    addRot(grp, cyl(0.03, 0.03, 0.006, 12), GLOW(s), sx * 0.042, 0, -0.215, Math.PI / 2); // cyan glow ring
    nozzle(grp, s, sx * 0.042, 0.0, -0.258, 0.026, 0.045); // cyan-glow engine
  }

  runningLights(grp, s, 0.084, 0.0, 0.14);
  navLight(grp, s, 'top', 0, 0.062, 0.09, 0.008);
  panelX(grp, s, 0, 0.048, 0.05, 0.06);
  panelX(grp, s, 0, 0.048, -0.14, 0.06);
  panelX(grp, s, 0, -0.042, 0.0, 0.05);
  panelX(grp, s, 0, -0.042, -0.1, 0.05);
  for (const sx of [-1, 1]) {
    rcsQuad(grp, s, sx * 0.08, 0.032, 0.12, 0.009); // bow RCS
    rcsQuad(grp, s, sx * 0.05, -0.04, -0.19, 0.009); // stern RCS
    grp.add(part(box(0.01, 0.01, 0.01), C(s, 'hull2'), sx * 0.02, 0.062, -0.02)); // dorsal sensor blister
    grp.add(part(box(0.012, 0.008, 0.014), C(s, 'dark'), sx * 0.022, 0.052, -0.185)); // dorsal aft vent
  }
  antenna(grp, s, 0, 0.05, -0.15, 0.055); // discreet comms mast

  return grp;
}

// TANKER — the syndicate's contraband fuel/chem runner. A SLEEK dark tanker: three
// near-black tanks standing proud in a streamlined graphite cradle (partly shrouded
// by sleek cheek-fairings), CYAN glow hazard-lines instead of paint, a small dark
// cockpit forward with a cyan slit, and cyan-glow rear engines. NOSE = +Z.
function makeSyndicateTanker(s) {
  const grp = group();

  const TR = 0.03; // tank radius
  const TL = 0.34; // tank body length
  const TZ = -0.02; // bundle centre Z
  const TY = 0.03; // tank-axis height
  const FRONT = TZ + TL / 2;
  const REAR = TZ - TL / 2;
  const TOP = TY + TR;
  const tankX = [-0.074, 0, 0.074];
  const HW = 0.074 + TR;
  const VALX = [-0.037, 0.037];
  const ZFRAMES = [0.1, -0.05];

  // streamlined graphite belly the tanks ride on.
  grp.add(part(box(0.17, 0.03, TL + 0.02), C(s, 'hull2'), 0, -0.02, TZ)); // ventral hull block
  grp.add(part(box(0.16, 0.02, TL - 0.02), C(s, 'hull'), 0, 0.0, TZ)); // mid-graphite deck bed
  grp.add(part(box(0.09, 0.016, TL - 0.06), C(s, 'dark'), 0, -0.04, TZ)); // ventral keel plate

  // three near-black tanks standing proud of the cradle.
  for (const x of tankX) {
    addRot(grp, cyl(TR, TR, TL, 8), C(s, 'dark'), x, TY, TZ, Math.PI / 2); // dark tank body
    for (const z of [FRONT - 0.055, TZ, REAR + 0.055]) addRot(grp, cyl(TR * 1.04, TR * 1.04, 0.007, 8), ACC(s), x, TY, z, Math.PI / 2); // cyan hazard bands
    addRot(grp, cyl(TR * 1.22, TR * 1.22, 0.016, 8), ACC(s), x, TY, FRONT - 0.004, Math.PI / 2); // flange ring
    addRot(grp, cyl(TR * 0.94, TR * 0.66, 0.028, 8), C(s, 'hull2'), x, TY, FRONT + 0.014, Math.PI / 2); // domed head
    addRot(grp, cyl(TR * 0.34, TR * 0.34, 0.03, 8), C(s, 'accent'), x, TY, FRONT + 0.032, Math.PI / 2); // filler stub
  }

  // sleek low canted cheek-fairings on the outer-lower flanks (partly shroud).
  for (const x of [-1, 1]) addRot(grp, box(0.014, 0.052, TL - 0.04), C(s, 'hull2'), x * (HW + 0.002), 0.004, TZ, 0, 0, x * 0.34);

  // slim cradle cross-straps + rear dorsal shroud over the aftmost bay.
  for (const z of ZFRAMES) grp.add(part(box(0.208, 0.008, 0.011), C(s, 'accent'), 0, TOP + 0.006, z));
  grp.add(part(box(0.16, 0.022, 0.1), C(s, 'hull2'), 0, TOP + 0.006, REAR + 0.05)); // shroud roof
  addRot(grp, box(0.16, 0.006, 0.024), C(s, 'hull'), 0, TOP + 0.02, REAR + 0.098, -0.5); // shroud front lip

  // CYAN glow hazard-lines (glow, not paint).
  for (const x of [-1, 1]) {
    grp.add(part(box(0.004, 0.004, TL + 0.02), GLOW(s), x * (HW + 0.006), 0.012, TZ)); // flank hazard-line
    grp.add(part(box(0.004, 0.004, TL - 0.06), GLOW(s), x * (HW - 0.01), -0.03, TZ)); // lower keel line
  }
  grp.add(part(box(0.005, 0.004, TL * 0.74), GLOW(s), 0, TOP + 0.012, TZ)); // dorsal spine line
  for (const x of VALX) grp.add(part(box(0.008, 0.006, TL - 0.02), GLOW(s), x, TOP + 0.002, TZ)); // valley seam-lines
  for (const z of [FRONT - 0.06, TZ - 0.02, REAR + 0.06]) grp.add(part(box(0.034, 0.004, 0.006), GLOW(s), 0, TOP + 0.014, z)); // hazard chevrons

  // small dark sleek cockpit forward with a low cyan slit + a knife prow.
  grp.add(part(box(0.056, 0.03, 0.075), C(s, 'dark'), 0, 0.062, FRONT - 0.01)); // cockpit block
  grp.add(part(box(0.062, 0.008, 0.04), C(s, 'hull2'), 0, 0.08, FRONT + 0.006)); // sleek brow fairing
  grp.add(part(box(0.04, 0.008, 0.008), C(s, 'glass'), 0, 0.066, FRONT + 0.028)); // cyan vision slit
  grp.add(part(box(0.042, 0.005, 0.006), GLOW(s), 0, 0.066, FRONT + 0.031)); // slit glow
  addRot(grp, cone(0.03, 0.09, 8), C(s, 'hull2'), 0, 0.032, FRONT + 0.05, Math.PI / 2); // knife prow
  panelZ(grp, s, 0.02, 0.078, FRONT - 0.01, 0.06);
  panelZ(grp, s, -0.02, 0.078, FRONT - 0.01, 0.06);

  // cyan-glow rear engine bank.
  grp.add(part(box(0.16, 0.06, 0.05), C(s, 'dark'), 0, 0.016, REAR - 0.02)); // engine deck block
  grp.add(part(box(0.14, 0.014, 0.042), ACC(s), 0, 0.05, REAR - 0.02)); // cyan engineering band
  for (const x of tankX) nozzle(grp, s, x, 0.014, REAR - 0.045, 0.026, 0.045); // 3 main cyan nozzles
  for (const x of [-0.038, 0.038]) engineGlow(grp, s, x, 0.052, REAR - 0.05, 0.013); // 2 raised secondaries
  for (const x of [-1, 1]) grp.add(part(box(0.005, 0.004, 0.13), GLOW(s), x * (HW - 0.004), 0.03, REAR + 0.05)); // aft nacelle glow-lines

  panelZ(grp, s, 0.078, -0.028, TZ, 0.28);
  panelZ(grp, s, -0.078, -0.028, TZ, 0.28);
  panelX(grp, s, 0, -0.046, 0.09, 0.08);
  panelX(grp, s, 0, -0.046, -0.12, 0.08);
  greeble(grp, s, 'hull2', 0, -0.04, 0.07, 0.04, 0.02, 0.035); // fore pump box
  greeble(grp, s, 'hull2', 0, -0.04, -0.1, 0.04, 0.02, 0.035); // aft pump box

  for (const x of [-1, 1]) rcsQuad(grp, s, x * (HW - 0.006), 0.006, FRONT - 0.05, 0.009); // bow RCS
  runningLights(grp, s, HW + 0.008, 0.0, FRONT - 0.02);
  navLight(grp, s, 'top', 0, 0.1, FRONT - 0.01, 0.008); // command beacon
  antenna(grp, s, 0.02, 0.08, FRONT - 0.05, 0.045); // short comms mast

  return grp;
}

// LINER — Syndicate crime-lord runner. A sleek, expensive, DANGEROUS VIP transport
// (not a friendly cruise liner, not junk): a long low graphite hull tapering to a
// predatory knife prow, faceted chamfered flanks, rows of tiny CYAN-lit window
// slits (discreet lit passenger decks), a low swept superstructure aft-of-midships
// with a wide cyan-glass bridge band + sensor dome, swept rear fairings, cyan accent
// lines the length of the hull, and a cyan engine bank. NOSE = +Z.
function makeSyndicateLiner(s) {
  const grp = group();

  // --- sleek graphite hull: stern block, long mid-slab, tapered knife prow -----
  grp.add(part(box(0.10, 0.082, 0.13), C(s, 'hull'), 0, 0, -0.265)); // stern engineering block
  grp.add(part(box(0.106, 0.088, 0.016), C(s, 'dark'), 0, 0, -0.20)); // dark weld collar
  grp.add(part(box(0.095, 0.076, 0.34), C(s, 'hull'), 0, 0, -0.03)); // MAIN SLAB — passenger deck run
  grp.add(part(box(0.10, 0.08, 0.016), C(s, 'dark'), 0, 0, 0.14)); // forward weld collar
  grp.add(part(wedge(0.09, 0.072, 0.18), C(s, 'hull'), 0, 0, 0.215)); // knife prow
  grp.add(part(box(0.028, 0.022, 0.05), C(s, 'dark'), 0, -0.004, 0.295)); // dark prow beak
  grp.add(part(box(0.006, 0.004, 0.14), GLOW(s), 0, 0.03, 0.2)); // cyan accent line on the prow

  // --- faceted sleekness: canted dark chamfer plates bevel belly + top edges ---
  for (const x of [-1, 1]) {
    addRot(grp, box(0.03, 0.006, 0.36), C(s, 'dark'), x * 0.044, -0.032, -0.03, 0, 0, x * 0.7); // lower belly chamfer
    addRot(grp, box(0.026, 0.006, 0.36), C(s, 'hull2'), x * 0.044, 0.03, -0.03, 0, 0, x * -0.7); // upper edge chamfer
  }
  grp.add(part(box(0.07, 0.02, 0.34), C(s, 'hull2'), 0, 0.046, -0.03)); // lighter dorsal deck spine
  grp.add(part(box(0.05, 0.026, 0.16), C(s, 'dark'), 0, -0.05, -0.06)); // sleek ventral keel fin

  // --- CYAN window-slit rows: discreet lit passenger/VIP decks -----------------
  for (const x of [-1, 1]) {
    for (const y of [0.014, -0.016]) {
      grp.add(part(box(0.004, 0.016, 0.32), C(s, 'dark'), x * 0.047, y, -0.03)); // recessed window band
      for (let z = -0.185; z <= 0.11; z += 0.02) grp.add(part(box(0.005, 0.007, 0.011), GLOW(s), x * 0.049, y, z)); // lit cyan window slit
    }
    for (let z = -0.16; z <= 0.1; z += 0.026) grp.add(part(box(0.006, 0.006, 0.012), GLOW(s), x * 0.034, 0.05, z)); // upper promenade slits
  }

  // --- low swept superstructure aft-of-midships: sleek stepped deckhouse --------
  grp.add(part(box(0.066, 0.028, 0.18), C(s, 'hull2'), 0, 0.052, -0.05)); // deckhouse base
  grp.add(part(box(0.05, 0.026, 0.10), C(s, 'dark'), 0, 0.078, -0.075)); // stepped-back crown
  grp.add(part(box(0.062, 0.03, 0.01), C(s, 'dark'), 0, 0.052, 0.042)); // recessed forward bridge wall
  grp.add(part(box(0.05, 0.014, 0.006), C(s, 'glass'), 0, 0.056, 0.048)); // wide cyan-glass bridge band
  for (const x of [-1, 1]) addRot(grp, box(0.02, 0.014, 0.006), C(s, 'glass'), x * 0.03, 0.056, 0.038, 0, x * 0.6, 0); // wraparound bridge wings
  grp.add(part(box(0.038, 0.01, 0.006), C(s, 'glass'), 0, 0.084, -0.022)); // upper command slit
  grp.add(part(sph(0.015, 10), C(s, 'glass'), 0, 0.098, -0.06)); // cyan sensor dome
  grp.add(part(box(0.066, 0.004, 0.004), GLOW(s), 0, 0.067, 0.038)); // cyan deck-edge glow trim

  // --- streamlined swept rear fairings (elegant + fast) ------------------------
  for (const x of [-1, 1]) {
    addRot(grp, box(0.006, 0.06, 0.12), C(s, 'hull2'), x * 0.055, 0.018, -0.27, 0, x * 0.5, 0); // swept stabiliser fin
    addRot(grp, box(0.007, 0.06, 0.006), GLOW(s), x * 0.073, 0.018, -0.235, 0, x * 0.5, 0); // cyan trailing edge
  }

  // --- cyan accent + running lines ---------------------------------------------
  grp.add(part(box(0.006, 0.005, 0.42), GLOW(s), 0, 0.058, -0.03)); // luminous dorsal spine line
  for (const x of [-1, 1]) {
    grp.add(part(box(0.003, 0.006, 0.36), ACC(s), x * 0.047, -0.024, -0.03)); // accent strake
    panelZ(grp, s, x * 0.048, 0.038, -0.03, 0.30); // engraved plating seam
    greeble(grp, s, 'dark', x * 0.04, -0.052, -0.04, 0.028, 0.016, 0.06); // ventral service pod
  }

  // --- rear engine bank (cyan glow) --------------------------------------------
  grp.add(part(box(0.104, 0.084, 0.016), C(s, 'dark'), 0, 0, -0.32)); // engine armour plate
  addRot(grp, cyl(0.05, 0.05, 0.014, 12), C(s, 'dark'), 0, 0, -0.325, Math.PI / 2); // engine mount disc
  for (const x of [-0.036, 0, 0.036]) nozzle(grp, s, x, 0, -0.33, 0.02, 0.044); // main thrusters
  for (const x of [-0.018, 0.018]) engineGlow(grp, s, x, 0.03, -0.335, 0.013); // raised secondary glows
  grp.add(part(box(0.09, 0.006, 0.006), GLOW(s), 0, -0.026, -0.325)); // cyan engine glow bar

  antenna(grp, s, 0, 0.108, -0.09, 0.09); // slim comms mast
  runningLights(grp, s, 0.05, -0.004, 0.12);
  navLight(grp, s, 'top', 0, 0.113, -0.06, 0.01); // cyan-white beacon on the crown

  return grp;
}

// === BESPOKE FLAGSHIP — a colossal, richly detailed criminal dreadnought =======

// A concealed heavy Syndicate drum-turret: a dark base collar + a graphite drum,
// a low gun-house, and twin forward CYAN-charged barrels (cyan muzzle tips + a
// glow pip). `heavy` swaps in a bigger gun-house + a rear cyan targeting glass so
// the dorsal batteries read as capital guns, not point-defence bumps.
function synFlagTurret(grp, s, x, y, z, r, heavy = false) {
  grp.add(part(cyl(r * 1.5, r * 1.7, r * 0.4, 8), C(s, 'dark'), x, y, z)); // base collar
  grp.add(part(cyl(r, r, r * 0.85, 8), C(s, 'hull2'), x, y + r * 0.55, z)); // rotating drum
  const gy = y + r * 0.78;
  if (heavy) {
    grp.add(part(box(r * 2.3, r * 1.0, r * 1.9), C(s, 'dark'), x, gy, z + r * 0.3)); // armoured gun-house
    grp.add(part(box(r * 1.5, r * 0.5, r * 0.4), C(s, 'glass'), x, gy + r * 0.5, z - r * 0.85)); // rear cyan targeting glass
  } else {
    grp.add(part(box(r * 1.5, r * 0.8, r * 1.0), C(s, 'dark'), x, gy, z + r * 0.2)); // gun-house
  }
  const bl = heavy ? r * 3.6 : r * 3.0; // barrel length (overhangs forward)
  const el = 0.34; // up-elevation → the row bristles against the sky
  const ca = Math.cos(el);
  const sa = Math.sin(el);
  for (const bx of [-r * 0.45, r * 0.45]) {
    addRot(grp, cyl(r * 0.3, r * 0.22, bl, 6), C(s, 'dark'), x + bx, gy + (bl / 2) * sa, z + r + (bl / 2) * ca, Math.PI / 2 - el); // barrel
    grp.add(part(box(r * 0.44, r * 0.44, r * 0.18), ACC(s), x + bx, gy + bl * sa, z + r + bl * ca)); // cyan muzzle tip
  }
  grp.add(part(sph(r * 0.3, 6), GLOW(s), x, gy + bl * sa + r * 0.2, z + r + bl * ca)); // shared charged cyan glow
}

// A heavy spinal cannon whose muzzle overhangs PAST the prow: the shared dark
// barrel + muzzle brake, capped by a cyan muzzle ring + a hot charged bore glow.
function synFlagCannon(grp, s, x, y, back, len, r) {
  barrel(grp, s, x, y, back + len / 2, r, len); // tube + muzzle brake (ends ~back+len)
  addRot(grp, cyl(r * 1.5, r * 1.15, 0.02, 8), ACC(s), x, y, back + len + 0.01, Math.PI / 2); // cyan muzzle ring
  grp.add(part(sph(r * 0.9, 6), GLOW(s), x, y, back + len + 0.026)); // hot charged cyan bore glow
}

// FLAGSHIP — a COLOSSAL Syndicate criminal dreadnought (Zann Consortium Aggressor /
// Keldabe flavour). A long SLEEK faceted graphite dagger tapering to a sharp blade
// prow, chamfered flanks, dorsal + ventral glowing CYAN spine lines, a sleek swept
// command-tower island (wide cyan-glass bridge band, twin sensor domes, spire), a
// forward battery of cyan-charged spinal cannons overhanging the prow, bristling
// dorsal drum-turret rows, a cyan-lit ventral hangar recess, sleek swept radiator
// fins, and a DENSE cyan engine bank. NOSE = +Z, tail = -Z, symmetric about X=0.
function makeSyndicateFlagship(s) {
  const grp = group();

  // ── A. SLEEK DAGGER HULL — stacked graphite blocks narrowing to a wedge prow ──
  const segs = [
    [-0.42, 0.30, 0.115, 0.18], // armoured stern block (widest)
    [-0.24, 0.285, 0.105, 0.20],
    [-0.02, 0.24, 0.092, 0.30], // mid body (main deck run)
    [0.20, 0.155, 0.076, 0.22], // forward narrowing block
  ];
  for (const [z, w, h, l] of segs) grp.add(part(box(w, h, l), C(s, 'hull'), 0, 0, z));
  grp.add(part(wedge(0.155, 0.07, 0.34), C(s, 'hull2'), 0, 0, 0.42)); // sleek wedge fore hull → point ~0.59
  grp.add(part(box(0.028, 0.03, 0.09), C(s, 'dark'), 0, 0, 0.605)); // dark blade beak
  addRot(grp, cone(0.02, 0.1, 6), C(s, 'hull2'), 0, 0, 0.67, Math.PI / 2); // sharp knife tip
  for (const sx of [-1, 1]) {
    const st = addRot(grp, box(0.012, 0.03, 0.2), C(s, 'dark'), sx * 0.075, -0.005, 0.44, 0, sx * 0.42, 0); // cheek strake
    grp.add(part(box(0.01, 0.02, 0.012), GLOW(s), st.position.x + sx * 0.05, -0.005, 0.55)); // cyan strake tip
  }

  grp.add(part(box(0.14, 0.036, 0.62), C(s, 'dark'), 0, -0.062, -0.06)); // ventral keel blade
  for (const sx of [-1, 1]) {
    addRot(grp, box(0.05, 0.008, 0.6), C(s, 'dark'), sx * 0.118, -0.042, -0.06, 0, 0, sx * 0.62); // lower belly chamfer
    addRot(grp, box(0.045, 0.008, 0.54), C(s, 'hull2'), sx * 0.118, 0.046, -0.04, 0, 0, sx * -0.62); // upper edge chamfer
  }
  grp.add(part(box(0.12, 0.03, 0.6), C(s, 'hull2'), 0, 0.062, -0.05)); // raised dorsal armour deck

  // ── B. SIGNATURE CYAN GLOW light-lines (dorsal + ventral spine + flanks) ──────
  grp.add(part(box(0.012, 0.006, 0.72), GLOW(s), 0, 0.082, -0.04)); // dorsal cyan spine line
  grp.add(part(box(0.01, 0.006, 0.58), GLOW(s), 0, -0.08, -0.06)); // ventral cyan spine line
  for (const sx of [-1, 1]) grp.add(part(box(0.005, 0.005, 0.56), GLOW(s), sx * 0.125, 0.004, -0.04)); // flank light-lines
  grp.add(part(box(0.016, 0.024, 0.42), ACC(s), 0, 0.078, 0.06)); // forward cyan sig strake
  for (const sx of [-1, 1]) panelZ(grp, s, sx * 0.05, 0.078, -0.02, 0.5); // dorsal plating seams
  for (const z of [0.16, 0.0, -0.16, -0.3]) panelX(grp, s, 0, 0.078, z, 0.2); // deck frame seams

  // ── C. SLEEK COMMAND-TOWER ISLAND (aft) — the dreadnought's citadel ──────────
  const TZ = -0.28;
  grp.add(part(box(0.13, 0.075, 0.20), C(s, 'dark'), 0, 0.115, TZ)); // deckhouse base
  grp.add(part(box(0.10, 0.085, 0.14), C(s, 'hull'), 0, 0.19, TZ - 0.01)); // stepped mid tower
  grp.add(part(box(0.066, 0.07, 0.085), C(s, 'hull2'), 0, 0.265, TZ - 0.02)); // upper bridge block
  addRot(grp, box(0.008, 0.12, 0.06), C(s, 'hull2'), 0, 0.33, TZ - 0.05, -0.42, 0, 0); // raked knife crown-fin
  addRot(grp, box(0.01, 0.11, 0.006), GLOW(s), 0, 0.33, TZ - 0.028, -0.42, 0, 0); // cyan glow up the crown-fin
  grp.add(part(box(0.12, 0.032, 0.016), C(s, 'glass'), 0, 0.12, TZ + 0.10)); // WIDE cyan bridge band
  grp.add(part(box(0.078, 0.02, 0.012), C(s, 'glass'), 0, 0.205, TZ + 0.055)); // upper command slit
  for (const sx of [-1, 1]) addRot(grp, box(0.04, 0.026, 0.012), C(s, 'glass'), sx * 0.052, 0.12, TZ + 0.088, 0, sx * 0.5, 0); // wraparound bridge wings
  grp.add(part(box(0.13, 0.006, 0.006), GLOW(s), 0, 0.14, TZ + 0.10)); // cyan deck-edge glow trim
  for (const dx of [-0.045, 0.045]) blister(grp, s, dx, 0.29, TZ + 0.01, 0.035); // twin sensor domes
  antenna(grp, s, 0, 0.30, TZ + 0.01, 0.16); // spire mast
  navLight(grp, s, 'top', 0, 0.46, TZ + 0.01, 0.016); // command beacon
  for (const sx of [-1, 1]) {
    grp.add(part(box(0.05, 0.115, 0.10), C(s, 'dark'), sx * 0.10, 0.14, TZ + 0.01)); // flank sub-tower
    grp.add(part(box(0.03, 0.012, 0.01), C(s, 'glass'), sx * 0.10, 0.185, TZ + 0.055)); // cyan slit
  }
  dish(grp, s, 0, 0.165, TZ - 0.115, 0.045, 0.35); // comms dish on the aft shoulder

  // ── D. BRISTLING DORSAL DRUM-TURRET ROWS + heavy fore batteries ──────────────
  for (const sx of [-1, 1]) {
    for (const z of [0.10, 0.0, -0.10, -0.20]) synFlagTurret(grp, s, sx * 0.095, 0.08, z, 0.026);
    synFlagTurret(grp, s, sx * 0.05, 0.085, 0.18, 0.038, true); // heavy fore-dorsal battery
  }
  synFlagTurret(grp, s, 0, 0.145, -0.12, 0.03); // centreline dorsal turret
  for (const z of [0.06, -0.06, -0.16]) {
    for (const sx of [-1, 1]) greeble(grp, s, 'hull2', sx * 0.045, 0.08, z, 0.028, 0.014, 0.045);
    grp.add(part(box(0.05, 0.01, 0.01), ACC(s), 0, 0.084, z + 0.03)); // cyan hazard chevron
  }
  blister(grp, s, 0, 0.084, 0.14, 0.02); // forward sensor blister

  // ── E. HEAVY SPINAL & SIDE CANNONS overhanging the blade prow ────────────────
  grp.add(part(box(0.12, 0.06, 0.10), C(s, 'dark'), 0, 0.006, 0.34)); // forward battery breech mass
  grp.add(part(box(0.14, 0.05, 0.05), C(s, 'dark'), 0, -0.004, 0.42)); // heavy gun mantlet at the prow
  grp.add(part(box(0.10, 0.012, 0.012), GLOW(s), 0, 0.04, 0.42)); // cyan targeting strip
  synFlagCannon(grp, s, 0, 0.014, 0.40, 0.34, 0.017); // central heavy spinal (muzzle ~0.74, past the prow)
  for (const bx of [-0.05, 0.05]) synFlagCannon(grp, s, bx, -0.014, 0.38, 0.30, 0.013); // flanking side cannons

  // ── F. VENTRAL HANGAR / LAUNCH-BAY RECESS with a cyan interior glow ──────────
  grp.add(part(box(0.12, 0.04, 0.16), C(s, 'dark'), 0, -0.055, -0.14)); // recessed bay mouth (belly)
  grp.add(part(box(0.085, 0.028, 0.12), C(s, 'hull2'), 0, -0.055, -0.14)); // interior back wall
  grp.add(part(box(0.075, 0.02, 0.11), GLOW(s), 0, -0.055, -0.14)); // cyan hangar interior glow
  for (const sx of [-1, 1]) grp.add(part(box(0.008, 0.03, 0.15), C(s, 'dark'), sx * 0.062, -0.055, -0.14)); // bay-door frame lips

  // ── G. DENSE REAR CYAN ENGINE BANK — 6 big thrusters + fill glows ────────────
  grp.add(part(box(0.30, 0.11, 0.04), C(s, 'dark'), 0, -0.005, -0.50)); // main engine face plate
  grp.add(part(box(0.18, 0.05, 0.04), C(s, 'dark'), 0, 0.07, -0.48)); // stepped upper engine deck
  grp.add(part(box(0.28, 0.012, 0.045), ACC(s), 0, 0.05, -0.48)); // cyan engineering band
  for (const x of [-0.10, -0.034, 0.034, 0.10]) nozzle(grp, s, x, -0.02, -0.52, 0.032, 0.05); // main row (4 big cyan bells)
  for (const x of [-0.055, 0.055]) nozzle(grp, s, x, 0.07, -0.51, 0.024, 0.045); // raised row (2 bells)
  for (const x of [-0.085, 0.0, 0.085]) engineGlow(grp, s, x, 0.03, -0.51, 0.017); // fill glows between bells

  // ── H. SLEEK SWEPT RADIATOR FINS off the stern flanks ────────────────────────
  for (const sx of [-1, 1]) {
    addRot(grp, box(0.006, 0.10, 0.16), C(s, 'dark'), sx * 0.185, 0.0, -0.36, 0, sx * 0.4, sx * 0.5); // swept fin
    radiatorPanel(grp, s, sx * 0.15, 0.05, -0.4, 0.045, 0.13); // ribbed radiator plate
    grp.add(part(box(0.006, 0.08, 0.006), GLOW(s), sx * 0.205, 0.0, -0.34)); // cyan fin trailing edge
  }

  // ── I. LIGHTS, BEACONS & RCS ─────────────────────────────────────────────────
  runningLights(grp, s, 0.13, 0.0, 0.18);
  runningLights(grp, s, 0.16, 0.0, -0.42);
  navLight(grp, s, 'star', 0.04, 0.02, 0.5, 0.012);
  navLight(grp, s, 'port', -0.04, 0.02, 0.5, 0.012);
  for (const sx of [-1, 1]) {
    rcsQuad(grp, s, sx * 0.07, 0.05, 0.28, 0.011);
    rcsQuad(grp, s, sx * 0.15, -0.05, -0.42, 0.011);
  }
  greeble(grp, s, 'hull2', 0, 0.13, -0.05, 0.05, 0.018, 0.05); // dorsal sensor spine box

  return grp;
}

// === BESPOKE STATIONS — sleek DARK criminal black-market geometry ==============
// Each builder returns a fresh group (createStation faction-colours + bakes it).

// A small sleek cyan-barrel TURRET emplacement, built firing +X (radial-outward)
// with its drum standing along -Z so once the ring is laid flat (rotation.x = +90°,
// mapping local -Z → world +Y) the turret rides the TOP face of the carousel arm.
function synTurret(s, r) {
  const t = group();
  addRot(t, cyl(r * 1.55, r * 1.75, r * 0.5, 6), C(s, 'dark'), 0, 0, 0, -Math.PI / 2); // base collar (axis -Z)
  addRot(t, cyl(r * 1.1, r * 1.1, r * 1.2, 6), C(s, 'hull2'), 0, 0, -r * 0.75, -Math.PI / 2); // rotating drum, stands up
  const gz = -r * 0.9; // bore height above the arm surface (local -Z = up once flat)
  t.add(part(box(r * 1.25, r * 1.9, r * 1.1), C(s, 'dark'), r * 0.6, 0, gz)); // gun mantlet, forward +X
  t.add(part(box(r * 0.4, r * 1.1, r * 0.4), C(s, 'glass'), -r * 0.55, 0, gz - r * 0.34)); // rear cyan targeting glass
  for (const by of [-r * 0.45, r * 0.45]) {
    addRot(t, cyl(r * 0.26, r * 0.2, r * 2.4, 6), C(s, 'dark'), r * 1.9, by, gz, 0, 0, Math.PI / 2); // barrel tube +X
    t.add(part(box(r * 0.4, r * 0.4, r * 0.4), ACC(s), r * 3.1, by, gz)); // cyan muzzle tip
  }
  return t;
}

// One sleek Syndicate DOCKING ARM of the carousel, built radially along +X (rotated
// about Z into its slot before the ring is folded flat). A sleek dark spar with cyan
// glow edge-lines, a strut truss to the hub, a recessed CYAN-LIT docking bay with
// clamp rails + cyan glass at the tip, a cyan-barrel turret on top, and a cyan tip
// beacon. Nothing reaches inside r≈0.56 so the spinning arm never touches the core.
function synDockArm(s) {
  const arm = group();

  arm.add(part(box(0.62, 0.13, 0.18), C(s, 'hull2'), 0.85, 0, 0)); // main spar
  arm.add(part(box(0.64, 0.03, 0.19), C(s, 'dark'), 0.85, 0.08, 0)); // dorsal armour cap
  arm.add(part(box(0.64, 0.03, 0.19), C(s, 'dark'), 0.85, -0.08, 0)); // ventral armour cap
  for (const sz of [-1, 1]) {
    arm.add(part(box(0.66, 0.02, 0.016), C(s, 'accent'), 0.85, 0.095, sz * 0.078)); // bright edge rail
    arm.add(part(box(0.56, 0.03, 0.006), GLOW(s), 0.85, 0, sz * 0.094)); // cyan glow line, both flanks
  }
  panelX(arm, s, 0.85, 0.062, 0.04, 0.46); // plating seam

  addRot(arm, box(0.36, 0.03, 0.03), C(s, 'dark'), 0.52, 0.075, 0.06, 0, 0, 0.42); // X-brace
  addRot(arm, box(0.36, 0.03, 0.03), C(s, 'dark'), 0.52, -0.075, 0.06, 0, 0, -0.42);
  arm.add(part(box(0.045, 0.2, 0.045), C(s, 'hull2'), 0.56, 0, 0)); // cross-tie node
  arm.add(part(box(0.028, 0.14, 0.02), GLOW(s), 0.56, 0, 0.05)); // cyan rib on the tie

  arm.add(part(box(0.3, 0.28, 0.34), C(s, 'hull2'), 1.2, 0, 0)); // bay module
  for (const sy of [-1, 1]) arm.add(part(box(0.32, 0.05, 0.36), C(s, 'dark'), 1.2, sy * 0.14, 0)); // frame lips
  for (const sz of [-1, 1]) arm.add(part(box(0.32, 0.3, 0.05), C(s, 'dark'), 1.2, 0, sz * 0.16)); // frame side walls
  arm.add(part(box(0.19, 0.2, 0.26), C(s, 'dark'), 1.26, 0, 0)); // recessed dark mouth
  arm.add(part(box(0.05, 0.17, 0.24), GLOW(s), 1.37, 0, 0)); // cyan-lit interior back wall
  arm.add(part(box(0.04, 0.13, 0.16), C(s, 'glass'), 1.31, 0.12, 0)); // cyan bay-status glass
  for (const sy of [-1, 1]) {
    arm.add(part(box(0.05, 0.05, 0.28), C(s, 'dark'), 1.29, sy * 0.12, 0)); // clamp rail
    arm.add(part(box(0.05, 0.05, 0.04), GLOW(s), 1.37, sy * 0.12, 0.11)); // cyan guide light
  }

  const t = synTurret(s, 0.105);
  t.position.set(0.7, 0, -0.09);
  arm.add(t);

  arm.add(part(sph(0.045, 6), NAV(s, 'star'), 1.42, 0, 0)); // cyan arm-tip beacon
  return arm;
}

// HOME HUB — a sleek DARK CRIMINAL black-market fortress-hub. A faceted graphite
// obelisk CORE (octagonal armour drum + chamfered dark crystal caps) girdled by an
// armour belt of CYAN slit-lights + climbing cyan glow seams, a sleek stepped
// command SPIRE crowning it (+Y) with a cyan bridge slit + a cyan beacon, sensor
// dishes + cyan domes + masts. A slow-spinning docking CAROUSEL of sleek arms lies
// FLAT and circles the spire, about +Y, never through it. Biggest of the three.
function makeSyndicateRing(s) {
  const grp = group();

  // ── Faceted graphite obelisk CORE ──
  addRot(grp, cyl(0.4, 0.4, 0.6, 8), C(s, 'hull'), 0, 0, 0, 0, Math.PI / 8, Math.PI / 2); // main octagon drum
  addRot(grp, cyl(0.46, 0.46, 0.18, 8), C(s, 'dark'), 0, 0, 0, 0, 0, Math.PI / 2); // faceted waist belt drum
  addRot(grp, cone(0.4, 0.3, 8), C(s, 'dark'), 0, 0.45, 0, 0, Math.PI / 8, 0); // top chamfer (apex +Y)
  addRot(grp, cone(0.4, 0.3, 8), C(s, 'hull'), 0, -0.45, 0, Math.PI, Math.PI / 8, 0); // bottom chamfer (apex -Y)

  addRot(grp, cyl(0.475, 0.475, 0.02, 8), GLOW(s), 0, 0.088, 0, 0, 0, Math.PI / 2); // upper cyan rim band
  addRot(grp, cyl(0.475, 0.475, 0.02, 8), GLOW(s), 0, -0.088, 0, 0, 0, Math.PI / 2); // lower cyan rim band
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const cx = Math.cos(a);
    const cz = Math.sin(a);
    addRot(grp, box(0.11, 0.09, 0.04), C(s, 'dark'), cx * 0.46, 0, cz * 0.46, 0, -a, 0); // dark slit bezel
    addRot(grp, box(0.08, 0.12, 0.03), GLOW(s), cx * 0.49, 0, cz * 0.49, 0, -a, 0); // cyan slit glow
  }

  for (let i = 0; i < 4; i++) {
    const p = (i / 4) * Math.PI * 2;
    const f = p + Math.PI / 4;
    addRot(grp, box(0.03, 0.62, 0.03), C(s, 'accent'), Math.cos(p) * 0.4, 0, Math.sin(p) * 0.4, 0, -p, 0); // point edge rail
    addRot(grp, box(0.022, 0.56, 0.016), GLOW(s), Math.cos(f) * 0.4, 0.02, Math.sin(f) * 0.4, 0, -f, 0); // cyan face seam
    greeble(grp, s, 'hull2', Math.cos(f) * 0.34, 0.19, Math.sin(f) * 0.34, 0.08, 0.05, 0.08); // shoulder armour block
  }

  grp.add(part(sph(0.09, 6), C(s, 'glass'), 0.22, 0.24, 0.16)); // cyan sensor dome (fwd-stbd)
  grp.add(part(sph(0.07, 6), C(s, 'glass'), -0.24, 0.22, -0.14)); // cyan sensor dome (aft-port)
  dish(grp, s, 0.16, 0.28, -0.26, 0.1, 0.5); // aft sensor dish
  antenna(grp, s, -0.2, 0.26, 0.2, 0.16); // comms mast
  panelX(grp, s, 0, 0.24, 0.02, 0.3);
  for (const x of [-1, 1]) navLight(grp, s, 'port', x * 0.5, 0, 0, 0.02); // red running lights

  // ── Sleek stepped command SPIRE crowning the core (+Y), coaxial with spin axis ──
  grp.add(part(box(0.16, 0.14, 0.16), C(s, 'dark'), 0, 0.62, 0)); // spire base
  addRot(grp, cyl(0.075, 0.055, 0.44, 6), C(s, 'hull2'), 0, 0.86, 0); // sleek tapered shaft
  grp.add(part(box(0.006, 0.4, 0.006), GLOW(s), 0.05, 0.86, 0.05)); // cyan glow line up the shaft
  grp.add(part(box(0.12, 0.045, 0.03), C(s, 'glass'), 0, 0.7, 0.075)); // cyan bridge slit (+Z)
  grp.add(part(box(0.11, 0.03, 0.11), C(s, 'dark'), 0, 1.06, 0)); // armour cap ring
  for (const sx of [-1, 1]) antenna(grp, s, sx * 0.07, 0.74, -0.02, 0.12); // flank sensor masts
  grp.add(part(box(0.025, 0.14, 0.025), C(s, 'accent'), 0, 1.14, 0)); // beacon mast
  grp.add(part(sph(0.055, 6), NAV(s, 'top'), 0, 1.24, 0)); // white-cyan command beacon halo
  grp.add(part(sph(0.03, 6), GLOW(s), 0, 1.24, 0)); // hot cyan core

  // ── Spinning docking CAROUSEL (about +Y) ──
  const ring = group();
  const RF = 1.24;
  for (let i = 0; i < 8; i++) {
    const am = ((i + 0.5) / 8) * Math.PI * 2;
    const rr = RF * Math.cos(Math.PI / 8);
    const seg = 2 * RF * Math.sin(Math.PI / 8);
    addRot(ring, box(seg, 0.13, 0.17), C(s, 'dark'), Math.cos(am) * rr, Math.sin(am) * rr, 0, 0, 0, am + Math.PI / 2); // frame bar
    addRot(ring, box(seg * 0.98, 0.02, 0.02), C(s, 'accent'), Math.cos(am) * (rr + 0.075), Math.sin(am) * (rr + 0.075), 0, 0, 0, am + Math.PI / 2); // outer edge rail
    addRot(ring, box(seg * 0.96, 0.045, 0.045), GLOW(s), Math.cos(am) * (rr + 0.02), Math.sin(am) * (rr + 0.02), 0, 0, 0, am + Math.PI / 2); // cyan running line
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ring.add(part(sph(0.04, 6), NAV(s, 'star'), Math.cos(a) * RF, Math.sin(a) * RF, 0)); // cyan beacon nodes
  }
  for (let i = 0; i < 4; i++) {
    const arm = synDockArm(s);
    arm.rotation.z = (i / 4) * Math.PI * 2;
    ring.add(arm);
  }
  // Lay the carousel FLAT so it spins as a HORIZONTAL carousel about +Y, circling
  // the spire, not through it. bake() folds this tilt in; the system view then
  // rotates it about Y (spinAxis).
  ring.rotation.x = Math.PI / 2;
  grp.add(ring);
  grp.userData.spin = ring; // rotated per frame by the system view
  grp.userData.spinAxis = 'y'; // horizontal carousel (default 'z' = vertical wheel)

  return grp;
}

// One sleek Syndicate defence BLISTER-TURRET, gun aiming +Z (local): a dark base
// collar + a graphite blister dome + a short cyan-charged gun stub (the waystation's
// teeth). Wrapped in a group so the caller yaws it to aim outward.
function synOutTurret(s, r) {
  const t = group();
  t.add(part(cyl(r * 1.4, r * 1.7, r * 0.45, 6), C(s, 'dark'), 0, 0, 0)); // dark base collar
  t.add(part(cyl(r * 1.15, r * 1.15, r * 0.28, 6), ACC(s), 0, r * 0.24, 0)); // bright cyan ring
  t.add(part(sph(r, 6), C(s, 'hull2'), 0, r * 0.42, 0)); // graphite blister drum
  const gy = r * 0.5;
  const bl = r * 3.0;
  const EL = 0.42;
  const ca = Math.cos(EL), sa = Math.sin(EL);
  addRot(t, cyl(r * 0.28, r * 0.2, bl, 6), C(s, 'dark'), 0, gy + (bl / 2) * sa, r + (bl / 2) * ca, Math.PI / 2 - EL); // barrel
  t.add(part(box(r * 0.36, r * 0.36, r * 0.16), ACC(s), 0, gy + bl * sa, r + bl * ca)); // cyan muzzle tip
  t.add(part(box(r * 0.24, r * 0.24, r * 0.24), GLOW(s), 0, gy + (bl + 0.02) * sa, r + (bl + 0.02) * ca)); // cyan charge pip
  return t;
}

// One sleek Syndicate DOCKING ARM along ±X (sx = ±1): a tapered graphite boom with
// a cyan glow-line, ending in a lit docking collar (dark throat + cyan-glass port +
// cyan guide ring + berthing latches) and an outboard nav beacon.
function synOutDock(grp, s, sx) {
  const cx = sx * 0.46;
  addRot(grp, cyl(0.045, 0.03, 0.34, 8), C(s, 'hull'), cx, 0, 0, 0, 0, Math.PI / 2); // tapering boom
  grp.add(part(box(0.32, 0.03, 0.055), C(s, 'dark'), cx, -0.024, 0)); // dark underside keel
  grp.add(part(box(0.3, 0.006, 0.01), GLOW(s), cx, 0.028, 0)); // cyan glow-line
  grp.add(part(box(0.3, 0.008, 0.012), C(s, 'accent'), cx, 0.012, 0.03)); // structural rail
  panelX(grp, s, cx, -0.006, -0.028, 0.28);

  const px = sx * 0.66;
  addRot(grp, cyl(0.1, 0.11, 0.09, 8), C(s, 'hull2'), px, 0, 0, 0, 0, Math.PI / 2); // collar ring
  addRot(grp, cyl(0.07, 0.07, 0.11, 8), C(s, 'dark'), px + sx * 0.01, 0, 0, 0, 0, Math.PI / 2); // recessed dock throat
  addRot(grp, cyl(0.062, 0.052, 0.035, 8), C(s, 'glass'), px + sx * 0.045, 0, 0, 0, 0, Math.PI / 2); // cyan-glass lit port
  addRot(grp, cyl(0.055, 0.055, 0.02, 8), GLOW(s), px + sx * 0.058, 0, 0, 0, 0, Math.PI / 2); // hot port glow
  addRot(grp, cyl(0.125, 0.125, 0.012, 8), ACC(s), px + sx * 0.05, 0, 0, 0, 0, Math.PI / 2); // cyan guide ring
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    grp.add(part(box(0.03, 0.03, 0.03), C(s, 'dark'), px, Math.cos(a) * 0.1, Math.sin(a) * 0.1)); // berthing latch
  }
  navLight(grp, s, sx < 0 ? 'port' : 'star', px + sx * 0.04, 0.06, 0.06, 0.016); // dock guide beacon
}

// COLONY OUTPOST — a Syndicate criminal LISTENING POST / smuggler waystation. A
// sleek dark FACETED graphite pod (layered octagonal plating, cyan glow seams, a
// glaring cyan-glass sensor eye at +Z), an armoured collar with a cyan light-band,
// two lit docking arms at ±X, four cyan-barrel turrets on the diagonals, a rear
// sensor shelf (dish + masts), a ventral scanner, and a mast with a cyan beacon.
function makeSyndicateOutpost(s) {
  const grp = group();
  const P = Math.PI / 8;

  addRot(grp, cyl(0.3, 0.3, 0.13, 8), C(s, 'hull'), 0, 0, 0, 0, P, 0); // equator waist drum
  addRot(grp, cyl(0.3, 0.2, 0.1, 8), C(s, 'hull2'), 0, 0.11, 0, 0, P, 0); // upper chamfer
  addRot(grp, cone(0.2, 0.24, 8), C(s, 'hull2'), 0, 0.28, 0, 0, P, 0); // faceted upper cap cone
  addRot(grp, cyl(0.3, 0.22, 0.1, 8), C(s, 'dark'), 0, -0.11, 0, 0, P, 0); // lower chamfer
  addRot(grp, cone(0.22, 0.26, 8), C(s, 'dark'), 0, -0.29, 0, Math.PI, P, 0); // faceted lower cap cone

  addRot(grp, cyl(0.35, 0.35, 0.055, 8), C(s, 'dark'), 0, -0.005, 0, 0, P, 0); // dark belt
  addRot(grp, cyl(0.335, 0.345, 0.028, 8), C(s, 'hull2'), 0, 0.03, 0, 0, P, 0); // lighter stepped lip

  for (let i = 0; i < 8; i++) {
    const e = P + (i / 8) * Math.PI * 2;
    addRot(grp, box(0.026, 0.34, 0.04), C(s, 'accent'), Math.cos(e) * 0.29, 0, Math.sin(e) * 0.29, 0, Math.PI / 2 - e, 0); // facet-edge rib
  }
  for (const a of [P, P + Math.PI / 2, P + Math.PI, P + (3 * Math.PI) / 2]) {
    grp.add(part(box(0.008, 0.3, 0.008), GLOW(s), Math.cos(a) * 0.3, 0.02, Math.sin(a) * 0.3)); // drum seam
    addRot(grp, box(0.006, 0.2, 0.006), GLOW(s), Math.cos(a) * 0.2, -0.22, Math.sin(a) * 0.2, 0, Math.PI / 2 - a, -0.5); // lower-cone seam
  }
  for (let i = 0; i < 8; i++) {
    const b = P + (i / 8) * Math.PI * 2;
    addRot(grp, box(0.05, 0.05, 0.014), GLOW(s), Math.cos(b) * 0.36, 0.0, Math.sin(b) * 0.36, 0, Math.PI / 2 - b, 0); // collar slit-light
  }

  addRot(grp, cyl(0.1, 0.12, 0.08, 8), C(s, 'dark'), 0, 0.02, 0.28, Math.PI / 2); // dark eye socket
  addRot(grp, cyl(0.115, 0.115, 0.016, 8), ACC(s), 0, 0.02, 0.33, Math.PI / 2); // cyan bezel ring
  grp.add(part(sph(0.078, 8), C(s, 'glass'), 0, 0.02, 0.33)); // cyan-glass eye lens
  const glare = part(sph(0.05, 6), GLOW(s), 0, 0.02, 0.37);
  glare.scale.z = 1.6;
  grp.add(glare); // hot cyan glare forward

  for (const sx of [-1, 1]) synOutDock(grp, s, sx);

  for (const th of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    const t = synOutTurret(s, 0.058);
    const R = 0.3;
    t.rotation.y = th;
    t.position.set(Math.sin(th) * R, 0.055, Math.cos(th) * R);
    grp.add(t);
  }

  grp.add(part(box(0.26, 0.09, 0.11), C(s, 'dark'), 0, 0.0, -0.34)); // rear sensor shelf
  grp.add(part(box(0.24, 0.008, 0.014), ACC(s), 0, 0.05, -0.3)); // cyan lip strip
  dish(grp, s, -0.075, 0.03, -0.37, 0.06, -0.5); // canted comms dish
  antenna(grp, s, 0.07, 0.03, -0.36, 0.16); // tall comms mast
  antenna(grp, s, 0.12, 0.02, -0.31, 0.1); // short comms mast
  greeble(grp, s, 'hull2', -0.02, 0.055, -0.3, 0.05, 0.03, 0.04); // avionics box

  grp.add(part(box(0.04, 0.12, 0.04), C(s, 'dark'), 0, -0.44, 0)); // ventral scanner stalk
  grp.add(part(sph(0.075, 6), C(s, 'glass'), 0, -0.53, 0)); // cyan-glass ventral scanner
  grp.add(part(box(0.02, 0.02, 0.02), GLOW(s), 0, -0.6, 0)); // scanner glow tip

  addRot(grp, cyl(0.022, 0.008, 0.42, 6), C(s, 'hull2'), 0, 0.58, 0); // tapered mast
  grp.add(part(box(0.008, 0.4, 0.008), GLOW(s), 0, 0.58, 0.016)); // cyan glow up the mast
  grp.add(part(sph(0.05, 6), C(s, 'glass'), 0, 0.82, 0)); // crystalline beacon housing
  navLight(grp, s, 'star', 0, 0.86, 0, 0.03); // cyan command beacon

  panelZ(grp, s, 0.13, 0.07, 0, 0.18);
  panelZ(grp, s, -0.13, 0.07, 0, 0.18);
  panelX(grp, s, 0, 0.07, 0.13, 0.18);
  runningLights(grp, s, 0.24, 0.05, 0.2);
  for (const sx of [-1, 1]) rcsQuad(grp, s, sx * 0.2, -0.14, 0.18, 0.012);

  return grp;
}

// One sleek Syndicate SCOOP-ARM reaching DOWN (-Y) and inward under the intake
// mouth. Built radially (every segment shares ry=-a); growing rx hooks each lower
// segment steeper so the arm reads as an articulated clamp with a cyan scoop-tip.
function synScoopArm(grp, s, a) {
  const dx = Math.cos(a);
  const dz = Math.sin(a);
  const at = (geo, m, rr, yy, rx = 0) => addRot(grp, geo, m, dx * rr, yy, dz * rr, rx, -a, 0);

  at(box(0.11, 0.085, 0.12), C(s, 'hull2'), 0.26, 0.03); // shoulder yoke
  at(box(0.135, 0.036, 0.05), C(s, 'dark'), 0.26, 0.03); // hinge pin
  at(box(0.075, 0.08, 0.04), C(s, 'dark'), 0.185, 0.02); // brace back to the hull
  at(box(0.07, 0.24, 0.085), C(s, 'dark'), 0.29, -0.12, 0.2); // upper arm blade
  at(box(0.045, 0.18, 0.055), C(s, 'hull2'), 0.31, -0.115, 0.2); // proud plating
  at(box(0.018, 0.2, 0.014), GLOW(s), 0.335, -0.12, 0.2); // glowing cyan trench
  at(box(0.058, 0.22, 0.068), C(s, 'dark'), 0.185, -0.32, -0.34); // forearm blade (hooks inward)
  at(box(0.04, 0.15, 0.045), C(s, 'hull2'), 0.165, -0.315, -0.34); // proud plating
  at(box(0.014, 0.17, 0.012), GLOW(s), 0.135, -0.32, -0.34); // inner cyan trench
  addRot(grp, cone(0.044, 0.12, 6), C(s, 'dark'), dx * 0.12, -0.45, dz * 0.12, 2.7, -a, 0); // scoop tip spike
  grp.add(part(sph(0.032, 6), GLOW(s), dx * 0.108, -0.48, dz * 0.108)); // scoop-tip glow
}

// GAS-GIANT SKIMMER — a sleek DARK CRIMINAL Syndicate gas-scoop. A faceted graphite
// TOP BODY (up +Y) — layered plating + glowing CYAN seam-belts, four banded storage
// tanks, pump housings, a cyan-glass command dome + masts — feeds a central intake
// THROAT flaring DOWN (-Y) to a glowing CYAN mouth ringed by canted intake vanes and
// clamped by FOUR articulated scoop-arms with cyan tips. UP = +Y, scoop reaches -Y.
function makeSyndicateCollector(s) {
  const grp = group();

  // ── A. SLEEK FACETED TOP BODY ──
  grp.add(part(cyl(0.34, 0.38, 0.18, 8), C(s, 'hull'), 0, 0.42, 0)); // main faceted drum
  grp.add(part(cyl(0.3, 0.22, 0.14, 8), C(s, 'hull2'), 0, 0.58, 0)); // up-tapered crown deck
  grp.add(part(cyl(0.39, 0.39, 0.035, 8), C(s, 'dark'), 0, 0.42, 0)); // dark equator belt
  grp.add(part(cyl(0.4, 0.4, 0.012, 8), GLOW(s), 0, 0.4, 0)); // glowing cyan light-band
  grp.add(part(cyl(0.2, 0.16, 0.03, 8), C(s, 'dark'), 0, 0.66, 0)); // upper deck plate
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    addRot(grp, box(0.014, 0.18, 0.012), C(s, 'dark'), Math.cos(a) * 0.375, 0.42, Math.sin(a) * 0.375, 0, -a, 0); // facet seam-strip
    if (i % 2) addRot(grp, box(0.01, 0.15, 0.016), GLOW(s), Math.cos(a) * 0.382, 0.42, Math.sin(a) * 0.382, 0, -a, 0); // cyan seam
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    addRot(grp, box(0.016, 0.1, 0.16), C(s, 'hull2'), Math.cos(a) * 0.28, 0.56, Math.sin(a) * 0.28, 0, -a, 0.5); // crown chamfer panel
  }
  grp.add(part(cyl(0.26, 0.26, 0.06, 8), C(s, 'dark'), 0, 0.05, 0)); // shoulder mount ring
  grp.add(part(cyl(0.265, 0.265, 0.016, 8), GLOW(s), 0, 0.016, 0)); // cyan rim on the mount ring
  grp.add(part(cyl(0.11, 0.116, 0.03, 10), C(s, 'dark'), 0, 0.66, 0)); // dome rim collar
  grp.add(part(sph(0.09, 8), C(s, 'glass'), 0, 0.68, 0)); // cyan-glass command dome
  grp.add(part(box(0.14, 0.026, 0.014), C(s, 'glass'), 0, 0.6, 0.2)); // forward bridge slit
  panelX(grp, s, 0, 0.686, 0.08, 0.24);
  panelX(grp, s, 0, 0.686, -0.08, 0.24);

  // ── B. STORAGE TANKS ──
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const tx = Math.cos(a) * 0.4;
    const tz = Math.sin(a) * 0.4;
    grp.add(part(cyl(0.076, 0.076, 0.3, 8), C(s, 'dark'), tx, 0.48, tz)); // tank body
    grp.add(part(cyl(0.082, 0.082, 0.018, 8), GLOW(s), tx, 0.55, tz)); // glowing cyan hazard band
    grp.add(part(cyl(0.081, 0.081, 0.024, 8), C(s, 'hull2'), tx, 0.44, tz)); // lower band
    addRot(grp, cone(0.062, 0.05, 8), C(s, 'hull2'), tx, 0.65, tz, Math.PI); // domed head
    grp.add(part(box(0.03, 0.04, 0.03), ACC(s), tx, 0.69, tz)); // cyan filler stub
    addRot(grp, cyl(0.015, 0.015, 0.2, 6), C(s, 'dark'), tx * 0.66, 0.4, tz * 0.66, 0, -a, Math.PI / 2); // feed pipe
  }

  // ── C. PUMP HOUSINGS & PIPEWORK ──
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const px = Math.cos(a);
    const pz = Math.sin(a);
    greeble(grp, s, 'dark', px * 0.32, 0.38, pz * 0.32, 0.08, 0.09, 0.08); // pump housing
    greeble(grp, s, 'hull2', px * 0.32, 0.45, pz * 0.32, 0.045, 0.05, 0.045); // valve stack
    grp.add(part(box(0.03, 0.02, 0.03), GLOW(s), px * 0.32, 0.49, pz * 0.32)); // cyan valve pip
    addRot(grp, cyl(0.013, 0.013, 0.14, 6), C(s, 'hull2'), px * 0.34, 0.32, pz * 0.34, 0, -a, 0); // pipe run
  }

  // ── D. CENTRAL INTAKE THROAT + glowing CYAN mouth ──
  grp.add(part(cyl(0.17, 0.2, 0.3, 8), C(s, 'hull'), 0, 0.16, 0)); // throat stack
  grp.add(part(cyl(0.22, 0.22, 0.045, 8), C(s, 'dark'), 0, 0.3, 0)); // upper throat collar
  grp.add(part(cyl(0.185, 0.185, 0.016, 8), GLOW(s), 0, 0.2, 0)); // cyan throat ring
  grp.add(part(cyl(0.16, 0.16, 0.014, 8), GLOW(s), 0, 0.02, 0)); // cyan gullet ring
  grp.add(part(cyl(0.15, 0.27, 0.2, 10), C(s, 'dark'), 0, -0.09, 0)); // funnel flaring OUT to the mouth
  grp.add(part(cyl(0.28, 0.28, 0.022, 10), C(s, 'hull2'), 0, -0.195, 0)); // mouth rim ring
  grp.add(part(cyl(0.255, 0.255, 0.018, 10), GLOW(s), 0, -0.185, 0)); // glowing cyan mouth ring
  grp.add(part(cyl(0.2, 0.2, 0.014, 10), GLOW(s), 0, -0.178, 0)); // inner cyan mouth disc
  grp.add(part(sph(0.15, 6), GLOW(s), 0, -0.05, 0)); // hot cyan intake core
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    addRot(grp, box(0.03, 0.15, 0.055), C(s, 'dark'), Math.cos(a) * 0.24, -0.07, Math.sin(a) * 0.24, 0, -a, 0.42); // intake vane
    addRot(grp, box(0.012, 0.13, 0.02), GLOW(s), Math.cos(a) * 0.25, -0.07, Math.sin(a) * 0.25, 0, -a, 0.42); // cyan vane rib
  }

  // ── E. FOUR ARTICULATED SCOOP-ARMS ──
  for (let i = 0; i < 4; i++) synScoopArm(grp, s, (i / 4) * Math.PI * 2 + Math.PI / 4);

  // ── F. RADIATOR FINS ──
  for (const sx of [-1, 1]) {
    greeble(grp, s, 'hull2', sx * 0.36, 0.4, 0, 0.05, 0.05, 0.06); // fin root
    addRot(grp, box(0.006, 0.15, 0.24), C(s, 'dark'), sx * 0.48, 0.4, 0, 0, 0, sx * 0.5); // swept radiator fin
    addRot(grp, box(0.008, 0.04, 0.19), ACC(s), sx * 0.5, 0.4, 0, 0, 0, sx * 0.5); // cyan rib
  }

  // ── G. SENSOR MASTS, DISH + top CYAN command beacon ──
  antenna(grp, s, 0.13, 0.68, 0.05, 0.13);
  antenna(grp, s, -0.13, 0.68, 0.05, 0.13);
  dish(grp, s, 0.0, 0.69, -0.13, 0.08, 0.45);
  grp.add(part(box(0.022, 0.28, 0.022), C(s, 'accent'), 0, 0.82, 0)); // command spire
  grp.add(part(sph(0.04, 6), NAV(s, 'star'), 0, 0.96, 0)); // cyan command beacon core
  grp.add(part(sph(0.06, 6), GLOW(s), 0, 0.96, 0)); // beacon halo

  // ── H. RUNNING + NAV LIGHTS ──
  runningLights(grp, s, 0.41, 0.38, 0);
  navLight(grp, s, 'star', 0, 0.38, 0.41, 0.016);
  rcsQuad(grp, s, 0.3, 0.32, 0.3, 0.012);
  rcsQuad(grp, s, -0.3, 0.32, -0.3, 0.012);

  return grp;
}

export const FACTION = {
  id: 'syndicate',
  name: 'Синдикат',
  colors: { hull: 0x2b3039, hull2: 0x3c4453, accent: 0x525d70, dark: 0x121620, glass: 0x44e4ff, gold: 0xbfe8f0 },
  accent: 0x00d4ff,
  glow: 0x46ecff,
  nav: { port: 0xff4060, star: 0x49ffd0, top: 0xffffff },
  lore: 'Гладкий преступный синдикат: тёмные графитовые корпуса, хищные силуэты и холодное циановое свечение контрабандного хайтека.',
  roles: {
    scout: makeSyndicateScout,
    fighter: makeSyndicateFighter,
    interceptor: makeSyndicateInterceptor,
    gunship: makeSyndicateGunship,
    corvette: makeSyndicateCorvette,
    freighter: makeSyndicateFreighter,
    tanker: makeSyndicateTanker,
    liner: makeSyndicateLiner,
    flagship: makeSyndicateFlagship,
  },
  stations: { ring: makeSyndicateRing, outpost: makeSyndicateOutpost, collector: makeSyndicateCollector },
};
