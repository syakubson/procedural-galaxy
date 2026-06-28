// Tunable knobs for procedural star-system generation — every "how much of
// what" in ONE place. `systemData.js` imports GEN and references these instead
// of scattered magic numbers, so the whole generation balance is visible and
// editable here. Full prose explanation lives in GENERATION.md.

export const GEN = {
  // NOTE: realSystemFraction (share of suns that become explorable systems) and
  // the quality-preset counts live in config.js — they're galaxy-shape knobs.

  // --- system status split (#1) ---------------------------------------------
  // A 0..1 roll: < statusInhabited → inhabited, else < statusWild → wild,
  // else ruins (dead). Targets roughly a 2/1/1 mix.
  statusInhabited: 0.5,
  statusWild: 0.75,

  // --- structure ------------------------------------------------------------
  binaryChance: 0.28, // chance a system is a close binary (two suns)
  planetCount: [2, 7], // inclusive range of planets per system
  cometChance: 0.7, // chance a system has any comets
  cometCount: [1, 3], // how many, when it does

  // --- inhabited civilisations ---------------------------------------------
  // stage split: < civTribal → tribal, else < civIndustrial → industrial,
  // else spacefaring (the only stage that fields ships, stations, colonies).
  civTribal: 0.38,
  civIndustrial: 0.72,

  // --- ruins / dead worlds (#8/#9/#10) --------------------------------------
  // ruin flavour, a 0..1 roll: < robotic → robotic, < destroyed → crater,
  // < obliterated → debris field, else a plain greyed-out ruin.
  ruinRobotic: 0.25,
  ruinDestroyed: 0.5,
  ruinObliterated: 0.85,
  ruinRefugeChance: 0.7, // survivors flee to a colony (else live on a flagship, #10)
  roboticShips: [2, 4], // cargo haulers kept running by machines (#8)
  fleetShips: [2, 4], // the surviving refugee fleet (#10)

  // --- wild systems ---------------------------------------------------------
  scoutFlagshipChance: 0.33, // a lone colony-scout flagship passing through (#25)
};
