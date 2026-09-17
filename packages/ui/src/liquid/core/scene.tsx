import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { type LiquidBackdrop, liquidBackdropKey, liquidBackdropStyle } from './backdrops';
import {
  buildLensMap,
  createLensFilter,
  type LiquidGlassParams,
  liquidInteriorFilter,
  type LiquidOptions,
  peekLensMap,
  prewarmLensMap,
  quantizeMapDim,
  resolveLiquidParams,
  SS,
} from './engine';
import type { LiquidCSS } from './geometry';
import { attachLiquidPress } from './press';
import { type BackdropTrack, createBackdropTrack } from './track';

/* <LiquidScene> + <LiquidSurface>

   One scene owns the background (the thing that gets refracted) and one rAF
   driver. Any number of <LiquidSurface> elements inside it are real, laid-out
   DOM nodes: a button, a menu, a card. Each measures itself against the scene,
   holds a clone of the scene aligned to its own position, and refracts it
   through the shared engine.

   A CSS filter only warps an element's OWN subtree, hence the clone: the real
   scene stays behind, untouched and interactive; the clone is what bends. */

export interface LiquidSceneContextValue {
  readonly paramsRef: RefObject<LiquidGlassParams>;
  readonly sceneRef: RefObject<HTMLDivElement | null>;
  /** changes whenever scene markup changes, so surfaces re-clone it */
  readonly sceneVersion: string;
  readonly register: (tick: (now: number) => void) => () => void;
  /** mark every surface dirty (params changed, scene resized, ...) */
  readonly requestPaint: () => void;
  /** keep repainting for `ms`, used across transitions and animated content */
  readonly pump: (ms: number) => void;
  readonly pumpUntilRef: RefObject<number>;
  readonly dirtyTokenRef: RefObject<number>;
  /** build the map for a size a surface is about to animate to, on idle */
  readonly prewarm: (w: number, h: number, radius: number) => void;
  /** true while the scene paints continuously (see LiquidScene's `animated`) */
  readonly animatedRef: RefObject<boolean>;
}

const LiquidSceneContext = createContext<LiquidSceneContextValue | null>(null);

export function useLiquidScene(): LiquidSceneContextValue {
  const ctx = useContext(LiquidSceneContext);
  if (!ctx) throw new Error('<LiquidSurface> must be rendered inside <LiquidScene>');
  return ctx;
}

export interface LiquidSceneProps extends ComponentProps<'div'>, LiquidOptions {
  /** Image URL for the scene. The scene is what refracts. */
  readonly background?: string | undefined;
  /** A strip of backdrops that scrolls behind the glass, the way the liquix
   *  stage scrolls its panels. Takes the place of `background`. */
  readonly backdrops?: readonly LiquidBackdrop[] | undefined;
  /** Which backdrop is showing. Changing it settles the strip on that panel. */
  readonly backdrop?: number | undefined;
  /** Fires when the reader scrolls the strip onto a different backdrop. */
  readonly onBackdropChange?: ((index: number) => void) | undefined;
  /** Extra scene content (also refracts). Keep it out of the interactive layer. */
  readonly sceneContent?: ReactNode;
  /** Set when the scene paints continuously (video, CSS/JS animation): the
   *  filter id is then re-minted every frame so the moving content refracts
   *  instead of freezing on Safari's cached filter output. */
  readonly animated?: boolean | undefined;
}

