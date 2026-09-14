# Select

The native `<select>` with the field treatment and a chevron. The popup is the operating
system's, which is the right call for forms: keyboard, typeahead, form participation and the
mobile picker all come free. A glass listbox for menus and toolbars comes later.

```tsx
<Field label="Paper" htmlFor="paper">
  <Select id="paper" defaultValue="a4">
    <option value="a4">A4</option>
    <option value="letter">US Letter</option>
  </Select>
</Field>
```

## Props

Extends `ComponentProps<'select'>` minus the native `size` attribute.

| Prop | Type | Default |
| --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
