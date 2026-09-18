# LiquidContextMenu

A glass menu that opens wherever the scene is right-clicked, with a submenu that flips when there is no room.

```tsx
import { LiquidScene, LiquidContextMenu } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" className="h-[420px]">
  <LiquidContextMenu radius={40} />
</LiquidScene>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `radius` | `number` | `40` | capped at 22 by the row height |

## Behaviour

This one fills the stage: right-click anywhere to open a `role="menu"` of `menuitem` buttons at the pointer, clamped to the scene so no part hangs off the glass. Pointing at "Apply preset" opens a submenu, to the left when the right has no room. Escape, or a pointer press anywhere, closes it, as a native context menu does.
