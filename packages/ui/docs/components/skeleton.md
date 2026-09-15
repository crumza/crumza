# Skeleton

The shape of content that does not exist yet. It holds the space the real thing will take, so
the first paint does not jump. For a wait over content already on screen use
[Spinner](/docs/components/spinner): replacing what someone is reading with grey blocks loses
their place.

```tsx
<Skeleton className="h-6 w-40" />
<Skeleton shape="circle" className="size-8" />
<Skeleton shape="text" lines={3} />
```

A skeleton is sized by your own utilities, not by props. On its own a `block` is a full-width
bar 1rem tall, a `circle` is 2.5rem across, and `text` is a stack of lines whose last one runs
short, as prose does.

```tsx
<div className="flex gap-3" aria-busy={loading}>
  <Skeleton shape="circle" className="size-10" />
  <div className="grid flex-1 gap-2">
    <Skeleton className="h-4 w-32" />
    <Skeleton shape="text" lines={2} />
  </div>
</div>
```

## Announcing the wait

Skeletons are decorative and carry `aria-hidden`, so a list of twelve does not become twelve
announcements. Announce the wait once, on the region they fill: `aria-busy` while it loads, and
a `role="status"` line if the wait is long enough to be worth saying out loud.

## Props

Extends `ComponentProps<'div'>` minus `children`.

| Prop | Type | Notes |
| --- | --- | --- |
| `shape` | `'block' \| 'text' \| 'circle'` | default `'block'` |
| `lines` | `number` | `shape="text"` only; default 3, floored at 1 |

With `shape="text"` the root is the stack, so `className` lands on the stack and not on each
line. Target the lines through `[data-shape="line"]`.

Under reduced motion the highlight stops travelling and the flat tint carries the meaning.
