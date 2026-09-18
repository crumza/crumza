import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { useControllableState } from '../../core/use-controllable-state';
import { cn } from '../cn';
import { useLiquixBox } from '../liquix/box';
import { type Capsule, insideClip, outsideClip } from '../liquix/clip';
import { type LiquixLensStyle, LiquixMotion, shapeFrame } from '../liquix/motion';
import { useBloom } from '../liquix/use-bloom';
import { useMeasure } from '../liquix/use-measure';
import { LiquixButton, type LiquixButtonSize } from './LiquixButton';

export interface LiquixMenuItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly disabled?: boolean | undefined;
}

export interface LiquixMenuProps {
  readonly items: readonly LiquixMenuItem[];
  readonly onSelect: (id: string) => void;
  /** The trigger's label; the trigger is a LiquixButton. */
  readonly label: ReactNode;
  readonly size?: LiquixButtonSize | undefined;
  readonly align?: 'start' | 'end' | undefined;
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /** Classes on the panel. Sets its width, 14rem by default. */
  readonly className?: string | undefined;
  /** Classes for an item's label where the highlight is, and elsewhere. */
  readonly activeClassName?: string | undefined;
  readonly inactiveClassName?: string | undefined;
}

const RADIUS = 18;
const PAD = 6;
const ROW = 38;
const HIGHLIGHT: LiquixLensStyle = {
  liftWidth: 8,
  liftHeight: 8,
  liftShadow: 20,
  lens: 0.34,
  stretch: 0.14,
  pinch: 0.08,
  fullSpeed: 900,
};

/**
 * A dropdown of glass. The panel blooms from its trigger on a spring, and a
 * capsule of glass travels between items as the pointer or the arrow keys
 * move, their labels changing colour under it; it settles flat wherever it
 * stops. Enter or a click chooses, Escape and a click outside close.
 */
