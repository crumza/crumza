# LiquidSearch

A glass search field with a glass results panel that grows and shrinks with the matches.

```tsx
import { LiquidScene, LiquidSearch } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[420px]">
  <LiquidSearch radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `radius` | `number` | `40` | capped at 26 by the field height; the panel matches it |

## Behaviour

The field is a native text input labelled "Search". Typing opens a `role="listbox"` of `role="option"` buttons under it with the matched run in bold; no matches shows a short notice; clearing closes the panel with an exit transition. A focused field owns the pointer for text selection; an unfocused one drags with the surface.
