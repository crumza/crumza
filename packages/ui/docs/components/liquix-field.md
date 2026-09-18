# LiquixField

A text field in a trough of glass, for a [LiquixSurface](/docs/components/liquix-surface) overlay. The input is live inside it, caret and selection included.

```tsx
import { LiquixField } from '@crumza/ui';

<LiquixField placeholder="Search" leading={<SearchIcon />} className="w-72" aria-label="Search" />
```

Extends native input props. Elsewhere than a surface, or without WebGL2, the trough is CSS liquid glass with a focus ring.

## Props

| Prop | Default | Meaning |
| --- | --- | --- |
| size | `md` | `sm` is 36px tall, `md` 44px, `lg` 52px |
| leading, trailing | none | An icon or prefix before the text; a button or suffix after it |
| className | none | Classes on the trough. Give it a width; the input fills it |
| inputClassName | none | Classes on the input itself |

## Behaviour

The trough is drawn by the shader to the measured box. Focusing the input lights the rim, hovering lights it a little, both eased by the surface. Text and placeholder are white, the placeholder dimmed, with a drop shadow so they read over any picture. Label it with `aria-label` or a [Field](/docs/components/field) around it.
