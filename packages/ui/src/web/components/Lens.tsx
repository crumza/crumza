import {
  type ComponentProps,
  type CSSProperties,
  type Context,
  createContext,
  type ReactElement,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '../cn';
import { useLensFilter } from '../primitives/use-lens-filter';
import { LensFilterSvg } from './LensFilterSvg';

export interface SceneContextValue {
  readonly ref: RefObject<HTMLDivElement | null>;
  readonly backdrop: string;
}
export const SceneContext: Context<SceneContextValue | null> =
  createContext<SceneContextValue | null>(null);

export interface SceneProps extends ComponentProps<'div'> {
  /** A CSS background-image list: gradients, an image, a pattern. The scene paints it and every Lens inside refracts it. */
  readonly backdrop: string;
}

/** The region a Lens can see. It owns the backdrop, so the glass can bend a copy of it in any engine. */
export function Scene({
  backdrop,
  className,
  style,
  children,
  ref: forwardedRef,
  ...props
}: SceneProps): ReactElement {
  const ref = useRef<HTMLDivElement | null>(null);
  return (
    <SceneContext.Provider value={{ ref, backdrop }}>
      <div
        ref={(node) => {
          ref.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        data-slot="scene"
        className={cn('scene', className)}
        style={{ backgroundImage: backdrop, ...style }}
        {...props}
      >
        {children}
      </div>
    </SceneContext.Provider>
  );
}

export interface LensProps extends ComponentProps<'div'> {
  /** Maximum bend at the edge, in px. */
  readonly strength?: number | undefined;
  /** How far in from the edge the bend reaches, in px. */
  readonly band?: number | undefined;
  /** Chromatic dispersion, 0 to 1. Blue bends furthest, like real glass. */
  readonly dispersion?: number | undefined;
  /** Frost of the interior, in px. The bent rim stays crisp. */
  readonly blur?: number | undefined;
  /** Keep the copy aligned every frame. Turn on while the lens or the backdrop moves. */
  readonly live?: boolean | undefined;
  /** Bends harder while pressed. */
  readonly interactive?: boolean | undefined;
}

/**
 * A pane of glass that refracts what is behind it. WebKit drops SVG filters on
 * backdrop-filter, so the Lens keeps its own copy of the Scene's backdrop, aligned to the
 * pixel: a frosted copy for the interior and a crisp, bent copy confined to the rim.
 * Position changes only move the copies; the map is regenerated when the shape changes.
 */
export function Lens({
  className,
  style,
  strength = 22,
  band = 22,
  dispersion = 0,
  blur = 10,
  live = false,
  interactive = false,
  children,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  ...props
}: LensProps): ReactElement {
  const scene = useContext(SceneContext);
  if (!scene) throw new Error('<Lens> must be inside <Scene>');
  const baseId = useId().replace(/:/g, '');
  const ref = useRef<HTMLDivElement | null>(null);
  const [pressed, setPressed] = useState(false);
  const { id, map } = useLensFilter(ref, baseId, { band });

  const sync = useCallback((): void => {
    const el = ref.current;
    const sc = scene.ref.current;
    if (!el || !sc) return;
    const a = sc.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    el.style.setProperty('--lens-x', `${b.left - a.left}px`);
    el.style.setProperty('--lens-y', `${b.top - a.top}px`);
    el.style.setProperty('--scene-w', `${a.width}px`);
    el.style.setProperty('--scene-h', `${a.height}px`);
  }, [scene.ref]);

  useLayoutEffect(() => {
    const el = ref.current;
    const sc = scene.ref.current;
    if (!el || !sc) return;
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    ro.observe(sc);
    window.addEventListener('scroll', sync, { capture: true, passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', sync, { capture: true });
    };
  }, [scene.ref, sync]);

  useEffect(() => {
    if (!live) return;
    let frame = 0;
    const tick = (): void => {
      sync();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [live, sync]);

  // Negative: the rim samples inward, a convex pane pulling the interior toward its edge.
  const scale = -(pressed ? strength * 1.5 : strength);
  const material = 'saturate(var(--glass-saturate)) brightness(var(--glass-brightness))';

  return (
    <div
      ref={ref}
      data-slot="lens"
      data-pressed={pressed ? '' : undefined}
      className={cn('lens glass', interactive && 'lens-interactive', className)}
      style={{ '--lens-band': `${band}px`, ...style } as CSSProperties}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        if (interactive) setPressed(true);
      }}
      onPointerUp={(e) => {
        onPointerUp?.(e);
        setPressed(false);
      }}
      onPointerCancel={(e) => {
        onPointerCancel?.(e);
        setPressed(false);
      }}
      {...props}
    >
      {map ? <LensFilterSvg id={id} map={map} scale={scale} dispersion={dispersion} /> : null}
      <div
        className="lens-clone"
        aria-hidden="true"
        style={{ backgroundImage: scene.backdrop, filter: `blur(${blur}px) ${material}` }}
      />
      <div
        className="lens-clone lens-rim"
        aria-hidden="true"
        style={{
          backgroundImage: scene.backdrop,
          filter: map ? `url(#${id}) blur(1px) ${material}` : undefined,
        }}
      />
      <div className="lens-tint" aria-hidden="true" />
      <div className="lens-content">{children}</div>
    </div>
  );
}
