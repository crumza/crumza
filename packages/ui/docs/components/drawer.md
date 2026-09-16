# Drawer

A modal panel that slides in from the left or the right edge. For a centred modal use
[Dialog](/docs/components/dialog); for a small transient surface next to its trigger use
[Popover](/docs/components/popover).

```tsx
import { Button, Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from '@crumza/ui';

<Drawer>
  <DrawerTrigger render={<Button />}>Filters</DrawerTrigger>
  <DrawerContent side="right">
    <DrawerTitle>Filters</DrawerTitle>
    <DrawerDescription>Narrow the results without leaving the page.</DrawerDescription>
    <DrawerClose render={<Button variant="bordered" />}>Done</DrawerClose>
  </DrawerContent>
</Drawer>
```

## Which side

`side` takes `'left'` or `'right'` and defaults to `'right'`. Left suits navigation and the
structure of a page; right suits filters, details and inspectors, next to the content they act
on. The side is a plain prop, so it can follow state:

```tsx
const [side, setSide] = useState<DrawerSide>('right');

<DrawerContent side={side}>...</DrawerContent>
```

The sides are physical, not logical: `side="left"` stays on the left when the document
direction is RTL. Top and bottom are not implemented.

## DrawerContent props

Extends `ComponentProps<'dialog'>` and the appearance props.

| Prop | Type | Default |
| --- | --- | --- |
| `side` | `'left' \| 'right'` | `'right'` |
| `dismissable` | `boolean` | `true` |
| `material` | `'solid' \| 'frosted' \| 'liquid'` | inherited |
| `intensity` | `number` | inherited |
| `radius` | `number` | inherited |

`Drawer` takes `open`, `defaultOpen` and `onOpenChange` for controlled and uncontrolled use.
`dismissable` off keeps the drawer open when the backdrop is clicked; Escape still closes it,
because a modal the keyboard cannot leave is a trap.

The panel is `22rem` wide, or the viewport less `3rem` on a narrow screen. Override it with a
width utility on `className`: utilities land in a later cascade layer, so `className="w-[32rem]"`
wins without `!important`.

## Parts

`Drawer`, `DrawerTrigger`, `DrawerClose`, `DrawerTitle` and `DrawerDescription` are Dialog's
parts under drawer names. A drawer differs in where it sits, not in what it is, so they are
aliases rather than copies and cannot drift from the dialog behaviour. `DrawerContent` is the
only part with its own implementation, and it carries `data-slot="drawer-content"` and
`data-side`.

Use `DrawerTitle` with every drawer: `DrawerContent` points `aria-labelledby` at it, and
without one the panel opens unnamed. `DrawerDescription` is optional and fills
`aria-describedby`.

Use `render={<Button />}` on the trigger and the close to style them as a native button rather
than nesting one button inside another.

## Behaviour

The drawer is a native modal `<dialog>`. The engine traps focus inside it, marks the rest of
the page inert, closes on Escape and returns focus to whatever opened it. None of that is
reimplemented in JavaScript here, and the page behind it does not scroll.

## Motion

The panel comes the last `2.5rem` home rather than sweeping its whole width: a short settle
reads as arriving, where a full-width slide reads as a swipe. Entering runs over
`--duration-slow` on `--ease-out-cubic`; leaving runs at the scale's documented `0.66x` on
`--ease-in-cubic`, so the drawer settles in and clears out without snapping. The backdrop is
timed to the panel, so the two arrive and leave together.

The panel itself never animates opacity. Rounded glass flashes when it is opacity-composited in
WebKit, which is why `appearance.css` pins these surfaces to `opacity: 1`; the arrival is
carried by the travel and by the backdrop, which is not glass and can fade safely.

Both run in CSS through `@starting-style` and `transition-behavior: allow-discrete`, so there is
no presence hook and no animation runtime. Under `prefers-reduced-motion: reduce` the shared
`--motion-scale` token collapses the travel to zero and the drawer simply appears.

The slide needs `@crumza/ui/styles.css`; without it the drawer still opens, closes and traps
focus, it just fills the viewport like an unstyled dialog.
