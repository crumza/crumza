import { describe, expect, test } from 'bun:test';
import type { DayCell } from '../src/core/calendar';
import {
  addDays,
  addMonths,
  clampDate,
  dayPeriodLabels,
  daysInMonth,
  formatDateTime,
  isDayInRange,
  isSameDay,
  localeHourCycle,
  minutesOfDay,
  monthGrid,
  monthLabel,
  parseTimeValue,
  startOfDay,
  toLocalISO,
  toTimeValue,
  weekdayLabels,
  withMinutes,
} from '../src/core/calendar';

/** Indexing is checked, and a missing cell is a bug in the grid, not in the assertion. */
function at(cells: readonly DayCell[], index: number): DayCell {
  const cell = cells[index];
  if (!cell) throw new Error(`the grid has no cell at ${index}`);
  return cell;
}

describe('day and month arithmetic', () => {
  test('a day step keeps the wall clock, so it survives a daylight-saving boundary', () => {
    // Noon is safe in every zone: no jump lands on it.
    let date = new Date(2026, 0, 1, 12, 30);
    for (let step = 0; step < 200; step++) date = addDays(date, 1);
    expect([date.getHours(), date.getMinutes()]).toEqual([12, 30]);
    expect(toLocalISO(date, false)).toBe('2026-07-20');
  });
  test('a month step clamps the day instead of spilling into the next month', () => {
    expect(toLocalISO(addMonths(new Date(2026, 0, 31), 1), false)).toBe('2026-02-28');
    expect(toLocalISO(addMonths(new Date(2024, 0, 31), 1), false)).toBe('2024-02-29');
    expect(toLocalISO(addMonths(new Date(2026, 4, 31), -1), false)).toBe('2026-04-30');
  });
  test('a month step crosses the year in both directions and keeps the time', () => {
    expect(toLocalISO(addMonths(new Date(2026, 11, 15, 9, 5), 1), true)).toBe('2027-01-15T09:05');
    expect(toLocalISO(addMonths(new Date(2026, 0, 15, 9, 5), -1), true)).toBe('2025-12-15T09:05');
  });
  test('February knows about leap years', () => {
    expect(daysInMonth(2024, 1)).toBe(29);
    expect(daysInMonth(2026, 1)).toBe(28);
    expect(daysInMonth(2100, 1)).toBe(28);
    expect(daysInMonth(2000, 1)).toBe(29);
  });
  test('month overflow normalises rather than returning nonsense', () => {
    expect(daysInMonth(2026, 12)).toBe(31);
    expect(daysInMonth(2026, -1)).toBe(31);
  });
});

describe('the month grid', () => {
  test('is always six whole weeks, so the panel keeps one height', () => {
    for (let month = 0; month < 12; month++) {
      const cells = monthGrid(2026, month, 1);
      expect(cells.length).toBe(42);
      expect(cells.filter((cell) => cell.inMonth).length).toBe(daysInMonth(2026, month));
    }
  });
  test('starts on the requested weekday', () => {
    expect(monthGrid(2026, 2, 1)[0]?.date.getDay()).toBe(1);
    expect(monthGrid(2026, 2, 0)[0]?.date.getDay()).toBe(0);
    expect(monthGrid(2026, 2, 6)[0]?.date.getDay()).toBe(6);
  });
  test('pads with the neighbouring months and runs without a gap', () => {
    const cells = monthGrid(2026, 2, 1);
    expect(toLocalISO(at(cells, 0).date, false)).toBe('2026-02-23');
    expect(at(cells, 0).inMonth).toBe(false);
    expect(toLocalISO(at(cells, 41).date, false)).toBe('2026-04-05');
    for (let index = 1; index < cells.length; index++) {
      expect(isSameDay(at(cells, index).date, addDays(at(cells, index - 1).date, 1))).toBe(true);
    }
  });
  test('a month that begins on the start weekday still shows a leading week', () => {
    // June 2026 begins on a Monday; with a Monday start the grid must not drop a week.
    const cells = monthGrid(2026, 5, 1);
    expect(toLocalISO(at(cells, 0).date, false)).toBe('2026-06-01');
    expect(cells.filter((cell) => cell.inMonth).length).toBe(30);
  });
});

