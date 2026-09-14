# Popover

A non-modal panel anchored to its trigger: a small form, a picker, a detail. Built on the
engine's popover API, so light dismiss (click outside), Escape, the top layer and focus return
come from the browser, not from JavaScript.

```tsx
<Popover>
  <PopoverTrigger render={<Button />}>Page setup</PopoverTrigger>
  <PopoverContent align="start" className="grid gap-3">
    <Field label="Top margin" htmlFor="m-top">
      <Input id="m-top" size="sm" />
    </Field>
  </PopoverContent>
</Popover>
```

## Popover props

| Prop | Type | Default |
| --- | --- | --- |
| `open` | `boolean` | uncontrolled |
| `defaultOpen` | `boolean` | `false` |
| `onOpenChange` | `(open: boolean) => void` | |

## PopoverTrigger props

Extends `ComponentProps<'button'>`.

| Prop | Type | Notes |
| --- | --- | --- |
| `render` | `ReactElement` | render this element instead of a plain button; its props, handlers and ref are merged |

## PopoverContent props

Extends `ComponentProps<'div'>`. Renders a glass slab with `role="dialog"`.

| Prop | Type | Default |
| --- | --- | --- |
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` |
| `offset` | `number` | `6` |

## Behaviour

The trigger carries `popovertarget`, so the engine toggles it and treats the trigger as inside
for light dismiss. Position is computed in JavaScript (flip, then shift to stay in the
viewport) and written as `left`/`top` with `position: fixed`; the top layer ignores
transformed or glass ancestors, so there is no containing-block trap. `data-side` and
`data-align` reflect the final placement; `--crumza-transform-origin` makes the scale-in feel
attached. Tab from the trigger moves into the popover (engine focus order), Escape closes and
returns focus.

Nested popovers work: the engine keeps a stack and closes them from the top.

Display utilities on the content (`grid`, `flex`) are fine: the closed state forces
`display: none` so a closed popover is never laid out or hit-testable.
