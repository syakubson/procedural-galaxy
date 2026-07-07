// Faction style-kit: PRECURSORS (ancient). A sacred, mysterious fleet —
// gold-and-bronze hulls etched with glowing rune-bands and ringed by FLOATING
// geometric shards held aloft in light. Consumed by every role builder in
// roles.js (the silhouette stays shared; this kit restyles its palette + adds a
// luminous `flourish`), plus a bespoke flagship hull and a station signature.
// Schema matches the authored Alliance exemplar in factions.js.

import { group, C, ACC, GLOW, NAV, box, cyl, sph, cone, wedge, part, addRot, engineGlow, navLight, runningLights } from './style.js';

// === BESPOKE FLEET — 8 sacred gold-geometry hulls =============================
// Smooth gold-bronze monoliths/obelisks/diamonds etched with glowing rune-bands,
// escorted by floating shards held by light, luminous prow NODES instead of
// cockpits, engines of pure gold light. Symmetric, serene, ancient. No shared
// flourish — each hull carries its own runes + shards.

// SCOUT — a small sacred surveyor: a smooth faceted gold DART (two low-poly cones
// base-to-base), glowing rune-bands, a luminous sensor NODE at the prow, ONE
// floating shard held by a light-tether, a soft gold engine-glow. Unarmed. NOSE = +Z.
function makePrecursorScout(s) {
  const grp = group();

  addRot(grp, cone(0.044, 0.165, 6), C(s, 'hull2'), 0, 0, 0.05, Math.PI / 2); // long prow blade -> +Z
  addRot(grp, cone(0.044, 0.1, 6), C(s, 'hull'), 0, 0, -0.068, -Math.PI / 2); // short tail cone -> -Z
  addRot(grp, box(0.026, 0.026, 0.18, 1, 1, 1), C(s, 'hull2'), 0, 0.03, -0.008, 0, 0, Math.PI / 4); // diamond keel ridge

  addRot(grp, cyl(0.048, 0.048, 0.012, 6), GLOW(s), 0, 0, -0.022, Math.PI / 2); // waist rune ring
  addRot(grp, cyl(0.035, 0.035, 0.009, 6), GLOW(s), 0, 0, 0.045, Math.PI / 2); // forward rune band
  grp.add(part(box(0.005, 0.004, 0.175), GLOW(s), 0, 0.052, -0.008)); // dorsal spine rune
  for (const x of [-1, 1]) {
    grp.add(part(box(0.004, 0.004, 0.022), GLOW(s), x * 0.041, 0.004, 0.008)); // flank rune tick (fwd)
    grp.add(part(box(0.004, 0.004, 0.02), GLOW(s), x * 0.037, 0.004, -0.052)); // flank rune tick (aft)
  }

  grp.add(part(cyl(0.028, 0.02, 0.01, 8), C(s, 'accent'), 0, 0, 0.112)); // gold prow collar
  grp.add(part(sph(0.029, 16), GLOW(s), 0, 0, 0.132)); // glowing eye node (the face)

  const shy = 0.095, shz = 0.012; // floating shard held by light
  grp.add(part(box(0.003, 0.05, 0.003), GLOW(s), 0, 0.065, shz)); // light-tether beam
  grp.add(part(cone(0.018, 0.056, 4), ACC(s), 0, shy + 0.018, shz)); // upper obelisk
  addRot(grp, cone(0.018, 0.03, 4), ACC(s), 0, shy - 0.011, shz, Math.PI, 0, 0); // lower point
  grp.add(part(sph(0.012, 12), GLOW(s), 0, shy + 0.05, shz)); // glowing shard tip node

  grp.add(part(cyl(0.03, 0.02, 0.008, 8), C(s, 'accent'), 0, 0, -0.118)); // gold tail collar
  engineGlow(grp, s, 0, 0, -0.132, 0.024); // soft gold plume
  grp.add(part(sph(0.015, 10), GLOW(s), 0, 0, -0.124)); // bright inner core

  return grp;
}

// FIGHTER — a sacred WARDEN: a smooth flattened gold diamond arrowhead, glowing
// runes, a luminous prow NODE, TWO floating obelisk SHARD-WINGS held by light off
// each flank, a forward trident of RUNE-LANCES (light beams past the nose), a soft
// gold engine-glow. Serene, symmetric. NOSE = +Z.
function makePrecursorFighter(s) {
  const grp = group();

  const hull = group();
  addRot(hull, cone(0.062, 0.17, 4), C(s, 'hull'), 0, 0, 0.085, Math.PI / 2, 0, 0); // forward arrowhead
  addRot(hull, cyl(0.062, 0.03, 0.135, 4), C(s, 'hull2'), 0, 0, -0.0675, Math.PI / 2, 0, 0); // rear taper
  hull.scale.y = 0.55; // flatten into a blade
  grp.add(hull);

  grp.add(part(box(0.006, 0.004, 0.20), GLOW(s), 0, 0.037, -0.01)); // dorsal spine rune
  grp.add(part(box(0.006, 0.004, 0.18), GLOW(s), 0, -0.037, -0.01)); // ventral keel rune
  grp.add(part(box(0.004, 0.006, 0.17), GLOW(s), 0.06, 0, -0.01)); // starboard chine rune
  grp.add(part(box(0.004, 0.006, 0.17), GLOW(s), -0.06, 0, -0.01)); // port chine rune
  for (const z of [0.045, -0.02, -0.085]) {
    const w = 0.088 - Math.abs(z) * 0.25;
    grp.add(part(box(w, 0.004, 0.005), GLOW(s), 0, 0.03, z)); // cross-band rune ring
  }

  grp.add(part(sph(0.022, 10), GLOW(s), 0, 0.008, 0.135)); // prow node halo
  grp.add(part(sph(0.013, 10), NAV(s, 'top'), 0, 0.008, 0.135)); // hot core
  grp.add(part(cone(0.012, 0.042, 4), GLOW(s), 0, 0.058, 0.1)); // crown shard
  navLight(grp, s, 'top', 0, 0.088, 0.1, 0.007);

  for (const x of [-0.034, 0.034]) {
    addRot(grp, cyl(0.0016, 0.006, 0.16, 6), ACC(s), x, 0, 0.14, Math.PI / 2, 0, 0); // rune-lance prong
    grp.add(part(box(0.004, 0.004, 0.22), GLOW(s), x, 0, 0.14)); // light-beam sheath
    grp.add(part(sph(0.011, 8), GLOW(s), x, 0, 0.24)); // lance tip
  }
  grp.add(part(box(0.004, 0.004, 0.11), GLOW(s), 0, 0.008, 0.2)); // central beam
  grp.add(part(sph(0.01, 8), GLOW(s), 0, 0.008, 0.255)); // central lance tip

  for (const side of [-1, 1]) {
    const sh = group();
    addRot(sh, cone(0.027, 0.1, 4), C(s, 'accent'), 0, 0.05, 0); // upper half
    addRot(sh, cone(0.027, 0.1, 4), C(s, 'accent'), 0, -0.05, 0, Math.PI, 0, 0); // lower half
    sh.add(part(box(0.0045, 0.16, 0.0045), GLOW(s), 0, 0, 0)); // glowing rune core
    sh.add(part(sph(0.007, 6), GLOW(s), 0, 0.103, 0)); // lit upper point
    sh.add(part(sph(0.007, 6), GLOW(s), 0, -0.103, 0)); // lit lower point
    sh.position.set(side * 0.155, 0, -0.015);
    sh.rotation.set(-0.12, 0, side * -0.42); // rake back + cant outward
    grp.add(sh);
    grp.add(part(box(0.085, 0.0035, 0.0035), GLOW(s), side * 0.105, 0, -0.015)); // light-tether
    grp.add(part(sph(0.008, 6), GLOW(s), side * 0.06, 0, -0.015)); // hull anchor rune
  }

  engineGlow(grp, s, 0, 0, -0.155, 0.027); // soft gold plume
  grp.add(part(box(0.05, 0.004, 0.004), GLOW(s), 0, 0, -0.135)); // tail rune sigil
  grp.add(part(box(0.004, 0.04, 0.004), GLOW(s), 0, 0, -0.135));

  return grp;
}

// A slender needle-DIAMOND along Z: two 4-sided pyramids base-to-base. `hf` =
// forward length, `hb` = rear length; bases meet in one crisp diamond girth at z.
function needle(grp, m, x, y, z, r, hf, hb) {
  addRot(grp, cone(r, hf, 4), m, x, y, z + hf / 2, Math.PI / 2); // nose pyramid
  addRot(grp, cone(r, hb, 4), m, x, y, z - hb / 2, -Math.PI / 2); // tail pyramid
}

