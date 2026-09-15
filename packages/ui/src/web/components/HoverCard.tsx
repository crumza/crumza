import {
  type ComponentProps,
  cloneElement,
  createContext,
  type ReactElement,
  type FocusEvent as ReactFocusEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import type { Align, Side } from '../../core/position';
import { useControllableState } from '../../core/use-controllable-state';
import { cn } from '../cn';
import { composeRefs } from '../primitives/compose-refs';
import { mergeProps, refOf } from '../primitives/merge-props';
import { useAnchorPosition } from '../primitives/use-anchor-position';

interface HoverCardContext {
  readonly id: string;
  readonly open: boolean;
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly contentRef: RefObject<HTMLDivElement | null>;
  /** Open after the hover dwell, or at once if a card was just showing. */
  readonly hoverOpen: () => void;
  /** Close after the grace period, so the pointer can cross the gap to the card. */
  readonly hoverClose: () => void;
  /** Open or close with no delay, for focus, Escape, and re-entering a closing card. */
  readonly openNow: () => void;
  readonly closeNow: () => void;
  /** The pointer that last pressed the trigger, so a focus it caused can be told from a keyboard one. */
  readonly pointerRef: RefObject<{ readonly type: string; readonly at: number } | null>;
}
const Ctx = createContext<HoverCardContext | null>(null);

function useHoverCard(part: string): HoverCardContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> must be inside <HoverCard>`);
  return ctx;
}

/**
 * Reading a second card after a first skips the dwell, the way a menu bar stops asking once
 * it is open: the delay is there to ignore a pointer passing through, not to slow down someone
 * who is plainly reading. Shared across every hover card on the page, like Tooltip's.
 */
let lastClosedAt = 0;
const SKIP_DELAY_WINDOW = 300;
/* Android focuses a button on tap and the focus lands well inside this window; a keyboard user
   who tapped something earlier has moved on long before it closes. */
const TOUCH_FOCUS_WINDOW = 500;

/** Whether focus or the pointer went to somewhere the card counts as its own. */
function movedInside(event: ReactFocusEvent, ...parts: ReadonlyArray<Node | null>): boolean {
  const next = event.relatedTarget;
  if (!(next instanceof Node)) return false;
  return parts.some((part) => part?.contains(next) === true);
}

export interface HoverCardProps {
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /** Hover dwell before the card opens. Focus, and a card read moments ago, skip it. */
  readonly openDelay?: number | undefined;
  /** Grace period after the pointer leaves, long enough to cross the gap to the card. */
  readonly closeDelay?: number | undefined;
  readonly children: ReactNode;
}

/**
 * A card of detail about its trigger, shown on hover or focus: a profile, a preview, a
 * definition. Unlike Tooltip the card is interactive, so the pointer can travel into it.
 * Supplementary by nature: a touch pointer never opens it, so nothing essential goes inside.
 */
export function HoverCard({
  open,
  defaultOpen = false,
  onOpenChange,
  openDelay = 120,
  closeDelay = 200,
  children,
}: HoverCardProps): ReactElement {
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<{ readonly type: string; readonly at: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  // Only a card that was actually showing stamps the skip window; a dwell the pointer
  // abandoned before anything appeared must not buy the next hover a free pass.
  const shown = useRef(isOpen);
  shown.current = isOpen;

  const schedule = useCallback(
    (next: boolean, wait: number) => {
      // One timer for both directions: entering the card cancels the close it was crossing.
      clearTimeout(timer.current);
      const commit = (): void => {
        if (!next && shown.current) lastClosedAt = Date.now();
        setOpen(next);
      };
      if (wait <= 0) {
        commit();
        return;
      }
      timer.current = setTimeout(commit, wait);
    },
    [setOpen],
  );
  useEffect(() => () => clearTimeout(timer.current), []);

  const ctx = useMemo(
    () => ({
      id,
      open: isOpen,
      triggerRef,
      contentRef,
      pointerRef,
      hoverOpen: () =>
        schedule(true, Date.now() - lastClosedAt < SKIP_DELAY_WINDOW ? 0 : openDelay),
      hoverClose: () => schedule(false, closeDelay),
      openNow: () => schedule(true, 0),
      closeNow: () => schedule(false, 0),
    }),
    [id, isOpen, schedule, openDelay, closeDelay],
  );
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export interface HoverCardTriggerProps extends ComponentProps<'button'> {
  /** Render this element instead of a plain button, e.g. `render={<Button variant="ghost" />}`. */
  readonly render?: ReactElement | undefined;
}

export function HoverCardTrigger({
  render,
  ref: forwardedRef,
  ...props
}: HoverCardTriggerProps): ReactElement {
  const { id, open, triggerRef, contentRef, pointerRef, hoverOpen, hoverClose, openNow, closeNow } =
    useHoverCard('HoverCardTrigger');
  const own = {
    'aria-expanded': open,
    'aria-haspopup': 'dialog' as const,
    'aria-controls': id,
    'data-state': open ? 'open' : 'closed',
    'data-slot': 'hover-card-trigger',
    onPointerEnter: (event: ReactPointerEvent) => {
      // A touch pointer fires enter on tap and never leaves; hovering is a mouse idea.
      if (event.pointerType !== 'touch') hoverOpen();
    },
    onPointerLeave: (event: ReactPointerEvent) => {
      if (event.pointerType !== 'touch') hoverClose();
    },
    onPointerDown: (event: ReactPointerEvent) => {
      pointerRef.current = { type: event.pointerType, at: Date.now() };
    },
    onFocus: () => {
      // Android focuses a tapped button. That focus is the tap, not a keyboard arriving, and a
      // card a touch pointer opened is one it cannot close by leaving, because it never left.
      const press = pointerRef.current;
      if (press?.type === 'touch' && Date.now() - press.at < TOUCH_FOCUS_WINDOW) return;
      openNow();
    },
    onBlur: (event: ReactFocusEvent) => {
      // Tab moves from the trigger into the card, which is not leaving.
      if (!movedInside(event, contentRef.current)) closeNow();
    },
  };
  if (render) {
    const merged = mergeProps(render.props as Record<string, unknown>, own, props);
    merged['ref'] = composeRefs(refOf<HTMLElement>(render.props), triggerRef, forwardedRef);
    return cloneElement(render, merged);
  }
  return (
    <button type="button" ref={composeRefs(triggerRef, forwardedRef)} {...mergeProps(own, props)} />
  );
}

export interface HoverCardContentProps extends ComponentProps<'div'> {
  readonly side?: Side | undefined;
  readonly align?: Align | undefined;
  readonly offset?: number | undefined;
}

export function HoverCardContent({
  className,
  side = 'bottom',
  align = 'center',
  offset = 8,
  children,
  ref: forwardedRef,
  ...props
}: HoverCardContentProps): ReactElement {
  const { id, open, triggerRef, contentRef, hoverClose, openNow, closeNow } =
    useHoverCard('HoverCardContent');
  useAnchorPosition({ open, anchor: triggerRef, floating: contentRef, side, align, offset });

  // `manual` rather than `auto`: an auto popover would dismiss the menu or popover the trigger
  // sits in the moment the pointer passed over it. Escape below does the dismissing instead.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const shown = el.matches(':popover-open');
    if (open && !shown) el.showPopover();
    else if (!open && shown) el.hidePopover();
  }, [open, contentRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeNow();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, closeNow]);

  const own = {
    onPointerEnter: (event: ReactPointerEvent) => {
      // Catching the card mid-fade brings it straight back, so the exit is never a trap.
      if (event.pointerType !== 'touch') openNow();
    },
    onPointerLeave: (event: ReactPointerEvent) => {
      if (event.pointerType !== 'touch') hoverClose();
    },
    onBlur: (event: ReactFocusEvent) => {
      if (!movedInside(event, contentRef.current, triggerRef.current)) closeNow();
    },
  };

  return (
    <div
      ref={composeRefs(contentRef, forwardedRef)}
      id={id}
      popover="manual"
      role="dialog"
      data-slot="hover-card-content"
      data-state={open ? 'open' : 'closed'}
      className={cn('hover-card-content squircle text-ui', className)}
      {...mergeProps(own, props)}
    >
      {children}
    </div>
  );
}
