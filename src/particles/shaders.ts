/*
 * every layout is packed into one float texture and the morph is a texture fetch
 * plus a mix in the vertex shader, so adding a layout costs a tile rather than a
 * per-frame cpu pass over 48k positions.
 *
 * the layouts are tiled into a narrow grid (uTexW wide, uTileH rows each, stacked
 * vertically) rather than one row per layout. one row per layout would need a
 * texture COUNT texels wide, and 48000 blows past the 16384 MAX_TEXTURE_SIZE most
 * GPUs report: the texture silently fails to upload, every fetch returns zero, and
 * the whole field collapses onto the origin.
 */
export const vertexShader = /* glsl */ `
uniform sampler2D uLayouts;
uniform float uLayoutRows;
uniform float uTexW;
uniform float uTileH;
uniform float uMorph;
uniform float uTime;
uniform float uSize;
uniform float uTurbulence;

attribute float aIndex;
attribute float aSeed;

varying float vGlow;
varying float vSeed;

// cheap approximation of curl noise: organic, divergence-free enough to look like flow
vec3 flow(vec3 p, float s) {
  return vec3(
    sin(p.y * 1.3 + s * 6.283) + sin(p.z * 0.7 - s * 3.141),
    sin(p.z * 1.1 + s * 4.712) + sin(p.x * 0.9 + s * 2.310),
    sin(p.x * 1.5 - s * 5.230) + sin(p.y * 0.8 + s * 1.772)
  ) * 0.5;
}

vec3 sampleLayout(float layer) {
  float col = mod(aIndex, uTexW);
  float row = floor(aIndex / uTexW);
  float u = (col + 0.5) / uTexW;
  float v = (layer * uTileH + row + 0.5) / (uLayoutRows * uTileH);
  return texture2D(uLayouts, vec2(u, v)).xyz;
}

void main() {
  float i0 = floor(uMorph);
  float i1 = min(i0 + 1.0, uLayoutRows - 1.0);
  float t = smoothstep(0.0, 1.0, uMorph - i0);

  vec3 p = mix(sampleLayout(i0), sampleLayout(i1), t);

  // swell outward at mid-transition so particles arc instead of sliding straight
  float burst = sin(t * 3.14159);
  p += flow(p * 0.4 + uTime * 0.05, aSeed) * burst * uTurbulence;
  p += flow(p * 0.9 - uTime * 0.03, aSeed * 1.7) * 0.05;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  // uSize is roughly the pixel size of an average point at the default camera distance
  gl_PointSize = uSize * (8.0 / -mv.z) * (0.55 + aSeed * 0.9);

  vGlow = burst;
  vSeed = aSeed;
}
`

export const fragmentShader = /* glsl */ `
precision highp float;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;

varying float vGlow;
varying float vSeed;

void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;

  float alpha = smoothstep(0.5, 0.0, r);
  alpha *= alpha;

  vec3 color = mix(uColorA, uColorB, vSeed);
  color = mix(color, vec3(1.0), vGlow * 0.4);

  gl_FragColor = vec4(color, alpha * 0.55 * uOpacity);
}
`
