import type { ReactElement, ReactNode } from 'react';
import { useControllableState } from '../../core/use-controllable-state';
import { cn } from '../cn';
import { LiquixBar } from './liquix-bar';

export interface LiquixSegmentedOption {
  readonly value: string;
  readonly label: ReactNode;
  readonly disabled?: boolean | undefined;
}

export interface LiquixSegmentedControlProps {
  readonly options: readonly LiquixSegmentedOption[];
  readonly value?: string | undefined;
  readonly defaultValue?: string | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
  /** The accessible name of the group. */
  readonly label: string;
  /** sm is 32px tall, md 40px. */
  readonly size?: 'sm' | 'md' | undefined;
  /** Sizes the control; the segments share its width equally. Full width by default. */
  readonly className?: string | undefined;
  /** Classes for the labels where the capsule is. */
  readonly activeClassName?: string | undefined;
  /** Classes for the labels outside the capsule. */
  readonly inactiveClassName?: string | undefined;
  /** Classes added to the parked capsule. */
  readonly pillClassName?: string | undefined;
}

/**
 * A choice among a few options, as one bar of glass with a capsule that
 * travels to the chosen one. The compact sibling of LiquixTabs: text labels,
 * two heights, the radiogroup pattern. Render it in a LiquixSurface overlay
 * for the shader's glass; elsewhere it is CSS glass with the same motion.
 */
export function LiquixSegmentedControl({
  options,
  value,
  defaultValue,
  onValueChange,
  label,
  size = 'md',
  className,
  activeClassName = 'text-blue-600',
  inactiveClassName = 'liquix-ink',
  pillClassName,
}: LiquixSegmentedControlProps): ReactElement {
  const [current, set] = useControllableState({
    value,
    defaultValue: defaultValue ?? options[0]?.value ?? '',
    onChange: onValueChange,
  });
  return (
    <LiquixBar
      slot="liquix-segmented-control"
      className={cn('w-full', className)}
      height={size === 'sm' ? 32 : 40}
      pillInset={3}
      pane
      items={options.map((option) => ({
        id: option.value,
        label: option.label,
        disabled: option.disabled,
      }))}
      itemClassName={cn('px-3 font-semibold', size === 'sm' ? 'text-[12px]' : 'text-[13px]')}
      active={current}
      onChange={set}
      label={label}
      listRole="radiogroup"
      itemRole="radio"
      selectOnArrow
      activeClassName={activeClassName}
      inactiveClassName={inactiveClassName}
      pillClassName={pillClassName}
    />
  );
}
