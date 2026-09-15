# Accordion

Stacked sections a reader opens for detail. For sections of one view use
[Tabs](/docs/components/tabs).

```tsx
<Accordion defaultValue={['several']}>
  <AccordionItem value="several">
    <AccordionTrigger>Can more than one section stay open?</AccordionTrigger>
    <AccordionPanel>Set multiple.</AccordionPanel>
  </AccordionItem>
  <AccordionItem value="brand">
    <AccordionTrigger>Will it match my brand?</AccordionTrigger>
    <AccordionPanel>It inherits the Theme around it.</AccordionPanel>
  </AccordionItem>
</Accordion>
```

## Accordion props

Extends `ComponentProps<'div'>`.

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `readonly string[]` | uncontrolled |
| `defaultValue` | `readonly string[]` | `[]` |
| `onValueChange` | `(value: readonly string[]) => void` | |
| `multiple` | `boolean` | `false` |
| `collapsible` | `boolean` | `true` |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6` | `3` |

The open items are always an array, with or without `multiple`. With `multiple` off only the
first value is honoured, so a stale array can never render two open panels.

`collapsible` applies only when `multiple` is off: leave it on and the open item closes when you
press it again; turn it off when one section must always stay open.

## Parts

- `AccordionItem`: requires `value`. Carries `data-state="open" | "closed"` for styling.
- `AccordionTrigger`: a native button inside a heading of `headingLevel`, carrying
  `aria-expanded` and `aria-controls`. Set `disabled` to freeze a section; arrow keys skip it.
- `AccordionPanel`: a section labelled by its trigger, which is a region already. `className`
  and any other props land on the content, not on the collapsing track around it.

Every trigger is a Tab stop. Arrows move between triggers within one accordion, Home and End
jump to the first and last, and Enter or Space toggles, the button's own behaviour.

## Motion

Panels collapse rather than unmount, so their state survives closing. The open and close run on
`grid-template-rows` between `0fr` and `1fr`: `height: auto` cannot be interpolated, and
measuring a pixel height would mean shipping a resize observer. The panel needs
`@crumza/ui/styles.css`; without it the content simply shows and hides with no transition.

`visibility` flips at the end of the close, which takes the content out of the accessibility
tree, the Tab order and find-in-page once it is out of sight. Under
`prefers-reduced-motion: reduce` the shared `--motion-scale` token zeroes the duration, so the
panel opens and closes instantly instead of sliding.
