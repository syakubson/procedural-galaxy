// Faction style-kit: РОЙ (Swarm) — an organic, grown fleet (#11 matrix).
// Consumed by every role builder in roles.js: amber-brown chitinous carapace,
// mossy-green ridges and bio-luminescent green glow restyle all 9 silhouettes
// into one living swarm. The `flourish` hook adds the grown, not-built reading:
// rounded dorsal chitin bulges, curved ridge fins and bio-lum spots.
//
// Style schema is identical to ALLIANCE in factions.js — see that file's header.

import { group, C, ACC, GLOW, NAV, box, cyl, sph, cone, part, addRot, engineGlow, navLight, runningLights, antenna } from './style.js';

const R = (v) => Math.round(v * 1000) / 1000; // keep cached geo keys tidy

export const FACTION = {
  id: 'swarm',
  name: 'Рой',
  colors: { hull: 0x5e5226, hull2: 0x7a6a30, accent: 0x46551f, dark: 0x241f10, glass: 0x9cff5a, gold: 0xb89638 },
  accent: 0x9aff3a,
  glow: 0x7aff5a,
  nav: { port: 0xff8a2a, star: 0x9aff3a, top: 0xc8ff8a },
  lore: 'Живой рой выращенных кораблей: хитиновые панцири, мшистые гребни и био-люминесцентное свечение вместо заводской стали.',

  // Bespoke silhouette: the flagship is a grown leviathan, not the shared wedge.
  roles: { flagship: makeSwarmFlagship },

  // Bespoke stations — fully different geometry per type, NOT a recoloured wheel.
  // Each is a grown hive structure with its own shape (see builders below).
  stations: { ring: makeSwarmRing, outpost: makeSwarmOutpost, collector: makeSwarmCollector },

  // grp: assembled ship (nose +Z, tail -Z, centred). Add 3-8 signature meshes.
  flourish(grp, roleId, style) {
    const carapace = C(style, 'hull2'); // rounded chitin bulges
    const ridge = C(style, 'accent'); // mossy ridge fins
    const biolum = GLOW(style); // bio-luminescent spot (additive)

    // Per-role carapace tuning: scale `u`, dorsal extent `zEnd`, bulge count
    // `n`, ridge-fin count `fins`. Bigger, denser carapace on gunship/flagship.
    const P = {
      scout: { u: 0.9, zEnd: 0.05, n: 3, fins: 0 },
      fighter: { u: 1.0, zEnd: 0.06, n: 3, fins: 0 },
      interceptor: { u: 0.9, zEnd: 0.07, n: 3, fins: 0 },
      gunship: { u: 1.5, zEnd: 0.1, n: 4, fins: 2 },
      corvette: { u: 1.6, zEnd: 0.16, n: 4, fins: 2 },
      freighter: { u: 1.5, zEnd: 0.16, n: 4, fins: 1 },
      tanker: { u: 1.5, zEnd: 0.14, n: 4, fins: 1 },
      liner: { u: 1.4, zEnd: 0.2, n: 4, fins: 1 },
      flagship: { u: 3.0, zEnd: 0.32, n: 5, fins: 2 },
    };
    const p = P[roleId] || P.fighter;
    const r0 = 0.013 * p.u; // base bulge radius
    const y0 = 0.018 * p.u; // dorsal spine height

    // 1) Dorsal chitin bulges — rounded carapace segments clustered along the
    //    spine from tail toward mid, tapering forward so it reads as grown.
    let frontBulge = null;
    for (let i = 0; i < p.n; i++) {
      const t = p.n === 1 ? 0.5 : i / (p.n - 1);
      const z = -p.zEnd + t * (p.zEnd * 1.5); // tail(-) … just past centre(+)
      const r = R(r0 * (1 - 0.35 * t)); // taper toward the nose
      const m = part(sph(r, 8), carapace, 0, y0 + r * 0.4, z);
      grp.add(m);
      frontBulge = { z, r, y: y0 + r * 0.4 };
    }

    // 2) Curved ridge fins — thin mossy boxes, swept/tilted so they look like
    //    organic spines rather than bolted plates.
    const finGeo = box(0.006, R(0.05 * p.u), R(0.06 * p.u));
    if (p.fins === 1) {
      // single dorsal sail along the centreline, raked back
      addRot(grp, finGeo, ridge, 0, y0 + 0.03 * p.u, -p.zEnd * 0.4, 0.5, 0, 0);
    } else if (p.fins === 2) {
      for (const sx of [-1, 1]) {
        addRot(grp, finGeo, ridge, sx * 0.045 * p.u, y0 * 0.5, -p.zEnd * 0.35, 0.4, 0, sx * 0.55);
      }
    }

    // 3) Bio-luminescent spot — a soft additive green node on the front bulge,
    //    the living-glow signature dotting the carapace.
    if (frontBulge) {
      grp.add(part(sph(R(0.5 * frontBulge.r), 6), biolum, 0, frontBulge.y + frontBulge.r, frontBulge.z));
    } else {
      grp.add(part(sph(R(0.6 * r0), 6), NAV(style, 'star'), 0, y0, 0));
    }
  },
};

