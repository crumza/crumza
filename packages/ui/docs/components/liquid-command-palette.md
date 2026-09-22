# LiquidCommandPalette

A button that becomes a command field, with the matching commands beneath it, and folds back into the button.

```tsx
import { LiquidScene, LiquidCommandPalette } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[460px]">
  <LiquidCommandPalette onSelect={(id) => run(id)} radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `commands` | `LiquidCommand[]` | six commands about the scene | `{ id, label, icon, shortcut? }` |
| `onSelect` | `(id: string) => void` | | a command was chosen; the panel folds after reporting it |
| `open`, `defaultOpen`, `onOpenChange` | | uncontrolled, closed | the usual controlled pair |
| `trigger` | `string` | `Search commands` | the label on the button at rest, and the field's name |
| `placeholder` | `string` | `Type a command` | |
| `radius` | `number` | `40` | capped at 22 by the pill; the rows inside take 6 less |
| `className` | `string` | | merged onto the root |

The pill is 236px wide and 44px tall; the panel is 400px wide, or the room the scene gives it, and as tall as the field plus the rows that match.

## Behaviour

Press the pill, or press Command or Control with K anywhere on the page, and the pill widens and grows down into a panel over 300ms: the label blurs out and a field arrives where it was with the caret already in it, and the commands come in beneath as rows a beat apart. Type and the rows that match stay while the rest go, the panel easing to the height of what is left; nothing matching leaves one line saying so. Up and Down move the mark and wrap, Home and End go to the ends, Enter chooses the marked row, a pointer over a row marks it, and Escape or a press outside folds the panel back into the pill.

The field is a `role="combobox"` with `aria-controls` on a `role="listbox"` of `option`s and `aria-activedescendant` on the marked one, so a screen reader hears the choice move without focus leaving the field. The pill carries `aria-expanded` and `aria-haspopup="listbox"`, and is `inert` while the field is showing. Focus comes back to the pill as the panel folds. The root carries `data-slot="liquid-command-palette"` and `data-state`.

## Why it stays smooth

One pane whose box changes, never a transform, anchored at its head and centred by its margins so the field arrives exactly where the label was. Typing changes the panel's height by a row at a time, each a quantized map from the cache after the first. The two faces are content above the filtered layers and cross by opacity and a little blur. Reduced motion keeps both faces and drops the movement.