export function LiquixMenu({
  items,
  onSelect,
  label,
  size = 'md',
  align = 'start',
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  activeClassName = 'text-blue-600',
  inactiveClassName = 'liquix-ink',
}: LiquixMenuProps): ReactElement {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const uid = useId();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const restLabels = useRef<HTMLDivElement | null>(null);
  const activeLabels = useRef<HTMLDivElement | null>(null);
  const pane = useLiquixBox(0);
  const highlight = useLiquixBox(1);
  const blobRef = useRef<HTMLDivElement | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const cursorRef = useRef<number | null>(null);
  cursorRef.current = cursor;
  const motion = useRef(new LiquixMotion());
  const started = useRef(false);

  // The panel's box, measured once it is in the DOM; the frame reads it off a
  // ref so a resize needs no new callback.
  const boxRef = useRef({ width: 0, height: 0 });
  const onFrame = useCallback(
    (progress: number) => {
      const element = pane.elementRef.current;
      if (!element) return;
      const scale = 0.92 + 0.08 * progress;
      element.style.opacity = progress.toFixed(3);
      element.style.transform = `scale(${scale.toFixed(4)})`;
      const entry = pane.entryRef.current;
      entry.shape = {
        width: boxRef.current.width * scale,
        height: boxRef.current.height * scale,
        cornerRadius: RADIUS * scale,
        roundness: 3,
      };
      entry.alpha = progress;
      entry.clarity = progress;
      entry.bevel = 14;
    },
    [pane.elementRef, pane.entryRef],
  );
  const mounted = useBloom(isOpen, onFrame);
  const box = useMeasure(pane.elementRef, { width: 0, height: 0 }, mounted);
  boxRef.current = box;
  useEffect(() => {
    if (mounted) return;
    const entry = pane.entryRef.current;
    entry.shape = { width: 0, height: 0, cornerRadius: 0, roundness: 3 };
    entry.alpha = 0;
  }, [mounted, pane.entryRef]);

  // The highlight travels to the item under the cursor; the first move after
  // opening goes straight there.
  useEffect(() => {
    if (!mounted) {
      started.current = false;
      return;
    }
    const m = motion.current;
    const y = PAD + (cursor ?? 0) * ROW;
    if (!started.current || cursor === null) {
      m.jump(0, y);
      started.current = true;
    } else m.target(0, y);
  }, [cursor, mounted]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the refs from useLiquixBox never change; mounted restarts the loop.
  useEffect(() => {
    const element = highlight.elementRef.current;
    if (!element || !mounted) return;
    const entry = highlight.entryRef.current;
    const stage = highlight.stage;
    const m = motion.current;
    let registered = stage !== null;
    const width = box.width - PAD * 2;
    let raf = 0;
    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      const frame = m.step(time);
      const shape = shapeFrame(entry, frame, { width, height: ROW - 4 }, HIGHLIGHT);
      const shown = cursorRef.current !== null;
      entry.alpha = shown ? frame.glass : 0;
      if (stage && (m.visible && shown) !== registered) {
        registered = m.visible && shown;
        if (registered) stage.register(entry);
        else stage.unregister(entry);
      }
      element.style.transform = `translateY(${frame.y.toFixed(2)}px)`;
      if (blobRef.current) {
        blobRef.current.style.transform = element.style.transform;
        blobRef.current.style.opacity = shown ? (1 - frame.glass).toFixed(3) : '0';
      }
      const capsule: Capsule = shown
        ? { cx: box.width / 2, cy: frame.y + ROW / 2, w: shape.width, h: shape.height }
        : { cx: -1000, cy: -1000, w: 1, h: 1 };
      if (activeLabels.current) activeLabels.current.style.clipPath = insideClip(capsule);
      if (restLabels.current)
        restLabels.current.style.clipPath = outsideClip(box.width, box.height, capsule);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mounted, box.width, box.height, highlight.stage]);

  // Escape and a press outside close; focus returns to the trigger.
  useEffect(() => {
    if (!isOpen) return;
    const onPress = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPress);
    return () => document.removeEventListener('pointerdown', onPress);
  }, [isOpen, setOpen]);
  // The list mounts a render after `open` flips, so focus waits for it.
  const focusFirst = (): void => {
    listRef.current
      ?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
      ?.focus();
  };
  useEffect(() => {
    if (isOpen && mounted) {
      listRef.current
        ?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
        ?.focus();
    }
  }, [isOpen, mounted]);
  useEffect(() => {
    if (isOpen) return;
    setCursor(null);
    if (started.current) triggerRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);
  const choose = (index: number): void => {
    const item = items[index];
    if (!item || item.disabled) return;
    onSelect(item.id);
    setOpen(false);
  };
  const focusItem = (index: number): void => {
    setCursor(index);
    listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')[index]?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (enabled.length === 0) return;
    const at = cursor === null ? -1 : enabled.indexOf(cursor);
    let to: number | undefined;
    if (event.key === 'ArrowDown') to = enabled[(at + 1) % enabled.length];
    else if (event.key === 'ArrowUp') to = enabled[(at - 1 + enabled.length) % enabled.length];
    else if (event.key === 'Home') to = enabled[0];
    else if (event.key === 'End') to = enabled[enabled.length - 1];
    else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    } else if ((event.key === 'Enter' || event.key === ' ') && cursor !== null) {
      event.preventDefault();
      choose(cursor);
      return;
    }
    if (to === undefined) return;
    event.preventDefault();
    focusItem(to);
  };

  const highlightBox: CSSProperties = {
    left: `${PAD}px`,
    top: '2px',
    width: `${Math.max(0, box.width - PAD * 2)}px`,
    height: `${ROW - 4}px`,
    borderRadius: `${(ROW - 4) / 2}px`,
  };
  const row = 'flex h-[38px] items-center px-3.5 text-[13px] font-medium';
  const copies = (colour: string): ReactNode => (
    <div className="flex flex-col" style={{ padding: `${PAD}px` }}>
      {items.map((item) => (
        <span key={item.id} className={cn(row, colour, item.disabled && 'opacity-40')}>
          {item.label}
        </span>
      ))}
    </div>
  );

  return (
    <div ref={wrapRef} data-slot="liquix-menu" className="pointer-events-auto relative inline-flex">
      <LiquixButton
        ref={triggerRef}
        size={size}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={mounted ? `${uid}-menu` : undefined}
        onClick={() => setOpen(!isOpen)}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown') return;
          event.preventDefault();
          if (isOpen) focusFirst();
          else setOpen(true);
        }}
      >
        {label}
      </LiquixButton>
      {mounted ? (
        <div
          ref={pane.elementRef}
          data-slot="liquix-menu-panel"
          data-fallback={pane.fallback ? '' : undefined}
          style={{
            top: 'calc(100% + 8px)',
            ...(align === 'end' ? { right: 0 } : { left: 0 }),
            transformOrigin: `${align === 'end' ? 'right' : 'left'} top`,
            borderRadius: `${RADIUS}px`,
            opacity: 0,
          }}
          className={cn(
            'absolute z-10 w-56 will-change-transform',
            pane.fallback && 'liquix-glass-pane',
            className,
          )}
        >
          <div
            ref={blobRef}
            aria-hidden="true"
            data-slot="liquix-menu-pill"
            style={highlightBox}
            className="liquix-pill absolute opacity-0 will-change-transform"
          />
          <div
            ref={highlight.elementRef}
            aria-hidden="true"
            data-slot="liquix-menu-highlight"
            style={highlightBox}
            className={cn(
              'absolute will-change-transform',
              highlight.fallback && 'liquix-glass-lens',
            )}
          />
          {/* The items: real buttons for the reader, the keyboard and the
              pointer, their own labels invisible; the coloured copies show. */}
          <div
            ref={listRef}
            id={`${uid}-menu`}
            role="menu"
            aria-label={typeof label === 'string' ? label : undefined}
            className="relative flex flex-col"
            style={{ padding: `${PAD}px` }}
            onKeyDown={onKeyDown}
            onPointerLeave={() => setCursor(null)}
          >
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                tabIndex={-1}
                aria-disabled={item.disabled || undefined}
                data-slot="liquix-menu-item"
                className={cn(
                  row,
                  'rounded-full text-left opacity-0 outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/80',
                  item.disabled && 'cursor-default',
                )}
                onPointerEnter={() => !item.disabled && setCursor(i)}
                onFocus={() => !item.disabled && setCursor(i)}
                onClick={() => choose(i)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div
            ref={restLabels}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 will-change-[clip-path]"
          >
            {copies(inactiveClassName)}
          </div>
          <div
            ref={activeLabels}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 will-change-[clip-path]"
            style={{ clipPath: 'polygon(0 0, 0 0, 0 0)' }}
          >
            {copies(activeClassName)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