// ---------------------------------------------------------------------------
// BESPOKE FLAGSHIP — a living hive-leviathan. Instead of the shared wedge, the
// body is a chain of stretched ovoids strung along Z into one bulbous, slightly
// asymmetric spine: largest at the core, tapering to the head (+Z) and the
// engine-tail (−Z). Curved carapace ridges, forward-reaching tendril arms and
// clustered bio-luminescent pods make it read as a grown beast, not a hull.
// ~1.0 long in Z, ~0.3 wide. Opaque parts use C/ACC, glow uses GLOW/NAV.
function makeSwarmFlagship(s) {
  const grp = group();

  // Segmented organic body — overlapping ovoids form a continuous bulbous spine.
  const segs = [
    { z: 0.4, r: 0.06, slot: 'hull', y: 0.0, sz: 1.3 }, // head
    { z: 0.26, r: 0.1, slot: 'hull2', y: 0.012, sz: 1.4 },
    { z: 0.08, r: 0.14, slot: 'hull', y: 0.0, sz: 1.5 }, // bulbous core
    { z: -0.1, r: 0.12, slot: 'hull2', y: 0.008, sz: 1.4 },
    { z: -0.26, r: 0.09, slot: 'hull', y: 0.0, sz: 1.4 },
    { z: -0.39, r: 0.06, slot: 'dark', y: 0.0, sz: 1.5 }, // tail gland
  ];
  for (const seg of segs) {
    const m = part(sph(seg.r, 12), C(s, seg.slot), 0, seg.y, seg.z);
    m.scale.z = seg.sz; // stretch each sphere into an ovoid along the body axis
    grp.add(m);
  }

  // Dorsal carapace ridges — thin mossy spines, swept and tilted, asymmetric.
  addRot(grp, box(0.008, 0.13, 0.1), C(s, 'accent'), 0, 0.14, 0.0, 0.45, 0, 0.12);
  addRot(grp, box(0.008, 0.1, 0.09), C(s, 'accent'), 0.03, 0.1, -0.18, 0.65, 0, -0.28);
  addRot(grp, box(0.006, 0.08, 0.07), C(s, 'accent'), -0.02, 0.09, 0.2, 0.4, 0, 0.32);

  // Forward-reaching tendril arms — thin grasping limbs off the head.
  for (const sx of [-1, 1]) {
    addRot(grp, box(0.01, 0.01, 0.16), C(s, 'hull2'), sx * 0.05, -0.02, 0.46, 0.16, sx * 0.22, 0);
  }
  addRot(grp, box(0.008, 0.008, 0.13), C(s, 'hull2'), 0.02, -0.06, 0.45, 0.32, -0.16, 0); // asymmetric

  // The "eye" — a glowing sensor cluster set into the head.
  grp.add(part(sph(0.03, 10), C(s, 'glass'), 0, 0.025, 0.38));

  // Bio-luminescent pod clusters — small additive green nodes along the body.
  const pods = [
    [0.05, 0.05, 0.2], [-0.06, 0.04, 0.05], [0.07, -0.02, -0.05],
    [-0.05, 0.06, -0.18], [0.0, 0.11, 0.08], [0.04, -0.05, 0.27],
  ];
  for (const pod of pods) grp.add(part(sph(0.018, 8), GLOW(s), pod[0], pod[1], pod[2]));

  // Engine bloom at the tail (−Z) + signs of life.
  engineGlow(grp, s, 0.0, 0.0, -0.47, 0.05);
  engineGlow(grp, s, 0.05, 0.0, -0.44, 0.03);
  engineGlow(grp, s, -0.05, 0.0, -0.44, 0.03);
  runningLights(grp, s, 0.15, 0.02, 0.0);
  navLight(grp, s, 'top', 0, 0.16, 0.04);
  antenna(grp, s, 0.0, 0.14, -0.06, 0.08);

  return grp;
}

