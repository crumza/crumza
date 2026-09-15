# Tooltip

A short label on hover or keyboard focus. Never interactive, never the only place a fact lives:
it repeats what `aria-label` already says.

```tsx
<Tooltip content="Bold ⌘B">
  <Toggle aria-label="Bold">B</Toggle>
</Tooltip>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `content` | `ReactNode` | | short text |
| `children` | `ReactElement` | | one element that accepts a ref and pointer/focus handlers |
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | flips when there is no room; the arrow follows |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | |
| `delay` | `number` | `500` | hover delay in ms; focus shows at once; moving between tooltips within 300ms skips it |
| `className` | `string` | | |

## Behaviour

Shows after `delay` on hover, immediately on keyboard focus, never on touch. Hides on leave,
blur, pointer down and Escape. Rendered as a `popover="manual"` element in the top layer with
`role="tooltip"`, linked to the trigger through `aria-describedby` while open.

## The arrow

A small arrow points back at the control the label belongs to, which is what makes a tooltip
readable in a toolbar where three buttons sit a few pixels apart. It tracks the trigger rather
than the middle of the label: alignment and the viewport clamp can slide the panel along its
edge, and near the edge of the screen the arrow keeps pointing at its own button until it runs
into the rounded corner. A tooltip that flipped for want of room moves the arrow to the side it
ended up on.

It is drawn as a pseudo-element, so it adds nothing to the accessibility tree, and it is left
out under forced colours, where the panel has no background to merge with. To take it off a
particular tooltip, hide `[data-slot="tooltip"]::after` through `className`.
