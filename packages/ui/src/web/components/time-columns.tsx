import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  useEffect,
  useId,
  useRef,
} from 'react';
import { cn } from '../cn';

/** Row height in pixels. Must match --time-item in controls.css. */
const ITEM = 32;

/** The row whose value is closest to `value`; the first row when the column is empty. */
function nearest(options: readonly TimeOption[], value: number): number {
  let index = 0;
  for (let at = 1; at < options.length; at++) {
    const here = options[at]?.value ?? Number.POSITIVE_INFINITY;
    const best = options[index]?.value ?? Number.POSITIVE_INFINITY;
    if (Math.abs(here - value) < Math.abs(best - value)) index = at;
  }
  return index;
}

export interface TimeOption {
  readonly value: number;
  readonly label: string;
}

interface ColumnProps {
  /** The column's accessible name. */
  readonly label: string;
  /** What is printed above it. Defaults to the label; pass '' for a column that needs none. */
  readonly head?: string | undefined;
  readonly options: readonly TimeOption[];
  readonly value: number;
  readonly onChange: (value: number) => void;
}

/**
 * One scrolling column. The reading is the row under the band, and because every row is one
 * ITEM tall the sums are exact: row `i` sits at `i * ITEM`, no measuring needed.
 */
function Column({
  label,
  options,
  value,
  onChange,
  open,
}: ColumnProps & { readonly open: boolean }): ReactElement {
  const id = useId();
  const ref = useRef<HTMLDivElement | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // While a scroll is settling the column is the source of truth, not the value.
  const scrolling = useRef(false);
  const placed = useRef(false);
  // A value off this column's grid, such as a typed 07 against quarter-hour rows, reads as
  // its nearest row: the band has something under it and aria-activedescendant names a row
  // that exists. Nothing is committed until the column is actually moved, so opening the
  // panel never rewrites what was typed.
  const index = nearest(options, value);
  const active = options[index];

  useEffect(() => {
    // A shut popover has no layout, so a scroll set there goes nowhere: the column has to
    // place itself when it opens, and forget that placement when it closes.
    if (!open) {
      placed.current = false;
      return;
    }
    const el = ref.current;
    if (!el || scrolling.current) return;
    const top = index * ITEM;
    if (Math.abs(el.scrollTop - top) < 1) return;
    // Opening must not sweep up from midnight; a later change should glide.
    el.scrollTo(placed.current ? { top } : { top, behavior: 'instant' });
    placed.current = true;
  }, [index, open]);

  useEffect(() => () => clearTimeout(settle.current), []);

  const handleScroll = (): void => {
    scrolling.current = true;
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      scrolling.current = false;
      const el = ref.current;
      if (!el) return;
      const landed = options[Math.round(el.scrollTop / ITEM)];
      if (landed && landed.value !== value) onChange(landed.value);
    }, 110);
  };

  const step = (by: number): void => {
    const to = options[Math.min(options.length - 1, Math.max(0, index + by))];
    if (to) onChange(to.value);
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    const by =
      event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowUp'
          ? -1
          : event.key === 'PageDown'
            ? 5
            : event.key === 'PageUp'
              ? -5
              : event.key === 'Home'
                ? -options.length
                : event.key === 'End'
                  ? options.length
                  : 0;
    if (!by) return;
    event.preventDefault();
    scrolling.current = false;
    step(by);
  };

  // Delegated, so the rows stay plain options rather than a stack of buttons.
  const handleClick = (event: MouseEvent<HTMLDivElement>): void => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-time-option]');
    if (!row) return;
    scrolling.current = false;
    onChange(Number(row.dataset['timeOption']));
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      aria-activedescendant={active ? `${id}-${active.value}` : undefined}
      data-slot="time-column"
      tabIndex={0}
      onScroll={handleScroll}
      onKeyDown={handleKey}
      onClick={handleClick}
      className="time-column"
    >
      {options.map((option) => (
        // biome-ignore lint/a11y/useFocusableInteractive: aria-activedescendant keeps focus on the listbox, which is what lets a click on a row land without stealing it
        <div
          key={option.value}
          id={`${id}-${option.value}`}
          role="option"
          aria-selected={option.value === value}
          data-time-option={option.value}
          className="time-option"
        >
          {option.label}
        </div>
      ))}
    </div>
  );
}

export interface TimeColumnsProps {
  readonly columns: readonly ColumnProps[];
  /** Whether the panel is showing, so each column can place its reading under the band. */
  readonly open: boolean;
  readonly className?: string | undefined;
}

/** Hour, minute and second side by side; the band across the middle is the reading. */
export function TimeColumns({ columns, open, className }: TimeColumnsProps): ReactElement {
  return (
    <div data-slot="time-columns" className={cn('time-columns', className)}>
      <div className="time-heads" aria-hidden="true">
        {columns.map((column) => (
          <span key={column.label}>{column.head ?? column.label}</span>
        ))}
      </div>
      <div className="time-rail">
        <span className="time-band" aria-hidden="true" />
        {columns.map((column) => (
          <Column key={column.label} open={open} {...column} />
        ))}
      </div>
    </div>
  );
}
