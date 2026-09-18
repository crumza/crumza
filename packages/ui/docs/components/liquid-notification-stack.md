---
title: LiquidNotificationStack
---
# LiquidNotificationStack

A deck of glass notifications that collapses into a stack and fans out on hover.

```tsx
import { LiquidScene, LiquidNotificationStack } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[480px]">
  <LiquidNotificationStack radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `radius` | `number` | `40` | cards cap at 30, the push button at 26 |

## Behaviour

This one fills the stage rather than sitting centred in it. Push adds a card on top, up to five; a closed deck shows three and a count. Hovering fans the deck into a column, where each card is a `role="status"` with a labelled dismiss button, and a swipe past 76px throws it out. Both deck states are transforms on wrappers, so every card shares one cached displacement map.
