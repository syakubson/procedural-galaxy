// Procedural planet surface shader.
//
// Surface is generated from 3D value-noise fbm sampled in object space (fixed
// to the planet, so features rotate with it). Lighting is a single directional
// term toward the star, giving a day/night terminator. Per-`kind` branches
// paint rocky continents, ocean+land+clouds (with night-side city lights when
// inhabited), ice, glowing lava, or banded gas giants. A fresnel rim adds a
// thin atmosphere. Cheap enough — only a handful of planets exist at once.

// Crater impact direction (object space, pre-normalised) — shared by the vertex
// displacement and the fragment basin so the dent and its dark floor line up.
// A plain literal (not normalize()) keeps it valid as a global const on strict
// GLSL ES 1.00 drivers.
const CRATER_DIR = 'const vec3 CRATER_DIR = vec3(0.40059, 0.25037, 0.88130);';

export const planetVertexShader = /* glsl */ `
  uniform float uDestroyed;   // 1 = punch a real bowl-shaped crater into the mesh
  ${CRATER_DIR}
  varying vec3 vDir;      // object-space unit direction (noise domain)
  varying vec3 vNormalW;  // world-space normal (lighting)
  varying vec3 vViewW;    // world-space view direction (fresnel)

  void main() {
    vec3 pos = position;
    vDir = normalize(position);

    // #11: an actual indentation, not a painted ring. Push the surface radially
    // inward inside the crater cap so the silhouette carries a visible bowl.
    if (uDestroyed > 0.5) {
      float cd = distance(vDir, CRATER_DIR);
      float dent = smoothstep(0.5, 0.0, cd);          // 0 outside → 1 at centre
      pos -= vDir * dent * length(position) * 0.30;   // up to 30% of the radius
    }

    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(pos, 1.0);
    vViewW = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const planetFragmentShader = /* glsl */ `
  precision highp float;
  ${CRATER_DIR}

  uniform float uTime;
  uniform vec3 uLightDir;     // world dir from planet toward the star
  uniform float uKind;        // 0 rocky/desert, 1 terran/ocean, 2 ice, 3 lava, 4 gas
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColorHot;     // magma / city-light emissive
  uniform vec3 uAtmo;
  uniform float uAtmoStrength;
  uniform float uInhabited;
  uniform float uClouds;
  uniform float uRuined;
  uniform float uSeed;
  uniform float uBiome;     // habitable sub-type: 0 earth,1 ocean,2 jungle,3 tundra,4 desert,5 city
  uniform float uCivLight;  // city-light intensity for the home world
  uniform float uColony;    // 1 = a colonised (non-home) world -> sparse lights
  uniform float uRobotic;   // 1 = dead world still lit by machines (cold lights)
  uniform float uDestroyed; // 1 = a catastrophe crater scars the surface

  varying vec3 vDir;
  varying vec3 vNormalW;
  varying vec3 vViewW;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * vnoise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 dir = vDir;
    vec3 off = vec3(uSeed * 13.1, uSeed * 7.7, uSeed * 3.3);
    float n = fbm(dir * 2.5 + off);
    float n2 = fbm(dir * 6.0 + off * 1.7);
    float n3 = fbm(dir * 15.0 + off * 2.3); // fine detail
    float n4 = fbm(dir * 34.0 + off * 3.1); // crisp micro-detail (#8)
    float lat = abs(dir.y);

    vec3 surf;
    vec3 emissive = vec3(0.0);
    float gloss = 0.0;   // ocean specular mask (terran)
    float cloud = 0.0;   // cloud coverage (terran)
    float cityMask = 0.0; // night-side settlement mask (terran)

    if (uKind < 0.5) {
      // rocky / desert worlds: layered strata + impact pocks + fine grit (#8)
      float h = n * 0.55 + n2 * 0.3 + n3 * 0.12 + n4 * 0.03;
      surf = mix(uColor3, uColor1, smoothstep(0.30, 0.58, h));
      surf = mix(surf, uColor2, smoothstep(0.58, 0.86, h));
      float strata = 0.5 + 0.5 * sin(dir.y * 26.0 + n2 * 5.0); // wind/sediment bands
      surf *= 0.86 + 0.18 * strata;
      surf *= 0.82 + 0.30 * n4;                 // grit speckle
      surf *= 1.0 - 0.30 * smoothstep(0.74, 0.80, n3); // small dark craters
      if (uColony > 0.5) cityMask = smoothstep(0.66, 0.86, fbm(dir * 26.0 + off * 2.3));
    } else if (uKind < 1.5) {
      // terran family — biome-driven sea level / land palette / clouds
      float h = n * 0.6 + n2 * 0.3 + n3 * 0.1;
      float sea = 0.5;
      float cloudAmt = 0.55;
      if (uBiome > 0.5 && uBiome < 1.5) sea = 0.66;                       // ocean world
      else if (uBiome > 1.5 && uBiome < 2.5) { sea = 0.40; cloudAmt = 0.8; } // jungle
      else if (uBiome > 3.5 && uBiome < 4.5) { sea = 0.32; cloudAmt = 0.22; } // desert
      else if (uBiome > 4.5) { sea = 0.30; cloudAmt = 0.3; }              // city world

      float land = smoothstep(sea, sea + 0.035, h);

      vec3 deep = uColor1 * 0.65;
      vec3 shallow = mix(uColor1, vec3(0.28, 0.62, 0.72), 0.6);
      vec3 ocean = mix(deep, shallow, smoothstep(sea - 0.14, sea, h));

      vec3 landc;
      if (uBiome > 2.5 && uBiome < 3.5) {
        // tundra: snow over the land, more toward the poles
        landc = mix(uColor2, uColor3, n2);
        landc = mix(landc, vec3(0.9, 0.95, 1.0), clamp(smoothstep(0.15, 0.7, lat) + 0.25, 0.0, 1.0));
      } else if (uBiome > 4.5) {
        // city world: grey urban crust
        landc = mix(uColor2, uColor3, n2 * 0.8 + 0.1);
      } else {
        landc = mix(uColor2, uColor3, clamp(0.4 + (n2 - 0.5) * 0.8, 0.0, 1.0));
        landc = mix(landc, vec3(0.78, 0.67, 0.42), max(0.0, 0.32 - lat * 1.4) * 0.5); // equ. deserts
      }
      landc = mix(landc, vec3(0.92, 0.96, 1.0), smoothstep(0.74, 0.88, lat)); // polar caps
      surf = mix(ocean, landc, land);
      gloss = (1.0 - land) * (uBiome > 4.5 ? 0.3 : 1.0);

      vec3 warp = vec3(fbm(dir * 1.6 + off + vec3(uTime * 0.008, 0.0, 0.0)));
      cloud = smoothstep(0.5, 0.72, fbm(dir * 3.2 + warp * 0.7 + vec3(uTime * 0.012, 0.0, 0.0) + off)) * cloudAmt * uClouds;

      // night-side settlement mask — fine, small lights (not big blobs)
      if (uInhabited > 0.5 || uColony > 0.5 || uRobotic > 0.5) {
        float cn = fbm(dir * 44.0 + off * 2.3);
        cityMask = smoothstep(0.66, 0.84, cn) * land;
        if (uBiome > 4.5) cityMask = max(cityMask, smoothstep(0.52, 0.74, cn) * land); // ecumenopolis denser
        cityMask *= 0.45 + 0.55 * smoothstep(0.5, 0.82, fbm(dir * 95.0 + off)); // break into tiny specks
      }
    } else if (uKind < 2.5) {
      // ice world
      surf = mix(uColor3, uColor1, smoothstep(0.3, 0.7, n));
      float crack = 1.0 - smoothstep(0.49, 0.5, abs(fbm(dir * 4.0 + off) - 0.5) * 2.0);
      surf = mix(surf, vec3(0.95, 0.98, 1.0), crack * 0.4);
      gloss = 0.4;
    } else if (uKind < 3.5) {
      // lava world
      float h = fbm(dir * 3.0 + off);
      surf = mix(uColor3, uColor2, smoothstep(0.3, 0.6, h));
      float magma = 1.0 - smoothstep(0.34, 0.52, h);       // forward-edge
      magma += 0.4 * (1.0 - smoothstep(0.5, 0.62, fbm(dir * 7.0 + off)));
      emissive += uColorHot * clamp(magma, 0.0, 1.4) * 1.5;
    } else {
      // gas giant — turbulent latitude belts sheared by a curl-ish warp, finer
      // secondary bands, micro-striping, one big storm and darkened poles (#8).
      float warp = (fbm(dir * 3.0 + off) - 0.5) * 2.6;
      float yy = dir.y + 0.16 * (fbm(dir * 4.0 + off) - 0.5);
      float bands = sin(yy * 11.0 + warp);
      float fine = sin(yy * 26.0 + warp * 1.4);                          // secondary belts
      surf = mix(uColor2, uColor3, smoothstep(-0.3, 0.4, bands + fine * 0.4));
      surf = mix(surf, uColor1, smoothstep(0.5, 0.92, fbm(dir * 5.0 + off)) * 0.55);
      surf *= 0.9 + 0.12 * sin(yy * 60.0 + warp);                        // micro striping
      // elongated storm oval at a fixed latitude
      float sx = atan(dir.z, dir.x);
      vec2 sp = vec2(sx * 0.45, (dir.y - 0.16) * 2.6);
      float storm = 1.0 - smoothstep(0.0, 0.22, length(sp) - 0.04 + (fbm(dir * 6.0 + off) - 0.5) * 0.12);
      surf = mix(surf, vec3(0.86, 0.46, 0.34), clamp(storm, 0.0, 1.0) * 0.72);
      surf *= 1.0 - 0.45 * smoothstep(0.68, 1.0, lat); // pole darkening
    }

    // catastrophe crater (#11): a charred bowl that matches the vertex dent —
    // a real depression with a dark floor, NO glowing painted ring.
    if (uDestroyed > 0.5) {
      float cd = distance(dir, CRATER_DIR);
      float crater = smoothstep(0.55, 0.12, cd);
      surf = mix(surf, vec3(0.05, 0.045, 0.04), crater);     // charred floor
      surf *= 1.0 - 0.32 * smoothstep(0.52, 0.2, cd);        // darker toward centre
      // faint scorched ejecta blanket fading outward (matte, not emissive)
      surf = mix(surf, vec3(0.12, 0.10, 0.09), smoothstep(0.62, 0.5, cd) * (1.0 - crater) * 0.5);
    }

    // --- lighting (shaped day/night terminator) ---
    vec3 N = normalize(vNormalW);
    vec3 L = normalize(uLightDir);
    vec3 V = normalize(vViewW);
    float ndl = dot(N, L);
    float diff = max(ndl, 0.0);
    float night = 1.0 - smoothstep(-0.05, 0.12, ndl); // forward-edge

    // clouds are lit like the surface; fold in before lighting
    surf = mix(surf, vec3(0.95), cloud * 0.7);
    gloss *= (1.0 - cloud);

    // #2 ambient/global fill: the night side is dim but no longer pure black,
    // so a back-lit planet stays readable instead of vanishing into the void.
    vec3 color = surf * (0.085 + diff);

    // (#5) the old blue-white "forward-scatter" band across the terminator is
    // gone — it read as an unnatural glow. Atmosphere now lives only on the lit
    // limb, below.

    // ocean / ice sun-glint
    if (gloss > 0.001) {
      vec3 R = reflect(-L, N);
      float spec = pow(max(dot(R, V), 0.0), 70.0) * gloss * diff;
      color += vec3(1.0, 0.96, 0.86) * spec * 1.1;
    }

    // night-side settlement lights: home (civ level) / colony (sparse) /
    // robotic ruins (cold, run by machines after everyone died)
    if (cityMask > 0.001) {
      float lightInt = uInhabited > 0.5 ? uCivLight : (uRobotic > 0.5 ? 0.7 : (uColony > 0.5 ? 0.6 : 0.0));
      // warm settlement glow (independent of the per-def magma colour, which is
      // black on rocky/desert); robotic ruins glow cold blue-white instead.
      vec3 warmLight = vec3(1.0, 0.86, 0.55);
      vec3 lightCol = mix(warmLight, vec3(0.55, 0.78, 1.0), step(0.5, uRobotic));
      color += lightCol * cityMask * night * 0.95 * lightInt * (1.0 - cloud);
    }

    // lava glow (visible on the night side)
    color += emissive * (0.8 + 0.5 * night);

    // thin atmosphere — a day-side limb crescent only (no glow on the night
    // limb, so the terminator stays clean — #5)
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.2);
    color += uAtmo * fres * uAtmoStrength * (0.05 + 0.85 * diff);

    // ruined worlds read greyer and dimmer
    if (uRuined > 0.5) {
      float g = dot(color, vec3(0.33));
      color = mix(color, vec3(g), 0.55) * 0.78;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
