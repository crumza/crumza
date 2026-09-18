# LiquidGlassSlider

A thin rail with an oversized lens for a thumb.

```tsx
import { LiquidScene, LiquidGlassSlider } from '@crumza/ui/liquid';

const [brightness, setBrightness] = useState(40);

<LiquidScene background="/scenes/ridge.jpg" className="h-[320px]">
  <LiquidGlassSlider value={brightness} onValueChange={setBrightness} aria-label="Brightness" />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `number` | | controlled value; leave it out for uncontrolled |
| `defaultValue` | `number` | `min` | the uncontrolled start |
| `onValueChange` | `(value: number) => void` | | fires on every step the value moves: along a drag, and on a key |
| `min`, `max`, `step` | `number` | `0`, `100`, `1` | values snap to the step and clamp to the range |
| `disabled` | `boolean` | `false` | out of the tab order, and nothing answers a press |
| `radius` | `number` | `40` | capped at 22 by the control height; the lens is a full capsule from 18 up |
| `aria-label`, `aria-labelledby`, `id` | `string` | | a slider needs a name from one of these, or a label pointing at `id` |
| `aria-valuetext` | `string` | | what the value means, when the number alone does not say |
| `className` | `string` | | merged onto the root |

The control is 280px wide, or the room the scene gives it, and 52px tall for the touch target. The rail is 6px; the lens is a 64 by 40 capsule, and 68 by 44 while it is lifted.

## Behaviour

The lens is glass at rest as much as in the hand: a capsule near seven times the rail's height that bends the scene hard at its rim and shows it nearly straight, magnified by 14%, through its middle, with the material's own light along its upper edge and shade along the lower. Over the glass there is only a breath of milk out at the rim and one soft light; the centre of the lens is the scene. It is not a filter of its own: the lens is a `LiquidSurface`, so it refracts through the same engine, displacement-map cache and clone of the scene as every other pane in the set. On clear glass it takes a quarter of the material's interior blur and a third of its tint, through `--lq-blur` and `--lq-tint`, so an edge passing under it bends rather than softens and the scene keeps its colour through the middle; on frosted glass it keeps the frost and the milk. Nothing here is a `backdrop-filter` and nothing here is a white fill.

The lens also carries a copy of the rail inside its refraction layer, through the surface's `refracted` slot, so the rail bends through the glass the way the scene behind it does. The copy is laid out in the lens' own coordinates from the same position the real rail and the real lens read, so it lies exactly over the rail whatever the lens is doing.

Pick the lens up and it bends harder. The engine reads `--lq-bend` on every paint and multiplies it into the material's depth; the stylesheet takes it from 0.5 at rest to 0.8 while the lens is lifted and transitions it over 260ms, so the refraction deepens eased rather than switching, and the displacement map is untouched by it. The lens grows 4px in both directions, its shadow drops away beneath it, the rim's milk thins and the light along its top comes up: what is under the finger is the scene and the rail bent through a curved piece of glass, carried one to one with the finger along the rail. The light sits a little further along the capsule the further along the rail it is, the way a fixed light moves across a lens carried under it. A press on the rail sets the value there at once, and the lens closes on the finger over a few frames rather than jumping to it, then follows. Past either end the value holds at the end.

The lens takes a rim of its own size, and only part of the material's bend, for a reason beyond the look. The material's rim was drawn for panes: it reaches 26px in from the edge and saturates within a few, so on a 40px lens it meets itself in the middle, and every part of the lens ends up showing a stretched sliver of its centre, which reads as frost rather than glass. Through `--lq-rim` the lens takes a quarter of that reach, an 8px ring, so the ring bends the scene hard, 12px at the very edge at rest and 19px in the hand, the way the edge of a lens does, and inside the ring the scene is straight, whole and magnified by 14%. Type passing under the middle stays legible.

Let go and the bend settles back to its resting share while the lens eases onto the step it was left on, 180ms on the set's one damped curve. There is no spring and no bounce anywhere in it. A controlled parent that declines a change sees the lens ease back to the value it kept.

The keyboard moves it by a step with the arrows, by a tenth of the range with PageUp and PageDown, and to either end with Home and End. The lens is the slider: a `role="slider"` with `aria-valuemin`, `aria-valuemax` and `aria-valuenow`, focusable, with a soft two pixel ring while it has keyboard focus. The root carries `data-slot="liquid-glass-slider"` and, while a finger has the lens, `data-lift`. It sets `touch-action: none`, so the browser never reads the drag as a pan, and the pointer is captured, so a finger that wanders off the rail keeps carrying the lens.

## Why it stays smooth

There is no frame loop in this component beyond the catch-up after a rail press, which runs on the scene's own driver. A drag writes one custom property per pointer event, `--x` along the travel, straight to the root rather than through React; the rail's fill, the lens and the copy of the rail inside it all read it, so a move is one style write. The value is reported once per step it crosses, the way a native range input reports, and at rest the property is gone and everything reads its position from the value.

Every change to the lens' box is a layout change, never a transform scale. A scaled lens would carry its clone of the scene off the scene behind it; a lens that grows by four pixels keeps the clone pixel-aligned, and it only ever has two sizes, so the whole gesture costs two cached maps. While it moves the engine repositions the map it has. Once it settles the lens is idle and costs nothing.

Reduced motion keeps the lift and the drag, because they are the control, and drops every movement: the lens neither grows nor eases nor bends harder, and a rail press puts the lens under the finger at once. Reduced transparency gives the lens an opaque white fill, as it does every pane.
