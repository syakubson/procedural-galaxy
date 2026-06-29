// Faction style-kit: EMPIRE (imperial). A menacing militaristic fleet — dark
// charcoal angular hulls, harsh red signature, red-orange engines, cold lights.
// Consumed by every role builder in roles.js (the silhouette stays shared; this
// kit restyles its palette + adds a signature `flourish`). Schema matches the
// authored Alliance exemplar in factions.js.

import {
  C, ACC, GLOW, NAV, box, cyl, sph, part, addRot,
  group, engineGlow, navLight, runningLights, antenna,
} from './style.js';

export const FACTION = {
  id: 'imperial',
  name: 'Империя',
  colors: { hull: 0x2b2e34, hull2: 0x3b3f47, accent: 0x50555f, dark: 0x141619, glass: 0xff5247, gold: 0x7d828c },
  accent: 0xe01e10,
  glow: 0xff5a2a,
  nav: { port: 0xff3024, star: 0xff3024, top: 0xd0d6e0 },
  lore: 'Угрожающий имперский флот: чёрная угловатая броня, красные клинки маркировки и раскалённые до оранжа дюзы.',

  // Signature greebles: a blood-red spine stripe, canted dark armour plates
  // along the flanks, and (on heavy hulls) extra battery boxes + a red command
  // light. Reads as sharp, armoured, aggressive. 3-8 small meshes per ship.
  flourish(grp, roleId, style) {
    const big = roleId === 'flagship';
    const heavy = big || roleId === 'corvette';
    const minimal = roleId === 'scout';
    const wide = roleId === 'freighter' || roleId === 'tanker' || roleId === 'liner';

    // Rough hull envelope so additions stay proportional to the silhouette.
    const L = big ? 0.9 : heavy ? 0.34 : wide ? 0.38 : roleId === 'gunship' ? 0.22 : minimal ? 0.12 : 0.16;
    const W = big ? 0.3 : heavy ? 0.16 : wide ? 0.16 : minimal ? 0.06 : 0.08;
    const topY = big ? 0.05 : minimal ? 0.014 : 0.024;
    const t = big ? 0.012 : 0.006; // plate thickness

    // Blood-red signature stripe running down the spine.
    grp.add(part(box(W * 0.12, t, L * 0.55), ACC(style), 0, topY, -L * 0.06));

    // Angular dark armour plates along the flanks, slightly canted outward.
    const rows = minimal ? 1 : 2;
    for (let i = 0; i < rows; i++) {
      const z = rows === 1 ? -L * 0.08 : -L * 0.16 + i * L * 0.3;
      addRot(grp, box(W * 0.36, t, L * 0.14), C(style, 'dark'), -W * 0.44, topY * 0.55, z, 0, 0, 0.5);
      addRot(grp, box(W * 0.36, t, L * 0.14), C(style, 'dark'), W * 0.44, topY * 0.55, z, 0, 0, -0.5);
    }

    // Heavy warships: a pair of dark battery blocks + a single red command light.
    if (heavy) {
      grp.add(part(box(W * 0.18, W * 0.18, L * 0.1), C(style, 'dark'), -W * 0.3, topY * 1.4, L * 0.12));
      grp.add(part(box(W * 0.18, W * 0.18, L * 0.1), C(style, 'dark'), W * 0.3, topY * 1.4, L * 0.12));
      grp.add(part(sph(big ? 0.02 : 0.014, 8), NAV(style, 'port'), 0, topY * 2, L * 0.3));
    }
  },

  // Bespoke silhouette overrides (replace the shared role builder entirely).
  roles: { flagship: makeImperialFlagship },

  // Bespoke station builders — completely different geometry per type, NOT a
  // recolour of the shared ring/outpost/collector.
  stations: { ring: makeImperialRing, outpost: makeImperialOutpost, collector: makeImperialCollector },
};

