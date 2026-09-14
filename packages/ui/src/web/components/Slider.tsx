import type { ComponentProps, CSSProperties, ReactElement } from 'react';
import { useControllableState } from '../../core/use-controllable-state';
import { cn } from '../cn';

export interface SliderProps
  extends Omit<ComponentProps<'input'>, 'type' | 'value' | 'defaultValue' | 'onChange' | 'size'> {
  readonly value?: number | undefined;
  readonly defaultValue?: number | undefined;
  readonly onValueChange?: ((value: number) => void) | undefined;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly step?: number | undefined;
}

/** A native range input: arrows, Home/End and PageUp/PageDown come free. The track fills to the value. */
export function Slider({
  className,
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  ...props
}: SliderProps): ReactElement {
  const [current, set] = useControllableState({
    value,
    defaultValue: defaultValue ?? min,
    onChange: onValueChange,
  });
  const fill = max > min ? ((current - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      data-slot="slider"
      min={min}
      max={max}
      step={step}
      value={current}
      onChange={(e) => set(Number(e.target.value))}
      style={{ '--slider-fill': `${fill}%` } as CSSProperties}
      className={cn('slider w-full', className)}
      {...props}
    />
  );
}
