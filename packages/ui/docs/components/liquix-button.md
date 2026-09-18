# LiquixButton

A button of glass for a [LiquixSurface](/docs/components/liquix-surface) overlay. It sizes to its label and the shader draws the glass to that box.

```tsx
import { LiquixButton } from '@crumza/ui';

<LiquixButton onClick={save}>Save changes</LiquixButton>
<LiquixButton size="sm">Cancel</LiquixButton>
```

Extends native button props; `type` defaults to `button`. Elsewhere than a surface, or without WebGL2, it is CSS liquid glass with the same timings.

## Props

| Prop | Default | Meaning |
| --- | --- | --- |
| size | `md` | `sm` is 36px tall, `md` 44px, `lg` 52px |
| radius | half the height | Corner radius in CSS px; a capsule by default |
| roundness | 2 | Superellipse exponent: 2 is a circular corner, 4 to 6 squares it off |
| layer | 0 | The draw layer. Glass on one layer merges into one field, so a button on another pane of glass takes `1` to stay a shape of its own |

## Behaviour

Pressing squashes the glass a little and lights its rim; hovering and focus lift it. Both are eased by the surface's own loop, the same easing every glass shape on the surface uses, so a button, a capsule and a switch respond alike. The label is white with a drop shadow, so it reads over any picture.

For ordinary application chrome use [Button](/docs/components/button), which needs no surface.
