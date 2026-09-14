import type { ComponentProps, ReactElement } from 'react';
import { useControllableState } from '../../core/use-controllable-state';
import { cn } from '../cn';

export interface ToggleProps extends Omit<ComponentProps<'button'>, 'onChange'> {
  readonly pressed?: boolean | undefined;
  readonly defaultPressed?: boolean | undefined;
  readonly onPressedChange?: ((pressed: boolean) => void) | undefined;
  readonly size?: 'sm' | 'md' | undefined;
}

/** A two-state button (`aria-pressed`). Bold, italic, grid on and off. */
export function Toggle({
  className,
  pressed,
  defaultPressed = false,
  onPressedChange,
  size = 'md',
  onClick,
  ...props
}: ToggleProps): ReactElement {
  const [current, set] = useControllableState({
    value: pressed,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
  });
  return (
    <button
      type="button"
      data-slot="toggle"
      aria-pressed={current}
      onClick={(e) => {
        onClick?.(e);
        set(!current);
      }}
      className={cn(
        'inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-field squircle px-2 text-ui leading-none',
        'transition-[background-color,color] duration-(--duration-fast) focus-visible:focus-outline outline-none',
        'disabled:pointer-events-none disabled:opacity-45',
        current
          ? 'bg-foreground/10 text-foreground'
          : 'text-muted-foreground hover:bg-foreground/6 hover:text-foreground',
        size === 'sm'
          ? 'h-(--control-sm) min-w-(--control-sm)'
          : 'h-(--control-md) min-w-(--control-md)',
        className,
      )}
      {...props}
    />
  );
}
