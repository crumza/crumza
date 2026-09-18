import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { cn } from '../cn';
import { useLiquixBox } from '../liquix/box';
import { type Capsule, insideClip, outsideClip } from '../liquix/clip';
import { LiquixMotion, shapeFrame } from '../liquix/motion';

/**
 * The bar every liquix choice control is built on: a pane of glass holding a
 * row of equal slots, a capsule that travels to the chosen slot on a spring,
 * turning to glass while it moves and settling back into a flat pill, labels
 * whose colour follows the capsule, a drag that carries the capsule and snaps
 * it to the nearest slot, and the keyboard pattern the slots' role asks for.
 * LiquixTabs and LiquixSegmentedControl are this with different slots, roles
 * and clothes, so they cannot drift apart.
 */
export interface LiquixBarItem {
  readonly id: string;
  readonly label: ReactNode;
  /** Renders the slot as a link rather than a button. */
  readonly href?: string | undefined;
  readonly disabled?: boolean | undefined;
}

export interface LiquixBarProps {
  readonly items: readonly LiquixBarItem[];
  readonly active: string;
  readonly onChange: (id: string) => void;
  /** The bar's height in CSS px. */
  readonly height: number;
  /** CSS px between the bar's edge and the capsule's. */
  readonly pillInset: number;
  /** The accessible name of the list. */
  readonly label: string;
  /** The list's role; a plain group of links or buttons without one. */
  readonly listRole?: 'tablist' | 'radiogroup' | undefined;
  readonly itemRole?: 'tab' | 'radio' | undefined;
  /** Arrow keys select as they move, or only move focus. */
  readonly selectOnArrow: boolean;
  /** Draw the bar's own pane of glass. */
  readonly pane: boolean;
  readonly leading?: ReactNode | undefined;
  readonly trailing?: ReactNode | undefined;
  readonly activeClassName: string;
  readonly inactiveClassName: string;
  readonly pillClassName?: string | undefined;
  /** Layout of one slot's contents. */
  readonly itemClassName?: string | undefined;
  /** The data-slot prefix. */
  readonly slot: string;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  /**
   * The bar's width before it has been measured, when the caller knows it:
   * server markup and the first frame then match the measured layout.
   */
  readonly initialWidth?: number | undefined;
}

// A press inside the active slot becomes a drag once the pointer has moved
// this far; before that it is the click it looks like.
const SLOP = 4;

/** A drag in progress, shared between the list's pointer handlers and the frame loop. */
interface DragState {
  pointerId: number | null;
  startLocal: number;
  grabOffset: number;
  active: boolean;
  x: number;
  /** True between a drag's release and the click the browser fires after it. */
  dragged: boolean;
}

