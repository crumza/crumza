import type { ReactElement, ReactNode } from 'react';
import { cn } from '../cn';
import { Label } from './Label';

export interface FieldProps {
  readonly label?: ReactNode;
  readonly htmlFor?: string | undefined;
  readonly description?: ReactNode;
  readonly error?: ReactNode;
  readonly required?: boolean | undefined;
  readonly className?: string | undefined;
  readonly children: ReactNode;
}

/** Label, control, then a description or an error. Set `aria-invalid` on the control when `error` is set. */
export function Field({
  label,
  htmlFor,
  description,
  error,
  required = false,
  className,
  children,
}: FieldProps): ReactElement {
  return (
    <div data-slot="field" className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <Label {...(htmlFor ? { htmlFor } : {})}>
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </Label>
      ) : null}
      {children}
      {description && !error ? (
        <p className="text-ui-sm text-muted-foreground">{description}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-ui-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
