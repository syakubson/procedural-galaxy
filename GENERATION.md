# World generation — what, how much, and where

A map of the files and rules behind the galaxy's procedural generation. Everything is
**deterministic from a seed**: the same seed → the same galaxy.

## Where things live

| File | Responsibility |
|---|---|
| `src/systems/genParams.js` | **All tuning parameters** (probabilities, shares, ranges, climate/life tables) — `GEN`. Tune the balance here. |
| `src/systems/systemData.js` | Logic for generating a single system from a seed + the special systems (easter eggs). |
| `src/systems/markers.js` | Placing systems in the galaxy (on the arms, no overlap, a clear zone at the centre) + marker colours + special markers. |
| `src/systems/lore.js` | Text: names, lore, history, resources, races, facts. |
| `src/config.js` | Galaxy shape: `realSystemFraction` (share of suns → systems), quality presets (star/sun counts). |

## Life as a consequence, not a free roll

The old generator picked a system's status (inhabited / wild / ruins) as an independent roll
*before* the star, then fitted the star to match. That's backwards: a real star doesn't know
whether it's "supposed to" have a habitable planet. The generator instead runs a causal chain —

```
seed → star (unconditional) → age / binary → planet count
     → climate band per orbital slot (star class + slot index, a lookup)
     → planet archetype per slot (band restricts the choices)
     → life candidates (temperate-band terran/ocean worlds — a lookup, not a roll)
     → system status (a roll, but conditioned on "are there any candidates at all")
     → homeworld → biome / civilisation, or ruin flavour + biome
```

Status is no longer a free choice — it's what falls out of the star and the planets it happened
to end up with.

### Stars
`STAR_TYPES` in `systemData.js`: O/B/A/F/G/K/M, weighted. The star is rolled **first and
unconditionally** — nothing about the system's eventual status constrains which star it gets.
**Binaries:** `GEN.binaryChance` = 0.28; an old system (`ageGyr > 3`) still can't draw a short-lived
O/B companion (`STAR_TYPES[*].habit` gates that pool), same as before.

### Climate bands (`GEN.world.bands`)
Each orbital slot `i` of `n` gets a fraction `f = i / (n-1)` and a climate band from the star's
class edges `[endScorch, endTemperate, endCold]`: `f < endScorch` → **scorch**, `f < endTemperate` →
**temperate**, `f < endCold` → **cold**, else **frigid**. Hotter/brighter classes push the belt
outward, dim ones pull it inward — a red dwarf's temperate zone sits close in, a white star's sits
further out. This is a pure lookup: **zero rng draws**.

**O and B carry a zero-width temperate edge** (`endScorch === endTemperate`) — there is no slot that
can ever land in the temperate band, by construction. That's the entire mechanism behind "hot young
stars never host life": no separate flag, just an empty interval.