// ===========================================================================
// BESPOKE STATIONS — completely different geometry per type. The Swarm grows
// its installations rather than building them: no metal wheel, no struts. Each
// builder returns its own Group (the toolkit's MeshBasic parts bake cleanly).
// ===========================================================================

// Fuse a cluster of stretched ovoids into one asymmetric organic blob, and dot
// it with bio-luminescent green nodes. Shared by all three station builds.
function hiveBlob(grp, s, segs) {
  for (const seg of segs) {
    const m = part(sph(seg.r, 12), C(s, seg.slot || 'hull'), seg.x, seg.y, seg.z);
    if (seg.sz) m.scale.set(seg.sx || 1, seg.sy || 1, seg.sz);
    grp.add(m);
  }
}
function biolumNodes(grp, s, nodes, r = 0.06) {
  for (const n of nodes) grp.add(part(sph(r, 8), GLOW(s), n[0], n[1], n[2]));
}

// RING → home HUB (biggest). A grown HIVE: a fused, asymmetric clump of pods,
// bio-lum nodes and a couple of curved tendrils — with a living "swarm" of pods
// slowly orbiting it (the spin sub-group, in the XY plane → rotates about Z).
function makeSwarmRing(s) {
  const grp = group();

  // Asymmetric fused-pod core.
  hiveBlob(grp, s, [
    { r: 0.5, x: 0.0, y: 0.0, z: 0.0, slot: 'hull', sz: 1.2 },
    { r: 0.42, x: 0.36, y: 0.1, z: 0.05, slot: 'hull2', sz: 1.1 },
    { r: 0.38, x: -0.3, y: -0.16, z: 0.12, slot: 'hull', sz: 1.15 },
    { r: 0.34, x: 0.06, y: 0.42, z: -0.14, slot: 'hull2', sz: 1.0 },
    { r: 0.3, x: -0.12, y: -0.38, z: -0.2, slot: 'dark', sz: 1.2 },
    { r: 0.27, x: 0.28, y: -0.22, z: 0.34, slot: 'hull', sz: 1.0 },
  ]);

  // Bio-lum nodes studding the carapace.
  biolumNodes(grp, s, [
    [0.45, 0.25, 0.2], [-0.4, 0.1, 0.25], [0.1, 0.55, 0.05],
    [-0.25, -0.45, 0.1], [0.3, -0.35, -0.3], [0.0, 0.0, 0.55],
  ], 0.07);

  // A couple of curved tendrils reaching out from the hive (segmented boxes,
  // each segment a little more swept → reads as a living, curling limb).
  for (const sx of [-1, 1]) {
    addRot(grp, box(0.05, 0.05, 0.34), C(s, 'accent'), sx * 0.5, 0.18, 0.35, 0.2, sx * 0.4, 0.0);
    addRot(grp, box(0.04, 0.04, 0.28), C(s, 'accent'), sx * 0.66, 0.32, 0.6, 0.55, sx * 0.7, 0.0);
    grp.add(part(sph(0.05, 8), ACC(s), sx * 0.78, 0.46, 0.78)); // glowing tendril tip
  }

  // Living swarm orbiting the hive — small pods + bio-lum motes in the XY plane.
  const swarm = group();
  const N = 9;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const x = Math.cos(a) * 1.1;
    const y = Math.sin(a) * 1.1;
    swarm.add(part(sph(0.07, 8), C(s, 'hull2'), x, y, (i % 2 ? 0.06 : -0.06)));
    swarm.add(part(sph(0.045, 6), GLOW(s), x * 1.04, y * 1.04, 0));
  }
  grp.add(swarm);
  grp.userData.spin = swarm; // baked separately, rotates about Z per frame

  return grp;
}

