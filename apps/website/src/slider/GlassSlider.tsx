import { LIQUID_RADIUS, LiquidSurface, pill, useLiquidScene } from '@crumza/ui/liquid';
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  useEffect,
  useRef,
  useState,
} from 'react';

/* A slider whose thumb lifts into a lens.

   At rest it is the system slider: a thick rail, filled to a white pill of a
   thumb that sits on it with a soft shadow. The glass is there the whole time,
   under the white: the thumb is a LiquidSurface, so it refracts through the
   scene's engine, its map cache and its clone of the scene like every other
   pane, and it carries a copy of the rail inside its refraction layer so the
   rail it sits on bends through it along with the scene behind.

   Press it and it lifts. The white clears in a beat, the thumb grows to twice
   its width and half again its height about its own centre, its shadow drops
   away beneath it and the rail is there, bent hard at the rim and a little
   magnified through the middle, with one bright line along the lower edge. It
   follows the finger one to one, widening a little more the faster it is
   carried, the way a drop would. A press on the rail sends the value there at
   once and the lens closes on the finger over a few frames rather than
   jumping. Let go and it settles back onto the value's step, shrinking as the
   white comes back over the glass.

   Geometry is the reference render's, at a resting thumb 34px tall: the rail
   is 0.35 of that, the thumb 1.55 wide, the lens 3.06 by 1.41. Timing is the
   iOS slider's: the lift is near instant and the release is quick.

   No frame loop of its own. A drag writes one custom property per pointer
   event straight to the root and the rail's fill, the thumb and the copy of
   the rail inside it all read their position from it. The only per-frame work
   is on the scene's own driver: the catch-up after a rail press, and the
   stretch decaying once the finger slows. Every size change is a layout
   change, never a transform scale, so the clone stays pixel-aligned with the
   scene, and the thumb only ever moves between a few sizes, so the whole
   gesture costs a few cached maps. */

/** The thumb at rest: a pill. */
const THUMB_W = 52;
const THUMB_H = 34;
/** The thumb lifted: the lens. */
const LENS_W = 104;
const LENS_H = 48;
/** Px the lens widens by at speed, at most, and px of that per px/s of travel. */
const STRETCH_MAX = 22;
const STRETCH = 0.024;
/** Ms for the stretch to fall by two thirds once the finger slows. */
const STRETCH_DECAY = 110;
/** The rail under the thumb. */
const RAIL_H = 12;
/** The control's box: a full touch target, with the rail and the thumb centred in it. */
const HIT_H = 60;
/** Ms time constant of the catch-up after a press on the rail. */
const TAU = 70;
/** The lens' magnification of what is under it. */
const ZOOM = 1.22;

type Vars = CSSProperties & Record<`--${string}`, string | number>;

export interface GlassSliderProps {
  /** Corner radius in px, 0 to 40. The lens is a pill at the top of the range. */
  readonly radius?: number | undefined;
  /** Controlled value. Leave undefined for uncontrolled. */
  readonly value?: number | undefined;
  readonly defaultValue?: number | undefined;
  /** Fires on every step the value moves: along a drag, and on a key. */
  readonly onValueChange?: ((value: number) => void) | undefined;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly step?: number | undefined;
  readonly disabled?: boolean | undefined;
  readonly id?: string | undefined;
  readonly className?: string | undefined;
  /** A slider needs a name from one of these, or a label pointing at `id`. */
  readonly 'aria-label'?: string | undefined;
  readonly 'aria-labelledby'?: string | undefined;
  /** What the value means, when the number alone does not say. */
  readonly 'aria-valuetext'?: string | undefined;
}

