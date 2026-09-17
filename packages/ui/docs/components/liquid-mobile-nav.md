# LiquidMobileNav

A dock at the foot of the scene, where a thumb can reach it.

```tsx
import { LiquidScene, LiquidMobileNav } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[460px]">
  <LiquidMobileNav radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `radius` | `number` | `40` | capped at 34 by the bar height; the pane inside it follows |

## Behaviour

Choosing is two beats rather than one. The glyph jumps, up and back inside a third of a second, and the pane of glass slides in under it a beat later, so the tap is answered before the state catches up with it. Tapping the item you are already on says so again: the glyph is re-keyed on every pick, and an element that has just mounted runs its animation.

No glyph ever changes the size it occupies. The pop is a scale, which moves no layout, so the row sits exactly where it was through all of it, and the pane is one element that travels by exactly its own width rather than one pane per item.

A `<nav>` of labelled buttons with `aria-current="page"` on the one you are on. Tab reaches each item and Enter or Space chooses it; the glyphs read at full strength, so the pane behind the current one is the whole signal.

## Why it stays smooth

There is no frame loop in this component. The pane is a transform on one element and the pop is one keyframe on another, and both sit in the surface's content layer, which is above the filtered layers rather than inside them: the compositor carries the animation, and the engine is never asked to repaint a filter for either. The bar's box never changes either, so it builds one displacement map on its first paint and keeps it.

Reduced motion keeps the pane and drops both movements: the glass is simply already there.