// --- bespoke flagship: a colossal arrowhead dreadnought ---------------------
// NOSE = +Z, tail = -Z. ~1.0 long in Z, ~0.3 wide in X (×2.7 display scale is
// applied later). A long sharp triangular hull tapered from a wide armoured
// stern to a needle bow, a tall command spire flanked by two towers, red
// trench-lines down the spine, bristling batteries, and a dense rear engine
// bank. Clearly distinct from the other 8 wedge-based roles.
function makeImperialFlagship(s) {
  const grp = group();

  // Tapered spear hull: stacked box segments narrowing toward the +Z bow.
  // [z-centre, width, height, length]
  const segs = [
    [-0.42, 0.3, 0.1, 0.16],
    [-0.26, 0.26, 0.095, 0.18],
    [-0.06, 0.2, 0.085, 0.24],
    [0.16, 0.13, 0.07, 0.22],
    [0.34, 0.07, 0.055, 0.18],
    [0.47, 0.025, 0.04, 0.1], // needle bow tip
  ];
  for (const [z, w, h, l] of segs) grp.add(part(box(w, h, l), C(s, 'hull'), 0, 0, z));
  // Lighter dorsal deck plate to layer the wedge profile.
  grp.add(part(box(0.18, 0.02, 0.66), C(s, 'hull2'), 0, 0.055, -0.06));

  // Red trench-lines down the hull (signature accent, sharp and glowing-cold).
  grp.add(part(box(0.014, 0.014, 0.82), ACC(s), 0, 0.064, -0.05)); // central spine trench
  grp.add(part(box(0.01, 0.012, 0.58), ACC(s), 0.075, 0.05, -0.1)); // starboard trench
  grp.add(part(box(0.01, 0.012, 0.58), ACC(s), -0.075, 0.05, -0.1)); // port trench

  // Tall central command spire + two flank towers (dark armoured blocks).
  grp.add(part(box(0.08, 0.16, 0.12), C(s, 'dark'), 0, 0.13, -0.34)); // spire base
  grp.add(part(box(0.05, 0.1, 0.08), C(s, 'dark'), 0, 0.26, -0.34)); // spire crown
  grp.add(part(box(0.06, 0.03, 0.05), C(s, 'glass'), 0, 0.21, -0.29)); // bridge (red glass)
  for (const x of [-0.09, 0.09]) grp.add(part(box(0.045, 0.09, 0.07), C(s, 'dark'), x, 0.085, -0.3)); // flank towers

  // Bristling battery boxes along both flanks, with red weapon tips forward.
  for (const x of [-0.11, 0.11]) {
    for (const z of [0.0, -0.14, -0.28]) grp.add(part(box(0.03, 0.035, 0.05), C(s, 'dark'), x, 0.035, z));
  }
  for (const x of [-0.08, 0.08]) grp.add(part(box(0.014, 0.014, 0.05), ACC(s), x, 0.035, 0.12)); // bow gun tips

  // Dense rear engine bank: a wide row of main thrusters + raised secondaries.
  for (const x of [-0.11, -0.055, 0, 0.055, 0.11]) engineGlow(grp, s, x, 0, -0.52, 0.03);
  for (const x of [-0.08, 0.08]) engineGlow(grp, s, x, 0.06, -0.5, 0.02);

  // Lights + a red command beacon atop the spire mast.
  runningLights(grp, s, 0.16, 0, 0.1);
  antenna(grp, s, 0, 0.31, -0.34, 0.12);
  navLight(grp, s, 'port', 0, 0.36, -0.34, 0.018);
  return grp;
}

// === BESPOKE STATIONS — angular FORTRESS aesthetic, own geometry =============
// Each builder returns a fresh group (createStation faction-colours + bakes it).
// Nothing like the round Alliance hub: dark faceted hulls, wedge arms, red slits.

