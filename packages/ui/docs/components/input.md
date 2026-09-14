# Input

A native input with the field treatment: hairline at rest, stronger on hover, accent on focus,
destructive when `aria-invalid`.

```tsx
import { Field, Input } from '@crumza/ui/web';

<Field label="Title" htmlFor="title" description="Shown in the window title bar.">
  <Input id="title" placeholder="Untitled" />
</Field>
```

## Props

Extends `ComponentProps<'input'>` minus the native `size` attribute.

| Prop | Type | Default |
| --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |

## Accessibility

Always labelled: through `<Field htmlFor>`, a `<Label htmlFor>`, or `aria-label`. Set
`aria-invalid="true"` and describe the error with `<Field error>`.
