import { type ComponentProps, type ReactElement, type ReactNode, useId } from 'react';
import { useControllableState } from '../../core/use-controllable-state';
import { cn } from '../cn';

export interface SwitchProps extends Omit<ComponentProps<'input'>, 'type' | 'size' | 'onChange'> {
  readonly label?: ReactNode;
  readonly onCheckedChange?: ((checked: boolean) => void) | undefined;
}

/** A switch on a native checkbox with `role="switch"`. Space toggles it. */
export function Switch({
  className,
  label,
  id,
  checked,
  defaultChecked = false,
  onCheckedChange,
  ...props
}: SwitchProps): ReactElement {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [on, set] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });
  const control = (
    <span className="relative inline-flex shrink-0">
      <input
        id={inputId}
        type="checkbox"
        role="switch"
        aria-checked={on}
        checked={on}
        onChange={(e) => set(e.target.checked)}
        data-slot="switch"
        className={cn('peer sr-only', className)}
        {...props}
      />
      <span className="h-5 w-8.5 rounded-full bg-foreground/20 transition-colors duration-(--duration-base) peer-checked:bg-primary peer-focus-visible:focus-outline peer-disabled:opacity-45" />
      <span className="pointer-events-none absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.25)] transition-transform duration-(--duration-base) ease-(--ease-snappy) peer-checked:translate-x-3.5 peer-disabled:opacity-45" />
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
