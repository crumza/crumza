# LiquixTabs

A tab bar made of glass, for the `overlay` of a [LiquixSurface](/docs/components/liquix-surface). The bar is one capsule refracting whatever scrolls under it, and the selected tab's highlight turns to glass while it travels between tabs, then settles back into a flat capsule.

```tsx
import { LiquixSurface, LiquixTabs, LiquixTabsShadow } from '@crumza/ui';

const tabs = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'inbox', label: 'Inbox', Icon: InboxIcon },
];

<LiquixSurface
  paint={paint}
  paintKey={active}
  paintKeys={tabs.map((tab) => tab.id)}
  className="h-full w-full bg-white"
  underlay={<LiquixTabsShadow width={width} />}
  overlay={<LiquixTabs tabs={tabs} active={active} onChange={setActive} width={width} />}
>
  <Screen id={active} />
</LiquixSurface>
```

Every tab is a real `<button role="tab">` inside a `tablist`, so screen readers announce position and state.

## Colour follows the capsule

The selected colour belongs to the capsule, not to the tab. The labels are drawn twice, once in `inactiveClassName` clipped to everything but the capsule's outline and once in `activeClassName` clipped to it, and the highlight moves both clips every frame with itself. So as the capsule slides off a tab its label turns white from the edge the capsule leaves, the label it arrives at turns blue from the edge it reaches, and a label half under a lifted capsule is half blue. The clips are `clip-path` polygons on two non-interactive copies, paint only with no layout, and the buttons themselves keep their text for the reader and their box for the pointer and the focus ring. The bar is one Tab stop: Left and Right arrows move between tabs and select as they go, Home and End jump to the ends, and the arrows swap in right-to-left text. The buttons are transparent: the bar and the highlight are drawn by the surface's shader on the canvas underneath, and the selected tab is distinguished by the filled capsule and a different label colour, so it survives a screenshot in greyscale.

## Props

| Prop | Default | Meaning |
| --- | --- | --- |
| tabs | required | `[{ id, label, Icon }]`. `Icon` is a component; it inherits size and colour from the button, so the tab styling drives it |
| active | required | The selected id |
| onChange | required | Called with the id of the tab that was clicked |
| width | required | The surface's width in CSS px. The bar is measured from it rather than from its own layout, because the shader needs the box in the same units it is given everything else |
| inset | 14 | CSS px between the surface's edge and the bar's, each side |
| bottom | 28 | CSS px from the surface's bottom edge to the bar's |
| height | 56 | The bar's height in CSS px. The corner radius is half of it |
| label | `Sections` | The accessible name of the tablist |
| activeClassName | `text-blue-600` | Classes for the labels where the capsule is. Whatever part of an icon or label sits inside the capsule's outline is drawn with these |
| inactiveClassName | `text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]` | Classes for the labels outside the capsule. White with a drop shadow, as on LiquixCapsule, so they read over any picture |
| pillClassName | none | Classes added to the parked highlight, the capsule the glass settles into. By default it is translucent grey over a backdrop blur, so the bar and the picture still show through softly; a background utility replaces the grey |

The bar's width is `width` minus twice `inset`, and the tabs share it equally.

## LiquixTabsShadow

The drop shadow, which the shader cannot draw for a stencilled canvas. Pass it to the surface's `underlay`, because anything in front of the canvas would lay the shadow over the glass instead of under it. It takes `width`, `inset`, `bottom` and `height`, with the same defaults as the bar, so the two line up.

## How the highlight moves

The highlight travels on an under-damped spring: it arrives, leans past the tab and settles, which is what makes the glass read as liquid rather than as a box being moved. While it moves it is glass, stretched along the direction of travel and pinched across it, drawn on a layer above the bar as a lens laid on it. It counts as parked once it is within a couple of pixels of its tab and nearly still, both at once, so the instant of stillness at the top of an overshoot does not count. Then it settles in about 100ms, in the order a real piece of glass would: the lens quality goes first, over 40ms, as rim, refraction and dispersion fade and the body turns milky, and once the glass has frosted the resting capsule, translucent grey over a blur, fills in behind it over 70ms. Becoming glass runs the other way: the frosted shape arrives over 100ms and its rim and refraction follow. Once the glass is gone the highlight hands its shape back to the surface, so at rest the shader draws only the bar and the second pass drops. Under reduced transparency the capsule is solid.

Resizing is not a move: the pill belongs to the same tab, so it goes straight to the new geometry instead of sliding across the bar.

## Dragging

Press the selected tab and drag, with a mouse or a finger, and the highlight comes with the pointer. While it is held it is glass, lifted a little wider and enough taller to stand proud of the bar above and below, with a drop shadow beneath it, and it stretches with the speed it is moved at. Its lens rim is deeper than the bar's, about a third of its height, the way a lifted pill of glass is thicker than the pane it sits on, with a clear middle. On release it shrinks in 50ms and the shadow goes with it. Let go and the spring carries it from where it was, with the fling it had, to the nearest tab, which becomes the selection and reports through `onChange`; then it settles to grey as after a click. A press that does not move is the click it looks like, and a press on any other tab is an ordinary click. The bar takes pointer capture for the drag, so it follows a finger that wanders off it, and the browser's click after a release never reaches a tab.

## Fallback

Without WebGL2, or outside a surface, the track and the highlight fall back to CSS glass: blur and a rim highlight, no refraction, dispersion or stretching. The buttons, the tablist and the selection work the same either way.

For ordinary application chrome use [Tabs](/docs/components/tabs), which needs no surface and no per-frame loop.
