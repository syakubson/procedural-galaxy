// A single planet: shaded sphere + optional banded rings + optional moons,
// on an inclined orbit around the star (system origin). All animation is a few
// trig ops per frame — only a handful of planets exist per system.

import * as THREE from 'three';
import { planetVertexShader, planetFragmentShader } from '../shaders/planetShader.js';
import { createStation } from './stations.js';
import { Debris } from './debris.js';

const _pw = new THREE.Vector3(); // scratch: planet world position
const _mw = new THREE.Vector3(); // scratch: moon world position

const MOON_DEF = { kind: 0, c1: '#8a8a90', c2: '#a8a8ae', c3: '#55555c', hot: '#000000', atmo: '#888', atmoS: 0.0, clouds: 0 };

function col(hex) {
  return new THREE.Color(hex);
}

// Shared satellite assets (one set for the whole app; never disposed).
let _satGeo, _satMat;
const satGeo = () => (_satGeo || (_satGeo = new THREE.SphereGeometry(1, 8, 8)));
const satMat = () => (_satMat || (_satMat = new THREE.MeshBasicMaterial({ color: 0xfff0c8 })));

function planetMaterial(def, planet, seed) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLightDir: { value: new THREE.Vector3(1, 0, 0) },
      uKind: { value: def.kind },
      uColor1: { value: col(def.c1) },
      uColor2: { value: col(def.c2) },
      uColor3: { value: col(def.c3) },
      uColorHot: { value: col(def.hot) },
      uAtmo: { value: col(def.atmo) },
      uAtmoStrength: { value: def.atmoS },
      uInhabited: { value: planet && planet.inhabited ? 1 : 0 },
      uClouds: { value: def.clouds },
      uRuined: { value: planet && planet.ruined ? 1 : 0 },
      uSeed: { value: seed },
      uBiome: { value: (def && def.biome) || (planet && planet.biome) || 0 },
      uCivLight: { value: (planet && planet.lightBoost) || 0 },
      uColony: { value: planet && planet.colony ? 1 : 0 },
      uRobotic: { value: planet && planet.robotic ? 1 : 0 },
      uDestroyed: { value: planet && planet.destroyed ? 1 : 0 },
    },
    vertexShader: planetVertexShader,
    fragmentShader: planetFragmentShader,
  });
}

const ringVertexShader = /* glsl */ `
  uniform float uInner;
  uniform float uOuter;
  varying float vR;
  varying vec3 vWorld;
  void main() {
    vR = (length(position.xy) - uInner) / (uOuter - uInner);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const ringFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uSeed;
  uniform vec3 uLightWorld;    // dir planet -> star
  uniform vec3 uPlanetCenter;
  uniform float uPlanetR;
  varying float vR;
  varying vec3 vWorld;

  float h(float x){ return fract(sin(x * 12.9898 + uSeed) * 43758.5453); }
  float vn(float x){ float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h(i), h(i + 1.0), f); }

  void main() {
    if (vR < 0.0 || vR > 1.0) discard;

    // graded density + a Cassini gap, fading at both edges
    float dens = 0.4 + 0.6 * vn(vR * 9.0 + 3.0);
    dens *= smoothstep(0.018, 0.05, abs(vR - 0.54));   // hard gap mid-ring
    dens *= 1.0 - smoothstep(0.86, 1.0, vR);            // outer fade
    dens *= smoothstep(0.0, 0.06, vR);                  // inner fade

    // cream / ochre colour banding
    vec3 c = mix(uColor * 0.78, uColor * 1.2, vn(vR * 24.0 + 1.0));

    // planet shadow on the ring's far arc (relative to the star)
    vec3 rel = vWorld - uPlanetCenter;
    vec3 ld = normalize(uLightWorld);
    float along = dot(rel, ld);
    float perp = length(rel - ld * along);
    float inShadow = step(along, 0.0) * (1.0 - smoothstep(uPlanetR * 0.8, uPlanetR * 1.1, perp));
    float shadow = 1.0 - 0.82 * inShadow;

    float a = clamp(dens, 0.0, 1.0) * 0.8 * shadow;
    if (a < 0.01) discard;
    gl_FragColor = vec4(c, a);
  }
`;

