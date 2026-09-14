# Separator

A hairline. Decorative by default (hidden from assistive tech); pass `decorative={false}` when it
separates meaningful groups and should be announced.

```tsx
<Separator />
<Separator orientation="vertical" className="mx-1" />
```

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `decorative` | `boolean` | `true` |
| `className` | `string` | |

Thickness is `--hairline`: 1px, and 0.5px on 2x displays.
