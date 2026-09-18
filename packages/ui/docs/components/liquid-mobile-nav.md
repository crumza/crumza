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

Hold, and the pane lifts. A finger that rests on the dock for 180ms, or slides sideways at all, takes the pane off the glass: it grows by 14%, brightens, and the glyph under it grows by 30% with it. From there the pane follows the finger one to one across the bar, with no easing between them, and the swell moves from glyph to glyph as the finger crosses into each slot. Past either end the pane gets heavy rather than free, following a third of the pull and no more than a third of a slot. Let go and it springs onto the nearest slot, settling down from its lifted size rather than dropping to it, and that slot is the pick: a drag chooses on release, where a tap chooses on the way down. A press that lets go before the hold is up is a tap, and nothing about it has changed.

The pane does not slide, it throws. It leaves on a curve that carries about 13% of a slot past its mark and settles back, and it stretches along the way in proportion to the ground it has to cover: 7% of its width per slot, so a jump across the whole bar stretches it by a quarter and a step to the neighbour barely at all. The glyph swells and drops back over the same 360ms, so the two read as one movement rather than a sequence. Tapping the item you are already on answers too: the pane and the glyph are re-keyed on every pick, and an element that has just mounted runs its animations from the start.

No glyph ever changes the size it occupies. The pop is a scale, which moves no layout, so the row sits exactly where it was through all of it, and the pane is one element travelling by exactly its own width rather than one pane per item. The glyph you are on carries a heavier stroke, which is the difference an outline set can make between chosen and not.

A press here takes neither the scene's press dip nor its ripple: the swell and the glass are the answer, they start on the way down, and both of the others would be arguing with them on the same frame.

While the pane is lifted the dock carries `data-drag` and the slot under the finger carries `data-hot`; `aria-current` stays where it was until the release chooses. The items set `touch-action: none`, so the browser never reads the drag as a pan and takes the pointer back; the pointer is captured to the item it landed on, so a finger that wanders off the bar keeps carrying the pane.

A `<nav>` of labelled buttons with `aria-current="page"` on the one you are on. Tab reaches each item and Enter or Space chooses it; the glyphs read at full strength, so the pane behind the current one is the whole signal.

## Why it stays smooth

There is no frame loop in this component. The pane is a transform on one element and the pop is one keyframe on another, and both sit in the surface's content layer, which is above the filtered layers rather than inside them: the compositor carries the animation, and the engine is never asked to repaint a filter for either. The bar's box never changes either, so it builds one displacement map on its first paint and keeps it.

A drag is one custom property per pointer event, written straight to the dock rather than through React: the pane reads its position from `--x` in slots, so a move is a style write and a composited transform, nothing more. The component renders only when the finger crosses into another slot, to move the swell to that glyph.

Reduced motion keeps the pane and drops every movement: the glass is simply already there, and a drag carries it without anything growing on the way.
