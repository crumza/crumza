// Minimal WebGL2 multipass renderer for the liquix glass pipeline.
//
// Four passes over one fullscreen triangle strip:
//   bg      -> offscreen, full resolution (backdrop + drop shadow)
//   blurV   -> offscreen, reduced resolution
//   blurH   -> offscreen, reduced resolution (the blurred backdrop)
//   glass   -> the canvas, sampling both bg and blurred bg
//
// Ported from the liquid-glass-studio reference renderer; see THIRD-PARTY.md.

import type { LiquixParams } from './params';
import { MAX_SHAPES } from './shader-lib';
import {
  FRAGMENT_BG,
  FRAGMENT_BLUR_H,
  FRAGMENT_BLUR_V,
  FRAGMENT_MAIN,
  MAX_BLUR_RADIUS,
  MAX_PANELS,
  VERTEX,
} from './shaders';

export interface GaussianKernel {
  readonly radius: number;
  readonly weights: readonly number[];
}

/** Every shape solid, for hosts that never fade one. */
const SOLID = new Float32Array(MAX_SHAPES).fill(1);

/** Normalised 1D Gaussian kernel, index 0 being the centre tap. */
export function gaussianKernel(radius: number): GaussianKernel {
  const r = Math.max(1, Math.min(MAX_BLUR_RADIUS, Math.round(radius)));
  const sigma = r / 3;
  const weights: number[] = [];
  let sum = 0;
  for (let i = 0; i <= r; i++) {
    const w = Math.exp((-0.5 * (i * i)) / (sigma * sigma));
    weights.push(w);
    sum += i === 0 ? w : w * 2;
  }
  return { radius: r, weights: weights.map((w) => w / sum) };
}

export interface PanelRecord {
  kind: number;
  ready: boolean;
  texture: WebGLTexture | null;
  aspect: number;
}

/** One frame's shape buffers. The arrays are reused by the caller, one slot per shape. */
export interface ShapeFrame {
  readonly count: number;
  readonly centers: Float32Array;
  readonly sizes: Float32Array;
  readonly corners: Float32Array;
  readonly glows: Float32Array;
  /** 1 solid, 0 gone. Only read on a transparent canvas; solid when absent. */
  readonly alphas?: Float32Array | undefined;
  readonly pull: readonly [number, number];
}

export interface RenderState {
  readonly shapes: ShapeFrame;
  readonly params: LiquixParams;
  readonly panels: readonly PanelRecord[];
  readonly kernel: GaussianKernel;
  readonly scroll: number;
  readonly panelHeight: number;
}

export interface GlassRenderer {
  readonly gl: WebGL2RenderingContext;
  resize(width: number, height: number, dpr: number, blurScale: number): void;
  render(state: RenderState): void;
  dispose(): void;
}

interface UniformEntry {
  readonly location: WebGLUniformLocation;
  readonly type: number;
  readonly size: number;
}

interface CompiledProgram {
  readonly program: WebGLProgram;
  readonly uniforms: Map<string, UniformEntry>;
}

type UniformValue = number | boolean | readonly number[] | Float32Array | Int32Array;

