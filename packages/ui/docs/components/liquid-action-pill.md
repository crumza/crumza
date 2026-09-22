# LiquidActionPill

A round with one glyph that widens into a row of actions, and narrows back.

```tsx
import { LiquidScene, LiquidActionPill } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[320px]">
  <LiquidActionPill onSelect={(id) => act(id)} aria-label="Actions" radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `actions` | `LiquidPillAction[]` | share, link, save, comment | `{ id, label, icon }`; the label names the button |
| `onSelect` | `(id: string) => void` | | an action was chosen; the pill narrows after reporting it |
| `open`, `defaultOpen`, `onOpenChange` | | uncontrolled, closed | the usual controlled pair |
| `aria-label` | `string` | `Actions` | names the toggle and the row |
| `radius` | `number` | `40` | capped at 24 by the round; the actions inside take 4 less |
| `className` | `string` | | merged onto the root |

The round is 48px; open, the pill is 48px plus 42px an action wide.

## Behaviour

Press the round and it widens to the right over 300ms, the glyph turning into a cross where it is, at the leading end. The actions arrive from the leading edge one behind another, each a beat behind the last and out of a blur, so the pill seems to pour rather than appear. Choose one, press the cross, press outside, or Escape, and it narrows back in 240ms.

The toggle carries `aria-expanded`; the row is a `role="toolbar"` of labelled buttons and one Tab stop: focus lands on the first action, Left and Right walk them and wrap, and Escape or a choice hands focus back to the toggle. The root carries `data-slot="liquid-action-pill"` and `data-state`.

## Why it stays smooth

One pane whose width changes, never a transform. The two glyphs share one cell and cross by rotation and opacity; the actions are one keyframe each with a delay from their index. Nothing here is measured and nothing runs a frame loop. Reduced motion keeps both widths and drops the movement.
