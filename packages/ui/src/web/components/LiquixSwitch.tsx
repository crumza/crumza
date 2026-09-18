import {
  type ComponentProps,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  useEffect,
  useRef,
} from 'react';
import { useControllableState } from '../../core/use-controllable-state';
import { cn } from '../cn';
import { useLiquixBox } from '../liquix/box';
import { type Capsule, outsideClip } from '../liquix/clip';
import { type LiquixLensStyle, LiquixMotion, shapeFrame } from '../liquix/motion';

export interface LiquixSwitchProps
  extends Omit<ComponentProps<'button'>, 'onChange' | 'style' | 'value' | 'children'> {
  readonly checked?: boolean | undefined;
  readonly defaultChecked?: boolean | undefined;
  readonly onCheckedChange?: ((checked: boolean) => void) | undefined;
  /** The track's size in CSS px. */
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  /** Classes for the track's tint when on and when off. */
  readonly onClassName?: string | undefined;
  readonly offClassName?: string | undefined;
}

// The knob sits this far inside the track.
const INSET = 2;
// A press becomes a drag once the pointer has moved this far.
const SLOP = 3;

// A knob is small, so it lifts less than a tab capsule and stretches more.
const KNOB: LiquixLensStyle = {
  liftWidth: 10,
  liftHeight: 10,
  liftShadow: 30,
  lens: 0.32,
  stretch: 0.28,
  pinch: 0.1,
  fullSpeed: 700,
};

/**
 * A switch whose knob is the glass: white and flat at rest, it lifts into a
 * lens while dragged, bending the track and the content beneath, and snaps to
 * a side on release, settling flat again. The track is a pane of glass with a
 * tint that follows the state. A tap toggles; Space and Enter toggle.
 */
export function LiquixSwitch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  width = 52,
  height = 32,
  onClassName = 'bg-blue-500/85',
  offClassName = 'bg-white/25',
  className,
  disabled,
  onClick,
  ...props
}: LiquixSwitchProps): ReactElement {
  const [on, setOn] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });
  const pane = useLiquixBox(0);
  const knob = useLiquixBox(1);
  const blobRef = useRef<HTMLDivElement | null>(null);
  const tintRef = useRef<HTMLDivElement | null>(null);
  const motion = useRef(new LiquixMotion());
  const started = useRef(false);
  const size = height - INSET * 2;
  const travel = width - height;

  // biome-ignore lint/correctness/useExhaustiveDependencies: entryRef is a ref from useLiquixBox and never changes.
  useEffect(() => {
    pane.entryRef.current.shape = { width, height, cornerRadius: height / 2, roundness: 2 };
  }, [width, height]);

  useEffect(() => {
    const m = motion.current;
    const x = on ? travel : 0;
    if (!started.current) {
      m.jump(x);
      started.current = true;
    } else m.target(x);
  }, [on, travel]);

  const drag = useRef({
    pointerId: null as number | null,
    startX: 0,
    grab: 0,
    active: false,
    x: 0,
    dragged: false,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: the refs from useLiquixBox never change.
  useEffect(() => {
    const element = knob.elementRef.current;
    if (!element) return;
    const entry = knob.entryRef.current;
    const stage = knob.stage;
    const m = motion.current;
    let registered = stage !== null;
    let raf = 0;
    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      if (drag.current.active) m.hold(drag.current.x);
      else if (m.held) m.release();
      const frame = m.step(time);
      const shape = shapeFrame(entry, frame, { width: size, height: size }, KNOB);
      if (stage && m.visible !== registered) {
        registered = m.visible;
        if (registered) stage.register(entry);
        else stage.unregister(entry);
      }
      element.style.transform = `translateX(${frame.x.toFixed(2)}px)`;
      if (blobRef.current) {
        blobRef.current.style.transform = element.style.transform;
        blobRef.current.style.opacity = (1 - frame.glass).toFixed(3);
      }
      // The tint stops where the knob is, so the knob's glass shows through
      // the track rather than being painted over by it.
      if (tintRef.current) {
        const capsule: Capsule = {
          cx: INSET + frame.x + size / 2,
          cy: height / 2,
          w: shape.width,
          h: shape.height,
        };
        tintRef.current.style.clipPath = outsideClip(width, height, capsule);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [size, travel, width, height, knob.stage]);

  const localX = (event: PointerEvent<HTMLButtonElement>): number =>
    event.clientX - event.currentTarget.getBoundingClientRect().left;
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
    const state = drag.current;
    state.dragged = false;
    if (disabled || event.button !== 0) return;
    state.pointerId = event.pointerId;
    state.startX = localX(event);
    const knobLeft = motion.current.x;
    const inKnob = state.startX >= INSET + knobLeft && state.startX <= INSET + knobLeft + size;
    state.grab = inKnob ? state.startX - (INSET + knobLeft + size / 2) : 0;
    state.active = false;
    state.x = knobLeft;
  };
  const onPointerMove = (event: PointerEvent<HTMLButtonElement>): void => {
    const state = drag.current;
    if (state.pointerId !== event.pointerId) return;
    const local = localX(event);
    if (!state.active) {
      if (Math.abs(local - state.startX) < SLOP) return;
      state.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    state.x = Math.max(0, Math.min(travel, local - state.grab - INSET - size / 2));
  };
  const onPointerEnd = (event: PointerEvent<HTMLButtonElement>): void => {
    const state = drag.current;
    if (state.pointerId !== event.pointerId) return;
    state.pointerId = null;
    if (!state.active) return;
    state.active = false;
    state.dragged = event.type === 'pointerup';
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    const next = state.x > travel / 2;
    if (next !== on) setOn(next);
    else motion.current.target(on ? travel : 0);
  };
  const onClickCapture = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!drag.current.dragged) return;
    drag.current.dragged = false;
    event.stopPropagation();
    event.preventDefault();
  };

  const knobBox: CSSProperties = {
    left: `${INSET}px`,
    top: `${INSET}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: `${size / 2}px`,
  };
  const resting: Capsule = {
    cx: INSET + (on ? travel : 0) + size / 2,
    cy: height / 2,
    w: size,
    h: size,
  };

  return (
    <button
      {...props}
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      data-slot="liquix-switch"
      data-state={on ? 'checked' : 'unchecked'}
      data-fallback={pane.fallback ? '' : undefined}
      style={{ width: `${width}px`, height: `${height}px`, borderRadius: `${height / 2}px` }}
      className={cn(
        'pointer-events-auto relative block touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:opacity-50',
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={onClickCapture}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOn(!on);
      }}
    >
      <div
        ref={pane.elementRef}
        aria-hidden="true"
        data-slot="liquix-switch-track"
        className={cn('absolute inset-0 rounded-full', pane.fallback && 'liquix-glass-pane')}
      />
      <div
        ref={tintRef}
        aria-hidden="true"
        data-slot="liquix-switch-tint"
        className={cn(
          'absolute inset-0 rounded-full transition-colors duration-200 will-change-[clip-path]',
          on ? onClassName : offClassName,
        )}
        style={{ clipPath: outsideClip(width, height, resting) }}
      />
      <div
        ref={blobRef}
        aria-hidden="true"
        data-slot="liquix-switch-knob"
        style={knobBox}
        className="liquix-knob absolute will-change-transform"
      />
      <div
        ref={knob.elementRef}
        aria-hidden="true"
        data-slot="liquix-switch-glass"
        style={knobBox}
        className={cn('absolute will-change-transform', knob.fallback && 'liquix-glass-lens')}
      />
    </button>
  );
}
