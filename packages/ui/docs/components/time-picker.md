# TimePicker

A segmented clock field: hours, minutes and, on a 12-hour locale, the day period. Each segment
is a spinbutton, so it behaves the way the platform's own field does while staying stylable,
which a native time input is not.

```tsx
const [at, setAt] = useState<string | null>('09:05');

<Field label="Starts at" htmlFor="at">
  <TimePicker id="at" value={at} onValueChange={setAt} name="at" />
</Field>
```

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `string \| null` | uncontrolled |
| `defaultValue` | `string \| null` | `null` |
| `onValueChange` | `(value: string \| null) => void` | |
| `hourCycle` | `12 \| 24` | uncontrolled |
| `defaultHourCycle` | `12 \| 24` | the locale's |
| `onHourCycleChange` | `(cycle: 12 \| 24) => void` | |
| `hourCycleToggle` | `boolean` | on unless `hourCycle` is set |
| `locale` | `string` | the runtime's |
| `minuteStep` | `number` | `1` |
| `seconds` | `boolean` | `false` |
| `clock` | `boolean` | `true` |
| `disabled` | `boolean` | `false` |
| `required` | `boolean` | `false` |
| `name` | `string` | |
| `id` | `string` | generated |

The value is always a 24-hour clock, whatever the field displays, the same shape a native time
input carries, so it round-trips through a form or a server unchanged. A 12-hour locale shows
`09:05 PM` and still reports `21:05`.

`seconds` adds a third segment and column, and lengthens the value from `HH:mm` to `HH:mm:ss`.
It is off by default so the value keeps the shape a native time input has; turn it on and the
seconds a `value` already carried stop being dropped.

## Choosing the clock

The panel carries a 12h / 24h switch, so the reader is not stuck with whichever clock their
locale assumes. It starts on the locale's own, or on `defaultHourCycle` where you would rather
pick the opening position yourself.

**The switch changes the display, never the value.** Nine in the evening reads `21:05` on one
clock and `09:05 PM` on the other, and reports `21:05` either way.

`hourCycle` forces the clock, and the switch then disappears rather than offering a choice the
component is not allowed to make. Pass `onHourCycleChange` alongside it to drive the choice
yourself, and `hourCycleToggle` to bring the switch back.

Only a whole time is a value. Half a clock reads as `null`, as the native field does, so
`onValueChange` never hands you an hour with no minute. A `value` the component cannot parse is
shown as blanks rather than silently read as midnight, and it is not submitted.

`minuteStep` sets what the arrows move and what the dial snaps to, not what can be typed:
`minuteStep={15}` steps through the quarter hours while still accepting 09:07 from the keyboard.

## The columns

The clock button opens a column per part: hours, minutes, seconds where they are on, and the
day period on a 12-hour locale. The reading is whatever sits under the band across the middle:
scroll a column, or press a row to bring it there.

Each column is a listbox with one tab stop, and `↑` `↓` walk it, `PageUp` and `PageDown` jump
five, `Home` and `End` reach the ends. The minute column follows `minuteStep`, so
`minuteStep={15}` lists four rows rather than sixty.

Every row is one row tall, which is what keeps the reading honest: the selected row is exactly
`scrollTop / rowHeight`, with nothing measured and nothing to drift. Rows glide into place
rather than jumping, the ends of each column fade so it reads as a reel, and the row under the
band lifts a little as it takes the reading. Under `prefers-reduced-motion: reduce` the scroll
stops animating and the lift's duration goes to zero through the shared `--motion-scale` token.

Set `clock={false}` to leave a keyboard-only field. The columns are a pointer affordance: every
time they can set is reachable from the segments without them.

`required` is advisory. It sets `aria-required` on the segments; the segments are not form
controls the browser can validate, so check on submit.

## Keyboard

The segments are one Tab stop. Tab moves past the whole clock rather than through its three
parts, and the arrows walk it, the same bargain the calendar grid makes. The clock button is
the next stop after them.

| Key | Does |
| --- | --- |
| `←` `→` | move between segments, mirrored in RTL |
| `↑` `↓` | change the focused segment, wrapping |
| digits | type into the segment, moving on when no further digit could fit |
| `a` / `p` | set the day period, where the clock has one |
| `Backspace` / `Delete` | clear the segment |

Typing builds a number rather than replacing one: `0` then `9` in the hour gives 09. Type `9`
into a 24-hour field and focus moves on at once, because no second digit could follow it.
