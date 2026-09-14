# Card

An opaque content surface, one step up from the canvas, separated by a hairline. This is where
forms and text live. It is not glass and has no shadow.

```tsx
import { Card } from '@crumza/ui/web';

<Card className="grid gap-4 p-6">...</Card>
```

## Props

Extends `ComponentProps<'div'>`. Radius is `--radius-surface` with squircle corners where the
engine supports it.
