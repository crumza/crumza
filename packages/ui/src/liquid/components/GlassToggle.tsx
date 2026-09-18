import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  useEffect,
  useRef,
} from 'react';
import {
  H,
  inner,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  type LiquidCSS,
  LiquidSurface,
  makeClock,
  pill,
  useControllableState,
  useLiquidScene,
  useSceneFrame,
} from '../core';

export type LiquidGlassToggleSize = 'sm' | 'default';

export interface LiquidGlassToggleProps extends LiquidComponentProps {
  /** Controlled state. Leave undefined for uncontrolled. */
  readonly checked?: boolean | undefined;
  readonly defaultChecked?: boolean | undefined;
  readonly onCheckedChange?: ((checked: boolean) => void) | undefined;
  readonly disabled?: boolean | undefined;
  readonly size?: LiquidGlassToggleSize | undefined;
  readonly id?: string | undefined;
  readonly className?: string | undefined;
  /** A switch needs a name: one of these, or a label pointing at `id`. */
  readonly 'aria-label'?: string | undefined;
  readonly 'aria-labelledby'?: string | undefined;
}

interface Size {
  readonly w: number;
  readonly h: number;
  readonly thumb: number;
  /** px between the thumb and the track edge */
  readonly inset: number;
  /** px the thumb widens by while it is pressed, the way a physical toggle gives */
  readonly grow: number;
  /** px it grows in both directions once it has lifted off the track */
  readonly lift: number;
}

const SIZES: Record<LiquidGlassToggleSize, Size> = {
  default: { w: 64, h: 32, thumb: 26, inset: 3, grow: 4, lift: 3 },
  sm: { w: 50, h: 26, thumb: 20, inset: 3, grow: 3, lift: 2 },
};

/** Ms a finger rests on the thumb before it lifts to be dragged. */
const HOLD = 180;
/** Px of sideways travel that lifts the thumb before the hold is up. */
const SLIP = 6;
/** How much of a drag past either end the thumb actually follows. */
const RESIST = 0.3;
/** How far past either end it can be pulled, as a share of the travel. */
const OVER = 0.14;
/** The spring the thumb settles on, in travel units. Stiffness and damping
 *  ratio: about a third of a second to land, a hair of overshoot, no bounce. */
const STIFFNESS = 320;
const DAMPING = 2 * 0.72 * Math.sqrt(STIFFNESS);
/** Travel per second a flick can hand the spring, at most. */
const THROW_MAX = 10;
/** How much of the thumb's speed turns into stretch along its travel. */
const STRETCH = 0.006;
const STRETCH_MAX = 3;
/** The lens' slight magnification of the track under it: enough to read as a
 *  lens rather than a window, not enough to show as a different scene. */
const ZOOM = 1.15;

/** One finger on the thumb, kept out of React state so a move never renders. */
interface Gesture {
  readonly id: number;
  readonly startX: number;
  /** where the thumb was, 0 to 1, when the finger landed */
  readonly from: number;
  /** px the thumb travels from off to on */
  readonly travel: number;
  /** where the thumb is, 0 to 1, fractional and a little past either end */
  x: number;
  /** travel per second, smoothed over the last few moves */
  v: number;
  lastX: number;
  lastAt: number;
  /** the thumb has lifted and is following the finger */
  live: boolean;
  /** the finger has slid: the release then reads the position, not the tap */
  moved: boolean;
  hold: number;
}

/** The thumb on its way to a side, driven by the scene's frame loop. */
interface Spring {
  x: number;
  v: number;
  target: 0 | 1;
  live: boolean;
}

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A switch whose thumb is a lens.
 *
 * At rest it is Apple's toggle: a white thumb on a translucent track, with a
 * shadow for depth and nothing else. The glass is there the whole time, under a
 * white cap, and it is never a filter of its own: the thumb is a LiquidSurface,
 * so it refracts through the same engine, map cache and clone as every other
 * pane in the scene, and the track is another one.
 *
 * Press, and the thumb gives: it widens along the track the way a physical
 * toggle does, and the cap thins. Hold for a beat, or slide at all, and it
 * lifts: the cap goes clear, the thumb grows a little off the track, its shadow
 * drops away beneath it, and what is left is a small curved lens carrying a
 * magnified, rim-bent piece of the scene along under the finger, one to one.
 * Past either end it gets heavy rather than free. Let go and the finger's
 * speed goes into a spring that lands it on the nearer side, with a hair of
 * overshoot and no bounce, while the cap fades back over it as it settles.
 * Once it has settled the lens is idle again and costs nothing.
 *
 * No frame loop of its own. A drag writes one custom property per pointer event
 * straight to the root, the spring runs on the scene's driver, and every size
 * change is a layout change rather than a transform scale, so the engine's clone
 * stays pixel-aligned with the scene under it. The thumb's box only ever moves
 * between a handful of sizes, so it costs a handful of cached maps and, while
 * moving, only repositions the one it has.
 */
