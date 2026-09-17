# LiquixStage

The host for the shader-drawn shapes. It owns a WebGL2 pipeline, the scrolling backdrop it refracts, and the overscroll physics.

```tsx
import { LiquixCapsule, LiquixCircle, LiquixStage, PANEL_KINDS } from '@crumza/ui';

<LiquixStage
  panels={[
    { kind: PANEL_KINDS.image, src: '/fjord.jpg', label: 'Fjord' },
    { kind: PANEL_KINDS.checker, label: 'Checker' },
  ]}
>
  <LiquixCapsule>Liquid Glass</LiquixCapsule>
  <LiquixCircle>★</LiquixCircle>
</LiquixStage>
```

## What it is, and what it is not

Refraction, dispersion and the blurred edge mask all re-sample the pixels behind the glass at an offset, per colour channel. CSS `backdrop-filter` cannot do that, so the stage draws the backdrop into the same pipeline and the glass samples it as a texture.

That is the trade. A shape bends the stage's own panels, not arbitrary live DOM behind it. Page content placed in a panel's `content` scrolls with the panel and is not itself refracted. This is a preview: device-specific optical, motion and performance validation is outstanding, and it is not a cross-engine guarantee.

The stage is fixed to the window (or to `frame`) and adds page scroll of one viewport per panel after the first. It is a full-page presentation surface, not a control you drop into a form.

## Props

| Prop | Default | Meaning |
| --- | --- | --- |
| panels | four sample panels | The backdrop strip, one viewport each, up to eight |
| frosted | false | The frosted material in place of clear glass; see [LiquixFrosted](/docs/components/liquix-frosted) |
| scheme | auto | `light` or `dark`; `auto` follows `data-theme` on the document, or the system preference, and keeps following it |
| params | the material's parameters | Overrides merged over the material's effect parameters |
| frame | none | A device-sized viewport centred in the page, scaled to fit but never up |
| className | none | Appended to the viewport element |

A panel is `{ kind, src, label, content }`. `kind` comes from `PANEL_KINDS`: `image`, `checker`, `spectrum`, `bars`. The generated patterns exist to make the optics readable: a checker shows how the edge bends straight lines, the spectrum and bars make per-channel dispersion visible.

At most six shapes are evaluated per stage, and at most eight panels are drawn.

## Light and dark

The glass paints its own backdrop, so the page theme cannot reach it by itself; the stage reads the scheme instead and draws for it. Dark glass, the reference look, carries white labels over a pane with no veil that dims itself over bright content. Light glass carries near-black labels, lifts a little white into the pane and barely dims, because dark ink reads best on a bright surface. Each material has a veil for each scheme: see [LiquixFrosted](/docs/components/liquix-frosted) for the frosted pair. The base parameters for all four are in `LIQUIX_MATERIALS`, and `liquixMaterialParams(frosted, scheme)` returns the one a stage starts from.

With `scheme` left on `auto` the stage follows `data-theme` on the document root, which is how the rest of Crumza is themed, and falls back to `prefers-color-scheme` when the root names no theme. It keeps following: switching the site's theme re-inks the glass without a remount. Server markup draws for the dark scheme until the client reads the document.

## Frosted

Clear glass is the resting material. `frosted` swaps every shape in the stage to the frosted material, the glass of the macOS Dock. Its look, its parameters and its fallback have a page of their own: [LiquixFrosted](/docs/components/liquix-frosted).

## Parameters

`params` is a partial `LiquixParams`, merged over `defaultLiquixParams`, or over `frostedLiquixParams` when the stage is frosted. Refraction: `refThickness`, `refDistance`, `refFactor`, `refDispersion`. Fresnel: `fresnelRange`, `fresnelHardness`, `fresnelFactor`. Glare: `glareRange`, `glareHardness`, `glareFactor`, `glareConvergence`, `glareOppositeFactor`, `glareAngle`. Blur mask: `blurRadius`, `blurEdge`, `blurScale`. Colour: `saturation`, in percent, of the backdrop seen through the glass. Overscroll: `pullStretch`, `pullSquash`, `pullShift`, `pullSaturation`, `pullBounce`. Backdrop adaptation: `overLight`, `overLightPoint`. Tint and shadow: `tint`, `shadowExpand`, `shadowFactor`, `shadowOffsetX`, `shadowOffsetY`. `step` selects the debug output: 0 sdf, 1 normals, 2 edge factor, 3 blur mask, 4 the finished glass.

## Fallback and motion

No WebGL2, or a lost context, and the stage stops drawing the canvas: panels become CSS gradients and every shape inside switches to its own CSS approximation. Under `prefers-reduced-motion: reduce` the overscroll pull is not banked at all and hover and press arrive at their size rather than easing there.

The stage renders nothing on the server beyond its markup; it measures the window on mount.