describe('bounds', () => {
  const min = new Date(2026, 2, 10, 14, 0);
  const max = new Date(2026, 2, 20, 9, 0);
  test('a day inside the range counts whatever its time', () => {
    expect(isDayInRange(new Date(2026, 2, 10, 0, 1), min, max)).toBe(true);
    expect(isDayInRange(new Date(2026, 2, 20, 23, 59), min, max)).toBe(true);
    expect(isDayInRange(new Date(2026, 2, 9, 23, 59), min, max)).toBe(false);
    expect(isDayInRange(new Date(2026, 2, 21), min, max)).toBe(false);
  });
  test('an absent bound does not constrain', () => {
    expect(isDayInRange(new Date(1990, 0, 1), undefined, max)).toBe(true);
    expect(isDayInRange(new Date(2999, 0, 1), min, undefined)).toBe(true);
  });
  test('clamping moves the instant to the bound and never mutates the input', () => {
    const early = new Date(2026, 0, 1);
    const clamped = clampDate(early, min, max);
    expect(clamped.getTime()).toBe(min.getTime());
    expect(early.getTime()).toBe(new Date(2026, 0, 1).getTime());
    expect(clampDate(new Date(2026, 2, 15), min, max).getTime()).toBe(
      new Date(2026, 2, 15).getTime(),
    );
    expect(clampDate(new Date(2027, 0, 1), min, max).getTime()).toBe(max.getTime());
  });
});

describe('time of day', () => {
  test('minutes round-trip through the clock', () => {
    const date = withMinutes(new Date(2026, 2, 14, 23, 59), 9 * 60 + 5);
    expect(minutesOfDay(date)).toBe(545);
    expect(toTimeValue(date)).toBe('09:05');
    expect(date.getSeconds()).toBe(0);
  });
  test('midnight and the last minute of the day both serialise', () => {
    expect(toTimeValue(withMinutes(new Date(2026, 2, 14), 0))).toBe('00:00');
    expect(toTimeValue(withMinutes(new Date(2026, 2, 14), 1439))).toBe('23:59');
  });
  test('the time field is parsed, and rubbish is rejected rather than coerced', () => {
    expect(parseTimeValue('09:05')).toBe(545);
    expect(parseTimeValue('9:05')).toBe(545);
    expect(parseTimeValue('23:59:30')).toBe(1439);
    expect(parseTimeValue('')).toBeUndefined();
    expect(parseTimeValue('24:00')).toBeUndefined();
    expect(parseTimeValue('12:60')).toBeUndefined();
    expect(parseTimeValue('noon')).toBeUndefined();
  });
  test('start of day strips the clock without moving the date', () => {
    const date = startOfDay(new Date(2026, 2, 14, 23, 59, 59));
    expect(toLocalISO(date, true)).toBe('2026-03-14T00:00');
  });
});

describe('labels', () => {
  test('the form value is local wall clock, with no zone to misread', () => {
    const date = new Date(2026, 2, 14, 9, 5);
    expect(toLocalISO(date, true)).toBe('2026-03-14T09:05');
    expect(toLocalISO(date, false)).toBe('2026-03-14');
  });
  test('weekdays follow the requested first day', () => {
    expect(weekdayLabels('en-GB', 1)[0]).toBe('Mon');
    expect(weekdayLabels('en-GB', 1)[6]).toBe('Sun');
    expect(weekdayLabels('en-GB', 0)[0]).toBe('Sun');
    expect(weekdayLabels('en-GB', 6)[0]).toBe('Sat');
    expect(weekdayLabels('en-GB', 1)).toHaveLength(7);
  });
  test('month and value labels follow the locale', () => {
    expect(monthLabel(new Date(2026, 2, 14), 'en-GB')).toBe('March 2026');
    expect(monthLabel(new Date(2026, 2, 14), 'de-DE')).toBe('März 2026');
    expect(formatDateTime(new Date(2026, 2, 14, 9, 5), 'en-GB', false)).toBe('14 Mar 2026');
    expect(formatDateTime(new Date(2026, 2, 14, 9, 5), 'en-GB', true)).toContain('09:05');
  });
});

describe('the clock a locale keeps', () => {
  test('hour cycle follows the locale, not the machine', () => {
    expect(localeHourCycle('en-US')).toBe(12);
    expect(localeHourCycle('en-GB')).toBe(24);
    expect(localeHourCycle('de-DE')).toBe(24);
    expect(localeHourCycle('ja-JP')).toBe(24);
  });
  test('day period markers come from the locale', () => {
    expect(dayPeriodLabels('en-US')).toEqual(['AM', 'PM']);
    const [morning, afternoon] = dayPeriodLabels('de-DE');
    expect(morning).toBeTruthy();
    expect(afternoon).toBeTruthy();
    expect(morning).not.toBe(afternoon);
  });
});
