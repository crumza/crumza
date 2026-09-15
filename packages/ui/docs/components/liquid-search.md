# LiquidSearch

A round glass search button that grows into a search field, with a glass results panel that grows and shrinks with the matches.

```tsx
import { LiquidScene, LiquidSearch } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[420px]">
  <LiquidSearch radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `radius` | `number` | `40` | capped at 26 by the field height, a full circle when folded; the panel matches it |

## Behaviour

Folded, the component is a 52px round button labelled "Search" with `aria-expanded`. Pressing it grows the glass into the 296px bar over 380ms and focuses the native text input inside; the input is disabled while folded so nothing can tab into it. Typing opens a `role="listbox"` of `role="option"` buttons under the bar with the matched run in bold; no matches shows a short notice; the clear button empties the field and keeps it focused. Escape, pressing the icon with nothing typed, or focus leaving the component while it is empty folds it back to the button and returns focus to it. A press on the bare glass drags the component without stealing focus from the field.
