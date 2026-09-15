# LiquidGallery

A glass-framed gallery with a caption and a thumbnail rail.

```tsx
import { LiquidScene, LiquidGallery } from '@crumza/ui/liquid';

const images = [
  { src: '/scenes/ridge.jpg', label: 'Ridge', meta: 'Depth 60' },
  { src: '/scenes/bloom.png', label: 'Bloom', meta: 'Depth 120' },
];

<LiquidScene background="/scenes/ridge.jpg" className="h-[420px]">
  <LiquidGallery images={images} radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `images` | `{ src, label, meta }[]` | | the slides; the frame is a fixed 344 by 208 box |
| `radius` | `number` | `40` | capped at 28 by the frame height |

## Behaviour

The frame is focusable and named as a carousel; left and right arrows step, the hover arrows step, and the rail is a `role="tablist"` of thumbnails. Slides crossfade in place out of a slight push-in rather than sliding, and faded-out slides are hidden from assistive technology. The frame never resizes, so its displacement map is built once.
