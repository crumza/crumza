# LiquidSheet

A sheet of glass that rises from the foot of the scene, with a title, a line of text and a row of actions, and a handle to pull it back down by.

```tsx
import { LiquidScene, LiquidSheet } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[420px]">
  <LiquidSheet
    trigger="Share"
    title="Share this scene"
    description="Anyone with the link can open it in the studio."
    actions={[
      { id: 'copy', label: 'Copy link', primary: true },
      { id: 'later', label: 'Not now' },
    ]}
    onAction={(id) => id === 'copy' && copy()}
    radius={40}
  />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `open` | `boolean` | | controlled; leave it out for uncontrolled |
| `defaultOpen` | `boolean` | `false` | the uncontrolled start |
| `onOpenChange` | `(open: boolean) => void` | | fires as the sheet rises and as it lowers |
| `trigger` | `string` | `Export scene` | the label of the pill in the scene that raises it |
| `title` | `string` | `Export this scene` | names the dialog |
| `description` | `string` | a line about the export | describes it |
| `actions` | `LiquidSheetAction[]` | Export PNG, Copy link | `{ id, label, primary? }`; the primary one is filled, the rest are glass |
| `onAction` | `(id: string) => void` | | an action was chosen; the sheet lowers after reporting it |
| `radius` | `number` | `40` | capped at 28 by the sheet's head; the actions inside take 16 less, the trigger caps at 26 |
| `className` | `string` | | merged onto the root |

This one fills the stage: the trigger sits at its centre and the sheet rises at its foot, 360px wide or the room the scene gives it, 16px off the bottom edge.

## Behaviour

Press the trigger and the scene dims a little while the sheet slides up from below the edge of the stage over 340ms, a handle at its head, the title, the text, the actions and a cross. Choose an action, press the cross, press the dimmed scene, or press Escape, and it lowers the way it came in 260ms. Take the handle and pull down and the sheet follows the finger one to one; let go past 80px, or with a flick, and it lowers from where it was; let go short of that and it eases back up.

The trigger is a native button with `aria-haspopup="dialog"` and `aria-expanded`. The sheet is a `role="dialog"` named by its title and described by its text. Focus lands on the first action as it rises, Tab and Shift+Tab stay inside it, and focus comes back to the trigger as it lowers. The drag is pointer-only: the keyboard has Escape and the cross. While the sheet is lowering its contents are `inert`. The root carries `data-slot="liquid-sheet"` and `data-state`, `open` or `closed`.

The sheet does not make the page around the scene inert; it is a sheet inside a scene, not a modal over a document. Use the web set's Dialog or Drawer for that.

## Why it stays smooth

The rise, the lowering and the drag are all a translate on a plain wrapper around the pane, so the pane's box never changes and it keeps the one displacement map it was born with; the engine only repositions its clone of the scene on the frames the wrapper moves, and the drag writes one custom property per pointer event straight to the wrapper rather than through React. The scrim is not in any pane's clone, so the glass shows the scene at full light while the room around it is dimmed.

Reduced motion keeps the drag, because the drag is the control, and drops every movement: the sheet is up or down. Reduced transparency gives the pane an opaque fill.
