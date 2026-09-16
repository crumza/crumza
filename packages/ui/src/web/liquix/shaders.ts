// The four render passes. Ported from the WebGL2 backend of the
// liquid-glass-studio reference shaders, reorganised so the
// background lives in the same pipeline as the glass: real refraction needs
// the backdrop as a texture, which a DOM backdrop-filter cannot provide.

import { COLOR, MATH, SDF } from './shader-lib';

export const MAX_PANELS: number = 8;
export const MAX_BLUR_RADIUS: number = 64;

const COMMON = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution; // device px
uniform float u_dpr;
`;

export const VERTEX: string = /* glsl */ `#version 300 es

in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/**
 * Pass 1 — background. Draws the vertical strip of panels at the current
 * scroll offset, then subtracts a drop shadow shaped by the same SDF as the
 * glass. Panels are either an image texture (cover-fitted) or a procedural
 * pattern; patterns make refraction and dispersion easy to read.
 */
export const FRAGMENT_BG: string = /* glsl */ `${COMMON}
${MATH}
${SDF}

uniform float u_scroll;      // CSS px scrolled from the top of the strip
uniform float u_panelHeight; // CSS px, one viewport
uniform int u_panelCount;
uniform int u_panelKind[${MAX_PANELS}];  // 0 image, 1 checker, 2 spectrum, 3 bars
uniform int u_panelReady[${MAX_PANELS}];
uniform float u_panelAspect[${MAX_PANELS}];
uniform sampler2D u_panel0;
uniform sampler2D u_panel1;
uniform sampler2D u_panel2;
uniform sampler2D u_panel3;
uniform sampler2D u_panel4;
uniform sampler2D u_panel5;
uniform sampler2D u_panel6;
uniform sampler2D u_panel7;

uniform float u_shadowExpand;
uniform float u_shadowFactor;
uniform vec2 u_shadowPosition; // device px, pre-negated by the caller

vec3 samplePanel(int index, vec2 uv) {
  if (index == 0) return texture(u_panel0, uv).rgb;
  if (index == 1) return texture(u_panel1, uv).rgb;
  if (index == 2) return texture(u_panel2, uv).rgb;
  if (index == 3) return texture(u_panel3, uv).rgb;
  if (index == 4) return texture(u_panel4, uv).rgb;
  if (index == 5) return texture(u_panel5, uv).rgb;
  if (index == 6) return texture(u_panel6, uv).rgb;
  return texture(u_panel7, uv).rgb;
}

// Scale uv so the texture covers the panel without distortion (object-fit: cover).
vec2 coverUV(vec2 uv, float panelAspect, float textureAspect) {
  if (panelAspect > textureAspect) {
    float scale = textureAspect / panelAspect;
    uv.y = uv.y * scale + 0.5 - 0.5 * scale;
  } else {
    float scale = panelAspect / textureAspect;
    uv.x = uv.x * scale + 0.5 - 0.5 * scale;
  }
  return uv;
}

float checker(vec2 p, float size) {
  float x = step(size * 2.0, mod(p.x * 2.0, size * 4.0));
  float y = step(size * 2.0, mod(p.y * 2.0, size * 4.0));
  return abs(x - y);
}

vec3 proceduralPanel(int kind, vec2 uv, vec2 panelPx) {
  if (kind == 1) {
    return vec3(1.0 - checker(panelPx, 22.0) * 0.82);
  }
  if (kind == 2) {
    float band = step(0.5, fract(panelPx.y / 130.0));
    return hsv2rgb(vec3(fract(uv.x * 1.15), 0.92, mix(0.5, 1.0, band)));
  }
  if (kind == 3) {
    float bars = step(0.5, fract(panelPx.x / 64.0));
    return mix(vec3(0.05, 0.06, 0.08), vec3(0.96, 0.97, 1.0), bars);
  }
  // Image panel that has not decoded yet.
  return mix(vec3(0.07, 0.08, 0.12), vec3(0.17, 0.19, 0.26), uv.y);
}

void main() {
  vec2 resCss = u_resolution / u_dpr;
  vec2 fragCss = gl_FragCoord.xy / u_dpr; // y-up

  // Distance from the top of the whole scrollable strip.
  float yFromTop = (resCss.y - fragCss.y) + u_scroll;
  float t = yFromTop / u_panelHeight;
  int index = clamp(int(floor(t)), 0, u_panelCount - 1);
  float localFromTop = clamp(t - float(index), 0.0, 1.0);

  vec2 uv = vec2(fragCss.x / resCss.x, 1.0 - localFromTop);
  vec2 panelPx = vec2(fragCss.x, localFromTop * u_panelHeight);

  int kind = u_panelKind[index];
  vec3 color;
  if (kind == 0 && u_panelReady[index] == 1) {
    color = samplePanel(index, coverUV(uv, resCss.x / u_panelHeight, u_panelAspect[index]));
  } else {
    color = proceduralPanel(kind, uv, panelPx);
  }

  float merged = mainSDF(gl_FragCoord.xy, u_shadowPosition);
  float shadow =
    exp(-1.0 / u_shadowExpand * abs(merged) * resCss.y) * 0.6 * u_shadowFactor;

  fragColor = vec4(color - vec3(shadow), 1.0);
}
`;