/** One finger on the control, kept out of React state so a move never renders. */
interface Gesture {
  readonly id: number;
  /** px, the control's left edge and the travel the thumb's centre has along it */
  readonly left: number;
  readonly travel: number;
  /** px from the finger to the thumb's centre when it was picked up; 0 for a press on the rail */
  readonly offset: number;
  /** where the thumb is, 0 to 1 */
  x: number;
  /** where the finger says it should be */
  target: number;
  /** what is left of the distance a rail press asked it to cover */
  gap: number;
  /** the last value reported, so a move that stays on a step reports nothing */
  last: number;
  /** px/s along the rail, smoothed over the last few moves */
  velocity: number;
  lastX: number;
  lastT: number;
  /** px the lens is currently widened by */
  stretch: number;
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** Decimal places a step carries, so tenths do not come out as 0.30000000000000004. */
const decimals = (step: number): number => {
  const s = String(step);
  const dot = s.indexOf('.');
  return dot < 0 ? 0 : s.length - dot - 1;
};

/** The nearest step to a value, inside the range. */
const snap = (value: number, min: number, max: number, step: number): number => {
  const size = step > 0 ? step : 1;
  const stepped = min + Math.round((value - min) / size) * size;
  return Math.min(max, Math.max(min, Number(stepped.toFixed(decimals(size)))));
};

/** Frame-rate-independent easing towards a target: tau is the ms to close about 63% of the gap. */
const approach = (current: number, target: number, dt: number, tau: number): number =>
  tau <= 0 ? target : current + (target - current) * (1 - Math.exp(-dt / tau));

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function GlassSlider({
  radius = LIQUID_RADIUS,
  value: valueProp,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  id,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-valuetext': ariaValueText,
}: GlassSliderProps): ReactElement {
  const { register, pump } = useLiquidScene();
  const [inner, setInner] = useState(() => snap(defaultValue ?? min, min, max, step));
  const value = snap(valueProp ?? inner, min, max, step);
  const fraction = max > min ? (value - min) / (max - min) : 0;
  const rootRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const lastFrame = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;
  const fractionRef = useRef(fraction);
  const onChangeRef = useRef(onValueChange);
  onChangeRef.current = onValueChange;
  const controlled = valueProp !== undefined;

  const r = pill(LENS_H, radius);

  const set = (next: number): void => {
    if (!controlled) setInner(next);
    onChangeRef.current?.(next);
  };

  // A value change moves the thumb, eased: the scene paints through the lens
  // on the way, and the next press picks the thumb up from where the value is.
  useEffect(() => {
    fractionRef.current = fraction;
    pump(400);
  }, [fraction, pump]);

  /** Report the step under a position, once per step. */
  const report = (g: Gesture, at: number): void => {
    const next = snap(min + at * (max - min), min, max, step);
    if (next === g.last) return;
    g.last = next;
    set(next);
  };

  /** Where the finger puts the thumb's centre, 0 to 1 along the travel. */
  const aim = (g: Gesture, clientX: number): number =>
    clamp01((clientX - g.offset - g.left - THUMB_W / 2) / g.travel);

  // On the scene's driver, while a finger has the control: the catch-up after
  // a rail press, and the stretch falling away as the finger slows. The
  // callback is held in a ref so it can close over fresh state without the
  // registration being torn down on every render.
  const frame = useRef<(now: number) => void>(() => {});
  frame.current = (now) => {
    const g = gesture.current;
    const root = rootRef.current;
    if (!g || !root) return;
    const dt = lastFrame.current ? Math.min(64, now - lastFrame.current) : 16;
    lastFrame.current = now;
    let busy = false;
    if (g.gap !== 0) {
      g.gap = approach(g.gap, 0, dt, reducedMotion() ? 0 : TAU);
      if (Math.abs(g.gap) < 0.002) g.gap = 0;
      g.x = g.target - g.gap;
      root.style.setProperty('--x', g.x.toFixed(4));
      busy = true;
    }
    // Speed that has gone quiet is not a stretch.
    g.velocity *= Math.exp(-dt / STRETCH_DECAY);
    const stretch = reducedMotion() ? 0 : Math.min(STRETCH_MAX, Math.abs(g.velocity) * STRETCH);
    if (Math.abs(stretch - g.stretch) > 0.15) {
      g.stretch = stretch;
      root.style.setProperty('--gs-stretch', `${stretch.toFixed(1)}px`);
      busy = true;
    }
    if (busy) pump(48);
  };
  useEffect(() => register((now) => frame.current(now)), [register]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (disabled || gesture.current) return; // a second finger changes nothing
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const root = event.currentTarget;
    const box = root.getBoundingClientRect();
    const at = fractionRef.current;
    const g: Gesture = {
      id: event.pointerId,
      left: box.left,
      travel: Math.max(1, box.width - THUMB_W),
      offset: 0,
      x: at,
      target: at,
      gap: 0,
      last: valueRef.current,
      velocity: 0,
      lastX: event.clientX,
      lastT: event.timeStamp,
      stretch: 0,
    };
    const onThumb =
      event.target instanceof Element && event.target.closest('.gs-thumb') !== null;
    if (onThumb) {
      // Picked up where it was touched: the thumb keeps that offset under the finger.
      (g as { offset: number }).offset = event.clientX - (box.left + at * g.travel + THUMB_W / 2);
    } else {
      // Pressed on the rail: the value is there now, and the thumb goes to it.
      g.target = aim(g, event.clientX);
      g.gap = g.target - at;
      report(g, g.target);
    }
    gesture.current = g;
    lastFrame.current = 0;
    root.setPointerCapture?.(event.pointerId);
    root.dataset['lift'] = '';
    root.style.setProperty('--x', at.toFixed(4));
    pump(500);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const g = gesture.current;
    const root = rootRef.current;
    if (!g || g.id !== event.pointerId || !root) return;
    g.target = aim(g, event.clientX);
    if (g.gap === 0) {
      g.x = g.target;
      root.style.setProperty('--x', g.x.toFixed(4));
    }
    const dt = (event.timeStamp - g.lastT) / 1000;
    if (dt > 0) {
      const v = (event.clientX - g.lastX) / dt;
      g.velocity = g.velocity * 0.5 + v * 0.5;
    }
    g.lastX = event.clientX;
    g.lastT = event.timeStamp;
    report(g, g.target);
    pump(160);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const g = gesture.current;
    const root = rootRef.current;
    if (!g || g.id !== event.pointerId) return;
    gesture.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (root) {
      delete root.dataset['lift'];
      // Back onto the value's own step, eased, as the white comes back over the glass.
      root.style.removeProperty('--x');
      root.style.removeProperty('--gs-stretch');
    }
    // Keyboard continuity: the thumb has focus after any press, including one
    // on the rail. Focused here rather than on the way down, because a script
    // focus before the browser has seen the pointer is drawn with the keyboard's ring.
    if (document.activeElement !== thumbRef.current) {
      thumbRef.current?.focus({ preventScroll: true });
    }
    pump(600);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (disabled) return;
    const size = step > 0 ? step : 1;
    const page = Math.max(size, (max - min) / 10);
    const current = valueRef.current;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = current + size;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = current - size;
        break;
      case 'PageUp':
        next = current + page;
        break;
      case 'PageDown':
        next = current - page;
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }
    event.preventDefault();
    const snapped = snap(next, min, max, step);
    if (snapped !== current) set(snapped);
  };

