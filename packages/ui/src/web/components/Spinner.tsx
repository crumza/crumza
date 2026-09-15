import type { ComponentProps, ReactElement } from 'react';
import { cn } from '../cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends Omit<ComponentProps<'span'>, 'children'> {
  readonly size?: SpinnerSize | undefined;
  /** Announced while the work runs. Omit when visible text beside the spinner already names the wait. */
  readonly label?: string | undefined;
}

/**
 * An indeterminate wait of unknown length. When you know how far along the work is, use Progress,
 * and for content that does not exist yet use Skeleton.
 *
 * Without a `label` the spinner is decorative and hidden from assistive technology, which is what
 * you want beside text that already says what is happening.
 */
export function Spinner({ className, size = 'md', label, ...props }: SpinnerProps): ReactElement {
  const named =
    label !== undefined ||
    props['aria-label'] !== undefined ||
    props['aria-labelledby'] !== undefined;
  return (
    <span
      {...(named ? { role: 'status' } : { 'aria-hidden': true })}
      data-slot="spinner"
      data-size={size}
      className={cn('spinner', className)}
      {...props}
    >
      {/* One arc over a quiet ring, in currentColor, so a spinner inside a button
          picks up that button's label colour without being told. */}
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="spinner-ring">
        <circle className="spinner-track" cx="8" cy="8" r="6.25" />
        <circle className="spinner-head" cx="8" cy="8" r="6.25" />
      </svg>
      {label === undefined ? null : <span className="sr-only">{label}</span>}
    </span>
  );
}
