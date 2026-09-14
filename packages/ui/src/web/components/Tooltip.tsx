import {
  type PointerEvent as ReactPointerEvent,
  cloneElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type { Align, Side } from '../../core/position';
import { cn } from '../cn';
import { composeRefs } from '../primitives/compose-refs';
import { mergeProps, refOf } from '../primitives/merge-props';
import { useAnchorPosition } from '../primitives/use-anchor-position';

export interface TooltipProps {
  readonly content: ReactNode;
  /** The single element that gets the tooltip. It must accept a ref and pointer/focus handlers. */
  readonly children: ReactElement;
  readonly side?: Side | undefined;
  readonly align?: Align | undefined;
  /** Hover delay before showing. Focus shows immediately. */
  readonly delay?: number | undefined;
  readonly className?: string | undefined;
}

/** Moving straight from one tooltip to another skips the delay, like a native toolbar. */
let lastClosedAt = 0;
const SKIP_DELAY_WINDOW = 300;

/** A short label on hover or focus. Never interactive, never essential: it repeats what `aria-label` says. */
export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delay = 500,
  className,
}: TooltipProps): ReactElement {
  const id = useId();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLElement | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useAnchorPosition({ open, anchor: anchorRef, floating: ref, side, align, offset: 6 });

  const show = useCallback(
    (immediate: boolean) => {
      clearTimeout(timer.current);
      const wait = immediate || Date.now() - lastClosedAt < SKIP_DELAY_WINDOW ? 0 : delay;
      timer.current = setTimeout(() => setOpen(true), wait);
    },
    [delay],
  );
  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setOpen((was) => {
      if (was) lastClosedAt = Date.now();
      return false;
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const shown = el.matches(':popover-open');
    if (open && !shown) el.showPopover();
    else if (!open && shown) el.hidePopover();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') hide();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, hide]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const triggerProps: Record<string, unknown> = {
    ...mergeProps(children.props as Record<string, unknown>, {
      'aria-describedby': open ? id : undefined,
      onPointerEnter: (e: ReactPointerEvent) => {
        if (e.pointerType !== 'touch') show(false);
      },
      onPointerLeave: hide,
      onPointerDown: hide,
      onFocus: () => show(true),
      onBlur: hide,
    }),
    ref: composeRefs(refOf<HTMLElement>(children.props), anchorRef),
  };
  const trigger = cloneElement(children, triggerProps);

  return (
    <>
      {trigger}
      <div
        ref={ref}
        id={id}
        role="tooltip"
        popover="manual"
        data-slot="tooltip"
        className={cn('tooltip-content', className)}
      >
        {content}
      </div>
    </>
  );
}
