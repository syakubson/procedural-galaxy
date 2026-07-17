// Faction style-kit: SWARM — a fleet of GROWN void-LEVIATHANS (not built: grown).
// Every ship is a strange living sea-beast: a chain of overlapping chitinous
// ovoids with a gaping fanged maw, flowing membrane flukes, trailing tendrils and
// bio-luminescent organs glowing through amber flesh. A FULL bespoke line — all
// nine roles + three grown hive stations are hand-built here in this one leviathan
// language, the flagship being the matriarch the drone-swarm orbits. Style schema
// matches the ALLIANCE exemplar in factions.js — see that file's header.

import {
  group, box, cyl, sph, cone, part, addRot,
  C, ACC, GLOW, NAV, navLight, antenna, blister,
} from './style.js';

// Per-individual colour — each grown leviathan (and each hive station) is its own
// creature, so every one gets its OWN hue: a distinct flesh (hull/hull2), frill
// (accent) and bioluminescence (glow/glass/signature) over the shared void base.
// All stay dark and eerie, so the fleet still reads as one species — but each is a
// visibly different shade (indigo, violet, magenta, crimson, teal, plum, rose…).
// Keyed by role/station → its own material-cache id so the tints never bleed.
const SWARM_TINTS = {
  // ships
  scout: { hull: 0x232a48, hull2: 0x364065, accent: 0x3c4a80, glass: 0xaac4ff, glow: 0x6f92ff, sig: 0x6f92ff }, // cold indigo-blue
  fighter: { hull: 0x2e2440, hull2: 0x413458, accent: 0x5a3f7a, glass: 0xc77bff, glow: 0xc060ff, sig: 0xb14cff }, // violet (base)
  interceptor: { hull: 0x3a2038, hull2: 0x582f4e, accent: 0x7a3f68, glass: 0xff9ce8, glow: 0xff5cd6, sig: 0xff4ccc }, // hot magenta-pink
  gunship: { hull: 0x3a1f2a, hull2: 0x582b3c, accent: 0x7a3f4e, glass: 0xff8098, glow: 0xf05070, sig: 0xff4060 }, // crimson-violet warbeast
  corvette: { hull: 0x2a2150, hull2: 0x3c3272, accent: 0x50407e, glass: 0xc492ff, glow: 0xa860ff, sig: 0x9a4cff }, // royal purple
  freighter: { hull: 0x342a3c, hull2: 0x4c3c56, accent: 0x60506a, glass: 0xcaa8e0, glow: 0xa77ad0, sig: 0x9666bc }, // dusty plum
  tanker: { hull: 0x1e2e38, hull2: 0x2e4a54, accent: 0x3a5e66, glass: 0x9ce8ff, glow: 0x50c8e0, sig: 0x40b8d8 }, // cold teal-cyan
  liner: { hull: 0x3a2840, hull2: 0x543a5a, accent: 0x6a4a70, glass: 0xffb4ee, glow: 0xe07adc, sig: 0xd066cc }, // warm rose-pink
  flagship: { hull: 0x321f44, hull2: 0x48305f, accent: 0x603f80, glass: 0xe088ff, glow: 0xd24cff, sig: 0xc63cff }, // deep royal magenta
  // stations
  ring: { hull: 0x2c2444, hull2: 0x3f345c, accent: 0x574080, glass: 0xcf88ff, glow: 0xbe5cff, sig: 0xb04cff }, // rich violet hub
  outpost: { hull: 0x263048, hull2: 0x3a4a68, accent: 0x40527e, glass: 0xa8c4ff, glow: 0x7fa8ff, sig: 0x7098ff }, // steel-indigo colony
  collector: { hull: 0x362438, hull2: 0x50354e, accent: 0x6e3f64, glass: 0xf0a0e0, glow: 0xd060c0, sig: 0xc84cb0 }, // dusky magenta skimmer
};

// Return a per-item variant of the faction style with its own flesh/frill/glow hue
// and cache id, so each leviathan & station is a distinct shade of the void family.
function swarmTint(base, key) {
  const t = SWARM_TINTS[key];
  if (!t) return base;
  return {
    ...base,
    id: base.id + '_' + key,
    colors: { ...base.colors, hull: t.hull, hull2: t.hull2, accent: t.accent, glass: t.glass },
    accent: t.sig,
    glow: t.glow,
  };
}

export const FACTION = {
  id: 'swarm',
  name: 'Рой',
  colors: { hull: 0x2e2440, hull2: 0x413458, accent: 0x5a3f7a, dark: 0x14101f, glass: 0xc77bff, gold: 0x9a7fb0 },
  accent: 0xb14cff,
  glow: 0xc060ff,
  nav: { port: 0xff5aa0, star: 0x9a6bff, top: 0xe6c8ff },
  lore: 'Живой рой выращенных левиафанов: тёмная фиолетовая плоть и фиолетово-магентовое био-люминесцентное свечение из глубин пустоты вместо заводской стали.',

  // Per-faction ship names (#hero): the Swarm's beasts aren't «Грузовик»/«Танкер»
  // — each role is a grown creature with its own name. Consumed by the codex
  // catalog + the in-world info panel; other factions fall back to ROLES names.
  names: {
    scout: 'Малёк',
    fighter: 'Жало',
    interceptor: 'Стрекало',
    gunship: 'Таран',
    corvette: 'Панцирник',
    freighter: 'Носитель',
    tanker: 'Нектарник',
    liner: 'Ковчег',
    flagship: 'Исполин',
  },

  // Full bespoke line — every role is its own grown leviathan-beast (no shared
  // silhouette, so no `flourish`); each ship carries its own maw/flukes/organs.
  roles: {
    scout: (s) => makeSwarmScout(swarmTint(s, 'scout')),
    fighter: (s) => makeSwarmFighter(swarmTint(s, 'fighter')),
    interceptor: (s) => makeSwarmInterceptor(swarmTint(s, 'interceptor')),
    gunship: (s) => makeSwarmGunship(swarmTint(s, 'gunship')),
    corvette: (s) => makeSwarmCorvette(swarmTint(s, 'corvette')),
    freighter: (s) => makeSwarmFreighter(swarmTint(s, 'freighter')),
    tanker: (s) => makeSwarmTanker(swarmTint(s, 'tanker')),
    liner: (s) => makeSwarmLiner(swarmTint(s, 'liner')),
    flagship: (s) => makeSwarmFlagship(swarmTint(s, 'flagship')),
  },

  // Bespoke grown-hive stations — fully different geometry per type, NOT a
  // recoloured wheel. The hub carries an orbiting living swarm (userData.spin).
  stations: {
    ring: (s) => makeSwarmRing(swarmTint(s, 'ring')),
    outpost: (s) => makeSwarmOutpost(swarmTint(s, 'outpost')),
    collector: (s) => makeSwarmCollector(swarmTint(s, 'collector')),
  },
};

// ===========================================================================
// BESPOKE FLEET — 9 grown leviathan-beast role hulls
// ===========================================================================

// SWARM SCOUT — a small, fast recon eel grown from the void-leviathan swarm.
// A slender darting body (a chain of overlapping stretched ovoids, gently arched
// and x-wobbled so it undulates), fronted by ONE oversized glowing sensory eye
// ringed by a little lure-cluster — the whole head is that luminous organ. Only
// a small probing proboscis-mouth below it (no bite). Long sensory whisker-feelers
// stream back off the cheeks, soft undulating fin-frills skirt each flank (it SWIMS,
// no engines/wings), a dorsal glow-line + belly organs pulse through the flesh, and
// a small bio-lum gland glows at the tail. The fleet's living sensor. Nose = +Z.
function makeSwarmScout(s) {
  const grp = group();

  // --- Slender eel body: a chain of overlapping ovoids, fattest at the small
  //     shoulders behind the head, arching gently up over mid then tapering to a
  //     thin whip tail. y-arch + x-wobble → a living, darting beast. ~0.33 in Z. ---
  const sctSegs = [
    { z: 0.085, r: 0.027, slot: 'hull2', x: 0.0, y: 0.006, sz: 1.1 }, // head base, behind the eye
    { z: 0.045, r: 0.033, slot: 'hull', x: 0.003, y: 0.012, sz: 1.2 }, // small shoulders (widest)
    { z: 0.0, r: 0.03, slot: 'hull2', x: -0.003, y: 0.016, sz: 1.3 }, // arched back peak
    { z: -0.045, r: 0.024, slot: 'hull', x: 0.003, y: 0.012, sz: 1.35 },
    { z: -0.09, r: 0.017, slot: 'hull2', x: -0.003, y: 0.004, sz: 1.4 },
    { z: -0.13, r: 0.011, slot: 'hull', x: 0.002, y: -0.004, sz: 1.45 }, // whip tail
    { z: -0.165, r: 0.007, slot: 'dark', x: 0.0, y: -0.01, sz: 1.5 }, // tail base
    { z: -0.195, r: 0.004, slot: 'dark', x: 0.0, y: -0.015, sz: 1.5 }, // tail tip
  ];
  for (const g of sctSegs) {
    const m = part(sph(g.r, 12), C(s, g.slot), g.x, g.y, g.z);
    m.scale.z = g.sz; // stretch each sphere into an ovoid along the body axis
    grp.add(m);
  }

  // --- The HEAD is one giant luminous sensory EYE. A dark bony socket cups the
  //     front of the head, a big glowing green lens fills it, and a hot signature
  //     pupil-core burns at its centre. This oversized eye dominates the creature. --
  const ey = 0.01; // eye vertical centre (a touch above the body axis)
  addRot(grp, cone(0.05, 0.075, 18), C(s, 'dark'), 0, ey, 0.07, -Math.PI / 2); // deep dark socket, rim protrudes to +Z
  addRot(grp, cone(0.036, 0.02, 16), C(s, 'dark'), 0, ey, 0.108, -Math.PI / 2); // dark iris rim framing the lens
  grp.add(part(sph(0.04, 14), GLOW(s), 0, ey, 0.112)); // glowing lens halo (additive, blooms out)
  grp.add(part(sph(0.024, 14), C(s, 'glass'), 0, ey, 0.122)); // the lens itself (opaque glowing green)
  grp.add(part(sph(0.028, 14), GLOW(s), 0, ey, 0.126)); // bloom over the lens
  grp.add(part(sph(0.011, 10), ACC(s), 0, ey, 0.14)); // hot pupil-core at the very front

  // --- LURE-CLUSTER: three little bio-lum bulbs on dark stalks splaying forward
  //     off the socket rim — a top spike and a mirrored side pair. The eerie tell. --
  const sctLure = (x, y, z, rz) => {
    addRot(grp, box(0.005, 0.005, 0.05), C(s, 'dark'), x, y, z, -0.5, 0, rz); // stalk, up-forward
    grp.add(part(sph(0.009, 8), GLOW(s), x * 1.4, y + 0.02, z + 0.05)); // dangling glow bulb
  };
  sctLure(0, ey + 0.035, 0.1, 0); // top spike
  for (const sx of [-1, 1]) sctLure(sx * 0.03, ey + 0.012, 0.095, sx * 0.5); // side pair

  // --- Small probing PROBOSCIS-mouth: a slim bony tube reaching forward under the
  //     eye, tipped with a faint glow. A feeler-mouth, not a maw. --------------------
  addRot(grp, cone(0.008, 0.045, 8), C(s, 'gold'), 0, ey - 0.028, 0.11, -Math.PI / 2); // proboscis, tip to +Z
  grp.add(part(sph(0.006, 6), GLOW(s), 0, ey - 0.028, 0.135)); // sensing tip ember

  // --- Fin-FRILL: a soft undulating skirt of flesh along EACH flank — a moray/
  //     cuttlefish ribbon hugging the body just proud of it, waving gently in y so
  //     it reads as a swimming membrane, never a wing. Mirrored across X=0. ----------
  const sctFrill = (sx) => {
    const f = group();
    const zs = [0.05, 0.01, -0.03, -0.07, -0.11, -0.145]; // along the body, shoulders → tail
    const hw = [0.033, 0.03, 0.024, 0.017, 0.012, 0.008]; // body half-width at each z (ribbon hugs the flank)
    for (let i = 0; i < zs.length; i++) {
      const wave = Math.sin(i * 1.15) * 0.014; // gentle vertical undulation along the skirt
      const seg = part(sph(0.028, 8), C(s, 'accent'), hw[i] + 0.014, wave, zs[i]);
      seg.scale.set(0.5, 0.11, 1.55); // low, very thin, drawn out into a continuous ribbon
      f.add(seg);
      if (i % 2 === 0) f.add(part(sph(0.005, 6), GLOW(s), hw[i] + 0.032, wave, zs[i])); // bio-lum frill spot
    }
    f.scale.x = sx; // mirror to the other flank
    return f;
  };
  grp.add(sctFrill(1));
  grp.add(sctFrill(-1));

  // Low dorsal steering ridge — a soft crest, not a fin.
  const sctDorsal = part(sph(0.018, 10), C(s, 'accent'), 0, 0.024, -0.03);
  sctDorsal.scale.set(0.07, 0.95, 1.3);
  grp.add(sctDorsal);

  // --- Long trailing sensory WHISKER-feelers: chains of tapering box segments that
  //     curl back off the cheeks (the signature), plus short wisps off the tail. -----
  const sctTendril = (x0, y0, z0, n, len, tilt0, curl, slot) => {
    let py = y0;
    let pz = z0;
    let ang = tilt0;
    for (let i = 0; i < n; i++) {
      ang += curl;
      const L = len * (1 - i * 0.1);
      const w = 0.006 * (1 - i * 0.12);
      const dy = -Math.sin(ang) * L;
      const dz = -Math.cos(ang) * L;
      addRot(grp, box(w, w, L), C(s, slot), x0, py + dy / 2, pz + dz / 2, -ang, 0, 0);
      py += dy;
      pz += dz;
    }
    grp.add(part(sph(0.005, 6), GLOW(s), x0, py, pz)); // glowing feeler tip
  };
  for (const sx of [-1, 1]) sctTendril(sx * 0.03, ey - 0.004, 0.06, 4, 0.058, 0.16, 0.1, 'hull2'); // long cheek whiskers
  sctTendril(0.014, -0.012, -0.2, 3, 0.045, 0.12, 0.12, 'hull'); // tail wisp
  sctTendril(-0.016, -0.01, -0.2, 3, 0.04, 0.1, 0.14, 'hull2'); // tail wisp

  // --- Bio-lum organs glowing through the belly/flanks + a dorsal glow-line. -------
  const sctOrgans = [
    [0.026, -0.02, 0.045], [-0.028, -0.016, 0.0], [0.02, -0.018, -0.05], [-0.018, -0.014, -0.1],
  ];
  for (const o of sctOrgans) grp.add(part(sph(0.007, 6), GLOW(s), o[0], o[1], o[2]));
  for (const z of [0.03, -0.02, -0.07]) grp.add(part(sph(0.005, 6), GLOW(s), 0, 0.028 - (z < -0.05 ? 0.02 : 0), z)); // dorsal line

  // --- Small ROUND bio-luminescent tail gland (a glowing organ, no engine plume). --
  grp.add(part(sph(0.014, 8), GLOW(s), 0, -0.014, -0.205)); // gland glow halo
  grp.add(part(sph(0.008, 8), C(s, 'glass'), 0, -0.014, -0.205)); // gland core

  return grp;
}

