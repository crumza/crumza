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
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | flips when there is no room |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | |
| `delay` | `number` | `500` | hover delay in ms; focus shows at once; moving between tooltips within 300ms skips it |
| `className` | `string` | | |

## Behaviour

Shows after `delay` on hover, immediately on keyboard focus, never on touch. Hides on leave,
blur, pointer down and Escape. Rendered as a `popover="manual"` element in the top layer with
`role="tooltip"`, linked to the trigger through `aria-describedby` while open.
