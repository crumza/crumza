# Menu

A list of commands from a trigger: application menus, context menus, overflow menus. Built on
the popover API, so the engine owns dismiss, Escape and the top layer; Crumza adds the menu
semantics, roving focus and typeahead.

```tsx
<Menu>
  <MenuTrigger render={<Button variant="ghost" shape="rect" />}>File</MenuTrigger>
  <MenuContent>
    <MenuItem shortcut="⌘N" onSelect={create}>New document</MenuItem>
    <MenuItem disabled>Revert</MenuItem>
    <MenuSeparator />
    <MenuLabel>View</MenuLabel>
    <MenuCheckboxItem checked={ruler} onCheckedChange={setRuler}>Ruler</MenuCheckboxItem>
    <MenuRadioGroup value={mode} onValueChange={setMode}>
      <MenuRadioItem value="page">Page layout</MenuRadioItem>
      <MenuRadioItem value="draft">Draft</MenuRadioItem>
    </MenuRadioGroup>
  </MenuContent>
</Menu>
```

## Menu props

| Prop | Type | Default |
| --- | --- | --- |
| `open` | `boolean` | uncontrolled |
| `defaultOpen` | `boolean` | `false` |
| `onOpenChange` | `(open: boolean) => void` | |

## Parts

- `MenuTrigger`: extends `ComponentProps<'button'>`, accepts `render`. Enter, Space and click
  open with focus on the first item; ArrowDown opens on the first, ArrowUp on the last.
- `MenuContent`: `role="menu"`, glass. `side` (`'bottom'`), `align` (`'start'`), `offset` (`4`).
- `MenuItem`: `role="menuitem"`. `onSelect(event)` runs on click, Enter or Space and the menu
  closes unless you call `event.preventDefault()`. `disabled`, `shortcut` (visual only; bind the
  key yourself).
- `MenuCheckboxItem`: `role="menuitemcheckbox"`, `checked` / `defaultChecked` /
  `onCheckedChange`. Stays open on toggle.
- `MenuRadioGroup` and `MenuRadioItem`: `role="menuitemradio"`, one value per group.
- `MenuLabel`, `MenuSeparator`.

## Keyboard

ArrowUp and ArrowDown move focus and wrap, Home and End jump, printable characters typeahead
(600ms buffer), Enter and Space activate, Escape closes and returns focus to the trigger, Tab
closes and moves on. Hovering an item focuses it, so the highlight and the focus never disagree.

Submenus are not implemented yet.
