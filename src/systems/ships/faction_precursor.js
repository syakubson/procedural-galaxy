// Faction style-kit: ПРЕДТЕЧИ (precursor / ancient). A sacred, mysterious fleet —
// gold-and-bronze hulls etched with glowing rune-bands and ringed by FLOATING
// geometric shards held aloft in light. Consumed by every role builder in
// roles.js (the silhouette stays shared; this kit restyles its palette + adds a
// luminous `flourish`), plus a bespoke flagship hull and a station signature.
// Schema matches the authored Alliance exemplar in factions.js.

import { group, C, ACC, GLOW, NAV, box, sph, cone, part, addRot, engineGlow, navLight, runningLights } from './style.js';

// Bespoke flagship: an ORNATE MONOLITH — a tall diamond/obelisk hull (stacked,
// scaled boxes + a cone prow), surrounded by separated floating shards, etched
// with glowing gold rune-bands, crowned by a luminous prow node. NOSE = +Z.
// ~1.05 long, ~0.3 wide, clearly the biggest and unlike the other 8 roles.
function makePrecursorFlagship(s) {
  const grp = group();

  // --- Central monolith: stacked, scaled boxes forming a tall diamond slab. ---
  grp.add(part(box(0.18, 0.34, 0.9), C(s, 'hull'), 0, 0, 0)); // tall core monolith
  grp.add(part(box(0.26, 0.2, 0.68), C(s, 'hull2'), 0, 0, -0.04)); // mid girth
  grp.add(part(box(0.1, 0.44, 0.46), C(s, 'hull'), 0, 0, 0.04)); // tall dorsal fin
  // Canted diamond ridges along the spine (rotated boxes give the obelisk edges).
  addRot(grp, box(0.15, 0.15, 0.78), C(s, 'dark'), 0, 0.17, -0.06, 0, 0, Math.PI / 4);
  addRot(grp, box(0.15, 0.15, 0.78), C(s, 'dark'), 0, -0.17, -0.06, 0, 0, Math.PI / 4);

  // --- Ornate cone prow at the NOSE (tip toward +Z). ---
  addRot(grp, cone(0.12, 0.28, 6), C(s, 'hull2'), 0, 0, 0.52, Math.PI / 2, 0, 0);

  // --- Twin engines at the tail (−Z). ---
  engineGlow(grp, s, -0.07, 0, -0.46, 0.05);
  engineGlow(grp, s, 0.07, 0, -0.46, 0.05);

  // --- Floating geometric shards hovering, separated, around the hull. ---
  grp.add(part(cone(0.04, 0.15, 4), GLOW(s), 0, 0.36, 0.1)); // crown shard above
  addRot(grp, cone(0.03, 0.11, 4), ACC(s), -0.27, 0.1, -0.08, 0, 0, 0.5); // left obelisk shard
  addRot(grp, cone(0.03, 0.11, 4), ACC(s), 0.27, 0.1, -0.08, 0, 0, -0.5); // right obelisk shard
  grp.add(part(box(0.02, 0.09, 0.02), GLOW(s), 0, -0.32, 0.02)); // lower shard hovering beneath

  // --- Glowing gold rune-band lines down the hull (thin GLOW boxes). ---
  grp.add(part(box(0.012, 0.005, 0.72), GLOW(s), 0, 0.2, 0)); // dorsal spine rune
  grp.add(part(box(0.005, 0.3, 0.012), GLOW(s), 0.092, 0, 0)); // right flank rune
  grp.add(part(box(0.005, 0.3, 0.012), GLOW(s), -0.092, 0, 0)); // left flank rune
  grp.add(part(box(0.12, 0.005, 0.012), GLOW(s), 0, 0.2, 0.22)); // rune cross-band

  // --- Luminous prow node + crown / running lights. ---
  grp.add(part(sph(0.03, 10), GLOW(s), 0, 0, 0.42));
  navLight(grp, s, 'top', 0, 0.38, 0.1, 0.012);
  runningLights(grp, s, 0.15, -0.05, -0.3);

  return grp;
}