// SWARM FIGHTER — a huge, strange void-LEVIATHAN grown small. A living beast, NOT
// a machine: a sinuous, arched sea-creature body (a chain of overlapping ovoids)
// with a dorsal hump and a long whip tail, a gaping fanged MAW + dangling bio-lum
// lure at the FRONT (+Z), soft undulating fin-FRILLS along the flanks (a
// cuttlefish/moray skirt, NOT wings), trailing tentacle streamers and organs
// glowing through the flesh. NO engines (it swims by undulating) and NO airfoils.
// Nose = +Z. Palette comes from the faction (violet-abyss flesh + magenta glow).
function makeSwarmFighter(s) {
  const grp = group();

  // --- Long, arched leviathan body: a sinuous chain of ovoids. Fattest at the
  //     jaw/gut behind the maw, arching UP into a dorsal hump, then a long tail
  //     that drops and trails away. y-arch + x-wobble → a living, undulating beast
  //     rather than a machined tube. ~0.48 long. ---------------------------------
  const segs = [
    { z: 0.15, r: 0.058, slot: 'hull2', x: 0.0, y: 0.004, sz: 1.05 }, // jaw base behind the maw
    { z: 0.095, r: 0.078, slot: 'hull', x: 0.004, y: 0.016, sz: 1.15 }, // gut (widest mass)
    { z: 0.035, r: 0.073, slot: 'hull2', x: -0.005, y: 0.032, sz: 1.3 }, // shoulders rising
    { z: -0.02, r: 0.061, slot: 'hull', x: 0.005, y: 0.042, sz: 1.35 }, // dorsal hump peak
    { z: -0.075, r: 0.048, slot: 'hull2', x: -0.004, y: 0.033, sz: 1.4 }, // back descending
    { z: -0.13, r: 0.037, slot: 'hull', x: 0.004, y: 0.02, sz: 1.45 },
    { z: -0.185, r: 0.028, slot: 'hull2', x: -0.003, y: 0.008, sz: 1.5 },
    { z: -0.235, r: 0.02, slot: 'hull', x: 0.002, y: -0.003, sz: 1.55 },
    { z: -0.285, r: 0.013, slot: 'dark', x: 0.0, y: -0.011, sz: 1.6 }, // tail gland
    { z: -0.325, r: 0.008, slot: 'dark', x: 0.0, y: -0.017, sz: 1.6 }, // tail tip
  ];
  for (const g of segs) {
    const m = part(sph(g.r, 12), C(s, g.slot), g.x, g.y, g.z);
    m.scale.z = g.sz; // stretch each sphere into an ovoid along the body axis
    grp.add(m);
  }

  // --- The MAW: a wide gullet cavity thrust FORWARD of the jaw, a deep glowing
  //     throat set inside, and a splayed crown of long bony fangs converging into
  //     a heavy bite. This gaping mouth is the whole front of the creature. -------
  const my = 0.004; // maw vertical centre (aligned with the jaw base)
  addRot(grp, cone(0.07, 0.12, 20), C(s, 'dark'), 0, my, 0.185, -Math.PI / 2); // cavity, rim protrudes to +Z
  grp.add(part(sph(0.01, 12), C(s, 'dark'), 0, my, 0.12)); // gullet floor (hides the open cone apex)
  const throat = part(sph(0.04, 12), GLOW(s), 0, my, 0.165); // glowing gullet
  throat.scale.set(1, 1, 0.7);
  grp.add(throat);
  grp.add(part(sph(0.02, 10), GLOW(s), 0, my, 0.13)); // deeper throat ember

  // crown of fangs splayed around the rim (pale bone, tips forward + slightly out)
  const nT = 13;
  for (let i = 0; i < nT; i++) {
    const a = (i / nT) * Math.PI * 2;
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    addRot(grp, cone(0.008, 0.048, 5), C(s, 'gold'), cx * 0.062, my + cy * 0.062, 0.215, Math.PI / 2 - cy * 0.2, 0, cx * 0.2);
  }
  // heavy converging bite — long upper fangs curl down-in, lower fangs curl up-in
  for (const sx of [-1, 1]) {
    addRot(grp, cone(0.013, 0.075, 6), C(s, 'gold'), sx * 0.026, my + 0.045, 0.205, Math.PI / 2 + 0.42, 0, sx * 0.15);
    addRot(grp, cone(0.012, 0.064, 6), C(s, 'gold'), sx * 0.03, my - 0.042, 0.205, Math.PI / 2 - 0.42, 0, -sx * 0.15);
  }

  // --- The LURE (esca): a dark stalk rising off the snout and drooping forward on
  //     a long neck, dangling a glowing bulb far out over the bite. The eerie tell.
  addRot(grp, box(0.008, 0.008, 0.1), C(s, 'dark'), 0.006, 0.06, 0.14, 0.8, 0, 0.04); // stalk root, up-forward
  addRot(grp, box(0.007, 0.007, 0.12), C(s, 'dark'), 0.01, 0.115, 0.225, 1.85, 0, 0.04); // droops forward over the maw
  grp.add(part(sph(0.034, 8), GLOW(s), 0.012, 0.078, 0.305)); // esca glow halo
  grp.add(part(sph(0.017, 10), C(s, 'glass'), 0.012, 0.078, 0.305)); // esca bulb

  // --- Small deep-set eyes low on the head sides (animal, not a cockpit) ---------
  for (const sx of [-1, 1]) grp.add(part(sph(0.012, 8), C(s, 'glass'), sx * 0.055, my - 0.006, 0.11));

  // --- Gill slits — dark marks on the flanks behind the head, faintly lit --------
  for (const sx of [-1, 1]) {
    addRot(grp, box(0.004, 0.036, 0.008), C(s, 'dark'), sx * 0.066, 0.006, 0.055, 0, 0, sx * 0.3);
    grp.add(part(sph(0.006, 6), GLOW(s), sx * 0.062, 0.0, 0.06));
  }

  // --- Lateral fin-FRILL (a cuttlefish/moray skirt, NOT wings): a soft undulating
  //     ribbon of flesh running along each flank, just proud of the body and waving
  //     in y so it reads as a swimming membrane, never a hard airfoil. Mirrored. ---
  const fgtFrill = (sx) => {
    const f = group();
    const zs = [0.07, 0.03, -0.01, -0.05, -0.09, -0.13, -0.17, -0.21];
    const hw = [0.052, 0.06, 0.06, 0.054, 0.046, 0.038, 0.03, 0.022]; // track the body half-width taper
    for (let i = 0; i < zs.length; i++) {
      const wave = Math.sin(i * 1.15) * 0.013; // gentle vertical undulation along the ribbon
      const seg = part(sph(0.028, 8), C(s, 'accent'), hw[i] + 0.012, wave, zs[i]);
      seg.scale.set(0.5, 0.1, 1.35); // thin (flat) + elongated along z → a continuous ribbon
      f.add(seg);
      if (i % 2 === 0) f.add(part(sph(0.005, 6), GLOW(s), hw[i] + 0.03, wave, zs[i])); // glow along the frill margin
    }
    f.scale.x = sx; // mirror to the other flank
    return f;
  };
  grp.add(fgtFrill(1));
  grp.add(fgtFrill(-1));

  // --- Dorsal crest — a raked-back row of jagged bony spines following the arch of
  //     the back, taller up front, each with a glowing organ at its base. ---------
  const spine = [
    { z: 0.06, y: 0.062, h: 0.062 },
    { z: 0.0, y: 0.078, h: 0.056 },
    { z: -0.06, y: 0.066, h: 0.046 },
    { z: -0.12, y: 0.046, h: 0.036 },
    { z: -0.18, y: 0.026, h: 0.028 },
    { z: -0.235, y: 0.008, h: 0.02 },
  ];
  for (let i = 0; i < spine.length; i++) {
    const sp = spine[i];
    addRot(grp, cone(0.009, sp.h, 6), C(s, 'accent'), 0, sp.y, sp.z, -0.5, 0, (i % 2 ? 0.12 : -0.1));
    grp.add(part(sph(0.008, 6), GLOW(s), 0, sp.y - 0.012, sp.z));
  }

  // --- Bio-lum organ clusters glowing through the belly/flanks -------------------
  const organs = [
    [0.055, -0.028, 0.09], [-0.06, -0.02, 0.05], [0.05, -0.036, -0.02],
    [-0.045, -0.036, -0.02], [0.032, -0.03, -0.09], [-0.032, -0.028, -0.09],
    [0.02, -0.02, -0.16], [-0.02, -0.018, -0.16],
  ];
  for (const o of organs) grp.add(part(sph(0.011, 6), GLOW(s), o[0], o[1], o[2]));

  // --- Trailing tendrils — short curling barbels at the mouth corners, and long
  //     jellyfish streamers flowing BACK off the tail. Each is a chain of tapering
  //     segments that curl. -------------------------------------------------------
  const tendril = (x0, y0, z0, n, len, tilt0, curl, slot) => {
    let py = y0;
    let pz = z0;
    let ang = tilt0;
    for (let i = 0; i < n; i++) {
      ang += curl;
      const L = len * (1 - i * 0.12);
      const w = 0.009 * (1 - i * 0.11);
      const dy = -Math.sin(ang) * L;
      const dz = -Math.cos(ang) * L;
      addRot(grp, box(w, w, L), C(s, slot), x0, py + dy / 2, pz + dz / 2, -ang, 0, 0);
      py += dy;
      pz += dz;
    }
    grp.add(part(sph(0.006, 6), GLOW(s), x0, py, pz)); // glowing tendril tip
  };
  for (const sx of [-1, 1]) tendril(sx * 0.035, my - 0.03, 0.13, 3, 0.045, 0.55, 0.28, 'hull2'); // mouth barbels
  tendril(0.02, -0.014, -0.31, 7, 0.055, 0.1, 0.11, 'hull'); // long tail streamer
  tendril(-0.024, -0.01, -0.31, 7, 0.05, 0.09, 0.13, 'hull2'); // long tail streamer
  tendril(0.0, -0.028, -0.315, 6, 0.05, 0.2, 0.12, 'dark'); // ventral tail streamer

  // --- Tail bioluminescent GLAND — a soft round organ at the tail tip. NOT a
  //     thrust plume: a void-leviathan swims by undulating, it has no engine. -----
  grp.add(part(sph(0.02, 8), GLOW(s), 0, -0.02, -0.33));
  grp.add(part(sph(0.011, 8), C(s, 'glass'), 0, -0.02, -0.335));

  return grp;
}

// SWARM INTERCEPTOR — the fleet's fastest killer: a serpent-dart void-leviathan.
// A very elongated, streamlined snake body (a tight chain of stretched ovoids
// with a shallow S-wobble so it undulates), a narrow lamprey/needle head at +Z
// with a small round rasping maw, a soft undulating lateral fin-frill skirting
// each flank (a swimming membrane, NOT wings), a low raked dorsal knife-ridge,
// a long trailing whip tail, bio-lum organs glowing through the flesh, and a
// small round bioluminescent tail gland (it swims by undulating — no engine).
// Lethal speed, minimal bulk. Nose = +Z, tail = -Z, centred.

// A trailing whip/streamer — a chain of tapering box segments that curl back and
// down off the tail. Each segment shrinks; the chain ends in a glowing organ tip.
function itcWhip(grp, s, x0, y0, z0, n, len, tilt0, curl, slot) {
  let py = y0;
  let pz = z0;
  let ang = tilt0;
  for (let i = 0; i < n; i++) {
    ang += curl;
    const L = len * (1 - i * 0.13);
    const w = 0.009 * (1 - i * 0.12);
    const dy = -Math.sin(ang) * L;
    const dz = -Math.cos(ang) * L;
    addRot(grp, box(w, w, L), C(s, slot), x0, py + dy / 2, pz + dz / 2, -ang, 0, 0);
    py += dy;
    pz += dz;
  }
  grp.add(part(sph(0.005, 6), GLOW(s), x0, py, pz)); // glowing whip-tip organ
}

function makeSwarmInterceptor(s) {
  const grp = group();
  const my = 0.005; // head vertical centre

  // --- Serpent-dart body: a long, tight chain of stretched ovoids. Needle tip at
  //     +Z, widening to a lean gut just behind the head, then a long steady taper
  //     into a whip tail. Shallow y-arch + x-wobble → it undulates like a swimming
  //     snake, but streamlined and all forward thrust. ~0.43 long. -----------------
  const segs = [
    { z: 0.208, r: 0.008, slot: 'dark', x: 0.0, y: 0.002, sz: 1.6 }, // needle tip
    { z: 0.188, r: 0.013, slot: 'hull2', x: 0.002, y: 0.004, sz: 1.8 }, // snout
    { z: 0.162, r: 0.019, slot: 'hull', x: -0.003, y: 0.006, sz: 1.8 }, // head
    { z: 0.132, r: 0.025, slot: 'hull2', x: 0.004, y: 0.009, sz: 1.7 }, // neck
    { z: 0.096, r: 0.029, slot: 'hull', x: -0.005, y: 0.012, sz: 1.7 }, // gut (widest, still lean)
    { z: 0.056, r: 0.03, slot: 'hull2', x: 0.005, y: 0.013, sz: 1.7 },
    { z: 0.014, r: 0.028, slot: 'hull', x: -0.005, y: 0.011, sz: 1.7 },
    { z: -0.028, r: 0.024, slot: 'hull2', x: 0.005, y: 0.006, sz: 1.7 },
    { z: -0.07, r: 0.02, slot: 'hull', x: -0.004, y: 0.0, sz: 1.7 },
    { z: -0.11, r: 0.016, slot: 'hull2', x: 0.003, y: -0.005, sz: 1.7 },
    { z: -0.148, r: 0.012, slot: 'hull', x: -0.002, y: -0.009, sz: 1.7 },
    { z: -0.184, r: 0.008, slot: 'dark', x: 0.001, y: -0.012, sz: 1.6 }, // tail gland
    { z: -0.216, r: 0.005, slot: 'dark', x: 0.0, y: -0.015, sz: 1.6 }, // tail tip
  ];
  for (const g of segs) {
    const m = part(sph(g.r, 12), C(s, g.slot), g.x, g.y, g.z);
    m.scale.z = g.sz; // stretch each sphere into a streamlined ovoid along the axis
    grp.add(m);
  }

  // --- The HEAD: a narrow lamprey snout thrusting a small round rasping maw. A
  //     shallow forward-opening cavity, a glowing gullet ember inside, and a ring
  //     of tiny pale-bone teeth around the rim. Deep-set glowing eyes on the sides.
  addRot(grp, cone(0.016, 0.028, 12), C(s, 'dark'), 0, my, 0.2, -Math.PI / 2); // maw cavity, rim to +Z
  grp.add(part(sph(0.012, 10), GLOW(s), 0, my, 0.192)); // glowing gullet
  const nT = 7;
  for (let i = 0; i < nT; i++) {
    const a = (i / nT) * Math.PI * 2;
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    addRot(grp, cone(0.004, 0.016, 4), C(s, 'gold'), cx * 0.013, my + cy * 0.013, 0.214, Math.PI / 2 - cy * 0.15, 0, cx * 0.15);
  }
  for (const sx of [-1, 1]) grp.add(part(sph(0.008, 8), C(s, 'glass'), sx * 0.018, my + 0.003, 0.15)); // eyes

  // --- A soft undulating lateral fin-FRILL along each flank (a cuttlefish/moray
  //     skirt, NOT wings): a thin ribbon of overlapping membrane segments hugging
  //     the body just proud, waving gently in y, mirrored across X=0. -------------
  const itcFrill = (sx) => {
    const f = group();
    const zs = [0.115, 0.075, 0.035, -0.005, -0.045, -0.085, -0.125];
    const hw = [0.027, 0.03, 0.029, 0.028, 0.023, 0.019, 0.015]; // body half-width at each z
    for (let i = 0; i < zs.length; i++) {
      const wave = Math.sin(i * 1.15) * 0.013;
      const seg = part(sph(0.028, 8), C(s, 'accent'), hw[i] + 0.012, wave, zs[i]);
      seg.scale.set(0.5, 0.1, 1.35); // thin waving ribbon along the flank
      f.add(seg);
      if (i % 2 === 0) f.add(part(sph(0.005, 6), GLOW(s), hw[i] + 0.03, wave, zs[i])); // frill bud
    }
    f.scale.x = sx;
    return f;
  };
  grp.add(itcFrill(1));
  grp.add(itcFrill(-1));
  // A low sharp dorsal ridge — a short row of raked knife-blade spines along the
  //   back (minimal bulk), the middle one a bright signature green. --------------
  const ridge = [
    { z: 0.062, y: 0.022, h: 0.52, col: C(s, 'accent') },
    { z: 0.012, y: 0.024, h: 0.66, col: ACC(s) },
    { z: -0.044, y: 0.018, h: 0.48, col: C(s, 'accent') },
  ];
  for (const rd of ridge) {
    const bl = part(sph(0.026, 8), rd.col, 0, rd.y, rd.z);
    bl.scale.set(0.07, rd.h, 1.9); // thin-x, low, long → a raked knife-edge
    bl.rotation.set(0.62, 0, 0); // rake back
    grp.add(bl);
  }

  // --- Bio-lum organs glowing THROUGH the flesh: a glowing dorsal line along the
  //     back, and a scatter of belly/flank organs. --------------------------------
  const dorsal = [[0, 0.033, 0.09], [0, 0.035, 0.03], [0, 0.028, -0.03], [0, 0.018, -0.09], [0, 0.006, -0.145]];
  for (const o of dorsal) grp.add(part(sph(0.007, 6), GLOW(s), o[0], o[1], o[2]));
  const belly = [[0.03, -0.03, 0.07], [-0.03, -0.03, 0.0], [0.026, -0.024, -0.07], [-0.022, -0.018, -0.125]];
  for (const o of belly) grp.add(part(sph(0.008, 6), GLOW(s), o[0], o[1], o[2]));

  // --- Long trailing WHIP tail off the tail tip, plus two shorter side streamers.
  itcWhip(grp, s, 0.0, -0.017, -0.226, 6, 0.05, 0.09, 0.13, 'hull'); // main whip
  for (const sx of [-1, 1]) itcWhip(grp, s, sx * 0.013, -0.012, -0.222, 3, 0.04, 0.15, 0.16, 'hull2'); // side streamers

  // --- A small ROUND bio-lum tail gland (no engine — a leviathan swims by
  //     undulating): a glowing organ with a bright core at the tail tip. ----------
  grp.add(part(sph(0.013, 8), GLOW(s), 0, -0.015, -0.222));
  grp.add(part(sph(0.007, 8), C(s, 'glass'), 0, -0.015, -0.222));

  return grp;
}

