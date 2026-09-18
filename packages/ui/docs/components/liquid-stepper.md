# LiquidStepper

A glass minus/plus counter.

```tsx
import { LiquidScene, LiquidStepper } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[320px]">
  <LiquidStepper radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `radius` | `number` | `40` | capped at 22 by the control height |

## Behaviour

Two native buttons labelled Decrease and Increase around a tabular figure announced through `aria-live="polite"`. The buttons disable at 0 and 12. Nothing here moves the lens box, so the engine is never asked to repaint.
