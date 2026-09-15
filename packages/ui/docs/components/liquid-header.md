# LiquidHeader

A glass navigation bar whose menu opens beneath the item you point at and slides between items.

```tsx
import { LiquidScene, LiquidHeader } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[420px]">
  <LiquidHeader radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `radius` | `number` | `40` | capped at 28 by the bar height; the menu inherits it |

## Behaviour

Pointer enter, focus or a click opens an item; leaving the bar and its menu closes it. Each item is a native button with `aria-expanded`; the panel is a `role="menu"` of `menuitem` buttons. The panel is one surface that moves by transform, so switching menus never rebuilds a displacement map. Rows fade in briefly as they are replaced.
