import type { ComponentProps, ReactElement } from 'react';
import { cn } from '../cn';

export type BadgeVariant = 'accent' | 'neutral' | 'outline' | 'destructive';

export interface BadgeProps extends ComponentProps<'span'> {
  readonly variant?: BadgeVariant | undefined;
}

/** A small fact: status, count, category. Never an action. */
export function Badge({ className, variant = 'neutral', ...props }: BadgeProps): ReactElement {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-sm border border-transparent px-1.5 text-ui-sm leading-none whitespace-nowrap',
        variant === 'accent' && 'border-primary/40 bg-primary/12 text-foreground',
        variant === 'neutral' && 'bg-foreground/8 text-foreground',
        variant === 'outline' && 'border-(--border) text-muted-foreground',
        variant === 'destructive' && 'bg-destructive/12 text-destructive',
        className,
      )}
      {...props}
    />
  );
}
