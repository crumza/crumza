# LiquidMenuButton

A round with three bars that grows into a menu, the bars folding into a cross, and closes back into it.

```tsx
import { LiquidScene, LiquidMenuButton } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[400px]">
  <LiquidMenuButton
    items={['Home', 'Work', 'Writing', 'About']}
    current="Work"
    onSelect={(item) => navigate(item)}
    radius={40}
  />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `items` | `string[]` | five section names | the rows |
| `current` | `string` | `Material` | the row that is the current page, marked with `aria-current` |
| `onSelect` | `(item: string) => void` | | a row was chosen; the menu closes after reporting it |
| `open`, `defaultOpen`, `onOpenChange` | | uncontrolled, closed | the usual controlled pair |
| `aria-label` | `string` | `Menu` | names the button and the menu |
| `radius` | `number` | `40` | capped at 26 by the round; the rows inside take 6 less |
| `className` | `string` | | merged onto the root |

The round is 52px; the panel is 224px wide and 52px plus 40px a row tall.

## Behaviour

Press the round and the two outer bars fold onto the middle one and turn into a cross while the round grows right and down into a panel over 280ms, the button staying at the panel's top-left corner where it was. The rows arrive from the top a beat apart, out of a blur; the current one carries a small mark. A row, a press outside, or Escape closes it: the rows blur out, the panel shrinks back into the round, and the cross opens into the bars again.

`aria-haspopup="menu"` and `aria-expanded` on the button; a `role="menu"` of `menuitem` buttons, the current one `aria-current="page"`. Focus goes to the first row on open, the arrows walk and wrap, and focus comes back to the button on close. The root carries `data-slot="liquid-menu-button"` and `data-state`.

## Why it stays smooth

One pane whose box changes, never a transform, so its clone of the scene stays aligned; the bars are three spans moved by translate and rotate above the glass, so the compositor carries them and the filter is never repainted for them. Reduced motion keeps both states and drops every movement, the bars included: they are bars or a cross.
