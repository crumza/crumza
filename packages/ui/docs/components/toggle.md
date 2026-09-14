# Toggle

A button with a pressed state (`aria-pressed`): bold, italic, grid on and off.

```tsx
<Toggle aria-label="Bold" defaultPressed>B</Toggle>
<Toggle pressed={grid} onPressedChange={setGrid}>Grid</Toggle>
```

## Props

Extends `ComponentProps<'button'>` minus `onChange`.

| Prop | Type | Default |
| --- | --- | --- |
| `pressed` | `boolean` | uncontrolled |
| `defaultPressed` | `boolean` | `false` |
| `onPressedChange` | `(pressed: boolean) => void` | |
| `size` | `'sm' \| 'md'` | `'md'` |

Rect-shaped by design; toggles live in dense chrome. For a group of exclusive toggles use
[SegmentedControl](/docs/components/segmented-control).
