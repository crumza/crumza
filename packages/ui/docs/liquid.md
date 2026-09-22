# Liquid glass scene

A refraction engine shared by every liquid surface. The scene owns a background image; each surface inside it holds a pixel-aligned clone of that image and bends it through a displacement map, so the glass reads as glass whatever moves behind it.

```tsx
import { LiquidScene, LiquidStepper } from '@crumza/ui/liquid';

<LiquidScene background="/scenes/ridge.jpg" frosted className="h-[420px] rounded-xl">
  <LiquidStepper radius={40} />
</LiquidScene>
```

Import `@crumza/ui/styles.css` as usual; it already includes the liquid stylesheet. The scene needs a size from you (a class or style), because it fills nothing by itself.

## Options

Five things are adjustable. Everything else about the optics is fixed, so every surface in a scene is the same material.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `frosted` | `boolean` | `false` | the toggle between clear glass and frosted glass, the material of the macOS Dock: a softening blur, a little saturation and a thin milk veil, with a hairline for a rim |
| `blur` | `number` | `1`, or `14` when frosted | interior blur in px, 0 to 40 |
| `glint` | `number` | `100` | specular rim intensity, 0 to 100 |
| `tint` | `number` | `0.2`, or `0.14` when frosted | tint strength, 0 to 1 |
| `tintColor` | `string` | `'#000000'`, or `'#ffffff'` when frosted | tint colour: multiplied into the refraction on clear glass, laid over it as a veil on frosted glass |
| `radius` | `number` | `40` | on each component, not the scene: 0 to 40, capped per surface so a panel matches its control |
| `background` | `string` | | image URL for the scene |
| `backdrops` | `readonly LiquidBackdrop[]` | | a strip of backdrops that scrolls behind the glass; takes the place of `background` |
| `backdrop` | `number` | | which panel of the strip is showing; changing it settles the strip on it |
| `onBackdropChange` | `(index: number) => void` | | fires when the reader scrolls the strip onto a different panel |
| `sceneContent` | `ReactNode` | | extra content that refracts; keep it out of the interactive layer |
| `animated` | `boolean` | `false` | set when the scene paints continuously, so Safari re-samples every frame |

Out-of-range values clamp. `LiquidScene` extends native div props.

## Frosted

Clear glass is the resting material: a thin pane that bends what passes under its rim and barely softens the rest. `frosted` is the other material, and its reference is the macOS Dock rather than clear glass with more blur. The scene behind each pane stays visible, its colour intact and its detail softened rather than erased, lifted by a thin white milk rather than dimmed to a slab. The bevel gives way to a hairline round the rim, a touch brighter along the top edge, with a faint sheen down the face and a little elevation. Frost diffuses the light a clear edge would bend, so the rim all but stops refracting: a frosted pane ends at its hairline, not at a band of bent scene.

The same knobs apply. Blur, tint and its colour start at the material's own resting values and can be pulled anywhere in their ranges; on frosted glass the tint colour is laid over the blur rather than multiplied into it, so the white it rests on frosts to milk, and a dark `tintColor` turns it smoky where clear glass would only darken. Glint drives the hairline and the sheen together, so glint 0 is a plain frosted pane. The set's type stays white, so over a very light backdrop a frosted pane gives a lower contrast than clear glass does; raise the tint towards black there, or keep frosted for photographic and mid-tone backdrops, which is where the Dock lives too.