// SWARM GUNSHIP — a heavy weaponized war-beast: a bulkier leviathan grown for
// battle. A thick, slightly arched fleshy body (a chain of overlapping ovoids
// with an x-wobble so it undulates), armored with hardened chitin CARAPACE
// plates over the humped back, a heavy fanged maw at the FRONT (+Z), and its
// signature — a bristling cluster of organic bio-cannon POLYPS / barbed
// spine-launcher tubes firing forward, each dark gun-barrel tipped with a
// glowing charge-ember. Soft fin-frills undulate along the flanks, tendrils
// trail off the tail, bio-lum organs glow through the flesh, and a round tail
// gland lights the wake. It swims — no engines. A menacing living gunbeast.
// Nose = +Z.

// One forward-firing bio-cannon polyp: a dark, organically tapered gun-barrel
// (muzzle narrows toward +Z) tipped with a glowing charge-ember; the heavy
// `big` barrels also carry a bright accent charge-ring behind the muzzle.
function gunBarrel(grp, s, x, y, z, r, len, big) {
  addRot(grp, cyl(r * 0.55, r, len, 7), C(s, 'dark'), x, y, z, Math.PI / 2); // dark tapered barrel
  grp.add(part(sph(r * (big ? 1.05 : 0.8), 7), GLOW(s), x, y, z + len * 0.5 + r * 0.25)); // charge-ember
  if (big) addRot(grp, cyl(r * 0.78, r * 0.78, len * 0.1, 8), ACC(s), x, y, z + len * 0.28, Math.PI / 2); // charge-ring
}

// A trailing tendril: a chain of tapering box segments that curls, tipped with
// a glowing gland — the same barbel language as the fighter's tail streamers.
function gunTendril(grp, s, x0, y0, z0, n, len, tilt0, curl, slot) {
  let py = y0;
  let pz = z0;
  let ang = tilt0;
  for (let i = 0; i < n; i++) {
    ang += curl;
    const L = len * (1 - i * 0.14);
    const w = 0.01 * (1 - i * 0.12);
    const dy = -Math.sin(ang) * L;
    const dz = -Math.cos(ang) * L;
    addRot(grp, box(w, w, L), C(s, slot), x0, py + dy / 2, pz + dz / 2, -ang, 0, 0);
    py += dy;
    pz += dz;
  }
  grp.add(part(sph(0.006, 6), GLOW(s), x0, py, pz));
}

function makeSwarmGunship(s) {
  const grp = group();

  // --- Heavy leviathan body: a bulkier chain of overlapping ovoids. Fattest at
  //     the chest/gun-platform, arching UP into an armored dorsal hump, then a
  //     short powerful tail. y-arch + x-wobble → a living, undulating warbeast.
  //     ~0.34 long, thick and menacing (dwarfs the fighter's slim body). --------
  const gunSegs = [
    { z: 0.1, r: 0.06, slot: 'hull2', x: 0.0, y: 0.004, sz: 1.1 }, // jaw base behind the maw
    { z: 0.055, r: 0.084, slot: 'hull', x: 0.004, y: 0.012, sz: 1.15 }, // chest / gun platform
    { z: 0.0, r: 0.088, slot: 'hull2', x: -0.004, y: 0.024, sz: 1.25 }, // armored shoulders (widest mass)
    { z: -0.05, r: 0.072, slot: 'hull', x: 0.004, y: 0.032, sz: 1.3 }, // dorsal hump peak
    { z: -0.098, r: 0.053, slot: 'hull2', x: -0.003, y: 0.024, sz: 1.35 }, // back descending
    { z: -0.138, r: 0.037, slot: 'hull', x: 0.003, y: 0.012, sz: 1.4 },
    { z: -0.17, r: 0.023, slot: 'dark', x: 0.0, y: 0.002, sz: 1.45 }, // tail gland
    { z: -0.195, r: 0.014, slot: 'dark', x: 0.0, y: -0.005, sz: 1.5 }, // tail tip
  ];
  for (const g of gunSegs) {
    const m = part(sph(g.r, 12), C(s, g.slot), g.x, g.y, g.z);
    m.scale.z = g.sz; // stretch each sphere into an ovoid along the body axis
    grp.add(m);
  }

  // --- The MAW: a wide gaping gullet thrust forward of the jaw, a glowing throat
  //     set inside, and a crown of heavy bony fangs converging into a hard bite. -
  const my = 0.018; // maw vertical centre — the fanged FACE, raised over the gun-jaw
  addRot(grp, cone(0.056, 0.095, 18), C(s, 'dark'), 0, my, 0.15, -Math.PI / 2); // gullet cavity, rim to +Z
  grp.add(part(sph(0.012, 10), C(s, 'dark'), 0, my, 0.1)); // gullet floor (hides the open cone apex)
  const gunThroat = part(sph(0.038, 10), GLOW(s), 0, my, 0.13); // glowing gullet
  gunThroat.scale.set(1, 1, 0.7);
  grp.add(gunThroat);
  grp.add(part(sph(0.018, 8), GLOW(s), 0, my, 0.1)); // deeper throat ember

  // crown of heavy fangs splayed around the rim (top/bottom fangs biggest)
  const gunNT = 6;
  for (let i = 0; i < gunNT; i++) {
    const a = (i / gunNT) * Math.PI * 2;
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    const big = 0.9 + 0.6 * Math.abs(cy);
    addRot(grp, cone(0.012 * big, 0.062 * big, 5), C(s, 'gold'), cx * 0.055, my + cy * 0.055, 0.175, Math.PI / 2 - cy * 0.2, 0, cx * 0.2);
  }
  // heavy converging bite — long upper tusks curl down-in, lower fangs curl up-in
  for (const sx of [-1, 1]) {
    addRot(grp, cone(0.015, 0.078, 6), C(s, 'gold'), sx * 0.026, my + 0.046, 0.17, Math.PI / 2 + 0.44, 0, sx * 0.15);
    addRot(grp, cone(0.013, 0.062, 6), C(s, 'gold'), sx * 0.03, my - 0.042, 0.17, Math.PI / 2 - 0.4, 0, -sx * 0.15);
  }

  // --- Small deep-set eyes low on the head sides (animal, not a cockpit) --------
  for (const sx of [-1, 1]) grp.add(part(sph(0.011, 8), C(s, 'glass'), sx * 0.05, my + 0.008, 0.09));

  // --- WEAPON ORGANS (the signature): a bristling cluster of bio-cannon polyps
  //     firing forward (+Z), grouped around and below the maw. A raised chitin
  //     gun-mound on the chest, a heavy central barrel, chin pair and wide flank
  //     pair, plus barbed launcher spines. Dense and menacing. ------------------
  const gunMound = part(sph(0.052, 10), C(s, 'hull2'), 0, -0.016, 0.08);
  gunMound.scale.set(1.75, 0.9, 1.2);
  grp.add(gunMound);

  // Long barrels spread over three heights → a fan bristling forward, a gun-jaw
  // slung BELOW the fanged face. The heavy central + wide flank barrels reach
  // furthest past the mouth.
  gunBarrel(grp, s, 0, -0.036, 0.125, 0.022, 0.17, true); // heavy central cannon
  for (const sx of [-1, 1]) {
    gunBarrel(grp, s, sx * 0.034, -0.056, 0.115, 0.016, 0.14, false); // chin pair (lowest)
    gunBarrel(grp, s, sx * 0.07, -0.01, 0.1, 0.016, 0.14, true); // wide flank pair
  }
  // barbed launcher spines splayed forward around the gun-jaw (pale bone)
  for (const sx of [-1, 1]) {
    addRot(grp, cone(0.008, 0.06, 5), C(s, 'gold'), sx * 0.024, -0.062, 0.15, Math.PI / 2 + 0.18, 0, sx * 0.24); // chin barbs
  }

  // --- Hardened chitin CARAPACE plates over the shoulders (the armored beast) ---
  for (const gpl of [{ z: 0.01, y: 0.05, r: 0.05 }, { z: -0.055, y: 0.06, r: 0.048 }]) {
    const m = part(sph(gpl.r, 10), C(s, 'hull2'), 0, gpl.y, gpl.z);
    m.scale.set(1.6, 0.5, 1.25);
    grp.add(m);
  }

  // --- Jagged dorsal CREST — a raked-back row of bony spines following the arch
  //     of the armored back, each with a glowing organ at its base. -------------
  const gunCrest = [
    { z: 0.035, y: 0.062, h: 0.05 },
    { z: -0.025, y: 0.076, h: 0.056 },
    { z: -0.085, y: 0.062, h: 0.044 },
    { z: -0.13, y: 0.04, h: 0.032 },
  ];
  for (let i = 0; i < gunCrest.length; i++) {
    const gc = gunCrest[i];
    addRot(grp, cone(0.01, gc.h, 6), C(s, 'accent'), 0, gc.y, gc.z, -0.5, 0, (i % 2 ? 0.12 : -0.1));
    if (i % 2 === 0) grp.add(part(sph(0.008, 6), GLOW(s), 0, gc.y - 0.012, gc.z)); // glowing dorsal-line node
  }

  // --- Bio-lum organ clusters glowing through the belly/flanks ------------------
  const gunOrgans = [
    [0.058, -0.028, 0.03], [-0.058, -0.028, 0.03],
    [0.045, -0.04, -0.05], [-0.045, -0.04, -0.05],
  ];
  for (const o of gunOrgans) grp.add(part(sph(0.01, 6), GLOW(s), o[0], o[1], o[2]));

  // --- Lateral fin-FRILL: a soft undulating cuttlefish/moray skirt hugging each
  //     flank just proud of the body, waving gently in y (a swimming organ, NOT
  //     a wing). Half-widths track the bulky body so the ribbon clings. ---------
  const gunFrill = (sx) => {
    const f = group();
    const zs = [0.05, 0.0, -0.05, -0.098, -0.14];
    const hw = [0.08, 0.088, 0.072, 0.053, 0.037]; // body half-width at each z
    for (let i = 0; i < zs.length; i++) {
      const wave = Math.sin(i * 1.15) * 0.013;
      const seg = part(sph(0.028, 8), C(s, 'accent'), hw[i] + 0.012, wave, zs[i]);
      seg.scale.set(0.5, 0.1, 1.35);
      f.add(seg);
      if (i % 2 === 0) f.add(part(sph(0.005, 6), GLOW(s), hw[i] + 0.03, wave, zs[i]));
    }
    f.scale.x = sx;
    return f;
  };
  grp.add(gunFrill(1));
  grp.add(gunFrill(-1));

  // --- Trailing tendrils curling back off the tail -----------------------------
  for (const sx of [-1, 1]) gunTendril(grp, s, sx * 0.02, -0.008, -0.185, 2, 0.05, 0.12, 0.16, sx > 0 ? 'hull' : 'hull2');

  // --- Round bioluminescent tail gland (a living organ — NOT an engine plume) ---
  grp.add(part(sph(0.02, 8), GLOW(s), 0, -0.004, -0.208));
  grp.add(part(sph(0.011, 8), C(s, 'glass'), 0, -0.004, -0.208));

  return grp;
}

