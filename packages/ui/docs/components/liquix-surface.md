# LiquixSurface

A surface that anything made of glass can be put on. The content is real DOM in a native scroll container, and the shader draws the glass on a canvas laid over it as a stencil: everything outside a shape is transparent, so the content stays clickable, selectable and findable.

```tsx
import { LiquixSurface, LiquixTabs, LiquixTabsShadow } from '@crumza/ui';

<LiquixSurface
  paint={paint}
  paintKey={active}
  paintKeys={['home', 'inbox']}
  className="h-full w-full rounded-[42px] bg-white"
  underlay={<LiquixTabsShadow width={width} />}
  overlay={<LiquixTabs tabs={tabs} active={active} onChange={setActive} width={width} />}
>
  <YourContent />
</LiquixSurface>
```

## The one thing to understand

The shader cannot see DOM. It paints on a canvas of its own, so anything meant to be refracted has to reach it as pixels. That is what `paint` is for: draw the same content the DOM shows into the 2D context you are handed, at the width you are given, and return its height in CSS px.

So the content exists twice, once as live DOM under the glass and once as a painting nobody sees. They have to agree, because they are seen together: the DOM around the glass, the painting inside it. If a heading moves in one and not the other, the text will not line up across the rim. Draw both from the same data and the same measurements.

## Props

| Prop | Default | Meaning |
| --- | --- | --- |
| paint | required | `(ctx, width, key) => height`. Draws the content for `key` and returns how tall it came out. Memoise it: a new function repaints every strip |
| paintKey | `default` | Which content is showing. Switching keys is a pointer swap on the GPU, so the switch costs no upload |
| paintKeys | `[paintKey]` | Every key to rasterise up front, so switching between them can animate |
| params | defaultLiquixSurfaceParams | Overrides merged over the surface defaults, a `Partial<LiquixParams>` |
| underlay | none | Rendered under the canvas, for anything that must sit beneath the glass, a drop shadow above all |
| overlay | none | Rendered over the canvas: the controls the glass is drawn for |
| className | none | Appended to the host, which is `relative overflow-hidden`. Give it a size |
| children | none | The scrollable content, under the glass and fully live |

Each `paintKeys` entry keeps its tiles on the GPU, and the content can be any height: the shader is handed the tiles around the scroll position. Painting happens again whenever `paint` or the surface's size changes, and a key switch starts the content at the top, the way remounting a scroll container would.

## Shapes and layers

Shapes register with the surface through `useLiquixBox(layer)`. It hands back a ref to hang on a transparent element, and a mutable entry whose shape the frame loop reads every frame, so a caller can animate a box for nothing. [LiquixTabs](/docs/components/liquix-tabs) is built on it.

The shader merges every shape in a pass into one distance field with `min()`, so a pill inside a bar would be swallowed by it: inside the bar, the bar is always the deeper shape. Shapes are therefore grouped by `layer` and drawn in separate passes, and each pass after the first refracts a copy of the canvas the one before it left behind. That is how a highlight comes to sit on a bar's glass rather than merge into it. At most six shapes are drawn per layer.

## Defaults, and what the shader gives up here

`defaultLiquixSurfaceParams` is `defaultLiquixParams` tuned for a bar over live content rather than a capsule over a backdrop. The bevel is 28px, so it reaches the centre of the default 56px bar and the whole bar is a lens with no flat interior; the backdrop stays sharp at the lip and only softens with depth (`blurEdge` off, `blurRadius` 4); and the tint is a light 14% white. The body dims over bright content (`overLight`), as on the stage, which is what keeps white labels legible over any picture. Two things are turned off:

- The shader's drop shadow. It is drawn into the backdrop pass as a darkening around the silhouette, and with everything outside the glass cut away it would survive only where the glass refracts it, as a dirty ring inside the rim. Put a CSS shadow in `underlay` instead.
- Overscroll physics. The container scrolls natively, so the glass does not react to hitting either end.

## Cost and fallback

One full-screen pass per layer with a shape on it, each frame. Without WebGL2, or after a lost context, the canvas is not drawn and every shape inside falls back to its own CSS approximation. The host carries `data-fallback` when that happens. The surface renders its markup on the server and measures itself on mount.

This is a preview: device-specific optical, motion and performance validation is outstanding.
