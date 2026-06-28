// Star shaders: an emissive granulated surface sphere + an additive corona
// shell. Both push colour above 1.0 so the HDR + ACES pipeline blooms them into
// a soft glow without a dedicated bloom pass.

export const starVertexShader = /* glsl */ `
  varying vec3 vDir;
  varying vec3 vNormalW;
  varying vec3 vViewW;
  void main() {
    vDir = normalize(position);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vViewW = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const starFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uBrightness;
  uniform float uActivity;   // 0..1 sunspot / granulation strength
  varying vec3 vDir;
  varying vec3 vNormalW;
  varying vec3 vViewW;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
          mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
          mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.1; a *= 0.5; }
    return v;
  }

  void main() {
    float g = fbm(vDir * 5.0 + vec3(uTime * 0.06));
    float g2 = fbm(vDir * 12.0 - vec3(uTime * 0.04));
    float gran = 0.78 + 0.5 * g + 0.22 * g2;
    vec3 col = uColor * gran;
    col += vec3(1.0) * pow(g, 3.0) * 0.16;               // bright faculae toward white

    // sunspots — darker cooler patches where a slow noise field dips
    float spotField = fbm(vDir * 2.6 + vec3(11.0) + vec3(uTime * 0.01));
    float spots = smoothstep(0.34, 0.22, spotField) * uActivity;
    col *= 1.0 - spots * 0.65;
    col += uColor * spots * 0.15 * vec3(1.0, 0.6, 0.3);   // warm spot penumbra

    // limb darkening: brighter at the centre of the disc, dimmer + warmer at the edge
    float center = max(dot(normalize(vNormalW), normalize(vViewW)), 0.0);
    float limb = pow(center, 0.45);
    col *= 0.45 + 0.7 * limb;
    col = mix(col * vec3(1.0, 0.72, 0.46), col, limb);    // reddened limb (warmer edge)

    // bright flare tongues on the surface, hottest toward the limb (#3) — makes
    // the disc itself look active/uneven, consistent with the flare corona
    float rim = 1.0 - center;
    float fl = fbm(vDir * 7.0 + vec3(uTime * 0.2));
    float fl2 = fbm(vDir * 15.0 - vec3(uTime * 0.14));
    float flare = pow(max(fl * 0.65 + fl2 * 0.55, 0.0), 3.0);
    col += uColor * flare * (0.5 + 2.0 * rim) * (0.5 + uActivity);
    col += vec3(1.0, 0.86, 0.5) * flare * rim * uActivity;   // hot white-orange licks

    // boost saturation BEFORE the hot core, so ACES doesn't wash the golden body
    // to white (bright colours desaturate under ACES) — keep the star clearly tinted
    float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(luma), col, 1.45);

    // white-hot heart: only the very centre of the disc blows toward white, so the
    // body keeps its colour + granulation (Spore-like) instead of clipping flat
    col += vec3(1.0, 0.96, 0.88) * pow(center, 6.0) * 0.45;

    col *= uBrightness;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// Flare corona (#4): a tight, IRREGULAR rim around the star — not a big round
// sprite halo. A fresnel limb is broken up by animated fbm so it reads as
// uneven solar flares / prominences licking off the edge. Pair it with
// starVertexShader (which already provides vDir / vNormalW / vViewW) on a sphere
// shell ~1.5× the star radius. HDR values bloom through ACES into a soft glow.
export const flareCoronaFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uBrightness;
  uniform float uActivity;   // 0..1 — how violent the flares are
  varying vec3 vDir;
  varying vec3 vNormalW;
  varying vec3 vViewW;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
          mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
          mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.1; a *= 0.5; }
    return v;
  }

  void main() {
    // CLEAN soft limb glow (#14): the old fbm "flare tongues" rendered as an ugly
    // mottled cloud bubble around the star. Replace with a smooth fresnel halo
    // that hugs the surface — a tasteful soft glow, no grainy ring.
    float fres = 1.0 - max(dot(normalize(vNormalW), normalize(vViewW)), 0.0);
    float glow = pow(fres, 2.0);
    float breathe = 0.9 + 0.1 * sin(uTime * 0.6);
    float a = glow * (0.85 + 0.5 * uActivity) * breathe;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor * a * uBrightness, 1.0);
  }
`;
