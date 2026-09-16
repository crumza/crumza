import { type KeyboardEvent, type ReactElement, useEffect, useId, useRef, useState } from 'react';
import {
  addDays,
  addMonths,
  clampDate,
  dayLabel,
  formatDateTime,
  isDayInRange,
  isSameDay,
  minutesOfDay,
  monthGrid,
  monthLabel,
  parseTimeValue,
  startOfDay,
  toLocalISO,
  toTimeValue,
  type WeekStart,
  weekdayLabels,
  withMinutes,
} from '../../core/calendar';
import { useControllableState } from '../../core/use-controllable-state';
import { cn } from '../cn';
import { Button } from './Button';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { TimePicker } from './TimePicker';

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Index of a day within its displayed week, honouring where the week starts. */
function dayOfWeek(date: Date, weekStartsOn: WeekStart): number {
  return (date.getDay() - weekStartsOn + 7) % 7;
}

const chevron = (path: string): ReactElement => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="size-3.5"
  >
    <path d={path} />
  </svg>
);

export interface DateTimePickerProps {
  readonly value?: Date | null | undefined;
  readonly defaultValue?: Date | null | undefined;
  readonly onValueChange?: ((value: Date | null) => void) | undefined;
  /** Earliest selectable day. The time of day is ignored. */
  readonly min?: Date | undefined;
  /** Latest selectable day. The time of day is ignored. */
  readonly max?: Date | undefined;
  /** BCP 47 tag for the month, weekday and value labels. Omit to follow the runtime. */
  readonly locale?: string | undefined;
  /** 0 is Sunday. Defaults to Monday, the ISO week. */
  readonly weekStartsOn?: WeekStart | undefined;
  /** Show the time field. Off makes this a date picker that closes when a day is picked. */
  readonly time?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  /** Advisory only: a hidden input cannot take part in constraint validation. */
  readonly required?: boolean | undefined;
  /** Submits the local wall clock, the shape a native datetime-local input posts. */
  readonly name?: string | undefined;
  /** Put this on the trigger, so a Field label's `htmlFor` reaches it. */
  readonly id?: string | undefined;
  readonly placeholder?: string | undefined;
  readonly className?: string | undefined;
  readonly 'aria-label'?: string | undefined;
  readonly 'aria-labelledby'?: string | undefined;
}

