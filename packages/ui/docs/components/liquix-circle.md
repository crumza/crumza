# LiquixCircle

A shader-drawn circle: equal sides, the corner radius half of one. The icon-only liquix shape.

```tsx
import { LiquixCircle, LiquixStage } from '@crumza/ui';

<LiquixStage>
  <LiquixCircle size={72} aria-label="Favourite" onClick={star}>★</LiquixCircle>
</LiquixStage>
```

## Props

Extends native button props. `type` defaults to `button`, as elsewhere in Crumza.

| Prop | Default | Meaning |
| --- | --- | --- |
| size | 88 | The side, in CSS pixels. The corner radius is half of it |
| width | none | Stands in for size when only one dimension is known |
| height | none | Stands in for size and width when only the height is known |
| roundness | 2 | Superellipse exponent. 2 is the true circular corner; higher squares it off |

Passing `width` or `height` does not make the shape a rectangle. Whichever arrives first, in the order size, width, height, becomes both sides.

## Rules

Render it inside [LiquixStage](/docs/components/liquix-stage); without one it falls back to a CSS approximation with no refraction, dispersion, glare or stretching.

It is an icon target, so it needs an accessible name: `aria-label`, or visible text a screen reader can read. A glyph like ★ is not a name.
