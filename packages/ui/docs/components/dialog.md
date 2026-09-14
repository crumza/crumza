# Dialog

A modal on the native `<dialog>` element. The engine traps focus, makes the rest of the page
inert, closes on Escape and returns focus to the trigger. Crumza adds the material, the
backdrop-click rule and the enter/exit motion.

```tsx
<Dialog>
  <DialogTrigger render={<Button variant="outline" />}>Delete document</DialogTrigger>
  <DialogContent className="grid gap-4">
    <DialogTitle>Delete "Q3 planning"?</DialogTitle>
    <DialogDescription>This removes the document for everyone. There is no undo.</DialogDescription>
    <div className="flex justify-end gap-2">
      <DialogClose render={<Button variant="ghost" shape="rect" />}>Cancel</DialogClose>
      <DialogClose render={<Button variant="destructive" shape="rect" />}>Delete</DialogClose>
    </div>
  </DialogContent>
</Dialog>
```

## Dialog props

| Prop | Type | Default |
| --- | --- | --- |
| `open` | `boolean` | uncontrolled |
| `defaultOpen` | `boolean` | `false` |
| `onOpenChange` | `(open: boolean) => void` | |

## Parts

- `DialogTrigger` and `DialogClose`: extend `ComponentProps<'button'>`, accept `render`.
- `DialogContent`: extends `ComponentProps<'dialog'>`. `dismissable` (default `true`) closes on
  a click that starts and ends on the backdrop; set it `false` to prevent backdrop dismissal.
  Escape still closes; cancel it explicitly with onCancel and preventDefault when essential.
  material, intensity and radius are also accepted.
- `DialogTitle` (`<h2>`) and `DialogDescription` (`<p>`): wired to `aria-labelledby` and
  `aria-describedby`. Render both a title and a description.

## Behaviour

`showModal()` puts the dialog in the top layer, focuses the first focusable element (or the one
with `autofocus`), and inerts everything behind it. The page stops scrolling through
`html:has(dialog:modal)`. Closing animates out through `transition-behavior: allow-discrete`.
The dialog retains at least .94 surface alpha. Its glass entrance does not fade the panel's opacity.
The deletion example only closes the dialog; attach the application's real delete action.
