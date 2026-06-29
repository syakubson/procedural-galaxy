// The "system view": a self-contained scene with the star at the origin and
// its planets orbiting it. Has its own camera + controls (toggled on entry).
// main.js points the shared post-processing RenderPass at this scene while in
// system mode, so it gets the same HDR + ACES look as the galaxy.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createRng } from '../rng.js';
import { starVertexShader, starFragmentShader } from '../shaders/starSurfaceShader.js';
import { Planet } from './planet.js';
import { BlackHole } from './blackHole.js';
import { Endurance } from './endurance.js';
import { DeathStar } from './deathStar.js';
import { Ishimura } from './ishimura.js';
import { ROLES, buildShip, getFaction } from './ships.js';
import { Comet } from './comet.js';

const TAU = Math.PI * 2;

// Scratch vectors for ship steering (ships are modelled with the nose at +Z).
const _sv = new THREE.Vector3(); // target planet world pos
const _sd = new THREE.Vector3(); // ship -> target
const _sdir = new THREE.Vector3(); // unit velocity
const _rad = new THREE.Vector3(); // outward radial (star-avoidance, #9)
const _FWD = new THREE.Vector3(0, 0, 1);
const _fp = new THREE.Vector3(); // focus: planet world position (#6)
const _fd = new THREE.Vector3(); // focus: view/approach direction
const _ftmp = new THREE.Vector3();

export class SystemView {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#03030a');