// INTERCEPTOR — a swift sacred hunter: a NARROW gold needle-diamond (thinner than
// the fighter), swept floating SHARD-blades held by light, a trident of LONG
// forward rune-lances, a luminous prow node, an OVERSIZED gold engine-light. NOSE = +Z.
function makePrecursorInterceptor(s) {
  const grp = group();

  needle(grp, C(s, 'hull2'), 0, 0, 0, 0.032, 0.225, 0.1); // main needle
  needle(grp, C(s, 'hull'), 0, -0.008, -0.005, 0.02, 0.14, 0.08); // ventral keel diamond
  needle(grp, C(s, 'accent'), 0, 0.005, 0.004, 0.011, 0.245, 0.045); // bright accent spine

  grp.add(part(sph(0.016, 10), GLOW(s), 0, 0.002, 0.235)); // prow node

  addRot(grp, cone(0.013, 0.2, 4), GLOW(s), 0, 0.004, 0.285, Math.PI / 2); // central lance
  for (const x of [-0.026, 0.026]) addRot(grp, cone(0.009, 0.16, 4), GLOW(s), x, 0, 0.255, Math.PI / 2); // flank lances
  grp.add(part(sph(0.011, 6), GLOW(s), 0, 0.004, 0.385)); // central tip-node
  for (const x of [-0.026, 0.026]) grp.add(part(sph(0.008, 6), GLOW(s), x, 0, 0.335)); // flank tip-nodes

  for (const sgn of [-1, 1]) {
    addRot(grp, box(0.07, 0.004, 0.004), GLOW(s), sgn * 0.058, 0, -0.02, 0, sgn * -0.6, 0); // light-tether
    addRot(grp, cone(0.02, 0.14, 4), C(s, 'accent'), sgn * 0.105, 0.004, -0.05, 0, sgn * 0.55, sgn * -Math.PI / 2); // shard-blade
    grp.add(part(sph(0.012, 8), GLOW(s), sgn * 0.162, 0.006, -0.082)); // blade tip node
    navLight(grp, s, sgn > 0 ? 'star' : 'port', sgn * 0.165, 0.006, -0.085, 0.008);
  }

  grp.add(part(box(0.004, 0.004, 0.16), GLOW(s), 0, 0.026, -0.005)); // dorsal spine rune
  grp.add(part(box(0.05, 0.004, 0.005), GLOW(s), 0, 0.024, 0.02)); // forward cross-band
  grp.add(part(box(0.035, 0.004, 0.005), GLOW(s), 0, 0.02, -0.055)); // aft cross-band
  for (const x of [-0.024, 0.024]) grp.add(part(box(0.004, 0.02, 0.004), GLOW(s), x, 0, 0.0)); // flank ticks
  grp.add(part(sph(0.007, 6), GLOW(s), 0, 0.028, 0.02));
  grp.add(part(sph(0.006, 6), GLOW(s), 0, 0.022, -0.055));

  addRot(grp, cyl(0.046, 0.046, 0.006, 12), GLOW(s), 0, 0, -0.09, Math.PI / 2); // engine halo-ring
  grp.add(part(sph(0.024, 8), GLOW(s), 0, 0, -0.1)); // engine core node
  engineGlow(grp, s, 0, 0, -0.13, 0.044); // oversized gold plume
  for (const x of [-0.026, 0.026]) grp.add(part(sph(0.009, 6), GLOW(s), x, 0, -0.095)); // twin flank sparks

  navLight(grp, s, 'top', 0, 0.046, -0.02, 0.01);
  runningLights(grp, s, 0.026, 0.018, 0.11);

  return grp;
}

// A floating obelisk SHARD held by light (gunship "battery"): a bronze bipyramid
// with a glowing rune-core + spine, tethered to a hull anchor (ax,ay) by a GLOW bar.
function preGunShard(grp, s, x, y, z, r, len, ax, ay) {
  addRot(grp, cone(r, len, 4), C(s, 'hull2'), x, y + len * 0.5, z, 0, 0, 0); // upper point
  addRot(grp, cone(r, len, 4), C(s, 'hull'), x, y - len * 0.5, z, Math.PI, 0, 0); // lower point
  grp.add(part(sph(r * 0.82, 8), GLOW(s), x, y, z)); // glowing rune-core
  grp.add(part(box(r * 0.32, len * 1.7, r * 0.32), GLOW(s), x, y, z)); // rune down its spine
  const dx = x - ax, dy = y - ay, d = Math.hypot(dx, dy);
  addRot(grp, box(d, 0.004, 0.004), GLOW(s), (x + ax) / 2, (y + ay) / 2, z, 0, 0, Math.atan2(dy, dx)); // light-tether
}

// GUNSHIP — a sacred BASTION: a thick octahedral gold-bronze monolith, densely
// runed, with a prow rune-CANNON (a charged shard-ORB projecting a forward light-
// beam) and six floating obelisk shard-batteries held by light. Strong gold engine-
// light aft. Slow, radiant, symmetric. NOSE = +Z.
function makePrecursorGunship(s) {
  const grp = group();

  grp.add(part(box(0.13, 0.14, 0.28), C(s, 'hull'), 0, 0, 0)); // inner mass
  addRot(grp, box(0.15, 0.15, 0.29), C(s, 'hull2'), 0, 0, 0, 0, 0, Math.PI / 4); // canted diamond shell
  grp.add(part(box(0.036, 0.19, 0.22), C(s, 'hull'), 0, 0, -0.01)); // dorsal/ventral crest
  addRot(grp, cone(0.1, 0.11, 4), C(s, 'hull2'), 0, 0, 0.14, Math.PI / 2, 0, Math.PI / 4); // prow
  addRot(grp, cone(0.09, 0.12, 4), C(s, 'hull'), 0, 0, -0.15, -Math.PI / 2, 0, Math.PI / 4); // stern

  for (const ex of [-1, 1]) for (const ey of [-1, 1]) grp.add(part(box(0.006, 0.006, 0.26), GLOW(s), ex * 0.072, ey * 0.072, -0.005)); // edge-runes
  grp.add(part(box(0.008, 0.008, 0.24), GLOW(s), 0, 0.096, -0.01)); // dorsal spine rune
  grp.add(part(box(0.008, 0.008, 0.24), GLOW(s), 0, -0.096, -0.01)); // ventral spine rune
  grp.add(part(box(0.006, 0.16, 0.006), GLOW(s), 0.098, 0, -0.01)); // flank rune
  grp.add(part(box(0.006, 0.16, 0.006), GLOW(s), -0.098, 0, -0.01));
  for (const cz of [-0.1, -0.04, 0.02, 0.08]) {
    grp.add(part(box(0.13, 0.006, 0.006), GLOW(s), 0, 0.1, cz)); // dorsal cross-band
    grp.add(part(box(0.13, 0.006, 0.006), GLOW(s), 0, -0.1, cz)); // ventral cross-band
    grp.add(part(sph(0.011, 6), GLOW(s), 0, 0.105, cz)); // rune-node
  }

  addRot(grp, cyl(0.078, 0.078, 0.032, 6), C(s, 'dark'), 0, 0, 0.18, Math.PI / 2); // cannon throat
  addRot(grp, cyl(0.09, 0.09, 0.013, 6), ACC(s), 0, 0, 0.196, Math.PI / 2); // gold rune ring face
  grp.add(part(sph(0.06, 14), GLOW(s), 0, 0, 0.225)); // charged shard-orb halo
  grp.add(part(sph(0.032, 10), C(s, 'gold'), 0, 0, 0.225)); // solid core
  addRot(grp, cyl(0.003, 0.036, 0.22, 12), GLOW(s), 0, 0, 0.35, Math.PI / 2); // beam sheath
  addRot(grp, cyl(0.002, 0.02, 0.23, 8), GLOW(s), 0, 0, 0.35, Math.PI / 2); // bright mid
  addRot(grp, cyl(0.0015, 0.009, 0.24, 6), GLOW(s), 0, 0, 0.35, Math.PI / 2); // hot core

  preGunShard(grp, s, 0.24, 0.02, -0.02, 0.04, 0.19, 0.09, 0.02); // flank battery (star)
  preGunShard(grp, s, -0.24, 0.02, -0.02, 0.04, 0.19, -0.09, 0.02); // flank battery (port)
  preGunShard(grp, s, 0.15, 0.13, 0.08, 0.022, 0.1, 0.05, 0.09); // forward upper (star)
  preGunShard(grp, s, -0.15, 0.13, 0.08, 0.022, 0.1, -0.05, 0.09); // forward upper (port)
  preGunShard(grp, s, 0.15, -0.13, -0.08, 0.022, 0.1, 0.05, -0.09); // aft lower (star)
  preGunShard(grp, s, -0.15, -0.13, -0.08, 0.022, 0.1, -0.05, -0.09); // aft lower (port)

  addRot(grp, cyl(0.06, 0.075, 0.028, 6), C(s, 'dark'), 0, 0, -0.16, Math.PI / 2); // drive collar
  addRot(grp, cyl(0.085, 0.085, 0.01, 6), ACC(s), 0, 0, -0.172, Math.PI / 2); // gold rune ring
  engineGlow(grp, s, 0, 0, -0.18, 0.055); // central engine-light
  engineGlow(grp, s, 0.062, 0, -0.17, 0.032);
  engineGlow(grp, s, -0.062, 0, -0.17, 0.032);
  grp.add(part(sph(0.03, 10), C(s, 'gold'), 0, 0, -0.16)); // drive core

  navLight(grp, s, 'top', 0, 0.16, -0.02, 0.014);
  runningLights(grp, s, 0.24, 0.02, -0.02);

  return grp;
}

// A floating shard SENTINEL (corvette "gun"): a bronze diamond-spear (+Z) capped
// by a charged light-tip and a rune-lance beam. Held off the flanks by light.
function preCorvShard(s, grp, x, y, z, r, len) {
  addRot(grp, cone(r, len, 4), C(s, 'hull2'), x, y, z, Math.PI / 2); // 4-sided bronze spear
  grp.add(part(sph(r * 0.8, 8), GLOW(s), x, y, z + len / 2)); // charged light-tip
  grp.add(part(box(r * 0.32, r * 0.32, len * 0.8), GLOW(s), x, y, z + len)); // rune-lance beam
}

