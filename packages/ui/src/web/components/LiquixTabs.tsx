import {
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  useEffect,
  useId,
  useRef,
} from 'react';
import { cn } from '../cn';
import { useLiquixBox } from '../liquix/box';

// Geometry, in CSS px. The shader is handed these numbers and the elements are
// sized to match, so the glass and the buttons are the same box.
const HEIGHT = 56;
const PILL_INSET = 4;

// The spring the highlight travels on. Under-damped on purpose: it arrives,
// leans past the tab and settles, which is what makes the glass read as liquid
// rather than as a box being moved.
const STIFFNESS = 260;
const DAMPING = 2 * Math.sqrt(STIFFNESS) * 0.68;
const SUBSTEP = 1 / 120;

// The pill counts as parked once it is within SETTLED px of its tab and moving
// slower than MOVING px per second. Both, because the spring passes through
// the target at speed and stands still for an instant at the top of each
// overshoot; either test alone would let go of the glass mid-bounce and grab
// it again on the way back.
const SETTLED = 1.5;
const MOVING = 30;

// How long the pill takes to cross between its two looks, in seconds. Glass
// arrives as the travel starts, which the motion hides; grey comes back over a
// beat once it parks. The blend runs on a clock and is eased at both ends, so
// neither look pops in or trails off.
const TO_GLASS = 0.1;
const TO_GREY = 0.32;

// No WebGL2: the look without the physics, same as the other liquix shapes.
const FALLBACK_TRACK =
  'border border-white/70 bg-white/45 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.9),0_8px_28px_rgba(0,0,0,0.14)] backdrop-blur-xl backdrop-saturate-150';

const FALLBACK_PILL =
  'border border-white/70 bg-white/60 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.9),0_6px_18px_rgba(0,0,0,0.12)] backdrop-blur-md backdrop-saturate-150';

/**
 * The bar itself: one capsule of glass the width of the group, refracting
 * whatever scrolls under it. The element is transparent, because the surface
 * is drawn by the shader on the canvas below and a background here would cover
 * it up.
 */
