# Progress

The progress of a long task. Omit `value` for an indeterminate sweep. Long work must never
block the UI: pair the bar with a working Stop button.

```tsx
<Progress value={42} aria-label="Export progress" />
<Progress aria-label="Indexing" />
```

## Props

Extends `ComponentProps<'div'>`. `role="progressbar"` with `aria-valuemin`, `aria-valuemax`
and `aria-valuenow` (omitted when indeterminate).

| Prop | Type | Notes |
| --- | --- | --- |
| `value` | `number` | 0 to 100; clamped |

Under reduced motion the indeterminate sweep becomes a dim static bar.