/** The stage: a background and one paint driver shared by every glass surface inside it. */
export function LiquidScene({
  frosted,
  blur,
  glint,
  tint,
  tintColor,
  background,
  backdrops,
  backdrop,
  onBackdropChange,
  sceneContent,
  animated = false,
  className,
  style,
  children,
  ...props
}: LiquidSceneProps): ReactElement {
  const params = useMemo(
    () => resolveLiquidParams({ frosted, blur, glint, tint, tintColor }),
    [frosted, blur, glint, tint, tintColor],
  );
  const stageRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const paramsRef = useRef<LiquidGlassParams>(params);
  const dirtyTokenRef = useRef(0);
  const pumpUntilRef = useRef(0);
  const animatedRef = useRef(animated);
  const registry = useRef(new Set<(now: number) => void>());
  const trackRef = useRef<BackdropTrack | null>(null);
  const onIndexRef = useRef(onBackdropChange);
  onIndexRef.current = onBackdropChange;

  /** Panels in the strip. Two is where there is something to scroll. */
  const panelCount = backdrops?.length ?? 0;
  const scrolls = panelCount > 1;

  const requestPaint = useCallback(() => {
    dirtyTokenRef.current++;
  }, []);

  const pump = useCallback((ms: number) => {
    pumpUntilRef.current = Math.max(pumpUntilRef.current, performance.now() + ms);
  }, []);

  const prewarm = useCallback((w: number, h: number, radius: number) => {
    const p = paramsRef.current;
    const qw = quantizeMapDim(w);
    const qh = quantizeMapDim(h);
    const r = Math.min(radius, qw / 2, qh / 2);
    prewarmLensMap(
      (qw + 2 * p.overhang) * SS,
      (qh + 2 * p.overhang) * SS,
      qw * SS,
      qh * SS,
      r * SS,
      p.splay * SS,
      p.curve,
      p.feather * SS,
    );
  }, []);

  const register = useCallback((tick: (now: number) => void) => {
    registry.current.add(tick);
    return () => {
      registry.current.delete(tick);
    };
  }, []);

  // Optics live in a ref so a slider drag never re-runs a surface effect;
  // the loop reads the live values on its next frame.
  useLayoutEffect(() => {
    paramsRef.current = params;
    requestPaint();
  }, [params, requestPaint]);

  // Scene content changed (a new image, a different strip): every clone is stale.
  const sceneVersion = backdrops ? backdrops.map(liquidBackdropKey).join('|') : (background ?? '');

  // The single rAF driver. Surfaces are painted only when something under them
  // changed: an optics or geometry change (dirty token), or an active pump
  // window (transition, animated scene content). Parked over a static scene
  // the lens costs nothing.
  //
  // The strip's physics run here rather than in a loop of their own, so the
  // offset is written before the surfaces repaint: a second driver would leave
  // the glass refracting where the backdrop was a frame ago.
  useEffect(() => {
    let id = 0;
    let last = 0;
    // The components arrive over the first half second (see lq-arrive in
    // core.css): glass is moving, so the scene paints through it.
    pumpUntilRef.current = Math.max(pumpUntilRef.current, performance.now() + 900);
    const loop = (now: number): void => {
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      const moving = trackRef.current?.step(now, dt) ?? false;
      if (moving) dirtyTokenRef.current++;
      // Safari caches filter output, so source content that moves needs the
      // filter id re-minted: a travelling strip is animated scene content.
      animatedRef.current = animated || moving;
      if (animated || moving) {
        pumpUntilRef.current = Math.max(pumpUntilRef.current, now + (animated ? 1000 : 200));
      }
      for (const tick of registry.current) tick(now);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [animated]);

  // The strip, its panel count and the panel a caller asks for, kept apart so
  // that changing the count never tears down the gesture handlers.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !scrolls) return;
    const track = createBackdropTrack(stage, (index) => onIndexRef.current?.(index));
    trackRef.current = track;
    return () => {
      trackRef.current = null;
      track.dispose();
    };
  }, [scrolls]);

  useEffect(() => {
    trackRef.current?.setCount(panelCount);
  }, [panelCount]);

  useEffect(() => {
    if (backdrop !== undefined) trackRef.current?.scrollTo(backdrop);
  }, [backdrop]);

  // Every control in the scene answers a press. One delegated listener, because
  // the state belongs to the pointer rather than to any one component.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    return attachLiquidPress(stage, () => pump(280));
  }, [pump]);

  // Stage resize changes both scene size and every surface's offset within it.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(() => requestPaint());
    ro.observe(stage);
    return () => ro.disconnect();
  }, [requestPaint]);

  // Keyed by what a panel paints rather than by where it sits, with a counter
  // for a strip that shows the same backdrop twice.
  const panels = useMemo(() => {
    const seen = new Map<string, number>();
    return (backdrops ?? []).map((panel) => {
      const base = `${liquidBackdropKey(panel)}:${panel.label ?? ''}`;
      const at = seen.get(base) ?? 0;
      seen.set(base, at + 1);
      return { key: at ? `${base}#${at}` : base, panel };
    });
  }, [backdrops]);

  const ctx = useMemo<LiquidSceneContextValue>(
    () => ({
      paramsRef,
      sceneRef,
      sceneVersion,
      register,
      requestPaint,
      pump,
      pumpUntilRef,
      dirtyTokenRef,
      prewarm,
      animatedRef,
    }),
    [register, requestPaint, pump, prewarm, sceneVersion],
  );

  return (
    <LiquidSceneContext.Provider value={ctx}>
      <div
        {...props}
        ref={stageRef}
        data-slot="liquid-scene"
        data-frosted={frosted ? '' : undefined}
        data-strip={scrolls ? '' : undefined}
        className={className ? `lq-stage ${className}` : 'lq-stage'}
        style={backdrops ? ({ ...style, '--lq-panels': panelCount } as LiquidCSS) : style}
      >
        {/* the refracted subject: real, behind everything, non-interactive */}
        <div ref={sceneRef} className="lq-scene">
          {backdrops ? (
            <div className="lq-strip">
              {panels.map(({ key, panel }) => (
                <div key={key} className="lq-panel" style={liquidBackdropStyle(panel)}>
                  {panel.label ? <span className="lq-panel-label">{panel.label}</span> : null}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="lq-scene-bg"
              style={background ? { backgroundImage: `url(${background})` } : undefined}
            />
          )}
          {sceneContent}
        </div>
        {/* the interactive layer: glass surfaces live here, never in the scene */}
        <div className="lq-layer">{children}</div>
      </div>
    </LiquidSceneContext.Provider>
  );
}

/* LiquidSurface */

type SurfaceTag = 'div' | 'button';

export interface LiquidSurfaceProps extends HTMLAttributes<HTMLElement> {
  readonly as?: SurfaceTag | undefined;
  /** corner radius in px: drives the lens outline, both clips and the map SDF */
  readonly radius?: number | undefined;
  /** Magnification of the refracted image, about the surface's own centre.
   *  1 = a plain window (the default): the clone sits pixel-for-pixel over the
   *  scene, which is what makes a surface read as glass rather than a lens.
   *  Above 1 the surface becomes a loupe. The scale is applied to the CLONE,
   *  never to the filtered element, because WebKit will not filter a subtree it
   *  has transform-scaled. */
  readonly zoom?: number | undefined;
  readonly contentClassName?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly type?: 'button' | 'submit' | undefined;
  readonly style?: LiquidCSS | undefined;
}

interface SurfaceGeometry {
  readonly w: number;
  readonly h: number;
  readonly r: number;
  readonly mapW: number;
  readonly mapH: number;
}

/** One pane of glass: a laid-out element that refracts the scene behind it. */
export function LiquidSurface({
  as = 'div',
  radius = 22,
  zoom = 1,
  className,
  contentClassName,
  children,
  style,
  ...rest
}: LiquidSurfaceProps): ReactElement {
  const scene = useLiquidScene();
  // The optics the markup is born with. Server rendering and the first client
  // render both read these, so the HTML already carries blur, tint and glint and
  // hydration finds nothing to change. After mount the engine writes the live
  // values straight to the DOM; this object never changes, so React never
  // overwrites them on a re-render.
  const initial = useRef(scene.paramsRef.current).current;

  const lensRef = useRef<HTMLElement | null>(null);
  const clipRef = useRef<HTMLDivElement | null>(null);
  const blurRef = useRef<HTMLDivElement | null>(null);
  const refractionRef = useRef<HTMLDivElement | null>(null);
  const tintRef = useRef<HTMLDivElement | null>(null);
  const glintRef = useRef<HTMLDivElement | null>(null);
  const housingRef = useRef<SVGSVGElement | null>(null);
  const cloneRef = useRef<HTMLDivElement | null>(null);

  const localRef = useRef({
    dirty: true,
    token: -1,
    radius,
    zoom,
    // last built map, so an optics scrub can re-use it for a frame or two
    mapUrl: '',
    geomKey: '',
    opticsKey: '',
    lastBuild: 0,
    lastW: 0,
    lastH: 0,
    // true once the refracted clone is painted and the stand-in backdrop blur can go
    primed: false,
  });

  // A radius change alters the clips and the map SDF but not the element's box,
  // so no ResizeObserver fires: mark the surface dirty explicitly.
  useLayoutEffect(() => {
    localRef.current.radius = radius;
    localRef.current.dirty = true;
  }, [radius]);

  // Zoom moves no pixels of the element's own box either (it only re-scales the
  // clone inside it), so it needs the same explicit invalidation.
  useLayoutEffect(() => {
    localRef.current.zoom = zoom;
    localRef.current.dirty = true;
  }, [zoom]);

  // Clone of the scene: rebuilt only when scene markup changes.
  const sceneVersion = scene.sceneVersion;
  useEffect(() => {
    const refraction = refractionRef.current;
    const sceneEl = scene.sceneRef.current;
    if (!refraction || !sceneEl) return;

    let clone = cloneRef.current;
    if (!clone) {
      clone = document.createElement('div');
      clone.className = 'lq-refraction-scene';
      cloneRef.current = clone;
      refraction.appendChild(clone);
    }
    clone.dataset['sceneVersion'] = sceneVersion;
    clone.innerHTML = sceneEl.innerHTML;
    localRef.current.dirty = true;
  }, [scene.sceneRef, sceneVersion]);

  // Geometry and optics application, then the filter.
  useEffect(() => {
    const lens = lensRef.current;
    const clip = clipRef.current;
    const blurWrap = blurRef.current;
    const refraction = refractionRef.current;
    const tint = tintRef.current;
    const glint = glintRef.current;
    const housing = housingRef.current;
    const sceneEl = scene.sceneRef.current;
    if (!lens || !clip || !blurWrap || !refraction || !tint || !glint || !housing || !sceneEl) {
      return;
    }

    const L = localRef.current;
    // one <filter> per surface, mutated in place from here on
    const lensFilter = createLensFilter(housing, refraction);

    /** push geometry and the composited (non-filter) optics layers */
    const place = (): SurfaceGeometry => {
      const lensRect = lens.getBoundingClientRect();
      const sceneRect = sceneEl.getBoundingClientRect();
      const p = scene.paramsRef.current;

      // Integer geometry: fractional sizes would mint a unique map per frame and
      // never hit the cache during a resize or a layout animation.
      const w = Math.max(1, Math.round(lensRect.width));
      const h = Math.max(1, Math.round(lensRect.height));
      const offX = Math.round(lensRect.left - sceneRect.left);
      const offY = Math.round(lensRect.top - sceneRect.top);
      const r = Math.min(L.radius, w / 2, h / 2);

      const pad = p.overhang;
      const mapW = (w + 2 * pad) * SS;
      const mapH = (h + 2 * pad) * SS;

      refraction.style.width = `${mapW}px`;
      refraction.style.height = `${mapH}px`;
      refraction.style.left = `${-pad}px`;
      refraction.style.top = `${-pad}px`;
      refraction.style.transform = 'none'; // Safari will not filter a transform-scaled subtree
      // Clear glass clips the clone at the glass edge here, then blurs it a little.
      // Frosted glass blurs it a lot, and a blur thins out towards the edge of
      // what it samples, so its clone is left whole out to the overhang and the
      // wrapper's clip below decides where the glass ends.
      refraction.style.clipPath = p.frosted ? 'none' : `inset(${pad * SS}px round ${r * SS}px)`;

      // one radius drives lens outline, the composited-layer clip and the map SDF
      lens.style.borderRadius = `${r}px`;
      clip.style.clipPath = `inset(0 round ${r}px)`;

      // align the cloned scene with the real one using plain positioning only
      const clone = cloneRef.current;
      if (clone) {
        clone.style.width = `${Math.round(sceneRect.width)}px`;
        clone.style.height = `${Math.round(sceneRect.height)}px`;
        clone.style.left = `${-(offX - pad)}px`;
        clone.style.top = `${-(offY - pad)}px`;
        // Scaling about the scene point that sits under the surface's centre is
        // what keeps a loupe honest: whatever the lens is parked on stays put
        // and grows, instead of the whole image sliding out from under it.
        clone.style.transform = L.zoom === 1 ? 'none' : `scale(${L.zoom})`;
        clone.style.transformOrigin =
          L.zoom === 1 ? 'top left' : `${offX + w / 2}px ${offY + h / 2}px`;
      }

      // blur is standalone, NOT chained onto url(): Safari over-blurs a chained blur
      blurWrap.style.filter = liquidInteriorFilter(p);
      glint.style.opacity = String(Math.min(1, p.glint / 100));
      tint.style.background = p.tintColor;
      tint.style.opacity = String(p.tint);

      return { w, h, r, mapW, mapH };
    };

    const paint = (now: number): void => {
      const g = place();
      const p = scene.paramsRef.current;
      const pad = p.overhang;

      // Mid-resize (a panel animating open, the stage reflowing) the box changes
      // every frame: build on a quantized size and let feImage stretch it, so an
      // animation costs a couple of cached maps. A settled box is built exactly.
      const resizing = L.lastW !== g.w || L.lastH !== g.h;
      L.lastW = g.w;
      L.lastH = g.h;
      if (resizing) L.dirty = true; // one more pass once the size settles

      const bw = resizing ? quantizeMapDim(g.w) : g.w;
      const bh = resizing ? quantizeMapDim(g.h) : g.h;
      const br = Math.min(L.radius, bw / 2, bh / 2);

      const geomKey = `${bw}:${bh}:${br}`;
      const opticsKey = `${p.splay}:${p.curve}:${p.feather}`;

      if (geomKey !== L.geomKey || opticsKey !== L.opticsKey || !L.mapUrl) {
        const args = [
          (bw + 2 * pad) * SS,
          (bh + 2 * pad) * SS,
          bw * SS,
          bh * SS,
          br * SS,
          p.splay * SS,
          p.curve,
          p.feather * SS,
        ] as const;
        const sameGeometry = geomKey === L.geomKey && !!L.mapUrl;

        // Mid-animation, never block a frame on the SDF loop: take a cached map if
        // one exists, otherwise stretch the map already in hand for this frame. The
        // exact map is built on the frame the size settles, so the resting state is
        // always precise and the tween is always free.
        // Same for a slider scrub, where only the optics move: reuse for a frame.
        const canDefer = !!L.mapUrl && (resizing || (sameGeometry && now - L.lastBuild < 45));
        const cached = canDefer ? peekLensMap(...args) : undefined;

        if (cached) {
          L.mapUrl = cached;
          L.geomKey = geomKey;
          L.opticsKey = opticsKey;
        } else if (canDefer) {
          L.dirty = true; // keep the current map one more frame
        } else {
          const url = buildLensMap(...args);
          if (url) {
            L.mapUrl = url;
            L.geomKey = geomKey;
            L.opticsKey = opticsKey;
            L.lastBuild = now;
          }
        }
      }

      if (!L.mapUrl) return;
      if (!L.primed) {
        // Until now a backdrop blur stood in for the clone (see the markup below).
        // The clone covers the whole lens from here on, so the stand-in is retired.
        L.primed = true;
        blurWrap.style.setProperty('backdrop-filter', 'none');
        blurWrap.style.setProperty('-webkit-backdrop-filter', 'none');
      }
      lensFilter.update({
        mapUrl: L.mapUrl,
        mapW: g.mapW,
        mapH: g.mapH,
        depth: p.depth,
        chroma: p.chroma,
        // Only animated source content needs the id re-minted every frame; a drag
        // or a tween changes filter attributes, which invalidates on its own.
        remint: scene.animatedRef.current,
      });
    };

    const tick = (now: number): void => {
      const globalToken = scene.dirtyTokenRef.current;
      const pumping = now < scene.pumpUntilRef.current;
      if (!L.dirty && globalToken === L.token && !pumping) return;
      L.dirty = false;
      L.token = globalToken;
      paint(now);
    };

    const unregister = scene.register(tick);

    const ro = new ResizeObserver(() => {
      L.dirty = true;
    });
    ro.observe(lens);

    // a surface can also move without resizing (menu opening above it, reflow)
    const onViewportChange = (): void => {
      L.dirty = true;
    };
    window.addEventListener('resize', onViewportChange, { passive: true });
    window.addEventListener('scroll', onViewportChange, { passive: true });

    L.dirty = true;
    paint(performance.now());

    return () => {
      unregister();
      ro.disconnect();
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange);
    };
  }, [scene]);

  const Tag = as as 'div';

  return (
    <Tag
      ref={lensRef as Ref<HTMLDivElement>}
      data-slot="liquid-surface"
      className={className ? `lq-lens ${className}` : 'lq-lens'}
      style={{ borderRadius: radius, ...style }}
      {...(rest as HTMLAttributes<HTMLDivElement>)}
    >
      <div ref={clipRef} className="lq-clip">
        {/* blur wrapper: separate layer so the CSS blur is not chained on url().
            Before the engine paints there is no clone to blur, so the same blur
            is applied to the real scene behind the lens as a backdrop filter. */}
        <div
          ref={blurRef}
          className="lq-blur"
          style={
            liquidInteriorFilter(initial) !== 'none'
              ? {
                  WebkitBackdropFilter: liquidInteriorFilter(initial),
                  backdropFilter: liquidInteriorFilter(initial),
                }
              : undefined
          }
        >
          <div ref={refractionRef} className="lq-refraction" />
        </div>
        <div
          ref={tintRef}
          className="lq-tint"
          style={{ background: initial.tintColor, opacity: initial.tint }}
        />
        <div
          ref={glintRef}
          className="lq-glint"
          style={{ opacity: Math.min(1, initial.glint / 100) }}
        />
      </div>
      <span className={contentClassName ? `lq-content ${contentClassName}` : 'lq-content'}>
        {children}
      </span>
      <svg ref={housingRef} className="lq-housing" aria-hidden="true" />
    </Tag>
  );
}
