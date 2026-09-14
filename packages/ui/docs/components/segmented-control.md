# SegmentedControl and Segment

One of a few, inline: a trough with a raised selected segment. Native radios underneath, so it
is a radiogroup to assistive tech and arrow keys move the selection.

```tsx
<SegmentedControl value={align} onValueChange={setAlign} aria-label="Alignment">
  <Segment value="left">Left</Segment>
  <Segment value="center">Center</Segment>
  <Segment value="right">Right</Segment>
</SegmentedControl>
```

## SegmentedControl props

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `string` | uncontrolled |
| `defaultValue` | `string` | `''` |
| `onValueChange` | `(value: string) => void` | |
| `name` | `string` | generated |
| `disabled` | `boolean` | `false` |
| `aria-label` | `string` | give one |
| `className` | `string` | |

## Segment props

Extends `ComponentProps<'input'>` minus `value`, `type`, `size`. `value` and `children` are
required.

Use it for two to five short options. Beyond that, a Select.
