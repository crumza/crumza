import type { ComponentProps, ReactElement } from 'react';
import { cn } from '../cn';

/** An opaque content surface: one step up from the canvas, separated by a hairline. Not glass. */
export function Card({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot="card"
      className={cn(
        'rounded-surface squircle border border-(--border) bg-card text-card-foreground',
        className,
      )}
      {...props}
    />
  );
}