// SWARM CORVETTE — a capital-class void-LEVIATHAN warbeast, a mini-flagship: a
// big segmented sea-beast body arching up into a raised command HUMP crowned by
// a glowing cyclopean bridge-eye, a full raked dorsal CREST streaming down the
// back, a central gaping fanged MAW flanked by a pair of bone-barrelled weapon-
// polyps, a soft undulating fin-FRILL down each flank (a swimming skirt, not
// wings), clustered bio-lum organs glowing through the flesh and trailing tail
// tendrils. It has no engine — it SWIMS by undulating, a lone bioluminescent
// gland at the tail. A grown monster of war, one step below the flagship.
// Nose = +Z, tail = -Z, symmetric about X=0.
function makeSwarmCorvette(s) {
  const grp = group();

  // --- Segmented leviathan body: a chain of overlapping stretched ovoids.
  //     Fattest at the gut/shoulders behind the maw, a gentle y-arch + slight
  //     x-wobble so the great beast undulates, tapering to a long dropping tail.
  //     ~0.5 long in Z, thick-bodied → reads as a capital hull, not a fighter. --
  const segs = [
    { z: 0.185, r: 0.078, slot: 'hull2', x: 0.0, y: 0.004, sz: 1.05 }, // jaw base behind the maw
    { z: 0.12, r: 0.106, slot: 'hull', x: 0.005, y: 0.018, sz: 1.15 }, // gut
    { z: 0.05, r: 0.114, slot: 'hull2', x: -0.006, y: 0.03, sz: 1.25 }, // shoulders (widest mass)
    { z: -0.02, r: 0.1, slot: 'hull', x: 0.006, y: 0.036, sz: 1.3 }, // mid-back / hump base
    { z: -0.09, r: 0.078, slot: 'hull2', x: -0.005, y: 0.03, sz: 1.35 }, // back descending
    { z: -0.15, r: 0.055, slot: 'hull', x: 0.005, y: 0.02, sz: 1.4 },
    { z: -0.205, r: 0.04, slot: 'hull2', x: -0.004, y: 0.01, sz: 1.45 },
    { z: -0.25, r: 0.027, slot: 'hull', x: 0.003, y: 0.0, sz: 1.5 }, // tail gland base
    { z: -0.29, r: 0.017, slot: 'dark', x: 0.0, y: -0.008, sz: 1.5 }, // tail tip
  ];
  for (const g of segs) {
    const m = part(sph(g.r, 12), C(s, g.slot), g.x, g.y, g.z);
    m.scale.z = g.sz; // stretch each sphere into an ovoid along the body axis
    grp.add(m);
  }

  // --- Raised command HUMP: a rounded carapace mound swelling above the mid-back,
  //     crowned by a glowing bridge-eye blister. The beast's "command tower". -----
  const hump = [
    { z: 0.04, r: 0.052, y: 0.108, slot: 'hull', sz: 1.15 }, // front slope
    { z: -0.01, r: 0.066, y: 0.128, slot: 'hull2', sz: 1.2 }, // crown (raised high)
    { z: -0.065, r: 0.054, y: 0.11, slot: 'hull2', sz: 1.25 }, // rear slope
  ];
  for (const h of hump) {
    const m = part(sph(h.r, 12), C(s, h.slot), 0, h.y, h.z);
    m.scale.z = h.sz;
    grp.add(m);
  }
  blister(grp, s, 0, 0.152, 0.045, 0.04); // cyclopean bridge-eye perched on the command crown
  grp.add(part(sph(0.036, 8), GLOW(s), 0, 0.152, 0.05)); // bio-lum halo bleeding through the eye
  for (const sx of [-1, 1]) grp.add(part(sph(0.014, 6), GLOW(s), sx * 0.05, 0.11, 0.02)); // flank command organs

  // --- Deep-set head eyes low on the flanks of the head (animal, not a cockpit). -
  for (const sx of [-1, 1]) grp.add(part(sph(0.015, 8), C(s, 'glass'), sx * 0.078, -0.004, 0.145));

  // --- The central gaping MAW at +Z: a wide gullet cavity thrust forward, a deep
  //     glowing throat, and a splayed crown of bony fangs closing into a heavy
  //     bite. The whole prow of the leviathan is this mouth. --------------------
  const my = 0.006; // maw vertical centre (aligned with the jaw base)
  addRot(grp, cone(0.104, 0.18, 22), C(s, 'dark'), 0, my, 0.215, -Math.PI / 2); // huge gaping cavity, rim to +Z
  grp.add(part(sph(0.016, 12), C(s, 'dark'), 0, my, 0.135)); // gullet floor (hides the open cone apex)
  const throat = part(sph(0.074, 14), GLOW(s), 0, my, 0.216); // glowing gullet, bright in the open gape
  throat.scale.set(1, 1, 0.7);
  grp.add(throat);
  grp.add(part(sph(0.036, 10), GLOW(s), 0, my, 0.155)); // deeper throat ember

  const nT = 9; // crown of fangs splayed around the rim (pale bone, tips forward + out)
  for (let i = 0; i < nT; i++) {
    const a = (i / nT) * Math.PI * 2;
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    addRot(grp, cone(0.014, 0.08, 5), C(s, 'gold'), cx * 0.094, my + cy * 0.094, 0.27, Math.PI / 2 - cy * 0.2, 0, cx * 0.22);
  }
  for (const sx of [-1, 1]) { // heavy converging bite — long upper fangs curl down-in, lower up-in
    addRot(grp, cone(0.021, 0.12, 6), C(s, 'gold'), sx * 0.038, my + 0.066, 0.26, Math.PI / 2 + 0.42, 0, sx * 0.15);
    addRot(grp, cone(0.018, 0.1, 6), C(s, 'gold'), sx * 0.042, my - 0.062, 0.26, Math.PI / 2 - 0.42, 0, -sx * 0.15);
  }

  // --- Weapon-polyps flanking the maw: a fleshy socket, a chitin aperture lip, a
  //     pale bone barrel jutting forward-out and a glowing charged bore. ---------
  const cvtPolyp = (sx) => {
    const px = sx * 0.108;
    const py = -0.02;
    const pz = 0.12;
    const socket = part(sph(0.038, 10), C(s, 'hull'), px, py, pz);
    socket.scale.set(1, 1, 1.3);
    grp.add(socket);
    grp.add(part(sph(0.026, 8), C(s, 'hull2'), px, py, pz + 0.048)); // aperture lip
    addRot(grp, cyl(0.019, 0.011, 0.12, 8), C(s, 'gold'), px + sx * 0.008, py, pz + 0.11, Math.PI / 2, sx * 0.2, 0); // bone barrel
    grp.add(part(sph(0.019, 8), GLOW(s), px + sx * 0.02, py, pz + 0.17)); // glowing charged bore
  };
  cvtPolyp(-1);
  cvtPolyp(1);

  // --- Lateral fin-FRILL: a soft undulating cuttlefish/moray skirt hugging each
  //     flank just proud of the body, waving gently in y — it SWIMS, never wings.
  //     hw tracks the body half-width down the length so the ribbon stays snug. --
  const cvtFrill = (sx) => {
    const f = group();
    const zs = [0.115, 0.055, -0.005, -0.065, -0.125, -0.18, -0.23];
    const hw = [0.098, 0.108, 0.096, 0.076, 0.058, 0.044, 0.03];
    for (let i = 0; i < zs.length; i++) {
      const wave = Math.sin(i * 1.15) * 0.013;
      const seg = part(sph(0.028, 8), C(s, 'accent'), hw[i] + 0.012, wave, zs[i]);
      seg.scale.set(0.5, 0.1, 1.35); // thin vertical ribbon, long along Z
      f.add(seg);
      if (i % 2 === 0) f.add(part(sph(0.005, 6), GLOW(s), hw[i] + 0.03, wave, zs[i])); // frill-edge lights
    }
    f.scale.x = sx;
    return f;
  };
  grp.add(cvtFrill(1));
  grp.add(cvtFrill(-1));

  // --- Full raked dorsal CREST running the back: a row of bony spines, tallest on
  //     the command crown, raked back and following the arch down to the tail,
  //     with a glowing organ at the base of the tall ones (the dorsal light line).
  const crest = [
    { z: 0.11, y: 0.115, h: 0.05 }, // fore neck spine
    { z: 0.055, y: 0.16, h: 0.075 }, // rising onto the command crown
    { z: 0.0, y: 0.2, h: 0.095 }, // tallest, over the bridge-eye
    { z: -0.055, y: 0.185, h: 0.088 },
    { z: -0.105, y: 0.14, h: 0.07 },
    { z: -0.15, y: 0.1, h: 0.055 },
    { z: -0.195, y: 0.068, h: 0.042 },
    { z: -0.235, y: 0.04, h: 0.03 },
  ];
  for (let i = 0; i < crest.length; i++) {
    const c = crest[i];
    addRot(grp, cone(0.014, c.h, 6), C(s, 'accent'), 0, c.y, c.z, -0.5, 0, (i % 2 ? 0.1 : -0.09));
    if (i >= 1 && i <= 4) grp.add(part(sph(0.01, 6), GLOW(s), 0, c.y - 0.02, c.z)); // dorsal glow line
  }

  // --- Bio-lum organ clusters glowing through the belly & flanks. ---------------
  const organs = [
    [0.078, -0.03, 0.09], [-0.082, -0.026, 0.06],
    [0.07, -0.042, -0.03], [-0.066, -0.042, -0.03],
    [0.048, -0.032, -0.12], [-0.048, -0.03, -0.12],
  ];
  for (const o of organs) grp.add(part(sph(0.013, 6), GLOW(s), o[0], o[1], o[2]));

  // --- Trailing tail TENDRILS — chains of tapering box segments that curl as they
  //     stream back off the tail gland. ------------------------------------------
  const cvtTendril = (x0, y0, z0, n, len, tilt0, curl, slot) => {
    let py = y0;
    let pz = z0;
    let ang = tilt0;
    for (let i = 0; i < n; i++) {
      ang += curl;
      const L = len * (1 - i * 0.14);
      const w = 0.013 * (1 - i * 0.12);
      const dy = -Math.sin(ang) * L;
      const dz = -Math.cos(ang) * L;
      addRot(grp, box(w, w, L), C(s, slot), x0, py + dy / 2, pz + dz / 2, -ang, 0, 0);
      py += dy;
      pz += dz;
    }
    grp.add(part(sph(0.008, 6), GLOW(s), x0, py, pz)); // glowing tendril tip
  };
  cvtTendril(0.03, -0.012, -0.3, 4, 0.062, 0.12, 0.12, 'hull');
  cvtTendril(-0.03, -0.008, -0.3, 4, 0.056, 0.1, 0.14, 'hull2');
  cvtTendril(0.0, -0.03, -0.305, 3, 0.05, 0.24, 0.13, 'dark'); // ventral streamer

  // --- Bioluminescent tail GLAND — a small round organ, NOT an engine plume: a
  //     leviathan swims by undulating, it has no drive. --------------------------
  grp.add(part(sph(0.024, 8), GLOW(s), 0, -0.008, -0.302));
  grp.add(part(sph(0.013, 8), C(s, 'glass'), 0, -0.008, -0.302));

  return grp;
}

// SWARM FREIGHTER — a bulk hauler grown as a bloated void-whale: a slow, ponderous
// sea-beast whose defining feature is a hugely DISTENDED BELLY sagging low under a
// slim arched back — the cargo hold is a swallowed mass whose living contents glow
// faintly THROUGH the belly wall. A small fanged head with eyes up front (+Z), a
// few thick GRASPING tendril-arms reaching forward to haul freight, soft undulating
// lateral fin-frills waving along each flank (a swimming skirt, NOT wings), a small
// round bioluminescent tail gland (no engine — a leviathan swims by undulating), and
// a glowing dorsal line. It reads as a living cargo-leviathan, all girth and mass —
// not a hull. Nose = +Z, tail = -Z, ~0.42 long.
function makeSwarmFreighter(s) {
  const grp = group();

  // --- Slim arched BACK ridge: a chain of ovoids riding HIGH, a modest dorsal spine
  //     from a small head to a broad-shouldered mid-back, tapering to a stubby tail.
  //     Kept deliberately slender so the belly below dominates the mass. ----------
  const segs = [
    { z: 0.19, r: 0.046, slot: 'hull2', x: 0.0, y: 0.03, sz: 1.15 }, // small head
    { z: 0.145, r: 0.056, slot: 'hull', x: 0.004, y: 0.034, sz: 1.2 }, // neck
    { z: 0.095, r: 0.066, slot: 'hull2', x: -0.005, y: 0.036, sz: 1.25 }, // shoulders
    { z: 0.04, r: 0.073, slot: 'hull', x: 0.005, y: 0.037, sz: 1.3 }, // back
    { z: -0.015, r: 0.075, slot: 'hull2', x: -0.004, y: 0.034, sz: 1.3 }, // back peak over the gut
    { z: -0.07, r: 0.062, slot: 'hull', x: 0.004, y: 0.028, sz: 1.3 }, // back descending
    { z: -0.115, r: 0.049, slot: 'hull2', x: -0.003, y: 0.02, sz: 1.35 },
    { z: -0.155, r: 0.037, slot: 'hull', x: 0.003, y: 0.013, sz: 1.4 },
    { z: -0.19, r: 0.025, slot: 'hull2', x: 0.0, y: 0.008, sz: 1.45 }, // pre-tail
    { z: -0.225, r: 0.015, slot: 'dark', x: 0.0, y: 0.003, sz: 1.5 }, // tail gland
  ];
  for (const g of segs) {
    const m = part(sph(g.r, 12), C(s, g.slot), g.x, g.y, g.z);
    m.scale.z = g.sz; // stretch each sphere into an ovoid along the body axis
    grp.add(m);
  }

  // --- The DISTENDED BELLY: the DOMINANT mass — a vast over-full gut-sac hanging LOW
  //     and bulging WIDE well below the back ridge, starting as an underslung chest
  //     beneath the head and sagging deepest at mid-body. This pot-belly IS the
  //     cargo hold; it fuses with the flanks into one continuous swollen beast. -----
  const belly = [
    { z: 0.1, y: -0.024, r: 0.058, slot: 'hull' }, // underslung chest below the head
    { z: 0.05, y: -0.052, r: 0.088, slot: 'hull2' },
    { z: 0.0, y: -0.073, r: 0.108, slot: 'hull' },
    { z: -0.05, y: -0.078, r: 0.11, slot: 'hull2' }, // deepest, fullest sag
    { z: -0.098, y: -0.056, r: 0.078, slot: 'hull' },
  ];
  for (const b of belly) {
    const m = part(sph(b.r, 12), C(s, b.slot), 0, b.y, b.z);
    m.scale.set(1.24, 1.05, 1.2); // wide, softly flattened, over-full gut wall
    grp.add(m);
  }

  // --- Swallowed contents glowing THROUGH the belly wall — bio-lum organs bulging at
  //     the lower gut surface, where the living freight presses against the thin,
  //     translucent belly. Read as the cargo hold packed and lit from within. ------
  const guts = [
    [0.0, -0.175, 0.0, 0.018], // underside, deepest bulge of the hold
    [0.0, -0.16, -0.07, 0.015], // underside, rear
  ];
  for (const gg of guts) grp.add(part(sph(gg[3], 6), GLOW(s), gg[0], gg[1], gg[2]));
  for (const sx of [-1, 1]) grp.add(part(sph(0.014, 6), GLOW(s), sx * 0.128, -0.075, -0.03)); // flank organs

  // --- The HEAD/FACE: a small fanged mouth thrust forward at the front (+Z), two
  //     glowing eyes and blunt brow bumps above them so the front reads clearly as a
  //     face. A shallow dark gullet cavity ringed with short bony teeth, a glowing
  //     throat ember within — modest, a mouth for feeding the hold, not a maw. ------
  const hy = 0.008; // mouth vertical centre, set low on the head front (below the eyes)
  addRot(grp, cone(0.038, 0.064, 16), C(s, 'dark'), 0, hy, 0.226, -Math.PI / 2 - 0.14); // gullet cavity opens down-forward
  grp.add(part(sph(0.022, 10), GLOW(s), 0, hy + 0.002, 0.208)); // glowing throat ember
  const nT = 6;
  for (let i = 0; i < nT; i++) {
    const a = (i / nT) * Math.PI * 2;
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    addRot(grp, cone(0.006, 0.024, 5), C(s, 'gold'), cx * 0.034, hy + cy * 0.034, 0.244, Math.PI / 2 - cy * 0.14, 0, cx * 0.12);
  }
  for (const sx of [-1, 1]) {
    grp.add(part(sph(0.014, 8), C(s, 'glass'), sx * 0.045, hy + 0.042, 0.184)); // eye
    grp.add(part(sph(0.017, 8), C(s, 'hull2'), sx * 0.041, hy + 0.066, 0.192)); // brow bump
  }

  // --- GRASPING tendril-arms: thick, forward-reaching hauler-limbs — chains of
  //     tapering box segments that reach forward then HOOK down at the tip into a
  //     heavy pale bone claw, clutching toward the mouth. Built forward from the
  //     origin, then placed + mirrored. --------------------------------------------
  const frtArm = (n, len, w0, curl, slot) => {
    const a = group();
    let py = 0;
    let pz = 0;
    let ang = 0.0;
    for (let i = 0; i < n; i++) {
      ang += curl * (i / Math.max(1, n - 1)); // straight reach first, hooking curl toward the tip
      const L = len * (1 - i * 0.1);
      const w = w0 * (1 - i * 0.2);
      const dz = Math.cos(ang) * L; // reach forward (+Z)
      const dy = -Math.sin(ang) * L; // then curl downward → grasping hook
      addRot(a, box(w, w, L), C(s, slot), 0, py + dy / 2, pz + dz / 2, -ang, 0, 0);
      py += dy;
      pz += dz;
    }
    // a heavy hooked bone claw clutching at the tip of the arm
    addRot(a, cone(0.013, 0.036, 6), C(s, 'gold'), 0, py - 0.006, pz + 0.006, Math.PI / 2 - 0.5);
    return a;
  };
  // upper pair — the main haulers off the shoulders, reaching forward past the head
  for (const sx of [-1, 1]) {
    const arm = frtArm(3, 0.072, 0.038, 1.0, 'hull');
    arm.position.set(sx * 0.055, 0.004, 0.12);
    arm.rotation.set(-0.04, sx * 0.26, sx * 0.16);
    grp.add(arm);
  }
  // central lower chin-arm — a single thick tentacle groping forward beneath the maw
  const chinArm = frtArm(2, 0.07, 0.036, 1.0, 'hull2');
  chinArm.position.set(0.0, -0.034, 0.105);
  chinArm.rotation.set(0.14, 0.0, 0.0);
  grp.add(chinArm);

  // --- Lateral fin-FRILL — a soft undulating skirt of flesh running the length of
  //     each fat flank, hugging the body just proud and waving gently in y (a
  //     cuttlefish/moray swimming frill, NEVER a wing). Half-widths hw[] track this
  //     bloated body so the ribbon rides the flank; glowing beads dot it. ----------
  const frtFrill = (sx) => {
    const f = group();
    const zs = [0.14, 0.09, 0.04, -0.01, -0.05, -0.09, -0.13, -0.165, -0.2];
    const hw = [0.044, 0.062, 0.088, 0.1, 0.1, 0.075, 0.048, 0.036, 0.024];
    for (let i = 0; i < zs.length; i++) {
      const wave = Math.sin(i * 1.15) * 0.013; // gentle undulation down the flank
      const seg = part(sph(0.028, 8), C(s, 'accent'), hw[i] + 0.012, wave, zs[i]);
      seg.scale.set(0.5, 0.1, 1.35); // thin ribbon, long along the body
      f.add(seg);
      if (i % 2 === 0) f.add(part(sph(0.005, 6), GLOW(s), hw[i] + 0.03, wave, zs[i])); // bio-lum bead
    }
    f.scale.x = sx; // mirror L/R
    return f;
  };
  grp.add(frtFrill(1));
  grp.add(frtFrill(-1));

  // --- The TAIL: no engine — a leviathan swims by undulating. Only a small round
  //     bioluminescent tail gland glowing at the very rear. ------------------------
  grp.add(part(sph(0.02, 8), GLOW(s), 0, 0.004, -0.242));
  grp.add(part(sph(0.011, 8), C(s, 'glass'), 0, 0.004, -0.242));

  // --- Glowing DORSAL LINE — bio-lum organs strung along the top of the back ridge,
  //     following its arch, brightest over the swollen gut. -----------------------
  const dorsal = [
    [0.0, 0.088, 0.03, 0.012],
    [0.0, 0.082, -0.04, 0.011],
    [0.0, 0.058, -0.1, 0.009],
  ];
  for (const d of dorsal) grp.add(part(sph(d[3], 6), GLOW(s), d[0], d[1], d[2]));

  return grp;
}

