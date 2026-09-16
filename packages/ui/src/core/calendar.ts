/**
 * Calendar arithmetic in local time: no DOM, no timezone library. Day and month steps go
 * through the Date constructor rather than millisecond maths, so a day stays a day across a
 * daylight-saving boundary and 31 January plus a month lands in February.
 */

export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DayCell {
  /** Local midnight on that day. */
  readonly date: Date;
  /** False for the leading and trailing days that pad the grid out to whole weeks. */
  readonly inMonth: boolean;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** `month` is 0-based like Date, and may sit outside 0..11; it is normalised. */
export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(year, month + 1, 0).getDate();
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Adds months, clamping the day so 31 January plus one month is 28 or 29 February. */
export function addMonths(date: Date, months: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const next = new Date(date);
  next.setFullYear(year, month, Math.min(date.getDate(), daysInMonth(year, month)));
  return next;
}

/**
 * Six weeks of cells beginning on `weekStartsOn`, so the grid keeps one height all year
 * instead of reflowing the panel under the pointer when the month changes.
 */
export function monthGrid(
  year: number,
  month: number,
  weekStartsOn: WeekStart,
): readonly DayCell[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const start = addDays(first, -lead);
  const cells: DayCell[] = [];
  for (let index = 0; index < 42; index++) {
    const date = addDays(start, index);
    cells.push({ date, inMonth: date.getMonth() === first.getMonth() });
  }
  return cells;
}

/** Whether the day falls inside the optional bounds. The time of day is ignored. */
export function isDayInRange(date: Date, min?: Date | undefined, max?: Date | undefined): boolean {
  const day = startOfDay(date).getTime();
  if (min && day < startOfDay(min).getTime()) return false;
  if (max && day > startOfDay(max).getTime()) return false;
  return true;
}

/** Moves the instant inside the bounds. Returns a copy either way. */
export function clampDate(date: Date, min?: Date | undefined, max?: Date | undefined): Date {
  if (min && date.getTime() < min.getTime()) return new Date(min);
  if (max && date.getTime() > max.getTime()) return new Date(max);
  return new Date(date);
}

/** Minutes since local midnight. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** The same day with the clock set to `minutes` past midnight, seconds cleared. */
export function withMinutes(date: Date, minutes: number): Date {
  const next = startOfDay(date);
  next.setMinutes(minutes);
  return next;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** `HH:mm` for an `<input type="time">`, whose value is 24-hour whatever the display locale. */
export function toTimeValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Minutes past midnight from `HH:mm`, or undefined when the field is empty or malformed. */
export function parseTimeValue(value: string): number | undefined {
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return undefined;
  const [, rawHours, rawMinutes] = match;
  if (rawHours === undefined || rawMinutes === undefined) return undefined;
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);
  if (hours > 23 || minutes > 59) return undefined;
  return hours * 60 + minutes;
}

/**
 * The local wall-clock value a form should carry: the same shape a native
 * `datetime-local` or `date` input submits, with no timezone suffix to misread.
 */
export function toLocalISO(date: Date, withTime: boolean): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return withTime ? `${day}T${toTimeValue(date)}` : day;
}

/** Month and year for the calendar header, e.g. "March 2026". */
export function monthLabel(date: Date, locale?: string | undefined): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
}

/** Short weekday names in display order, beginning on `weekStartsOn`. */
export function weekdayLabels(
  locale: string | undefined,
  weekStartsOn: WeekStart,
): readonly string[] {
  const format = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  // 1 August 2021 was a Sunday, so it anchors the week without a hand-written table.
  const sunday = new Date(2021, 7, 1);
  const labels: string[] = [];
  for (let index = 0; index < 7; index++) {
    labels.push(format.format(addDays(sunday, (weekStartsOn + index) % 7)));
  }
  return labels;
}

/** Whether the locale writes the clock on 12 or 24 hours. */
export function localeHourCycle(locale?: string | undefined): 12 | 24 {
  const resolved = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions();
  if (resolved.hourCycle === 'h11' || resolved.hourCycle === 'h12') return 12;
  if (resolved.hourCycle === 'h23' || resolved.hourCycle === 'h24') return 24;
  return resolved.hour12 ? 12 : 24;
}

/** The locale's own morning and afternoon markers, e.g. `['AM', 'PM']` or `['vm.', 'nm.']`. */
export function dayPeriodLabels(locale?: string | undefined): readonly [string, string] {
  const format = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true });
  const read = (hour: number): string => {
    const parts = format.formatToParts(new Date(2021, 7, 1, hour));
    return parts.find((part) => part.type === 'dayPeriod')?.value ?? (hour < 12 ? 'AM' : 'PM');
  };
  return [read(9), read(21)];
}

/** The full accessible name of a day cell, which reads the number alone cannot carry. */
export function dayLabel(date: Date, locale?: string | undefined): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** The value shown on the trigger. */
export function formatDateTime(date: Date, locale: string | undefined, withTime: boolean): string {
  return new Intl.DateTimeFormat(
    locale,
    withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' },
  ).format(date);
}
