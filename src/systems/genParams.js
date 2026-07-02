// Tunable knobs for procedural star-system generation — every "how much of
// what" in ONE place. `systemData.js` imports GEN and references these instead
// of scattered magic numbers, so the whole generation balance is visible and
// editable here. Full prose explanation lives in GENERATION.md.

// Bump this whenever the ORDER or COUNT of rng draws inside generateSystem()
// (or any of the special-system generators) changes. The galaxy is a pure
// function of its seed, so the same seed pulled through a different draw
// sequence produces a DIFFERENT galaxy — a saved party keyed to the old
// sequence would silently mismatch what the player is actually looking at.
// `src/state/party.js` reads this to detect a stale save and start fresh.
export const GEN_VERSION = 1;

export const GEN = {
  // NOTE: realSystemFraction (share of suns that become explorable systems) and
  // the quality-preset counts live in config.js — they're galaxy-shape knobs.

  // --- structure ------------------------------------------------------------
  binaryChance: 0.28, // chance a system is a close binary (two suns)
  planetCount: [2, 7], // inclusive range of planets per system
  cometChance: 0.7, // chance a system has any comets
  cometCount: [1, 3], // how many, when it does

  // --- climate & world archetypes ("life as a consequence") -----------------
  // A system's star is rolled first and unconditionally; everything about
  // whether it can host life follows from that choice, not the other way
  // round. Each orbital slot gets a climate band from its index alone (no
  // roll), the band restricts which planet archetypes can occupy it, and
  // "candidate for life" falls out of that lookup instead of being decided by
  // a free biome roll. See GENERATION.md for the full causal chain.
  world: {
    // Index-space band edges per star class: [endScorch, endTemperate, endCold].
    // f = slotIndex / (slotCount - 1); f < edge0 → scorch, < edge1 → temperate,
    // < edge2 → cold, else frigid. Hotter/brighter stars push the belt outward
    // (A), dim ones pull it in (M). O/B carry a ZERO-WIDTH temperate edge
    // (endScorch === endTemperate) — there is no temperate slot to land in, by
    // construction, which is what makes their systems lifeless.
    bands: {
      O: [0.7, 0.7, 0.9],
      B: [0.6, 0.6, 0.85],
      A: [0.12, 0.83, 0.9],
      F: [0.14, 0.76, 0.85],
      G: [0.1, 0.7, 0.82],
      K: [0.07, 0.65, 0.8],
      M: [0.02, 0.62, 0.75],
    },
    // A–M only: if no slot's f lands in [edge0, edge1) on the discrete grid
    // (common at low planet counts), the slot closest to the band's centre is
    // promoted to temperate. Deterministic lookup, no roll — a habitable zone
    // always exists physically, this only decides which slot sits in it.
    // O/B never qualify (their edge0 === edge1, see `bands` above).
    bandSnap: true,
    // Climate band → weighted planet archetypes. A key's ABSENCE is a hard
    // ban, not a low weight — this is the single source of truth for "what
    // can exist where" (replaces a separate per-zone allow-list): lava only
    // ever appears in scorch, ice/gas only from the snow line out, terran/
    // ocean only in the temperate band.
    archetypes: {
      scorch: { lava: 3, rocky: 3, desert: 2 },
      temperate: { terran: 4, ocean: 3, rocky: 1, desert: 1 },
      cold: { gas: 4, ice: 2, rocky: 1 },
      frigid: { ice: 3, gas: 3 },
    },
    // Archetypes that can carry life — a temperate-band planet of one of
    // these types is a "candidate"; everything about system status below
    // is downstream of how many candidates a system ends up with.
    lifeArchetypes: ['terran', 'ocean'],
    // Insolation tercile (hot/mild/cool — a candidate's relative position
    // inside the temperate band) × archetype → weighted natural biome. This
    // is what keeps jungle off a cold-band world and tundra off a scorching
    // one: the biome is a function of where in the habitable zone the world
    // actually sits, not a free roll.
    biomes: {
      hot: { terran: { desert: 3, jungle: 2 }, ocean: { jungle: 2, ocean: 2 } },
      mild: { terran: { earthlike: 3, jungle: 1 }, ocean: { ocean: 3, earthlike: 1 } },
      cool: { terran: { tundra: 3, earthlike: 1 }, ocean: { ocean: 2, tundra: 2 } },
    },
    // Soft per-class nudges on top of the biome weights above (never zero —
    // they shade frequency, they don't remove a reachable combination).
    biomeStarMul: {
      M: { tundra: 1.5, ocean: 1.3, jungle: 0.5 }, // dim red light, tidal lock
      A: { desert: 1.5, jungle: 0.6 }, // harsh UV
    },
    // A ruined homeworld rolls the SAME biome table as a living one (it was a
    // living climate once), plus a flat baseline weight for "city" (a ruin
    // can always turn out to have been a single dead planet-city) that this
    // multiplies per ruin flavour — robotic ruins lean hard into "the machines
    // still run a city with no one left to live in it".
    ruinBiomeMul: { robotic: { city: 3 } },
    // A spacefaring civilisation may pave over its natural biome with a city;
    // tribal/industrial never do (city is a civilisation overlay, not climate).
    cityOverlayChance: 0.5,
    // A temperate-band rocky/desert colony may turn out to have been
    // terraformed rather than merely settled (owner decision 2026-07-03:
    // colonies are not tied to naturally liveable worlds — bases and
    // terraforming exist). Flavour only for now: no shader change until the
    // hero-texture stage.
    terraformChance: 0.35,
  },

  // --- life as a consequence, not a free roll ---------------------------
  // A system with zero life-candidate planets (no temperate-band terran/ocean
  // — always true for O/B, since they have no temperate band at all) is wild,
  // full stop; no roll needed. Otherwise: pLife = given × starLifeMul[class] ×
  // min(1, ageGyr/rampGyr) is the chance life happened at all; conditional on
  // that, extinctShare × starExtinctMul[class] is the chance it already ended
  // (ruins) rather than still going (inhabited). `given`/`extinctShare` are
  // solved, not guessed — see the calibration note below and GENERATION.md.
  life: {
    targets: { inhabited: 0.5, wild: 0.25, ruins: 0.25 }, // documentation only
    // `given`/`extinctShare` (and the band widths + temperate archetype
    // weights above) were solved together by a one-off calibration script
    // over 50k procedural seeds: measured split ≈ 48.9% / 25.0% / 26.1%
    // (inhabited/wild/ruins), zero band×archetype or biome×tercile gating
    // violations. Re-run the same kind of sweep after touching any of these
    // numbers — see GENERATION.md.
    given: 0.98,
    extinctShare: 0.32,
    rampGyr: 0.5, // ageFactor = min(1, ageGyr / rampGyr) — young stars roll worse odds
    starLifeMul: { A: 0.8, F: 1.0, G: 1.05, K: 1.05, M: 0.9 },
    starExtinctMul: { A: 1.6, M: 1.15 }, // A stars leave the main sequence sooner; M flares chew on their biospheres
  },

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
