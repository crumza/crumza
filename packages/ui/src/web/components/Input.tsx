import type { ComponentProps, ReactElement } from 'react';
import { cn } from '../cn';

export interface InputProps extends Omit<ComponentProps<'input'>, 'size'> {
  readonly size?: 'sm' | 'md' | 'lg' | undefined;
}

/** A native input with the field treatment: hairline at rest, stronger on hover, accent on focus. */
export function Input({ className, size = 'md', ...props }: InputProps): ReactElement {
  return (
    <input
      data-slot="input"
      className={cn(
        'field w-full min-w-0 px-3',
        size === 'sm' && 'h-(--control-sm) text-ui-sm',
        size === 'md' && 'h-(--control-md) text-ui',
        size === 'lg' && 'h-(--control-lg) text-ui',
        className,
      )}
      {...props}
    />
  );
}
