# LiquixPopover

A bubble of glass that appears over its trigger while the pointer is on it or it has focus. It blooms from the trigger on a spring, arriving as frosted glass that clears, and shrinks back the same way.

```tsx
import { LiquixButton, LiquixPopover } from '@crumza/ui';

<LiquixPopover content="Saved a moment ago">
  <LiquixButton size="sm">Status</LiquixButton>
</LiquixPopover>
```

Render it in a [LiquixSurface](/docs/components/liquix-surface) overlay; the bubble stays inside the surface, where the shader can draw it. Elsewhere it is CSS liquid glass.

## Props

| Prop | Default | Meaning |
| --- | --- | --- |
| children | required | The trigger. Make it focusable so the keyboard reaches the bubble too |
| content | required | What the bubble holds |
| side, align | `top`, `center` | Where the bubble sits relative to the trigger |
| offset | 8 | CSS px between trigger and bubble |
| open, defaultOpen, onOpenChange | closed | Controlled or uncontrolled, for showing it by other means |
| className | none | Classes on the bubble. Give it a width for long content |

## Behaviour

The bubble is a `tooltip` the trigger is described by. It waits a beat before hiding so the pointer can cross the gap to it, and it blooms and shrinks on the shared liquix spring. For a panel that opens on a click and holds controls, use [LiquixMenu](/docs/components/liquix-menu).
