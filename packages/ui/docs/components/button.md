# Button

A native liquid-glass button, with independently configurable clarity, color and radius. Use the live controls above to compare liquid, frosted and solid.

```tsx
import { Button } from '@crumza/ui';

<Button tone="primary">Save changes</Button>
<Button variant="muted">Secondary action</Button>
<Button variant="bordered">Cancel</Button>
<Button material="liquid" tone="secondary" radius={24}>Follow</Button>
<Button material="frosted" intensity={0.4}>Preview</Button>
<Button material="solid">Opaque alternative</Button>
```

## Props

| Prop | Values | Default |
| --- | --- | --- |
| variant | solid, muted, bordered, ghost, link | solid |
| tone | neutral, primary, secondary, destructive | neutral |
| material | solid, frosted, liquid | inherited; root liquid |
| intensity | finite 0..1 | inherited; root .5 |
| radius | nonnegative pixels | inherited |
| size | sm, md, lg, icon | md |
| shape | capsule, rect | inherited radius |
| type | button, submit, reset | button |

All native button props, ref and events are supported. Disabled uses the native disabled attribute.

`variant="solid"` is the filled button treatment, not an instruction to disable glass. `material="solid"` selects an opaque surface. Material and variant are independent.

Liquid buttons have backdrop blur, a directional highlight, a fine bevel and soft elevation. Inside a `Scene`, the shared optical layer also bends that Scene's background along the edge. Outside a Scene, the portable CSS material remains; it does not refract arbitrary page DOM. See [materials](/docs/material).

Legacy aliases remain for the migrated Chamak examples: primary maps to the primary tone, secondary to a muted fill, outline to bordered, glass to liquid material, destructive to destructive tone. Prefer the independent modern properties in new code.

## Interaction

Hover subtly changes the border or fill. Press moves by one pixel with a 100ms transform transition. No pointer tracker, bounce, animated blur or glow loop. Focus is a visible two-pixel outline with an offset. Reduced motion removes the transition.

## Composition

```tsx
<DialogTrigger render={<Button tone="primary" />}>Open dialog</DialogTrigger>
<DialogClose render={<Button variant="bordered" />}>Cancel</DialogClose>
```

Trigger parts accept native button props, not Button's variant props. Pass a Button through render to style them without nesting interactive elements.

## Accessibility

Use descriptive text. Icon-only buttons need an accessible name, although the Crumza website intentionally avoids decorative icons. For navigation use an anchor, not a button with a hidden click handler. Provide an actual onClick or submit action for application buttons; static documentation specimens demonstrate appearance only.