// CORVETTE — a sacred SENTINEL warship (a small flagship): an elongated gold
// OBELISK hull tapering to a luminous prow NODE, full-length rune-bands, a symmetric
// FORMATION of floating shard-sentinels held by light, a radiant gold engine-light
// bank. Serene, ancient, symmetric. NOSE = +Z.
function makePrecursorCorvette(s) {
  const grp = group();

  const zN = 0.16, zS = -0.25, rN = 0.045, rS = 0.10, SY = 1.38, SX = 0.82;
  const rat = (z) => rS + (rN - rS) * (z - zS) / (zN - zS);
  const hull = addRot(grp, cyl(rN, rS, zN - zS, 4), C(s, 'accent'), 0, 0, (zN + zS) / 2, Math.PI / 2);
  hull.scale.set(SX, SY, 1);
  const crest = addRot(grp, cyl(0.012, 0.055, 0.34, 4), C(s, 'hull2'), 0, 0.055, -0.05, Math.PI / 2);
  crest.scale.set(0.28, 1.95, 1);

  const prow = addRot(grp, cone(rN * 1.02, 0.12, 4), C(s, 'gold'), 0, 0, zN + 0.05, Math.PI / 2);
  prow.scale.set(SX, SY, 1);
  grp.add(part(sph(0.033, 12), GLOW(s), 0, 0, zN + 0.115)); // prow node
  grp.add(part(sph(0.017, 10), C(s, 'glass'), 0, 0, zN + 0.115)); // pale-gold core

  for (const z of [0.13, 0.05, -0.03, -0.11, -0.19]) {
    const rr = rat(z) + 0.006;
    const ring = addRot(grp, cyl(rr, rr, 0.012, 4), GLOW(s), 0, 0, z, Math.PI / 2);
    ring.scale.set(SX, SY, 1); // rune-band loop
  }
  grp.add(part(box(0.008, 0.006, 0.34), GLOW(s), 0, 0.15, -0.05)); // dorsal spine rune
  for (const sx of [-1, 1]) grp.add(part(box(0.005, 0.008, 0.36), GLOW(s), sx * 0.056, 0, -0.04)); // flank runes
  for (const z of [0.05, -0.03, -0.11]) grp.add(part(sph(0.013, 8), GLOW(s), 0, 0.152, z)); // keystone nodes

  const flank = [[0.05, 0.185, 0.11, 0.026], [-0.05, 0.205, 0.13, 0.03], [-0.16, 0.18, 0.10, 0.024]];
  for (const sx of [-1, 1]) {
    for (const [zc, ox, len, r] of flank) {
      const x = sx * ox;
      preCorvShard(s, grp, x, 0, zc, r, len);
      const edge = rat(zc) * SX + 0.008;
      grp.add(part(box(Math.abs(x - sx * edge), 0.004, 0.004), GLOW(s), (x + sx * edge) / 2, 0, zc)); // light tether
    }
  }
  preCorvShard(s, grp, 0, 0.19, -0.02, 0.028, 0.11); // crown sentinel
  grp.add(part(box(0.004, 0.08, 0.004), GLOW(s), 0, 0.15, -0.02));
  preCorvShard(s, grp, 0, -0.16, -0.04, 0.022, 0.09); // keel sentinel
  grp.add(part(box(0.004, 0.07, 0.004), GLOW(s), 0, -0.12, -0.04));

  const bez = addRot(grp, cyl(rS * 1.02, rS * 1.06, 0.02, 4), C(s, 'hull2'), 0, 0, -0.245, Math.PI / 2);
  bez.scale.set(SX, SY, 1);
  engineGlow(grp, s, 0, 0, -0.27, 0.05); // central sun
  for (const [dx, dy] of [[0.05, 0], [-0.05, 0], [0, 0.075], [0, -0.075]]) engineGlow(grp, s, dx, dy, -0.27, 0.026);

  navLight(grp, s, 'top', 0, 0.25, 0.0, 0.013);

  return grp;
}

// A suspended CARGO RELIC (freighter): a solid gold hex-gem wrapped in a glowing
// containment ring, held between two side spars by diagonal light-tethers.
function prePrism(grp, s, x, y, z, r, h, spar, spy) {
  addRot(grp, cone(r, h, 6), ACC(s), x, y + h * 0.5, z); // upper half
  addRot(grp, cone(r, h, 6), ACC(s), x, y - h * 0.5, z, Math.PI); // lower half
  grp.add(part(cyl(r * 1.4, r * 1.4, 0.008, 10), GLOW(s), x, y, z)); // containment ring
  const dx = spar - r * 0.6, dy = y - spy, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
  addRot(grp, box(len, 0.006, 0.006), GLOW(s), x + (r * 0.6 + spar) * 0.5, (y + spy) * 0.5, z, 0, 0, -ang); // right tether
  addRot(grp, box(len, 0.006, 0.006), GLOW(s), x - (r * 0.6 + spar) * 0.5, (y + spy) * 0.5, z, 0, 0, ang); // left tether
}

// FREIGHTER — a sacred ARK: a smooth gold spindle hull, two floating side rails
// held off the flanks, a row of faceted gold cargo-gems hovering between them held
// by light, a rune-etched spine, a luminous prow node, a radiant engine-light bank.
// Monumental, serene, symmetric. NOSE = +Z.
function makePrecursorFreighter(s) {
  const grp = group();

  addRot(grp, cyl(0.052, 0.052, 0.32, 8), C(s, 'hull2'), 0, 0, -0.02, Math.PI / 2); // midbody prism
  addRot(grp, cone(0.052, 0.14, 8), C(s, 'hull2'), 0, 0, 0.205, Math.PI / 2); // pointed prow
  addRot(grp, cyl(0.052, 0.036, 0.05, 8), C(s, 'hull'), 0, 0, -0.205, Math.PI / 2); // stern collar

  addRot(grp, box(0.03, 0.03, 0.34), ACC(s), 0, 0.05, -0.02, 0, 0, Math.PI / 4); // diamond spine
  grp.add(part(box(0.009, 0.006, 0.33), GLOW(s), 0, 0.079, -0.02)); // dorsal rune-line
  grp.add(part(box(0.009, 0.006, 0.33), GLOW(s), 0, -0.055, -0.02)); // ventral rune-line
  for (const z of [0.12, 0.0, -0.14]) grp.add(part(cyl(0.056, 0.056, 0.012, 8), GLOW(s), 0, 0, z)); // rune bands

  const spar = 0.10, spy = 0.05;
  for (const sx of [-1, 1]) addRot(grp, cyl(0.009, 0.009, 0.28, 6), C(s, 'hull2'), sx * spar, spy, -0.03, Math.PI / 2); // side rail
  for (const z of [0.11, -0.17]) {
    grp.add(part(box(0.21, 0.012, 0.016), C(s, 'hull'), 0, spy + 0.004, z)); // gate crossbar
    grp.add(part(box(0.21, 0.006, 0.006), GLOW(s), 0, spy + 0.013, z)); // rune-lintel
  }

  for (const z of [0.075, 0.02, -0.035, -0.09, -0.145]) prePrism(grp, s, 0, 0.125, z, 0.032, 0.038, spar, spy); // cargo relics

  grp.add(part(sph(0.035, 12), GLOW(s), 0, 0, 0.268)); // prow node
  grp.add(part(sph(0.017, 10), C(s, 'glass'), 0, 0, 0.268)); // inner core
  addRot(grp, cyl(0.052, 0.052, 0.006, 12), GLOW(s), 0, 0, 0.238, Math.PI / 2); // halo collar
  grp.add(part(cone(0.016, 0.06, 4), ACC(s), 0, 0.15, 0.2)); // crown shard
  grp.add(part(box(0.004, 0.09, 0.004), GLOW(s), 0, 0.1, 0.2)); // light tether

  addRot(grp, cyl(0.06, 0.06, 0.008, 16), GLOW(s), 0, 0, -0.238, Math.PI / 2); // radiant disc
  for (const [x, y, r] of [[0, 0, 0.03], [0.032, 0.014, 0.02], [-0.032, 0.014, 0.02], [0, -0.024, 0.02]]) {
    const m = part(sph(r, 10), GLOW(s), x, y, -0.255);
    m.scale.z = 1.7;
    grp.add(m); // light plume
  }

  runningLights(grp, s, spar, spy, 0.115);
  navLight(grp, s, 'top', 0, 0.19, 0.2, 0.01);

  return grp;
}

// TANKER — a sacred vessel of light: a slender gold obelisk spine carrying its
// "fuel" as three GLOWING containment ORBS raised in bronze armillary cradles, a
// luminous prow node, gold rune-bands, floating shards, a radiant engine-light.
// Symmetric. NOSE = +Z.
function makePrecursorTanker(s) {
  const grp = group();

  grp.add(part(box(0.05, 0.055, 0.32), C(s, 'hull2'), 0, -0.005, -0.02)); // core keel slab
  addRot(grp, box(0.045, 0.045, 0.34), C(s, 'hull'), 0, -0.005, -0.02, 0, 0, Math.PI / 4); // diamond sheath
  grp.add(part(box(0.02, 0.012, 0.36), C(s, 'accent'), 0, 0.026, -0.02)); // gold spine ridge

  const vz = [0.105, -0.01, -0.125];
  for (const z of vz) {
    grp.add(part(sph(0.056, 12), GLOW(s), 0, 0.068, z)); // luminous orb
    addRot(grp, cyl(0.062, 0.062, 0.013, 14), C(s, 'hull2'), 0, 0.068, z); // equatorial hoop
    addRot(grp, cyl(0.062, 0.062, 0.013, 14), C(s, 'accent'), 0, 0.068, z, Math.PI / 2); // meridian hoop
    grp.add(part(box(0.028, 0.058, 0.028), C(s, 'hull'), 0, 0.022, z)); // cradle pylon
    for (const x of [-1, 1]) addRot(grp, box(0.005, 0.07, 0.005), GLOW(s), x * 0.028, 0.035, z, 0, 0, x * 0.25); // light-tether
  }

  addRot(grp, cone(0.062, 0.14, 4), C(s, 'hull2'), 0, 0, 0.2, Math.PI / 2, 0, Math.PI / 4); // prow spike
  addRot(grp, cone(0.045, 0.06, 4), C(s, 'accent'), 0, 0, 0.16, Math.PI / 2, 0, 0); // inner collar
  grp.add(part(sph(0.036, 12), GLOW(s), 0, 0.006, 0.235)); // prow node

  addRot(grp, cone(0.078, 0.11, 8), C(s, 'hull'), 0, 0, -0.17, Math.PI / 2, 0, 0); // engine funnel
  addRot(grp, cyl(0.05, 0.05, 0.006, 14), GLOW(s), 0, 0, -0.222, Math.PI / 2); // glowing disc
  engineGlow(grp, s, 0, 0, -0.242, 0.044); // radiant plume

  for (const z of [0.05, -0.065]) grp.add(part(box(0.095, 0.006, 0.01), GLOW(s), 0, 0.03, z)); // rune cross-bands
  for (const x of [-1, 1]) grp.add(part(box(0.006, 0.024, 0.29), GLOW(s), x * 0.05, -0.005, -0.02)); // flank runes

  grp.add(part(cone(0.02, 0.072, 4), GLOW(s), 0, 0.17, -0.01)); // crown shard
  for (const x of [-1, 1]) addRot(grp, cone(0.015, 0.05, 4), ACC(s), x * 0.125, 0.03, -0.05, 0, 0, x * 0.5); // flank shards

  runningLights(grp, s, 0.055, -0.01, 0.12);
  navLight(grp, s, 'top', 0, 0.12, 0.245, 0.01);

  return grp;
}

