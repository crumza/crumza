# LiquidTestimonials

A testimonial section: a glass kicker pill, previous and next glass arrows, three quote cards and dot indicators.

```tsx
import { LiquidScene, LiquidTestimonials } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[480px]">
  <LiquidTestimonials radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `radius` | `number` | `40` | cards cap at 28, the pill and arrows at 20 |

## Behaviour

One card is the subject: it lifts and the other two recede. Pointing at a card features it; the arrows and the dots step through them. The dots are a `role="tablist"` named by each author. Below 760px only the featured card shows. The lift is a transform on the glass itself, so every step repaints the rim.