// Bespoke stations — COMPLETELY different geometry per kind (no shared shapes,
// no flat halo rings). Sacred, luminous, geometric: a glowing golden core ringed
// by FLOATING obelisk shards held in light, etched with gold rune-bands.

// Home HUB (biggest): a luminous golden core inside a bronze diamond, encircled
// by a slowly-spinning formation of floating obelisk shards held by light.
function makePrecursorRing(s) {
  const grp = group();

  // Central glowing golden core nested in a bronze diamond (two cones base-to-base).
  grp.add(part(sph(0.24, 16), GLOW(s), 0, 0, 0)); // luminous core
  addRot(grp, cone(0.22, 0.42, 4), C(s, 'hull'), 0, 0.21, 0); // upper diamond half (tip +Y)
  addRot(grp, cone(0.22, 0.42, 4), C(s, 'hull'), 0, -0.21, 0, Math.PI, 0, 0); // lower half (tip −Y)
  // Gold rune-bands crossing the core.
  grp.add(part(box(0.56, 0.014, 0.014), GLOW(s), 0, 0, 0));
  grp.add(part(box(0.014, 0.014, 0.56), GLOW(s), 0, 0, 0));

  // Floating obelisk shards in a ring formation — kept in a sub-group that spins.
  const wheel = group();
  const R = 1.0;
  const N = 6;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const x = Math.cos(a) * R;
    const z = Math.sin(a) * R;
    addRot(wheel, cone(0.08, 0.36, 4), ACC(s), x, 0, z, 0, -a, 0); // bronze obelisk, upright
    wheel.add(part(sph(0.05, 8), GLOW(s), x, 0.26, z)); // glowing tip node
    addRot(wheel, box(0.014, 0.014, R * 0.78), GLOW(s), Math.cos(a) * R * 0.5, 0, Math.sin(a) * R * 0.5, 0, -a, 0); // rune spoke
  }
  grp.add(wheel);
  grp.userData.spin = wheel;
  return grp;
}

// Small colony OUTPOST: a single floating shard cluster around a small core.
function makePrecursorOutpost(s) {
  const grp = group();
  grp.add(part(sph(0.15, 12), GLOW(s), 0, 0, 0)); // small glowing core
  addRot(grp, cone(0.14, 0.26, 4), C(s, 'hull'), 0, 0.12, 0); // bronze diamond top
  addRot(grp, cone(0.14, 0.26, 4), C(s, 'hull'), 0, -0.12, 0, Math.PI, 0, 0); // bottom
  grp.add(part(box(0.66, 0.012, 0.012), GLOW(s), 0, 0, 0)); // gold rune-band line

  // Floating shard cluster (separated, held by light).
  const cl = [
    [0.42, 0.26, 0.05],
    [-0.36, 0.16, 0.32],
    [0.12, -0.34, -0.36],
    [-0.22, 0.32, -0.34],
  ];
  for (const [x, y, z] of cl) {
    addRot(grp, cone(0.05, 0.18, 4), ACC(s), x, y, z, 0, 0, x * 0.6); // small obelisk shard
    grp.add(part(sph(0.03, 8), GLOW(s), x, y + 0.12, z)); // glowing tip
  }
  grp.add(part(sph(0.045, 8), NAV(s, 'star'), 0, 0.56, 0)); // beacon
  return grp;
}

