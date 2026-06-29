// GPU star shader.
//
// The whole point of this file: rotation, twinkle and perspective sizing all
// happen on the GPU. The render loop only updates `uTime` (one float), so the
// CPU never iterates over the (tens of thousands of) stars per frame. That is
// what lets weak machines push a large, lively galaxy.

export const starVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uRotTime; // rotation clock (frozen on interaction); twinkle uses uTime
  uniform float uSize;          // global size multiplier
  uniform float uPixelRatio;    // device pixel ratio (for crisp points)
  uniform float uRotationSpeed; // base angular velocity at the rim
  uniform float uDifferential;  // 0 = rigid spin, 1 = strong inner speed-up
  uniform float uCoreSoft;      // softening radius for differential rotation
  uniform float uTwinkle;       // brightness shimmer amount
  uniform float uExposure;      // overall brightness
  uniform float uMaxPointSize;  // hardware point-size ceiling (device px)

  attribute vec3 aColor;        // per-star colour
  attribute float aSize;        // per-star base size
  attribute float aSeed;        // per-star random 0..1 (twinkle phase)

  varying vec3 vColor;
  varying float vGlow;

  void main() {
    vec3 p = position;

    // --- galactic rotation in the disk plane (XZ) ---
    // RIGID rotation: the whole disk turns at one angular speed. The spiral is
    // baked into the star positions, so a rigid spin just turns it as a whole and
    // it NEVER winds up. (Differential rotation — inner faster than the rim —
    // looks alive for a minute but shears the arms into a tight coil over a long
    // idle, which is the bug this fixes. uDifferential is kept only as a uniform.)
    float r = length(p.xz);
    float omega = uRotationSpeed;
    float a = omega * uRotTime;
    float s = sin(a);
    float c = cos(a);
    p.xz = mat2(c, -s, s, c) * p.xz;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);

    // --- twinkle (subtle brightness oscillation, de-phased per star) ---
    float tw = 1.0 - uTwinkle * 0.45 * (0.5 + 0.5 * sin(uTime * 1.6 + aSeed * 6.2831853));

    vColor = aColor * uExposure;
    vGlow = tw;

    // --- perspective-attenuated point size, clamped for fill-rate + hardware ---
    float size = aSize * uSize * uPixelRatio * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(size, 0.55 * uPixelRatio, min(30.0 * uPixelRatio, uMaxPointSize));

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const starFragmentShader = /* glsl */ `
  precision mediump float;

  varying vec3 vColor;
  varying float vGlow;

  void main() {
    // Procedural round sprite — no texture fetch (cheaper + self-contained).
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;          // 0 at centre, 1 at edge

    // soft halo + bright pinpoint core
    float halo = smoothstep(1.0, 0.0, d);
    halo = pow(halo, 1.9);
    float core = smoothstep(0.32, 0.0, d);
    float intensity = (halo * 0.85 + core * 0.7) * vGlow;

    if (intensity < 0.003) discard;      // skip near-empty fragments

    // Additive blending -> colour carries intensity, alpha kept at 1.
    gl_FragColor = vec4(vColor * intensity, 1.0);
  }
`;