    this.camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.05,
      6000,
    );

    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.enablePan = false;
    this.controls.enabled = false;

    this._loadSkybox();

    this.starGroup = new THREE.Group();
    this.scene.add(this.starGroup);
    this.planets = [];
    this.ships = [];
    this.comets = [];
    this._starMats = [];
    this._starGeos = [];
    this._binary = false;
    this._starKeepout = 0; // star avoidance radius for ship traffic (#9)
    this.blackHole = null;
    this.endurance = null;
    this._zoom = null;
    this._wantControls = false;
  }

  // Equirectangular nebula skybox — an inward-facing sphere with a baked 4K
  // starfield+nebula. Built once (persistent), but its ORIENTATION is randomised
  // per system in load() so the same backdrop reads differently each time.
  _loadSkybox() {
    const geo = new THREE.SphereGeometry(4000, 48, 32);
    const mat = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      color: 0x9c9caa, // dimmed so the nebula recedes behind the planets
      depthWrite: false,
      fog: false,
    });
    const sky = new THREE.Mesh(geo, mat);
    sky.renderOrder = -10;
    sky.frustumCulled = false;
    this.scene.add(sky);
    this._sky = sky;
    this._skyMat = mat;
    new THREE.TextureLoader().load('textures/skybox_space.jpg', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      mat.map = tex;
      mat.needsUpdate = true;
    });
  }

  /** Build the star + planets for a given system data object. */
  load(data) {
    this.clear();
    this.data = data;

    // Randomise the skybox orientation per system (deterministic from the seed)
    // so the shared nebula backdrop looks different in every system.
    if (this._sky) {
      const srng = createRng((data.seed || 'sys') + '::sky');
      this._sky.rotation.set(srng.range(0, TAU), srng.range(0, TAU), srng.range(0, TAU));
    }

    if (data.kind === 'blackhole') {
      this._loadBlackHole(data);
      return;
    }
    if (data.kind === 'deathstar') {
      this._loadDeathStar(data);
      return;
    }

    // --- star(s) ---
    const R = data.star.radius;
    const sep = data.binary ? data.binary.separation : 0;
    this._buildStar(data.star, R, data.binary ? sep * 0.5 : 0);
    let starR = R;
    if (data.binary) {
      this._buildStar(data.binary.star2, data.binary.star2.radius, -sep * 0.5);
      this._binary = true;
      starR = Math.max(R, data.binary.star2.radius) + sep * 0.5;
    }
    this._starKeepout = starR + 1.5; // ships steer around this bubble (#9)

    // --- planets (no orbit lines — each planet draws a faint motion trail) ---
    let maxOrbit = R + 4;
    const seedBase = Math.floor(Math.abs(hashStr(data.seed)) % 100000);
    this._factionStyle = getFaction(data.faction); // stations match the fleet (#11)
    data.planets.forEach((p, i) => {
      const planet = new Planet(p, seedBase + i * 131, this._factionStyle);
      planet.addTo(this.scene);
      // make the planet pickable (#6): tag its body so a raycast can resolve it
      planet.body.userData.pickKind = 'planet';
      planet.body.userData.pickRef = planet;
      this.planets.push(planet);
      maxOrbit = Math.max(maxOrbit, p.orbit + p.radius);
    });

    // --- interplanetary ship traffic (spacefaring) ---
    // mostly transports, some fighters, and exactly one slow flagship (#11),
    // all painted in this civilisation's faction style.
    this._faction = data.faction;
    this.ships = [];
    if (data.ships > 0 && this.planets.length >= 2) {
      const transport = ROLES.filter((r) => r.cat === 'transport' || r.cat === 'scout');
      const fighter = ROLES.filter((r) => r.cat === 'fighter');
      const flagship = ROLES.find((r) => r.cat === 'flagship');
      const robotic = data.roboticTraffic; // dead world: cargo robots only (#8)
      const fleet = data.fleetDwelling; // survivors live aboard a flagship (#10)
      const scout = data.scoutFlagship; // lone colony-scout in a wild system (#25)
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      for (let i = 0; i < data.ships; i++) {
        let type;
        const wantFlag = flagship && i === 0 && !robotic && (fleet || scout || data.ships >= 3);
        if (robotic) type = pick(transport);
        else if (wantFlag) type = flagship;
        else if (Math.random() < 0.35) type = pick(fighter);
        else type = pick(transport);
        this.ships.push(this._spawnShip(type));
      }
      // #H: attach this system's named flagship + its unique story to the ship
      const flag = this.ships.find((s) => s.type && s.type.cat === 'flagship');
      if (flag && data.flagship) {
        flag.name = data.flagship.name;
        flag.lore = data.flagship.lore;
      }
    }

    // --- comets on long eccentric orbits (#13) ---
    this.comets = [];
    if (data.comets > 0) {
      const crng = createRng(data.seed + '::comets');
      for (let i = 0; i < data.comets; i++) {
        const comet = new Comet({
          reach: maxOrbit,
          scale: crng.range(0.04, 0.07), // small (#1)
          speed: crng.range(0.7, 1.6), // very slow drift (#5)
          rng: crng,
        });
        comet.addTo(this.scene);
        this.comets.push(comet);
      }
    }

    // #10: an in-system battle station (the Death Star, beside a destroyed world)
    if (data.deathStar) {
      const placed = this._buildDeathStarObject(data);
      maxOrbit = Math.max(maxOrbit, placed + data.deathStar.radius);
    }

    // #5: the USG Ishimura hovers over a planet, cracking its crust
    const ishIdx = data.planets.findIndex((p) => p.ishimura);
    if (ishIdx >= 0) this._buildIshimura(ishIdx);

    this._frame(maxOrbit, starR);
  }

  /** Build the USG Ishimura hovering over a planet, holding a torn-off crust
   *  chunk in its tether beam (#5). It follows the planet on its orbit. */
  _buildIshimura(planetIdx) {
    // MeshStandard hull needs lights (reuse the same slots the Death Star uses;
    // only one special object exists per system, and clear() disposes both).
    this._dsLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this._dsLight.position.set(5, 8, 4);
    this._dsAmbient = new THREE.AmbientLight(0x40383a, 1.1);
    this.scene.add(this._dsLight, this._dsAmbient);

    const planet = this.planets[planetIdx];
    const pr = planet.data.radius;
    const ish = new Ishimura(pr * 0.5); // a small ship next to the planet
    ish.addTo(this.scene);
    this.ishimura = ish;
    this._ishFollow = { idx: planetIdx, offset: new THREE.Vector3(pr * 1.4, pr * 1.7, 0) };
    ish.group.userData.pickKind = 'ishimura';
    ish.group.userData.pickRef = planet;
    this._planetPos(planetIdx, ish.group.position);
    ish.group.position.add(this._ishFollow.offset);
  }

  /** Build the Death Star inside a star system (#10): a small moon-sized station
   *  (smaller than the planets) that ORBITS the star, near the destroyed
   *  Alderaan. Returns its orbit radius so load() can widen the framing. */
  _buildDeathStarObject(data) {
    // the MeshStandard hull needs real lights (planets use custom shaders, so the
    // system view has none) — add a key + ambient, as the standalone view did.
    this._dsLight = new THREE.DirectionalLight(0xffffff, 2.2);
    this._dsLight.position.set(6, 7, 8);
    this._dsAmbient = new THREE.AmbientLight(0x484c56, 1.0);
    this.scene.add(this._dsLight, this._dsAmbient);

    const R = data.deathStar.radius || 0.6;
    const ds = new DeathStar(R); // keeps its slow ominous spin (no beam now)
    ds.addTo(this.scene);
    this.deathStar = ds;
    ds.group.userData.pickKind = 'deathstar';
    ds.group.userData.pickRef = data;

    // orbit the star alongside the obliterated Alderaan (same orbit, slight lead)
    const a = data.planets.find((p) => p.obliterated) || data.planets[0] || { orbit: 12, phase: 0, angularSpeed: 0.1 };
    this._dsOrbit = {
      radius: a.orbit + R * 2.2,
      angle: (a.phase || 0) + 0.32,
      speed: a.angularSpeed || 0.08,
      y: a.orbit * 0.05,
    };
    this._stepDeathStarOrbit(0);
    return this._dsOrbit.radius;
  }

  /** Advance the Death Star along its orbit and place it (#10). */
  _stepDeathStarOrbit(dt) {
    const o = this._dsOrbit;
    if (!o || !this.deathStar) return;
    o.angle += o.speed * dt;
    this.deathStar.group.position.set(Math.cos(o.angle) * o.radius, o.y, Math.sin(o.angle) * o.radius);
  }

  _buildStar(sd, R, offsetX) {
    const activity = sd.activity != null ? sd.activity : 0.4;
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(sd.color) },
        uBrightness: { value: 0.85 }, // lower → the body shows colour instead of clipping to white
        uActivity: { value: activity },
      },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
    });
    const geo = new THREE.SphereGeometry(R, 48, 48);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = offsetX;
    this.starGroup.add(mesh);

    // Soft outer glow (Spore-style): a smooth radial gradient billboard that fades
    // into space — brightest at the surface, dissolving outward with NO hard edge
    // or ring (unlike the old fresnel corona sphere). depthTest keeps it AROUND
    // the disc, so the granulated surface stays visible.
    const glowColor = new THREE.Color(sd.color);
    const ghsl = { h: 0, s: 0, l: 0 };
    glowColor.getHSL(ghsl);
    // deeper + more saturated than the star body → a rich golden corona, not pale grey
    glowColor.setHSL(ghsl.h, Math.min(1, ghsl.s * 1.9), ghsl.l * 0.82);
    const glowMat = new THREE.SpriteMaterial({
      map: starGlowTexture(),
      color: glowColor,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.setScalar(R * 3.2);
    glow.position.x = offsetX;
    this.starGroup.add(glow);

    this._starMats.push(mat, glowMat);
    this._starGeos.push(geo);
  }

  _loadBlackHole(data) {
    const bh = new BlackHole(data.blackHole);
    bh.addTo(this.scene);
    this.blackHole = bh;
    let reach = data.blackHole.outer;
    if (data.endurance) {
      this.endurance = new Endurance(2.2);
      this.endurance.addTo(this.scene);
      this._endOrbit = data.blackHole.outer * 0.82;
      this._endAngle = 0;
      reach = Math.max(reach, this._endOrbit + 4);
    }
    this._frame(reach, data.blackHole.radius * 1.5);
  }

  _loadDeathStar(data) {
    // The Death Star (#12) is the only lit object in the system view — give it a
    // key + ambient light. Ships are unlit MeshBasic and ignore these lights.
    this._dsLight = new THREE.DirectionalLight(0xffffff, 2.4);
    this._dsLight.position.set(4, 5, 6);
    this._dsAmbient = new THREE.AmbientLight(0x4a4e58, 1.1);
    this.scene.add(this._dsLight, this._dsAmbient);

    const R = data.deathStar.radius;
    const ds = new DeathStar(R);
    ds.addTo(this.scene);
    this.deathStar = ds;

    // imperial escort fleet roaming around the station (Star-Destroyer wedges)
    this._faction = data.faction || 'imperial';
    this._starKeepout = R + 2;
    this._roamReach = R * 3.4;
    this.ships = [];
    const flag = ROLES.find((r) => r.cat === 'flagship');
    const fighters = ROLES.filter((r) => r.cat === 'fighter');
    const roster = [flag, fighters[0], fighters[1 % fighters.length], flag, fighters[0]];
    roster.forEach((type, i) => {
      if (!type) return;
      const g = buildShip(type, this._faction); // imperial Star Destroyers
      const a = (i / roster.length) * TAU;
      const rr = R * (1.7 + 0.35 * i);
      g.position.set(Math.cos(a) * rr, (i - 2) * R * 0.22, Math.sin(a) * rr);
      g.scale.setScalar(type.scale);
      this.scene.add(g);
      const ship = { mesh: g, type, baseScale: type.scale, grow: 1, roam: true, speed: type.speed, waypoint: this._roamPoint() };
      g.userData.pickKind = 'ship';
      g.userData.pickRef = ship;
      this.ships.push(ship);
    });

    this._frame(R * 3.2, R * 1.3);
  }

  _frame(maxOrbit, minR) {
    this._roamReach = maxOrbit; // flagship roams within the planetary disk (#4)
    const dist = maxOrbit * 2.1 + 6;
    this._overview = {
      pos: new THREE.Vector3(0, maxOrbit * 0.55 + 3, dist),
      target: new THREE.Vector3(0, 0, 0),
    };
    this.camera.position.copy(this._overview.pos);
    this.controls.target.copy(this._overview.target);
    this._frameMin = minR * 1.4 + 1; // overview zoom limits (restored on un-focus)
    this._frameMax = maxOrbit * 4 + 20;
    this.controls.minDistance = this._frameMin;
    this.controls.maxDistance = this._frameMax;
    this.controls.update();
    // Nudge the whole view a touch to the RIGHT (cinematic composition: lore
    // panel on the left, the star + planets on the right). A projection-space
    // shift, NOT a world pan — so we still orbit AROUND the star, and the
    // leftmost planets clear the panel and stay clickable. The info box is wide
    // and on the left, so push fairly far right (#11). Cinematic mode sets this
    // to 0 (object centred) via setBaseShift().
    if (this.baseShift == null) this.baseShift = 0.12;
    this._applyViewShift(this.baseShift);
    this._zoom = null;
    this._focus = null;
    this._wantControls = false;
  }

  /** Shift the principal point so on-screen content moves right by `frac` of the
   *  width. `project()` and the post-FX use this matrix too, so the diegetic
   *  planet labels track and bloom stays aligned. Re-applied on resize. */
  _applyViewShift(frac) {
    this._viewShiftFrac = frac;
    const w = this._vw || window.innerWidth;
    const h = this._vh || window.innerHeight;
    if (frac) this.camera.setViewOffset(w, h, -w * frac, 0, w, h);
    else this.camera.clearViewOffset();
  }

  /** Cinematic toggle (#view-mode): 0 centres the object, 0.12 makes room for
   *  the left panel. Applied live and remembered for the next _frame(). */
  setBaseShift(frac) {
    this.baseShift = frac;
    this._applyViewShift(frac);
  }

  /** Raycast planets + ships + structures; returns {kind, ref, obj} or null. */
  pickObject(raycaster) {
    const targets = [];
    for (const p of this.planets) {
      if (p.body) targets.push(p.body);
      if (p.station) targets.push(p.station); // orbital structures are clickable too (#6)
    }
    for (const s of this.ships) if (s.mesh) targets.push(s.mesh);
    if (this.deathStar) targets.push(this.deathStar.group); // the battle station (#10)
    if (this.ishimura) targets.push(this.ishimura.group); // the Ishimura (#5)
    if (!targets.length) return null;
    const hits = raycaster.intersectObjects(targets, true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o) {
      if (o.userData && o.userData.pickKind) return { kind: o.userData.pickKind, ref: o.userData.pickRef, obj: o };
      o = o.parent;
    }
    return null;
  }

  /** Every pickable object with the metadata needed for screen-space picking and
   *  the hover ring: [obj, kind, ref, radius]. (#9) */
  _pickables() {
    const out = [];
    for (const p of this.planets) {
      if (p.body) out.push([p.body, 'planet', p, p.data.radius]);
      if (p.station) out.push([p.station, 'structure', p, p.stationScale || p.data.radius * 0.3]);
    }
    for (const s of this.ships) if (s.mesh) out.push([s.mesh, 'ship', s, s.baseScale || 0.5]);
    if (this.ishimura) out.push([this.ishimura.group, 'ishimura', this.ishimura, 1.5]);
    if (this.deathStar) out.push([this.deathStar.group, 'deathstar', this.deathStar, this.deathStar.R || 5]);
    return out;
  }

  /** Screen-space "near miss" pick (#9): when the precise raycast misses, return
   *  the pickable whose projected centre is closest to the pointer AND inside a
   *  generous zone (its own on-screen radius + a fixed pad) — a big, forgiving
   *  click target around every planet / ship / structure. */
  pickNearestScreen(px, py, w, h) {
    const cam = this.camera;
    const c = new THREE.Vector3();
    const right = new THREE.Vector3();
    const edge = new THREE.Vector3();
    let best = null;
    let bestD = Infinity;
    for (const [obj, kind, ref, r] of this._pickables()) {
      obj.getWorldPosition(c);
      edge.copy(c).project(cam);
      if (edge.z >= 1) continue;
      const sx = (edge.x * 0.5 + 0.5) * w;
      const sy = (-edge.y * 0.5 + 0.5) * h;
      right.setFromMatrixColumn(cam.matrixWorld, 0);
      edge.copy(c).addScaledVector(right, r).project(cam);
      const pxR = Math.hypot((edge.x * 0.5 + 0.5) * w - sx, (-edge.y * 0.5 + 0.5) * h - sy);
      const d = Math.hypot(sx - px, sy - py);
      const zone = Math.max(pxR + 26, 42); // generous, but never swallows the whole screen
      if (d <= zone && d < bestD) {
        bestD = d;
        best = { kind, ref, obj, radius: r };
      }
    }
    return best;
  }

  /** Dolly the camera in to a clicked planet and then follow it on its orbit (#6). */
  focusPlanet(planet) {
    this.focusObject(planet.body, planet.data.radius);
  }

  /** Generalised focus (#6): dolly-in + follow ANY moving object — a planet, a
   *  ship (flagship) or an orbital structure. `radius` sizes the camera approach;
   *  `reticleRadius` (defaults to `radius`) sizes the on-screen ranging bracket —
   *  decoupled so an elongated ship can be approached wide but bracketed tight (#19). */
  focusObject(obj, radius, reticleRadius = radius) {
    obj.getWorldPosition(_fp);
    this.controls.minDistance = Math.max(0.3, radius * 1.4);
    this.controls.maxDistance = radius * 40 + 12;
    this._focus = {
      obj,
      radius, // approach distance basis
      reticleRadius, // used by the ranging reticle to bracket the object on screen
      entering: true,
      t: 0,
      dur: 0.95, // a touch slower → more cinematic approach
      dist: radius * 5 + 2,
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      lastPos: _fp.clone(),
    };
    this.controls.enabled = false; // re-enabled once the dolly-in finishes
  }

  /** Return from a planet focus to the system overview (#6). */
  unfocus() {
    if (!this._focus) return;
    this._focus = null;
    this.controls.minDistance = this._frameMin;
    this.controls.maxDistance = this._frameMax;
    this.controls.target.copy(this._overview.target);
    this._zoom = { t: 0, dur: 0.7, from: this.camera.position.clone(), to: this._overview.pos.clone() };
    this.controls.enabled = false;
    this._wantControls = true;
  }

  _updateFocus(dt) {
    const f = this._focus;
    f.obj.getWorldPosition(_fp);
    if (f.entering) {
      f.t = Math.min(f.t + dt / f.dur, 1);
      const e = 1 - Math.pow(1 - f.t, 3); // easeOutCubic
      _fd.copy(f.fromPos).sub(f.fromTarget);
      if (_fd.lengthSq() < 1e-6) _fd.set(0, 0.4, 1);
      _fd.normalize();
      _ftmp.copy(_fp).addScaledVector(_fd, f.dist); // close approach point
      this.camera.position.lerpVectors(f.fromPos, _ftmp, e);
      this.controls.target.lerpVectors(f.fromTarget, _fp, e);
      this.camera.lookAt(this.controls.target);
      f.lastPos.copy(_fp);
      if (f.t >= 1) {
        f.entering = false;
        this.controls.enabled = true; // let the user orbit the planet
      }
    } else {
      // follow the orbiting planet: translate camera + target by its movement,
      // preserving whatever orbit angle the user set
      _fd.copy(_fp).sub(f.lastPos);
      this.camera.position.add(_fd);
      this.controls.target.add(_fd);
      f.lastPos.copy(_fp);
      this.controls.update();
    }
  }

  _spawnShip(type) {
    const g = buildShip(type, this._faction); // role × faction style (#11)
    this.scene.add(g);
    // the flagship doesn't commute between planets — it roams the system (#4)
    const ship = { mesh: g, type, baseScale: type.scale, grow: 0.001, target: 0, speed: type.speed, roam: type.cat === 'flagship' };
    g.userData.pickKind = 'ship'; // clickable for its info card (#7)
    g.userData.pickRef = ship;
    this._assignShip(ship);
    return ship;
  }

  /** Send a ship from a random planet to a different random planet (organic). */
  _assignShip(ship) {
    if (ship.roam) {
      // flagship: start parked by a planet, then drift between free waypoints (#4)
      this._planetPos(Math.floor(Math.random() * this.planets.length), ship.mesh.position);
      ship.waypoint = this._roamPoint();
      ship.grow = 1; // already on station — no grow-in
      ship.mesh.scale.setScalar(ship.baseScale);
      return;
    }
    const n = this.planets.length;
    const from = Math.floor(Math.random() * n);
    // guaranteed distinct destination (no degenerate same-planet pick)
    const to = n > 1 ? (from + 1 + Math.floor(Math.random() * (n - 1))) % n : from;
    this._planetPos(from, ship.mesh.position);
    ship.target = to;
    ship.speed = ship.type.speed * (0.85 + Math.random() * 0.3); // speed by class
    ship.grow = 0.001;
    ship.mesh.scale.setScalar(0.001 * ship.baseScale);
  }

  /** A random roam waypoint: somewhere in the disk, clear of the star (#4). */
  _roamPoint() {
    const reach = this._roamReach || this._starKeepout * 4 + 10;
    const a = Math.random() * TAU;
    const inner = this._starKeepout * 2 + 2;
    const r = inner + Math.random() * Math.max(2, reach - inner);
    const y = (Math.random() - 0.5) * reach * 0.25;
    return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
  }

  /** Start the camera pulled back, then dolly in to the overview (continues the
   *  galaxy zoom so the warp reads as one smooth flight, not a black cut). */
  beginEnterZoom(dur = 1.05) {
    const ov = this._overview;
    const from = ov.pos.clone().sub(ov.target).multiplyScalar(2.4).add(ov.target);
    this.camera.position.copy(from);
    this.camera.lookAt(ov.target);
    this._zoom = { t: 0, dur, from, to: ov.pos.clone() };
  }

  /** #3: reverse of beginEnterZoom — dolly the system camera outward (away from
   *  whatever it's looking at) so leaving the system reads as a pull-back flight.
   *  Fire-and-forget: the next exit() nulls _zoom, so it never needs awaiting. */
  beginExitZoom(dur = 0.55) {
    const tgt = this.controls.target;
    const from = this.camera.position.clone();
    const to = from.clone().sub(tgt).multiplyScalar(2.3).add(tgt);
    this._focus = null; // override any planet-follow so the pull-back wins
    this._zoom = { t: 0, dur, from, to };
  }

  update(dt, time) {
    for (const m of this._starMats) if (m.uniforms) m.uniforms.uTime.value = time; // skip the glow sprite
    if (this._binary) this.starGroup.rotation.y += dt * 0.15; // the pair revolves
    if (this.blackHole) this.blackHole.update(time);
    if (this.deathStar) {
      this._stepDeathStarOrbit(dt); // orbit the star (#10)
      this.deathStar.update(dt, time);
    }
    if (this.ishimura) {
      // hover over the planet it's cracking (follow it on its orbit)
      if (this._ishFollow) {
        this._planetPos(this._ishFollow.idx, this.ishimura.group.position);
        this.ishimura.group.position.add(this._ishFollow.offset);
      }
      this.ishimura.update(dt, time);
    }
    if (this.endurance) {
      this.endurance.update(dt);
      this._endAngle += dt * 0.12;
      const r = this._endOrbit;
      this.endurance.group.position.set(
        Math.cos(this._endAngle) * r,
        Math.sin(this._endAngle * 0.5) * r * 0.12,
        Math.sin(this._endAngle) * r,
      );
    }
    for (const p of this.planets) p.update(dt, time, this.camera);
    this._updateShips(dt);
    for (const c of this.comets) c.update(dt);
    if (this._zoom) {
      this._zoom.t += dt / this._zoom.dur;
      const k = Math.min(this._zoom.t, 1);
      const e = 1 - Math.pow(1 - k, 3); // easeOutCubic — settle gently
      this.camera.position.lerpVectors(this._zoom.from, this._zoom.to, e);
      this.camera.lookAt(this._overview.target);
      if (k >= 1) {
        this._zoom = null;
        if (this._wantControls) this.controls.enabled = true;
      }
    } else if (this._focus) {
      this._updateFocus(dt);
    } else if (this.controls.enabled) {
      this.controls.update();
    }
  }

  _planetPos(idx, out) {
    // `.body` exists for every planet (a destroyed world has a debris group, not
    // a `.mesh`), so ships can still commute past an obliterated planet.
    const m = this.planets[idx].body;
    m.updateWorldMatrix(true, false);
    const e = m.matrixWorld.elements;
    out.set(e[12], e[13], e[14]);
    return out;
  }

  _updateShips(dt) {
    // roam-only fleets (e.g. the Death Star escort) have no planets to commute
    // between, so guard on ships alone — the commute branch handles its own.
    if (!this.ships || !this.ships.length) return;
    for (const ship of this.ships) {
      if (ship.roam) {
        this._updateRoam(ship, dt);
        continue;
      }
      this._planetPos(ship.target, _sv);
      _sd.copy(_sv).sub(ship.mesh.position);
      const dist = _sd.length();
      // grow in after departure, shrink out while docking, then respawn elsewhere.
      // `grow` is the 0..1 animation progress; actual scale = grow × the type's
      // base scale, so the flagship stays big and fighters stay small.
      let grow = Math.min(ship.grow + dt * 2.5, 1);
      if (dist < 1.6) grow = Math.max(0.04, dist / 1.6);
      ship.grow = grow;
      ship.mesh.scale.setScalar(grow * ship.baseScale);
      if (dist < 0.5) {
        this._assignShip(ship); // docked → new random origin & destination
        continue;
      }
      _sdir.copy(_sd).multiplyScalar(1 / dist);
      // #9 never fly through the star: inside the keep-out bubble, add an
      // outward radial push so the ship arcs around it instead of crossing it.
      const rPos = ship.mesh.position.length();
      const bubble = this._starKeepout * 1.8;
      if (rPos < bubble && rPos > 1e-3) {
        _rad.copy(ship.mesh.position).multiplyScalar(1 / rPos);
        const push = (bubble - rPos) / bubble;
        _sdir.addScaledVector(_rad, push * 1.8);
        const len = _sdir.length();
        if (len > 1e-3) _sdir.multiplyScalar(1 / len);
      }
      ship.mesh.position.addScaledVector(_sdir, Math.min(dist, ship.speed * 0.7 * dt)); // calmer traffic, easier to watch (#6)
      ship.mesh.quaternion.setFromUnitVectors(_FWD, _sdir);
    }
  }

  /** Flagship roaming (#4): drift toward a free waypoint, swerve around the
   *  star, pick a new waypoint on arrival — never docks at a planet. */
  _updateRoam(ship, dt) {
    if (!ship.waypoint) ship.waypoint = this._roamPoint();
    _sd.copy(ship.waypoint).sub(ship.mesh.position);
    let dist = _sd.length();
    if (dist < 1.4) {
      ship.waypoint = this._roamPoint();
      _sd.copy(ship.waypoint).sub(ship.mesh.position);
      dist = _sd.length() || 1;
    }
    _sdir.copy(_sd).multiplyScalar(1 / dist);
    // never cross the star: outward radial push inside the keep-out bubble
    const rPos = ship.mesh.position.length();
    const bubble = this._starKeepout * 1.8;
    if (rPos < bubble && rPos > 1e-3) {
      _rad.copy(ship.mesh.position).multiplyScalar(1 / rPos);
      const push = (bubble - rPos) / bubble;
      _sdir.addScaledVector(_rad, push * 1.8);
      const len = _sdir.length();
      if (len > 1e-3) _sdir.multiplyScalar(1 / len);
    }
    ship.mesh.position.addScaledVector(_sdir, Math.min(dist, ship.speed * 0.3 * dt)); // flagships drift slowly & majestically (#6)
    ship.mesh.quaternion.setFromUnitVectors(_FWD, _sdir);
  }

  enter() {
    this._wantControls = true;
    if (!this._zoom) this.controls.enabled = true; // else enabled when the zoom finishes
  }

  exit() {
    this.controls.enabled = false;
    this._wantControls = false;
    this._zoom = null;
    this._focus = null;
  }

  setSize(w, h) {
    this._vw = w;
    this._vh = h;
    this.camera.aspect = w / h;
    if (this._viewShiftFrac) this._applyViewShift(this._viewShiftFrac); // re-derive offset for the new size
    else this.camera.updateProjectionMatrix();
  }

  clear() {
    if (this.ships) {
      for (const s of this.ships) this.scene.remove(s.mesh);
      this.ships = [];
    }
    if (this.comets) {
      for (const c of this.comets) {
        this.scene.remove(c.group);
        c.dispose();
      }
      this.comets = [];
    }
    for (const p of this.planets) {
      this.scene.remove(p.group);
      p.dispose();
    }
    this.planets = [];

    this.starGroup.clear();
    this.starGroup.rotation.set(0, 0, 0); // drop any binary-pair spin
    for (const m of this._starMats) m.dispose();
    for (const g of this._starGeos) g.dispose();
    this._starMats = [];
    this._starGeos = [];
    this._binary = false;

    if (this.blackHole) {
      this.scene.remove(this.blackHole.group);
      this.blackHole.dispose();
      this.blackHole = null;
    }
    if (this.endurance) {
      this.scene.remove(this.endurance.group);
      this.endurance.dispose();
      this.endurance = null;
    }
    if (this.deathStar) {
      this.scene.remove(this.deathStar.group);
      this.deathStar.dispose();
      this.deathStar = null;
    }
    if (this._dsBeam) {
      this._dsBeam.geo.dispose();
      this._dsBeam.mat.dispose();
      this._dsBeam = null;
    }
    if (this.ishimura) {
      this.scene.remove(this.ishimura.group);
      this.ishimura.dispose();
      this.ishimura = null;
      this._ishFollow = null;
    }
    if (this._dsLight) {
      this.scene.remove(this._dsLight);
      this._dsLight = null;
    }
    if (this._dsAmbient) {
      this.scene.remove(this._dsAmbient);
      this._dsAmbient = null;
    }
  }
}

// Soft radial star-glow texture (cached, shared): white core fading smoothly to
// transparent — a gaussian-ish falloff with NO hard edge, so the additive sprite
// reads as a soft corona, never a ring. Tinted per-star via the sprite material.
let _starGlowTex = null;
function starGlowTexture() {
  if (_starGlowTex) return _starGlowTex;
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0.0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.26, 'rgba(255,255,255,0.6)');
  g.addColorStop(0.52, 'rgba(255,255,255,0.26)');
  g.addColorStop(0.76, 'rgba(255,255,255,0.08)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  _starGlowTex = new THREE.CanvasTexture(c);
  return _starGlowTex;
}

// Stable small hash for seeding planet noise offsets.
function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  }
  return h;
}
