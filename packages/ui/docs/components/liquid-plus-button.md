# LiquidPlusButton

A round plus that grows into a small menu of actions, and shrinks back into the plus.

```tsx
import { LiquidScene, LiquidPlusButton } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[400px]">
  <LiquidPlusButton onSelect={(id) => create(id)} radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `actions` | `LiquidPlusAction[]` | note, folder, upload, photo | `{ id, label, icon }`; `icon` is any component drawing an SVG from its props |
| `onSelect` | `(id: string) => void` | | an action was chosen; the menu folds after reporting it |
| `open`, `defaultOpen`, `onOpenChange` | | uncontrolled, closed | the usual controlled pair |
| `aria-label` | `string` | `Create` | names the button and the menu |
| `radius` | `number` | `40` | capped at 28 by the round; the rows inside take 6 less |
| `className` | `string` | | merged onto the root |

The round is 56px; the panel is 208px wide and 56px plus 40px a row tall.

## Behaviour

Press the round and it grows up and out into a panel over 260ms, the plus turning a quarter into a cross where it is, at the panel's foot, so the thing you pressed is still under your finger. The rows arrive a beat apart from the bottom, nearest the round first, each out of a blur. Choose one and it reports, and the panel shrinks back into the round in 220ms; so does a press outside, or Escape.

The button carries `aria-haspopup="menu"` and `aria-expanded`; the rows are a `role="menu"` of `menuitem` buttons. Opening puts focus on the first row, Up and Down walk them and wrap, Home and End go to the ends, and Escape or a choice hands focus back to the round. The root carries `data-slot="liquid-plus-button"` and `data-state`, one of `closed`, `opening`, `open` and `closing`.

## Why it stays smooth

The round and the panel are one pane whose box changes, width and height and never a transform, so the clone of the scene inside it stays pixel-aligned through the morph and the engine builds the rim on quantized maps while the box moves. The rows are content above the filtered layers, so their blur and fade are the compositor's. There is no frame loop: the morph is two transitions on the surface, one rotation on the glyph, and one keyframe per row with a delay from its index.

Reduced motion keeps both states and drops every movement: the glass is the round or the panel, the rows are there or gone. Reduced transparency gives the pane an opaque fill.
