import { type KeyboardEvent, type PointerEvent, type ReactElement, useEffect, useRef } from 'react';
import {
  approach,
  H,
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

export interface LiquidGlassSliderProps extends LiquidComponentProps {
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

/** The lens: a capsule, wider than it is tall and near seven times the rail's
 *  height. Tall enough that the material's rim bend, which reaches 26px in from
 *  the edge, has faded to about a pixel by the middle: the outer ten pixels
 *  bend the scene hard, the centre shows it nearly straight and a little
 *  magnified, which is what a curved piece of glass does. */
const THUMB_W = 64;
const THUMB_H = 40;
/** Px the lens grows in both directions while it is lifted. */
const LIFT = 4;
/** The rail under it. */
const RAIL_H = 6;
/** The control's box: a full touch target, with the rail and the lens centred in it. */
const HIT_H = 52;
/** Ms time constant of the catch-up after a press on the rail: the lens closes
 *  on the finger over a few frames rather than jumping to it, then follows it
 *  one to one. */
const TAU = 70;
/** The lens' slight magnification of what is under it. */
const ZOOM = 1.14;

/** One finger on the control, kept out of React state so a move never renders. */
interface Gesture {
  readonly id: number;
  /** px, the control's left edge and the travel the lens has along it */
  readonly left: number;
  readonly travel: number;
  /** px from the finger to the lens' centre when it was picked up; 0 for a press on the rail */
  readonly offset: number;
  /** where the lens is, 0 to 1 */
  x: number;
  /** where the finger says it should be */
  target: number;
  /** what is left of the distance a rail press asked it to cover */
  gap: number;
  /** the last value reported, so a move that stays on a step reports nothing */
  last: number;
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

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A thin rail with an oversized lens for a thumb.
 *
 * The lens is glass, at rest as much as in the hand: a capsule near seven
 * times the rail's height that bends the scene hard at its rim and shows it
 * nearly straight, a little magnified, through its middle, with the
 * material's own light along its upper edge and shade along the lower. It is
 * not a filter of its own: the lens is a LiquidSurface, so it refracts through
 * the same engine, displacement-map cache and clone of the scene as every
 * other pane in the scene. It also carries a copy of the rail inside its
 * refraction layer, so the rail bends through the glass the way the scene
 * behind it does. Over the glass there is only a breath of milk at the rim and
 * one soft light; the centre is the scene.
 *
 * Pick it up and it bends harder: the engine reads --lq-bend on every paint,
 * the stylesheet raises it while the lens is lifted and transitions it, so the
 * refraction deepens eased rather than switching. The lens grows a few pixels,
 * its shadow drops away beneath it and the light comes up, and it is carried
 * one to one with the finger along the rail. A press on the rail sends the
 * value there at once and the lens closes on the finger over a few frames
 * rather than jumping. Let go and the bend settles back while the lens eases
 * onto the step it was left on. No spring, no bounce: one short, damped curve
 * for everything.
 *
 * No frame loop of its own. A drag writes one custom property per pointer
 * event, straight to the root; the rail's fill, the lens and the copy of the
 * rail inside it all read their position from it. Every size change is a
 * layout change rather than a transform scale, so the clone stays pixel-aligned
 * with the scene, and the lens only ever moves between two sizes, so the whole
 * gesture costs two cached maps.
 */
export function LiquidGlassSlider({
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
}: LiquidGlassSliderProps): ReactElement {
  const { pump } = useLiquidScene();
  const [raw, set] = useControllableState({
    value: valueProp,
    defaultValue: defaultValue ?? min,
    onChange: onValueChange,
  });
  const value = snap(raw, min, max, step);
  const fraction = max > min ? (value - min) / (max - min) : 0;
  const rootRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const clock = useRef(makeClock());
  const valueRef = useRef(value);
  valueRef.current = value;
  const fractionRef = useRef(fraction);

  const r = pill(H.slider, radius);

  // A value change moves the lens, eased: the scene paints through it on the way,
  // and the next press picks the lens up from where the value has put it.
  useEffect(() => {
    fractionRef.current = fraction;
    pump(360);
  }, [fraction, pump]);

  /** Report the step under a position, once per step. */
  const report = (g: Gesture, at: number): void => {
    const next = snap(min + at * (max - min), min, max, step);
    if (next === g.last) return;
    g.last = next;
    set(next);
  };

  /** Where the finger puts the lens' centre, 0 to 1 along the travel. */
  const aim = (g: Gesture, clientX: number): number =>
    clamp01((clientX - g.offset - g.left - THUMB_W / 2) / g.travel);

  // After a press on the rail the lens closes on the finger over a few frames
  // rather than jumping to it; from then on it is one to one.
  useSceneFrame((now) => {
    const g = gesture.current;
    const root = rootRef.current;
    if (!g || g.gap === 0 || !root) return;
    const dt = clock.current(now);
    g.gap = approach(g.gap, 0, dt, reducedMotion() ? 0 : TAU);
    if (Math.abs(g.gap) < 0.002) g.gap = 0;
    g.x = g.target - g.gap;
    root.style.setProperty('--x', g.x.toFixed(4));
    pump(48);
  });

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
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
    };
    const onLens =
      event.target instanceof Element && event.target.closest('.lqc-slider-thumb') !== null;
    if (onLens) {
      // Picked up where it was touched: the lens keeps that offset under the finger.
      (g as { offset: number }).offset = event.clientX - (box.left + at * g.travel + THUMB_W / 2);
    } else {
      // Pressed on the rail: the value is there now, and the lens goes to it.
      g.target = aim(g, event.clientX);
      g.gap = g.target - at;
      report(g, g.target);
    }
    gesture.current = g;
    clock.current = makeClock();
    root.setPointerCapture?.(event.pointerId);
    root.dataset['lift'] = '';
    root.style.setProperty('--x', at.toFixed(4));
    pump(400);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const g = gesture.current;
    const root = rootRef.current;
    if (!g || g.id !== event.pointerId || !root) return;
    g.target = aim(g, event.clientX);
    if (g.gap === 0) {
      g.x = g.target;
      root.style.setProperty('--x', g.x.toFixed(4));
    }
    report(g, g.target);
    pump(160);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    const g = gesture.current;
    const root = rootRef.current;
    if (!g || g.id !== event.pointerId) return;
    gesture.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (root) {
      delete root.dataset['lift'];
      // Back onto the value's own step, eased, with the cap settling over the glass.
      root.style.removeProperty('--x');
    }
    // Keyboard continuity: the lens has focus after any press, including one on
    // the rail. Focused here rather than on the way down, because a script focus
    // before the browser has seen the pointer is drawn with the keyboard's ring.
    if (document.activeElement !== thumbRef.current) {
      thumbRef.current?.focus({ preventScroll: true });
    }
    pump(420);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
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
      data-slot="liquid-glass-slider"
      data-no-drag
      data-disabled={disabled ? '' : undefined}
      className={className ? `lqc-slider ${className}` : 'lqc-slider'}
      style={
        {
          '--v': fraction,
          '--lqc-slider-thumb-w': `${THUMB_W}px`,
          '--lqc-slider-thumb-h': `${THUMB_H}px`,
          '--lqc-slider-lift': `${LIFT}px`,
          '--lqc-slider-rail': `${RAIL_H}px`,
          '--lqc-slider-hit': `${HIT_H}px`,
          '--lqc-slider-r': `${r}px`,
        } as LiquidCSS
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* The rail, filled to the lens. Thin, and secondary to the lens over it. */}
      <div className="lqc-slider-rail" aria-hidden="true">
        <span className="lqc-slider-fill" />
      </div>
      {/* The lens. The slider itself, to the keyboard and to assistive technology;
          a plain wrapper carries the box, the travel and the shadow, and the pane
          inside it is only ever the material. Inside the pane's refraction layer
          rides a copy of the rail, so the glass bends the rail it sits on and not
          only the scene behind it; over the glass, a highlight and the white cap. */}
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
        className="lqc-slider-thumb"
        onKeyDown={onKeyDown}
      >
        <LiquidSurface
          radius={r}
          zoom={ZOOM}
          className="lqc-slider-lens"
          contentClassName="lqc-slider-lens-content"
          refracted={
            <span className="lqc-slider-echo">
              <span className="lqc-slider-echo-fill" />
            </span>
          }
        >
          <span className="lqc-slider-sheen" />
          <span className="lqc-slider-cap" />
        </LiquidSurface>
      </div>
    </div>
  );
}
