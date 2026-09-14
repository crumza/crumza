import type { ComponentProps, ReactElement } from 'react';
import { cn } from '../cn';

export function Label({ className, ...props }: ComponentProps<'label'>): ReactElement {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the caller associates it (htmlFor or a nested control)
    <label
      data-slot="label"
      className={cn('text-ui text-foreground select-none peer-disabled:opacity-45', className)}
      {...props}
    />
  );
}
