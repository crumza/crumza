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
import {
  buildLensMap,
  createLensFilter,
  type LiquidGlassParams,
  type LiquidOptions,
  PAD,
  peekLensMap,
  prewarmLensMap,
  quantizeMapDim,
  resolveLiquidParams,
  SS,
} from './engine';
import type { LiquidCSS } from './geometry';

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
  animatedRef.current = animated;
  const registry = useRef(new Set<(now: number) => void>());

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
      (qw + 2 * PAD) * SS,
      (qh + 2 * PAD) * SS,
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

  // Scene content changed (new background image): every clone is stale.
  const sceneVersion = background ?? '';

  // The single rAF driver. Surfaces are painted only when something under them
  // changed: an optics or geometry change (dirty token), or an active pump
  // window (transition, animated scene content). Parked over a static scene
  // the lens costs nothing.
  useEffect(() => {
    let id = 0;
    const loop = (now: number): void => {
      if (animated) pumpUntilRef.current = now + 1000;
      for (const tick of registry.current) tick(now);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [animated]);

  // Stage resize changes both scene size and every surface's offset within it.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(() => requestPaint());
    ro.observe(stage);
    return () => ro.disconnect();
  }, [requestPaint]);

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
        className={className ? `lq-stage ${className}` : 'lq-stage'}
        style={style}
      >
        {/* the refracted subject: real, behind everything, non-interactive */}
        <div ref={sceneRef} className="lq-scene">
          <div
            className="lq-scene-bg"
            style={background ? { backgroundImage: `url(${background})` } : undefined}
          />
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

      const mapW = (w + 2 * PAD) * SS;
      const mapH = (h + 2 * PAD) * SS;

      refraction.style.width = `${mapW}px`;
      refraction.style.height = `${mapH}px`;
      refraction.style.left = `${-PAD}px`;
      refraction.style.top = `${-PAD}px`;
      refraction.style.transform = 'none'; // Safari will not filter a transform-scaled subtree
      refraction.style.clipPath = `inset(${PAD * SS}px round ${r * SS}px)`;

      // one radius drives lens outline, the composited-layer clip and the map SDF
      lens.style.borderRadius = `${r}px`;
      clip.style.clipPath = `inset(0 round ${r}px)`;

      // align the cloned scene with the real one using plain positioning only
      const clone = cloneRef.current;
      if (clone) {
        clone.style.width = `${Math.round(sceneRect.width)}px`;
        clone.style.height = `${Math.round(sceneRect.height)}px`;
        clone.style.left = `${-(offX - PAD)}px`;
        clone.style.top = `${-(offY - PAD)}px`;
        // Scaling about the scene point that sits under the surface's centre is
        // what keeps a loupe honest: whatever the lens is parked on stays put
        // and grows, instead of the whole image sliding out from under it.
        clone.style.transform = L.zoom === 1 ? 'none' : `scale(${L.zoom})`;
        clone.style.transformOrigin =
          L.zoom === 1 ? 'top left' : `${offX + w / 2}px ${offY + h / 2}px`;
      }

      // blur is standalone, NOT chained onto url(): Safari over-blurs a chained blur
      blurWrap.style.filter = p.blur > 0 ? `blur(${p.blur}px)` : 'none';
      glint.style.opacity = String(Math.min(1, p.glint / 100));
      tint.style.background = p.tintColor;
      tint.style.opacity = String(p.tint);

      return { w, h, r, mapW, mapH };
    };

    const paint = (now: number): void => {
      const g = place();
      const p = scene.paramsRef.current;

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
          (bw + 2 * PAD) * SS,
          (bh + 2 * PAD) * SS,
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
        {/* blur wrapper: separate layer so the CSS blur is not chained on url() */}
        <div ref={blurRef} className="lq-blur">
          <div ref={refractionRef} className="lq-refraction" />
        </div>
        <div ref={tintRef} className="lq-tint" />
        <div ref={glintRef} className="lq-glint" />
      </div>
      <span className={contentClassName ? `lq-content ${contentClassName}` : 'lq-content'}>
        {children}
      </span>
      <svg ref={housingRef} className="lq-housing" aria-hidden="true" />
    </Tag>
  );
}