// A row of tiny GLOW rune-windows along a flank (lit pilgrim halls). Caller mirrors ±x.
function runeRow(grp, s, x, y, z0, z1, dz, sy = 0.012, sz = 0.014) {
  for (let z = z0; z <= z1 + 1e-6; z += dz) grp.add(part(box(0.004, sy, sz), GLOW(s), x, y, z));
}

// A floating obelisk shard escorting the barge, HELD BY LIGHT: a bronze obelisk +
// a glowing crown tip + a thin GLOW beam tethering it back to the hull anchor `ax`.
function heldShard(grp, s, ax, x, y, z, r, h, rz = 0) {
  addRot(grp, cone(r, h, 4), ACC(s), x, y, z, 0, 0, rz); // obelisk shard
  grp.add(part(box(r * 0.9, r * 0.9, r * 0.9), GLOW(s), x, y + h * 0.5, z)); // luminous tip node
  grp.add(part(box(Math.abs(ax - x), 0.004, 0.004), GLOW(s), (ax + x) / 2, y, z)); // light tether
}

// LINER — a sacred pilgrim-ship / temple-barge: a long gold monolith with rows of
// glowing rune-windows (lit pilgrim halls), a rune-etched temple superstructure
// crowned by a luminous NODE, floating obelisk shards held by light, full-length
// rune-bands, a radiant engine-light bank. Monumental, holy, symmetric. NOSE = +Z.
function makePrecursorLiner(s) {
  const grp = group();

  grp.add(part(box(0.15, 0.13, 0.5), C(s, 'hull2'), 0, 0, -0.04)); // main monolith
  grp.add(part(box(0.115, 0.05, 0.48), C(s, 'hull'), 0, -0.085, -0.04)); // keel base tier
  grp.add(part(box(0.11, 0.05, 0.46), C(s, 'hull2'), 0, 0.085, -0.05)); // upper promenade tier
  addRot(grp, wedge(0.15, 0.13, 0.3), C(s, 'hull2'), 0, 0, 0.18); // chisel prow
  grp.add(part(box(0.14, 0.11, 0.05), C(s, 'hull'), 0, 0, -0.315)); // stern engine housing

  grp.add(part(box(0.02, 0.03, 0.03), C(s, 'accent'), 0, 0.02, 0.32));
  grp.add(part(sph(0.018, 8), GLOW(s), 0, 0.03, 0.34)); // prow light-node
  grp.add(part(box(0.04, 0.05, 0.006), GLOW(s), 0, 0.0, 0.29)); // prow rune-band

  grp.add(part(box(0.09, 0.055, 0.2), C(s, 'hull'), 0, 0.135, 0.0)); // temple base
  grp.add(part(box(0.065, 0.05, 0.13), C(s, 'hull2'), 0, 0.185, 0.0)); // temple mid
  grp.add(part(box(0.042, 0.045, 0.075), C(s, 'accent'), 0, 0.225, 0.0)); // temple spire block
  grp.add(part(box(0.01, 0.05, 0.01), GLOW(s), 0, 0.255, 0.0)); // light spire
  grp.add(part(sph(0.036, 10), GLOW(s), 0, 0.282, 0.0)); // luminous CROWN node
  grp.add(part(box(0.11, 0.006, 0.006), GLOW(s), 0, 0.282, 0.0)); // crown halo (cross)
  grp.add(part(box(0.006, 0.006, 0.11), GLOW(s), 0, 0.282, 0.0));
  for (const x of [-1, 1]) {
    grp.add(part(box(0.004, 0.01, 0.18), GLOW(s), x * 0.047, 0.135, 0.0)); // temple flank rune
    runeRow(grp, s, x * 0.047, 0.135, -0.07, 0.07, 0.028, 0.014, 0.012); // temple hall windows
  }
  grp.add(part(box(0.09, 0.008, 0.006), GLOW(s), 0, 0.16, 0.1)); // temple front rune-band

  grp.add(part(box(0.016, 0.005, 0.46), GLOW(s), 0, 0.112, -0.05)); // dorsal spine rune
  for (const x of [-1, 1]) {
    grp.add(part(box(0.005, 0.006, 0.5), GLOW(s), x * 0.079, 0.03, -0.04)); // upper flank rune
    grp.add(part(box(0.005, 0.006, 0.5), GLOW(s), x * 0.079, -0.03, -0.04)); // lower flank rune
  }
  for (const z of [-0.2, -0.03, 0.14]) grp.add(part(box(0.155, 0.006, 0.014), GLOW(s), 0, 0.06, z)); // rune belts
  grp.add(part(box(0.02, 0.004, 0.46), GLOW(s), 0, -0.112, -0.04)); // keel under-glow

  for (const x of [-1, 1]) {
    for (const z of [-0.22, -0.11, 0.0, 0.11]) grp.add(part(box(0.006, 0.12, 0.012), C(s, 'accent'), x * 0.078, 0.0, z)); // pilaster ribs
  }

  for (const x of [-1, 1]) {
    runeRow(grp, s, x * 0.079, -0.028, -0.23, 0.15, 0.026); // lower hall row
    runeRow(grp, s, x * 0.079, 0.028, -0.23, 0.15, 0.026); // upper hall row
    runeRow(grp, s, x * 0.059, 0.088, -0.22, 0.14, 0.03, 0.008, 0.01); // clerestory row
  }

  for (const x of [-1, 1]) {
    heldShard(grp, s, x * 0.078, x * 0.17, 0.055, 0.09, 0.02, 0.1); // forward flank shard
    heldShard(grp, s, x * 0.075, x * 0.16, 0.02, -0.17, 0.018, 0.09); // aft flank shard
  }
  addRot(grp, cone(0.022, 0.12, 4), ACC(s), 0, 0.05, 0.44); // leading obelisk ahead of the prow
  grp.add(part(sph(0.016, 8), GLOW(s), 0, 0.11, 0.44)); // its crown tip
  grp.add(part(box(0.004, 0.004, 0.09), GLOW(s), 0, 0.05, 0.385)); // forward light tether
  addRot(grp, cone(0.02, 0.09, 4), ACC(s), 0, -0.18, -0.02, Math.PI, 0, 0); // lower shard
  grp.add(part(box(0.004, 0.06, 0.004), GLOW(s), 0, -0.14, -0.02)); // downward tether

  grp.add(part(box(0.115, 0.085, 0.012), C(s, 'dark'), 0, 0, -0.342)); // recessed engine face
  for (const dx of [-0.044, -0.022, 0, 0.022, 0.044]) grp.add(part(box(0.012, 0.062, 0.01), GLOW(s), dx, 0, -0.35)); // rune light-slots
  engineGlow(grp, s, 0.026, 0, -0.356, 0.022);
  engineGlow(grp, s, -0.026, 0, -0.356, 0.022);
  grp.add(part(box(0.125, 0.006, 0.006), GLOW(s), 0, 0.05, -0.342)); // engine rune frame (top)
  grp.add(part(box(0.125, 0.006, 0.006), GLOW(s), 0, -0.05, -0.342)); // engine rune frame (bottom)
  for (const x of [-1, 1]) grp.add(part(box(0.006, 0.1, 0.006), GLOW(s), x * 0.06, 0, -0.342)); // frame sides

  runningLights(grp, s, 0.079, -0.01, 0.14);
  navLight(grp, s, 'top', 0, 0.31, 0.0, 0.01);

  return grp;
}

// === BESPOKE FLAGSHIP — a colossal sacred MONOLITH dreadnought =================

// A faceted GLOW rune-BELT wrapping the hull cross-section at station z.
function preFlagRing(grp, m, z, r, sx, sy, w = 0.012, seg = 6) {
  const ring = addRot(grp, cyl(r, r, w, seg), m, 0, 0, z, Math.PI / 2);
  ring.scale.set(sx, sy, 1);
  return ring;
}

// A floating obelisk SHARD held by light (flagship sentinel/battery): a bronze
// bipyramid with a rune-core/spine + crown tip, tethered to a hull anchor by a beam.
function preFlagShard(grp, s, x, y, z, r, up, dn, ax, ay) {
  addRot(grp, cone(r, up, 4), C(s, 'hull2'), x, y + up * 0.5, z); // upper point
  addRot(grp, cone(r, dn, 4), C(s, 'hull'), x, y - dn * 0.5, z, Math.PI, 0, 0); // lower point
  grp.add(part(box(r * 0.3, up + dn, r * 0.3), GLOW(s), x, y + (up - dn) * 0.5, z)); // rune spine
  grp.add(part(sph(r * 0.5, 6), GLOW(s), x, y, z)); // rune-core
  grp.add(part(sph(r * 0.4, 6), GLOW(s), x, y + up, z)); // crown tip node
  const dx = x - ax, dy = y - ay, d = Math.hypot(dx, dy);
  addRot(grp, box(d, 0.005, 0.005), GLOW(s), (x + ax) / 2, (y + ay) / 2, z, 0, 0, Math.atan2(dy, dx)); // light-tether
}

