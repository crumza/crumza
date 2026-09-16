import { type KeyboardEvent, type ReactElement, useCallback, useId, useRef, useState } from 'react';
import { dayPeriodLabels, localeHourCycle } from '../../core/calendar';
import { useControllableState } from '../../core/use-controllable-state';
import { cn } from '../cn';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { Segment, SegmentedControl } from './SegmentedControl';
import { TimeColumns, type TimeOption } from './time-columns';

/** The parts of the field, in the order they are read. */
type Part = 'hour' | 'minute' | 'second' | 'period';

interface Parts {
  /** 0..23, whatever the displayed hour cycle. */
  readonly hour: number | null;
  readonly minute: number | null;
  readonly second: number | null;
}

const EMPTY: Parts = { hour: null, minute: null, second: null };

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** `HH:mm[:ss]` in, parts out. Anything malformed reads as empty rather than as zero. */
function parseParts(value: string | null): Parts {
  if (!value) return EMPTY;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return EMPTY;
  const [, rawHour, rawMinute, rawSecond] = match;
  if (rawHour === undefined || rawMinute === undefined) return EMPTY;
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  const second = rawSecond === undefined ? 0 : Number(rawSecond);
  if (hour > 23 || minute > 59 || second > 59) return EMPTY;
  return { hour, minute, second };
}

/** Only a whole time is a value; a half-typed one reads as empty, as the native field does. */
function serialise(parts: Parts, seconds: boolean): string | null {
  if (parts.hour === null || parts.minute === null) return null;
  if (seconds && parts.second === null) return null;
  const clock = `${pad(parts.hour)}:${pad(parts.minute)}`;
  return seconds ? `${clock}:${pad(parts.second ?? 0)}` : clock;
}

function wrap(value: number, span: number): number {
  return ((value % span) + span) % span;
}

export interface TimePickerProps {
  /** `HH:mm` on a 24-hour clock, the shape a native time input carries. */
  readonly value?: string | null | undefined;
  readonly defaultValue?: string | null | undefined;
  readonly onValueChange?: ((value: string | null) => void) | undefined;
  /** Force the clock. Leave it off and the picker owns the choice, starting from the locale. */
  readonly hourCycle?: 12 | 24 | undefined;
  /** Where an uncontrolled picker starts. Omit to follow the locale. */
  readonly defaultHourCycle?: 12 | 24 | undefined;
  readonly onHourCycleChange?: ((cycle: 12 | 24) => void) | undefined;
  /**
   * Show the 12/24 switch in the panel. Defaults to on unless `hourCycle` is controlled,
   * where a switch would only offer a choice the component is not allowed to make.
   */
  readonly hourCycleToggle?: boolean | undefined;
  readonly locale?: string | undefined;
  /** Minutes an arrow key moves, and what the dial snaps to. 15 gives quarter-hour slots. */
  readonly minuteStep?: number | undefined;
  /** Add a seconds segment and column. The value then carries `HH:mm:ss`. */
  readonly seconds?: boolean | undefined;
  /** Show the button that opens the picker. Off leaves a keyboard-only field. */
  readonly clock?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  /** Advisory only: the segments are not form controls the browser can validate. */
  readonly required?: boolean | undefined;
  readonly name?: string | undefined;
  readonly id?: string | undefined;
  readonly className?: string | undefined;
  readonly 'aria-label'?: string | undefined;
  readonly 'aria-labelledby'?: string | undefined;
}

/**
 * A segmented clock field: hours, minutes and, on a 12-hour locale, the day period. Each
 * segment is a spinbutton, so it reads and behaves the way the platform's own field does
 * while staying stylable, which a native time input is not.
 */