function Track({ width, height }: { width: number; height: number }): ReactElement {
  const { elementRef, entryRef, fallback } = useLiquixBox(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: entryRef is a ref from useLiquixBox and never changes.
  useEffect(() => {
    entryRef.current.shape = {
      width,
      height,
      cornerRadius: height / 2,
      roundness: 2,
    };
  }, [width, height]);

  return (
    <div
      ref={elementRef}
      aria-hidden="true"
      data-slot="liquix-tabs-track"
      style={{ borderRadius: `${height / 2}px` }}
      className={cn('absolute inset-0', fallback && FALLBACK_TRACK)}
    />
  );
}

interface HighlightProps {
  readonly index: number;
  readonly tabWidth: number;
  readonly height: number;
  readonly pillClassName: string | undefined;
}

interface Motion {
  x: number;
  velocity: number;
  target: number;
  accumulator: number;
  last: number;
  started: boolean;
}

/**
 * The selected tab's highlight. At rest it is a plain grey capsule; it becomes
 * glass only while it travels, refracting the bar's surface on the layer above
 * it rather than merging into it.
 *
 * The two cross-fade: the glass through its own alpha on the canvas, the
 * capsule through the element's opacity, on one eased clock. Only once the
 * glass is gone is the shape handed back to the surface: at rest the shader
 * is not drawing a pill at all, and its pass drops with it.
 *
 * The spring runs here rather than in CSS because the shader needs the box
 * every frame: the surface reads this element's rect for the centre and the
 * entry's shape for the size, so stretching one and translating the other is
 * what gives the travelling pill its squash.
 */
function Highlight({ index, tabWidth, height, pillClassName }: HighlightProps): ReactElement {
  const { elementRef, entryRef, stage, fallback } = useLiquixBox(1);
  const blobRef = useRef<HTMLDivElement | null>(null);
  const mix = useRef({ value: 0, registered: true });
  const motion = useRef<Motion>({
    x: 0,
    velocity: 0,
    target: 0,
    accumulator: 0,
    last: 0,
    started: false,
  });

  // Resizing is not a move: the pill belongs to the same tab, so it goes
  // straight to the new geometry instead of sliding across the bar.
  useEffect(() => {
    const state = motion.current;
    state.target = index * tabWidth;
    if (!state.started) {
      state.x = state.target;
      state.started = true;
    }
    // Start the travel from a clean clock. The click costs a render, and
    // without this the first frame would integrate that pause as spring time
    // and the pill would be a third of the way there before it is drawn once.
    state.last = 0;
    state.accumulator = 0;
  }, [index, tabWidth]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the width changing is the event this reacts to.
  useEffect(() => {
    const state = motion.current;
    state.x = state.target;
    state.velocity = 0;
  }, [tabWidth]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: elementRef and entryRef are refs from useLiquixBox and never change.
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const entry = entryRef.current;
    const state = motion.current;
    // useLiquixBox has just registered the entry with this stage, whatever the
    // blend was doing before; the loop below takes it from here.
    mix.current.registered = stage !== null;

    let raf = 0;
    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      const elapsed = state.last ? (time - state.last) / 1000 : 1 / 60;
      state.last = time;

      state.accumulator = Math.min(0.05, state.accumulator + elapsed);
      while (state.accumulator >= SUBSTEP) {
        state.accumulator -= SUBSTEP;
        const offset = state.x - state.target;
        state.velocity += (-STIFFNESS * offset - DAMPING * state.velocity) * SUBSTEP;
        state.x += state.velocity * SUBSTEP;
      }
      if (Math.abs(state.x - state.target) < 0.05 && Math.abs(state.velocity) < 1) {
        state.x = state.target;
        state.velocity = 0;
      }

      // Stretch along the direction of travel, pinch across it. The shape is
      // sized about the element's centre, so widening it alone is enough.
      const speed = Math.min(1, Math.abs(state.velocity) / 900);
      const width = Math.max(0, tabWidth - PILL_INSET * 2);
      const pillHeight = height - PILL_INSET * 2;
      entry.shape.width = width * (1 + 0.2 * speed);
      entry.shape.height = pillHeight * (1 - 0.12 * speed);

      // Glass while it travels, grey once it parks. The blend walks towards
      // whichever it should be at a fixed pace, and the eased value below is
      // what both halves of the cross-fade read.
      const moving =
        Math.abs(state.x - state.target) > SETTLED || Math.abs(state.velocity) > MOVING;
      const blend = mix.current;
      const pace = elapsed / (moving ? TO_GLASS : TO_GREY);
      blend.value = moving ? Math.min(1, blend.value + pace) : Math.max(0, blend.value - pace);
      const glass = blend.value * blend.value * (3 - 2 * blend.value);

      entry.alpha = glass;
      entry.shape.cornerRadius = entry.shape.height / 2;
      entry.glowTarget = 0.5 * speed;

      const wanted = blend.value > 0;
      if (stage && wanted !== blend.registered) {
        blend.registered = wanted;
        if (wanted) stage.register(entry);
        else stage.unregister(entry);
      }

      element.style.transform = `translateX(${state.x.toFixed(2)}px)`;
      if (blobRef.current) {
        blobRef.current.style.opacity = (1 - glass).toFixed(3);
        blobRef.current.style.transform = element.style.transform;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tabWidth, height, stage]);

  const box: CSSProperties = {
    left: `${PILL_INSET}px`,
    top: `${PILL_INSET}px`,
    width: `${Math.max(0, tabWidth - PILL_INSET * 2)}px`,
    height: `${height - PILL_INSET * 2}px`,
    borderRadius: `${(height - PILL_INSET * 2) / 2}px`,
  };

  return (
    <>
      <div
        ref={blobRef}
        aria-hidden="true"
        data-slot="liquix-tabs-pill"
        style={box}
        className={cn('liquix-tabs__pill absolute will-change-transform', pillClassName)}
      />

      <div
        ref={elementRef}
        aria-hidden="true"
        data-slot="liquix-tabs-highlight"
        style={box}
        className={cn('absolute will-change-transform', fallback && FALLBACK_PILL)}
      />
    </>
  );
}

export interface LiquixTabsShadowProps {
  /** The surface's width in CSS px. */
  readonly width: number;
  /** CSS px between the surface's edge and the bar's, each side. */
  readonly inset?: number | undefined;
  /** CSS px from the surface's bottom edge to the bar's. */
  readonly bottom?: number | undefined;
  /** The bar's height in CSS px. */
  readonly height?: number | undefined;
}

/**
 * The drop shadow, which the shader cannot draw: with everything outside the
 * glass cut away, its own shadow survives only where the glass refracts it, as
 * a dirty ring inside the rim. Pass this to the surface's `underlay`, because
 * anything in front of the canvas would lay the shadow over the glass instead
 * of under it.
 */
export function LiquixTabsShadow({
  width,
  inset = 14,
  bottom = 28,
  height = HEIGHT,
}: LiquixTabsShadowProps): ReactElement {
  return (
    <div
      data-slot="liquix-tabs-shadow"
      className="absolute inset-x-0"
      style={{ bottom: `${bottom}px` }}
    >
      <div
        aria-hidden="true"
        style={{
          width: `${Math.max(0, width - inset * 2)}px`,
          height: `${height}px`,
          borderRadius: `${height / 2}px`,
        }}
        className="mx-auto shadow-[0_8px_28px_rgba(0,0,0,0.16)]"
      />
    </div>
  );
}

export interface LiquixTab {
  readonly id: string;
  readonly label: string;
  /** Inherits size and colour from the button, so the tab styling drives it. */
  readonly Icon: ComponentType;
}

export interface LiquixTabsProps {
  readonly tabs: readonly LiquixTab[];
  /** The selected id. */
  readonly active: string;
  /** Called with the id of the tab that was clicked. */
  readonly onChange: (id: string) => void;
  /**
   * The surface's width in CSS px. The bar is measured from it rather than
   * from its own layout, because the shader needs the box in the same units
   * it is given everything else.
   */
  readonly width: number;
  /** CSS px between the surface's edge and the bar's, each side. */
  readonly inset?: number | undefined;
  /** CSS px from the surface's bottom edge to the bar's. */
  readonly bottom?: number | undefined;
  /** The bar's height in CSS px. */
  readonly height?: number | undefined;
  /** The accessible name of the tablist. */
  readonly label?: string | undefined;
  /** Classes on the selected tab's button. */
  readonly activeClassName?: string | undefined;
  /** Classes on every other tab's button. White with a drop shadow, as on LiquixCapsule, so it reads over any picture. */
  readonly inactiveClassName?: string | undefined;
  /**
   * Classes added to the parked highlight, the capsule the glass settles into.
   * By default it is translucent grey over a backdrop blur, so the bar and the
   * content behind still show through softly; a background utility replaces
   * the grey.
   */
  readonly pillClassName?: string | undefined;
}

/**
 * A tab bar made of glass, for the `overlay` of a LiquixSurface.
 *
 * The bar is one capsule of glass refracting whatever scrolls under it, and
 * the selected tab's highlight turns to glass while it travels between tabs,
 * then settles back into a flat capsule. Every button is a real `<button>` in
 * a tablist; the glass is drawn by the surface's shader on the canvas below.
 */
export function LiquixTabs({
  tabs,
  active,
  onChange,
  width,
  inset = 14,
  bottom = 28,
  height = HEIGHT,
  label = 'Sections',
  activeClassName = 'text-blue-600',
  inactiveClassName = 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]',
  pillClassName,
}: LiquixTabsProps): ReactElement {
  const uid = useId();
  const barWidth = Math.max(0, width - inset * 2);
  const index = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === active),
  );

  // The tablist is one Tab stop; arrows move between tabs and select as they
  // go, Home and End jump to the ends, and the arrows swap in right-to-left.
  const handleKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const key =
      rtl && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')
        ? event.key === 'ArrowRight'
          ? 'ArrowLeft'
          : 'ArrowRight'
        : event.key;
    const to =
      key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : key === 'ArrowLeft'
          ? (index - 1 + tabs.length) % tabs.length
          : key === 'Home'
            ? 0
            : key === 'End'
              ? tabs.length - 1
              : -1;
    const next = tabs[to];
    if (!next) return;
    event.preventDefault();
    onChange(next.id);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[to]?.focus();
  };

  return (
    <div
      data-slot="liquix-tabs"
      className="pointer-events-none absolute inset-x-0"
      style={{ bottom: `${bottom}px` }}
    >
      <div
        style={{ width: `${barWidth}px`, height: `${height}px` }}
        className="pointer-events-auto relative mx-auto"
      >
        <Track width={barWidth} height={height} />
        <Highlight
          index={index}
          tabWidth={tabs.length ? barWidth / tabs.length : barWidth}
          height={height}
          pillClassName={pillClassName}
        />

        <div
          role="tablist"
          aria-label={label}
          onKeyDown={handleKey}
          className="relative flex h-full w-full"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${uid}-tab-${tab.id}`}
              aria-selected={tab.id === active}
              tabIndex={tab.id === active ? 0 : -1}
              data-slot="liquix-tab"
              data-state={tab.id === active ? 'active' : 'inactive'}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex min-w-0 flex-1 basis-0 flex-col items-center justify-center rounded-full',
                tab.id === active ? activeClassName : inactiveClassName,
              )}
            >
              <tab.Icon />
              <span className="text-[10px] font-semibold tracking-[0.08em]">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
