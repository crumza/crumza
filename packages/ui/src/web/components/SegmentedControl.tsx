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

interface SegmentContext {
  readonly name: string;
  readonly value: string;
  readonly set: (value: string) => void;
  readonly disabled: boolean;
}
const Ctx = createContext<SegmentContext | null>(null);

export interface SegmentedControlProps {
  readonly name?: string | undefined;
  readonly value?: string | undefined;
  readonly defaultValue?: string | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
  readonly disabled?: boolean | undefined;
  readonly 'aria-label'?: string | undefined;
  readonly className?: string | undefined;
  readonly children: ReactNode;
}

/** One choice among a few: a trough with a raised selected segment. Native radios underneath. */
export function SegmentedControl({
  name,
  value,
  defaultValue = '',
  onValueChange,
  disabled = false,
  className,
  children,
  ...aria
}: SegmentedControlProps): ReactElement {
  const autoName = useId();
  const [current, set] = useControllableState({ value, defaultValue, onChange: onValueChange });
  return (
    <Ctx.Provider value={{ name: name ?? autoName, value: current, set, disabled }}>
      <div
        role="radiogroup"
        data-slot="segmented-control"
        className={cn(
          'inline-flex h-(--control-md) items-stretch gap-0.5 rounded-control bg-foreground/6 p-0.5',
          className,
        )}
        {...aria}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

export interface SegmentProps extends Omit<ComponentProps<'input'>, 'value' | 'type' | 'size'> {
  readonly value: string;
  readonly children: ReactNode;
}

export function Segment({
  className,
  value,
  disabled,
  children,
  id,
  ...props
}: SegmentProps): ReactElement {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('<Segment> must be inside <SegmentedControl>');
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label
      htmlFor={inputId}
      data-slot="segment"
      className={cn(
        'relative inline-flex cursor-pointer select-none items-center justify-center rounded-control px-3 text-ui leading-none',
        'text-muted-foreground transition-[background-color,color,box-shadow] duration-(--duration-base) ease-(--ease-snappy) hover:text-foreground',
        'has-[:checked]:bg-card has-[:checked]:text-foreground has-[:checked]:shadow-[inset_0_1px_0_-0.5px_var(--glass-rim-top),0_1px_2px_rgb(0_0_0/0.08)]',
        'has-[:focus-visible]:focus-outline has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45',
        className,
      )}
    >
      <input
        id={inputId}
        type="radio"
        name={ctx.name}
        value={value}
        checked={ctx.value === value}
        disabled={disabled ?? ctx.disabled}
        onChange={() => ctx.set(value)}
        className="sr-only"
        {...props}
      />
      {children}
    </label>
  );
}
