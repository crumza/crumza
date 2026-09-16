import {
  type CSSProperties,
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
  type LiquixPanel,
  type LiquixParams,
  PANEL_KINDS,
  defaultLiquixPanels,
  defaultLiquixParams,
} from '../liquix/params';
import {
  createGlassRenderer,
  gaussianKernel,
  type GaussianKernel,
  type GlassRenderer,
  type PanelRecord,
  loadPanelTexture,
} from '../liquix/renderer';
import { MAX_SHAPES } from '../liquix/shader-lib';
import { MAX_PANELS } from '../liquix/shaders';
import { LiquixStageContext, type LiquixShapeEntry, type LiquixStageValue } from '../liquix/stage';

/** A device-sized viewport for the glass, instead of the whole window. */
export interface LiquixFrame {
  readonly width: number;
  readonly height: number;
  readonly radius?: number | undefined;
}

export interface LiquixStageProps {
  readonly children?: ReactNode | undefined;
  /** The scrolling backdrop. One viewport per panel. */
  readonly panels?: readonly LiquixPanel[] | undefined;
  /** Overrides on top of the default effect parameters. */
  readonly params?: Partial<LiquixParams> | undefined;
  /** Without it the stage fills the window. */
  readonly frame?: LiquixFrame | undefined;
  readonly className?: string | undefined;
}

interface FittedView {
  readonly width: number;
  readonly height: number;
  readonly left: number;
  readonly top: number;
  readonly radius: number;
  readonly framed: boolean;
}

/**
 * Where the glass lives on screen. Without a frame the stage fills the window;
 * with one it becomes a device-sized viewport centred in the page, scaled down
 * to fit but never up past its nominal size.
 */
function fitFrame(
  frame: LiquixFrame | undefined,
  viewportWidth: number,
  viewportHeight: number,
  margin = 56,
): FittedView {
  if (!frame) {
    return {
      width: viewportWidth,
      height: viewportHeight,
      left: 0,
      top: 0,
      radius: 0,
      framed: false,
    };
  }
  const scale = Math.min(
    (viewportHeight - margin) / frame.height,
    (viewportWidth - margin) / frame.width,
    1,
  );
  const width = Math.round(frame.width * scale);
  const height = Math.round(frame.height * scale);
  return {
    width,
    height,
    left: Math.round((viewportWidth - width) / 2),
    top: Math.round((viewportHeight - height) / 2),
    radius: Math.round((frame.radius ?? 0) * scale),
    framed: true,
  };
}

const EMPTY_VIEW: FittedView = {
  width: 0,
  height: 0,
  left: 0,
  top: 0,
  radius: 0,
  framed: false,
};

function measure(frame: LiquixFrame | undefined): FittedView {
  if (typeof window === 'undefined') return EMPTY_VIEW;
  return fitFrame(frame, window.innerWidth, window.innerHeight);
}

interface PullState {
  inputX: number;
  inputY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lastInput: number;
}

interface LoopState {
  params: LiquixParams;
  panels: PanelRecord[];
  kernel: GaussianKernel;
  pull: PullState;
  shapeArrays: {
    centers: Float32Array;
    sizes: Float32Array;
    corners: Float32Array;
    glows: Float32Array;
  };
  size: { width: number; height: number; dpr: number; blurScale: number };
  accumulator: number;
  lastTime: number;
}

/**
 * Owns the glass: the WebGL2 pipeline, the scrolling backdrop, the overscroll
 * physics and the row that holds the shapes.
 *
 * The stage owns the backdrop because refraction, dispersion and the blurred
 * edge mask all re-sample the pixels behind the glass at an offset, and per
 * colour channel, which CSS backdrop-filter cannot do. So the panels are drawn
 * into the same pipeline and the glass samples them as textures. This is not
 * refraction of arbitrary live DOM: a shape only bends the stage's own panels.
 * Every LiquixCapsule and LiquixCircle inside registers its box, and all of
 * them are evaluated as one distance field in a single pass.
 *
 * Effects, and where each one lives:
 *   Refraction            Snell's law over a bevel, refractionEdgeFactor
 *   Dispersion            per-channel index offsets, dispersedBackdrop
 *   Fresnel reflection    rim falloff lifted in LCH, rimFalloff
 *   Superellipse shapes   corners from |x|^n + |y|^n = r^n, superellipseRectSDF
 *   Glare                 normal-angle highlight with glareAngle
 *   Gaussian blur mask    separable blur passes, mixed in by edge depth
 *   Anti-aliasing         smoothstep across the zero level of the SDF
 *   Overscroll pull       squash and stretch on a spring, pullWarp
 *   Backdrop adaptation   per-pixel dimming over light panels, adaptToBackdrop
 */
