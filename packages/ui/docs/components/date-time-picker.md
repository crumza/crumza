# DateTimePicker

A day grid and a native time field in a popover. Everything is local time: the component never
converts zones, and what you put in is what you get back.

```tsx
const [when, setWhen] = useState<Date | null>(null);

<Field label="Starts at" htmlFor="starts">
  <DateTimePicker id="starts" value={when} onValueChange={setWhen} name="starts" />
</Field>
```

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `Date \| null` | uncontrolled |
| `defaultValue` | `Date \| null` | `null` |
| `onValueChange` | `(value: Date \| null) => void` | |
| `min` / `max` | `Date` | unbounded |
| `locale` | `string` | the runtime's |
| `weekStartsOn` | `0`–`6` | `1` (Monday) |
| `time` | `boolean` | `true` |
| `disabled` | `boolean` | `false` |
| `required` | `boolean` | `false` |
| `name` | `string` | |
| `id` | `string` | generated |
| `placeholder` | `string` | `'Pick a date'` |

`min` and `max` bound the **day**; their time of day is ignored, so a `max` of 20 March at 09:00
still allows 20 March at 23:00. Days outside the range are disabled, and so is the month arrow
that would only lead further out.

With `time` on, picking a day keeps the popover open so the clock can be set too, and the clock
is a [TimePicker](/docs/components/time-picker), the same segmented field, with the same
scrolling columns behind its button. With `time` off it closes on the pick, because there is
nothing left to ask. The value is held to the minute, so the picker shows no seconds column.

## Forms

Give it a `name` and it renders a hidden input carrying the local wall clock:
`2026-03-14T09:05`, or `2026-03-14` with `time` off. That is the same shape a native
`datetime-local` or `date` input submits, with no zone suffix for the server to misread.

`required` is advisory: it sets `aria-required` on the trigger. A hidden input is barred from
constraint validation, so the browser will not block submission on its own; validate on submit.

## Keyboard

The trigger opens the popover, and focus moves to the selected day, or to today.

| Key | Moves |
| --- | --- |
| `←` `→` | one day, mirrored in RTL |
| `↑` `↓` | one week |
| `Home` / `End` | first and last day of that week |
| `PageUp` / `PageDown` | one month |
| `Shift` + `PageUp` / `PageDown` | one year |
| `Enter` / `Space` | select the focused day |
| `Escape` | close and return focus to the trigger |

The grid is one Tab stop, so Tab leaves it for the time field and the Today and Clear buttons
rather than walking 42 days.

## Accessibility

The grid is a real `<table role="grid">`, which keeps the row and column semantics a stack of
divs would throw away. Each day is a button with a full date as its accessible name, so it
announces "Saturday, 14 March 2026" rather than "14". The selected day carries `aria-selected`
on its cell, today carries `aria-current="date"`, and the month heading is a polite live region
so paging is announced without interrupting the focused day.

## Server rendering

The value is formatted with `Intl` in the host's own time zone. If your server and browser
disagree about the zone, a `defaultValue` can format differently in each and React will report
a hydration mismatch. Render the picker empty and set the value on the client, or make the two
environments agree on `TZ`.
