# Toolbar

A row of controls that behaves as one Tab stop: arrow keys move focus inside it, Home and End
jump to the ends (WAI-ARIA toolbar pattern).

```tsx
import { Toolbar, Glass, Button } from '@crumza/ui/web';

<Toolbar aria-label="Formatting" className="gap-3">
  <Glass className="flex gap-0.5 p-1">
    <Button size="sm" variant="ghost" shape="rect">Undo</Button>
    <Button size="sm" variant="ghost" shape="rect">Redo</Button>
  </Glass>
  <span className="flex-1" />
  <Button size="sm" variant="primary">Share</Button>
</Toolbar>
```

## Props

Extends `ComponentProps<'div'>`.

| Prop | Type | Default |
| --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |

## Accessibility

Give it `aria-label`. Focusable descendants are found live (`button`, `[href]`, `input`,
`select`, `[tabindex]`), so groups and separators inside it are fine. The toolbar does not
manage `tabIndex` on children; the first control is reachable by Tab, the rest by arrows, and a
second Tab leaves the toolbar because browsers move to the next tabbable element in DOM order.
