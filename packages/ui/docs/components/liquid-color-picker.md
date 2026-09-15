# LiquidColorPicker

A glass colour picker: a saturation and brightness pad, a hue rail, a hex and RGB readout and seven swatches.

```tsx
import { LiquidScene, LiquidColorPicker } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[480px]">
  <LiquidColorPicker radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `radius` | `number` | `40` | capped at 28 by the frame height |

## Behaviour

The pad and the rail are `role="slider"` elements with values: press anywhere to set, drag to refine, and keep receiving moves after the pointer leaves. Arrow keys walk the hue rail; left and right walk saturation on the pad and up and down walk brightness. A press on either picks a colour and does not carry the panel. Nothing resizes, so the surface holds one map throughout.
