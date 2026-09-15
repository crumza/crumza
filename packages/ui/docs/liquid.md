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
| `sceneContent` | `ReactNode` | | extra content that refracts; keep it out of the interactive layer |
| `animated` | `boolean` | `false` | set when the scene paints continuously, so Safari re-samples every frame |

Out-of-range values clamp. `LiquidScene` extends native div props.

## Components

Every component takes the shared `radius` and lays itself out over the scene. Most sit inside a draggable wrapper: drag one across the picture and watch the rim resample what it crosses.

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

Displacement maps are built on a canvas, keyed by size, radius and optics, and cached across surfaces. Mid-animation a surface builds on an 8px-quantized size and lets the filter stretch it, so an opening panel costs a couple of cached maps rather than one per frame.

## Limits and fallbacks

This engine needs a browser: canvas, SVG filters and `ResizeObserver`. On the server the markup renders and the optics arrive on mount. Reduced transparency hides the refraction and blur layers and gives each surface an opaque fill. Reduced motion removes the transitions. Forced colours are not specially handled. The demos above clone an image you supply; the scene does not clone arbitrary page content.
