// Shader for the "suns" — a small set of larger, vividly coloured stars that
// read as individual solar systems. Same GPU rotation as the star field, plus
// a gentle per-sun pulse and a brighter, wider halo with a hot core.

export const sunVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uRotTime; // rotation clock (frozen on interaction); pulse uses uTime
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uRotationSpeed;
  uniform float uDifferential;
  uniform float uCoreSoft;
  uniform float uExposure;
  uniform float uMaxPointSize;

  attribute vec3 aColor;
  attribute float aSize;
  attribute float aSeed;

  varying vec3 vColor;
  varying float vPulse;

  void main() {
    vec3 p = position;

    float r = length(p.xz);
    float omega = uRotationSpeed; // rigid spin — matches starShader, never winds up
    float a = omega * uRotTime;
    float s = sin(a);
    float c = cos(a);
    p.xz = mat2(c, -s, s, c) * p.xz;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);

    // each sun breathes at its own rate / phase
    float pulse = 0.82 + 0.18 * sin(uTime * (0.5 + aSeed) + aSeed * 6.2831853);

    vColor = aColor * uExposure;
    vPulse = pulse;

    float size = aSize * uSize * pulse * uPixelRatio * (320.0 / -mvPosition.z);
    gl_PointSize = clamp(size, 2.0 * uPixelRatio, min(64.0 * uPixelRatio, uMaxPointSize));

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const sunFragmentShader = /* glsl */ `
  precision mediump float;

  varying vec3 vColor;
  varying float vPulse;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;

    // wide soft corona
    float halo = smoothstep(1.0, 0.0, d);
    halo = pow(halo, 2.4);
    // tight white-hot core
    float core = smoothstep(0.22, 0.0, d);

    float intensity = (halo * 0.7 + core * 1.1) * vPulse;
    if (intensity < 0.003) discard;

    // keep the sun's own colour dominant (#15): only a light white-hot centre,
    // so orange/amber suns read orange instead of washing out to white.
    vec3 col = mix(vColor, vec3(1.0), core * 0.35) * intensity;
    gl_FragColor = vec4(col, 1.0);
  }
`;
