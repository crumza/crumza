# LiquidDockMenu

A pill of glyphs at the foot of the scene that unfolds into a menu, and folds back.

```tsx
import { LiquidScene, LiquidDockMenu } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[420px]">
  <LiquidDockMenu radius={40} onSelect={(id) => navigate(id)} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `items` | `LiquidDockMenuItem[]` | Home, Discover, Favorites, Notebooks, Settings | the menu, top level first; the first four are also the pill's glyphs |
| `onSelect` | `(id: string) => void` | | an item without a page was chosen, in the pill or in the menu |
| `open` | `boolean` | | controlled; leave it out for uncontrolled |
| `defaultOpen` | `boolean` | `false` | the uncontrolled start |
| `onOpenChange` | `(open: boolean) => void` | | fires as the pill unfolds and as it folds |
| `radius` | `number` | `40` | capped at 22 by the pill height; the panel's corners carry the same curve, the glyph rounds and the rows are inset from it |
| `aria-label` | `string` | `Menu` | names the pill and the menu |
| `className` | `string` | | merged onto the root |

An item is `{ id, label, icon, items? }`. `icon` is any component that draws an SVG from its props; the set's own glyphs are Lucide paths, and the type `IconComponent` is exported for yours. An item with `items` is a page of the menu: choosing it turns the menu to those rows, behind a Back row, rather than reporting a selection. The pill is 192px wide and 44px tall, or the room the scene gives it; the panel is 228px wide and as tall as its page, 32px a row inside an 8px inset.

## Behaviour

At rest it is a dock. The first four items are glyphs in a pill, each a labelled button, and the fifth slot is More. Point at a glyph and its name appears over it after a beat, on a light pill so its type is dark: one label, not one per glyph, so it slides from slot to slot with the pointer and the name changes in place. Keyboard focus shows the same label. A touch shows none, since there is no pointer to name a glyph for. Choosing a glyph reports its `id`; a glyph whose item has a page unfolds the menu straight onto that page.

Press More and the pill unfolds. The glyphs blur out as the pill presses down into a bar 18px tall, and the bar grows up and out into the panel over the next 120ms, its corners following its height, until it stands 228px wide and as tall as the whole list. Then the rows arrive: each out of a blur, 22ms behind the one above it, from the top down, so the list unrolls rather than being there whole. The panel grows UP from the pill's bottom edge. The pill and the panel are the same pane of glass, and nothing the scene laid out moves when the menu opens.

A row with a page turns the menu to it. The rows on show blur out together in 50ms; then the panel eases to the new page's height over 180ms while the new rows arrive a beat apart behind a Back row, the way the first page did. Back turns to the page it came from, and the row that opened the page takes focus again. Settings opens onto five rows, Notebooks onto three, and the panel is a different height for each.

A press anywhere outside, or Escape, folds it. The rows blur out, the panel drops to the bar, and the bar lifts back into the pill as the glyphs return, in 220ms. Choosing a row without a page folds it too, after reporting the `id`. Tab moves focus on and folds it behind you.

While unfolded it is a `role="menu"` of `role="menuitem"` buttons. Opening puts focus on the first row. Up and Down walk the rows and wrap; Home and End go to either end; Right turns to a row's page and Left comes back from one; Enter or Space chooses, as they do on any button. Escape folds the menu and hands focus back to More, and so does choosing a row, so a keyboard never loses its place. More carries `aria-haspopup="menu"` and `aria-expanded`; a row or a glyph with a page carries `aria-haspopup="menu"` too. While the rows are showing, the pill's buttons are `inert`, so Tab cannot reach a glyph that has faded out, and while the panel is folding the rows are.

The root carries `data-slot="liquid-dock-menu"` and `data-state`, one of `dock`, `opening`, `menu` and `closing`.

## Why it stays smooth

The pill and the panel are ONE surface whose box changes: width and height, never a transform. A scaled lens would carry its clone of the scene off the scene behind it; a box that grows keeps every pixel of the clone aligned, so the rim bends whatever is really behind it through the whole morph. The engine builds the rim on a quantized size while the box is moving and the exact size on the frame it settles, so the whole unfold costs a handful of cached maps, and the panel's map is prewarmed when the pointer reaches the pill, so its first paint at full size is not a cold start.

The two faces, glyphs and rows, are content above the filtered layers, so their blur and fade are the compositor's and the filter is never repainted for them. There is no frame loop in the component: the morph is two keyframe animations on the surface, the rows are one animation each with a delay from their index, the label is a transition on one element, and a page turn is one timeout. The component renders when the menu opens or folds, when a page turns, and when the label moves to another glyph.

Reduced motion keeps every state and drops every movement: the glass is simply already the panel, or already the pill, the rows are there or gone, and the label appears where it is pointed at. Reduced transparency gives the pane an opaque fill, as it does every pane in the set.
