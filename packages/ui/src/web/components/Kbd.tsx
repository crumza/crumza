import type { ComponentProps, ReactElement } from 'react';
import { cn } from '../cn';

/** A key cap. `<Kbd>⌘K</Kbd>` */
export function Kbd({ className, ...props }: ComponentProps<'kbd'>): ReactElement {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-(--border) bg-foreground/6 px-1 font-mono text-[11px] text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