function must<T>(value: T | null, what: string): T {
  if (value === null) throw new Error(`Could not create ${what}`);
  return value;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = must(gl.createShader(type), 'shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, fragmentSource: string): CompiledProgram {
  const program = must(gl.createProgram(), 'program');
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${log}`);
  }

  // Introspect uniforms so callers can pass a plain object and let the type
  // reported by the driver pick the right gl.uniform* call.
  const uniforms = new Map<string, UniformEntry>();
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const location = gl.getUniformLocation(program, info.name);
    if (!location) continue;
    uniforms.set(info.name.replace(/\[0\]$/, ''), {
      location,
      type: info.type,
      size: info.size,
    });
  }
  return { program, uniforms };
}

function setUniform(gl: WebGL2RenderingContext, entry: UniformEntry, value: UniformValue): void {
  const { location, type, size } = entry;
  const isArray = size > 1 || Array.isArray(value) || ArrayBuffer.isView(value);

  switch (type) {
    case gl.FLOAT:
      if (isArray) gl.uniform1fv(location, value as Float32Array);
      else gl.uniform1f(location, value as number);
      break;
    case gl.INT:
    case gl.BOOL:
      if (isArray) gl.uniform1iv(location, value as Int32Array);
      else gl.uniform1i(location, (value as number) | 0);
      break;
    case gl.FLOAT_VEC2:
      gl.uniform2fv(location, value as Float32Array);
      break;
    case gl.FLOAT_VEC3:
      gl.uniform3fv(location, value as Float32Array);
      break;
    case gl.FLOAT_VEC4:
      gl.uniform4fv(location, value as Float32Array);
      break;
    case gl.INT_VEC2:
      gl.uniform2iv(location, value as Int32Array);
      break;
    default:
      break;
  }
}

class Framebuffer {
  readonly gl: WebGL2RenderingContext;
  readonly halfFloat: boolean;
  readonly fbo: WebGLFramebuffer;
  readonly texture: WebGLTexture;
  width = 1;
  height = 1;

  constructor(gl: WebGL2RenderingContext, halfFloat: boolean) {
    this.gl = gl;
    this.halfFloat = halfFloat;
    this.fbo = must(gl.createFramebuffer(), 'framebuffer');
    this.texture = must(gl.createTexture(), 'texture');
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.resize(1, 1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  resize(width: number, height: number): void {
    const gl = this.gl;
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    if (this.halfFloat) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA16F,
        this.width,
        this.height,
        0,
        gl.RGBA,
        gl.HALF_FLOAT,
        null,
      );
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        this.width,
        this.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
    }
  }

  dispose(): void {
    this.gl.deleteFramebuffer(this.fbo);
    this.gl.deleteTexture(this.texture);
  }
}

export interface PanelTexture {
  readonly ready: boolean;
  readonly texture: WebGLTexture | null;
  readonly aspect: number;
}

/**
 * Loads an image into a texture. Resolves with ready false rather than
 * rejecting, so a missing or cross-origin-blocked panel just falls back to its
 * procedural pattern.
 */
export function loadPanelTexture(gl: WebGL2RenderingContext, url: string): Promise<PanelTexture> {
  return new Promise<PanelTexture>((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      resolve({
        ready: true,
        texture,
        aspect: image.naturalWidth / Math.max(1, image.naturalHeight),
      });
    };
    image.onerror = () => resolve({ ready: false, texture: null, aspect: 1 });
    image.src = url;
  });
}

export interface GlassRendererOptions {
  /**
   * Turns the canvas into a stencil: the backdrop is still rendered and
   * refracted, but only the glass itself is composited, so the canvas can sit
   * over live DOM and leave everything else clickable. Off by default, which is
   * byte for byte the original opaque pipeline.
   *
   * premultipliedAlpha is off with it: the shader writes straight sRGB and a
   * separate coverage, and premultiplying would darken the anti-aliased rim
   * against a light page.
   */
  readonly transparent?: boolean | undefined;
}

export function createGlassRenderer(
  canvas: HTMLCanvasElement,
  options: GlassRendererOptions = {},
): GlassRenderer | null {
  const transparent = options.transparent === true;
  const context = canvas.getContext('webgl2', {
    alpha: transparent,
    premultipliedAlpha: !transparent,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!context) return null;
  // Declared non-null so the hoisted pass functions below see the narrowing.
  const gl: WebGL2RenderingContext = context;

  const halfFloat =
    !!gl.getExtension('EXT_color_buffer_half_float') || !!gl.getExtension('EXT_color_buffer_float');

  let bg: CompiledProgram;
  let blurV: CompiledProgram;
  let blurH: CompiledProgram;
  let glass: CompiledProgram;
  try {
    bg = createProgram(gl, FRAGMENT_BG);
    blurV = createProgram(gl, FRAGMENT_BLUR_V);
    blurH = createProgram(gl, FRAGMENT_BLUR_H);
    glass = createProgram(gl, FRAGMENT_MAIN);
  } catch {
    // A driver that cannot build the pipeline is a fallback, not a crash.
    return null;
  }

  // Fullscreen quad shared by every pass.
  const vao = must(gl.createVertexArray(), 'vertex array');
  gl.bindVertexArray(vao);
  const buffer = must(gl.createBuffer(), 'buffer');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  for (const { program } of [bg, blurV, blurH, glass]) {
    const location = gl.getAttribLocation(program, 'a_position');
    if (location >= 0) {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    }
  }
  gl.bindVertexArray(null);

  const bgTarget = new Framebuffer(gl, halfFloat);
  const blurVTarget = new Framebuffer(gl, halfFloat);
  const blurHTarget = new Framebuffer(gl, halfFloat);

  // Stand-in for panel samplers with no image, so every sampler has its own
  // bound texture on its own unit.
  const placeholder = must(gl.createTexture(), 'texture');
  gl.bindTexture(gl.TEXTURE_2D, placeholder);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([32, 34, 44, 255]),
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  let size = { width: 1, height: 1, dpr: 1, blurScale: 0.4 };

  function resize(width: number, height: number, dpr: number, blurScale: number): void {
    size = { width, height, dpr, blurScale };
    bgTarget.resize(width, height);
    blurVTarget.resize(width * blurScale, height * blurScale);
    blurHTarget.resize(width * blurScale, height * blurScale);
  }

  function runPass(
    { program, uniforms }: CompiledProgram,
    target: Framebuffer | null,
    values: Readonly<Record<string, UniformValue | undefined>>,
    textures: readonly (readonly [string, WebGLTexture | null])[],
  ): void {
    // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is WebGL, not a React hook.
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.width, target.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, size.width, size.height);
    }

    for (const [name, value] of Object.entries(values)) {
      const entry = uniforms.get(name);
      if (entry && value !== undefined) setUniform(gl, entry, value);
    }

    let unit = 0;
    for (const [name, texture] of textures) {
      const entry = uniforms.get(name);
      if (!entry) continue;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture ?? placeholder);
      gl.uniform1i(entry.location, unit);
      unit++;
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * One frame. The state carries the shapes, the effect parameters, the panel
   * strip and the blur kernel; the stage assembles it.
   */
  function render(state: RenderState): void {
    const { shapes, params, panels, kernel, scroll, panelHeight } = state;
    const resolution = [size.width, size.height];

    // Uniforms every pass that includes the SDF needs.
    const shapeUniforms = {
      u_resolution: resolution,
      u_dpr: size.dpr,
      u_shapeCount: shapes.count,
      u_shapeCenters: shapes.centers,
      u_shapeSizes: shapes.sizes,
      u_shapeCorners: shapes.corners,
      u_shapeGlow: shapes.glows,
      u_shapeAlpha: shapes.alphas ?? SOLID,
      u_pull: shapes.pull,
      u_pullStretch: params.pullStretch,
      u_pullSquash: params.pullSquash,
    } satisfies Record<string, UniformValue>;

    const kinds = new Int32Array(MAX_PANELS);
    const ready = new Int32Array(MAX_PANELS);
    const aspects = new Float32Array(MAX_PANELS).fill(1);
    const panelTextures: (readonly [string, WebGLTexture | null])[] = [];
    for (let i = 0; i < MAX_PANELS; i++) {
      const panel = panels[i];
      kinds[i] = panel ? panel.kind : 1;
      ready[i] = panel?.ready ? 1 : 0;
      aspects[i] = panel?.aspect ? panel.aspect : 1;
      panelTextures.push([`u_panel${i}`, panel ? panel.texture : null]);
    }

    runPass(
      bg,
      bgTarget,
      {
        ...shapeUniforms,
        u_scroll: scroll,
        u_panelHeight: panelHeight,
        u_panelCount: Math.max(1, Math.min(MAX_PANELS, panels.length)),
        u_panelKind: kinds,
        u_panelReady: ready,
        u_panelAspect: aspects,
        u_shadowExpand: params.shadowExpand,
        u_shadowFactor: params.shadowFactor / 100,
        u_shadowPosition: [-params.shadowOffsetX * size.dpr, params.shadowOffsetY * size.dpr],
      },
      panelTextures,
    );

    const blurUniforms = {
      u_dpr: size.dpr,
      u_blurRadius: kernel.radius,
      u_blurWeights: kernel.weights,
    } satisfies Record<string, UniformValue>;
    runPass(
      blurV,
      blurVTarget,
      { ...blurUniforms, u_resolution: [blurVTarget.width, blurVTarget.height] },
      [['u_src', bgTarget.texture]],
    );
    runPass(
      blurH,
      blurHTarget,
      { ...blurUniforms, u_resolution: [blurHTarget.width, blurHTarget.height] },
      [['u_src', blurVTarget.texture]],
    );

    runPass(
      glass,
      null,
      {
        ...shapeUniforms,
        u_tint: [params.tint.r / 255, params.tint.g / 255, params.tint.b / 255, params.tint.a],
        u_refThickness: params.refThickness,
        u_refDistance: params.refDistance,
        u_refFactor: params.refFactor,
        u_refDispersion: params.refDispersion,
        u_refFresnelRange: params.fresnelRange,
        u_refFresnelFactor: params.fresnelFactor / 100,
        u_refFresnelHardness: params.fresnelHardness / 100,
        u_glareRange: params.glareRange,
        u_glareFactor: params.glareFactor / 100,
        u_glareHardness: params.glareHardness / 100,
        u_glareConvergence: params.glareConvergence / 100,
        u_glareOppositeFactor: params.glareOppositeFactor / 100,
        u_glareAngle: (params.glareAngle * Math.PI) / 180,
        u_blurEdge: params.blurEdge ? 1 : 0,
        u_overLight: params.overLight / 100,
        u_overLightPoint: params.overLightPoint / 100,
        u_step: params.step,
        u_cutout: transparent ? 1 : 0,
      },
      [
        ['u_bg', bgTarget.texture],
        ['u_blurredBg', blurHTarget.texture],
      ],
    );
  }

  function dispose(): void {
    bgTarget.dispose();
    blurVTarget.dispose();
    blurHTarget.dispose();
    gl.deleteTexture(placeholder);
    gl.deleteBuffer(buffer);
    gl.deleteVertexArray(vao);
    for (const { program } of [bg, blurV, blurH, glass]) gl.deleteProgram(program);
  }

  return { gl, resize, render, dispose };
}