**Snap guarantee (A–M only):** if none of the discrete slot fractions land inside
`[endScorch, endTemperate)` — common at low planet counts — the slot whose `f` sits closest to the
band's centre is promoted to temperate. Still zero rng draws; a habitable zone always exists
physically, this only decides which orbital slot happens to sit in it. O/B never qualify for the
snap (their edges are equal, so there's nothing to promote into).

### Planet archetypes (`GEN.world.archetypes`)
`GEN.planetCount` = 2…7 per system. Each slot's archetype is a **weighted roll restricted to its own
climate band** — a band's table is the entire compatibility rule; an archetype absent from a band's
table cannot appear there:

| Band | Archetypes (weight) | Never appears here |
|---|---|---|
| scorch | lava (3) · rocky (3) · desert (2) | ice, gas, terran, ocean |
| temperate | terran (4) · ocean (3) · rocky (1) · desert (1) | lava, ice, gas |
| cold | gas (4) · ice (2) · rocky (1) | lava, terran, ocean |
| frigid | ice (3) · gas (3) | lava, rocky, desert, terran, ocean |

Placement still uses the "half-extent + MIN_GAP" spacing model unchanged: each body (radius + rings
+ moons) never touches its neighbour; the first planet keeps a gap from the star. Orbital speed
∝ `a^-1.5` (Kepler). **Rings:** gas ~55%, ice ~12%. **Moons:** gas ≤3, terran/ocean ≤2, others ≤1.

### Life candidates and system status (`GEN.life`)
A planet is a **life candidate** iff its band is `temperate` and its archetype is in
`GEN.world.lifeArchetypes` (`terran`/`ocean`) — a lookup over the planets already rolled above, no
extra draw. Then, **always exactly three rolls**, whether or not any candidate exists (so tweaking
the candidate maths never shifts every later draw in the system):

1. No candidates at all (always true for O/B) → **wild**, unconditionally.
2. Otherwise, `pLife = given × starLifeMul[class] × min(1, ageGyr / rampGyr)` — the first roll
   decides whether life happened at all.
3. If it did, `pExtinct = extinctShare × starExtinctMul[class]` — the second roll decides
   **ruins** vs **inhabited**.
4. If it didn't, the system is still **wild** — conditions were there, the spark never happened
   (this is the "maybe" flavour of wild system the lore in `lore.js` calls `wildMaybe`, as opposed
   to `wildNone` for a system with no candidates in the first place).
5. The third roll always picks the homeworld among the candidates (unused when the system ends up
   wild, but drawn regardless — same alignment reason as above).

`starLifeMul`/`starExtinctMul` are deliberately gentle on presence and stronger on fate: A-class
systems skew toward ruins (they leave the main sequence sooner), M-class systems skew toward wild
(flare activity chews on young biospheres) — narrative differentiation without moving the overall
50/25/25 target. `given`, `extinctShare`, and the band widths/archetype weights above were solved
together by an offline sweep across tens of thousands of procedural seeds; if you touch any of them,
re-run a similar sweep and check the split still lands within a couple of points, and that a
band × archetype scan turns up zero violations.

### Biomes (`GEN.world.biomes`, `GEN.world.biomeStarMul`)
A homeworld's natural biome is a weighted roll over **insolation tercile × archetype**: split the
temperate band into `hot` / `mild` / `cool` thirds by where the candidate actually sits
(`insol`, 0 = inner edge, 1 = outer edge; a snapped slot has no real position and is pinned to the
midpoint, i.e. `mild`), then look up that tercile's biome weights for the homeworld's archetype
(`terran` or `ocean`). `biomeStarMul` nudges the weights per star class (M leans tundra/ocean, A
leans desert) — never to zero, so no reachable combination is removed. This is what keeps jungle off
a frozen world and tundra off a scorching one: biome follows climate, not a free roll.

This roll happens for **every** inhabited/ruined homeworld, unconditionally — civilisation doesn't
change the climate. Only **spacefaring** civilisations may then pave a **city** overlay on top
(`GEN.world.cityOverlayChance`, 50%); tribal/industrial never do. The pre-overlay result is kept as
`planet.natureBiome` — "what the city was built over".

**Ruins** roll the *same* insolation table (the world used to be alive, its climate hasn't changed),
plus a flat baseline weight for "was this whole planet one city?" that `GEN.world.ruinBiomeMul`
multiplies per ruin flavour — **robotic** ruins lean hard into `city` (the machines keep a dead city
lit with no one left to live in it).

### Civilisations (inhabited)
Stage: `< GEN.civTribal (0.38)` tribal → `< GEN.civIndustrial (0.72)` industrial → else
**spacefaring**. Only spacefaring ones have ships, stations, and **colonies** (#2: each colony gets
its own hub station), plus skimmers on gas giants. Ships: 4 for a spacefaring civ.
**Colony kinds:** colonisability is not tied to a liveable climate — comfortable
(temperate/cold-band terran/ocean/rocky/desert) worlds are settled first as ordinary
**settlements**, any other solid surface hosts a pressurised **dome base** (dimmer glow), and a
temperate rocky/desert colony may turn out **terraformed** (`GEN.world.terraformChance`, flavour
only for now). Only gas giants are never colonised. So a spacefaring system runs out of colony
spots only when every other world is a gas giant.
**Factions (#24):** on inhabited systems factions are assigned **round-robin** (`markers.js`,
`FLEET_FACTIONS`), so all 6 races/styles are guaranteed to appear and all 54 ships are used.

### Ruins / dead worlds (#8/#9/#10)
Flavour is rolled **before** the biome (it reshapes the biome odds — see above): roll `0..1`,
`< GEN.ruinRobotic (0.25)` **robots** (extinct, machines keep a depot + freighters
`GEN.roboticShips` 2–4) → `< GEN.ruinDestroyed (0.5)` **crater catastrophe** →
`< GEN.ruinObliterated (0.85)` **torn into debris** → else plain grey ruins.
**Refugees** (for destroyed/obliterated): with chance `GEN.ruinRefugeChance (0.7)` they flee to a
colony on a neighbouring world (temperate/cold band, liveable archetype — survivors take a
comfortable world or none, they don't build domes; + a hub near the dead planet), otherwise they
live on a **flagship** (`GEN.fleetShips` 2–4).

### Wild worlds (#25)
With chance `GEN.scoutFlagshipChance (0.33)` a wild system has a **lone scout flagship** roaming the
system in search of a planet to colonise (roaming + matching lore). This rule does not apply to robot
freighters, and applies to wild systems whether or not they had a life candidate.

### Comets
`GEN.cometChance (0.7)` → `GEN.cometCount` 1–3. They drift slowly along a random chord (not into the star).

## Archetype catalog contract (civLevel/ruinType × biome)

The exhaustive reachability table — which combinations can actually generate:

- **Living races** — `{earthlike, ocean, jungle, tundra, desert} × {tribal, industrial, spacefaring}`
  (15) plus `city × spacefaring` (1) = **16 reachable**. `city × {tribal, industrial}` is
  **unreachable** (city is a spacefaring-only overlay, never a tribal/industrial biome).
- **Extinct races** — `{earthlike, ocean, jungle, tundra, desert, city} × {plain, robotic, destroyed,
  obliterated}` = **24 reachable**, all of them (a ruin can land on any biome including city at any
  flavour — robotic ruins just land on `city` far more often, per `ruinBiomeMul`).

## Rng draw order (contract)

`generateSystem()` draws, in order: warm-up (2, discarded) → star (1, unconditional, full
`STAR_TYPES`) → age (1) → binary chance (1, + companion star (1) if it hits) → planet count (1) →
per planet: archetype (1) → radius (1) → rings (0 or 1, gas/ice only) → moon count (1) + 4 per moon
→ orbital gap (1) → kinematics (5) → **status block: always exactly 3** (life / fate / home,
regardless of candidates) → conditionally: civ stage (1) + natural biome (1) + city overlay (1, only
if spacefaring) + satellites (1) + race (internal draws) + colonies (two shuffles: comfy pool then
hostile pool, + 1 terraform roll per comfy temperate rocky/desert colony) + skimmers, **or** ruin
flavour (1) + ruin biome (1) + extinct race (internal draws) + refuge (shuffle; +1 roll only when
the candidate pool is non-empty) → scout flagship (1, wild only) →
name/lore/resources/ships/comets (internal draws, unchanged) → faction (1). Climate bands, the snap promotion, and the candidate scan draw **nothing** — they're
lookups over already-rolled values. Changing the order or count of any of these draws changes what
a given seed produces; bump `GEN_VERSION` in `genParams.js` when that happens (see the comment
there) so a stale save gets detected instead of silently mismatching what the player is looking at.

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