// SWARM TANKER — a grown void-leviathan bred as a gas/fuel HAULER: a bloated,
// slow sea-beast whose whole back is a single huge glowing GAS-BLADDER SAC,
// brightly filled with bio-luminescent fluid and cinched in chitin bands. A
// small head at +Z lowers a downward SIPHON proboscis (a feeding trunk) to
// drink from clouds. Ringed segment bands girdle the fat body; soft undulating
// fin-frills skirt each flank and trailing tail streamers flow back — it swims
// by undulating, no engines. The fleet's living fuel-bladder.
// Nose = +Z, tail = -Z, centred, symmetric about X=0.

// A trailing tendril — a chain of tapering box segments that curls (mouth of
// the fighter's `tendril`), for the beast's flowing tail streamers.
function tnkTendril(grp, s, x0, y0, z0, n, len, tilt0, curl, slot, w0 = 0.013) {
  let py = y0;
  let pz = z0;
  let ang = tilt0;
  for (let i = 0; i < n; i++) {
    ang += curl;
    const L = len * (1 - i * 0.14);
    const w = w0 * (1 - i * 0.13);
    const dy = -Math.sin(ang) * L;
    const dz = -Math.cos(ang) * L;
    addRot(grp, box(w, w, L), C(s, slot), x0, py + dy / 2, pz + dz / 2, -ang, 0, 0);
    py += dy;
    pz += dz;
  }
  grp.add(part(sph(0.007, 6), GLOW(s), x0, py, pz)); // glowing tendril tip
}

// A dark chitin girdle band cinched around the body cross-section at z (a disc
// whose rim protrudes just past the flesh → reads as a raised segment band).
function tnkBand(grp, s, z, r, y = 0) {
  addRot(grp, cyl(r, r, 0.008, 14), C(s, 'dark'), 0, y, z, Math.PI / 2);
}

// The huge dorsal gas-bladder: a big bright bio-lum fluid orb (dominant), a
// chitin harness cradling it below + a ridge above, two dark cinch bands, and
// bright fluid highlight patches pressing against the skin. Reads as a lit,
// fluid-filled sac carried on the back.
function tnkSac(grp, s, cx, cy, cz, R) {
  grp.add(part(sph(R, 14), GLOW(s), cx, cy, cz)); // the glowing fluid body of the bladder
  // chitin harness — a cradle where it meets the back + a capping ridge on top
  const cradle = part(sph(R * 0.92, 12), C(s, 'accent'), cx, cy - R * 0.62, cz);
  cradle.scale.set(1.12, 0.62, 1.28);
  grp.add(cradle);
  const ridge = part(sph(R * 0.7, 12), C(s, 'accent'), cx, cy + R * 0.72, cz);
  ridge.scale.set(1.1, 0.5, 1.24);
  grp.add(ridge);
  // two dark cinch belts hugging the sac (horizontal rings — read as chitin
  //  straps cinching the bladder from every angle, no stray poke-through)
  grp.add(part(cyl(R * 0.95, R * 0.95, 0.012, 18), C(s, 'dark'), cx, cy + R * 0.34, cz));
  grp.add(part(cyl(R * 0.99, R * 0.99, 0.012, 18), C(s, 'dark'), cx, cy - R * 0.22, cz));
  // bright fluid highlight patches showing through the skin — scattered/mottled
  // (deliberately asymmetric so the sac never reads as a face)
  grp.add(part(sph(R * 0.3, 8), GLOW(s), cx + R * 0.48, cy + R * 0.2, cz + R * 0.5));
  grp.add(part(sph(R * 0.24, 8), GLOW(s), cx - R * 0.58, cy + R * 0.46, cz - R * 0.22));
}

function makeSwarmTanker(s) {
  const grp = group();

  // --- Bloated leviathan body: a chain of fat, near-round overlapping ovoids,
  //     widest at the gut, tapering to a short drooping tail. Gentle y-arch +
  //     tiny x-wobble → a slow, living, undulating beast. ~0.42 long in Z. -----
  const segs = [
    { z: 0.15, r: 0.046, slot: 'hull2', x: 0.0, y: 0.006, sz: 1.1 }, // short neck behind the head
    { z: 0.1, r: 0.076, slot: 'hull', x: 0.004, y: 0.006, sz: 1.15 }, // body swelling
    { z: 0.04, r: 0.096, slot: 'hull2', x: -0.004, y: 0.005, sz: 1.2 }, // fattest gut
    { z: -0.025, r: 0.09, slot: 'hull', x: 0.004, y: 0.002, sz: 1.2 },
    { z: -0.08, r: 0.066, slot: 'hull2', x: -0.003, y: -0.004, sz: 1.25 }, // flank narrowing
    { z: -0.13, r: 0.042, slot: 'hull', x: 0.003, y: -0.011, sz: 1.3 },
    { z: -0.168, r: 0.024, slot: 'dark', x: 0.0, y: -0.018, sz: 1.35 }, // tail base gland
    { z: -0.196, r: 0.013, slot: 'dark', x: 0.0, y: -0.024, sz: 1.35 }, // tail tip
  ];
  for (const g of segs) {
    const m = part(sph(g.r, 12), C(s, g.slot), g.x, g.y, g.z);
    m.scale.z = g.sz; // stretch each sphere into an ovoid along the body axis
    grp.add(m);
  }

  // --- Small head at +Z: a blunt chitin snout with a heavy brow, deep-set
  //     glowing eyes and short sensory barbels — a distinct little face on a
  //     slow grazing beast (kept modest; the sac is the star). -----------------
  grp.add(part(sph(0.052, 12), C(s, 'hull2'), 0, 0.012, 0.178)); // head cap (poking forward of the gut)
  const snout = part(sph(0.038, 12), C(s, 'hull'), 0, -0.004, 0.222); // snout
  snout.scale.set(1, 0.9, 1.1);
  grp.add(snout);
  addRot(grp, box(0.062, 0.015, 0.02), C(s, 'dark'), 0, 0.036, 0.212, -0.25); // heavy brow ridge
  for (const sx of [-1, 1]) grp.add(part(sph(0.014, 8), C(s, 'glass'), sx * 0.034, 0.022, 0.226)); // glowing eyes
  grp.add(part(sph(0.014, 8), C(s, 'dark'), 0, -0.014, 0.252)); // mouth pit

  // --- SIPHON proboscis: a long PENDULOUS feeding trunk hung straight down
  //     under the head, tapering and hooking forward to a wide glowing intake
  //     maw. This is how the beast drinks gas — its most telling organ. --------
  const trunk = [
    { r1: 0.036, r2: 0.031, y: -0.03, z: 0.168, rx: -0.04, h: 0.042 },
    { r1: 0.031, r2: 0.025, y: -0.082, z: 0.172, rx: -0.1, h: 0.058 },
    { r1: 0.025, r2: 0.018, y: -0.14, z: 0.181, rx: -0.22, h: 0.06 },
    { r1: 0.018, r2: 0.011, y: -0.192, z: 0.199, rx: -0.5, h: 0.056 },
  ];
  for (const t of trunk) addRot(grp, cyl(t.r1, t.r2, t.h, 12), C(s, 'hull'), 0, t.y, t.z, t.rx);
  addRot(grp, cyl(0.021, 0.021, 0.008, 12), C(s, 'accent'), 0, -0.217, 0.219, 1.1); // maw lip ring
  addRot(grp, cone(0.017, 0.032, 10), C(s, 'dark'), 0, -0.224, 0.222, 1.6); // intake bell throat
  grp.add(part(sph(0.02, 8), GLOW(s), 0, -0.22, 0.23)); // glowing intake maw

  // --- The huge dorsal GAS-BLADDER SAC — the defining feature, riding the back -
  tnkSac(grp, s, 0, 0.125, -0.025, 0.082);
  // two smaller lit sacs bulging on the flanks (the bladder spills to the sides):
  // glow-dominant with only a lower chitin cradle, so the fluid reads as LIT.
  for (const sx of [-1, 1]) {
    const glow = part(sph(0.038, 12), GLOW(s), sx * 0.092, 0.006, -0.03);
    glow.scale.set(1, 1.05, 1.15);
    grp.add(glow); // the glowing fluid of the flank sac
    const cradle = part(sph(0.032, 10), C(s, 'accent'), sx * 0.088, -0.026, -0.03);
    cradle.scale.set(1.15, 0.7, 1.2);
    grp.add(cradle); // chitin cradle underneath
  }

  // --- Ringed chitin segment bands girdling the fat body ----------------------
  tnkBand(grp, s, 0.08, 0.087, 0.005);
  tnkBand(grp, s, -0.055, 0.081, 0.0);

  // --- Lateral fin-FRILL: a soft undulating cuttlefish/moray skirt running the
  //     length of EACH flank, hugging the body just proud and waving gently in y
  //     (a swimming skirt, never a wing). Mirrored across X=0. ------------------
  const tnkFrill = (sx) => {
    const f = group();
    const zs = [0.11, 0.06, 0.01, -0.04, -0.09, -0.135, -0.175]; // head→tail along the body
    const hw = [0.07, 0.088, 0.092, 0.084, 0.062, 0.04, 0.024]; // body half-width at each z
    for (let i = 0; i < zs.length; i++) {
      const wave = Math.sin(i * 1.15) * 0.013; // gentle vertical undulation
      const seg = part(sph(0.028, 8), C(s, 'accent'), hw[i] + 0.012, wave, zs[i]);
      seg.scale.set(0.5, 0.1, 1.35); // thin, hugging ribbon flowing along the flank
      f.add(seg);
      if (i % 2 === 0) f.add(part(sph(0.005, 6), GLOW(s), hw[i] + 0.03, wave, zs[i])); // bio-lum frill spot
    }
    f.scale.x = sx;
    return f;
  };
  grp.add(tnkFrill(1));
  grp.add(tnkFrill(-1));

  // --- Dorsal glow line running fore & aft of the sac (organs through the back) -
  for (const o of [[0.125, 0.0, 0.064], [-0.09, 0.012, 0.05], [-0.135, -0.012, 0.028]]) {
    grp.add(part(sph(0.009, 6), GLOW(s), o[1], o[2], o[0]));
  }

  // --- Bio-lum organ clusters glowing through the belly ------------------------
  for (const o of [[0.048, -0.052, 0.055], [-0.048, -0.052, 0.055]]) {
    grp.add(part(sph(0.01, 6), GLOW(s), o[0], o[1], o[2]));
  }

  // --- Trailing tail streamers — thin curling jelly wisps flowing back (kept
  //     slender so they read as trailing tendrils, never a proboscis) ----------
  tnkTendril(grp, s, 0.022, -0.016, -0.198, 3, 0.046, 0.16, 0.16, 'hull', 0.008);
  tnkTendril(grp, s, -0.022, -0.012, -0.198, 3, 0.042, 0.14, 0.18, 'hull2', 0.007);
  tnkTendril(grp, s, 0.0, -0.032, -0.2, 3, 0.046, 0.32, 0.14, 'dark', 0.007);

  // --- Bio-luminescent tail gland — a small round organ, NOT a thrust plume
  //     (a leviathan swims by undulating; it has no engine). ------------------
  grp.add(part(sph(0.02, 8), GLOW(s), 0, -0.024, -0.206));
  grp.add(part(sph(0.011, 8), C(s, 'glass'), 0, -0.024, -0.206));

  return grp;
}

