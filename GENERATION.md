# World generation — what, how much, and where

A map of the files and rules behind the galaxy's procedural generation. Everything is
**deterministic from a seed**: the same seed → the same galaxy.

## Where things live

| File | Responsibility |
|---|---|
| `src/systems/genParams.js` | **All tuning parameters** (probabilities, shares, ranges) — `GEN`. Tune the balance here. |
| `src/systems/systemData.js` | Logic for generating a single system from a seed + the special systems (easter eggs). |
| `src/systems/markers.js` | Placing systems in the galaxy (on the arms, no overlap, a clear zone at the centre) + marker colours + special markers. |
| `src/systems/lore.js` | Text: names, lore, history, resources, races, facts. |
| `src/config.js` | Galaxy shape: `realSystemFraction` (share of suns → systems), quality presets (star/sun counts). |

## How much of what (values in `genParams.js`)

### System status (#1) — target ≈ 2/1/1
Roll `0..1`: `< GEN.statusInhabited (0.5)` → **inhabited**, else `< GEN.statusWild (0.75)` →
**wild**, else **ruins (dead)**. Result ≈ 50% / 25% / 25%.
*(Before the roll the generator "warms up" with two throwaway `rng.next()` calls — the first
mulberry32 roll on a string seed is biased and skewed the shares without the warm-up.)*

### Stars
`STAR_TYPES` in `systemData.js`: O/B/A/F/G/K/M, weighted. Hot O/B stars are short-lived and **cannot**
be inhabited or old. Inhabited systems always have a long-lived star (A–M).
**Binaries:** `GEN.binaryChance` = 0.28. Planets then orbit the barycentre.

### Planets
`GEN.planetCount` = 2…7 per system. Archetypes (`PLANET_DEFS`): lava / rocky / desert / terran /
ocean / ice / gas. Zones: inner (lava/rocky/desert) → mid (terran/ocean/…) → outer (gas/ice).
Placement uses a "half-extent + MIN_GAP" model: each body (radius + rings + moons) never touches its
neighbour; the first planet keeps a gap from the star. Orbital speed ∝ `a^-1.5` (Kepler).
**Rings:** gas ~55%, ice ~12%. **Moons:** gas ≤3, terran/ocean ≤2, others ≤1.
**Inhabited biomes** (`BIOMES`): earthlike / ocean / jungle / tundra / desert / city.

### Civilisations (inhabited)
Stage: `< GEN.civTribal (0.38)` tribal → `< GEN.civIndustrial (0.72)` industrial → else
**spacefaring**. Only spacefaring ones have ships, stations, and **colonies** (#2: each colony gets
its own hub station), plus skimmers on gas giants. Ships: 4 for a spacefaring civ.
**Factions (#24):** on inhabited systems factions are assigned **round-robin** (`markers.js`,
`FLEET_FACTIONS`), so all 6 races/styles are guaranteed to appear and all 54 ships are used.

### Ruins / dead worlds (#8/#9/#10)
Flavour (roll `0..1`): `< GEN.ruinRobotic (0.25)` **robots** (extinct, machines keep a depot +
freighters `GEN.roboticShips` 2–4) → `< GEN.ruinDestroyed (0.5)` **crater catastrophe** →
`< GEN.ruinObliterated (0.85)` **torn into debris** → else plain grey ruins.
**Refugees** (for destroyed/obliterated): with chance `GEN.ruinRefugeChance (0.7)` they flee to a
colony on a neighbouring world (+ a hub near the dead planet), otherwise they live on a **flagship**
(`GEN.fleetShips` 2–4).

### Wild worlds (#25)
With chance `GEN.scoutFlagshipChance (0.33)` a wild system has a **lone scout flagship** roaming the
system in search of a planet to colonise (roaming + matching lore). This rule does not apply to robot
freighters.

### Comets
`GEN.cometChance (0.7)` → `GEN.cometCount` 1–3. They drift slowly along a random chord (not into the star).

## Special systems (easter eggs)
Hand-authored generators in `systemData.js` via `makeSpecialSystem` + `specPlanet`:
- `generateSolarSystem()` — our Solar System, 1:1 (#13).
- `generateDeadSpace()` — "Black Quarantine", Dead Space-flavoured (#19).
- `generateFilmWorlds()` — 4 film worlds: Twin-Sun, Spice Reach, Storm Moon, Ice Wilds (#20).
- `generateGalacticCore()` / `generateInterstellar()` — two black holes.
- `generateDeathStar()` — the Death Star "Hand", event easter egg #12 (`kind: 'deathstar'`,
  `event: true`). Rendered by `deathStar.js`: an armoured sphere + an equatorial trench + latitude
  furrows + a concave superlaser dish with a green emitter. Around it — an escort of 5 imperial ships
  (`faction: 'imperial'`, wedge flagships + fighters) roaming around the station. The only lit object
  in the system view — `systemView._loadDeathStar` adds directional + ambient light (the ships are
  unlit MeshBasic and ignore lighting).

Special-system markers use a distinct colour — **magenta `#e879ff`** (`markers.js` `SPECIAL_COLOR`),
are flagged as "special" in the legend, and their planets carry a ✦ tag in the panel. `special: true`
⇒ they do **not** count toward the "Charted" counter. **Event** objects (`event: true` — both black
holes and the Death Star) are drawn with the `_addSpecial` marker (a dark disc with a ring) in amber
and pulse more strongly.

## Galaxy markers (`markers.js`)
Status colours: inhabited `#7dffb0`, wild `#5aa0ff`, ruins `#ffb066`, special `#e879ff`. Markers are
opaque icons drawn on top of everything (#12), never overlap (minSep), and leave a system-free zone
around the central black hole (#21). The share of systems relative to the sun count is
`config.realSystemFraction` (0.4).