export function TimePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  hourCycle,
  defaultHourCycle,
  onHourCycleChange,
  hourCycleToggle,
  locale,
  minuteStep = 1,
  seconds = false,
  clock = true,
  disabled = false,
  required = false,
  name,
  id,
  className,
  ...labelling
}: TimePickerProps): ReactElement {
  const generatedId = useId();
  const fieldId = id ?? `${generatedId}-time`;
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });
  const [cycle, setCycle] = useControllableState<12 | 24>({
    value: hourCycle,
    defaultValue: defaultHourCycle ?? localeHourCycle(locale),
    onChange: onHourCycleChange,
  });
  const showCycleToggle = hourCycleToggle ?? hourCycle === undefined;
  const periods = dayPeriodLabels(locale);

  // The segments are the working copy: an hour with no minute yet is a state no `HH:mm` can
  // hold, so the draft leads and the value follows once the time is whole.
  const [draft, setDraft] = useState<Parts>(() => parseParts(value));
  const seen = useRef(value);
  if (seen.current !== value) {
    seen.current = value;
    const next = parseParts(value);
    if (serialise(next, seconds) !== serialise(draft, seconds)) setDraft(next);
  }

  const [focus, setFocus] = useState<Part>('hour');
  const [panelOpen, setPanelOpen] = useState(false);
  // Digits typed in quick succession build one number: 0 then 9 is 09, not 9.
  const typed = useRef<{ segment: Part; text: string } | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  const parts: readonly Part[] = [
    'hour',
    'minute',
    ...(seconds ? (['second'] as const) : []),
    ...(cycle === 12 ? (['period'] as const) : []),
  ];

  const commit = useCallback(
    (next: Parts): void => {
      setDraft(next);
      const serialised = serialise(next, seconds);
      seen.current = serialised;
      setValue(serialised);
    },
    [setValue, seconds],
  );

  const focusSegment = (segment: Part): void => {
    setFocus(segment);
    ref.current?.querySelector<HTMLElement>(`[data-segment="${segment}"]`)?.focus();
  };

  const step = (segment: Part, direction: 1 | -1): void => {
    if (segment === 'minute') {
      const from = draft.minute ?? (direction === 1 ? -minuteStep : 0);
      commit({ ...draft, minute: wrap(from + direction * minuteStep, 60) });
      return;
    }
    if (segment === 'second') {
      const from = draft.second ?? (direction === 1 ? -1 : 0);
      commit({ ...draft, second: wrap(from + direction, 60) });
      return;
    }
    if (segment === 'period') {
      if (draft.hour === null) return;
      commit({ ...draft, hour: wrap(draft.hour + 12, 24) });
      return;
    }
    const from = draft.hour ?? (direction === 1 ? -1 : 0);
    commit({ ...draft, hour: wrap(from + direction, 24) });
  };

  /** Accumulates digits and moves on as soon as no further digit could fit. */
  const typeDigit = (segment: Part, digit: string): void => {
    if (segment === 'period') return;
    const previous = typed.current?.segment === segment ? typed.current.text : '';
    const max = segment === 'hour' ? (cycle === 12 ? 12 : 23) : 59;
    const floor = segment === 'hour' && cycle === 12 ? 1 : 0;
    let text = previous + digit;
    if (Number(text) > max || text.length > 2) text = digit;
    let entered = Number(text);
    if (entered < floor) {
      // A bare 0 on a 12-hour clock is not an hour yet; wait for the second digit.
      typed.current = { segment, text };
      return;
    }
    if (segment === 'hour' && cycle === 12) {
      const afternoon = draft.hour !== null && draft.hour >= 12;
      entered = (entered % 12) + (afternoon ? 12 : 0);
    }
    commit(
      segment === 'hour'
        ? { ...draft, hour: entered }
        : segment === 'second'
          ? { ...draft, second: entered }
          : { ...draft, minute: entered },
    );
    const full = text.length === 2 || Number(text) * 10 > max;
    typed.current = full ? null : { segment, text };
    if (full) {
      const at = parts.indexOf(segment);
      const onward = parts[at + 1];
      if (onward) focusSegment(onward);
    }
  };

  const handleKey =
    (segment: Part) =>
    (event: KeyboardEvent<HTMLElement>): void => {
      if (disabled) return;
      const at = parts.indexOf(segment);
      const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
      const back = rtl ? 'ArrowRight' : 'ArrowLeft';
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      if (event.key === back || event.key === forward) {
        const to = parts[at + (event.key === forward ? 1 : -1)];
        if (!to) return;
        event.preventDefault();
        focusSegment(to);
        return;
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        typed.current = null;
        step(segment, event.key === 'ArrowUp' ? 1 : -1);
        return;
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        typed.current = null;
        commit(
          segment === 'minute'
            ? { ...draft, minute: null }
            : segment === 'second'
              ? { ...draft, second: null }
              : { ...draft, hour: null },
        );
        return;
      }
      if (segment === 'period' && /^[ap]$/i.test(event.key)) {
        event.preventDefault();
        const hour = draft.hour ?? 0;
        const afternoon = event.key.toLowerCase() === 'p';
        commit({ ...draft, hour: (hour % 12) + (afternoon ? 12 : 0) });
        return;
      }
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        typeDigit(segment, event.key);
      }
    };

  const hourText =
    draft.hour === null
      ? '--'
      : cycle === 12
        ? String(draft.hour % 12 === 0 ? 12 : draft.hour % 12).padStart(2, '0')
        : String(draft.hour).padStart(2, '0');
  const minuteText = draft.minute === null ? '--' : pad(draft.minute);
  const secondText = draft.second === null ? '--' : pad(draft.second);
  const afternoon = draft.hour !== null && draft.hour >= 12;
  const periodText = draft.hour === null ? '--' : (periods[afternoon ? 1 : 0] ?? '');

  // What the segments actually hold, so a malformed prop cannot leak into a form or read as
  // filled when the field shows blanks.
  const current = serialise(draft, seconds);

  // The columns always read something, so a blank field opens on the current hour rather than
  // on midnight, which is almost never what someone reaching for the picker means.
  const shownHour = draft.hour ?? new Date().getHours();
  const shownMinute = draft.minute ?? 0;
  const shownSecond = draft.second ?? 0;

  // What sits under the band is the time, so touching any column makes the whole of it real
  // rather than leaving a half-set clock that reports nothing.
  const fromColumns = (over: Partial<Parts>): Parts => ({
    hour: shownHour,
    minute: shownMinute,
    second: shownSecond,
    ...over,
  });

  const range = (count: number, step = 1): readonly TimeOption[] =>
    Array.from({ length: Math.ceil(count / step) }, (_, index) => ({
      value: index * step,
      label: pad(index * step),
    }));

  // On a 12-hour clock the hour column runs 12, 1..11 and the period column carries the half.
  const hourOptions: readonly TimeOption[] =
    cycle === 12
      ? Array.from({ length: 12 }, (_, index) => ({
          value: (index + (afternoon ? 12 : 0)) % 24,
          label: pad(index === 0 ? 12 : index),
        }))
      : range(24);

  const columns = [
    {
      label: 'Hours',
      head: 'Hour',
      options: hourOptions,
      value: shownHour,
      onChange: (next: number) => commit(fromColumns({ hour: next })),
    },
    {
      label: 'Minutes',
      head: 'Min',
      options: range(60, minuteStep),
      value: shownMinute,
      onChange: (next: number) => commit(fromColumns({ minute: next })),
    },
    ...(seconds
      ? [
          {
            label: 'Seconds',
            head: 'Sec',
            options: range(60),
            value: shownSecond,
            onChange: (next: number) => commit(fromColumns({ second: next })),
          },
        ]
      : []),
    ...(cycle === 12
      ? [
          {
            label: 'AM or PM',
            head: '',
            options: [
              { value: 0, label: periods[0] ?? 'AM' },
              { value: 12, label: periods[1] ?? 'PM' },
            ] as const satisfies readonly TimeOption[],
            value: afternoon ? 12 : 0,
            onChange: (next: number) => commit(fromColumns({ hour: (shownHour % 12) + next })),
          },
        ]
      : []),
  ];

  // Turning off the 12-hour clock retires the period part; focus must not be left on it.
  const activePart: Part = parts.includes(focus) ? focus : 'hour';

  const segmentClass = cn(
    'cursor-default select-none rounded-[3px] px-0.5 tabular-nums outline-none',
    'focus:bg-(--primary) focus:text-(--primary-foreground)',
  );

  const spin = (
    segment: Part,
    label: string,
    text: string,
    now: number | null,
    min: number,
    max: number,
  ): ReactElement => (
    <span
      role="spinbutton"
      data-segment={segment}
      aria-label={label}
      aria-valuenow={now ?? undefined}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={now === null ? 'Empty' : text}
      aria-disabled={disabled || undefined}
      aria-required={required || undefined}
      // One tab stop for the field; the arrows walk the segments, as in the native control.
      tabIndex={disabled ? -1 : activePart === segment ? 0 : -1}
      onKeyDown={handleKey(segment)}
      onFocus={() => setFocus(segment)}
      className={cn(segmentClass, text === '--' && 'text-muted-foreground')}
    >
      {text}
    </span>
  );

  return (
    <>
      {/* A fieldset would be the platform's own grouping element, but its anonymous content
          box does not take the height set on it, so the segments sit high with the slack
          below them. A div carrying the same group role lays out honestly. */}
      {/* biome-ignore lint/a11y/useSemanticElements: a fieldset cannot be given this field's height without leaving its contents off-centre */}
      <div
        role="group"
        ref={ref}
        id={fieldId}
        data-slot="time-picker"
        data-empty={current ? undefined : ''}
        aria-disabled={disabled || undefined}
        className={cn(
          'time-field field inline-flex h-(--control-md) min-w-0 items-center px-2',
          disabled && 'cursor-not-allowed opacity-45',
          className,
        )}
        {...labelling}
      >
        {spin(
          'hour',
          'Hour',
          hourText,
          // valuenow has to fall inside valuemin..valuemax, so on a 12-hour clock it is the
          // displayed hour, not the 24-hour one the value carries.
          draft.hour === null || cycle === 24 ? draft.hour : draft.hour % 12 || 12,
          cycle === 12 ? 1 : 0,
          cycle === 12 ? 12 : 23,
        )}
        <span aria-hidden="true" className="text-muted-foreground">
          :
        </span>
        {spin('minute', 'Minute', minuteText, draft.minute, 0, 59)}
        {seconds ? (
          <>
            <span aria-hidden="true" className="text-muted-foreground">
              :
            </span>
            {spin('second', 'Second', secondText, draft.second, 0, 59)}
          </>
        ) : null}
        {cycle === 12 ? (
          <span
            role="spinbutton"
            data-segment="period"
            aria-label="AM or PM"
            aria-valuetext={periodText === '--' ? 'Empty' : periodText}
            aria-disabled={disabled || undefined}
            aria-required={required || undefined}
            tabIndex={disabled ? -1 : activePart === 'period' ? 0 : -1}
            onKeyDown={handleKey('period')}
            onFocus={() => setFocus('period')}
            className={cn(segmentClass, 'ml-1', periodText === '--' && 'text-muted-foreground')}
          >
            {periodText}
          </span>
        ) : null}
        {clock ? (
          <Popover open={panelOpen} onOpenChange={setPanelOpen}>
            <PopoverTrigger
              type="button"
              disabled={disabled}
              aria-label="Open the time picker"
              data-slot="time-picker-clock"
              className={cn(
                'ml-auto flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-[5px]',
                'text-muted-foreground outline-none hover:text-foreground focus-visible:focus-outline',
                'transition-colors duration-(--duration-fast)',
              )}
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.4}
                strokeLinecap="round"
                aria-hidden="true"
                className="size-3.5"
              >
                <circle cx="8" cy="8" r="6.25" />
                <path d="M8 4.5V8l2.25 1.75" />
              </svg>
            </PopoverTrigger>
            {/* The shared popover minimum would leave a column's worth of dead space on a
                24-hour clock; this panel is sized by its columns, and the positioner's
                resize observer re-anchors it when the period column comes and goes. */}
            <PopoverContent align="end" className="w-auto min-w-0 p-2.5">
              <TimeColumns columns={columns} open={panelOpen} />
              {showCycleToggle ? (
                <SegmentedControl
                  aria-label="Hour format"
                  value={String(cycle)}
                  onValueChange={(next) => setCycle(next === '12' ? 12 : 24)}
                  className="mt-2 h-(--control-sm) w-full"
                >
                  <Segment value="12">12h</Segment>
                  <Segment value="24">24h</Segment>
                </SegmentedControl>
              ) : null}
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
      {name ? <input type="hidden" name={name} value={current ?? ''} /> : null}
    </>
  );
}