export class Planet {
  constructor(planet, seedBase, factionStyle) {
    this.data = planet;
    this._factionStyle = factionStyle; // styles the orbital station to match the fleet
    this.angle = planet.phase;

    this.group = new THREE.Group(); // orbital plane (inclined)
    this.group.rotation.x = planet.inclination;

    this.holder = new THREE.Group(); // sits at the orbit radius
    this.group.add(this.holder);
    // place the planet at its phase IMMEDIATELY (#3): ships are spawned in
    // systemView.load() before the first update(), so without this the planet's
    // world position is still the origin and ships appear to launch from the star.
    this.holder.position.set(Math.cos(this.angle) * planet.orbit, 0, Math.sin(this.angle) * planet.orbit);

    this.tilt = new THREE.Group(); // planet axial tilt (shared by rings + moons)
    this.tilt.rotation.z = planet.tilt;
    this.holder.add(this.tilt);

    const seed = (seedBase % 997) + planet.orbit;

    // body: a shaded sphere — or, for a planet an alien race blew apart (#12),
    // a tumbling debris field where the world used to be. `this.body` is the
    // canonical object the orbit/spin/world-position logic drives either way.
    if (planet.obliterated) {
      this.debris = new Debris(planet.radius, Math.floor(seed));
      this.body = this.debris.group;
      this.tilt.add(this.body);
      this.mat = null;
    } else {
      this.mat = planetMaterial(planet.def, planet, seed);
      const geo = new THREE.SphereGeometry(planet.radius, 44, 44);
      this.mesh = new THREE.Mesh(geo, this.mat);
      this.body = this.mesh;
      this.tilt.add(this.mesh);
    }

    // rings
    if (planet.hasRings) {
      const inner = planet.radius * 1.4;
      const outer = planet.radius * 2.25;
      const rgeo = new THREE.RingGeometry(inner, outer, 96, 1);
      this.ringMat = new THREE.ShaderMaterial({
        uniforms: {
          uInner: { value: inner },
          uOuter: { value: outer },
          uColor: { value: col(planet.def.c3).lerp(col('#cbb89a'), 0.5) },
          uSeed: { value: seed },
          uLightWorld: { value: new THREE.Vector3(1, 0, 0) },
          uPlanetCenter: { value: new THREE.Vector3() },
          uPlanetR: { value: planet.radius },
        },
        vertexShader: ringVertexShader,
        fragmentShader: ringFragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(rgeo, this.ringMat);
      ring.rotation.x = -Math.PI / 2; // lie in the planet's equatorial plane
      this.tilt.add(ring);
      this.ring = ring;
    }

    // moons
    this.moons = planet.moons.map((m, i) => {
      const mmat = planetMaterial(MOON_DEF, null, seed + 11 * (i + 1));
      const mmesh = new THREE.Mesh(new THREE.SphereGeometry(m.radius, 20, 20), mmat);
      this.tilt.add(mmesh);
      return { mesh: mmesh, mat: mmat, data: m, angle: m.phase };
    });

    // small fading motion trails for the moons (#22), in the planet's own frame
    this._moonTrails = this.moons.map((moon) => {
      const Nm = 18;
      const pos = new Float32Array(Nm * 3);
      const cols = new Float32Array(Nm * 3);
      const mb = col('#aab2c4').multiplyScalar(0.7);
      for (let k = 0; k < Nm; k++) {
        const f = k / (Nm - 1);
        cols[k * 3] = mb.r * f;
        cols[k * 3 + 1] = mb.g * f;
        cols[k * 3 + 2] = mb.b * f;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      const line = new THREE.Line(
        g,
        new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      line.frustumCulled = false;
      this.tilt.add(line);
      return { line, geo: g, pos, N: Nm, moon };
    });

    // orbital tech: satellites + a DETAILED station. Spacefaring home worlds get
    // a ring habitat wheel; colony outposts get a small modular station (#14,
    // #16). Everything here is distance-culled in update() (only seen up close).
    this.satellites = [];
    this.station = null;
    this._stationPivot = null;
    this._stationSpin = null;
    const civ = planet.civObjects;
    const wantSats = !!(civ && civ.satellites > 0);
    const wantHomeStation = !!(civ && civ.station);
    const wantStation = wantHomeStation || planet.colonyStation || planet.gasStation;
    if (wantSats || wantStation) {
      this.orbitTech = new THREE.Group();
      this.holder.add(this.orbitTech);

      if (wantSats) {
        const satScale = Math.max(0.02, planet.radius * 0.035);
        for (let i = 0; i < civ.satellites; i++) {
          const mesh = new THREE.Mesh(satGeo(), satMat());
          mesh.scale.setScalar(satScale);
          const pivot = new THREE.Group();
          pivot.rotation.x = (i * 0.7) % Math.PI; // varied inclinations
          pivot.add(mesh);
          this.orbitTech.add(pivot);
          this.satellites.push({ mesh, orbit: planet.radius * (1.3 + 0.12 * i), angle: i * 1.7, speed: 0.9 + 0.12 * i });
        }
      }

      if (wantStation) {
        // a tilted pivot so the station slowly circles the planet on its own plane
        this._stationPivot = new THREE.Group();
        this._stationPivot.rotation.set(0.5, 0, 0.25);
        this.orbitTech.add(this._stationPivot);
        // pick the station kind: ring hub (home) / collector (gas giant) / outpost
        let stype = 'outpost';
        let sscale = planet.radius * 0.22;
        if (wantHomeStation) {
          stype = 'ring';
          sscale = planet.radius * 0.3;
        } else if (planet.gasStation) {
          stype = 'collector';
          sscale = planet.radius * 0.26;
        }
        // small + parked well off the planet so it never grazes it (#7),
        // painted in this system's faction style (#11)
        this.station = createStation(stype, sscale, this._factionStyle);
        this.station.position.x = planet.radius * 2.7;
        this._stationPivot.add(this.station);
        this._stationSpin = this.station.userData.spin || null; // the habitat wheel
      }
    }

    // motion trail (#22): a TAPERED ribbon — a soft cone trailing the planet,
    // widest at the planet and narrowing to nothing, with colour fading to black
    // (additive) so it reads as a feathered, semi-transparent wake. Two vertices
    // per sample form the ribbon; the half-width tapers to 0 at the tail.
    const N = 44;
    this._tN = N;
    this._tHeadW = Math.max(0.32, planet.radius * 0.85); // cone base width
    this._tPos = new Float32Array(N * 2 * 3); // 2 ribbon verts per sample
    const tcol = new Float32Array(N * 2 * 3);
    const base = (planet.type === 'lava' ? col('#ff7a2e') : col((planet.def && planet.def.c2) || '#8a8a90')).multiplyScalar(0.95);
    for (let k = 0; k < N; k++) {
      const f = k / (N - 1); // 0 = faded tail tip, 1 = bright head (at the planet)
      for (let s = 0; s < 2; s++) {
        const vi = (k * 2 + s) * 3;
        tcol[vi] = base.r * f;
        tcol[vi + 1] = base.g * f;
        tcol[vi + 2] = base.b * f;
      }
    }
    const tidx = [];
    for (let k = 0; k < N - 1; k++) {
      const a = k * 2;
      const b = k * 2 + 1;
      const c = (k + 1) * 2;
      const e = (k + 1) * 2 + 1;
      tidx.push(a, b, c, b, e, c);
    }
    this._tGeo = new THREE.BufferGeometry();
    this._tGeo.setAttribute('position', new THREE.BufferAttribute(this._tPos, 3));
    this._tGeo.setAttribute('color', new THREE.BufferAttribute(tcol, 3));
    this._tGeo.setIndex(tidx);
    this.trail = new THREE.Mesh(
      this._tGeo,
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.trail.frustumCulled = false;
  }

  addTo(scene) {
    scene.add(this.group);
    scene.add(this.trail);
    this._scene = scene;
  }

  update(dt, time, camera) {
    const d = this.data;
    this.angle += d.angularSpeed * dt;
    this.holder.position.set(Math.cos(this.angle) * d.orbit, 0, Math.sin(this.angle) * d.orbit);
    this.body.rotation.y += d.spinSpeed * dt;

    // world centre of the body — drives lighting, the trail, and tech culling
    this.body.getWorldPosition(_pw);

    if (this.mat) {
      // light points from the planet toward the star at the origin
      this.mat.uniforms.uTime.value = time;
      this.mat.uniforms.uLightDir.value.copy(_pw).multiplyScalar(-1).normalize();
      // rings: feed the planet's world centre + light dir for the cast shadow
      if (this.ring) {
        this.ringMat.uniforms.uPlanetCenter.value.copy(_pw);
        this.ringMat.uniforms.uLightWorld.value.copy(this.mat.uniforms.uLightDir.value);
      }
    }
    if (this.debris) this.debris.update(dt);

    // motion trail (#1): an analytic arc of the orbit trailing behind the
    // planet (a fixed angular span, fading to black backward). Computed from the
    // orbit so it always reads as a clear tail, independent of framerate — a
    // per-frame history buffer was too short to notice.
    const span = 0.6; // radians of orbit the tail covers
    const si = Math.sin(d.inclination);
    const ci = Math.cos(d.inclination);
    const N = this._tN;
    const headW = this._tHeadW;
    for (let k = 0; k < N; k++) {
      const f = k / (N - 1); // 0 = faded tail tip, 1 = bright head (at the planet)
      const th = this.angle - span * (1 - f);
      const ct = Math.cos(th);
      const st = Math.sin(th);
      const hw = headW * f * 0.5; // half-width tapers to 0 at the tail → a cone
      for (let s = 0; s < 2; s++) {
        const rr = d.orbit + (s === 0 ? -hw : hw); // widen along the radial (⊥ to motion)
        const z = st * rr;
        const vi = (k * 2 + s) * 3;
        this._tPos[vi] = ct * rr;
        this._tPos[vi + 1] = -z * si; // rotate into the inclined orbital plane
        this._tPos[vi + 2] = z * ci;
      }
    }
    // moon trails (#22): a short analytic arc behind each moon
    for (const mt of this._moonTrails) {
      const mo = mt.moon;
      for (let k = 0; k < mt.N; k++) {
        const f = k / (mt.N - 1);
        const th = mo.angle - 1.1 * (1 - f);
        mt.pos[k * 3] = Math.cos(th) * mo.data.orbit;
        mt.pos[k * 3 + 1] = 0;
        mt.pos[k * 3 + 2] = Math.sin(th) * mo.data.orbit;
      }
      mt.geo.attributes.position.needsUpdate = true;
    }
    this._tGeo.attributes.position.needsUpdate = true;

    for (const moon of this.moons) {
      moon.angle += moon.data.angularSpeed * dt;
      moon.mesh.position.set(
        Math.cos(moon.angle) * moon.data.orbit,
        0,
        Math.sin(moon.angle) * moon.data.orbit,
      );
      moon.mesh.getWorldPosition(_mw);
      moon.mat.uniforms.uLightDir.value.copy(_mw).multiplyScalar(-1).normalize();
    }

    // orbital tech is only visible up close (at system scale it's invisible)
    if (this.orbitTech) {
      const visible = !camera || camera.position.distanceTo(_pw) < d.radius * 16 + 8;
      this.orbitTech.visible = visible;
      if (visible) {
        for (const s of this.satellites) {
          s.angle += s.speed * dt;
          s.mesh.position.set(Math.cos(s.angle) * s.orbit, 0, Math.sin(s.angle) * s.orbit);
        }
        if (this._stationPivot) this._stationPivot.rotation.y += dt * 0.16; // slow orbit
        if (this._stationSpin) this._stationSpin.rotation.z += dt * 0.5; // habitat wheel spins
      }
    }
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mat.dispose();
    }
    if (this.debris) this.debris.dispose();
    if (this.ring) {
      this.ring.geometry.dispose();
      this.ringMat.dispose();
    }
    for (const moon of this.moons) {
      moon.mesh.geometry.dispose();
      moon.mat.dispose();
    }
    // station meshes reuse shared singletons (stations.js) — nothing per-instance
    if (this._moonTrails) {
      for (const mt of this._moonTrails) {
        mt.geo.dispose();
        mt.line.material.dispose();
      }
    }
    if (this._scene) this._scene.remove(this.trail);
    this._tGeo.dispose();
    this.trail.material.dispose();
  }
}
