import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '../cn';
import {
  disposePanels,
  type LiquixPaint,
  type LiquixStrip,
  paintPanels,
  tileWindow,
} from '../liquix/backdrop';
import { defaultLiquixSurfaceParams, type LiquixParams, type LiquixTint } from '../liquix/params';
import {
  createGlassRenderer,
  gaussianKernel,
  type GaussianKernel,
  type GlassRenderer,
  type PanelRecord,
} from '../liquix/renderer';
import { MAX_SHAPES } from '../liquix/shader-lib';
import { MAX_PANELS } from '../liquix/shaders';
import { LiquixStageContext, type LiquixShapeEntry, type LiquixStageValue } from '../liquix/stage';

export interface LiquixSurfaceProps {
  /**
   * Draws the scrollable content into a 2D context and returns how tall it
   * came out, in CSS px. Called again whenever `paintKey` or the surface's
   * size changes. Memoise it: a new function means every strip is repainted.
   */
  readonly paint: LiquixPaint;
  /**
   * Identifies what `paint` will draw. Every key seen is rasterised once and
   * kept, so switching between them is a pointer swap rather than an upload,
   * which is what lets an animation triggered by the switch actually be seen.
   */
  readonly paintKey?: string | undefined;
  /** Every key to rasterise up front. Defaults to `paintKey` alone. */
  readonly paintKeys?: readonly string[] | undefined;
  /** Overrides merged over defaultLiquixSurfaceParams. */
  readonly params?: Partial<LiquixParams> | undefined;
  /** Rendered under the canvas: for anything that has to sit beneath the glass, a drop shadow above all. */
  readonly underlay?: ReactNode | undefined;
  /** Rendered over the canvas: the controls the glass is drawn for. */
  readonly overlay?: ReactNode | undefined;
  readonly className?: string | undefined;
  /** The scrollable content, under the glass and fully live. */
  readonly children?: ReactNode | undefined;
}

interface SurfaceSize {
  readonly width: number;
  readonly height: number;
}

interface LoopState {
  panels: readonly PanelRecord[];
  strips: Map<string, LiquixStrip>;
  kernel: GaussianKernel;
  scroll: number;
  maxScroll: number;
  arrays: {
    centers: Float32Array;
    sizes: Float32Array;
    corners: Float32Array;
    glows: Float32Array;
    alphas: Float32Array;
  };
  size: { width: number; height: number; dpr: number; blurScale: number };
  accumulator: number;
  lastTime: number;
}

/** The tint a shape reaches at zero clarity: a milky, frosted body, whatever colour the glass is. */
const FROST: LiquixTint = { r: 255, g: 255, b: 255, a: 0.5 };

/** `from` at 0, `to` at 1, per channel. */
function mixTint(from: LiquixTint, to: LiquixTint, t: number): LiquixTint {
  return {
    r: from.r + (to.r - from.r) * t,
    g: from.g + (to.g - from.g) * t,
    b: from.b + (to.b - from.b) * t,
    a: from.a + (to.a - from.a) * t,
  };
}

const SCROLLER =
  'absolute inset-0 overflow-y-auto overscroll-contain focus-visible:outline-none [scrollbar-color:var(--color-zinc-300)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar]:w-1';

/**
 * A surface that anything made of glass can be put on.
 *
 * The content is real DOM in a native scroll container, and the canvas lies
 * over it as a stencil: the renderer is asked for `transparent`, so every
 * pixel outside the glass is written at alpha 0 and the elements underneath
 * show through. With `pointer-events: none` on the canvas they stay
 * clickable, selectable and findable too.
 *
 * The shader cannot sample DOM, so `paint` draws the same content a second
 * time, off-screen, purely as the backdrop the glass refracts. Nobody sees
 * that copy; it only has to agree with the DOM.
 *
 * Shapes register through useLiquixBox. They are drawn in layers, because the
 * shader merges everything it is given into one distance field with min(): a
 * pill inside a bar would be swallowed by it, since inside the bar the bar is
 * always the deeper shape. So each layer gets its own pass, composited over
 * the passes before it, which is how a highlight comes to sit on the bar's
 * glass rather than merging into it. Every layer refracts the content itself,
 * not the glass below: a lens on a lens would show the lower rim inside it.
 */