/** The pane: one piece of glass the size of the whole bar. */
function Pane({ width, height }: { width: number; height: number }): ReactElement {
  const { elementRef, entryRef, fallback } = useLiquixBox(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: entryRef is a ref from useLiquixBox and never changes.
  useEffect(() => {
    entryRef.current.shape = { width, height, cornerRadius: height / 2, roundness: 2 };
  }, [width, height]);
  return (
    <div
      ref={elementRef}
      aria-hidden="true"
      data-slot="liquix-bar-pane"
      style={{ borderRadius: `${height / 2}px` }}
      className={cn('absolute inset-0', fallback && 'liquix-glass-pane')}
    />
  );
}

interface HighlightProps {
  readonly index: number;
  readonly slotWidth: number;
  readonly rowWidth: number;
  readonly height: number;
  readonly inset: number;
  readonly pillClassName: string | undefined;
  readonly drag: { readonly current: DragState };
  readonly restLabels: { readonly current: HTMLDivElement | null };
  readonly activeLabels: { readonly current: HTMLDivElement | null };
}

/**
 * The capsule. At rest a flat pill; glass while it travels or is held, drawn
 * by the surface a layer above the pane so it sits on the glass rather than
 * merging into it. The motion is the shared LiquixMotion; this only feeds it
 * the target and the pointer and writes each frame to the elements.
 */
function Highlight({
  index,
  slotWidth,
  rowWidth,
  height,
  inset,
  pillClassName,
  drag,
  restLabels,
  activeLabels,
}: HighlightProps): ReactElement {
  const { elementRef, entryRef, stage, fallback } = useLiquixBox(1);
  const blobRef = useRef<HTMLDivElement | null>(null);
  const motion = useRef(new LiquixMotion());
  const started = useRef(false);

  // A new slot is a travel; a resize is not, the capsule belongs to the same
  // slot and goes straight to its new geometry.
  useEffect(() => {
    const m = motion.current;
    if (!started.current) {
      m.jump(index * slotWidth);
      started.current = true;
    } else m.target(index * slotWidth);
  }, [index, slotWidth]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the width changing is the event this reacts to.
  useEffect(() => {
    motion.current.jump(motion.current.tx);
  }, [slotWidth]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: elementRef and entryRef are refs from useLiquixBox and never change.
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const entry = entryRef.current;
    const m = motion.current;
    let registered = stage !== null;

    let raf = 0;
    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      if (drag.current.active) m.hold(drag.current.x);
      else if (m.held) m.release();
      const frame = m.step(time);
      const shape = shapeFrame(entry, frame, {
        width: Math.max(0, slotWidth - inset * 2),
        height: height - inset * 2,
      });

      // Only once the glass is gone is the shape handed back to the surface:
      // at rest the shader draws no capsule and its pass drops with it.
      if (stage && m.visible !== registered) {
        registered = m.visible;
        if (registered) stage.register(entry);
        else stage.unregister(entry);
      }

      element.style.transform = `translateX(${frame.x.toFixed(2)}px)`;
      if (blobRef.current) {
        blobRef.current.style.opacity = (1 - frame.glass).toFixed(3);
        blobRef.current.style.transform = element.style.transform;
      }

      // Colour follows the capsule: two clips on two copies of the labels.
      const capsule: Capsule = {
        cx: frame.x + slotWidth / 2,
        cy: height / 2,
        w: shape.width,
        h: shape.height,
      };
      if (activeLabels.current) activeLabels.current.style.clipPath = insideClip(capsule);
      if (restLabels.current)
        restLabels.current.style.clipPath = outsideClip(rowWidth, height, capsule);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [slotWidth, rowWidth, height, inset, stage, drag, restLabels, activeLabels]);

  const box: CSSProperties = {
    left: `${inset}px`,
    top: `${inset}px`,
    width: `${Math.max(0, slotWidth - inset * 2)}px`,
    height: `${height - inset * 2}px`,
    borderRadius: `${(height - inset * 2) / 2}px`,
  };

  return (
    <>
      <div
        ref={blobRef}
        aria-hidden="true"
        data-slot="liquix-bar-pill"
        style={box}
        className={cn('liquix-pill absolute will-change-transform', pillClassName)}
      />
      <div
        ref={elementRef}
        aria-hidden="true"
        data-slot="liquix-bar-highlight"
        style={box}
        className={cn('absolute will-change-transform', fallback && 'liquix-glass-lens')}
      />
    </>
  );
}

const SLOT = 'flex min-w-0 flex-1 basis-0 items-center justify-center rounded-full';

/** The state attribute a slot's role announces its selection with. */
function state(
  role: 'tab' | 'radio' | undefined,
  selected: boolean,
): { 'aria-selected': boolean } | { 'aria-checked': boolean } | { 'aria-pressed': boolean } {
  if (role === 'tab') return { 'aria-selected': selected };
  if (role === 'radio') return { 'aria-checked': selected };
  return { 'aria-pressed': selected };
}

export function LiquixBar({
  items,
  active,
  onChange,
  height,
  pillInset,
  label,
  listRole,
  itemRole,
  selectOnArrow,
  pane,
  leading,
  trailing,
  activeClassName,
  inactiveClassName,
  pillClassName,
  itemClassName,
  slot,
  className,
  style,
  initialWidth = 0,
}: LiquixBarProps): ReactElement {
  const uid = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [barWidth, setBarWidth] = useState(initialWidth);
  const [rowWidth, setRowWidth] = useState(initialWidth);

  // The shader needs boxes in CSS px, so the bar and the row of slots are
  // measured rather than assumed, and follow whatever lays them out.
  useEffect(() => {
    const root = rootRef.current;
    const row = rowRef.current;
    if (!root || !row) return;
    const observer = new ResizeObserver(() => {
      setBarWidth(root.clientWidth);
      setRowWidth(row.clientWidth);
    });
    observer.observe(root);
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  const count = items.length;
  const slotWidth = count ? rowWidth / count : rowWidth;
  const index = Math.max(
    0,
    items.findIndex((item) => item.id === active),
  );

  const restLabels = useRef<HTMLDivElement | null>(null);
  const activeLabels = useRef<HTMLDivElement | null>(null);
  const resting: Capsule = {
    cx: index * slotWidth + slotWidth / 2,
    cy: height / 2,
    w: Math.max(0, slotWidth - pillInset * 2),
    h: height - pillInset * 2,
  };

  const choose = (id: string): void => {
    const item = items.find((entry) => entry.id === id);
    if (item && !item.disabled && id !== active) onChange(id);
  };

  // Arrows move between slots, Home and End jump to the ends, arrows swap in
  // right-to-left text; disabled slots are skipped. With selectOnArrow the
  // slot arriving at is chosen too, the tablist and radiogroup pattern.
  const handleKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const key =
      rtl && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')
        ? event.key === 'ArrowRight'
          ? 'ArrowLeft'
          : 'ArrowRight'
        : event.key;
    const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);
    if (enabled.length === 0) return;
    const focused = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[data-index]'),
    ).indexOf(document.activeElement as HTMLElement);
    const from = enabled.indexOf(focused >= 0 ? focused : index);
    const at = from >= 0 ? from : 0;
    let to = -1;
    if (key === 'ArrowRight') to = enabled[(at + 1) % enabled.length] ?? -1;
    else if (key === 'ArrowLeft') to = enabled[(at - 1 + enabled.length) % enabled.length] ?? -1;
    else if (key === 'Home') to = enabled[0] ?? -1;
    else if (key === 'End') to = enabled[enabled.length - 1] ?? -1;
    if (to < 0) return;
    event.preventDefault();
    const next = items[to];
    if (!next) return;
    event.currentTarget.querySelectorAll<HTMLElement>('[data-index]')[to]?.focus();
    if (selectOnArrow) choose(next.id);
  };

  // Dragging the capsule: only a press inside the active slot can become one;
  // the list captures the pointer once it does, so the capsule follows a
  // finger that wanders off, and the click the browser fires after a release
  // is swallowed before it reaches a slot.
  const drag = useRef<DragState>({
    pointerId: null,
    startLocal: 0,
    grabOffset: 0,
    active: false,
    x: 0,
    dragged: false,
  });
  const localX = (event: PointerEvent<HTMLDivElement>): number =>
    event.clientX - event.currentTarget.getBoundingClientRect().left;
  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    const state = drag.current;
    state.dragged = false;
    if (event.button !== 0 || count === 0) return;
    const local = localX(event);
    const slotLeft = index * slotWidth;
    if (local < slotLeft || local > slotLeft + slotWidth) return;
    state.pointerId = event.pointerId;
    state.startLocal = local;
    state.grabOffset = local - (slotLeft + slotWidth / 2);
    state.active = false;
    state.x = slotLeft;
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const state = drag.current;
    if (state.pointerId !== event.pointerId) return;
    const local = localX(event);
    if (!state.active) {
      if (Math.abs(local - state.startLocal) < SLOP) return;
      state.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const centre = Math.min(
      Math.max(local - state.grabOffset, slotWidth / 2),
      Math.max(slotWidth / 2, rowWidth - slotWidth / 2),
    );
    state.x = centre - slotWidth / 2;
  };
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>): void => {
    const state = drag.current;
    if (state.pointerId !== event.pointerId) return;
    state.pointerId = null;
    if (!state.active) return;
    state.active = false;
    state.dragged = event.type === 'pointerup';
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    const nearest = items[Math.min(count - 1, Math.max(0, Math.round(state.x / slotWidth)))];
    if (nearest) choose(nearest.id);
  };
  const onClickCapture = (event: MouseEvent<HTMLDivElement>): void => {
    const state = drag.current;
    if (!state.dragged) return;
    state.dragged = false;
    event.stopPropagation();
    event.preventDefault();
  };

  const layer = 'pointer-events-none absolute inset-0 flex will-change-[clip-path]';
  const copies = (colour: string): ReactNode =>
    items.map((item) => (
      <span
        key={item.id}
        className={cn(SLOT, itemClassName, colour, item.disabled && 'opacity-40')}
      >
        {item.label}
      </span>
    ));

  return (
    <div
      ref={rootRef}
      data-slot={`${slot}-bar`}
      className={cn('pointer-events-auto relative', className)}
      style={{ ...style, height: `${height}px` }}
    >
      {pane ? <Pane width={barWidth} height={height} /> : null}
      <div className="absolute inset-0 flex items-stretch">
        {leading ? <div className="flex shrink-0 items-center">{leading}</div> : null}
        <div ref={rowRef} className="relative min-w-0 flex-1">
          <Highlight
            index={index}
            slotWidth={slotWidth}
            rowWidth={rowWidth}
            height={height}
            inset={pillInset}
            pillClassName={pillClassName}
            drag={drag}
            restLabels={restLabels}
            activeLabels={activeLabels}
          />
          {/* The slots. Real buttons or links: they keep the text for the
              reader and the box for the pointer and the focus ring, with their
              own copy invisible; the coloured copies below are what shows. */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: the role is always set, tablist, radiogroup or group; Biome cannot resolve it statically. */}
          {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: every one of those roles takes aria-label. */}
          <div
            role={listRole ?? 'group'}
            aria-label={label}
            onKeyDown={handleKey}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onClickCapture={onClickCapture}
            className="relative flex h-full w-full touch-none select-none"
          >
            {items.map((item, i) => {
              const selected = item.id === active;
              const shared = {
                'data-slot': `${slot}-item`,
                'data-index': i,
                'data-state': selected ? 'active' : 'inactive',
                className: cn(
                  SLOT,
                  itemClassName,
                  'opacity-0 outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/80',
                ),
                children: item.label,
              } as const;
              if (item.href) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    aria-current={selected ? 'page' : undefined}
                    aria-disabled={item.disabled || undefined}
                    onClick={() => choose(item.id)}
                    {...shared}
                  />
                );
              }
              return (
                <button
                  key={item.id}
                  type="button"
                  role={itemRole}
                  id={`${uid}-${slot}-${item.id}`}
                  {...state(itemRole, selected)}
                  tabIndex={itemRole ? (selected ? 0 : -1) : undefined}
                  disabled={item.disabled}
                  onClick={() => choose(item.id)}
                  {...shared}
                />
              );
            })}
          </div>
          <div
            ref={restLabels}
            aria-hidden="true"
            data-slot={`${slot}-labels`}
            className={layer}
            style={{ clipPath: outsideClip(rowWidth, height, resting) }}
          >
            {copies(inactiveClassName)}
          </div>
          <div
            ref={activeLabels}
            aria-hidden="true"
            data-slot={`${slot}-labels-active`}
            className={layer}
            style={{ clipPath: insideClip(resting) }}
          >
            {copies(activeClassName)}
          </div>
        </div>
        {trailing ? <div className="flex shrink-0 items-center">{trailing}</div> : null}
      </div>
    </div>
  );
}
