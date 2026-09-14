import { type ComponentProps, type ReactElement, type ReactNode, useId } from 'react';
import { cn } from '../cn';

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type' | 'size'> {
  /** Renders a clickable labelled row. Omit for a bare control. */
  readonly label?: ReactNode;
}

/** A native checkbox, so keyboard and form semantics come free. The mark draws itself in. */
export function Checkbox({ className, label, id, ...props }: CheckboxProps): ReactElement {
  const autoId = useId();
  const inputId = id ?? autoId;
  const control = (
    <span className="relative grid size-4.5 shrink-0 place-items-center">
      <input
        id={inputId}
        type="checkbox"
        data-slot="checkbox"
        className={cn(
          'peer col-start-1 row-start-1 size-4.5 cursor-pointer appearance-none rounded-xs border border-(--input) bg-card',
          'transition-[background-color,border-color] duration-(--duration-fast)',
          'hover:border-foreground/35 checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary',
          'focus-visible:focus-outline outline-none disabled:cursor-not-allowed disabled:opacity-45',
          'aria-[invalid=true]:border-destructive',
          className,
        )}
        {...props}
      />
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="pointer-events-none col-start-1 row-start-1 size-3.5 [stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-(--duration-base) ease-out peer-checked:[stroke-dashoffset:0]"
      >
        <path pathLength={1} d="M3.5 8.5 6.5 11.5 12.5 5" />
      </svg>
    </span>
  );
  if (!label) return control;
  return (
    <label
      htmlFor={inputId}
      className="inline-flex cursor-pointer select-none items-center gap-2 text-ui has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45"
    >
      {control}
      <span>{label}</span>
    </label>
  );
}
