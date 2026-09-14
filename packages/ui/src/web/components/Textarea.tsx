import type { ComponentProps, ReactElement } from 'react';
import { cn } from '../cn';

export function Textarea({ className, ...props }: ComponentProps<'textarea'>): ReactElement {
  return (
    <textarea
      data-slot="textarea"
      className={cn('field min-h-20 w-full resize-y px-3 py-2 text-ui leading-normal', className)}
      {...props}
    />
  );
}
