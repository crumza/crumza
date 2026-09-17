import {
  type ComponentType,
  type CSSProperties,
  type ReactElement,
  useEffect,
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

// Below this, in px per second, the pill counts as parked. The spring's last
// wobbles are slower than this, so the glass lets go as the pill lands rather
// than riding out the tail.
const MOVING = 30;

// How fast the pill crosses between its two looks, per second. Glass arrives
// as the travel starts, which the motion hides; grey comes back a beat after
// it parks, quick enough that the rim does not linger over the capsule.
const TO_GLASS = 18;
const TO_GREY = 8;

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
 * The two cross-fade. The grey capsule is opaque and sits over the canvas, so
 * fading it in hides the glass underneath it; the glass is tucked a couple of
 * px further in as it goes, which keeps its rim from showing around the edge.
 * Only once the grey is solid is the shape handed back to the surface: at
 * rest the shader is not drawing a pill at all, and its pass drops with it.
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

      // Glass while it travels, grey once it parks, and a ramp between the
      // two rather than a switch.
      const moving = Math.abs(state.velocity) > MOVING;
      const blend = mix.current;
      blend.value +=
        ((moving ? 1 : 0) - blend.value) * Math.min(1, elapsed * (moving ? TO_GLASS : TO_GREY));
      if (blend.value < 0.004) blend.value = 0;
      if (blend.value > 0.996) blend.value = 1;

      // Tuck the glass in behind the grey as it fades, so no rim is left
      // showing around a capsule that is meant to be flat.
      const tuck = (1 - blend.value) * 3;
      entry.shape.width = Math.max(0, entry.shape.width - tuck * 2);
      entry.shape.height = Math.max(0, entry.shape.height - tuck * 2);
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
        blobRef.current.style.opacity = (1 - blend.value).toFixed(3);
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
  const barWidth = Math.max(0, width - inset * 2);
  const index = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === active),
  );

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

        <div role="tablist" aria-label={label} className="relative flex h-full w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={tab.id === active}
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