// OUTPOST → small colony station: a single compact pod-cluster with a sensor
// stalk and a few glowing nodes. Grown, minimal, no orbiting swarm.
function makeSwarmOutpost(s) {
  const grp = group();
  hiveBlob(grp, s, [
    { r: 0.32, x: 0.0, y: 0.0, z: 0.0, slot: 'hull', sz: 1.2 },
    { r: 0.24, x: 0.2, y: 0.14, z: 0.06, slot: 'hull2', sz: 1.1 },
    { r: 0.2, x: -0.16, y: -0.12, z: 0.1, slot: 'dark', sz: 1.1 },
  ]);
  // a short curled tendril + a sensor stalk (organic antenna)
  addRot(grp, box(0.035, 0.035, 0.26), C(s, 'accent'), 0.26, -0.16, 0.2, 0.4, 0.5, 0.0);
  grp.add(part(cyl(0.02, 0.04, 0.36, 8), C(s, 'hull2'), 0.0, 0.42, 0.0));
  biolumNodes(grp, s, [[0.22, 0.26, 0.16], [-0.18, 0.06, 0.22], [0.0, 0.62, 0.0]], 0.055);
  navLight(grp, s, 'top', 0.0, 0.64, 0.0, 0.05);
  return grp;
}

// COLLECTOR → gas skimmer: a fleshy proboscis/funnel dipping DOWN (−Y) into the
// gas, a bulbous storage body above, segmented chitin rings down the trunk and
// bio-lum nodes. The wide cone mouth opens downward (default cone base is −Y).
function makeSwarmCollector(s) {
  const grp = group();

  // Bulbous storage body up top.
  hiveBlob(grp, s, [
    { r: 0.34, x: 0.0, y: 0.34, z: 0.0, slot: 'hull', sz: 1.1 },
    { r: 0.24, x: 0.22, y: 0.48, z: 0.04, slot: 'hull2', sz: 1.0 },
    { r: 0.22, x: -0.18, y: 0.4, z: -0.08, slot: 'hull2', sz: 1.0 },
  ]);

  // Fleshy trunk descending toward the gas.
  grp.add(part(cyl(0.12, 0.2, 0.55, 12), C(s, 'hull'), 0.0, -0.08, 0.0));
  // Segmented chitin rings down the trunk.
  for (const yy of [0.05, -0.12, -0.28]) {
    grp.add(part(cyl(0.16, 0.16, 0.05, 12), C(s, 'accent'), 0.0, yy, 0.0));
  }
  // Flared intake mouth dipping into the gas (wide cone base points −Y).
  grp.add(part(cone(0.34, 0.4, 14), C(s, 'dark'), 0.0, -0.6, 0.0));
  // Bio-lum nodes glowing down the proboscis + a top beacon.
  biolumNodes(grp, s, [[0.18, 0.5, 0.18], [-0.16, 0.36, -0.16], [0.0, -0.05, 0.16], [0.0, -0.4, 0.0]], 0.05);
  navLight(grp, s, 'top', 0.0, 0.72, 0.0, 0.05);
  return grp;
}
