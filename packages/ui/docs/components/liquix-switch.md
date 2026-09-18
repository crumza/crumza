# LiquixSwitch

A switch whose knob is the glass. White and flat at rest, it lifts into a lens while dragged, bending the track and the content beneath, and snaps to a side on release.

```tsx
import { LiquixSwitch } from '@crumza/ui';

<LiquixSwitch checked={wifi} onCheckedChange={setWifi} aria-label="Wi-Fi" />
```

Extends native button props. Render it in a [LiquixSurface](/docs/components/liquix-surface) overlay for the shader's glass; elsewhere it is CSS liquid glass with the same motion.

## Props

| Prop | Default | Meaning |
| --- | --- | --- |
| checked, defaultChecked, onCheckedChange | off | Controlled or uncontrolled state |
| width, height | 52, 32 | The track's size in CSS px; the knob is the height less 4 |
| onClassName, offClassName | `bg-blue-500/85`, `bg-white/25` | Classes for the track's tint in each state |

## Behaviour

The track is a pane of glass with a tint that follows the state, and the tint stops where the knob is, so the knob's glass shows through it. A tap toggles; a drag carries the knob and the nearest side wins on release, with the fling it had. Space and Enter toggle. It is a `<button role="switch">` with `aria-checked`.

The knob lifts, frosts and settles on the shared liquix motion, timed to a reference recording of exactly this gesture.
