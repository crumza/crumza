# Components

| Component | Use it for | Underneath |
| --- | --- | --- |
| [Button](/docs/components/button) | actions | `<button>` |
| [Glass](/docs/components/glass) | a slab of the material for chrome | `<div>` |
| [Scene and Lens](/docs/components/lens) | real refraction over an owned backdrop | `<div>` |
| [Card](/docs/components/card) | an opaque content surface | `<div>` |
| [Toolbar](/docs/components/toolbar) | a row of controls that is one Tab stop | `<div role="toolbar">` |
| [Tooltip](/docs/components/tooltip) | a label on hover or focus | `popover="manual"`, `role="tooltip"` |
| [Popover](/docs/components/popover) | an anchored non-modal panel | `popover="auto"` |
| [HoverCard](/docs/components/hover-card) | a card of detail on hover | `popover="manual"`, `role="dialog"` |
| [Dialog](/docs/components/dialog) | a modal | `<dialog>` + `showModal()` |
| [Drawer](/docs/components/drawer) | a modal panel at the left or right edge | `<dialog>` + `showModal()` |
| [Menu](/docs/components/menu) | a list of commands | `popover="auto"`, `role="menu"` |
| [Tabs](/docs/components/tabs) | sections of one view | `role="tablist"` |
| [Input](/docs/components/input), [Textarea](/docs/components/textarea) | text entry | native |
| [Select](/docs/components/select) | one of many, in a form | native `<select>` |
| [Slider](/docs/components/slider) | a number in a range | native range input |
| [Progress](/docs/components/progress) | progress of a long task | `role="progressbar"` |
| [Spinner](/docs/components/spinner) | an indeterminate wait | `<span role="status">` |
| [Skeleton](/docs/components/skeleton) | content that is not here yet | `<div aria-hidden>` |
| [Toast](/docs/components/toast) | a brief notice | `popover="manual"`, `role="status"` |
| [Label](/docs/components/label), [Field](/docs/components/field) | naming and describing a control | `<label>` |
| [Checkbox](/docs/components/checkbox) | independent on/off | native checkbox |
| [Switch](/docs/components/switch) | on/off with immediate effect | native checkbox, `role="switch"` |
| [RadioGroup](/docs/components/radio-group) | one of several, as a list | native radios |
| [SegmentedControl](/docs/components/segmented-control) | one of a few, inline | native radios |
| [Toggle](/docs/components/toggle) | a pressed/unpressed button | `<button aria-pressed>` |
| [Badge](/docs/components/badge) | a small fact | `<span>` |
| [Kbd](/docs/components/kbd) | a key cap | `<kbd>` |
| [Separator](/docs/components/separator) | a hairline | `<div>` |

Every component sets `data-slot="<name>"` on its root and accepts `className`, which is merged
last so your utilities win.
