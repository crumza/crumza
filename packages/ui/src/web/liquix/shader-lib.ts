// Shared GLSL snippets, concatenated into the passes in ./shaders.ts.
// Ported from the liquid-glass-studio reference shaders; see THIRD-PARTY.md.

/** asin() with a clamped domain: |x| > 1 is undefined in GLSL and would NaN the rim. */
export const MATH: string = /* glsl */ `
#define PI (3.14159265359)

float safeAsin(float x) {
  return asin(clamp(x, -1.0, 1.0));
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float vec2ToAngle(vec2 v) {
  float angle = atan(v.y, v.x);
  if (angle < 0.0) angle += 2.0 * PI;
  return angle;
}
`;

/**
 * sRGB <-> LCH, D65 only. Fresnel and glare brighten by pushing L (and C) in
 * LCH rather than blending toward white in sRGB, which keeps the hue of the
 * backdrop showing through the highlight.
 */
export const COLOR: string = /* glsl */ `
const vec3 D65_WHITE = vec3(0.95045592705, 1.0, 1.08905775076);
const mat3 RGB_TO_XYZ_M = mat3(
  0.4124, 0.3576, 0.1805,
  0.2126, 0.7152, 0.0722,
  0.0193, 0.1192, 0.9505
);
const mat3 XYZ_TO_RGB_M = mat3(
   3.2406255, -1.537208 , -0.4986286,
  -0.9689307,  1.8757561,  0.0415175,
   0.0557101, -0.2040211,  1.0569959
);

float uncompandSrgb(float a) {
  return a > 0.04045 ? pow((a + 0.055) / 1.055, 2.4) : a / 12.92;
}

float compandRgb(float a) {
  return a <= 0.0031308 ? 12.92 * a : 1.055 * pow(a, 0.41666666666) - 0.055;
}

float xyzToLabF(float x) {
  return x > 0.00885645167 ? pow(x, 0.333333333) : 7.78703703704 * x + 0.13793103448;
}

float labToXyzF(float x) {
  return x > 0.206897 ? x * x * x : 0.12841854934 * (x - 0.137931034);
}

vec3 srgbToLch(vec3 srgb) {
  vec3 rgb = vec3(uncompandSrgb(srgb.r), uncompandSrgb(srgb.g), uncompandSrgb(srgb.b));
  vec3 xyz = rgb * RGB_TO_XYZ_M;
  vec3 s = xyz / D65_WHITE;
  s = vec3(xyzToLabF(s.x), xyzToLabF(s.y), xyzToLabF(s.z));
  vec3 lab = vec3(
    116.0 * s.y - 16.0,
    500.0 * (s.x - s.y),
    200.0 * (s.y - s.z)
  );
  return vec3(lab.x, sqrt(dot(lab.yz, lab.yz)), atan(lab.z, lab.y) * 57.2957795131);
}

vec3 lchToSrgb(vec3 lch) {
  vec3 lab = vec3(lch.x, lch.y * cos(lch.z * 0.01745329251), lch.y * sin(lch.z * 0.01745329251));
  float w = (lab.x + 16.0) / 116.0;
  vec3 xyz = D65_WHITE *
    vec3(labToXyzF(w + lab.y / 500.0), labToXyzF(w), labToXyzF(w - lab.z / 200.0));
  vec3 rgb = xyz * XYZ_TO_RGB_M;
  return vec3(compandRgb(rgb.r), compandRgb(rgb.g), compandRgb(rgb.b));
}
`;

export const MAX_SHAPES: number = 6;

/**
 * Shape uniforms + signed distance field. Both the background pass (for the
 * drop shadow) and the glass pass evaluate the same `mainSDF`, so the shadow
 * always tracks the merged silhouette.
 *
 * Lengths arrive in CSS pixels and are converted to SDF units (1.0 = canvas
 * height) inside the shader, which keeps the field resolution independent.
 */
