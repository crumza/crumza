# Badge

A small fact: status, count, category. Never an action; if it needs a click it is a Button.

```tsx
<Badge variant="accent">New</Badge>
<Badge>Draft</Badge>
<Badge variant="outline">v0.1</Badge>
<Badge variant="destructive">Failing</Badge>
```

## Props

Extends `ComponentProps<'span'>`.

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | `'accent' \| 'neutral' \| 'outline' \| 'destructive'` | `'neutral'` |

`accent` uses the brand color at 12% fill and 40% border, so it stays a fact rather than a
second primary control.
