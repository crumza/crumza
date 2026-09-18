# LiquidPricingCard

A glass plan card with a monthly/yearly switch, a feature list and a call to action.

```tsx
import { LiquidScene, LiquidPricingCard } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[480px]">
  <LiquidPricingCard radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `radius` | `number` | `40` | capped at 28 by the button height, so the card and its controls share one curvature |

## Behaviour

The price block keeps a fixed height, so swapping the amount never resizes the surface; only the figure crossfades. The switch is a native button with `role="switch"` and `aria-checked`; its knob slides under the chosen label, and the label above the knob turns dark. Drag the card anywhere over the scene.