export const SDF: string = /* glsl */ `
#define MAX_SHAPES ${MAX_SHAPES}

uniform int u_shapeCount;
uniform vec2 u_shapeCenters[MAX_SHAPES]; // device px, y-up
uniform vec2 u_shapeSizes[MAX_SHAPES];   // CSS px
uniform vec2 u_shapeCorners[MAX_SHAPES]; // x: radius in CSS px, y: superellipse exponent
uniform float u_shapeGlow[MAX_SHAPES];  // 0 at rest, up to 1 while hovered or pressed
uniform vec2 u_pull;          // overscroll vector, x right / y up, ~-1..1 per axis
uniform float u_pullStretch;
uniform float u_pullSquash;

// |x|^n + |y|^n = r^n. n = 2 is a circular corner, higher n squares it off;
// n around 4-6 is the Apple "squircle" range.
float superellipseCornerSDF(vec2 p, float r, float n) {
  p = abs(p);
  float v = pow(pow(p.x, n) + pow(p.y, n), 1.0 / n);
  return v - r;
}

float superellipseRectSDF(vec2 p, vec2 halfSize, float cornerRadius, float n) {
  float cr = min(cornerRadius, min(halfSize.x, halfSize.y));
  vec2 d = abs(p) - halfSize;
  float box = min(max(d.x, d.y), 0.0) + length(max(d, 0.0));

  // Far field: out here the box distance is within a fraction of the corner
  // radius of the true distance, and nothing this far out is drawn as glass —
  // only the drop shadow's exponential falloff reads it. Taking the cheap
  // branch skips the pow() chain for most of the screen, which matters now
  // that every shape in the row is evaluated at every pixel.
  if (box > 1.5 * cr) return box;

  if (d.x > -cr && d.y > -cr) {
    // Corner region: measure against the superellipse centred on the corner.
    vec2 cornerCenter = sign(p) * (halfSize - vec2(cr));
    return superellipseCornerSDF(p - cornerCenter, cr, n);
  }

  // Straight edges and interior.
  return box;
}

/**
 * Overscroll warp: squash and stretch along whichever axis is being pulled.
 *
 * The sample point is mapped back into the undeformed shape, so in world space
 * each shape grows along the pull direction and pinches across it, symmetric
 * about its own centre. A circle pulled downwards becomes an upright oval; a
 * capsule pulled sideways gets longer and thinner. The axes come from the pull
 * vector rather than from x and y, so a diagonal pull works the same way.
 *
 * At these amplitudes (a few percent) the scaling leaves the field within a
 * few percent of a true distance function, which is well inside what the
 * bevel and the highlights can show.
 */
vec2 pullWarp(vec2 p) {
  float amount = length(u_pull);
  if (amount < 0.0005) return p;

  vec2 along = u_pull / amount;
  vec2 across = vec2(-along.y, along.x);
  amount = min(amount, 1.5);

  return
    along * (dot(p, along) / (1.0 + u_pullStretch * amount)) +
    across * (dot(p, across) / max(1.0 - u_pullSquash * amount, 0.05));
}

/**
 * The whole row as one field: a plain union of the shapes, so each button
 * keeps its own silhouette and neighbours never fuse into one another.
 *
 * The offset argument shifts the sample point (device px), which slides every
 * shape the other way — used to displace the drop shadow.
 */
float shapeSDF(int i, vec2 frag, vec2 offset) {
  float k = u_dpr / u_resolution.y; // CSS px -> SDF units
  vec2 halfSize = u_shapeSizes[i] * 0.5 * k;
  vec2 q = (frag + offset - u_shapeCenters[i]) / u_resolution.y;
  return superellipseRectSDF(pullWarp(q), halfSize, u_shapeCorners[i].x * k, u_shapeCorners[i].y);
}

float mainSDF(vec2 frag, vec2 offset) {
  float merged = 1e9;
  for (int i = 0; i < MAX_SHAPES; i++) {
    if (i >= u_shapeCount) break;
    merged = min(merged, shapeSDF(i, frag, offset));
  }
  return merged;
}

// Interaction state of whichever shape owns this pixel. Only called for pixels
// inside the glass, where the nearest shape is the one being drawn.
float nearestGlow(vec2 frag) {
  float best = 1e9;
  float glow = 0.0;
  for (int i = 0; i < MAX_SHAPES; i++) {
    if (i >= u_shapeCount) break;
    float d = shapeSDF(i, frag, vec2(0.0));
    if (d < best) {
      best = d;
      glow = u_shapeGlow[i];
    }
  }
  return glow;
}
`;