export function LiquidGlassToggle({
  radius = LIQUID_RADIUS,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  size = 'default',
  id,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: LiquidGlassToggleProps): ReactElement {
  const { pump } = useLiquidScene();
  const [on, set] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });
  const rootRef = useRef<HTMLButtonElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const spring = useRef<Spring>({ x: on ? 1 : 0, v: 0, target: on ? 1 : 0, live: false });
  const clock = useRef(makeClock());
  const onRef = useRef(on);
  onRef.current = on;

  const dims = SIZES[size];
  const r = pill(H.toggle, radius);
  // Not capped by the thumb's own size here: the engine and the stylesheet both
  // cap a radius at half the box, and the box grows when the thumb lifts, so a
  // round thumb stays round rather than picking up flat sides on the way up.
  const thumbR = inner(r, dims.inset);

  useEffect(
    () => () => {
      if (gesture.current) window.clearTimeout(gesture.current.hold);
    },
    [],
  );

  /** Send the thumb to a side, carrying whatever speed it already has. */
  const throwTo = (target: 0 | 1, from: number, v: number): void => {
    const root = rootRef.current;
    const s = spring.current;
    s.target = target;
    if (!root) return;
    if (reducedMotion()) {
      // No travel: the thumb is simply on the other side. It holds --x for one
      // frame, until React has written the new side to --on, so it never shows
      // the old side in between.
      s.x = target;
      s.v = 0;
      s.live = false;
      root.style.setProperty('--x', String(target));
      root.style.removeProperty('--lqc-stretch');
      requestAnimationFrame(() => {
        if (!s.live && !gesture.current?.live) root.style.removeProperty('--x');
      });
      pump(120);
      return;
    }
    s.x = from;
    s.v = Math.max(-THROW_MAX, Math.min(THROW_MAX, v));
    if (!s.live) clock.current = makeClock(); // a fresh clock: the loop has been idle
    s.live = true;
    root.style.setProperty('--x', from.toFixed(4));
    pump(600);
  };

  // A change of value that came from outside a gesture (the keyboard, a click,
  // a controlled parent) travels on the same spring as a release does. The
  // throw is read through a ref so the effect answers the value alone.
  const throwRef = useRef(throwTo);
  throwRef.current = throwTo;
  useEffect(() => {
    const s = spring.current;
    const want: 0 | 1 = on ? 1 : 0;
    if (s.target === want) return;
    if (gesture.current?.live) {
      s.target = want; // the finger has the thumb; the release will place it
      return;
    }
    throwRef.current(want, s.live ? s.x : s.target, s.live ? s.v : 0);
  }, [on]);

  useSceneFrame((now) => {
    const s = spring.current;
    const root = rootRef.current;
    if (!s.live || !root) return;
    const dt = clock.current(now) / 1000;
    s.v += (-STIFFNESS * (s.x - s.target) - DAMPING * s.v) * dt;
    s.x += s.v * dt;
    if (Math.abs(s.x - s.target) < 0.002 && Math.abs(s.v) < 0.02) {
      s.x = s.target;
      s.v = 0;
      s.live = false;
      root.style.removeProperty('--x');
      root.style.removeProperty('--lqc-stretch');
      pump(160); // the cap is still fading in over the lens
      // A controlled parent that kept its value: the thumb goes back to it.
      const want: 0 | 1 = onRef.current ? 1 : 0;
      if (want !== s.target) throwTo(want, s.x, 0);
      return;
    }
    root.style.setProperty('--x', s.x.toFixed(4));
    // Stretch along the travel in proportion to speed, so the thumb reads as a
    // drop of something rather than a disc on a rail. Speed is in travel units.
    const stretch = Math.min(STRETCH_MAX, Math.abs(s.v) * gestureTravel(dims) * STRETCH);
    root.style.setProperty('--lqc-stretch', `${stretch.toFixed(2)}px`);
    pump(48);
  });

  /** The thumb comes off the track and follows the finger from here on. */
  const lift = (): void => {
    const g = gesture.current;
    const root = rootRef.current;
    if (!g || g.live || !root) return;
    g.live = true;
    window.clearTimeout(g.hold);
    spring.current.live = false; // the finger has it now
    root.dataset['lift'] = '';
    root.style.setProperty('--x', g.x.toFixed(4));
    pump(400);
  };

  /** Carry the thumb to the finger. Past either end it gets heavy rather than free. */
  const follow = (clientX: number, at: number): void => {
    const g = gesture.current;
    const root = rootRef.current;
    if (!g?.live || !root) return;
    let x = g.from + (clientX - g.startX) / g.travel;
    if (x < 0) x = Math.max(-OVER, x * RESIST);
    else if (x > 1) x = Math.min(1 + OVER, 1 + (x - 1) * RESIST);
    const dt = Math.max(1, at - g.lastAt) / 1000;
    const v = (x - g.lastX) / dt;
    g.v = g.v * 0.5 + v * 0.5;
    g.lastX = x;
    g.lastAt = at;
    g.x = x;
    root.style.setProperty('--x', x.toFixed(4));
    if (!reducedMotion()) {
      const stretch = Math.min(STRETCH_MAX, Math.abs(g.v) * g.travel * STRETCH);
      root.style.setProperty('--lqc-stretch', `${stretch.toFixed(2)}px`);
    }
    pump(160);
  };

  /** Let go: a tap flips it; a drag lands on the nearer side. */
  const settle = (): void => {
    const g = gesture.current;
    const root = rootRef.current;
    if (!g) return;
    gesture.current = null;
    window.clearTimeout(g.hold);
    const was = onRef.current;
    if (!g.live) {
      set(!was); // a tap; the spring follows from the value change
      return;
    }
    delete root?.dataset['lift'];
    // Lifted by a hold but never slid: still a tap. Slid: the position decides.
    const target: 0 | 1 = g.moved ? (g.x >= 0.5 ? 1 : 0) : was ? 0 : 1;
    // Speed that has gone quiet is not a throw: only a move in the last beat counts.
    const v = performance.now() - g.lastAt < 80 ? g.v : 0;
    throwTo(target, g.x, v);
    if ((target === 1) !== was) set(target === 1);
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
    if (disabled) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (gesture.current) return; // a second finger changes nothing
    const s = spring.current;
    const from = s.live ? s.x : s.target;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    gesture.current = {
      id: event.pointerId,
      startX: event.clientX,
      from,
      travel: gestureTravel(dims),
      x: from,
      v: 0,
      lastX: from,
      lastAt: performance.now(),
      live: false,
      moved: false,
      hold: window.setTimeout(lift, HOLD),
    };
    pump(240); // the thumb widens under the press
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>): void => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    if (Math.abs(event.clientX - g.startX) > SLIP) {
      g.moved = true;
      lift();
    }
    follow(event.clientX, performance.now());
  };

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>): void => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    settle();
  };

  // The pointer has already decided by the time a click lands. A click with no
  // detail came from the keyboard (Space, Enter), and that one flips it.
  const onClick = (event: MouseEvent<HTMLButtonElement>): void => {
    if (event.detail === 0 && !disabled) set(!onRef.current);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (disabled) return;
    const want =
      event.key === 'ArrowRight' || event.key === 'End'
        ? true
        : event.key === 'ArrowLeft' || event.key === 'Home'
          ? false
          : null;
    if (want === null) return;
    event.preventDefault();
    if (want !== onRef.current) set(want);
  };

  return (
    <button
      ref={rootRef}
      type="button"
      role="switch"
      id={id}
      aria-checked={on}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      disabled={disabled}
      data-slot="liquid-glass-toggle"
      data-size={size}
      className={className ? `lqc-toggle ${className}` : 'lqc-toggle'}
      style={
        {
          '--on': on ? 1 : 0,
          '--lqc-toggle-w': `${dims.w}px`,
          '--lqc-toggle-h': `${dims.h}px`,
          '--lqc-toggle-thumb': `${dims.thumb}px`,
          '--lqc-toggle-inset': `${dims.inset}px`,
          '--lqc-toggle-grow': `${dims.grow}px`,
          '--lqc-toggle-lift': `${dims.lift}px`,
          '--lqc-toggle-r': `${Math.min(r, dims.h / 2)}px`,
        } as LiquidCSS
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {/* The track: a pane of the scene's glass, with the on-colour laid over
          it in step with the thumb's position. */}
      <LiquidSurface
        radius={r}
        className="lqc-toggle-track"
        contentClassName="lqc-toggle-track-content"
        aria-hidden="true"
      >
        <span className="lqc-toggle-fill" />
      </LiquidSurface>
      {/* The thumb: a second pane, a slight loupe, under a white cap. The cap is
          what makes it a toggle at rest; lifting it is what makes it a lens. The
          box, the travel and the shadow belong to a plain wrapper, so the lens
          inside it is only ever the material. Under the cap the lens carries the
          track's on-colour, so lifted over the on side it reads as glass over
          green rather than a hole in it, and a sheen where the light lands. */}
      <span
        className="lqc-toggle-thumb"
        aria-hidden="true"
        style={{ '--lqc-toggle-thumb-r': `${thumbR}px` } as LiquidCSS}
      >
        <LiquidSurface
          radius={thumbR}
          zoom={ZOOM}
          className="lqc-toggle-lens"
          contentClassName="lqc-toggle-lens-content"
        >
          <span className="lqc-toggle-glaze" />
          <span className="lqc-toggle-sheen" />
          <span className="lqc-toggle-cap" />
        </LiquidSurface>
      </span>
    </button>
  );
}

/** Px the thumb travels from off to on, at rest. */
const gestureTravel = (d: Size): number => d.w - 2 * d.inset - d.thumb;
