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

Every tab is a real `<button role="tab">` inside a `tablist`, so screen readers announce position and state. The buttons are transparent: the bar and the highlight are drawn by the surface's shader on the canvas underneath, and the selected tab is distinguished by the filled capsule and a different label colour, so it survives a screenshot in greyscale.

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
| activeClassName | `text-blue-600` | Classes on the selected tab's button |
| inactiveClassName | `text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]` | Classes on every other tab's button. White with a drop shadow, as on LiquixCapsule, so it reads over any picture |
| pillClassName | none | Classes added to the parked highlight, the capsule the glass settles into. By default it is translucent grey over a backdrop blur, so the bar and the picture still show through softly; a background utility replaces the grey |

The bar's width is `width` minus twice `inset`, and the tabs share it equally.

## LiquixTabsShadow

The drop shadow, which the shader cannot draw for a stencilled canvas. Pass it to the surface's `underlay`, because anything in front of the canvas would lay the shadow over the glass instead of under it. It takes `width`, `inset`, `bottom` and `height`, with the same defaults as the bar, so the two line up.

## How the highlight moves

The highlight travels on an under-damped spring: it arrives, leans past the tab and settles, which is what makes the glass read as liquid rather than as a box being moved. While it moves it is glass, stretched along the direction of travel and pinched across it, drawn on a layer above the bar so it refracts the bar's own surface. Once it parks it fades to the resting capsule, translucent grey over a blur, and hands its shape back to the surface, so at rest the shader draws only the bar and the second pass drops. Under reduced transparency the capsule is solid.

Resizing is not a move: the pill belongs to the same tab, so it goes straight to the new geometry instead of sliding across the bar.

## Fallback

Without WebGL2, or outside a surface, the track and the highlight fall back to CSS glass: blur and a rim highlight, no refraction, dispersion or stretching. The buttons, the tablist and the selection work the same either way.

For ordinary application chrome use [Tabs](/docs/components/tabs), which needs no surface and no per-frame loop.