// Gas COLLECTOR (skimmer, downward −Y): a glowing rune-funnel of stacked gold
// prisms drawing gas down a luminous intake beam.
function makePrecursorCollector(s) {
  const grp = group();
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    const y = 0.46 - i * 0.22;
    const w = 0.62 - i * 0.11; // narrows downward into the throat
    addRot(grp, box(w, 0.1, w), i % 2 ? C(s, 'hull') : C(s, 'hull2'), 0, y, 0, 0, Math.PI / 4, 0); // canted gold prism
    grp.add(part(box(w * 1.04, 0.012, 0.012), GLOW(s), 0, y + 0.06, 0)); // rune-band per level
  }
  grp.add(part(sph(0.1, 12), GLOW(s), 0, 0.5, 0)); // top luminous core
  grp.add(part(box(0.04, 1.3, 0.04), GLOW(s), 0, -0.2, 0)); // downward intake beam (−Y)
  grp.add(part(sph(0.07, 10), GLOW(s), 0, -0.86, 0)); // glowing intake mouth below
  addRot(grp, cone(0.05, 0.2, 4), ACC(s), 0.55, 0.3, 0, 0, 0, 0.4); // floating flank shard
  addRot(grp, cone(0.05, 0.2, 4), ACC(s), -0.55, 0.3, 0, 0, 0, -0.4);
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

  // Bespoke flagship hull (overrides the shared silhouette for this role).
  roles: { flagship: makePrecursorFlagship },

  // Bespoke station builders (completely different geometry per kind, no rings).
  stations: { ring: makePrecursorRing, outpost: makePrecursorOutpost, collector: makePrecursorCollector },

  // Per-ship signature for the other roles: glowing gold rune-bands down the
  // spine + symmetric flank ticks, plus FLOATING glowing shards hovering just
  // off the hull as if held by light. No rings. 4-8 small additive/accent meshes
  // (kept within the bake's two-draw-call budget).
  flourish(grp, roleId, style) {
    const big = roleId === 'flagship';
    const heavy = big || roleId === 'corvette';
    const minimal = roleId === 'scout';
    const wide = roleId === 'freighter' || roleId === 'tanker' || roleId === 'liner';

    // Rough hull envelope so the ornamentation scales with the silhouette.
    const L = big ? 0.9 : heavy ? 0.34 : wide ? 0.38 : roleId === 'gunship' ? 0.22 : minimal ? 0.12 : 0.16;
    const W = big ? 0.3 : heavy ? 0.16 : wide ? 0.16 : minimal ? 0.06 : 0.08;
    const topY = big ? 0.05 : minimal ? 0.014 : 0.024;
    const t = big ? 0.01 : 0.005; // rune-band thickness

    // --- Glowing gold rune-band down the spine. ---
    grp.add(part(box(W * 0.06, t, L * 0.5), GLOW(style), 0, topY, -L * 0.04));

    // --- Symmetric rune ticks along the flanks (one row on the scout, two else). ---
    const rows = minimal ? 1 : 2;
    for (let i = 0; i < rows; i++) {
      const z = rows === 1 ? L * 0.06 : -L * 0.16 + i * L * 0.34;
      grp.add(part(box(W * 0.26, t, t), GLOW(style), -W * 0.34, topY * 0.85, z));
      grp.add(part(box(W * 0.26, t, t), GLOW(style), W * 0.34, topY * 0.85, z));
    }

    // --- Floating glowing shards hovering just off the hull. ---
    const shardR = minimal ? 0.01 : big ? 0.03 : 0.016;
    const shardH = minimal ? 0.03 : big ? 0.09 : 0.05;
    const hoverY = topY + (big ? 0.12 : minimal ? 0.04 : 0.07);
    grp.add(part(cone(shardR, shardH, 4), GLOW(style), 0, hoverY, L * 0.05)); // crown shard above
    if (heavy) {
      const fx = W * 0.85;
      addRot(grp, cone(shardR * 0.85, shardH * 0.85, 4), ACC(style), -fx, topY + 0.05, -L * 0.05, 0, 0, 0.4);
      addRot(grp, cone(shardR * 0.85, shardH * 0.85, 4), ACC(style), fx, topY + 0.05, -L * 0.05, 0, 0, -0.4);
    } else if (!minimal) {
      grp.add(part(box(shardR, shardH * 0.6, shardR), GLOW(style), 0, hoverY * 0.8, -L * 0.22)); // rear shard
    }
  },
};
