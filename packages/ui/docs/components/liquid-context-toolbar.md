# LiquidContextToolbar

A formatting toolbar that comes out of the icon that summons it, and goes back into it.

```tsx
import { LiquidScene, LiquidContextToolbar, type LiquidTextFormat } from '@crumza/ui/liquid';

const [format, setFormat] = useState<LiquidTextFormat>({
  bold: false, italic: false, underline: false, align: 'left',
});

<LiquidScene background="/scenes/ridge.jpg" className="h-[340px]">
  <LiquidContextToolbar value={format} onValueChange={setFormat} radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `LiquidTextFormat` | | `{ bold, italic, underline, align }`; leave it out for uncontrolled |
| `defaultValue` | `LiquidTextFormat` | nothing on, left | the uncontrolled start |
| `onValueChange` | `(value: LiquidTextFormat) => void` | | fires on every tool |
| `open`, `defaultOpen`, `onOpenChange` | | uncontrolled, closed | the usual controlled pair |
| `aria-label` | `string` | `Text format` | names the round and the bar |
| `radius` | `number` | `40` | capped at 22 by the round; the tools inside take 4 less |
| `className` | `string` | | merged onto the root |

The round is 44px; the bar is 292px wide, the same 44px tall, and rests 12px above the round.

## Behaviour

Press the round and a pane the same size lifts off it and, as it rises, widens into a toolbar above it over 320ms. The tools arrive from the middle out, out of a blur: bold, italic and underline as toggles, a hairline, then three alignments of which one is always on. The round stays where it was, its glyph dimmed, so the bar has somewhere it came from and somewhere to go back to. Press the round again, press outside, or Escape, and the tools blur out while the bar narrows and settles back down onto the round.

The bar is a `role="toolbar"` and one Tab stop: focus lands on the first tool, Left and Right walk them and wrap. The toggles carry `aria-pressed`, the alignments are `role="radio"` buttons in a `radiogroup` with `aria-checked`, and a tool that is on turns white under a dark glyph. The round carries `aria-expanded`. The root carries `data-slot="liquid-context-toolbar"`, `data-state` and, once the bar has left the round, `data-lifted`.

## Why it stays smooth

The bar is a second pane whose box and position change by layout, its width and its offsets, never a transform, so its clone stays aligned while it travels and the rim is built on quantized maps on the way. The round never changes at all, so its map is built once. Reduced motion places the bar or removes it.
