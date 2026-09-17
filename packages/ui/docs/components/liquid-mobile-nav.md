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

It answers on the way down. A click arrives on release, which on a phone is a hundred milliseconds after the finger landed and reads as the glass chasing the touch rather than meeting it, so the pick is made on `pointerdown`: measured on a phone at six times slower than desktop, the pane is moving 37ms after the finger lands and has settled by 371ms. The trade is the one every down-commit makes: a press that was meant as the start of a scroll still chooses.

The pane does not slide, it throws. It leaves on a curve that carries about 13% of a slot past its mark and settles back, and it stretches along the way in proportion to the ground it has to cover: 7% of its width per slot, so a jump across the whole bar stretches it by a quarter and a step to the neighbour barely at all. The glyph swells and drops back over the same 360ms, so the two read as one movement rather than a sequence. Tapping the item you are already on answers too: the pane and the glyph are re-keyed on every pick, and an element that has just mounted runs its animations from the start.

No glyph ever changes the size it occupies. The pop is a scale, which moves no layout, so the row sits exactly where it was through all of it, and the pane is one element travelling by exactly its own width rather than one pane per item. The glyph you are on carries a heavier stroke, which is the difference an outline set can make between chosen and not.

A press here takes neither the scene's press dip nor its ripple: the swell and the glass are the answer, they start on the way down, and both of the others would be arguing with them on the same frame.

A `<nav>` of labelled buttons with `aria-current="page"` on the one you are on. Tab reaches each item and Enter or Space chooses it; the glyphs read at full strength, so the pane behind the current one is the whole signal.

## Why it stays smooth

There is no frame loop in this component. The pane is a transform on one element and the pop is one keyframe on another, and both sit in the surface's content layer, which is above the filtered layers rather than inside them: the compositor carries the animation, and the engine is never asked to repaint a filter for either. The bar's box never changes either, so it builds one displacement map on its first paint and keeps it.

Reduced motion keeps the pane and drops every movement: the glass is simply already there.