// A great forward LIGHT-LANCE from (x,y,z) toward +Z: three nested tapering GLOW
// cylinders narrowing past the nose, capped by a lance-tip node.
function preFlagLance(grp, s, x, y, z, len, r) {
  addRot(grp, cyl(r * 0.08, r, len, 12), GLOW(s), x, y, z + len / 2, Math.PI / 2); // outer sheath
  addRot(grp, cyl(r * 0.05, r * 0.55, len + 0.02, 10), GLOW(s), x, y, z + len / 2, Math.PI / 2); // bright mid
  addRot(grp, cyl(r * 0.03, r * 0.24, len + 0.04, 8), GLOW(s), x, y, z + len / 2, Math.PI / 2); // hot core
  grp.add(part(sph(r * 0.3, 8), GLOW(s), x, y, z + len)); // lance-tip node
}

// FLAGSHIP "The Reliquary Ascendant" — a COLOSSAL sacred monolith dreadnought. A
// tall smooth gold-bronze OBELISK core (faceted diamond prism + a soaring dorsal
// sail-fin), densely etched with glowing gold RUNE-bands, crowned by an ornate
// luminous PROW (a charged crown-node projecting a great forward light-lance),
// escorted by a formation of floating obelisk SHARDS held by light, a ventral
// rune-GATE glowing gold, and a radiant gold ENGINE-LIGHT sun at the tail. NOSE = +Z.
function makePrecursorFlagship(s) {
  const grp = group();

  const SX = 0.66, SY = 2.05, bodyR = 0.18;
  const TOPY = bodyR * SY;

  // A. CENTRAL OBELISK CORE — a tall faceted diamond monolith along Z
  const body = addRot(grp, cyl(bodyR * 0.6, bodyR, 0.78, 4), C(s, 'hull'), 0, 0, -0.02, Math.PI / 2);
  body.scale.set(SX, SY, 1);
  const shell = addRot(grp, cyl(bodyR * 0.74, bodyR * 1.04, 0.72, 4), C(s, 'hull2'), 0, 0, -0.02, Math.PI / 2, 0, Math.PI / 4);
  shell.scale.set(SX * 0.82, SY * 0.6, 1);
  const spine = addRot(grp, cyl(bodyR * 0.34, bodyR * 0.46, 0.82, 4), C(s, 'accent'), 0, 0, -0.02, Math.PI / 2);
  spine.scale.set(SX * 0.42, SY, 1);
  for (const sgn of [-1, 1]) {
    addRot(grp, box(0.075, 0.075, 0.74), C(s, 'hull2'), sgn * 0.055, TOPY * 0.78, -0.04, 0, 0, Math.PI / 4); // dorsal crest ridge
    addRot(grp, box(0.065, 0.065, 0.72), C(s, 'hull2'), sgn * 0.05, -TOPY * 0.78, -0.04, 0, 0, Math.PI / 4); // ventral keel ridge
  }

  // B. SOARING DORSAL SAIL-FIN
  grp.add(part(box(0.06, 0.16, 0.62), C(s, 'hull'), 0, TOPY + 0.02, -0.04)); // fin root
  grp.add(part(box(0.05, 0.34, 0.5), C(s, 'hull2'), 0, TOPY + 0.24, 0.0)); // main sail plate
  grp.add(part(box(0.044, 0.26, 0.34), C(s, 'accent'), 0, TOPY + 0.42, 0.04)); // bright upper sail
  addRot(grp, cone(0.06, 0.4, 4), C(s, 'hull2'), 0, TOPY + 0.44, 0.28, Math.PI / 2, 0, Math.PI / 4); // swept leading crest
  addRot(grp, box(0.06, 0.06, 0.46), C(s, 'hull'), 0, TOPY + 0.58, 0.0, 0, 0, Math.PI / 4); // diamond top-edge
  grp.add(part(box(0.05, 0.2, 0.52), C(s, 'hull'), 0, -TOPY - 0.06, -0.04)); // ventral keel fin
  addRot(grp, cone(0.05, 0.22, 4), C(s, 'hull2'), 0, -TOPY - 0.16, 0.24, Math.PI / 2, 0, Math.PI / 4); // keel leading point

  // C. DENSE RUNE-ETCHING
  grp.add(part(box(0.014, 0.006, 0.86), GLOW(s), 0, TOPY + 0.24, -0.02)); // dorsal sail spine rune
  grp.add(part(box(0.012, 0.006, 0.8), GLOW(s), 0, TOPY * 0.8, -0.02)); // dorsal core spine rune
  grp.add(part(box(0.012, 0.006, 0.74), GLOW(s), 0, -TOPY * 0.82, -0.04)); // ventral keel rune
  for (const sgn of [-1, 1]) {
    grp.add(part(box(0.006, 0.012, 0.76), GLOW(s), sgn * bodyR * SX, TOPY * 0.28, -0.04)); // upper flank rune
    grp.add(part(box(0.006, 0.012, 0.74), GLOW(s), sgn * bodyR * SX, -TOPY * 0.3, -0.04)); // lower flank rune
    grp.add(part(box(0.006, 0.11, 0.006), GLOW(s), sgn * 0.028, TOPY + 0.24, 0.0)); // sail flank rune
    for (const z of [0.26, 0.15, 0.04, -0.07, -0.18, -0.29]) addRot(grp, box(0.004, 0.08, 0.004), GLOW(s), sgn * bodyR * SX * 1.02, 0.0, z, sgn * 0.5, 0, 0); // canted flank glyph
  }
  for (const z of [0.28, 0.16, 0.04, -0.1, -0.24]) {
    preFlagRing(grp, C(s, 'hull2'), z, bodyR * 1.03, SX, SY, 0.022); // bronze band recess
    preFlagRing(grp, GLOW(s), z, bodyR * 1.05, SX, SY, 0.01); // glowing rune belt
    grp.add(part(sph(0.016, 6), GLOW(s), 0, TOPY * 1.02, z)); // dorsal keystone node
    grp.add(part(sph(0.013, 6), GLOW(s), 0, -TOPY, z)); // ventral keystone node
  }
  for (const y of [TOPY + 0.12, TOPY + 0.3, TOPY + 0.46]) {
    grp.add(part(box(0.055, 0.006, 0.006), GLOW(s), 0, y, 0.02)); // sail cross-rune
    grp.add(part(sph(0.012, 6), GLOW(s), 0, y, 0.22)); // sail leading-edge node
  }

  // D. ORNATE LUMINOUS PROW — charged crown-node + forward light-lance
  addRot(grp, cone(0.14, 0.34, 6), C(s, 'hull'), 0, 0, 0.5, Math.PI / 2, 0, 0); // faceted prow spike
  addRot(grp, cone(0.095, 0.2, 6), C(s, 'accent'), 0, 0, 0.52, Math.PI / 2, 0, 0); // inner gold prow
  for (const [rz, rr] of [[0.5, 0.11], [0.55, 0.086], [0.6, 0.062]]) {
    addRot(grp, cyl(rr, rr, 0.012, 12), ACC(s), 0, 0, rz, Math.PI / 2); // gold rune-ring frame
    addRot(grp, cyl(rr * 1.05, rr * 1.05, 0.008, 12), GLOW(s), 0, 0, rz, Math.PI / 2); // its glow
  }
  addRot(grp, cyl(0.15, 0.15, 0.006, 16), GLOW(s), 0, 0, 0.605, Math.PI / 2); // crown halo disc
  grp.add(part(sph(0.078, 12), GLOW(s), 0, 0, 0.63)); // radiant NODE
  grp.add(part(sph(0.042, 10), C(s, 'gold'), 0, 0, 0.63)); // solid gold core
  grp.add(part(sph(0.02, 8), NAV(s, 'top'), 0, 0, 0.63)); // white-hot heart
  const CN = 8;
  for (let i = 0; i < CN; i++) {
    const a = (i / CN) * Math.PI * 2;
    addRot(grp, cone(0.028, 0.15, 4), ACC(s), Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0.6, 0, 0, a - Math.PI / 2); // radiating crown shard
    grp.add(part(sph(0.012, 6), GLOW(s), Math.cos(a) * 0.245, Math.sin(a) * 0.245, 0.6)); // crown-beacon tip
  }
  preFlagLance(grp, s, 0, 0, 0.66, 0.34, 0.05); // great forward light-lance

  // E. SHARD FORMATION — floating obelisk sentinels held by light
  for (const sgn of [-1, 1]) {
    preFlagShard(grp, s, sgn * 0.34, 0.02, 0.16, 0.05, 0.24, 0.16, sgn * 0.14, 0.02); // fore flank
    preFlagShard(grp, s, sgn * 0.38, -0.02, -0.04, 0.055, 0.28, 0.18, sgn * 0.15, -0.02); // mid flank (largest)
    preFlagShard(grp, s, sgn * 0.34, 0.02, -0.24, 0.05, 0.24, 0.16, sgn * 0.14, 0.02); // aft flank
    preFlagShard(grp, s, sgn * 0.24, TOPY + 0.1, 0.08, 0.032, 0.14, 0.09, sgn * 0.06, TOPY + 0.24); // raised upper
    preFlagShard(grp, s, sgn * 0.48, 0.16, 0.0, 0.036, 0.17, 0.11, sgn * 0.38, -0.02); // outer upper
  }
  preFlagShard(grp, s, 0, TOPY + 0.6, -0.16, 0.044, 0.22, 0.14, 0, TOPY + 0.4); // crown sentinel
  preFlagShard(grp, s, 0, -TOPY - 0.34, -0.04, 0.04, 0.18, 0.12, 0, -TOPY - 0.16); // keel sentinel

  // F. VENTRAL RUNE-GATE (sacred hangar recess glowing gold)
  const GY = -TOPY - 0.02;
  grp.add(part(box(0.15, 0.07, 0.26), C(s, 'dark'), 0, GY, -0.05)); // recessed gate mouth
  grp.add(part(box(0.11, 0.05, 0.22), C(s, 'hull'), 0, GY - 0.005, -0.05)); // interior back wall
  grp.add(part(box(0.09, 0.03, 0.18), GLOW(s), 0, GY - 0.008, -0.05)); // gold interior glow
  grp.add(part(box(0.16, 0.008, 0.008), GLOW(s), 0, GY + 0.036, 0.09)); // lintel rune (front)
  grp.add(part(box(0.16, 0.008, 0.008), GLOW(s), 0, GY + 0.036, -0.19)); // lintel rune (back)
  grp.add(part(box(0.16, 0.008, 0.28), GLOW(s), 0, GY - 0.038, -0.05)); // sill rune-band
  for (const dz of [-0.15, -0.075, 0.0, 0.075, 0.15]) grp.add(part(box(0.012, 0.05, 0.01), GLOW(s), 0, GY, dz)); // rune light-slot
  for (const sgn of [-1, 1]) grp.add(part(box(0.008, 0.06, 0.24), GLOW(s), sgn * 0.07, GY, -0.05)); // gate side pillars

  // G. RADIANT ENGINE-LIGHT SUN (no nozzles)
  const EZ = -0.42;
  preFlagRing(grp, C(s, 'hull2'), EZ + 0.02, bodyR * 0.86, SX, SY, 0.03); // drive collar
  addRot(grp, cyl(0.15, 0.15, 0.008, 16), GLOW(s), 0, 0, EZ, Math.PI / 2); // radiant drive disc
  addRot(grp, cyl(0.16, 0.16, 0.012, 16), ACC(s), 0, 0, EZ + 0.008, Math.PI / 2); // gold bezel rim
  addRot(grp, cyl(0.11, 0.11, 0.01, 12), GLOW(s), 0, 0, EZ - 0.006, Math.PI / 2); // inner glow ring
  grp.add(part(sph(0.06, 12), GLOW(s), 0, 0, EZ - 0.01)); // central sun halo
  grp.add(part(sph(0.032, 10), C(s, 'gold'), 0, 0, EZ - 0.01)); // solid gold heart
  engineGlow(grp, s, 0, 0, EZ - 0.04, 0.07); // central plume
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const px = Math.cos(a) * 0.1 * SX * 1.4, py = Math.sin(a) * 0.1 * SY * 0.55;
    engineGlow(grp, s, px, py, EZ - 0.03, 0.032);
    grp.add(part(sph(0.015, 6), GLOW(s), px, py, EZ - 0.005)); // plume core spark
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8, a2 = ((i + 1) / 8) * Math.PI * 2 + Math.PI / 8;
    const x1 = Math.cos(a) * 0.15, y1 = Math.sin(a) * 0.15, x2 = Math.cos(a2) * 0.15, y2 = Math.sin(a2) * 0.15;
    const len = Math.hypot(x2 - x1, y2 - y1);
    addRot(grp, box(len, 0.008, 0.008), GLOW(s), (x1 + x2) / 2 * SX * 1.2, (y1 + y2) / 2 * 0.75, EZ + 0.01, 0, 0, Math.atan2(y2 - y1, x2 - x1)); // rune frame edge
  }

  // H. HALOS, CROWN BEACONS & RUNNING LIGHTS
  navLight(grp, s, 'top', 0, TOPY + 0.6, 0.0, 0.016); // sail-crown beacon
  navLight(grp, s, 'top', 0, 0.0, 0.63, 0.014); // prow-node beacon
  runningLights(grp, s, bodyR * SX + 0.01, 0.0, 0.24);
  runningLights(grp, s, bodyR * SX + 0.01, 0.0, -0.3);
  const halo = addRot(grp, cyl(0.19, 0.19, 0.01, 12), GLOW(s), 0, TOPY + 0.62, -0.06, 0, 0, 0); // dorsal nimbus
  halo.scale.set(1, 1, 0.26);

  return grp;
}

