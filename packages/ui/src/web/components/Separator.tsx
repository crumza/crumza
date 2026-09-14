import type { ReactElement } from 'react';
import { cn } from '../cn';

export interface SeparatorProps {
  readonly orientation?: 'horizontal' | 'vertical' | undefined;
  /** Purely visual separators are hidden from assistive tech. */
  readonly decorative?: boolean | undefined;
  readonly className?: string | undefined;
}

export function Separator({
  orientation = 'horizontal',
  decorative = true,
  className,
}: SeparatorProps): ReactElement {
  return (
    <div
      data-slot="separator"
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'separator', 'aria-orientation': orientation })}
      className={cn(
        'shrink-0 bg-(--border)',
        orientation === 'horizontal'
          ? 'h-(--hairline) w-full'
          : 'h-full min-h-4 w-(--hairline) self-stretch',
        className,
      )}
    />
  );
}
