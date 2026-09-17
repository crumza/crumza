# Liquid glass scene

A refraction engine shared by every liquid surface. The scene owns a background image; each surface inside it holds a pixel-aligned clone of that image and bends it through a displacement map, so the glass reads as glass whatever moves behind it.

```tsx
import { LiquidScene, LiquidStepper } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" frosted blur={5} className="h-[420px] rounded-xl">
  <LiquidStepper radius={40} />
</LiquidScene>
```

Import `@crumza/ui/styles.css` as usual; it already includes the liquid stylesheet. The scene needs a size from you (a class or style), because it fills nothing by itself.

## Options

Five things are adjustable. Everything else about the optics is fixed, so every surface in a scene is the same material.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `frosted` | `boolean` | `false` | the toggle between clear glass and frosted glass: a deeper, wider rim and a soft interior blur |
| `blur` | `number` | `2.5`, or `5` when frosted | interior blur in px, 0 to 15 |
| `glint` | `number` | `100` | specular rim intensity, 0 to 100 |
| `tint` | `number` | `0.2` | tint strength, 0 to 1 |
| `tintColor` | `string` | `'#000000'` | tint colour, multiplied over the refraction |
| `radius` | `number` | `40` | on each component, not the scene: 0 to 40, capped per surface so a panel matches its control |
| `background` | `string` | | image URL for the scene |
| `backdrops` | `readonly LiquidBackdrop[]` | | a strip of backdrops that scrolls behind the glass; takes the place of `background` |
| `backdrop` | `number` | | which panel of the strip is showing; changing it settles the strip on it |
| `onBackdropChange` | `(index: number) => void` | | fires when the reader scrolls the strip onto a different panel |
| `sceneContent` | `ReactNode` | | extra content that refracts; keep it out of the interactive layer |
| `animated` | `boolean` | `false` | set when the scene paints continuously, so Safari re-samples every frame |

Out-of-range values clamp. `LiquidScene` extends native div props.

## The scrolling strip

A scene can hold one backdrop or a strip of them. Given `backdrops`, the scene stacks one panel per viewport and scrolls them behind the glass, the way the liquix stage scrolls its panels: wheel over it, or sweep the bare scene. A throw settles on the nearest panel, and `onBackdropChange` reports where it landed.

The strip eases towards where the scroll is heading rather than taking each delta as it arrives. A wheel sends ragged deltas, 4px on one frame and 30 on the next, and a strip that takes them straight moves on a third of the frames and stands still on the rest. Easing towards the running total spreads the same travel across every frame, and the landing on a panel happens with the same follow rather than as a separate spring. A finger is the exception: a drag carries the strip one to one, because anything else reads as lag against the thing being touched.

```tsx
import { LIQUID_BACKDROPS, LiquidScene, LiquidStepper } from '@crumza/ui/liquid';

<LiquidScene backdrops={LIQUID_BACKDROPS} className="h-[420px]">
  <LiquidStepper />
</LiquidScene>
```

A `LiquidBackdrop` is `{ src?, css?, label? }`: an image URL, or any CSS background value, with an optional caption drawn in the corner. `LIQUID_BACKDROPS` is the three generated panels the liquix stage shows, and `LIQUID_PATTERNS` holds them one by one as `checker`, `spectrum` and `bars`. They are written to match the liquix shader value for value, so both stages show the same field: straight lines for the bend at the rim, a hue sweep for dispersion, hard bars for the chromatic fringe.

The offset is one custom property on the stage, `--lq-scroll`. Every surface holds a clone of the scene and the clone inherits that property, so the real strip and each refracted copy of it move on the same value in the same frame. A travelling strip counts as animated scene content, so the filter is re-minted while it moves.

The strip never traps the reader: past either end a wheel is handed back to the page, and a drag scrolls the page first and only rubber-bands once the page itself has run out.

## Fitting the scene

A component answers to the scene, not to the window. The same stepper sits in a 1280px page and in a 558px panel beside an inspector, so a viewport media query would tell it the wrong thing about the room it has. The stage is a size container named `lq-stage`, every width in the set is `min(its natural size, var(--lq-room))`, and every layout change in the set is a `@container` query on that name.

`--lq-room` is `calc(100cqw - 2 * var(--lq-gutter))`: the stage, less the margin a surface keeps from its own rim. Set `--lq-gutter` on the scene to change it; it is 16px by default.

