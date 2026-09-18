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
| [LiquidScene](/docs/liquid) | a refracting stage for the liquid components | `<div>` + one frame driver |
| [LiquidPricingCard](/docs/components/liquid-pricing-card) | a plan card with a billing switch | `<button role="switch">` |
| [LiquidTestimonials](/docs/components/liquid-testimonials) | quotes with a featured card | `<section>` |
| [LiquidHeader](/docs/components/liquid-header) | a nav bar with sliding menus | `<button aria-expanded>`, `role="menu"` |
| [LiquidMobileNav](/docs/components/liquid-mobile-nav) | a dock at the foot of the scene | `<nav>`, `aria-current` |
| [LiquidTabIndicator](/docs/components/liquid-tab-indicator) | tabs with a travelling indicator | `role="tablist"` |
| [LiquidSearch](/docs/components/liquid-search) | a search field with live matches | native input, `role="listbox"` |
| [LiquidStepper](/docs/components/liquid-stepper) | a minus/plus counter | two `<button>`s |
| [LiquidGlassToggle](/docs/components/liquid-glass-toggle) | on/off with a lens for a thumb | `<button role="switch">` |
| [LiquidGlassSlider](/docs/components/liquid-glass-slider) | a number in a range, with a lens for a thumb | `role="slider"` |
| [LiquidColorPicker](/docs/components/liquid-color-picker) | picking a colour | `role="slider"` |
| [LiquidNotificationStack](/docs/components/liquid-notification-stack) | a deck of dismissable notices | `role="status"` |
| [LiquidContextMenu](/docs/components/liquid-context-menu) | a right-click menu | `role="menu"` |
| [LiquidGallery](/docs/components/liquid-gallery) | an image carousel | `aria-roledescription="carousel"` |
| [LiquixStage](/docs/components/liquix-stage) | the WebGL2 host for shader-drawn glass | `<canvas>` + `<div>` |
| [LiquixCapsule](/docs/components/liquix-capsule) | a shader-drawn capsule action | `<button>` |
| [LiquixCircle](/docs/components/liquix-circle) | a shader-drawn icon action | `<button>` |
| [LiquixFrosted](/docs/components/liquix-frosted) | the frosted material for the liquix shapes | a `frosted` stage |

Every component sets `data-slot="<name>"` on its root and accepts `className`, which is merged
last so your utilities win.
