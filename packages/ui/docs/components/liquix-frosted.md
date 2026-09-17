# LiquixFrosted

The frosted material for the liquix shapes: the glass of the macOS Dock. It is not a component of its own but a material the stage switches every shape inside it to.

```tsx
import { LiquixCapsule, LiquixCircle, LiquixStage } from '@crumza/ui';

<LiquixStage frosted>
  <LiquixCapsule>Liquid Glass</LiquixCapsule>
  <LiquixCircle aria-label="Favourite">★</LiquixCircle>
</LiquixStage>
```

## The look

Clear glass is the resting material. `frosted` swaps in this one: the backdrop stays visible through the pane, its colour intact and its detail softened rather than erased, lifted by a thin white milk rather than dimmed to a slab. The glass still dims itself over bright content, a touch less than clear glass does, so the white labels keep their contrast the way the Dock greys over a white desktop. The bevel narrows to a few pixels with almost no dispersion, because frost diffuses the light a clear edge would bend, and the Fresnel and glare bands close down to the hairline a frosted pane shows at its rim, so the pane ends at a line rather than at a frame. Overscroll, hover and press behave the same as on clear glass.

The switch in the corner of the demo above toggles the material live, and this is the one page that carries it: the component pages show clear glass with nothing else in view. Nothing else changes here: the same [LiquixCapsule](/docs/components/liquix-capsule) and [LiquixCircle](/docs/components/liquix-circle) sit on the same [LiquixStage](/docs/components/liquix-stage).

## Parameters

The material is the preset `frostedLiquixParams`, exported next to `defaultLiquixParams`. A frosted stage merges `params` over it, so anything you pass still wins.

| Parameter | Clear | Frosted | What it does |
| --- | --- | --- | --- |
| blurRadius | 8 | 20 | how far the backdrop softens; the frost |
| saturation | 100 | 125 | percent saturation of the backdrop seen through the glass, so colour survives the blur |
| tint | white, alpha 0 | white, alpha 0.2 | the milk: a thin white veil over the blur |
| overLight | 40 | 30 | percent dimming over a bright backdrop, eased so the frost stays light |
| refThickness | 20 | 6 | bevel width in px; wider reads as a frame once frosted |
| refDistance | 0.05 | 0.02 | how far the bevel bends the backdrop |
| refDispersion | 7 | 1.5 | per-channel colour split at the bevel |
| fresnelRange, fresnelFactor | 30, 26 | 12, 24 | the rim highlight, closed to a hairline |
| glareRange, glareFactor | 30, 90 | 12, 30 | the directional highlight, quietened |
| shadowExpand, shadowFactor, shadowOffsetY | 25, 18, 10 | 30, 22, 14 | a softer, lower shadow |

Everything not listed is the clear material's value. To tune the look for one stage, pass the numbers you want in `params`; to change it for the whole library, edit the preset.

```tsx
<LiquixStage frosted params={{ blurRadius: 14, tint: { r: 255, g: 255, b: 255, a: 0.12 } }}>
  <LiquixCapsule>Lighter frost</LiquixCapsule>
</LiquixStage>
```

## Fallback

Without WebGL2, or after a lost context, a frosted stage's shapes fall back to a CSS approximation of their own: a blur, a saturation lift and a thin white veil under a hairline, with no refraction, dispersion, glare or stretching. Reduced transparency and increased contrast replace the veil with an opaque fill, as they do for clear glass.
