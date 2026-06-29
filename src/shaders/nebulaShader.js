// Nebula shader — a single flat disk lying in the galaxy plane that fakes the
// glowing interstellar gas. One mesh, a handful of octaves of value noise, a
// radial palette gradient and a soft echo of the spiral arms. Bloom (when on)
// turns this into the luminous core haze you see in the reference.
//
// It is one draw call over a limited area, so even with noise it is cheap.

export const nebulaVertexShader = /* glsl */ `
  uniform float uRadius;
  varying vec2 vPos;
  void main() {
    vPos = position.xy / uRadius;             // -1..1 across the disk
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const nebulaFragmentShader = /* glsl */ `
  precision mediump float;

  uniform float uTime; // the galaxy's freezable ROTATION clock (frozen on interaction)
  uniform float uIntensity;
  uniform float uArms;
  uniform float uSpin;
  uniform float uSwirl;
  uniform float uCoreSize;
  uniform float uRotationSpeed; // bulk arm rotation (matches the star field)
  uniform float uDifferential;  // inner-faster shear (matches the star field)
  uniform float uCoreSoftN;     // core softening radius (normalised)
  uniform vec3 uColorCore;
  uniform vec3 uColorMid;
  uniform vec3 uColorEdge;

  varying vec2 vPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int k = 0; k < 3; k++) {
      v += amp * vnoise(p);
      p *= 2.03;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    float r = length(vPos);
    if (r > 1.0) discard;

    // +epsilon avoids atan(0,0) -> NaN at the exact disk centre vertex
    float theta = atan(vPos.y, vPos.x + 1e-6);

    // slowly swirling sample coordinates for living gas
    float ca = cos(uTime * uSwirl);
    float sa = sin(uTime * uSwirl);
    vec2 q = mat2(ca, -sa, sa, ca) * vPos;
    float n = fbm(q * 2.6 + vec2(uTime * 0.015, -uTime * 0.01));

    // gas concentrated ALONG the spiral arms, LOCKED to the rotating star field
    // (#1): the stars now spin RIGIDLY (one omega for all radii — see starShader),
    // so the gas must spin rigidly too, or it shears off the arms over a long idle.
    // uDifferential is kept only as a uniform; it no longer feeds the rotation.
    //
    // SIGN: the star shader rotates the disk by mat2(c,-s,s,c) which (column-
    // major GLSL) sends each star's angle phi -> phi - omega*t (clockwise). The
    // mesh maps local angle to -worldAngle (theta = -phiWorld), so to make the
    // gas ridge track phi = c.spin*r - omega*t we must SUBTRACT omega*t here.
    // Using +omega*t makes the gas counter-rotate and shear off the arms — that
    // was the persistent "gas drifts from the arms" bug.
    float omega = uRotationSpeed; // rigid — matches starShader, never winds up
    float a = -omega * uTime;
    float arm = 0.5 + 0.5 * cos(uArms * (theta + uSpin * r + a));
    arm = pow(arm, 2.2);

    // radial colour gradient core -> mid -> edge (gold → purple → violet)
    vec3 col = mix(uColorCore, uColorMid, smoothstep(0.0, 0.5, r));
    col = mix(col, uColorEdge, smoothstep(0.5, 1.0, r));

    float bright = (1.0 - smoothstep(0.0, 1.0, r));     // fade to the rim
    bright *= (0.25 + 0.75 * n);                        // patchy gas
    bright *= (0.18 + 0.82 * arm);                      // strong arm structure + dark lanes
    bright += (1.0 - smoothstep(0.0, uCoreSize, r)) * 1.3; // big smeared core haze
    bright *= uIntensity;

    if (bright < 0.002) discard;
    gl_FragColor = vec4(col * bright, 1.0);
  }
`;
