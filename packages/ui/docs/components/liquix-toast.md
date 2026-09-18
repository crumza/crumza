# LiquixToast

Notifications as panes of glass that rise from an edge of the surface on a spring, stack, dismiss themselves in time, and can be swiped away.

```tsx
import { LiquixButton, LiquixToaster, liquixToast } from '@crumza/ui';

<LiquixSurface overlay={<><LiquixToaster /><Controls /></>} ...>

<LiquixButton onClick={() => liquixToast('Saved', { description: 'Just now.' })}>Save</LiquixButton>
```

`liquixToast()` works from anywhere; the `LiquixToaster` in the surface's overlay shows what it queues. Elsewhere than a surface the toasts are CSS liquid glass with the same motion.

## liquixToast(title, options)

Returns the toast's id, for `liquixToast.dismiss(id)`.

| Option | Default | Meaning |
| --- | --- | --- |
| description | none | A second line, dimmed |
| duration | 5000 | ms before it dismisses itself; 0 keeps it until swiped or dismissed |

## LiquixToaster props

| Prop | Default | Meaning |
| --- | --- | --- |
| position | `bottom` | The edge the toasts rise from |
| align | `center` | `start`, `center` or `end` along that edge |
| className | none | |

## Behaviour

A toast blooms in as frosted glass that clears and shrinks back out. Drag it sideways and it follows, lifted; past about 72px, or with a fling, it is dismissed and slides away, otherwise it springs back. At most three show at once; older ones make way. The toaster is a polite live region.