// SWARM LINER — a graceful passenger whale-leviathan: the fleet's beautiful one.
// A long, smooth-flowing body (a chain of overlapping stretched ovoids with a
// gentle convex back-arch), a serene head with a soft baleen mouth (no fangs, no
// lure), rows of luminous passenger PORTS running the full length of each flank
// like a lit ocean-liner's portholes, a soft undulating fin-frill skirt down each
// flank (it SWIMS — no wings, no engine), a calm bio-lum glow along the dorsal
// line and a round luminous gland at the tail. A stately living beast. Nose = +Z.
function makeSwarmLiner(s) {
  const grp = group();

  // --- Long, elegant leviathan body: a chain of overlapping stretched ovoids.
  //     Widest through the shoulders/gut, tapering gracefully to a narrow tail
  //     stock; a gentle convex back-arch (no aggressive hump). ~0.48 long. -------
  const lnrSegs = [
    { z: 0.238, r: 0.02, slot: 'hull2', y: -0.002, sz: 1.35 }, // soft tapered snout (pale)
    { z: 0.19, r: 0.041, slot: 'hull2', y: 0.004, sz: 1.4 }, // head/rostrum (pale)
    { z: 0.14, r: 0.06, slot: 'hull', y: 0.008, sz: 1.45 }, // shoulders
    { z: 0.08, r: 0.07, slot: 'hull', y: 0.011, sz: 1.5 }, // gut (widest)
    { z: 0.01, r: 0.069, slot: 'hull', y: 0.012, sz: 1.55 }, // mid body
    { z: -0.06, r: 0.06, slot: 'hull', y: 0.01, sz: 1.55 },
    { z: -0.12, r: 0.046, slot: 'hull', y: 0.006, sz: 1.6 },
    { z: -0.175, r: 0.031, slot: 'hull', y: 0.002, sz: 1.6 }, // tail stock
    { z: -0.215, r: 0.019, slot: 'dark', y: -0.002, sz: 1.6 }, // caudal gland
  ];
  for (const g of lnrSegs) {
    const m = part(sph(g.r, 14), C(s, g.slot), 0, g.y, g.z);
    m.scale.z = g.sz; // stretch each sphere into an ovoid along the body axis
    grp.add(m);
  }

  // --- SERENE HEAD: a broad soft rostrum with a gentle lower jaw and a calm
  //     baleen mouth — a neat comb of short blunt pale plates, NOT fangs. Calm
  //     eyes low on the flanks and a soft crown light. ------------------------
  const jaw = part(sph(0.043, 12), C(s, 'hull2'), 0, -0.026, 0.188); // soft wide chin
  jaw.scale.set(1.2, 0.5, 1.2);
  grp.add(jaw);
  addRot(grp, box(0.072, 0.005, 0.03), C(s, 'dark'), 0, -0.01, 0.202, 0.12); // gentle mouth seam
  for (let i = -2; i <= 2; i++) {
    // baleen — a neat row of short blunt pale plates hanging from the upper lip
    addRot(grp, box(0.006, 0.017, 0.004), C(s, 'gold'), i * 0.015, -0.02, 0.208, 0.2, 0, 0);
  }
  for (const sx of [-1, 1]) grp.add(part(sph(0.009, 8), C(s, 'glass'), sx * 0.043, -0.002, 0.152)); // calm eyes
  grp.add(part(sph(0.014, 8), GLOW(s), 0, 0.03, 0.185)); // soft crown light (blow-glow) on the head

  // --- SIGNATURE: rows of luminous passenger PORTS along each flank — an evenly
  //     spaced line of bright bio-lum portholes running the full length of the
  //     body, like a lit ocean-liner. On the upper flank (above the frill skirt).
  //     Mirrored L/R. ------------------------------------------------------------
  const lnrPorts = [
    { z: 0.15, r: 0.05, y: 0.009 },
    { z: 0.1, r: 0.062, y: 0.011 },
    { z: 0.05, r: 0.068, y: 0.012 },
    { z: 0.0, r: 0.069, y: 0.012 },
    { z: -0.05, r: 0.061, y: 0.011 },
    { z: -0.09, r: 0.052, y: 0.009 },
    { z: -0.13, r: 0.042, y: 0.006 },
    { z: -0.165, r: 0.031, y: 0.003 },
    { z: -0.195, r: 0.022, y: 0.001 },
  ];
  for (const sx of [-1, 1]) {
    for (const p of lnrPorts) {
      // sit each port just proud of the flank equator (x≈r) so the flesh never
      // buries it — a bright green porthole on the widest of the hull.
      grp.add(part(sph(0.0105, 8), GLOW(s), sx * p.r * 1.02, p.y, p.z));
    }
  }

  // --- Soft undulating lateral fin-FRILL — a cuttlefish/moray skirt hugging the
  //     LOWER flank just proud of the body and waving gently in y. This is how
  //     the leviathan swims: no wings, no airfoils, no engine. It runs the full
  //     body length below the passenger ports. Mirrored L/R. --------------------
  const lnrFrill = (sx) => {
    const f = group();
    const zs = [0.15, 0.1, 0.05, 0.0, -0.05, -0.1, -0.15, -0.19]; // head→tail
    const hw = [0.058, 0.066, 0.069, 0.069, 0.062, 0.052, 0.038, 0.024]; // flank half-width
    for (let i = 0; i < zs.length; i++) {
      const wave = Math.sin(i * 1.15) * 0.013; // gentle vertical ripple
      const seg = part(sph(0.028, 8), C(s, 'accent'), hw[i] + 0.012, wave - 0.02, zs[i]);
      seg.scale.set(0.5, 0.1, 1.35); // thin flattened flake → a continuous ribbon
      f.add(seg);
      if (i % 2 === 0) f.add(part(sph(0.005, 6), GLOW(s), hw[i] + 0.03, wave - 0.02, zs[i])); // frill spark
    }
    f.scale.x = sx;
    return f;
  };
  grp.add(lnrFrill(1));
  grp.add(lnrFrill(-1));

  // --- A calm glowing dorsal line following the back (the living-glow signature) ---
  for (const d of [[0.1, 0.058], [0.03, 0.065], [-0.05, 0.055], [-0.12, 0.04]]) {
    grp.add(part(sph(0.007, 6), GLOW(s), 0, d[1], d[0])); // dorsal glow nodes
  }

  // --- Round bioluminescent tail gland — a soft glowing organ at the tail tip
  //     (NOT a thruster plume): a leviathan has no engine, it undulates. --------
  grp.add(part(sph(0.02, 8), GLOW(s), 0, -0.002, -0.232));
  grp.add(part(sph(0.011, 8), C(s, 'glass'), 0, -0.002, -0.232));

  return grp;
}

// SWARM FLAGSHIP — the MATRIARCH: the biggest, most imposing void-leviathan of the
// grown swarm, the mother-beast the whole drone-cloud orbits. A vast arched sea-titan:
// a chain of overlapping stretched ovoids that undulate (y-arch + x-wobble) into a
// great dorsal hump; a huge gaping fanged MAW with a glowing gullet and a lure dangling
// on a long stalk at the FRONT (+Z); a great central EYE; soft undulating fin-FRILLS
// running the whole length of each flank (a swimming skirt, never wings); a full tall
// dorsal crest of bony spines; forward grasping tendril-arms + many trailing tail
// streamers; dense clusters of organs glowing THROUGH the flesh; and a cluster of round
// bio-lum glands at the tail — it SWIMS by undulating, it has no engine.
// ~1.0 long in Z, centred, nose = +Z, tail = -Z, symmetric about X=0. Flagship scale.
function makeSwarmFlagship(s) {
  const grp = group();
  const my = 0.0; // maw / head vertical centre

  // A tapering chain of curling box segments (a living limb). Curls in the YZ plane
  // so a +x0 call and a -x0 call are perfect mirrors; `zdir` aims it forward/back.
  const flgTendril = (x0, y0, z0, n, len, tilt0, curl, w0, slot, zdir) => {
    let py = y0;
    let pz = z0;
    let ang = tilt0;
    const dz0 = zdir || -1;
    for (let i = 0; i < n; i++) {
      ang += curl;
      const L = len * (1 - i * 0.1);
      const w = w0 * (1 - i * 0.09);
      const dy = -Math.sin(ang) * L;
      const dz = dz0 * Math.cos(ang) * L;
      addRot(grp, box(w, w, L), C(s, slot), x0, py + dy / 2, pz + dz / 2, dz0 * ang, 0, 0);
      py += dy;
      pz += dz;
    }
    grp.add(part(sph(Math.max(0.008, w0 * 0.7), 6), GLOW(s), x0, py, pz)); // glowing tip organ
  };

  // Soft undulating lateral fin-FRILL — a cuttlefish/moray skirt of thin flattened flaps
  // hugging each flank just proud of the body, waving gently in y, running the WHOLE
  // length of the titan (head → tail). `sx` mirrors it by negating x directly (no
  // reflection scale, so winding stays correct). Reads as swimming, never as wings.
  const flgFrillZ = [0.3, 0.25, 0.2, 0.15, 0.09, 0.03, -0.03, -0.09, -0.15, -0.2, -0.26, -0.31, -0.36, -0.41, -0.46, -0.5, -0.55];
  const flgFrillHW = [0.1, 0.12, 0.135, 0.145, 0.152, 0.156, 0.154, 0.15, 0.138, 0.126, 0.112, 0.098, 0.085, 0.072, 0.06, 0.048, 0.033]; // body half-width at each z
  const flgFrillY = [0.01, 0.024, 0.038, 0.052, 0.07, 0.086, 0.096, 0.102, 0.092, 0.08, 0.065, 0.05, 0.036, 0.022, 0.01, 0.0, -0.016]; // flank midline along the arch
  const flgFrill = (sx) => {
    const f = group();
    for (let i = 0; i < flgFrillZ.length; i++) {
      const wave = Math.sin(i * 1.0) * 0.034; // gentle vertical undulation along the skirt
      const seg = part(sph(0.062, 10), C(s, 'accent'), sx * (flgFrillHW[i] + 0.036), flgFrillY[i] + wave, flgFrillZ[i]);
      seg.scale.set(0.55, 0.12, 1.5); // thin flattened flap, elongated along the body
      f.add(seg);
      if (i % 2 === 0) f.add(part(sph(0.012, 6), GLOW(s), sx * (flgFrillHW[i] + 0.088), flgFrillY[i] + wave, flgFrillZ[i])); // frill-edge organ
    }
    return f;
  };

  // --- MASSIVE arched leviathan body: a sinuous chain of stretched ovoids. Fattest at
  //     the gut just behind the maw, arching UP into a towering dorsal hump, then a long
  //     tail that drops and trails away. y-arch + x-wobble → a living, undulating titan. --
  const flgSegs = [
    { z: 0.34, r: 0.085, slot: 'hull2', x: 0.0, y: 0.0, sz: 1.05 }, // jaw base behind the maw
    { z: 0.25, r: 0.12, slot: 'hull', x: 0.006, y: 0.024, sz: 1.15 }, // jaw / gut swelling
    { z: 0.15, r: 0.145, slot: 'hull2', x: -0.007, y: 0.052, sz: 1.25 }, // gut (widest mass)
    { z: 0.03, r: 0.156, slot: 'hull', x: 0.007, y: 0.086, sz: 1.35 }, // shoulders rising
    { z: -0.09, r: 0.15, slot: 'hull2', x: -0.006, y: 0.102, sz: 1.4 }, // dorsal hump peak
    { z: -0.2, r: 0.126, slot: 'hull', x: 0.006, y: 0.08, sz: 1.45 }, // back descending
    { z: -0.31, r: 0.098, slot: 'hull2', x: -0.005, y: 0.05, sz: 1.5 },
    { z: -0.41, r: 0.072, slot: 'hull', x: 0.004, y: 0.022, sz: 1.5 },
    { z: -0.49, r: 0.05, slot: 'hull2', x: -0.003, y: 0.0, sz: 1.55 },
    { z: -0.55, r: 0.033, slot: 'dark', x: 0.0, y: -0.016, sz: 1.6 }, // tail gland
    { z: -0.6, r: 0.02, slot: 'dark', x: 0.0, y: -0.03, sz: 1.6 }, // tail tip
  ];
  for (const seg of flgSegs) {
    const m = part(sph(seg.r, 14), C(s, seg.slot), seg.x, seg.y, seg.z);
    m.scale.z = seg.sz; // stretch each sphere into an ovoid along the body axis
    grp.add(m);
  }
  // Dark segment seams — thin flattened discs sunk between ovoids, articulating the
  // loaf into a chain of grown body-segments (a titan's carapace, not a smooth hull).
  for (const seam of [{ z: 0.2, r: 0.135, y: 0.04 }, { z: 0.09, r: 0.152, y: 0.07 }, { z: -0.03, r: 0.153, y: 0.095 }, { z: -0.15, r: 0.135, y: 0.09 }, { z: -0.26, r: 0.11, y: 0.065 }]) {
    const m = part(sph(seam.r, 14), C(s, 'dark'), 0, seam.y, seam.z);
    m.scale.set(1.02, 1.02, 0.1);
    grp.add(m);
  }

  // --- Chitin armour: broad flattened carapace plates riding the shoulders / hump,
  //     lighter than the flesh so the beast reads as grown-armoured, not smooth. ------
  const flgPlates = [
    { x: 0.0, y: 0.115, z: 0.14, sx: 1.6, sy: 0.42, sz: 1.9, r: 0.09 },
    { x: 0.0, y: 0.14, z: -0.04, sx: 1.7, sy: 0.42, sz: 2.0, r: 0.095 },
    { x: 0.0, y: 0.11, z: -0.2, sx: 1.5, sy: 0.4, sz: 1.8, r: 0.08 },
  ];
  for (const p of flgPlates) {
    const m = part(sph(p.r, 12), C(s, 'hull2'), p.x, p.y, p.z);
    m.scale.set(p.sx, p.sy, p.sz);
    grp.add(m);
  }
  // paired cheek / gill plates on the flanks
  for (const sx of [-1, 1]) {
    const m = part(sph(0.075, 10), C(s, 'hull2'), sx * 0.11, 0.01, 0.16);
    m.scale.set(0.6, 1.3, 1.5);
    grp.add(m);
  }

  // --- The MAW: a wide gullet cavity thrust FORWARD of the jaw, a deep glowing throat
  //     set inside, and a splayed crown of long bony fangs converging into a heavy bite.
  //     This gaping mouth is the whole imposing front of the matriarch. ---------------
  addRot(grp, cone(0.145, 0.28, 22), C(s, 'dark'), 0, my, 0.43, -Math.PI / 2); // cavity, rim to +Z
  grp.add(part(sph(0.03, 12), C(s, 'dark'), 0, my, 0.28)); // gullet floor (hides the cone apex)
  const flgThroat = part(sph(0.095, 14), GLOW(s), 0, my, 0.41); // glowing gullet
  flgThroat.scale.set(1, 1, 0.7);
  grp.add(flgThroat);
  grp.add(part(sph(0.05, 12), GLOW(s), 0, my, 0.31)); // deeper throat ember
  addRot(grp, cone(0.06, 0.02, 14), ACC(s), 0, my, 0.37, -Math.PI / 2); // bright inner throat ring
  addRot(grp, cone(0.15, 0.05, 22), C(s, 'hull2'), 0, my, 0.5, -Math.PI / 2); // pale bony jaw rim/lips

  // crown of fangs splayed around the rim (pale bone, tips forward + slightly out)
  const flgNT = 16;
  for (let i = 0; i < flgNT; i++) {
    const a = (i / flgNT) * Math.PI * 2;
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    addRot(grp, cone(0.018, 0.12, 5), C(s, 'gold'), cx * 0.135, my + cy * 0.135, 0.49, Math.PI / 2 - cy * 0.24, 0, cx * 0.24);
  }
  // heavy converging bite — long upper fangs curl down-in, lower fangs curl up-in
  for (const sx of [-1, 1]) {
    addRot(grp, cone(0.028, 0.19, 6), C(s, 'gold'), sx * 0.05, my + 0.095, 0.47, Math.PI / 2 + 0.42, 0, sx * 0.16);
    addRot(grp, cone(0.025, 0.16, 6), C(s, 'gold'), sx * 0.058, my - 0.09, 0.47, Math.PI / 2 - 0.42, 0, -sx * 0.16);
    addRot(grp, cone(0.02, 0.14, 6), C(s, 'gold'), sx * 0.115, my + 0.0, 0.47, Math.PI / 2, 0, sx * 0.5); // side tusks
  }

  // --- The LURE (esca): a dark stalk rising off the brow and drooping forward on a long
  //     neck, dangling a big glowing bulb far out over the bite. The matriarch's tell. --
  addRot(grp, box(0.022, 0.022, 0.22), C(s, 'hull2'), 0.012, 0.14, 0.32, 0.72, 0, 0.05); // stalk root, up-forward
  addRot(grp, box(0.018, 0.018, 0.26), C(s, 'hull2'), 0.02, 0.28, 0.5, 1.72, 0, 0.05); // droops forward over the maw
  grp.add(part(sph(0.07, 10), GLOW(s), 0.026, 0.2, 0.67)); // esca glow halo
  grp.add(part(sph(0.034, 12), C(s, 'glass'), 0.026, 0.2, 0.67)); // esca bulb
  grp.add(part(sph(0.014, 8), GLOW(s), 0.026, 0.2, 0.71)); // bright core

  // --- A great central EYE / sensor cluster set high on the brow, ringed by a dark
  //     socket, with deep-set smaller eyes low on the head sides (animal, not a cockpit).
  const flgBrow = part(sph(0.09, 12), C(s, 'hull2'), 0, 0.1, 0.26); // heavy forehead boss
  flgBrow.scale.set(1.3, 0.7, 1.2);
  grp.add(flgBrow);
  grp.add(part(sph(0.06, 12), C(s, 'dark'), 0, 0.072, 0.32)); // socket
  grp.add(part(sph(0.058, 12), GLOW(s), 0, 0.075, 0.335)); // eye glow
  grp.add(part(sph(0.05, 14), C(s, 'glass'), 0, 0.075, 0.34)); // eyeball
  grp.add(part(sph(0.02, 10), C(s, 'dark'), 0, 0.075, 0.385)); // pupil
  for (const sx of [-1, 1]) {
    addRot(grp, box(0.08, 0.02, 0.024), C(s, 'gold'), sx * 0.035, 0.12, 0.31, 0, 0, -sx * 0.5); // bony brow ridge
    grp.add(part(sph(0.02, 8), C(s, 'glass'), sx * 0.1, my - 0.02, 0.22)); // deep-set side eye
    grp.add(part(sph(0.024, 6), GLOW(s), sx * 0.1, my - 0.02, 0.225));
  }

  // --- Gill slits — dark raked marks on the flanks behind the head, faintly lit -------
  for (const sx of [-1, 1]) {
    for (const gz of [0.18, 0.13, 0.08]) {
      addRot(grp, box(0.008, 0.07, 0.014), C(s, 'dark'), sx * 0.125, 0.01, gz, 0, 0, sx * 0.3);
      grp.add(part(sph(0.011, 6), GLOW(s), sx * 0.118, -0.01, gz + 0.005));
    }
  }

  // --- Lateral fin-FRILLS: soft undulating skirts running the whole length of each
  //     flank (a swimming serpent-titan's frill, NOT wings). Mirrored across X=0. ------
  grp.add(flgFrill(1));
  grp.add(flgFrill(-1));

  // --- Dorsal CREST — a full raked-back row of jagged bony spines following the arch of
  //     the back, towering over the hump, each with a glowing organ at its base. -------
  const flgCrest = [
    { z: 0.24, y: 0.11, h: 0.11 },
    { z: 0.14, y: 0.16, h: 0.17 },
    { z: 0.05, y: 0.2, h: 0.22 }, // tallest, towering over the hump front
    { z: -0.05, y: 0.21, h: 0.21 },
    { z: -0.13, y: 0.19, h: 0.18 },
    { z: -0.21, y: 0.16, h: 0.15 },
    { z: -0.29, y: 0.12, h: 0.12 },
    { z: -0.37, y: 0.08, h: 0.09 },
    { z: -0.44, y: 0.04, h: 0.07 },
    { z: -0.5, y: 0.012, h: 0.05 },
  ];
  for (let i = 0; i < flgCrest.length; i++) {
    const sp = flgCrest[i];
    addRot(grp, cone(0.02, sp.h, 6), C(s, i % 3 === 0 ? 'accent' : 'gold'), 0, sp.y, sp.z, -0.5, 0, (i % 2 ? 0.1 : -0.08)); // bony sail-spines, mossy every third
    grp.add(part(sph(0.014, 6), GLOW(s), 0, sp.y - 0.02, sp.z));
  }
  // secondary flank spines flanking the crest — shorter, angled out, for density
  for (const sx of [-1, 1]) {
    for (const c of [{ z: 0.06, y: 0.12, h: 0.09 }, { z: -0.06, y: 0.13, h: 0.1 }, { z: -0.18, y: 0.1, h: 0.08 }]) {
      addRot(grp, cone(0.013, c.h, 5), C(s, 'gold'), sx * 0.07, c.y, c.z, -0.45, 0, sx * 0.6);
    }
  }

  // --- Forward GRASPING tendril-arms reaching off the jaw + short mouth barbels, and a
  //     spray of long trailing tail streamers flowing BACK off the tail gland. ---------
  for (const sx of [-1, 1]) {
    flgTendril(sx * 0.09, -0.02, 0.36, 7, 0.1, 0.12, 0.16, 0.024, 'hull2', 1); // upper grasping arm, reaching fwd
    flgTendril(sx * 0.065, -0.07, 0.34, 6, 0.09, 0.5, 0.19, 0.02, 'hull', 1); // lower grasping arm
    flgTendril(sx * 0.05, my - 0.05, 0.34, 3, 0.06, 0.5, 0.28, 0.013, 'hull2', 1); // mouth barbels
  }
  // asymmetric extra arm — a titan is a little irregular
  flgTendril(0.03, -0.1, 0.33, 6, 0.08, 0.75, 0.2, 0.017, 'hull', 1);

  flgTendril(0.03, -0.01, -0.62, 9, 0.095, 0.08, 0.06, 0.018, 'hull', -1); // long trailing tail streamers
  flgTendril(-0.035, 0.0, -0.62, 8, 0.09, 0.06, 0.07, 0.017, 'hull2', -1);
  flgTendril(0.055, 0.02, -0.6, 8, 0.085, 0.12, 0.07, 0.015, 'hull2', -1);
  flgTendril(0.0, -0.05, -0.62, 8, 0.085, 0.2, 0.08, 0.016, 'dark', -1); // ventral streamer

  // --- DENSE bio-lum organ clusters glowing through the belly / flanks. A few warm
  //     (port) and pale (top) nodes among the green so the titan glows like deep sea. ---
  const flgOrgans = [
    [0.1, -0.05, 0.2], [-0.11, -0.04, 0.15], [0.12, -0.02, 0.05], [-0.12, -0.03, 0.02],
    [0.11, -0.06, -0.08], [-0.1, -0.05, -0.1], [0.09, -0.05, -0.2], [-0.09, -0.06, -0.22],
    [0.065, -0.05, -0.32], [-0.06, -0.05, -0.33], [0.04, -0.04, -0.42], [-0.04, -0.04, -0.42],
    [0.0, -0.09, 0.1], [0.0, -0.1, -0.05], [0.0, -0.09, -0.18], [0.05, -0.09, -0.02],
    [-0.05, -0.09, -0.12], [0.08, 0.02, 0.24], [-0.08, 0.03, 0.24],
    // upper flanks / shoulders — glow studding the carapace along the arch
    [0.1, 0.07, 0.16], [-0.1, 0.08, 0.12], [0.11, 0.06, -0.04], [-0.11, 0.07, -0.06],
    [0.09, 0.05, -0.2], [-0.09, 0.06, -0.22], [0.06, 0.04, -0.34], [-0.06, 0.05, -0.35],
  ];
  for (let i = 0; i < flgOrgans.length; i++) {
    const o = flgOrgans[i];
    const r = 0.014 + (i % 3 === 0 ? 0.006 : 0);
    grp.add(part(sph(r, 6), GLOW(s), o[0], o[1], o[2]));
  }
  // a few colour-varied signature nodes
  for (const sx of [-1, 1]) {
    grp.add(part(sph(0.015, 6), NAV(s, 'port'), sx * 0.13, -0.01, 0.1)); // warm flank spots
    grp.add(part(sph(0.012, 6), NAV(s, 'star'), sx * 0.1, 0.02, -0.26));
  }
  grp.add(part(sph(0.016, 6), NAV(s, 'top'), 0, 0.21, -0.05)); // pale crest beacon
  grp.add(part(sph(0.05, 12), GLOW(s), 0, -0.02, 0.13)); // great heart-organ glowing through the gut

  // --- A cluster of ROUND bio-luminescent tail glands — living organs at the tail, not
  //     an engine: the leviathan swims by undulating. Round nodes, never plumes/jets. ---
  grp.add(part(sph(0.05, 10), GLOW(s), 0, -0.02, -0.6)); // great tail gland
  grp.add(part(sph(0.026, 8), GLOW(s), 0.042, -0.01, -0.58));
  grp.add(part(sph(0.026, 8), GLOW(s), -0.042, -0.01, -0.58));
  grp.add(part(sph(0.026, 8), GLOW(s), 0.0, 0.036, -0.58));
  grp.add(part(sph(0.022, 8), C(s, 'glass'), 0, -0.02, -0.575)); // pale gland core

  return grp;
}