export function LiquixStage({
  children,
  panels = defaultLiquixPanels,
  params: paramOverrides,
  frame,
  className,
}: LiquixStageProps): ReactElement {
  const params = useMemo(() => ({ ...defaultLiquixParams, ...paramOverrides }), [paramOverrides]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<GlassRenderer | null>(null);
  const shapesRef = useRef<readonly LiquixShapeEntry[]>([]);
  const [fallback, setFallback] = useState(false);
  const [view, setView] = useState<FittedView>(() => measure(frame));

  // The strip's layout needs the fitted size, so it lives in state; the render
  // loop recomputes the same thing from the same helper, so the two cannot
  // disagree mid-resize.
  useEffect(() => {
    const onResize = () => setView(measure(frame));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [frame]);

  // Everything the render loop reads, kept off the React render path.
  const frameRef = useRef<LoopState>({
    params,
    panels: [],
    kernel: gaussianKernel(params.blurRadius),
    pull: { inputX: 0, inputY: 0, x: 0, y: 0, vx: 0, vy: 0, lastInput: 0 },
    shapeArrays: {
      centers: new Float32Array(MAX_SHAPES * 2),
      sizes: new Float32Array(MAX_SHAPES * 2),
      corners: new Float32Array(MAX_SHAPES * 2),
      glows: new Float32Array(MAX_SHAPES),
    },
    size: { width: 0, height: 0, dpr: 0, blurScale: 0 },
    accumulator: 0,
    lastTime: 0,
  });

  const kernel = useMemo(() => gaussianKernel(params.blurRadius), [params.blurRadius]);
  const panelsRef = useRef<readonly LiquixPanel[]>(panels);
  const framePropRef = useRef<LiquixFrame | undefined>(frame);

  // Hand the current props to the render loop, which reads them off a ref
  // rather than re-subscribing every time a value moves.
  useEffect(() => {
    const state = frameRef.current;
    state.params = params;
    state.kernel = kernel;
    panelsRef.current = panels;
    framePropRef.current = frame;
  });

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

  const panelKey = panels
    .slice(0, MAX_PANELS)
    .map((panel) => `${panel.kind ?? PANEL_KINDS.checker}:${panel.src ?? ''}`)
    .join('|');

  // --- renderer lifecycle and frame loop -------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = createGlassRenderer(canvas);
    if (!renderer) {
      setFallback(true);
      return;
    }
    rendererRef.current = renderer;

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setFallback(true);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    const state = frameRef.current;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    // No browser rubber band while the stage is up: overscroll is what the
    // glass stretches by, so the page must not absorb it first.
    const root = document.documentElement;
    const previousOverscroll = root.style.overscrollBehaviorY;
    root.style.overscrollBehaviorY = 'none';

    // Scroll the page has nowhere left to absorb. Past either end of an axis
    // the wheel and touch deltas are banked here instead, and the frame loop
    // turns the running total into the pull vector the shader warps by.
    //
    // Horizontally the document usually does not scroll, so every sideways
    // delta counts as overscroll: a two-finger swipe stretches the row along
    // that axis instead.
    const bankOverscroll = (deltaX: number, deltaY: number) => {
      if (calm.matches) return;
      const root = document.documentElement;
      const limit = state.params.pullSaturation * 3;
      const clamp = (value: number) => Math.max(-limit, Math.min(limit, value));
      const { pull } = state;
      pull.lastInput = performance.now();

      const maxY = root.scrollHeight - window.innerHeight;
      if ((window.scrollY >= maxY - 1 && deltaY > 0) || (window.scrollY <= 0 && deltaY < 0)) {
        pull.inputY = clamp(pull.inputY + deltaY);
      }

      const maxX = root.scrollWidth - window.innerWidth;
      if ((window.scrollX >= maxX - 1 && deltaX > 0) || (window.scrollX <= 0 && deltaX < 0)) {
        pull.inputX = clamp(pull.inputX + deltaX);
      }
    };
    const onWheel = (event: WheelEvent) => bankOverscroll(event.deltaX, event.deltaY);

    let lastTouch: { x: number; y: number } | null = null;
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      lastTouch = touch ? { x: touch.clientX, y: touch.clientY } : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      if (lastTouch) {
        bankOverscroll((lastTouch.x - touch.clientX) * 1.6, (lastTouch.y - touch.clientY) * 1.6);
      }
      lastTouch = { x: touch.clientX, y: touch.clientY };
    };
    const onTouchEnd = () => {
      lastTouch = null;
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    let raf = 0;
    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);

      const elapsed = state.lastTime ? (time - state.lastTime) / 1000 : 1 / 60;
      state.lastTime = time;
      const current = state.params;

      // Keep the drawing buffer in step with the frame and the device.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const fitted = fitFrame(framePropRef.current, window.innerWidth, window.innerHeight);
      const cssWidth = fitted.width;
      const cssHeight = fitted.height;
      const { size } = state;
      if (
        size.width !== cssWidth ||
        size.height !== cssHeight ||
        size.dpr !== dpr ||
        size.blurScale !== current.blurScale
      ) {
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
        renderer.resize(canvas.width, canvas.height, dpr, current.blurScale);
        state.size = { width: cssWidth, height: cssHeight, dpr, blurScale: current.blurScale };
      }

      const entries = shapesRef.current;
      const count = Math.min(entries.length, MAX_SHAPES);
      const { pull } = state;
      const reduced = calm.matches;

      // Springs advance on a fixed timestep rather than on the frame delta.
      // Clamping a variable delta (the usual fix for stability) quietly runs
      // the motion in slow motion on a slow GPU; substepping keeps it at
      // wall-clock speed and stable, and the accumulator cap bounds the
      // catch-up work after a stall or a backgrounded tab.
      const STEP = 1 / 120;
      state.accumulator = Math.min(0.25, state.accumulator + elapsed);
      while (state.accumulator >= STEP) {
        state.accumulator -= STEP;

        // Overscroll pull, one spring per axis. While the gesture is live the
        // banked scroll decays towards whatever the current scroll rate
        // sustains; when it ends the target drops to zero and the glass
        // springs past its resting shape, squashes the other way, and wobbles
        // in before settling.
        //
        // pullBounce is a damping ratio in disguise: 0.9 settles flat, 0.12
        // rings for about two seconds. Stiffness is fixed so that changing the
        // bounce does not also change how fast it responds.
        const stiffness = 320;
        const damping =
          2 * Math.sqrt(stiffness) * (0.9 - 0.78 * Math.min(1, Math.max(0, current.pullBounce)));
        const decay = Math.exp(-STEP * 10);
        const saturation = Math.max(1, current.pullSaturation);
        pull.inputX *= decay;
        pull.inputY *= decay;
        if (Math.abs(pull.inputX) < 0.5) pull.inputX = 0;
        if (Math.abs(pull.inputY) < 0.5) pull.inputY = 0;

        const targetX = Math.tanh(pull.inputX / saturation);
        const targetY = Math.tanh(pull.inputY / saturation);
        pull.vx += (-stiffness * (pull.x - targetX) - damping * pull.vx) * STEP;
        pull.vy += (-stiffness * (pull.y - targetY) - damping * pull.vy) * STEP;
        pull.x += pull.vx * STEP;
        pull.y += pull.vy * STEP;
        if (Math.abs(pull.x) < 0.0004 && Math.abs(pull.vx) < 0.002) {
          pull.x = 0;
          pull.vx = 0;
        }
        if (Math.abs(pull.y) < 0.0004 && Math.abs(pull.vy) < 0.002) {
          pull.y = 0;
          pull.vy = 0;
        }

        // Reduced motion keeps the interaction legible but takes the travel
        // out of it: the shape arrives at its pressed or hovered size rather
        // than easing there.
        for (let i = 0; i < count; i++) {
          const entry = entries[i];
          if (!entry) continue;
          const ease = reduced ? 1 : Math.min(1, STEP * 14);
          entry.scale += (entry.scaleTarget - entry.scale) * ease;
          entry.glow += (entry.glowTarget - entry.glow) * ease;
        }
      }

      // A gap in the deltas means the gesture is over. Dropping the banked
      // scroll at once rather than letting it fade is what makes the release
      // bounce: the springs are still moving when their target vanishes, and
      // that momentum carries them past the resting shape.
      //
      // This runs after the substeps, not before, so the frame the deltas
      // arrived on always gets to integrate them. Checking first would erase a
      // whole gesture that happened to land between two frames, which on a
      // slow device means a flick does nothing at all.
      if (time - pull.lastInput > 90) {
        pull.inputX = 0;
        pull.inputY = 0;
      }

      // The strip is scrolled by transform rather than by page flow, so the
      // frame can clip it. Written before any box is read, so the rects below
      // and the canvas agree on where things are this frame rather than
      // trailing it by one.
      const scroll = window.scrollY;
      if (stripRef.current) {
        stripRef.current.style.transform = `translate3d(0, ${-scroll}px, 0)`;
      }

      // CSS px the row drags in the gesture direction, x right and y down.
      const shiftX = current.pullShift * pull.x;
      const shiftY = current.pullShift * pull.y;
      const { centers, sizes, corners, glows } = state.shapeArrays;

      // Read every box before touching any transform: reading a rect after a
      // style write in the same frame would force an extra layout pass.
      for (let i = 0; i < count; i++) {
        const entry = entries[i];
        if (!entry) continue;
        // Shape boxes are in viewport coordinates; the canvas may be a frame
        // sitting somewhere inside it, so shift into canvas space.
        const rect = entry.el?.getBoundingClientRect();
        const centerCssX = (rect ? rect.left + rect.width / 2 : cssWidth / 2) - fitted.left;
        const centerCssY = (rect ? rect.top + rect.height / 2 : cssHeight / 2) - fitted.top;
        centers[i * 2] = (centerCssX + shiftX) * dpr;
        centers[i * 2 + 1] = (cssHeight - centerCssY - shiftY) * dpr;

        sizes[i * 2] = entry.shape.width * entry.scale;
        sizes[i * 2 + 1] = entry.shape.height * entry.scale;
        // Scaled with the box so a hovered shape keeps its proportions; the
        // shader clamps it to half the shorter side.
        corners[i * 2] = entry.shape.cornerRadius * entry.scale;
        corners[i * 2 + 1] = entry.shape.roundness;
        glows[i] = entry.glow;
      }

      // Drag each label along with the shape it sits in.
      const labelTransform = `translate(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px)`;
      for (let i = 0; i < count; i++) {
        const label = entries[i]?.label;
        if (label) label.style.transform = labelTransform;
      }

      renderer.render({
        shapes: { count, centers, sizes, corners, glows, pull: [pull.x, -pull.y] }, // y-up
        params: current,
        panels: state.panels,
        kernel: state.kernel,
        scroll,
        panelHeight: cssHeight,
      });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      root.style.overscrollBehaviorY = previousOverscroll;
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // --- panel textures --------------------------------------------------------
  // The panel list is read off a ref: panelKey is what says it changed, and fallback
  // is what says whether there is a renderer to upload to.
  // biome-ignore lint/correctness/useExhaustiveDependencies: both deps are the signal, not a read value.
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const list = panelsRef.current.slice(0, MAX_PANELS);
    const records: PanelRecord[] = list.map((panel) => ({
      kind: panel.kind ?? PANEL_KINDS.checker,
      ready: false,
      texture: null,
      aspect: 1,
    }));
    frameRef.current.panels = records;

    let cancelled = false;
    list.forEach((panel, index) => {
      const record = records[index];
      if (!record || record.kind !== PANEL_KINDS.image || !panel.src) return;
      loadPanelTexture(renderer.gl, panel.src).then((result) => {
        if (!cancelled) Object.assign(record, result);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [panelKey, fallback]);

  // Keyed by what the panel is rather than by where it sits, with a counter for
  // the case of two identical panels in one strip.
  const panelList = useMemo(() => {
    const seen = new Map<string, number>();
    return panels.slice(0, MAX_PANELS).map((panel) => {
      const base = `${panel.kind ?? PANEL_KINDS.checker}:${panel.src ?? ''}:${panel.label ?? ''}`;
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      return { key: count ? `${base}#${count}` : base, panel };
    });
  }, [panels]);
  const viewportStyle: CSSProperties = {
    left: `${view.left}px`,
    top: `${view.top}px`,
    width: `${view.width}px`,
    height: `${view.height}px`,
    ...(view.radius ? { borderRadius: `${view.radius}px` } : null),
  };

  return (
    <LiquixStageContext.Provider value={stage}>
      {/* Gives the document its scroll range: one frame per panel after the
          first. Nothing is drawn here, the viewport below reads window.scrollY. */}
      <div
        aria-hidden="true"
        data-slot="liquix-scroll"
        style={{ height: `calc(100vh + ${(panelList.length - 1) * view.height}px)` }}
      />

      {/* The viewport. The full window by default; a device-sized window when
          the stage is framed, in which case it clips everything inside it. */}
      <div
        data-slot="liquix-stage"
        data-framed={view.framed ? '' : undefined}
        className={cn('liquix-stage', className)}
        style={viewportStyle}
      >
        {!fallback ? <canvas ref={canvasRef} className="liquix-stage__canvas" /> : null}

        {/* One viewport per panel. A panel's content rides along with it as it
            scrolls: the shader reads each shape's live box, so the glass
            follows without the shape having to be pinned. */}
        <div ref={stripRef} className="liquix-stage__strip">
          {panelList.map(({ key, panel }) => (
            <div
              key={key}
              className="liquix-stage__panel"
              data-kind={fallback ? (panel.kind ?? PANEL_KINDS.checker) : undefined}
              style={{
                width: `${view.width}px`,
                height: `${view.height}px`,
                ...(fallback && panel.kind === PANEL_KINDS.image && panel.src
                  ? { backgroundImage: `url(${panel.src})` }
                  : null),
              }}
            >
              {panel.content ?? null}
              {panel.label ? (
                <span aria-hidden="true" className="liquix-stage__label">
                  {panel.label}
                </span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Children given straight to the stage hold the middle of the frame
            while the panels scroll behind them. */}
        {children ? (
          <div className="liquix-stage__center">
            <div className="liquix-stage__row" style={{ gap: `${params.rowGap}px` }}>
              {children}
            </div>
          </div>
        ) : null}
      </div>
    </LiquixStageContext.Provider>
  );
}