// HOME HUB — a dark faceted battle-fortress: a chunky polyhedral core (tilted
// overlapping boxes), a slow-spinning ring of wedge docking arms + red beacons,
// red slit-lights round the equator, a command spire on top. Biggest of the three.
function makeImperialRing(s) {
  const grp = group();

  // Faceted polyhedral core: tilted overlapping boxes read as a cut gemstone fort.
  addRot(grp, box(0.72, 0.72, 0.72), C(s, 'hull'), 0, 0, 0, 0, Math.PI / 4, 0);
  addRot(grp, box(0.64, 0.64, 0.64), C(s, 'hull2'), 0, 0, 0, Math.PI / 4, 0, 0);
  addRot(grp, box(0.5, 0.98, 0.5), C(s, 'dark'), 0, 0, 0, 0, 0, Math.PI / 4); // vertical wedge facet
  addRot(grp, box(0.98, 0.16, 0.98), C(s, 'dark'), 0, 0, 0, 0, Math.PI / 4, 0); // armoured equator belt

  // Red slit-lights round the equator (cold menacing glow).
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    grp.add(part(box(0.04, 0.2, 0.04), GLOW(s), Math.cos(a) * 0.48, 0, Math.sin(a) * 0.48));
  }

  // Spinning defence ring: wedge docking arms + red beacons (rotates about Z).
  const ring = group();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const x = Math.cos(a);
    const y = Math.sin(a);
    addRot(ring, box(0.2, 0.1, 0.46), C(s, 'hull2'), x * 0.92, y * 0.92, 0, 0, 0, a); // angular docking wedge
    addRot(ring, box(0.5, 0.06, 0.06), C(s, 'accent'), x * 0.6, y * 0.6, 0, 0, 0, a); // strut to core
    ring.add(part(sph(0.05, 8), NAV(s, 'port'), x * 1.15, y * 1.15, 0)); // arm-tip beacon
  }
  grp.add(ring);
  grp.userData.spin = ring;

  // Command spire on top with a red beacon.
  grp.add(part(box(0.12, 0.42, 0.12), C(s, 'dark'), 0, 0.58, 0));
  grp.add(part(sph(0.05, 8), NAV(s, 'port'), 0, 0.82, 0));
  return grp;
}

// COLONY OUTPOST — a small angular bunker turret: low faceted armoured base,
// a hexagonal turret drum with an up-angled barrel + red muzzle, corner slits.
function makeImperialOutpost(s) {
  const grp = group();
  addRot(grp, box(0.6, 0.22, 0.6), C(s, 'hull'), 0, -0.1, 0, 0, Math.PI / 4, 0); // faceted bunker base
  grp.add(part(box(0.5, 0.16, 0.5), C(s, 'dark'), 0, 0.05, 0)); // armour cap
  grp.add(part(cyl(0.16, 0.2, 0.22, 6), C(s, 'hull2'), 0, 0.2, 0)); // hex turret drum
  addRot(grp, box(0.08, 0.08, 0.42), C(s, 'dark'), 0, 0.27, 0.18, -0.32, 0, 0); // up-angled barrel
  grp.add(part(box(0.05, 0.05, 0.06), ACC(s), 0, 0.36, 0.36)); // red muzzle tip
  for (const [x, z] of [[0.28, 0.28], [-0.28, 0.28], [0.28, -0.28], [-0.28, -0.28]]) {
    grp.add(part(sph(0.035, 6), NAV(s, 'port'), x, -0.05, z)); // corner red slit-lights
  }
  grp.add(part(box(0.02, 0.3, 0.02), C(s, 'accent'), 0, 0.46, -0.2)); // sensor mast
  return grp;
}

// GAS-GIANT SKIMMER — an armoured claw-scoop reaching DOWN (−Y): a faceted top
// body + tanks, a central throat, four angular claw-fingers clamping downward
// with red scoop-tip glow and a red intake mouth.
function makeImperialCollector(s) {
  const grp = group();
  addRot(grp, box(0.5, 0.3, 0.5), C(s, 'hull'), 0, 0.35, 0, 0, Math.PI / 4, 0); // faceted top body
  grp.add(part(box(0.4, 0.16, 0.4), C(s, 'dark'), 0, 0.56, 0)); // armour cap
  grp.add(part(cyl(0.12, 0.12, 0.42, 8), C(s, 'hull2'), 0, 0.1, 0)); // intake throat
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(a);
    const z = Math.sin(a);
    addRot(grp, box(0.16, 0.52, 0.1), C(s, 'dark'), x * 0.28, -0.34, z * 0.28, 0.6, -a, 0); // claw finger, angled down-inward
    grp.add(part(box(0.05, 0.05, 0.05), GLOW(s), x * 0.34, -0.58, z * 0.34)); // red scoop-tip glow
  }
  grp.add(part(sph(0.1, 8), GLOW(s), 0, -0.16, 0)); // red intake mouth glow
  for (const x of [-0.45, 0.45]) grp.add(part(sph(0.14, 10), C(s, 'hull2'), x, 0.5, 0)); // storage tanks
  grp.add(part(box(0.02, 0.36, 0.02), C(s, 'accent'), 0, 0.8, 0)); // mast
  grp.add(part(sph(0.04, 6), NAV(s, 'port'), 0, 0.98, 0)); // top beacon
  return grp;
}