// ===========================================================================
// BESPOKE STATIONS — grown hive structures (hub / outpost / collector)
// ===========================================================================

// SWARM HUB-HIVE (the "ring" slot) — the biggest station. Not built: GROWN. A
// dense, asymmetric clump of fused chitinous pods reads as a living hive-city,
// studded with bio-lum organ nodes, split by internal glowing chambers, crowned
// with pale bony spikes, and reaching out with big curling tendrils. A living
// swarm of small pods + bio-lum motes slowly orbits it in the XY plane
// (grp.userData.spin → the game rotates it about Z each frame). Shared fleet
// vocabulary: fused overlapping ovoids, amber chitin, mossy-green ridges,
// additive green bio-luminescence. ~2.2 across.

// Fuse a list of stretched ovoids into one asymmetric organic mass.
function rngBlob(grp, s, segs) {
  for (const seg of segs) {
    const m = part(sph(seg.r, 12), C(s, seg.slot || 'hull'), seg.x, seg.y, seg.z);
    m.scale.set(seg.sx || 1, seg.sy || 1, seg.sz || 1);
    grp.add(m);
  }
}

// Bio-luminescent organ nodes studding the carapace (additive green spots).
// Each node is [x, y, z, r].
function rngNodes(grp, s, nodes) {
  for (const n of nodes) grp.add(part(sph(n[3] || 0.06, 8), GLOW(s), n[0], n[1], n[2]));
}

// An internal glowing chamber welling from a seam or a dark recess: a bright
// opaque green core wrapped in an additive bloom → light coming from inside.
function rngChamber(grp, s, x, y, z, r) {
  grp.add(part(sph(r * 1.7, 10), GLOW(s), x, y, z)); // additive bloom
  grp.add(part(sph(r, 10), C(s, 'glass'), x, y, z)); // bright inner chamber
}

// A big curling tendril reaching out of the hive — a chain of tapering chitin
// segments, each a little more swept, ending in a glowing bulb organ. Built
// curling UP in local +Z; the caller positions/rotates the returned group to
// aim it out of the mass.
function rngTendril(s, len, n, w0, curl, slot) {
  const t = group();
  let py = 0;
  let pz = 0;
  let ang = 0;
  for (let i = 0; i < n; i++) {
    ang += curl;
    const L = len * (1 - i * 0.13);
    const w = w0 * (1 - i * 0.12);
    const dy = Math.sin(ang) * L;
    const dz = Math.cos(ang) * L;
    addRot(t, box(w, w, L), C(s, slot), 0, py + dy / 2, pz + dz / 2, -ang, 0, 0);
    py += dy;
    pz += dz;
  }
  t.add(part(sph(w0 * 1.15, 8), GLOW(s), 0, py, pz)); // glowing bulb halo
  t.add(part(sph(w0 * 0.62, 8), C(s, 'glass'), 0, py, pz)); // bright bulb core
  return t;
}

function makeSwarmRing(s) {
  const grp = group();

  // --- Core hive-city: a dense, asymmetric clump of fused chitinous pods. -----
  rngBlob(grp, s, [
    { r: 0.42, x: 0.0, y: 0.0, z: 0.0, slot: 'hull', sz: 1.25 }, // core mass
    { r: 0.36, x: 0.34, y: 0.08, z: 0.06, slot: 'hull2', sx: 1.1, sz: 1.1 },
    { r: 0.33, x: -0.3, y: -0.12, z: 0.14, slot: 'hull', sz: 1.15 },
    { r: 0.3, x: 0.08, y: 0.38, z: -0.1, slot: 'hull2', sz: 1.05 }, // upper dome
    { r: 0.24, x: -0.14, y: -0.34, z: -0.16, slot: 'dark', sz: 1.2 }, // shadowed recess
    { r: 0.26, x: 0.3, y: -0.24, z: 0.3, slot: 'hull', sz: 1.05 },
    { r: 0.24, x: -0.34, y: 0.24, z: -0.05, slot: 'hull2', sz: 1.1 }, // side bulge
    { r: 0.22, x: 0.12, y: 0.1, z: 0.42, slot: 'hull', sz: 1.1 }, // front pod
    { r: 0.2, x: -0.1, y: 0.28, z: 0.34, slot: 'hull2', sz: 1.0 },
    { r: 0.2, x: 0.42, y: 0.3, z: -0.18, slot: 'hull', sz: 1.05 },
    { r: 0.18, x: -0.42, y: -0.06, z: 0.28, slot: 'hull2', sz: 1.1 },
    { r: 0.17, x: 0.02, y: -0.44, z: 0.18, slot: 'hull2', sz: 1.0 },
    // fused-seam filler pods → reads as one grown clump, not scattered berries
    { r: 0.15, x: 0.2, y: 0.34, z: 0.18, slot: 'hull2' },
    { r: 0.14, x: -0.24, y: 0.02, z: 0.32, slot: 'hull' },
  ]);

  // --- Mossy chitin ridge fins — swept plates breaking the silhouette. Each is
  //     [x, y, z, tiltX, chord(z), height(y)], raked back like grown carapace. --
  const rngRidges = [
    [0.02, 0.34, -0.02, 0.5, 0.2, 0.2],
    [0.3, 0.16, 0.24, 0.3, -0.6, 0.18],
    [-0.3, 0.12, 0.16, 0.35, 0.7, 0.16],
    [-0.12, -0.28, 0.16, -0.4, 0.2, 0.14],
    [0.36, 0.3, -0.06, 0.6, -0.3, 0.15],
    [-0.04, 0.46, 0.22, 0.7, 0.16, 0.16],
  ];
  for (const r of rngRidges) {
    addRot(grp, box(0.022, r[5], r[4]), C(s, 'accent'), r[0], r[1], r[2], r[3], 0, r[3] * 0.5);
  }

  // --- A crown of pale bony spikes on the upper dome (chitin texture). ---------
  for (const sx of [-1, 1]) {
    addRot(grp, cone(0.03, 0.16, 6), C(s, 'gold'), sx * 0.1, 0.5, -0.06, -0.3, 0, sx * 0.25);
  }
  addRot(grp, cone(0.028, 0.14, 6), C(s, 'gold'), -0.02, 0.52, 0.14, 0.2, 0, 0.1);

  // --- Bio-lum organ nodes studding the carapace + a ring around the recess. ---
  rngNodes(grp, s, [
    [0.5, 0.24, 0.14, 0.08], [-0.46, 0.02, 0.24, 0.07], [0.14, 0.56, -0.02, 0.08],
    [0.34, -0.34, 0.36, 0.06], [0.16, 0.14, 0.56, 0.07], [-0.4, 0.34, -0.02, 0.06],
    [0.5, 0.42, -0.2, 0.055], [0.4, -0.06, -0.34, 0.055],
    [-0.02, -0.44, -0.02, 0.05], [-0.3, -0.34, -0.04, 0.05], // rim of the dark recess
    [0.3, 0.36, 0.18, 0.05], [-0.18, 0.18, 0.42, 0.05], [0.22, -0.14, 0.42, 0.05], // spread across plain faces
  ]);

  // --- Internal glowing chambers welling from seams and the dark recess, so the
  //     shadowed pods read as lit hive-mouths, not voids. ----------------------
  rngChamber(grp, s, 0.1, 0.16, 0.46, 0.1);
  rngChamber(grp, s, -0.3, 0.34, 0.12, 0.09);
  rngChamber(grp, s, 0.4, -0.12, 0.14, 0.08);
  rngChamber(grp, s, -0.08, -0.24, -0.34, 0.09);
  rngChamber(grp, s, -0.14, -0.44, -0.12, 0.075); // light in the lower dark recess

  // --- Big curling tendrils reaching out of the mass, aimed in varied dirs. ----
  const t1 = rngTendril(s, 0.34, 4, 0.05, 0.26, 'hull2');
  t1.position.set(0.44, 0.22, 0.18);
  t1.rotation.set(0.1, -0.95, 0.2);
  grp.add(t1);

  const t2 = rngTendril(s, 0.34, 4, 0.05, 0.26, 'hull2');
  t2.position.set(-0.44, 0.22, 0.18);
  t2.rotation.set(0.1, 0.95, -0.2);
  grp.add(t2);

  const t3 = rngTendril(s, 0.32, 4, 0.05, 0.28, 'hull');
  t3.position.set(0.04, 0.5, -0.1);
  t3.rotation.set(-0.5, 0.3, 0.0);
  grp.add(t3);

  const t4 = rngTendril(s, 0.3, 4, 0.045, 0.3, 'accent');
  t4.position.set(0.24, -0.36, 0.34);
  t4.rotation.set(0.8, -0.2, 0.3);
  grp.add(t4);

  // --- Living swarm orbiting the hive — small chitin pods + trailing bio-lum
  //     motes in the XY plane (baked separately; grp.userData.spin rotates it
  //     about Z each frame). -----------------------------------------------------
  const swarm = group();
  const rngN = 10;
  for (let i = 0; i < rngN; i++) {
    const a = (i / rngN) * Math.PI * 2;
    const rad = 1.08 + (i % 4) * 0.08; // radial scatter → a living cloud, not a ring
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    const z = (i % 2 ? 0.1 : -0.1) + (i % 3) * 0.04;
    const pod = part(sph(0.075 + (i % 3) * 0.016, 8), C(s, i % 2 ? 'hull2' : 'hull'), x, y, z);
    pod.scale.set(0.9, 0.9, 1.4); // stretched little ovoids, like the fleet
    swarm.add(pod);
    swarm.add(part(sph(0.042, 6), GLOW(s), x * 1.05, y * 1.05, z)); // trailing mote
  }
  // looser bio-lum motes drifting in the outer belt → depth to the cloud
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    swarm.add(part(sph(0.03, 6), GLOW(s), Math.cos(a) * 1.34, Math.sin(a) * 1.34, (i % 2 ? 0.14 : -0.14)));
  }
  grp.add(swarm);
  grp.userData.spin = swarm; // the game rotates this sub-group about Z each frame

  return grp;
}

