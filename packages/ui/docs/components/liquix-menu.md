# LiquixMenu

A dropdown of glass. The panel blooms from its trigger on a spring, and a capsule of glass travels between items as the pointer or the arrow keys move, their labels changing colour under it.

```tsx
import { LiquixMenu } from '@crumza/ui';

<LiquixMenu
  label="Options"
  items={[
    { id: 'new', label: 'New file' },
    { id: 'rename', label: 'Rename' },
    { id: 'delete', label: 'Delete', disabled: true },
  ]}
  onSelect={run}
/>
```

Render it in a [LiquixSurface](/docs/components/liquix-surface) overlay; the panel opens inside the surface, where the shader can draw it. Elsewhere it is CSS liquid glass.

## Props

| Prop | Default | Meaning |
| --- | --- | --- |
| items | required | `[{ id, label, disabled }]` |
| onSelect | required | Called with the chosen id; the menu closes |
| label | required | The trigger's label. The trigger is a [LiquixButton](/docs/components/liquix-button) |
| size | `md` | The trigger's size |
| align | `start` | Which edge of the trigger the panel lines up with |
| open, defaultOpen, onOpenChange | closed | Controlled or uncontrolled |
| className | `w-56` | Classes on the panel; sets its width |
| activeClassName, inactiveClassName | `text-blue-600`, `liquix-ink` | Colours of an item's label under the highlight and elsewhere |

## Behaviour

Click or Arrow Down opens; the first item takes focus. Arrows move the highlight, which travels on the shared spring and settles flat; Enter or Space chooses; Escape, a click outside or choosing closes, and focus returns to the trigger. Items are `<button role="menuitem">` in a `menu`.