  return (
    <div
      ref={rootRef}
      data-slot="glass-slider"
      data-no-drag
      data-disabled={disabled ? '' : undefined}
      className={className ? `gs ${className}` : 'gs'}
      style={
        {
          '--v': fraction,
          '--gs-thumb-w': `${THUMB_W}px`,
          '--gs-thumb-h': `${THUMB_H}px`,
          '--gs-lens-w': `${LENS_W}px`,
          '--gs-lens-h': `${LENS_H}px`,
          '--gs-rail': `${RAIL_H}px`,
          '--gs-hit': `${HIT_H}px`,
          '--gs-r': `${r}px`,
        } as Vars
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* The rail, filled to the thumb's centre. */}
      <div className="gs-rail" aria-hidden="true">
        <span className="gs-fill" />
      </div>
      {/* The thumb. The slider itself, to the keyboard and to assistive
          technology; a plain wrapper carries the box, the travel and the
          shadow, and the pane inside it is only ever the material. Inside the
          pane's refraction layer rides a copy of the rail, so the glass bends
          the rail it sits on and not only the scene behind it; over the glass,
          the rim's light and the white cap. */}
      <div
        ref={thumbRef}
        id={id}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={ariaValueText}
        aria-disabled={disabled || undefined}
        className="gs-thumb"
        onKeyDown={onKeyDown}
      >
        <LiquidSurface
          radius={r}
          zoom={ZOOM}
          className="gs-lens"
          contentClassName="gs-lens-content"
          refracted={
            <span className="gs-echo">
              <span className="gs-echo-fill" />
            </span>
          }
        >
          <span className="gs-rim" />
          <span className="gs-cap" />
        </LiquidSurface>
      </div>
    </div>
  );
}