// SWARM OUTPOST — a small grown HIVE colony (~1.3 across, about half the home
// hub). A compact, knobbly clump of fused chitinous pods with a mossy-green
// dorsal crest of glow-tipped spines, crowned by a living sensor/spawning STALK:
// a tapering neck that leans a touch (grown, not machined) and ends in a glowing
// organ bulb ringed by a splayed calyx of green sensor spikes. The stalk rises
// from a saddle between two shoulder pods; glowing organs sit sunk in dark chitin
// sockets, a lit vent opens in the low pod, and curling tendrils reach out. No swarm.
function makeSwarmOutpost(s) {
  const grp = group();

  // A stretched-ovoid pod — the atom of every grown Swarm mass.
  const optPod = (r, x, y, z, slot, sx = 1, sy = 1, sz = 1, seg = 12) => {
    const m = part(sph(r, seg), C(s, slot), x, y, z);
    m.scale.set(sx, sy, sz);
    grp.add(m);
    return m;
  };
  // A bio-luminescent organ node (additive green).
  const optNode = (x, y, z, r = 0.04) => grp.add(part(sph(r, 8), GLOW(s), x, y, z));
  // A living organ sunk in a dark chitin socket, set proud by (ox,oy,oz).
  const optOrgan = (x, y, z, ox, oy, oz) => {
    optPod(0.055, x, y, z, 'dark'); // socket rim
    optPod(0.034, x + ox, y + oy, z + oz, 'glass'); // the organ (glowing flesh)
    grp.add(part(sph(0.03, 8), GLOW(s), x + ox, y + oy, z + oz)); // halo
  };

  // 1) Fused-pod core — a compact, asymmetric clump. Two raised shoulder pods
  //    (lighter chitin) leave a saddle at the top from which the stalk grows.
  optPod(0.33, 0.0, -0.02, 0.02, 'hull', 1, 1, 1.1); // main mass
  optPod(0.24, 0.26, 0.12, 0.04, 'hull2', 1.05, 1, 1); // right shoulder
  optPod(0.23, -0.25, 0.08, 0.02, 'hull2', 1, 1.05, 1); // left shoulder
  optPod(0.2, 0.02, -0.24, -0.06, 'dark', 1.1, 1, 1.1); // low vent pod
  optPod(0.21, -0.06, 0.06, -0.22, 'hull', 1, 1, 1.15); // rear pod
  optPod(0.19, 0.19, -0.08, 0.28, 'hull2', 1, 1, 1); // forward lobe
  optPod(0.14, -0.18, -0.16, 0.2, 'hull'); // low-front lobe (bumpier silhouette)

  // 2) Chitin knobs — small fused lumps (light plates + dark warts) that break
  //    the shell into a knobbly grown carapace rather than a smooth ball.
  optPod(0.06, 0.1, 0.22, 0.18, 'hull2');
  optPod(0.05, -0.18, 0.16, 0.14, 'dark');
  optPod(0.055, 0.24, -0.02, 0.2, 'hull2');

  // 3) Mossy-green dorsal crest — a row of grown ridge spines around and behind
  //    the stalk, each with a bio-lum node at its base. [x,y,z,tilt,roll]
  const optSpines = [
    [0.16, 0.26, 0.08, 0.25, 0.4], [-0.15, 0.24, 0.06, 0.25, -0.4],
    [0.0, 0.22, -0.2, 0.55, 0.0],
  ];
  for (const sp of optSpines) {
    addRot(grp, cone(0.024, 0.14, 5), C(s, 'accent'), sp[0], sp[1], sp[2], sp[3], 0, sp[4]);
    optNode(sp[0], sp[1] - 0.03, sp[2], 0.022);
  }

  // 4) Sensor / spawning STALK — a tapering living neck rising off the saddle,
  //    leaning slightly as it grows. Entries: [y, r, x, z, slot].
  const optStalk = [
    [0.3, 0.11, 0.0, 0.03, 'hull'],
    [0.42, 0.09, 0.02, 0.04, 'hull2'],
    [0.53, 0.07, 0.03, 0.04, 'hull'],
    [0.63, 0.055, 0.035, 0.04, 'hull2'],
    [0.71, 0.045, 0.035, 0.035, 'dark'],
  ];
  for (const seg of optStalk) optPod(seg[1], seg[2], seg[0], seg[3], seg[4], 1, 1.5, 1);

  // Glowing organ head crowning the stalk — a bright bulb inside an additive halo.
  const hx = 0.045;
  const hy = 0.81;
  const hz = 0.04;
  grp.add(part(sph(0.095, 12), GLOW(s), hx, hy, hz)); // spawning-organ halo
  optPod(0.055, hx, hy, hz, 'glass'); // the bulb (glowing green flesh)
  grp.add(part(sph(0.03, 10), GLOW(s), hx, hy, hz)); // hot core
  navLight(grp, s, 'top', hx, hy + 0.11, hz, 0.04); // beacon above the bulb

  // A calyx of green sensor spikes splayed WIDE around the organ head.
  const nC = 5;
  for (let i = 0; i < nC; i++) {
    const a = (i / nC) * Math.PI * 2;
    addRot(grp, cone(0.022, 0.12, 5), C(s, 'accent'),
      hx + Math.cos(a) * 0.075, hy - 0.02, hz + Math.sin(a) * 0.075,
      Math.sin(a) * 0.85, 0, -Math.cos(a) * 0.85);
  }

  // Spawn bud — a tiny glowing glass egg budding at the stalk base.
  optPod(0.032, 0.11, 0.32, 0.12, 'glass');
  optNode(0.11, 0.32, 0.12, 0.022);

  // 5) Curling tendrils — a connected chain of tapering segments curling UP,
  //    then yawed out so each limb reaches outward from the colony and hooks up.
  const optTendril = (n, len, tilt0, curl, slot) => {
    const f = group();
    let py = 0;
    let pz = 0;
    let ang = tilt0;
    for (let i = 0; i < n; i++) {
      ang += curl;
      const L = len * (1 - i * 0.13);
      const w = 0.05 * (1 - i * 0.14);
      const dy = Math.sin(ang) * L; // curl upward
      const dz = -Math.cos(ang) * L; // reach forward (→ outward after yaw)
      addRot(f, box(w, w, L), C(s, slot), 0, py + dy / 2, pz + dz / 2, ang, 0, 0);
      py += dy;
      pz += dz;
    }
    f.add(part(sph(0.045, 8), C(s, 'glass'), 0, py, pz)); // organ bead (glowing flesh)
    f.add(part(sph(0.06, 8), GLOW(s), 0, py, pz)); // additive glow around the tip
    return f;
  };
  const t1 = optTendril(4, 0.15, 0.2, 0.26, 'accent');
  t1.position.set(0.26, -0.02, 0.06);
  t1.rotation.set(0.1, -1.4, 0.0);
  grp.add(t1);
  const t2 = optTendril(4, 0.14, 0.28, 0.3, 'hull2');
  t2.position.set(-0.26, 0.02, 0.0);
  t2.rotation.set(-0.05, 1.5, 0.12);
  grp.add(t2);

  // 6) Living organs sunk in dark chitin sockets on the visible carapace, pushed
  //    proud so they glow clear of the pods; a cluster of them faces front like a
  //    living "face". A lit vent glows in the low pod.
  optOrgan(0.3, 0.18, 0.16, 0.05, 0.04, 0.06); // right dorsal organ
  optOrgan(-0.29, 0.14, 0.14, -0.05, 0.04, 0.06); // left dorsal organ
  optOrgan(0.05, 0.02, 0.33, 0.0, 0.01, 0.05); // central forward eye
  // A smaller companion organ beside the central eye (no socket, just flesh + halo).
  optPod(0.024, -0.09, 0.09, 0.31, 'glass');
  optNode(-0.09, 0.09, 0.32, 0.022);
  optNode(0.02, -0.16, -0.02, 0.055); // glow in the hive vent

  return grp;
}

// SWARM COLLECTOR — a grown gas-skimmer hanging in a gas giant's atmosphere.
// A bulbous chitinous STORAGE body up top (fused pods swelling with the glowing
// gas it has gathered — bio-lum cores bulge through the seams), a fleshy
// segmented TRUNK/proboscis descending, chitin ring-bands cinching the trunk,
// and a flared intake MOUTH dipping DOWN (−Y) into the gas. Feeler palps curl
// off the storage crown, bio-lum organs run down the proboscis, top beacon.
// Not built — grown, of a piece with the swarm's void-leviathans. ~1.5 tall.
function makeSwarmCollector(s) {
  const grp = group();

  // --- A fleshy ovoid pod: a stretched sphere, the swarm's base building block.
  const colPod = (x, y, z, r, slot, sy = 1, sx = 1) => {
    const m = part(sph(r, 12), C(s, slot), x, y, z);
    m.scale.set(sx, sy, 1);
    grp.add(m);
    return m;
  };
  // --- A bio-lum gas core bulging OUT through a seam (additive, must protrude
  //     past the chitin to read — so it sits proud on the surface, not buried).
  const colGas = (x, y, z, r, sy = 1) => {
    const m = part(sph(r, 10), GLOW(s), x, y, z);
    m.scale.set(1, sy, 1);
    grp.add(m);
  };

  // === STORAGE BODY (up top, +Y): a fused clump of chitinous pods, asymmetric
  //     and swelling, filled with the gathered glowing gas. ====================
  colPod(0.0, 0.42, 0.0, 0.3, 'hull', 1.02, 1.06); // main mass
  colPod(0.2, 0.5, 0.05, 0.22, 'hull2');
  colPod(-0.19, 0.46, -0.05, 0.2, 'hull2');
  colPod(0.05, 0.59, -0.15, 0.19, 'hull');
  colPod(-0.09, 0.34, 0.19, 0.18, 'hull2');
  colPod(0.15, 0.31, -0.15, 0.17, 'hull'); // lower shoulder, blends into the trunk
  colPod(-0.16, 0.61, 0.09, 0.15, 'hull2'); // crown nub

  // Gas swelling through the seams between the storage pods (bulge proud so the
  // additive glow shows) — the tank is visibly full and luminous.
  colGas(0.11, 0.45, 0.25, 0.11, 0.9); // front seam
  colGas(-0.21, 0.4, 0.06, 0.1); // left seam
  colGas(0.24, 0.4, -0.05, 0.1); // right seam
  colGas(-0.03, 0.63, -0.02, 0.11, 0.85); // crown (reads strong from above)
  colGas(0.05, 0.28, -0.22, 0.09); // low-back seam
  // Crisp bright bio-lum spots dotting the carapace.
  grp.add(part(sph(0.045, 8), ACC(s), 0.26, 0.53, 0.02));
  grp.add(part(sph(0.04, 8), ACC(s), -0.12, 0.55, 0.16));

  // Feeler palps off the storage shoulders — thick segmented limbs that rise,
  // then curl OVER and down like a fern-crozier/horn, capped with a glowing organ.
  const colPalp = (x0, y0, z0, sx) => {
    let px = x0;
    let py = y0;
    const pz = z0;
    let ang = 0.45; // leans out at once, then each joint curls further over → a real curl
    for (let i = 0; i < 4; i++) {
      const L = 0.19 * (1 - i * 0.1);
      const w = 0.052 * (1 - i * 0.17);
      const dx = sx * Math.sin(ang) * L;
      const dy = Math.cos(ang) * L;
      addRot(grp, box(w, L, w), C(s, i % 2 ? 'accent' : 'hull2'), px + dx / 2, py + dy / 2, pz, 0, 0, -sx * ang);
      px += dx;
      py += dy;
      ang += 0.5; // curl over
    }
    grp.add(part(sph(0.045, 8), GLOW(s), px, py, pz)); // glowing palp tip
  };
  colPalp(0.28, 0.46, 0.05, 1);
  colPalp(-0.26, 0.44, -0.04, -1);

  // Top beacon — a short organic stalk with a nav bead at its tip (dead centre,
  // clear of the palps).
  antenna(grp, s, 0.0, 0.66, -0.02, 0.14);

  // === TRUNK / PROBOSCIS (descending toward the gas): a segmented column of
  //     bulging fleshy ovoids, narrowing as it drops. =========================
  const colTrunk = [
    { y: 0.14, r: 0.17, slot: 'hull', x: 0.0 },
    { y: 0.02, r: 0.155, slot: 'hull2', x: 0.012 },
    { y: -0.1, r: 0.145, slot: 'hull', x: -0.012 },
    { y: -0.22, r: 0.135, slot: 'hull2', x: 0.01 },
    { y: -0.33, r: 0.12, slot: 'hull', x: -0.008 },
  ];
  for (const t of colTrunk) {
    const m = part(sph(t.r, 12), C(s, t.slot), t.x, t.y, 0.0);
    m.scale.y = 1.2; // bulge each segment vertically → a caterpillar-segmented trunk
    grp.add(m);
  }

  // Chitin ring-bands cinching the trunk between segments (mossy raised ridges).
  const colRings = [
    { y: 0.08, r: 0.178 },
    { y: -0.04, r: 0.166 },
    { y: -0.16, r: 0.152 },
    { y: -0.28, r: 0.138 },
  ];
  for (const rb of colRings) {
    grp.add(part(cyl(rb.r, rb.r, 0.05, 14), C(s, 'accent'), 0.0, rb.y, 0.0));
  }

  // Bio-lum organs studding the proboscis (offset to the surface so they show).
  const colOrgans = [
    [0.15, 0.05, 0.07], [-0.14, -0.07, 0.08], [0.12, -0.19, -0.06], [-0.1, -0.3, 0.06],
  ];
  for (const o of colOrgans) grp.add(part(sph(0.045, 8), GLOW(s), o[0], o[1], o[2]));

  // === INTAKE MOUTH (dips DOWN, −Y, into the gas): the trunk pinches into a
  //     dark throat then flares into a wide chitin bell, scalloped with fleshy
  //     lobes and glowing at the rim as it draws gas in. =======================
  grp.add(part(cyl(0.11, 0.09, 0.14, 14), C(s, 'dark'), 0.0, -0.44, 0.0)); // pinched throat
  // Trumpet bell — two flaring frusta stacked into a concave (bell-curved) flare
  // that clearly opens DOWN, not a straight-sided cone-foot.
  grp.add(part(cyl(0.12, 0.24, 0.2, 20), C(s, 'hull2'), 0.0, -0.63, 0.0));
  grp.add(part(cyl(0.24, 0.4, 0.16, 20), C(s, 'hull2'), 0.0, -0.81, 0.0));
  // Dark hollow gullet nested inside the bell → the opening reads deep and open,
  // with a chitin lip left proud at the wide rim.
  grp.add(part(cyl(0.08, 0.36, 0.34, 20), C(s, 'dark'), 0.0, -0.72, 0.0));
  const colThroat = part(sph(0.11, 12), GLOW(s), 0.0, -0.49, 0.0); // glowing gas gathering at the throat
  colThroat.scale.y = 0.85;
  grp.add(colThroat);
  grp.add(part(sph(0.085, 10), GLOW(s), 0.0, -0.62, 0.0)); // deeper intake ember

  // Scalloped chitin lobes around the wide mouth rim (soft fleshy lips, pale
  // bone), with bio-lum motes glowing between them as it draws gas up.
  const colLobes = 8;
  for (let i = 0; i < colLobes; i++) {
    const a = (i / colLobes) * Math.PI * 2;
    const cx = Math.cos(a);
    const cz = Math.sin(a);
    const lobe = part(sph(0.07, 8), C(s, 'gold'), cx * 0.4, -0.86, cz * 0.4);
    lobe.scale.set(1.25, 0.55, 1.25);
    grp.add(lobe);
    if (i % 2 === 0) grp.add(part(sph(0.036, 6), GLOW(s), cx * 0.35, -0.83, cz * 0.35)); // rim glow mote
  }

  return grp;
}
