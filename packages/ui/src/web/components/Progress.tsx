import type { ComponentProps, ReactElement } from 'react';
import { cn } from '../cn';

export interface ProgressProps extends ComponentProps<'div'> {
  /** 0 to 100. Omit for an indeterminate bar. */
  readonly value?: number | undefined;
}

/** Progress of a long task. Give it `aria-label`, and pair it with a Stop button when the task can be cancelled. */
export function Progress({ className, value, ...props }: ProgressProps): ReactElement {
  const clamped = value === undefined ? undefined : Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      {...(clamped === undefined ? { 'data-indeterminate': '' } : { 'aria-valuenow': clamped })}
      data-slot="progress"
      className={cn('progress', className)}
      {...props}
    >
      <div
        className="progress-fill"
        style={clamped === undefined ? undefined : { width: `${clamped}%` }}
      />
    </div>
  );
}
