# LiquixCapsule

A shader-drawn capsule: the corner radius is always half the height. The default liquix shape, for text buttons, calls to action and pills.

```tsx
import { LiquixCapsule, LiquixStage } from '@crumza/ui';

<LiquixStage>
  <LiquixCapsule onClick={buy}>Liquid Glass</LiquixCapsule>
</LiquixStage>
```

The element is a real `<button>`: it carries the label, the focus ring, keyboard activation and the click target, and it is transparent. Its box is what the shader uses for the shape's position, so the glass follows the layout wherever the button ends up.

## Props

Extends native button props. `type` defaults to `button`, as elsewhere in Crumza.

| Prop | Default | Meaning |
| --- | --- | --- |
| width | 216 | Width in CSS pixels |
| height | 92 | Height in CSS pixels; the corner radius is half of it |
| roundness | 2 | Superellipse exponent. 2 is the true circular corner a capsule wants; 4 to 6 squares it off |

## Rules

Render it inside [LiquixStage](/docs/components/liquix-stage). Without one there is no shader to draw it and it falls back to a CSS approximation: blur and a rim highlight, no refraction, dispersion, glare or stretching. The same fallback covers a device with no WebGL2 and a lost context.

Give an icon-only capsule an `aria-label`. The label sits in a span the stage moves with the shape, so do not position the button's children yourself.

For ordinary application chrome use [Button](/docs/components/button), which needs no stage and no per-frame loop.
