import {
  type ComponentProps,
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useId,
} from 'react';
import { useControllableState } from '../../core/use-controllable-state';
import { cn } from '../cn';

interface RadioContext {
  readonly name: string;
  readonly value: string;
  readonly set: (value: string) => void;
  readonly disabled: boolean;
}
const Ctx = createContext<RadioContext | null>(null);

export interface RadioGroupProps {
  readonly name?: string | undefined;
  readonly value?: string | undefined;
  readonly defaultValue?: string | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
  readonly disabled?: boolean | undefined;
  readonly orientation?: 'vertical' | 'horizontal' | undefined;
  readonly className?: string | undefined;
  readonly children: ReactNode;
}

/** Native radios sharing one name, so arrow keys move between them for free. */
export function RadioGroup({
  name,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  orientation = 'vertical',
  className,
  children,
}: RadioGroupProps): ReactElement {
  const autoName = useId();
  const [current, set] = useControllableState({
    value,
    defaultValue: defaultValue ?? '',
    onChange: onValueChange,
  });
  return (
    <Ctx.Provider value={{ name: name ?? autoName, value: current, set, disabled }}>
      <div
        role="radiogroup"
        aria-orientation={orientation}
        data-slot="radio-group"
        className={cn(
          'flex gap-2',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap gap-x-4',
          className,
        )}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

export interface RadioProps
  extends Omit<
    ComponentProps<'input'>,
    'type' | 'name' | 'checked' | 'onChange' | 'value' | 'size'
  > {
  readonly value: string;
  readonly label?: ReactNode;
}

export function Radio({
  className,
  value,
  label,
  disabled,
  id,
  ...props
}: RadioProps): ReactElement {
  const ctx = useContext(Ctx);
  const autoId = useId();
  const inputId = id ?? autoId;
  if (!ctx) throw new Error('<Radio> must be inside <RadioGroup>');
  const isDisabled = disabled ?? ctx.disabled;
  const control = (
    <span className="relative grid size-4.5 shrink-0 place-items-center">
      <input
        id={inputId}
        type="radio"
        data-slot="radio"
        name={ctx.name}
        value={value}
        checked={ctx.value === value}
        disabled={isDisabled}
        onChange={() => ctx.set(value)}
        className={cn(
          'peer col-start-1 row-start-1 size-4.5 cursor-pointer appearance-none rounded-full border border-(--input) bg-card',
          'transition-[border-color,background-color] duration-(--duration-fast) hover:border-foreground/35 checked:border-primary',
          'focus-visible:focus-outline outline-none disabled:cursor-not-allowed disabled:opacity-45',
          className,
        )}
        {...props}
      />
      <span className="pointer-events-none col-start-1 row-start-1 size-2 scale-0 rounded-full bg-primary transition-transform duration-(--duration-base) ease-(--ease-snappy) peer-checked:scale-100" />
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
