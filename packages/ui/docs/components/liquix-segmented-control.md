# LiquixSegmentedControl

A choice among a few options as one bar of glass, with a capsule that travels to the chosen one. The compact sibling of [LiquixTabs](/docs/components/liquix-tabs): text labels, two heights, the radiogroup pattern.

```tsx
import { LiquixSegmentedControl } from '@crumza/ui';

<LiquixSegmentedControl
  label="Range"
  options={[
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ]}
  value={range}
  onValueChange={setRange}
  className="w-72"
/>
```

Render it in a [LiquixSurface](/docs/components/liquix-surface) overlay for the shader's glass. Elsewhere, or without WebGL2, it is CSS liquid glass with the same shapes and motion.

## Props

| Prop | Default | Meaning |
| --- | --- | --- |
| options | required | `[{ value, label, disabled }]` |
| value, defaultValue, onValueChange | first option | Controlled or uncontrolled value |
| label | required | The accessible name of the group |
| size | `md` | `sm` is 32px tall, `md` 40px |
| className | `w-full` | Sizes the control; the segments share its width equally |
| activeClassName | `text-blue-600` | Classes for the labels where the capsule is |
| inactiveClassName | `liquix-ink` | Classes for the labels outside it: white with a drop shadow |
| pillClassName | none | Classes added to the parked capsule |

## Behaviour

Everything the tab bar does: the capsule travels on a spring, glass while it moves and settling flat in about 100ms; a label's colour follows the capsule's outline; the capsule can be dragged and snaps to the nearest segment; arrow keys move and choose, Home and End jump to the ends. Every segment is a real `<button role="radio">` in a radiogroup.