| Scene width | What gives |
| --- | --- |
| under 740px | the testimonial row becomes the featured card alone; the arrows and the dots still walk the whole set |
| under 460px | the header bar trades padding and a little type to keep all three of its items |
| under 440px | a context submenu opens under its row rather than beside it, where there is no room for a second column |
| under 380px | the header tightens once more; below about 300px its labels ellipsise, which is the backstop rather than the plan |

A component is placed by the scene: the interactive layer centres what it holds, so a component ships itself and nothing else. A component taller than the stage aligns to the top rather than losing its head and its feet to the clip in equal measure.

## Press

Every control in a scene answers a press: it gives by a little, and light spreads from the point it was touched. The scene installs one delegated listener for all of it, so a component gets the behaviour by being inside a scene, with nothing to wire up.

How far a control gives is the component's to set, through `--lq-press-scale` on the control (`1` for something that is swept rather than pressed, like the colour pad). How long it takes belongs in the component's own transition list, alongside `scale`. A press that travels more than 12px is a scroll or a drag and is taken back; a tap shorter than 110ms is still held that long, so it is always seen. Keyboard activation presses from the middle of the control.

Hover states across the set are behind `@media (hover: hover)`, so nothing sticks after a tap.

## Components

Type across the set is white and in the bold range: 600 for body and controls, 700 for titles and labels, 800 for the few things that carry a whole component (a price, a caption, a set of initials). Rank comes from weight and size, not from how much glass shows through the text. The exceptions are text that sits on a light fill rather than on glass, which stays dark so it can be read: the CTA on a white button, the label over the billing switch's knob, the active tab over its blob.

Every component takes the shared `radius` and is centred over the scene. The glass stays where it is put; the backdrop is what moves, so scroll the strip and watch a rim resample what passes under it.

| Component | Use it for | Underneath |
| --- | --- | --- |
| [LiquidPricingCard](/docs/components/liquid-pricing-card) | a plan with a billing switch | `<button role="switch">` |
| [LiquidTestimonials](/docs/components/liquid-testimonials) | quotes with a featured card | `<section>`, `role="tablist"` dots |
| [LiquidHeader](/docs/components/liquid-header) | a nav bar with sliding menus | `<button aria-expanded>`, `role="menu"` |
| [LiquidTabIndicator](/docs/components/liquid-tab-indicator) | tabs with a travelling indicator | `role="tablist"` |
| [LiquidSearch](/docs/components/liquid-search) | a search field with live matches | `<input>`, `role="listbox"` |
| [LiquidStepper](/docs/components/liquid-stepper) | a minus/plus counter | two `<button>`s, `aria-live` value |
| [LiquidColorPicker](/docs/components/liquid-color-picker) | picking a colour | two `role="slider"` pads |
| [LiquidNotificationStack](/docs/components/liquid-notification-stack) | a deck of dismissable notices | `role="status"` cards |
| [LiquidContextMenu](/docs/components/liquid-context-menu) | a right-click menu with a submenu | `role="menu"` |
| [LiquidGallery](/docs/components/liquid-gallery) | an image carousel with a rail | `aria-roledescription="carousel"` |

## How it paints

One `requestAnimationFrame` loop per scene drives every surface. A surface repaints only when something changed under it: a size or position change, an option change, or a short pump a component asks for while it animates. Parked over a still scene, the glass costs nothing.

Server-rendered markup already carries the blur, tint and glint as inline styles, with a backdrop blur standing in for the clone, so the glass looks right from its first paint; the rim refraction arrives when the engine mounts.

Displacement maps are built on a canvas, keyed by size, radius and optics, and cached across surfaces. Mid-animation a surface builds on an 8px-quantized size and lets the filter stretch it, so an opening panel costs a couple of cached maps rather than one per frame.

## Limits and fallbacks

This engine needs a browser: canvas, SVG filters, `ResizeObserver` and container queries. The press ripple also needs `@property`; without it the press still scales and still answers, it just does not spread. On the server the markup renders and the optics arrive on mount. Reduced transparency hides the refraction and blur layers and gives each surface an opaque fill. Reduced motion removes the transitions, and a press answers with a flat highlight instead of a scale and a spreading ripple. Forced colours are not specially handled. The demos above clone an image you supply; the scene does not clone arbitrary page content.
