# LiquidTabIndicator

Tabs whose indicator stretches as it travels and settles as it lands.

```tsx
import { LiquidScene, LiquidTabIndicator } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[360px]">
  <LiquidTabIndicator radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `radius` | `number` | `40` | capped at 26 by the bar height; the indicator is inset by 6px |

## Behaviour

A `role="tablist"` of `role="tab"` buttons with `aria-selected`. The squash and stretch come from the indicator's own velocity each frame, not a keyframe, so they are proportional to the distance covered. It runs on the scene's frame driver and the surface never resizes, so the engine does no work here.
