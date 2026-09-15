# Spinner

An indeterminate wait of unknown length. When you know how far along the work is, use
[Progress](/docs/components/progress) instead: a bar that fills is worth more than a wheel
that turns. For content that has not arrived yet, use [Skeleton](/docs/components/skeleton).

```tsx
<Spinner label="Checking availability" />

<Button disabled>
  <Spinner size="sm" />
  Saving
</Button>
```

The spinner draws in `currentColor`, so inside a button it takes that button's label colour
with no configuration.

## Labelling

Without `label` the spinner is decorative: it carries `aria-hidden`, which is correct when
visible text beside it already says what is happening, as in the button above. Pass `label`
for a spinner that stands alone and the root becomes `role="status"` with the text announced
from a visually hidden span. Your own `aria-label` or `aria-labelledby` has the same effect.

## Props

Extends `ComponentProps<'span'>` minus `children`.

| Prop | Type | Notes |
| --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | 12, 16 or 24px; default `'md'` |
| `label` | `string` | announced, not drawn |

A spinner means motion, so reduced motion slows the turn from 0.7s to 1.8s rather than
freezing it, which would leave a ring saying nothing at all.