```tsx
<LiquidScene backdrops={LIQUID_BACKDROPS} frosted className="h-[420px]">
  <LiquidPricingCard />
</LiquidScene>
```

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
| [LiquidMobileNav](/docs/components/liquid-mobile-nav) | a dock where a thumb can reach it | `<nav>`, `aria-current` |
| [LiquidTabIndicator](/docs/components/liquid-tab-indicator) | tabs with a travelling indicator | `role="tablist"` |
| [LiquidSearch](/docs/components/liquid-search) | a search field with live matches | `<input>`, `role="listbox"` |
| [LiquidStepper](/docs/components/liquid-stepper) | a minus/plus counter | two `<button>`s, `aria-live` value |
| [LiquidGlassToggle](/docs/components/liquid-glass-toggle) | on/off whose thumb lifts into a lens | `<button role="switch">` |
| [LiquidGlassSlider](/docs/components/liquid-glass-slider) | a thin rail with an oversized lens for a thumb | `role="slider"` |
| [LiquidColorPicker](/docs/components/liquid-color-picker) | picking a colour | two `role="slider"` pads |
| [LiquidNotificationStack](/docs/components/liquid-notification-stack) | a deck of dismissable notices | `role="status"` cards |
| [LiquidContextMenu](/docs/components/liquid-context-menu) | a right-click menu with a submenu | `role="menu"` |
| [LiquidDockMenu](/docs/components/liquid-dock-menu) | a pill of glyphs that unfolds into a menu | `<nav>` of `<button>`s, `role="menu"` |
| [LiquidGallery](/docs/components/liquid-gallery) | an image carousel with a rail | `aria-roledescription="carousel"` |
| [LiquidSheet](/docs/components/liquid-sheet) | a sheet that rises from the foot of the scene | `role="dialog"` |
| [LiquidPlusButton](/docs/components/liquid-plus-button) | a plus that grows into a menu of actions | `<button aria-expanded>`, `role="menu"` |
| [LiquidMenuButton](/docs/components/liquid-menu-button) | three bars that grow into a menu | `<button aria-expanded>`, `role="menu"` |
| [LiquidActionPill](/docs/components/liquid-action-pill) | a round that widens into a row of actions | `<button aria-expanded>`, `role="toolbar"` |
| [LiquidActionDock](/docs/components/liquid-action-dock) | a button whose actions emerge in an arc | `<button aria-expanded>`, `role="menu"` |
| [LiquidContextToolbar](/docs/components/liquid-context-toolbar) | a formatting bar that comes out of its icon | `role="toolbar"`, `aria-pressed`, `radiogroup` |
| [LiquidCommandPalette](/docs/components/liquid-command-palette) | a button that becomes a command field | `role="combobox"`, `role="listbox"` |

## How it paints

One `requestAnimationFrame` loop per scene drives every surface. A surface repaints only when something changed under it: a size or position change, an option change, or a short pump a component asks for while it animates. Parked over a still scene, the glass costs nothing.

Server-rendered markup already carries the blur, tint and glint as inline styles, with a backdrop blur standing in for the clone, so the glass looks right from its first paint; the rim refraction arrives when the engine mounts. Frosted glass blurs its clone hard, and a blur thins out towards the edge of what it samples, so a frosted clone reaches further past the glass edge than a clear one before the wrapper clips it; that is why the frosted material is a little more work per surface.

A surface can ask for a multiple of four of the material's optics through registered properties set on it or on anything above it, and the engine reads them on every paint. `--lq-bend` multiplies the filter's displacement scale, so the map is untouched and the change is free; because the property is registered it transitions, and a lens that is picked up gets to its harder bend eased. `--lq-blur` multiplies the interior blur and `--lq-tint` the tint, so a loupe can keep what it magnifies sharp and its own colour. `--lq-rim` multiplies how deep the bend reaches in from the edge: the material's rim was drawn for panes and reaches 26px, and on a lens a few times that size it would meet itself in the middle, so a small lens takes a rim in proportion to its size. It is the one that changes the map, so it is rounded to whole pixels and meant to be set rather than transitioned. The glass slider's lens takes a quarter of the rim, rests at half the bend and goes to four fifths in the hand, and on clear glass takes a quarter of the blur and a third of the tint.

A surface refracts the scene. It can also refract something of its own: pass `refracted` and the content is laid out in the surface's box, over the clone of the scene, and bent, blurred and magnified with it. The glass slider's lens carries a copy of its rail there, so the rail it sits on bends through the glass along with the scene behind it. It is behind the filter, so it is decorative: nothing in it can be read or pressed.

Displacement maps are built on a canvas, keyed by size, radius and optics, and cached across surfaces. Mid-animation a surface builds on an 8px-quantized size and lets the filter stretch it, so an opening panel costs a couple of cached maps rather than one per frame.

## Limits and fallbacks

This engine needs a browser: canvas, SVG filters, `ResizeObserver` and container queries. The press ripple also needs `@property`; without it the press still scales and still answers, it just does not spread. On the server the markup renders and the optics arrive on mount. Reduced transparency hides the refraction and blur layers and gives each surface an opaque fill. Reduced motion removes the transitions, and a press answers with a flat highlight instead of a scale and a spreading ripple. Forced colours are not specially handled. The demos above clone an image you supply; the scene does not clone arbitrary page content.