// === BESPOKE STATIONS — sacred luminous geometry, floating shards held by light ==

// One floating obelisk SHARD in the ring's orbiting formation, HELD BY LIGHT: a
// bronze bipyramid raised at angle `a` (radius R, XZ plane, upright +Y), a rune-
// core spine, square rune-bands, a crown tip-node, a base node, and a light-tether.
function preRingShard(grp, s, a, R, r, up, dn) {
  const x = Math.cos(a) * R, z = Math.sin(a) * R;
  addRot(grp, cone(r, up, 4), C(s, 'accent'), x, up * 0.5, z, 0, -a, 0); // upper point
  addRot(grp, cone(r, dn, 4), C(s, 'hull2'), x, -dn * 0.5, z, Math.PI, -a, 0); // lower point
  addRot(grp, box(r * 0.42, up + dn, r * 0.42), GLOW(s), x, (up - dn) * 0.5, z, 0, -a, 0); // rune-core spine
  for (const yy of [up * 0.45, -dn * 0.5]) addRot(grp, cyl(r * 1.22, r * 1.22, r * 0.2, 4), GLOW(s), x, yy, z, 0, -a, 0); // square rune-bands
  grp.add(part(sph(r * 0.62, 5), GLOW(s), x, up + r * 0.35, z)); // crown tip-node
  grp.add(part(sph(r * 0.4, 5), GLOW(s), x, -dn - r * 0.28, z)); // base node
  const r0 = 0.36, len = (R - r) - r0, mid = r0 + len * 0.5;
  addRot(grp, box(len, r * 0.2, r * 0.2), GLOW(s), Math.cos(a) * mid, 0, Math.sin(a) * mid, 0, -a, 0); // radial tether
}

// A small floating rune-NODE hovering between the big shards (filigree): a slim
// bronze obelisk with a rune-spine + tip, on the same ring.
function preRingNode(grp, s, a, R) {
  const x = Math.cos(a) * R, z = Math.sin(a) * R;
  addRot(grp, cone(0.05, 0.14, 4), ACC(s), x, 0.05, z, 0, -a, 0); // slim obelisk
  addRot(grp, box(0.02, 0.22, 0.02), GLOW(s), x, 0.02, z, 0, -a, 0); // rune spine
  grp.add(part(sph(0.03, 5), GLOW(s), x, 0.15, z)); // tip-node
}

// Home HUB — a radiant golden CORE cradled in an ornate faceted bronze octahedron
// (dense rune-bands, meridian ribs, belt rune-gates, spires), encircled by a
// SPINNING horizontal formation of floating obelisk SHARDS held by light. The
// formation spins about +Y (a serene carousel orbit), built flat in the XZ plane.
function makePrecursorRing(s) {
  const grp = group();

  grp.add(part(sph(0.28, 12), GLOW(s), 0, 0, 0)); // outer halo
  grp.add(part(sph(0.16, 10), GLOW(s), 0, 0, 0)); // inner core
  grp.add(part(sph(0.08, 8), C(s, 'gold'), 0, 0, 0)); // gold heart

  addRot(grp, cone(0.30, 0.5, 4), C(s, 'hull2'), 0, 0.25, 0); // upper diamond half
  addRot(grp, cone(0.30, 0.5, 4), C(s, 'hull2'), 0, -0.25, 0, Math.PI); // lower half
  addRot(grp, cone(0.24, 0.46, 4), C(s, 'hull'), 0, 0.23, 0, 0, Math.PI / 4, 0); // canted upper facet
  addRot(grp, cone(0.24, 0.46, 4), C(s, 'hull'), 0, -0.23, 0, Math.PI, Math.PI / 4, 0); // canted lower facet

  for (const ry of [0, Math.PI / 4]) addRot(grp, box(0.44, 0.13, 0.44), C(s, 'hull'), 0, 0, 0, 0, ry, 0); // faceted belt (octagon)
  addRot(grp, cyl(0.35, 0.35, 0.03, 8), ACC(s), 0, 0.078, 0); // upper gold rim
  addRot(grp, cyl(0.35, 0.35, 0.03, 8), ACC(s), 0, -0.078, 0); // lower gold rim

  grp.add(part(box(0.74, 0.02, 0.02), GLOW(s), 0, 0, 0)); // equatorial rune cross (E-W)
  grp.add(part(box(0.02, 0.02, 0.74), GLOW(s), 0, 0, 0)); // equatorial rune cross (N-S)
  const t = Math.atan2(0.30, 0.5);
  for (let i = 0; i < 4; i++) {
    const p = (i / 4) * Math.PI * 2;
    addRot(grp, box(0.014, 0.58, 0.014), GLOW(s), Math.cos(p) * 0.15, 0.25, Math.sin(p) * 0.15, 0, -p, t); // upper rib
    addRot(grp, box(0.014, 0.58, 0.014), GLOW(s), Math.cos(p) * 0.15, -0.25, Math.sin(p) * 0.15, 0, -p, -t); // lower rib
  }
  const t2 = Math.atan2(0.24, 0.46);
  for (let i = 0; i < 4; i++) {
    const f = ((i + 0.5) / 4) * Math.PI * 2;
    addRot(grp, box(0.02, 0.5, 0.02), C(s, 'accent'), Math.cos(f) * 0.12, 0.23, Math.sin(f) * 0.12, 0, -f, t2); // upper edge
    addRot(grp, box(0.02, 0.5, 0.02), C(s, 'accent'), Math.cos(f) * 0.12, -0.23, Math.sin(f) * 0.12, 0, -f, -t2); // lower edge
  }

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a);
    addRot(grp, box(0.1, 0.09, 0.03), C(s, 'accent'), cx * 0.32, 0, cz * 0.32, 0, -a, 0); // gate bezel
    addRot(grp, box(0.06, 0.12, 0.02), GLOW(s), cx * 0.34, 0, cz * 0.34, 0, -a, 0); // rune-slit
  }

  for (let i = 0; i < 4; i++) {
    const f = ((i + 0.5) / 4) * Math.PI * 2, cx = Math.cos(f), cz = Math.sin(f);
    addRot(grp, cone(0.032, 0.15, 4), ACC(s), cx * 0.19, 0.3, cz * 0.19, 0.34 * cz, 0, -0.34 * cx); // raked spire
    grp.add(part(sph(0.022, 5), GLOW(s), cx * 0.215, 0.4, cz * 0.215)); // spire tip-node
  }

  grp.add(part(box(0.04, 0.14, 0.04), C(s, 'accent'), 0, 0.58, 0)); // crown spire
  grp.add(part(sph(0.058, 8), GLOW(s), 0, 0.68, 0)); // crown node
  addRot(grp, cyl(0.088, 0.088, 0.01, 6), GLOW(s), 0, 0.68, 0); // crown halo ring
  grp.add(part(box(0.24, 0.014, 0.014), GLOW(s), 0, 0.68, 0)); // crown halo cross
  grp.add(part(box(0.014, 0.014, 0.24), GLOW(s), 0, 0.68, 0));
  navLight(grp, s, 'top', 0, 0.75, 0, 0.014);
  grp.add(part(box(0.03, 0.1, 0.03), C(s, 'accent'), 0, -0.57, 0)); // keel spire
  grp.add(part(sph(0.04, 6), GLOW(s), 0, -0.64, 0)); // keel node

  const wheel = group();
  const R = 0.95, NB = 8;
  for (let i = 0; i < NB; i++) {
    const a = (i / NB) * Math.PI * 2;
    preRingShard(wheel, s, a, R, 0.075, 0.3, 0.15);
    if (i % 2) navLight(wheel, s, 'star', Math.cos(a) * R, 0.36, Math.sin(a) * R, 0.01); // tip beacon (alt shards)
    preRingNode(wheel, s, a + Math.PI / NB, 0.9); // filigree node
  }
  grp.add(wheel);
  grp.userData.spin = wheel; // rotated per frame by the system view
  grp.userData.spinAxis = 'y'; // horizontal carousel orbit

  return grp;
}

