# HoverCard

A card of detail about its trigger, shown on hover or focus: a profile, a link preview, a
definition. The card is interactive: the pointer can travel into it and select or click what is
inside, which is what separates it from [Tooltip](/docs/components/tooltip), a label that is
never reachable.

```tsx
<HoverCard>
  <HoverCardTrigger render={<Button variant="ghost" />}>@crumza</HoverCardTrigger>
  <HoverCardContent align="start" className="grid gap-2">
    <strong>Crumza UI</strong>
    <p>Tailwind-first React components with solid, frosted and liquid materials.</p>
    <a href="/docs/getting-started">Read the docs</a>
  </HoverCardContent>
</HoverCard>
```

## HoverCard props

| Prop | Type | Default |
| --- | --- | --- |
| `open` | `boolean` | uncontrolled |
| `defaultOpen` | `boolean` | `false` |
| `onOpenChange` | `(open: boolean) => void` | |
| `openDelay` | `number` | `120` |
| `closeDelay` | `number` | `200` |

`openDelay` is the hover dwell before the card opens, so a pointer crossing the trigger on its
way somewhere else never opens it. It is short on purpose: long enough to ignore a pointer in
transit, not long enough to make someone wait on a card they meant to read.

Two things skip the dwell entirely. Focus opens the card at once, because a keyboard user has
already committed to it. So does hovering a trigger within 300ms of another card closing: once
someone is plainly reading cards, asking them to wait again for each one is the thing that feels
slow. That window is shared by every hover card on the page, the way Tooltip's is.

`closeDelay` is the grace period after the pointer leaves. It is what lets the pointer cross the
gap between trigger and card without the card vanishing under it; entering the card cancels the
pending close, and leaving either one starts it again.

## HoverCardTrigger props

Extends `ComponentProps<'button'>`. Renders a plain button unless you pass `render`.

| Prop | Type | Notes |
| --- | --- | --- |
| `render` | `ReactElement` | render this element instead of a plain button; its props, handlers and ref are merged |

## HoverCardContent props

Extends `ComponentProps<'div'>`. Renders an opaque card with `role="dialog"`.

| Prop | Type | Default |
| --- | --- | --- |
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` |
| `offset` | `number` | `8` |

## Behaviour

Position is computed in JavaScript (flip to the opposite side, then shift to stay in the
viewport) and written as `left`/`top` with `position: fixed`. The card lives in the top layer,
which ignores transformed and glass ancestors, so it is never clipped by the pane it sits in.
`data-side` and `data-align` reflect the placement that was settled on.

The card is a `popover="manual"`, not `auto`: an auto popover would dismiss whatever menu or
popover the trigger sits inside the moment the pointer crossed the trigger. Escape closes the
card instead, and the pointer or focus leaving both trigger and card closes it after
`closeDelay`.

Tab moves from the trigger into the card and on out of it, in document order, so a link inside
the card can be reached and followed. The trigger carries `aria-expanded` and `aria-controls`.

The card renders as the trigger's sibling, so the element around a HoverCard has to accept a
`<div>`: inside a `<p>` the browser closes the paragraph at the card and splits the sentence.

A touch pointer never opens the card: touch fires an enter that never leaves, so hover is a
mouse idea, and the trigger keeps its own behaviour on tap. That holds where a tap also focuses
the button, as it does on Android; a focus that follows a touch press is treated as the tap. Put nothing in the card that is not
also reachable another way.

## Motion

The card grows into place: it starts at 96% and at a 2px offset and settles at full size, with
`transform-origin` on the corner nearest the trigger, the one positioning worked out and wrote
into `--crumza-transform-origin`, so it opens out of its trigger rather than appearing over it.
Four percent is the same growth the [Menu](/docs/components/menu) and
[Popover](/docs/components/popover) use, so every panel in the library arrives the same way.

The enter is two lengths rather than one. The fade runs over `--duration-fast` and the growth
over `--duration-base`, so the card is readable at 100ms while it is still settling into size
for another 50ms. Landing before the motion has finished is what keeps a quick card from
reading as a pop. The exit shrinks back over a shorter length again, eased in, so it never
feels stuck to a pointer that has moved on.

The whole transition is CSS: `@starting-style` for the enter and
`transition-behavior: allow-discrete` for the exit, so nothing waits on a JavaScript presence
hook. Catching the card mid-fade with the pointer brings it straight back.

Unlike the glass panes, a hover card is an opaque card surface, which is what lets it fade at
all: compositing opacity over a blurred, rounded pane flashes in WebKit, so those animate
transform only.

Under `prefers-reduced-motion: reduce` the card appears and disappears with no transition.