// Passes 2 & 3 — separable Gaussian. Weights come from the CPU so the radius
// is adjustable without recompiling, and both passes run at a reduced
// resolution, which is what makes a wide blur affordable per frame.
const blurPass = (axis: string): string => /* glsl */ `${COMMON}
uniform sampler2D u_src;
uniform int u_blurRadius;
uniform float u_blurWeights[${MAX_BLUR_RADIUS + 1}];

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec4 color = texture(u_src, v_uv) * u_blurWeights[0];
  for (int i = 1; i <= u_blurRadius; ++i) {
    if (i > ${MAX_BLUR_RADIUS}) break;
    vec2 offset = vec2(float(i)) * texelSize * ${axis};
    color += texture(u_src, v_uv + offset) * u_blurWeights[i];
    color += texture(u_src, v_uv - offset) * u_blurWeights[i];
  }
  fragColor = color;
}
`;

export const FRAGMENT_BLUR_V: string = blurPass('vec2(0.0, 1.0)');
export const FRAGMENT_BLUR_H: string = blurPass('vec2(1.0, 0.0)');

/**
 * Pass 4 — the glass itself.
 *
 * Inside the shape the backdrop is re-sampled along the surface normal by an
 * amount derived from Snell's law (refraction), once per colour channel with
 * slightly different indices (dispersion), blended from sharp to blurred with
 * depth into the edge (Gaussian blur masking), then lifted by a rim term
 * (Fresnel) and a normal-angle term (glare). The boundary is resolved by
 * smoothstepping the SDF across ~2px (anti-aliasing).
 */
