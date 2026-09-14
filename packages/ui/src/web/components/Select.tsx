import type { ComponentProps, ReactElement } from 'react';
import { cn } from '../cn';

export interface SelectProps extends Omit<ComponentProps<'select'>, 'size'> {
  readonly size?: 'sm' | 'md' | 'lg' | undefined;
}

/** The native select with the field treatment. The popup is the OS's, which is the right call for forms. */
export function Select({ className, size = 'md', ...props }: SelectProps): ReactElement {
  return (
    <span data-slot="select" className={cn('relative inline-grid w-full min-w-0', className)}>
      <select
        className={cn(
          'field w-full cursor-pointer appearance-none pr-8 pl-3',
          size === 'sm' && 'h-(--control-sm) text-ui-sm',
          size === 'md' && 'h-(--control-md) text-ui',
          size === 'lg' && 'h-(--control-lg) text-ui',
        )}
        {...props}
      />
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
      >
        <path d="M4 6.5 8 10.5 12 6.5" />
      </svg>
    </span>
  );
}
