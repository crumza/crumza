import {
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';
import { useControllableState } from '../../core/use-controllable-state';
import { cn } from '../cn';
import { useLiquixBox } from '../liquix/box';
import { useBloom } from '../liquix/use-bloom';
import { useMeasure } from '../liquix/use-measure';

export interface LiquixPopoverProps {
  /** The trigger. Focusable content, a LiquixButton say, so the keyboard reaches it too. */
  readonly children: ReactNode;
  readonly content: ReactNode;
  readonly side?: 'top' | 'bottom' | undefined;
  readonly align?: 'start' | 'center' | 'end' | undefined;
  /** CSS px between the trigger and the bubble. */
  readonly offset?: number | undefined;
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /** Classes on the bubble. Give it a width for long content. */
  readonly className?: string | undefined;
}

const RADIUS = 16;

/**
 * A bubble of glass that appears over its trigger while the pointer is on it
 * or it has focus, for a LiquixSurface overlay. It blooms from the trigger on
 * a spring, arriving as frosted glass that clears, and shrinks back the same
 * way. The bubble stays inside the surface, where the shader can draw it.
 */
export function LiquixPopover({
  children,
  content,
  side = 'top',
  align = 'center',
  offset = 8,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
}: LiquixPopoverProps): ReactElement {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const id = useId();
  const { elementRef, entryRef, fallback } = useLiquixBox(0);
  const hideTimer = useRef(0);
  // The bubble's box, measured once it is in the DOM and read off a ref each frame.
  const boxRef = useRef({ width: 0, height: 0 });

  const onFrame = useCallback(
    (progress: number) => {
      const element = elementRef.current;
      if (!element) return;
      const scale = 0.9 + 0.1 * progress;
      element.style.opacity = progress.toFixed(3);
      element.style.transform = `${align === 'center' ? 'translateX(-50%) ' : ''}scale(${scale.toFixed(4)})`;
      const entry = entryRef.current;
      const box = boxRef.current;
      entry.shape = {
        width: box.width * scale,
        height: box.height * scale,
        cornerRadius: RADIUS * scale,
        roundness: 3,
      };
      entry.alpha = progress;
      entry.clarity = progress;
      entry.bevel = Math.min(16, box.height * 0.3);
    },
    [align, elementRef, entryRef],
  );
  const mounted = useBloom(isOpen, onFrame);
  boxRef.current = useMeasure(elementRef, { width: 0, height: 0 }, mounted);

  // Once the bubble has gone there is no glass to draw.
  useEffect(() => {
    if (mounted) return;
    const entry = entryRef.current;
    entry.shape = { width: 0, height: 0, cornerRadius: 0, roundness: 3 };
    entry.alpha = 0;
  }, [mounted, entryRef]);
  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const show = (): void => {
    window.clearTimeout(hideTimer.current);
    setOpen(true);
  };
  // A beat before hiding, so the pointer can cross the gap to the bubble.
  const hide = (): void => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  const place: CSSProperties = {
    ...(side === 'top'
      ? { bottom: `calc(100% + ${offset}px)` }
      : { top: `calc(100% + ${offset}px)` }),
    ...(align === 'start' ? { left: 0 } : align === 'end' ? { right: 0 } : { left: '50%' }),
    transformOrigin: `${align === 'start' ? 'left' : align === 'end' ? 'right' : 'center'} ${side === 'top' ? 'bottom' : 'top'}`,
    borderRadius: `${RADIUS}px`,
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the trigger inside is the control; this only listens to hover and focus around it.
    <span
      data-slot="liquix-popover"
      className="pointer-events-auto relative inline-flex"
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={mounted ? id : undefined}
    >
      {children}
      {mounted ? (
        <div
          ref={elementRef}
          id={id}
          role="tooltip"
          data-slot="liquix-popover-bubble"
          data-fallback={fallback ? '' : undefined}
          style={{ ...place, opacity: 0 }}
          className={cn(
            'liquix-ink absolute z-10 min-w-max px-3.5 py-2.5 text-[13px] leading-snug will-change-transform',
            fallback && 'liquix-glass-pane',
            className,
          )}
        >
          {content}
        </div>
      ) : null}
    </span>
  );
}
