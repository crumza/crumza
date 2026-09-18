import type { ComponentProps, ReactElement } from 'react';
import { cn } from '../cn';
import { useLiquixBox } from '../liquix/box';
import { useMeasure } from '../liquix/use-measure';
import { composeRefs } from '../primitives/compose-refs';

export type LiquixButtonSize = 'sm' | 'md' | 'lg';

export interface LiquixButtonProps extends Omit<ComponentProps<'button'>, 'style'> {
  /** sm is 36px tall, md 44px, lg 52px. */
  readonly size?: LiquixButtonSize | undefined;
  /** Corner radius in CSS px. A capsule, half the height, by default. */
  readonly radius?: number | undefined;
  /** Superellipse exponent: 2 is a circular corner, 4 to 6 squares it off. */
  readonly roundness?: number | undefined;
  /**
   * The draw layer, 0 by default. Glass on the same layer merges into one
   * field, so a button sitting on another pane of glass takes layer 1 to stay
   * a shape of its own.
   */
  readonly layer?: number | undefined;
}

const SIZES: Record<LiquixButtonSize, string> = {
  sm: 'h-9 px-4 text-[12px]',
  md: 'h-11 px-5 text-[13px]',
  lg: 'h-13 px-6 text-[14px]',
};

/**
 * A button of glass for a LiquixSurface overlay. It sizes to its label, and
 * the shader draws the glass to that box: pressing squashes it and lights the
 * rim, hovering lifts it a little, both eased by the surface's own loop so
 * every glass shape on the surface responds alike. Elsewhere it is CSS glass
 * with the same timings.
 */
export function LiquixButton({
  size = 'md',
  radius,
  roundness = 2,
  layer = 0,
  className,
  children,
  type = 'button',
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onFocus,
  onBlur,
  ref,
  ...props
}: LiquixButtonProps): ReactElement {
  const { elementRef, entryRef, fallback } = useLiquixBox<HTMLButtonElement>(layer);
  const box = useMeasure(elementRef);
  const corner = radius ?? box.height / 2;
  const entry = entryRef.current;
  entry.shape = { width: box.width, height: box.height, cornerRadius: corner, roundness };
  entry.bevel = Math.min(16, box.height * 0.35);

  const interact = (state: 'idle' | 'hover' | 'press'): void => {
    entry.scaleTarget = state === 'press' ? 0.96 : state === 'hover' ? 1.03 : 1;
    entry.glowTarget = state === 'press' ? 1 : state === 'hover' ? 0.4 : 0;
  };

  return (
    <button
      {...props}
      ref={composeRefs(elementRef, ref)}
      type={type}
      data-slot="liquix-button"
      data-fallback={fallback ? '' : undefined}
      style={{ borderRadius: `${corner}px` }}
      className={cn(
        'liquix-ink pointer-events-auto inline-flex items-center justify-center gap-2 font-semibold tracking-[0.02em] select-none whitespace-nowrap',
        'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-default disabled:opacity-50',
        SIZES[size],
        fallback &&
          'liquix-glass-lens transition-transform duration-150 ease-out hover:scale-[1.03] active:scale-[0.96] disabled:hover:scale-100',
        className,
      )}
      onPointerEnter={(event) => {
        interact('hover');
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        interact('idle');
        onPointerLeave?.(event);
      }}
      onPointerDown={(event) => {
        interact('press');
        onPointerDown?.(event);
      }}
      onPointerUp={(event) => {
        interact('hover');
        onPointerUp?.(event);
      }}
      onPointerCancel={(event) => {
        interact('idle');
        onPointerCancel?.(event);
      }}
      onFocus={(event) => {
        interact('hover');
        onFocus?.(event);
      }}
      onBlur={(event) => {
        interact('idle');
        onBlur?.(event);
      }}
    >
      {children}
    </button>
  );
}