// One radial SHARD-ARM built in the local X–Y plane (caller spins it about Y into
// the ring): a floating bronze obelisk at (R,H) with a rune-core/spine + crown, and
// a GLOW light-tether from the core (origin) out to the shard.
function preOutShard(s, R, H, r, len, tilt) {
  const arm = group();
  const sh = group();
  addRot(sh, cone(r, len, 4), ACC(s), 0, len * 0.5, 0); // upper gold point
  addRot(sh, cone(r, len * 0.55, 4), C(s, 'hull2'), 0, -len * 0.275, 0, Math.PI); // shorter base point
  sh.add(part(box(r * 0.36, len * 1.5, r * 0.36), GLOW(s), 0, len * 0.12, 0)); // rune spine
  sh.add(part(sph(r * 0.7, 6), GLOW(s), 0, 0, 0)); // rune-core
  sh.add(part(sph(r * 0.52, 5), GLOW(s), 0, len, 0)); // crown tip-node
  sh.position.set(R, H, 0);
  sh.rotation.z = tilt;
  arm.add(sh);
  const d = Math.hypot(R, H);
  addRot(arm, box(d, 0.007, 0.007), GLOW(s), R / 2, H / 2, 0, 0, 0, Math.atan2(H, R)); // light-tether
  arm.add(part(box(0.02, 0.02, 0.02), GLOW(s), (0.2 / d) * R, (0.2 / d) * H, 0)); // anchor bead
  return arm;
}

// Small colony OUTPOST — a sacred SHARD-SHRINE: an ornate faceted bronze octahedron
// caging a radiant golden CORE (rune-bands, rune-node bumps, plating), ringed by a
// symmetric CLUSTER of floating obelisk SHARDS held by light, two docking rune-
// GATES, obelisk spires and a crown beacon. UP = +Y.
function makePrecursorOutpost(s) {
  const grp = group();

  grp.add(part(sph(0.155, 10), GLOW(s), 0, 0, 0)); // core halo
  grp.add(part(sph(0.06, 6), C(s, 'glass'), 0, 0, 0)); // hot bead

  addRot(grp, cone(0.15, 0.3, 4), C(s, 'hull'), 0, 0.15, 0); // upper diamond half
  addRot(grp, cone(0.15, 0.3, 4), C(s, 'hull'), 0, -0.15, 0, Math.PI); // lower half
  addRot(grp, cone(0.11, 0.22, 4), C(s, 'hull2'), 0, 0.11, 0, 0, Math.PI / 4, 0); // canted plating (upper)
  addRot(grp, cone(0.11, 0.22, 4), C(s, 'hull2'), 0, -0.11, 0, Math.PI, Math.PI / 4, 0); // canted plating (lower)
  addRot(grp, cyl(0.155, 0.155, 0.055, 4), C(s, 'hull2'), 0, 0, 0); // equatorial girdle

  addRot(grp, cyl(0.175, 0.175, 0.02, 4), GLOW(s), 0, 0, 0); // waist rune-ring
  grp.add(part(box(0.62, 0.016, 0.016), GLOW(s), 0, 0, 0)); // X rune-beam
  grp.add(part(box(0.016, 0.016, 0.62), GLOW(s), 0, 0, 0)); // Z rune-beam
  grp.add(part(box(0.016, 0.62, 0.016), GLOW(s), 0, 0, 0)); // Y rune-beam
  for (const [x, y, z] of [[0.31, 0, 0], [-0.31, 0, 0], [0, 0, 0.31], [0, 0, -0.31], [0, -0.31, 0]]) grp.add(part(sph(0.026, 5), GLOW(s), x, y, z)); // rune-node bump
  for (const a of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) grp.add(part(box(0.026, 0.05, 0.026), GLOW(s), Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1)); // face rune-glint

  for (let i = 0; i < 6; i++) {
    const arm = preOutShard(s, 0.5, 0.15, 0.05, 0.2, -0.22);
    arm.rotation.y = Math.PI / 6 + (i / 6) * Math.PI * 2;
    grp.add(arm);
  }
  for (let i = 0; i < 4; i++) {
    const arm = preOutShard(s, 0.46, -0.17, 0.044, 0.16, 0.24);
    arm.rotation.y = Math.PI / 4 + (i / 4) * Math.PI * 2;
    grp.add(arm);
  }

  for (const sgn of [-1, 1]) {
    const gx = sgn * 0.34;
    addRot(grp, cyl(0.09, 0.09, 0.02, 6), C(s, 'accent'), gx, 0, 0, 0, 0, Math.PI / 2); // gate ring
    addRot(grp, cyl(0.108, 0.108, 0.008, 6), GLOW(s), gx, 0, 0, 0, 0, Math.PI / 2); // rune-lintel ring
    addRot(grp, cyl(0.055, 0.055, 0.03, 6), C(s, 'dark'), gx, 0, 0, 0, 0, Math.PI / 2); // recessed berth throat
    grp.add(part(sph(0.03, 6), GLOW(s), sgn * 0.4, 0, 0)); // berth node
    addRot(grp, box(0.12, 0.02, 0.02), C(s, 'hull2'), sgn * 0.24, 0, 0); // gate spar
    grp.add(part(box(0.12, 0.008, 0.008), GLOW(s), sgn * 0.24, 0.015, 0)); // rune line
    navLight(grp, s, sgn > 0 ? 'star' : 'port', gx, 0.02, 0.052, 0.012);
  }

  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i / 4) * Math.PI * 2, sx = Math.cos(a) * 0.12, sz = Math.sin(a) * 0.12;
    addRot(grp, cone(0.02, 0.1, 4), C(s, 'accent'), sx, 0.24, sz); // spire obelisk
    grp.add(part(box(0.016, 0.016, 0.016), GLOW(s), sx, 0.3, sz)); // spire tip
  }

  addRot(grp, cone(0.035, 0.14, 4), C(s, 'accent'), 0, 0.42, 0); // crown finial
  grp.add(part(box(0.01, 0.16, 0.01), GLOW(s), 0, 0.4, 0)); // beacon mast
  grp.add(part(sph(0.04, 6), GLOW(s), 0, 0.5, 0)); // beacon halo
  navLight(grp, s, 'top', 0, 0.5, 0, 0.02);
  runningLights(grp, s, 0.5, -0.17, 0.0);

  return grp;
}