export function LiquixSurface({
  paint,
  paintKey = 'default',
  paintKeys,
  params,
  underlay,
  overlay,
  className,
  children,
}: LiquixSurfaceProps): ReactElement {
  const settings = useMemo<LiquixParams>(
    () => ({ ...defaultLiquixSurfaceParams, ...params }),
    [params],
  );
  const settingsRef = useRef(settings);
  // Keyed on the contents, not the array: a caller who writes the list inline
  // must not repaint every strip on every render.
  const keySignature = paintKeys?.length ? paintKeys.join('\u0000') : paintKey;
  // biome-ignore lint/correctness/useExhaustiveDependencies: the signature stands in for the array's contents.
  const keys = useMemo<readonly string[]>(
    () => (paintKeys?.length ? [...paintKeys] : [paintKey]),
    [keySignature],
  );
  const hostRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GlassRenderer | null>(null);
  const shapesRef = useRef<readonly LiquixShapeEntry[]>([]);
  const [fallback, setFallback] = useState(false);
  const [size, setSize] = useState<SurfaceSize>({ width: 0, height: 0 });

  // Everything the frame loop touches, kept off the React render path and read
  // only from effects, the way LiquixStage holds its own frame state.
  const stateRef = useRef<LoopState>({
    panels: [],
    strips: new Map(),
    kernel: gaussianKernel(defaultLiquixSurfaceParams.blurRadius),
    scroll: 0,
    maxScroll: 0,
    arrays: {
      centers: new Float32Array(MAX_SHAPES * 2),
      sizes: new Float32Array(MAX_SHAPES * 2),
      corners: new Float32Array(MAX_SHAPES * 2),
      glows: new Float32Array(MAX_SHAPES),
      alphas: new Float32Array(MAX_SHAPES),
    },
    size: { width: 0, height: 0, dpr: 0, blurScale: 0 },
    accumulator: 0,
    lastTime: 0,
  });

  useEffect(() => {
    settingsRef.current = settings;
    stateRef.current.kernel = gaussianKernel(settings.blurRadius);
  }, [settings]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const register = useCallback((entry: LiquixShapeEntry) => {
    if (!shapesRef.current.includes(entry)) shapesRef.current = [...shapesRef.current, entry];
  }, []);
  const unregister = useCallback((entry: LiquixShapeEntry) => {
    shapesRef.current = shapesRef.current.filter((item) => item !== entry);
  }, []);
  const stage = useMemo<LiquixStageValue>(
    () => ({ register, unregister, fallback }),
    [register, unregister, fallback],
  );

  // --- renderer lifecycle and frame loop -------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = stateRef.current;
    const renderer = createGlassRenderer(canvas, { transparent: true });
    if (!renderer) {
      setFallback(true);
      return;
    }
    rendererRef.current = renderer;

    let raf = 0;
    const onContextLost = (event: Event) => {
      event.preventDefault();
      // The canvas is about to unmount; nothing more can be drawn or uploaded.
      cancelAnimationFrame(raf);
      rendererRef.current = null;
      setFallback(true);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);

      const elapsed = state.lastTime ? (time - state.lastTime) / 1000 : 1 / 60;
      state.lastTime = time;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssWidth = canvas.clientWidth;
      const cssHeight = canvas.clientHeight;
      if (!cssWidth || !cssHeight) return;

      const gl = renderer.gl;
      const { blurScale } = settingsRef.current;
      if (
        state.size.width !== cssWidth ||
        state.size.height !== cssHeight ||
        state.size.dpr !== dpr ||
        state.size.blurScale !== blurScale
      ) {
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
        renderer.resize(canvas.width, canvas.height, dpr, blurScale);
        state.size = { width: cssWidth, height: cssHeight, dpr, blurScale };
      }

      // Interaction easing runs on a fixed timestep: clamping a variable
      // delta would quietly run it in slow motion on a slow frame.
      const STEP = 1 / 120;
      state.accumulator = Math.min(0.25, state.accumulator + elapsed);
      while (state.accumulator >= STEP) {
        state.accumulator -= STEP;
        for (const entry of shapesRef.current) {
          const ease = Math.min(1, STEP * 14);
          entry.scale += (entry.scaleTarget - entry.scale) * ease;
          entry.glow += (entry.glowTarget - entry.glow) * ease;
        }
      }

      const entries = shapesRef.current;
      const { centers, sizes, corners, glows, alphas } = state.arrays;
      const canvasBox = canvas.getBoundingClientRect();

      // One pass per layer, lowest first; see the component's note on why.
      const layers = [...new Set(entries.map((entry) => entry.layer ?? 0))].sort((a, b) => a - b);
      if (layers.length === 0) layers.push(0);

      layers.forEach((layer, pass) => {
        // A shape is drawn only while it has an element, a size and any alpha
        // at all. Without an element, a panel that has closed say, it would
        // sit at the canvas centre; without alpha it draws nothing itself but
        // would still own the pixels nearest it and cut them out of the
        // shapes around it, and its clarity would frost the whole pass.
        const group = entries
          .filter(
            (entry) =>
              (entry.layer ?? 0) === layer &&
              entry.el !== null &&
              entry.shape.width > 0 &&
              entry.shape.height > 0 &&
              (entry.alpha ?? 1) > 0,
          )
          .slice(0, MAX_SHAPES);

        // The pass has the deepest lens rim any of its shapes asks for, the
        // surface's own at least; it is only as much of a lens as its least
        // clear shape, and carries the deepest shadow any shape asks for.
        const base = settingsRef.current;
        let bevel = base.refThickness;
        let clarity = 1;
        let shadow = base.shadowFactor;
        group.forEach((entry, i) => {
          bevel = Math.max(bevel, entry.bevel ?? 0);
          clarity = Math.min(clarity, entry.clarity ?? 1);
          shadow = Math.max(shadow, entry.shadow ?? 0);
          const rect = entry.el?.getBoundingClientRect();
          const centerX = rect ? rect.left + rect.width / 2 - canvasBox.left : canvasBox.width / 2;
          const centerY = rect ? rect.top + rect.height / 2 - canvasBox.top : canvasBox.height / 2;
          centers[i * 2] = centerX * dpr;
          centers[i * 2 + 1] = (cssHeight - centerY) * dpr;
          sizes[i * 2] = entry.shape.width * entry.scale;
          sizes[i * 2 + 1] = entry.shape.height * entry.scale;
          corners[i * 2] = entry.shape.cornerRadius * entry.scale;
          corners[i * 2 + 1] = entry.shape.roundness;
          glows[i] = entry.glow;
          alphas[i] = entry.alpha ?? 1;
        });

        if (pass === 0) {
          gl.disable(gl.BLEND);
        } else {
          // Every pass after the first composites over the last: outside its
          // own shape it writes alpha 0, which must leave the layer below
          // standing rather than replace it.
          gl.enable(gl.BLEND);
          gl.blendFuncSeparate(
            gl.SRC_ALPHA,
            gl.ONE_MINUS_SRC_ALPHA,
            gl.ONE,
            gl.ONE_MINUS_SRC_ALPHA,
          );
        }

        // Every layer refracts the content itself, never the glass below it:
        // a shape laid on another is a lens on the same page, not a lens
        // looking at a lens, which would show the lower shape's rim inside it.
        // The shader takes at most MAX_PANELS tiles, and a long screen has
        // more, so it is handed the window of tiles around the scroll position
        // and a scroll measured from the first of them. Nothing is lost: only
        // two tiles can ever be on screen at once.
        const window = tileWindow(
          scrollRef.current?.scrollTop ?? 0,
          cssHeight,
          state.panels.length,
        );
        const backdrop: readonly PanelRecord[] = state.panels.slice(
          window.first,
          window.first + MAX_PANELS,
        );

        renderer.render({
          shapes: {
            count: group.length,
            centers,
            sizes,
            corners,
            glows,
            alphas,
            pull: [0, 0],
          },
          params: {
            ...base,
            refThickness: bevel,
            shadowFactor: shadow,
            // A shape losing clarity keeps its silhouette but stops bending
            // and shining, and its body turns milky: frosted glass, on the
            // way to no glass at all.
            refDistance: base.refDistance * clarity,
            refDispersion: base.refDispersion * clarity,
            fresnelFactor: base.fresnelFactor * clarity,
            glareFactor: base.glareFactor * clarity,
            tint: mixTint(FROST, base.tint, clarity),
          },
          panels: backdrop,
          kernel: state.kernel,
          scroll: window.scroll,
          panelHeight: cssHeight,
        });
      });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      for (const strip of state.strips.values()) disposePanels(renderer.gl, strip.panels);
      state.strips = new Map();
      state.panels = [];
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // --- the strips ------------------------------------------------------------
  // Redrawn whenever the content or the surface's size changes. Every key is
  // painted up front so a switch between them costs no upload.
  const paintKeyRef = useRef(paintKey);
  useEffect(() => {
    paintKeyRef.current = paintKey;
  }, [paintKey]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !size.width || !size.height) return;

    const state = stateRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const previous = state.strips;

    const strips = new Map<string, LiquixStrip>();
    for (const key of keys) {
      strips.set(
        key,
        paintPanels(
          renderer.gl,
          (ctx, width) => paint(ctx, width, key),
          size.width,
          size.height,
          dpr,
        ),
      );
    }
    state.strips = strips;

    // The frame loop must never be left holding the textures deleted below:
    // a repaint with the same key showing is not a switch, so the swap effect
    // will not run for it.
    const current = strips.get(paintKeyRef.current);
    state.panels = current ? current.panels : [];
    state.maxScroll = current ? Math.max(0, current.contentHeight - size.height) : 0;

    for (const strip of previous.values()) disposePanels(renderer.gl, strip.panels);
  }, [keys, paint, size.width, size.height]);

  // Switching is a swap: the strip is already on the GPU, so the frame the
  // click lands on is not the frame that uploads a screen, which is what lets
  // a highlight's spring actually be seen travelling.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the size is the signal that the strips were rebuilt above.
  useEffect(() => {
    const state = stateRef.current;
    const strip = state.strips.get(paintKey);
    if (!strip) return;
    state.panels = strip.panels;
    state.maxScroll = Math.max(0, strip.contentHeight - state.size.height);
    state.scroll = 0;
  }, [paintKey, size.height, size.width]);

  // --- scrolling -------------------------------------------------------------
  // The container scrolls natively, so text selection, drag-scrolling, the
  // keyboard and a trackpad all behave the way they do anywhere else, and the
  // shader simply reads scrollTop. A switch starts the new content at the
  // top, the way remounting a scroll container would.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the key changing is the event this reacts to.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [paintKey]);

  return (
    <LiquixStageContext.Provider value={stage}>
      <div
        ref={hostRef}
        data-slot="liquix-surface"
        data-fallback={fallback ? '' : undefined}
        className={cn('relative overflow-hidden', className)}
      >
        {/* The content. Real elements, natively scrolled: the glass is over
            it, not instead of it. */}
        <section
          ref={scrollRef}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: a scroll container is a tab stop so the keyboard can scroll it.
          tabIndex={0}
          data-slot="liquix-surface-scroll"
          className={SCROLLER}
        >
          {children}
        </section>

        {/* Under the glass rather than over it. */}
        <div className="pointer-events-none absolute inset-0 z-[5]">{underlay}</div>

        {/* The glass. Transparent everywhere it is not, and deaf to the
            pointer everywhere, so every click lands on the content. */}
        {!fallback ? (
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 z-10 block h-full w-full"
          />
        ) : null}

        {/* Controls, above the glass. Deaf to the pointer as a layer, since it
            covers the whole surface, so only what it contains takes clicks. */}
        <div className="pointer-events-none absolute inset-0 z-20">{overlay}</div>
      </div>
    </LiquixStageContext.Provider>
  );
}
