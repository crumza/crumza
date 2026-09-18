# LiquidGlassToggle

A switch whose thumb is a lens.

```tsx
import { LiquidScene, LiquidGlassToggle } from '@crumza/ui/liquid';

const [wifi, setWifi] = useState(false);

<LiquidScene background="/scenes/ridge.jpg" className="h-[360px]">
  <LiquidGlassToggle checked={wifi} onCheckedChange={setWifi} aria-label="Wi-Fi" />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `checked` | `boolean` | | controlled state; leave it out for uncontrolled |
| `defaultChecked` | `boolean` | `false` | the uncontrolled start |
| `onCheckedChange` | `(checked: boolean) => void` | | fires on a tap, a keyboard flip and the release of a drag |
| `disabled` | `boolean` | `false` | a native disabled button: no focus, no press, no drag |
| `size` | `'default' \| 'sm'` | `'default'` | 64 by 32 with a 26px thumb, or 50 by 26 with a 20px thumb |
| `radius` | `number` | `40` | capped at 22 by the control height; the thumb's corners follow |
| `aria-label`, `aria-labelledby`, `id` | `string` | | a switch needs a name from one of these, or a label pointing at `id` |
| `className` | `string` | | merged onto the root button |

The on-colour is `--lqc-toggle-on`, a translucent system green by default. Set it on the toggle or on anything above it to recolour the track.

## Behaviour

At rest it is Apple's toggle: a white thumb on a translucent track, a shadow for depth, and no glass to see. The glass is there the whole time, under a white cap. The thumb is a `LiquidSurface`, so it refracts through the same engine, displacement-map cache and clone of the scene as every other pane in the set; the track is a second one. Nothing here is a `backdrop-filter`, and nothing here is a lens of its own.

Press, and the thumb gives: it widens along the track by 4px, away from the side it sits on, and the cap thins enough for the rim of the lens to show. Hold for 180ms, or slide 6px, and it lifts: the cap clears over 180ms, the thumb grows 3px in both directions off the track, its shadow drops away beneath it, and what is under the finger is a small curved lens, magnifying the scene by 15% and bending it at the rim, carried one to one with no easing between it and the finger. Past either end it gets heavy rather than free, following three tenths of the pull and no more than a seventh of the travel. While it moves it stretches a little along its travel in proportion to its speed, and thins back as it slows.

Let go, and the finger's speed goes into a spring that lands the thumb on the nearer side: past half way is on, short of it is off. The spring is stiff and well damped, about a third of a second to land, a hair of overshoot and no bounce. The cap fades back over the lens as it settles, so the glass is strongest while the thumb is moving and gone once it has stopped. A press that never slid is a tap, however long it was held, and a tap flips the switch. A drag that came back to where it started leaves it as it was.

The keyboard flips it with Space or Enter, and Left, Right, Home and End set it outright; each travels on the same spring. A controlled parent that declines the change sees the thumb spring back to the value it kept.

The root is a `<button role="switch" aria-checked>`, so it is a real switch to assistive technology, and it carries `data-slot="liquid-glass-toggle"`, `data-size` and, while a finger has the thumb, `data-lift`. Focus draws a two pixel ring round the track. The button sets `touch-action: none`, so the browser never reads the drag as a pan and takes the pointer back, and the pointer is captured, so a finger that wanders off the control keeps carrying the thumb.

## Why it stays smooth

There is no frame loop in this component. A drag writes one custom property per pointer event, `--x` along the travel, straight to the root rather than through React; the thumb and the track's on-colour both read their state from it, and a move is a style write and a composited translate. The spring runs on the scene's own frame driver, the one the refraction engine already runs, and writes the same property until it settles; a settled thumb has no `--x` at all and reads its side from the value.

Every change to the thumb's box is a layout change, never a transform scale. A scaled lens would carry its clone of the scene off the scene behind it; a lens that grows by three pixels keeps the clone pixel-aligned, and the engine builds the map for the new size from a quantized cache, so the whole gesture costs a handful of maps that are then kept. While the thumb moves, the engine only repositions the map it has. Once it settles the lens is idle and costs nothing, and the cap over it is a plain white span.

Reduced motion keeps the lift and the drag, because they are the control, and drops every movement: the thumb neither grows nor stretches, the cap swaps rather than fades, and a release puts the thumb on its side rather than springing it there. Reduced transparency keeps the thumb white throughout.
