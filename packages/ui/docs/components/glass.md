# Glass

A surface with the inherited material, not a control by itself.

```tsx
import { Glass, Theme } from '@crumza/ui';

<Theme material="liquid" intensity={0.5}>
  <Glass radius={16} className="p-5">A little depth for short chrome.</Glass>
</Theme>
```

## Props

Extends native div props. Optional material (solid/frosted/liquid), intensity (0..1), radius (pixels), tone (neutral/primary/secondary/destructive) and interactive. The interactive marker does not make a div into an accessible button; use Button for actions.

No refract, blur, band or strength prop. The migrated experimental Scene/Lens API is separate.

## Rules

Use a single layer for a region. Keep documents and long text opaque. Nested surfaces become fills. Reduced transparency and forced colors have explicit opaque fallbacks. The rim is static CSS, not native Apple refraction. Read [materials](/docs/material) for tradeoffs and browser limitations.
