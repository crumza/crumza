# Checkbox

An independent on/off choice. A native checkbox, so keyboard, forms and `indeterminate` work as
usual; the mark draws itself in.

```tsx
<Checkbox label="Track changes" defaultChecked />
<Checkbox aria-label="Select row" />
```

## Props

Extends `ComponentProps<'input'>` minus `type` and `size`.

| Prop | Type | Notes |
| --- | --- | --- |
| `label` | `ReactNode` | renders a clickable labelled row; omit for a bare control and give it `aria-label` |

An `id` is generated if you do not pass one, so the label association is always real.