/** A day grid and a native time field in a popover. Local time throughout; no zone conversion. */
export function DateTimePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  min,
  max,
  locale,
  weekStartsOn = 1,
  time = true,
  disabled = false,
  required = false,
  name,
  id,
  placeholder = 'Pick a date',
  className,
  ...labelling
}: DateTimePickerProps): ReactElement {
  const generatedId = useId();
  const triggerId = id ?? `${generatedId}-trigger`;
  const monthId = `${generatedId}-month`;
  const timeId = `${generatedId}-time-label`;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useControllableState<Date | null>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });

  const anchor = (): Date => clampDate(value ?? new Date(), min, max);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => monthStart(anchor()));
  const [focused, setFocused] = useState<Date>(() => startOfDay(anchor()));
  // Only a keyboard move or an open should pull focus; typing in the time field must not.
  const takeFocus = useRef(false);
  const gridRef = useRef<HTMLTableElement | null>(null);

  // Each opening starts from the current value, not from wherever the last one was left.
  // biome-ignore lint/correctness/useExhaustiveDependencies: opening is the trigger; a value change while open must not yank the view
  useEffect(() => {
    if (!open) return;
    const start = clampDate(value ?? new Date(), min, max);
    setVisibleMonth(monthStart(start));
    setFocused(startOfDay(start));
    takeFocus.current = true;
  }, [open]);

  useEffect(() => {
    if (!open || !takeFocus.current) return;
    takeFocus.current = false;
    const key = toLocalISO(focused, false);
    gridRef.current?.querySelector<HTMLButtonElement>(`button[data-day="${key}"]`)?.focus();
  }, [open, focused]);

  const move = (to: Date): void => {
    setFocused(to);
    setVisibleMonth(monthStart(to));
    takeFocus.current = true;
  };

  const handleKey = (event: KeyboardEvent<HTMLTableElement>): void => {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const offset = dayOfWeek(focused, weekStartsOn);
    const to =
      event.key === back
        ? addDays(focused, -1)
        : event.key === forward
          ? addDays(focused, 1)
          : event.key === 'ArrowUp'
            ? addDays(focused, -7)
            : event.key === 'ArrowDown'
              ? addDays(focused, 7)
              : event.key === 'Home'
                ? addDays(focused, -offset)
                : event.key === 'End'
                  ? addDays(focused, 6 - offset)
                  : event.key === 'PageUp'
                    ? addMonths(focused, event.shiftKey ? -12 : -1)
                    : event.key === 'PageDown'
                      ? addMonths(focused, event.shiftKey ? 12 : 1)
                      : undefined;
    if (!to) return;
    event.preventDefault();
    move(to);
  };

  const select = (day: Date): void => {
    if (!isDayInRange(day, min, max)) return;
    const next = withMinutes(day, value ? minutesOfDay(value) : 0);
    setValue(next);
    setFocused(startOfDay(next));
    // With no time to set, the picker has nothing left to ask.
    if (!time) setOpen(false);
  };

  // A half-typed clock reads as null; the date keeps the time it had until one is whole.
  const handleTime = (next: string | null): void => {
    const minutes = next === null ? undefined : parseTimeValue(next);
    if (minutes === undefined) return;
    setValue(withMinutes(value ?? focused, minutes));
  };

  const cells = monthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth(), weekStartsOn);
  const weeks: (typeof cells)[] = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  const weekdays = weekdayLabels(locale, weekStartsOn);
  const today = startOfDay(new Date());
  const stepBack = addMonths(visibleMonth, -1);
  const stepOn = addMonths(visibleMonth, 1);

  return (
    <div data-slot="date-time-picker" className={cn('inline-flex flex-col', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button variant="bordered" />}
          id={triggerId}
          disabled={disabled}
          aria-required={required || undefined}
          data-empty={value ? undefined : ''}
          className="justify-between gap-2 font-normal"
          {...labelling}
        >
          <span className={value ? undefined : 'text-muted-foreground'}>
            {value ? formatDateTime(value, locale, time) : placeholder}
          </span>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            aria-hidden="true"
            className="size-3.5 text-muted-foreground"
          >
            <rect x="2.25" y="3.25" width="11.5" height="10.5" rx="2" />
            <path d="M2.5 6.5h11M5.5 1.75v2.5M10.5 1.75v2.5" />
          </svg>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3 text-ui-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Previous month, ${monthLabel(stepBack, locale)}`}
              disabled={min ? monthStart(min).getTime() > stepBack.getTime() : false}
              onClick={() => setVisibleMonth(stepBack)}
            >
              {chevron('M10 3.5 5.5 8l4.5 4.5')}
            </Button>
            {/* Polite, so a month change is announced without cutting off the focused day. */}
            <span id={monthId} aria-live="polite" className="font-medium">
              {monthLabel(visibleMonth, locale)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Next month, ${monthLabel(stepOn, locale)}`}
              disabled={max ? monthStart(max).getTime() < stepOn.getTime() : false}
              onClick={() => setVisibleMonth(stepOn)}
            >
              {chevron('M6 3.5 10.5 8 6 12.5')}
            </Button>
          </div>
          {/* A real table: role=grid gives the cells their gridcell and columnheader roles. */}
          <table
            ref={gridRef}
            // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: APG builds the date grid from a real table, which keeps the row and column semantics a div would throw away
            role="grid"
            aria-labelledby={monthId}
            onKeyDown={handleKey}
            className="border-separate border-spacing-0.5"
          >
            <thead>
              <tr>
                {weekdays.map((weekday) => (
                  <th key={weekday} scope="col" className="pb-1 font-normal text-muted-foreground">
                    {weekday}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week[0]?.date.toDateString()}>
                  {week.map(({ date, inMonth }) => {
                    const selected = value !== null && isSameDay(date, value);
                    const outOfRange = !isDayInRange(date, min, max);
                    return (
                      // biome-ignore lint/a11y/useAriaPropsSupportedByRole: inside role="grid" a td is a gridcell, which is exactly the role aria-selected belongs to
                      <td key={date.toDateString()} aria-selected={selected}>
                        <button
                          type="button"
                          data-slot="calendar-day"
                          data-day={toLocalISO(date, false)}
                          data-state={selected ? 'selected' : undefined}
                          data-today={isSameDay(date, today) ? '' : undefined}
                          aria-current={isSameDay(date, today) ? 'date' : undefined}
                          data-outside={inMonth ? undefined : ''}
                          aria-label={dayLabel(date, locale)}
                          // Out-of-range days stay focusable and merely refuse: a `disabled`
                          // button cannot take focus, so arrowing into one would strand the
                          // grid with focus on the body and no way back.
                          aria-disabled={outOfRange || undefined}
                          // One tab stop for the whole grid; the arrows do the rest.
                          tabIndex={isSameDay(date, focused) ? 0 : -1}
                          onClick={() => select(date)}
                          onFocus={() => setFocused(startOfDay(date))}
                          className={cn(
                            'flex size-8 cursor-pointer items-center justify-center rounded-(--radius-control) tabular-nums',
                            'focus-visible:focus-outline outline-none',
                            'hover:bg-(--accent)',
                            'aria-disabled:cursor-not-allowed aria-disabled:opacity-35 aria-disabled:hover:bg-transparent',
                            inMonth ? 'text-foreground' : 'text-muted-foreground',
                            'data-today:font-semibold data-today:underline data-today:underline-offset-4',
                            'data-[state=selected]:bg-(--primary) data-[state=selected]:text-(--primary-foreground)',
                          )}
                        >
                          {date.getDate()}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex items-center justify-between gap-2 border-(--border) border-t pt-2">
            {time ? (
              <span className="flex items-center gap-2">
                <span id={timeId} className="text-muted-foreground">
                  Time
                </span>
                <TimePicker
                  aria-labelledby={timeId}
                  locale={locale}
                  value={value ? toTimeValue(value) : null}
                  onValueChange={handleTime}
                  className="h-(--control-sm)"
                />
              </span>
            ) : (
              <span />
            )}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={!isDayInRange(today, min, max)}
                onClick={() => {
                  const now = clampDate(new Date(), min, max);
                  // The grid's one Tab stop is the focused day; it has to be on screen.
                  setVisibleMonth(monthStart(now));
                  select(now);
                }}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={value === null}
                onClick={() => {
                  setValue(null);
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {name ? (
        <input type="hidden" name={name} value={value ? toLocalISO(value, time) : ''} />
      ) : null}
    </div>
  );
}
