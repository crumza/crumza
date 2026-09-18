import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { cn } from '../cn';
import { useLiquixBox } from '../liquix/box';
import { useMeasure } from '../liquix/use-measure';

export type LiquixFieldSize = 'sm' | 'md' | 'lg';

export interface LiquixFieldProps extends Omit<ComponentProps<'input'>, 'size' | 'style'> {
  /** sm is 36px tall, md 44px, lg 52px. */
  readonly size?: LiquixFieldSize | undefined;
  /** An icon or prefix inside the trough, before the text. */
  readonly leading?: ReactNode | undefined;
  /** A button or suffix inside the trough, after the text. */
  readonly trailing?: ReactNode | undefined;
  /** Classes on the trough. Give it a width; the input fills it. */
  readonly className?: string | undefined;
  /** Classes on the input itself. */
  readonly inputClassName?: string | undefined;
}

const SIZES: Record<LiquixFieldSize, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-4 text-[14px]',
  lg: 'h-13 px-5 text-[15px]',
};

/**
 * A text field in a trough of glass, for a LiquixSurface overlay. The input
 * is live inside it, caret and selection included; the trough is drawn by the
 * shader to the measured box, and focusing lights its rim. Elsewhere it is
 * CSS glass with a focus ring.
 */
export function LiquixField({
  size = 'md',
  leading,
  trailing,
  className,
  inputClassName,
  onFocus,
  onBlur,
  onPointerEnter,
  onPointerLeave,
  ...props
}: LiquixFieldProps): ReactElement {
  const { elementRef, entryRef, fallback } = useLiquixBox(0);
  const box = useMeasure(elementRef);
  const entry = entryRef.current;
  entry.shape = {
    width: box.width,
    height: box.height,
    cornerRadius: box.height / 2,
    roundness: 2,
  };
  entry.bevel = Math.min(16, box.height * 0.35);

  const glow = (state: 'idle' | 'hover' | 'focus'): void => {
    entry.glowTarget = state === 'focus' ? 0.6 : state === 'hover' ? 0.25 : 0;
  };

  return (
    <div
      ref={elementRef}
      data-slot="liquix-field"
      data-fallback={fallback ? '' : undefined}
      style={{ borderRadius: `${box.height / 2}px` }}
      className={cn(
        'pointer-events-auto flex items-center gap-2 rounded-full',
        'focus-within:ring-2 focus-within:ring-white/70',
        SIZES[size],
        fallback && 'liquix-glass-pane',
        className,
      )}
    >
      {leading ? (
        <span className="liquix-ink flex shrink-0 items-center opacity-80">{leading}</span>
      ) : null}
      <input
        {...props}
        className={cn(
          'liquix-ink min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-white/60',
          inputClassName,
        )}
        onFocus={(event) => {
          glow('focus');
          onFocus?.(event);
        }}
        onBlur={(event) => {
          glow('idle');
          onBlur?.(event);
        }}
        onPointerEnter={(event) => {
          if (document.activeElement !== event.currentTarget) glow('hover');
          onPointerEnter?.(event);
        }}
        onPointerLeave={(event) => {
          if (document.activeElement !== event.currentTarget) glow('idle');
          onPointerLeave?.(event);
        }}
      />
      {trailing ? <span className="flex shrink-0 items-center">{trailing}</span> : null}
    </div>
  );
}