export const FRAGMENT_MAIN: string = /* glsl */ `${COMMON}
${MATH}
${SDF}
${COLOR}

// Per-channel refractive index offsets that produce the chromatic fringe.
const float N_R = 1.0 - 0.02;
const float N_G = 1.0;
const float N_B = 1.0 + 0.02;

uniform sampler2D u_bg;
uniform sampler2D u_blurredBg;

uniform vec4 u_tint;
uniform float u_refThickness;
uniform float u_refDistance;
uniform float u_refFactor;
uniform float u_refDispersion;
uniform float u_refFresnelRange;
uniform float u_refFresnelFactor;
uniform float u_refFresnelHardness;
uniform float u_glareRange;
uniform float u_glareConvergence;
uniform float u_glareOppositeFactor;
uniform float u_glareFactor;
uniform float u_glareHardness;
uniform float u_glareAngle;
uniform int u_blurEdge;
uniform float u_overLight;      // how hard to dim over a bright backdrop
uniform float u_overLightPoint; // backdrop luminance the dimming centres on
uniform int u_step;

// Gradient of the SDF. Deliberately unnormalised: its length falls off where
// the field flattens (shape interior, blob neck), and sdfSlope() turns that
// into a 0..1 factor used to fade Fresnel and glare out of those regions.
vec2 getNormal(vec2 p) {
  vec2 h = vec2(max(abs(dFdx(p.x)), 0.0001), max(abs(dFdy(p.y)), 0.0001));
  vec2 grad = vec2(
    mainSDF(p + vec2(h.x, 0.0), vec2(0.0)) - mainSDF(p - vec2(h.x, 0.0), vec2(0.0)),
    mainSDF(p + vec2(0.0, h.y), vec2(0.0)) - mainSDF(p - vec2(0.0, h.y), vec2(0.0))
  ) / (2.0 * h);
  return grad * 1.414213562 * 1000.0;
}

// getNormal's length is proportional to 1000/canvasHeight on a well-formed
// distance field, so divide that out: the highlights then look identical at
// any viewport size or device pixel ratio.
float sdfSlope(vec2 normal) {
  return clamp(length(normal) * u_resolution.y / 1414.213562, 0.0, 1.0);
}

// Snell's law across a rounded bevel of thickness u_refThickness (CSS px).
// depth is the distance inside the shape, in CSS px.
float refractionEdgeFactor(float depth) {
  if (depth >= u_refThickness) return 0.0;
  float xRatio = 1.0 - depth / u_refThickness;
  float thetaI = safeAsin(pow(xRatio, 2.0));
  float thetaT = safeAsin(1.0 / u_refFactor * sin(thetaI));
  return -1.0 * tan(thetaT - thetaI);
}

// Shared falloff for the Fresnel rim and the glare band: 1 at the silhouette,
// decaying inwards over the range, with hardness widening the plateau.
float rimFalloff(float merged, float resCssY, float range, float hardness) {
  return clamp(
    pow(1.0 + merged * resCssY / 1500.0 * pow(500.0 / max(range, 0.01), 2.0) + hardness, 5.0),
    0.0,
    1.0
  );
}

/**
 * Apple's glass darkens itself over bright content so white labels stay
 * legible. The blurred backdrop is already in hand here, so instead of being
 * told "you are over something light" by the app, each pixel works it out from
 * the luminance actually behind it — the transition follows the background as
 * it scrolls, with no per-element flag to maintain.
 *
 * Applied to the body of the glass only; the specular rim keeps its lift, the
 * way dark glass still catches highlights.
 */
vec3 adaptToBackdrop(vec3 color, vec3 backdrop) {
  float luma = dot(backdrop, vec3(0.2126, 0.7152, 0.0722));
  float amount = smoothstep(u_overLightPoint - 0.18, u_overLightPoint + 0.18, luma);
  return color * (1.0 - u_overLight * amount);
}

// Three samples per surface point, each channel refracted by its own index.
vec4 dispersedBackdrop(float mixRate, vec2 offset, float factor) {
  vec2 offR = offset * (1.0 - (N_R - 1.0) * factor);
  vec2 offG = offset * (1.0 - (N_G - 1.0) * factor);
  vec2 offB = offset * (1.0 - (N_B - 1.0) * factor);

  vec3 sharp = vec3(
    texture(u_bg, v_uv + offR).r,
    texture(u_bg, v_uv + offG).g,
    texture(u_bg, v_uv + offB).b
  );
  vec3 blurred = vec3(
    texture(u_blurredBg, v_uv + offR).r,
    texture(u_blurredBg, v_uv + offG).g,
    texture(u_blurredBg, v_uv + offB).b
  );

  return vec4(mix(sharp, blurred, mixRate), 1.0);
}

void main() {
  float resCssY = u_resolution.y / u_dpr;
  float merged = mainSDF(gl_FragCoord.xy, vec2(0.0));
  vec4 outColor;

  // --- inspection steps (u_step 4 is the finished glass) ---------------------
  if (u_step == 0) {
    // Raw signed distance field with the zero-level isoline picked out.
    float px = 2.0 / u_resolution.y;
    vec3 col = vec3(merged > 0.0 ? merged * 3.0 : -merged * 6.0);
    col = mix(
      col,
      vec3(1.0),
      1.0 - smoothstep(0.5 / resCssY - px, 0.5 / resCssY + px, abs(merged))
    );
    fragColor = vec4(col, 1.0);
    return;
  }
  if (u_step == 1) {
    // Surface normal, hue = direction, alpha-free so falloff shows as darkness.
    if (merged < 0.0) {
      vec2 normal = getNormal(gl_FragCoord.xy);
      vec3 col = hsv2rgb(vec3(vec2ToAngle(normalize(normal)) / (2.0 * PI), 1.0, 1.0));
      fragColor = vec4(col * sdfSlope(normal), 1.0);
    } else {
      fragColor = vec4(vec3(0.12), 1.0);
    }
    return;
  }
  if (u_step == 2) {
    // Snell edge factor: how far each point bends the backdrop.
    if (merged < 0.0) {
      fragColor = vec4(vec3(refractionEdgeFactor(-merged * resCssY)), 1.0);
    } else {
      fragColor = vec4(vec3(0.0), 1.0);
    }
    return;
  }
  if (u_step == 3) {
    // Blur pass output inside the silhouette, sharp background outside.
    fragColor = merged < 0.0 ? texture(u_blurredBg, v_uv) : texture(u_bg, v_uv);
    return;
  }

  // --- full composite -------------------------------------------------------
  if (merged < 0.005) {
    float depth = -merged * resCssY; // CSS px inside the silhouette
    float edgeFactor = refractionEdgeFactor(depth);

    float glow = nearestGlow(gl_FragCoord.xy);

    if (edgeFactor <= 0.0) {
      // Flat interior: blurred backdrop plus tint, no bending.
      outColor = texture(u_blurredBg, v_uv);
      outColor = mix(outColor, vec4(u_tint.rgb, 1.0), u_tint.a * 0.8);
      outColor.rgb = adaptToBackdrop(outColor.rgb, outColor.rgb);
      outColor.rgb *= 1.0 + 0.10 * glow;
    } else {
      vec2 normal = getNormal(gl_FragCoord.xy);
      float slope = sdfSlope(normal);
      // Keeps the offset circular on a non-square canvas.
      vec2 aspectFix = vec2(u_resolution.y / u_resolution.x, 1.0);
      vec2 offset = -normal * edgeFactor * u_refDistance * u_dpr * aspectFix;

      // Sharp at the bevel's outer lip, blurred as it deepens, unless the
      // edge is forced fully blurred.
      float edgeDepth = depth / u_refThickness;
      vec4 refracted = dispersedBackdrop(
        u_blurEdge > 0 ? 1.0 : edgeDepth,
        offset,
        u_refDispersion
      );

      outColor = mix(refracted, vec4(u_tint.rgb, 1.0), u_tint.a * 0.8);
      outColor.rgb = adaptToBackdrop(outColor.rgb, refracted.rgb);

      // Fresnel reflection: grazing angles at the rim reflect more light.
      // Hovering or pressing brightens the rim first, which is where the eye
      // is already looking, rather than washing out the whole surface.
      float fresnel = rimFalloff(merged, resCssY, u_refFresnelRange, u_refFresnelHardness);
      vec3 fresnelLch = srgbToLch(mix(vec3(1.0), u_tint.rgb, u_tint.a * 0.5));
      fresnelLch.x = clamp(fresnelLch.x + 20.0 * fresnel * u_refFresnelFactor, 0.0, 100.0);
      outColor = mix(
        outColor,
        vec4(lchToSrgb(fresnelLch), 1.0),
        clamp(fresnel * u_refFresnelFactor * 0.7 * slope * (1.0 + 0.9 * glow), 0.0, 1.0)
      );

      // Glare: a directional highlight that rides the normal angle, so it
      // stays put as the shape moves and stretches.
      float glareGeo = rimFalloff(merged, resCssY, u_glareRange, u_glareHardness);
      float glareAngle = (vec2ToAngle(normalize(normal)) - PI / 4.0 + u_glareAngle) * 2.0;
      bool farSide =
        (glareAngle > PI * 1.5 && glareAngle < PI * 3.5) || glareAngle < -PI * 0.5;
      float glare =
        (0.5 + sin(glareAngle) * 0.5) *
        (farSide ? 1.2 * u_glareOppositeFactor : 1.2) *
        u_glareFactor;
      glare = clamp(pow(glare, 0.1 + u_glareConvergence * 2.0), 0.0, 1.0);

      vec3 glareLch = srgbToLch(mix(refracted.rgb, u_tint.rgb, u_tint.a * 0.5));
      glareLch.x = clamp(glareLch.x + 150.0 * glare * glareGeo, 0.0, 120.0);
      glareLch.y += 30.0 * glare * glareGeo;
      outColor = mix(
        outColor,
        vec4(lchToSrgb(glareLch), 1.0),
        clamp(glare * glareGeo * slope * (1.0 + 0.5 * glow), 0.0, 1.0)
      );
      outColor.rgb *= 1.0 + 0.10 * glow;
    }
  } else {
    outColor = texture(u_bg, v_uv);
  }

  // Anti-aliasing: resolve the silhouette against the background over ~2px of
  // the distance field instead of letting the branch above hard-clip it.
  outColor = mix(outColor, texture(u_bg, v_uv), smoothstep(-0.001, 0.001, merged));

  fragColor = outColor;
}
`;
