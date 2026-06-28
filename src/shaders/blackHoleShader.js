// Accretion-disk shader for the black hole (cheap, no GR ray-marching).
//
// Structure is 2-octave value noise in (angle, log-radius) space, scrolled by a
// radius-dependent (Keplerian-ish) rate so inner rings spin faster. A radial
// temperature ramp goes white-hot inside -> deep red outside; an optional
// Doppler beaming term brightens the approaching side. Colours are authored hot
// (>1) + additive blending so ACES tone-mapping turns the thin disk white-hot.

export const diskVertexShader = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position; // local geometry coords (RingGeometry lies in XY)
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const diskFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uInner;
  uniform float uOuter;
  uniform float uBeta;   // Doppler beaming strength (0 = off / symmetric)
  uniform float uSpin;   // +1 / -1 rotation direction
  uniform vec3 uColIn;
  uniform vec3 uColMid;
  uniform vec3 uColOut;
  uniform float uVertical; // 1 = the lensing copy (keep only top/bottom arcs)
  varying vec3 vPos;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }

  void main() {
    float r = length(vPos.xy);
    float a = atan(vPos.y, vPos.x);
    float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);

    float radial = pow(1.0 - t, 1.8);
    // swirl: Keplerian-sheared noise sampled on a CIRCLE in angle so there's no
    // seam at the +/-PI wrap (inner rings spin faster than outer).
    float ang = a + uTime * 1.6 / (0.2 + r * 0.08) * uSpin;
    float swirl = noise(vec2(cos(ang), sin(ang)) * 3.0 + vec2(0.0, log(r) * 4.0));
    swirl += 0.5 * noise(vec2(cos(ang * 2.0), sin(ang * 2.0)) * 3.0 + vec2(0.0, log(r) * 8.0));
    swirl = 0.4 + 0.6 * swirl;
    float alpha = radial * swirl;

    vec3 c = mix(uColIn, uColMid, smoothstep(0.0, 0.5, t));
    c = mix(c, uColOut, smoothstep(0.5, 1.0, t));

    // Doppler beaming — brighter (and bluer) on the approaching side
    float beam = 1.0 + uBeta * cos(a);
    c *= beam;
    c.b *= mix(1.0, 1.25, clamp(beam - 1.0, 0.0, 1.0));

    // inner photon-ring-ish hot spike (square explicitly; pow(neg,2) is UB)
    float d = (r - uInner) * 7.0;
    float pr = exp(-d * d);
    c += vec3(1.0, 0.95, 0.85) * pr * 1.6;
    alpha = clamp(alpha + pr, 0.0, 1.0);

    // the lensing copy (#16): keep the top & bottom arcs BRIGHTEST but let the
    // sides stay present (min ~0.42) so the arcs CONNECT into a full ring around
    // the hole instead of reading as two detached caps.
    if (uVertical > 0.5) {
      float vy = abs(vPos.y) / max(length(vPos.xy), 1e-3);
      alpha *= 0.42 + 0.58 * smoothstep(0.0, 0.7, vy);
    }

    gl_FragColor = vec4(c * 1.9, alpha);
  }
`;
