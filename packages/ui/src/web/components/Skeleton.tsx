import type { ComponentProps, ReactElement } from 'react';
import { cn } from '../cn';

export type SkeletonShape = 'block' | 'text' | 'circle';

export interface SkeletonProps extends Omit<ComponentProps<'div'>, 'children'> {
  readonly shape?: SkeletonShape | undefined;
  /** With `shape="text"`, how many lines to stand in for. The last one runs short, as prose does. */
  readonly lines?: number | undefined;
}

/**
 * The shape of content that does not exist yet, for a first paint. Size it with your own
 * utilities. For a wait over content that is already on screen, use Spinner: replacing what
 * someone is reading with grey blocks loses their place.
 *
 * Skeletons are decorative and hidden from assistive technology. Announce the wait once, on the
 * region they fill, rather than once per block.
 */
export function Skeleton({
  className,
  shape = 'block',
  lines = 3,
  ...props
}: SkeletonProps): ReactElement {
  if (shape === 'text') {
    const count = Math.max(1, Math.floor(lines));
    // Named up front: the lines are interchangeable and never reorder, so one stable key per
    // position is all they need, and the row itself carries no identity to lose.
    const rows = Array.from({ length: count }, (_, line) => `line-${line}`);
    return (
      <div
        aria-hidden="true"
        data-slot="skeleton"
        data-shape="text"
        className={cn('skeleton-text', className)}
        {...props}
      >
        {rows.map((row) => (
          <span key={row} className="skeleton" data-shape="line" />
        ))}
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      data-shape={shape}
      className={cn('skeleton', className)}
      {...props}
    />
  );
}
