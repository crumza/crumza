# Slider

A native range input, so arrows, Home, End, PageUp and PageDown work and screen readers
announce the value. The track fills to the value; the thumb is lit.

```tsx
<Slider min={50} max={200} step={10} value={zoom} onValueChange={setZoom} aria-label="Zoom" />
```

## Props

Extends `ComponentProps<'input'>` minus `type`, `value`, `defaultValue`, `onChange`, `size`.

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `number` | uncontrolled |
| `defaultValue` | `number` | `min` |
| `onValueChange` | `(value: number) => void` | |
| `min`, `max`, `step` | `number` | `0`, `100`, `1` |

Label it with `<Field label htmlFor>` or `aria-label`. Use `aria-valuetext` when the number
alone is meaningless.