// One ornate module of the rune-tower: an octagonal gold drum + a 45°-canted diamond
// facet, a girdle plate belt, rune-bands top & bottom, four vertical facet rune-lines
// capped by rune-node bumps.
function preRuneDrum(grp, s, y, r, h, slotDrum, slotFacet) {
  grp.add(part(cyl(r, r * 1.03, h, 8), C(s, slotDrum), 0, y, 0)); // octagonal drum
  addRot(grp, box(r * 1.5, h * 0.9, r * 1.5), C(s, slotFacet), 0, y, 0, 0, Math.PI / 4); // canted diamond facet
  grp.add(part(cyl(r * 1.07, r * 1.07, h * 0.18, 8), C(s, 'accent'), 0, y, 0)); // girdle plate belt
  addRot(grp, cyl(r * 1.11, r * 1.11, 0.02, 8), GLOW(s), 0, y + h * 0.44, 0, 0, Math.PI / 8); // upper rune-band
  addRot(grp, cyl(r * 1.11, r * 1.11, 0.02, 8), GLOW(s), 0, y - h * 0.44, 0, 0, Math.PI / 8); // lower rune-band
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4, cx = Math.cos(a), cz = Math.sin(a);
    grp.add(part(box(0.016, h * 0.74, 0.016), GLOW(s), cx * r * 1.05, y, cz * r * 1.05)); // facet rune-line
    grp.add(part(box(0.045, 0.045, 0.045), GLOW(s), cx * r * 1.06, y + h * 0.16, cz * r * 1.06)); // rune-node bump
  }
}

// A floating obelisk rune-vane framing the intake beam: a slim bronze spike pointing
// DOWN (−Y), a rune spine, an anchor node, and a light-tether to the throat.
function preSiphonShard(grp, s, a, R, y) {
  const x = Math.cos(a) * R, z = Math.sin(a) * R;
  addRot(grp, cone(0.045, 0.24, 4), ACC(s), x, y, z, Math.PI, 0, a); // downward obelisk spike
  grp.add(part(box(0.016, 0.24, 0.016), GLOW(s), x, y, z)); // rune spine
  grp.add(part(box(0.04, 0.04, 0.04), GLOW(s), x, y + 0.12, z)); // anchor node
  addRot(grp, box(R * 0.62, 0.012, 0.012), GLOW(s), x * 0.55, y + 0.06, z * 0.55, 0, -a, 0); // light-tether
}

// A big floating flank shard held by light: a bronze bipyramid with a rune-core/
// spine, twin tip-nodes, a light-tether to the tower, and a glowing CONTAINMENT ORB
// cradled below in two bronze hoops. Caller mirrors across ±x / ±z.
function preFlankShard(grp, s, x, y, z) {
  const d = Math.hypot(x, z), ang = Math.atan2(z, x);
  addRot(grp, cone(0.058, 0.24, 4), C(s, 'hull2'), x, y + 0.12, z, 0, ang, 0); // upper point
  addRot(grp, cone(0.058, 0.24, 4), C(s, 'hull'), x, y - 0.12, z, Math.PI, ang, 0); // lower point
  grp.add(part(box(0.024, 0.42, 0.024), GLOW(s), x, y, z)); // rune spine
  grp.add(part(sph(0.05, 6), GLOW(s), x, y, z)); // rune-core
  grp.add(part(box(0.05, 0.05, 0.05), GLOW(s), x, y + 0.24, z)); // upper tip-node
  grp.add(part(box(0.05, 0.05, 0.05), GLOW(s), x, y - 0.24, z)); // lower tip-node
  addRot(grp, box(d * 0.5, 0.014, 0.014), GLOW(s), x * 0.6, y + 0.02, z * 0.6, 0, -ang, 0); // light-tether to tower
  const oy = y - 0.36;
  grp.add(part(sph(0.055, 6), GLOW(s), x, oy, z)); // orb of drawn light
  addRot(grp, cyl(0.062, 0.062, 0.012, 6), C(s, 'hull2'), x, oy, z); // equatorial hoop
  addRot(grp, cyl(0.062, 0.062, 0.012, 6), C(s, 'accent'), x, oy, z, Math.PI / 2); // meridian hoop
  grp.add(part(box(0.012, 0.06, 0.012), GLOW(s), x, y - 0.27, z)); // short tether shard→orb
}

// Gas COLLECTOR — a sacred RUNE-SIPHON: an ornate gold rune-TOWER of stacked faceted
// prisms drawing gas DOWN a luminous intake beam to a glowing golden mouth-ring below,
// framed by a ring of floating obelisk rune-vanes, escorted by floating flank shards
// holding containment orbs of drawn light. UP = +Y, the intake beam reaches DOWN −Y.
function makePrecursorCollector(s) {
  const grp = group();

  preRuneDrum(grp, s, 0.30, 0.30, 0.22, 'hull', 'hull2'); // base gem
  preRuneDrum(grp, s, 0.52, 0.235, 0.18, 'hull2', 'accent'); // mid gem
  preRuneDrum(grp, s, 0.70, 0.165, 0.15, 'hull', 'hull2'); // upper gem
  addRot(grp, cone(0.16, 0.16, 8), C(s, 'hull2'), 0, 0.845, 0, 0, Math.PI / 8); // faceted crown cap

  grp.add(part(sph(0.14, 6), GLOW(s), 0, 0.42, 0)); // core halo
  grp.add(part(box(0.03, 0.66, 0.03), GLOW(s), 0, 0.5, 0)); // core rune-spine

  addRot(grp, cone(0.05, 0.22, 4), ACC(s), 0, 1.0, 0); // central obelisk spire
  grp.add(part(sph(0.062, 8), GLOW(s), 0, 0.95, 0)); // beacon halo
  grp.add(part(sph(0.03, 8), NAV(s, 'top'), 0, 0.95, 0)); // white beacon core
  grp.add(part(box(0.26, 0.014, 0.014), GLOW(s), 0, 0.95, 0)); // crown halo cross
  grp.add(part(box(0.014, 0.014, 0.26), GLOW(s), 0, 0.95, 0));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    addRot(grp, cone(0.03, 0.14, 4), ACC(s), Math.cos(a) * 0.135, 0.9, Math.sin(a) * 0.135, 0, a, 0); // ringed spire
    grp.add(part(box(0.036, 0.036, 0.036), GLOW(s), Math.cos(a) * 0.135, 0.98, Math.sin(a) * 0.135)); // spire tip node
  }
  navLight(grp, s, 'top', 0, 1.11, 0, 0.014);

  grp.add(part(cyl(0.32, 0.32, 0.05, 12), C(s, 'dark'), 0, 0.11, 0)); // throat collar
  addRot(grp, cyl(0.335, 0.335, 0.022, 12), ACC(s), 0, 0.075, 0, 0, Math.PI / 12); // gold rune ring
  addRot(grp, cyl(0.345, 0.345, 0.02, 12), GLOW(s), 0, 0.03, 0, 0, Math.PI / 12); // glowing rune band
  grp.add(part(cyl(0.30, 0.13, 0.30, 12), C(s, 'hull2'), 0, -0.08, 0)); // narrowing throat funnel
  grp.add(part(sph(0.15, 6), GLOW(s), 0, -0.06, 0)); // intake fire core
  grp.add(part(cyl(0.02, 0.14, 0.72, 10), GLOW(s), 0, -0.58, 0)); // outer beam sheath
  grp.add(part(cyl(0.012, 0.075, 0.74, 8), GLOW(s), 0, -0.58, 0)); // bright mid beam
  grp.add(part(box(0.032, 0.76, 0.032), GLOW(s), 0, -0.58, 0)); // hot core spine
  grp.add(part(cyl(0.205, 0.205, 0.045, 14), C(s, 'dark'), 0, -0.95, 0)); // mouth housing rim
  grp.add(part(cyl(0.185, 0.185, 0.03, 14), ACC(s), 0, -0.965, 0)); // gold mouth rim
  grp.add(part(cyl(0.17, 0.17, 0.032, 14), GLOW(s), 0, -0.95, 0)); // glowing mouth ring
  grp.add(part(sph(0.13, 6), GLOW(s), 0, -0.9, 0)); // mouth core fire
  addRot(grp, cone(0.155, 0.14, 10), GLOW(s), 0, -1.03, 0, Math.PI); // downward drawn-gas plume
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    grp.add(part(box(0.03, 0.03, 0.03), GLOW(s), Math.cos(a) * 0.185, -0.95, Math.sin(a) * 0.185)); // mouth rune-node
  }

  for (let i = 0; i < 6; i++) preSiphonShard(grp, s, (i / 6) * Math.PI * 2, 0.27, -0.42); // siphon-ring vanes

  preFlankShard(grp, s, 0.62, 0.42, 0);
  preFlankShard(grp, s, -0.62, 0.42, 0);
  preFlankShard(grp, s, 0, 0.42, 0.62);
  preFlankShard(grp, s, 0, 0.42, -0.62);

  runningLights(grp, s, 0.34, 0.30, 0);
  navLight(grp, s, 'top', 0, 0.30, 0.34, 0.016);
  navLight(grp, s, 'top', 0, 0.30, -0.34, 0.016);

  return grp;
}

export const FACTION = {
  id: 'precursor',
  name: 'Предтечи',
  colors: { hull: 0x5a4a26, hull2: 0x7a6230, accent: 0xc9a24b, dark: 0x241d10, glass: 0xffe6a0, gold: 0xffd27a },
  accent: 0xffcf6a,
  glow: 0xffd27a,
  nav: { port: 0xffd27a, star: 0xffe6a0, top: 0xffffff },
  lore: 'Древний флот Предтеч: золото-бронзовые корпуса, испещрённые светящимися рунами, вокруг которых парят геометрические осколки, удерживаемые светом.',

  // Full bespoke line — every role has its own sacred gold-geometry hull (no
  // shared flourish; each ship carries its own rune-bands + floating shards).
  roles: {
    scout: makePrecursorScout,
    fighter: makePrecursorFighter,
    interceptor: makePrecursorInterceptor,
    gunship: makePrecursorGunship,
    corvette: makePrecursorCorvette,
    freighter: makePrecursorFreighter,
    tanker: makePrecursorTanker,
    liner: makePrecursorLiner,
    flagship: makePrecursorFlagship,
  },

  // Bespoke station builders (completely different geometry per kind, no rings).
  stations: { ring: makePrecursorRing, outpost: makePrecursorOutpost, collector: makePrecursorCollector },
};
