# LiquidActionDock

A round button whose actions emerge from behind it into an arc, and go back in.

```tsx
import { LiquidScene, LiquidActionDock } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[400px]">
  <LiquidActionDock onSelect={(id) => create(id)} radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `actions` | `LiquidDockAction[]` | write, upload, photo | `{ id, label, icon }`; up to five, fanned over the button |
| `onSelect` | `(id: string) => void` | | an action was chosen; the satellites go back in after reporting it |
| `open`, `defaultOpen`, `onOpenChange` | | uncontrolled, closed | the usual controlled pair |
| `aria-label` | `string` | `Create` | names the button and the menu |
| `radius` | `number` | `40` | capped at 28 by the button and 22 by a satellite |
| `className` | `string` | | merged onto the root |

The button is 56px, a satellite 44px, and a satellite's centre sits 88px from the button's. Two sit at ten and two o'clock; five fill the half circle.

## Behaviour

Press the round and small rounds come out from under it one after another, 40ms apart, and settle in an arc over it. Each travels on the set's spring, which carries a hair past its mark and comes back, and never bounces; the plus turns a quarter into a cross. Choose one, press outside, or press Escape, and they all go back in the way they came, the farthest first.

The button carries `aria-haspopup="menu"` and `aria-expanded`; the satellites are a `role="menu"` of labelled `menuitem` buttons. Focus lands on the first, the arrows walk them and wrap, and Escape or a choice hands focus back to the button. The root carries `data-slot="liquid-action-dock"` and `data-state`.

## Why it stays smooth

Every satellite is its own pane of the scene's glass, so each bends what is behind it where it lands. The travel is a translate on a wrapper around each, so no pane changes size: the whole set costs two cached maps, one per size, and the engine only repositions their clones on the frames they travel. Reduced motion puts the satellites in their places, or takes them away.
