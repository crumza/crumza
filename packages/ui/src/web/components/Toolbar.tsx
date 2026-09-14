import type { ComponentProps, KeyboardEvent, ReactElement } from 'react';
import { cn } from '../cn';

export interface ToolbarProps extends ComponentProps<'div'> {
  readonly orientation?: 'horizontal' | 'vertical' | undefined;
}

const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])';

/** A row of controls that is one Tab stop: arrows move inside it (WAI-ARIA toolbar pattern). */
export function Toolbar({
  className,
  orientation = 'horizontal',
  onKeyDown,
  ...props
}: ToolbarProps): ReactElement {
  const handleKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const next = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    const prev = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const dir =
      e.key === next
        ? 1
        : e.key === prev
          ? -1
          : e.key === 'Home'
            ? -Infinity
            : e.key === 'End'
              ? Infinity
              : 0;
    if (!dir) return;
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const at = items.indexOf(document.activeElement as HTMLElement);
    const to =
      dir === -Infinity
        ? 0
        : dir === Infinity
          ? items.length - 1
          : (at + dir + items.length) % items.length;
    e.preventDefault();
    items[to]?.focus();
  };
  return (
    <div
      role="toolbar"
      aria-orientation={orientation}
      data-slot="toolbar"
      onKeyDown={handleKey}
      className={cn(
        'flex items-center gap-1',
        orientation === 'vertical' && 'flex-col items-stretch',
        className,
      )}
      {...props}
    />
  );
}
