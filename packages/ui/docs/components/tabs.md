# Tabs

Sections of one view, one visible at a time. For choosing a value use
[SegmentedControl](/docs/components/segmented-control).

```tsx
<Tabs defaultValue="style">
  <TabList aria-label="Inspector">
    <Tab value="style">Style</Tab>
    <Tab value="layout">Layout</Tab>
  </TabList>
  <TabPanel value="style">...</TabPanel>
  <TabPanel value="layout">...</TabPanel>
</Tabs>
```

## Tabs props

Extends `ComponentProps<'div'>`.

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `string` | uncontrolled |
| `defaultValue` | `string` | `''` |
| `onValueChange` | `(value: string) => void` | |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `activation` | `'automatic' \| 'manual'` | `'automatic'` |

## Parts

- `TabList`: `role="tablist"`. Give it `aria-label`. One Tab stop; arrows move between tabs
  (mirrored in RTL), Home and End jump.
- `Tab`: `role="tab"`, requires `value`. The active one is the tab stop. Selected tabs carry a
  hairline indicator on the list's border.
- `TabPanel`: `role="tabpanel"`, requires `value`; hidden when inactive, focusable so keyboard
  users can reach its content.

`automatic` activation selects as focus moves; `manual` waits for Enter or Space, which is
better when switching is expensive.
