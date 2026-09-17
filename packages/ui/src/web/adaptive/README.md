# Adaptive Liquid Glass

A layer over the existing material. The same `Glass`, `Button`, `DialogContent`, `MenuContent` and `PopoverContent` render it; nothing in `appearance.css` or the components changed. The layer reads its environment through inherited custom properties and answers with a face and an ink. It is imported separately (`adaptive.css` after `crumza.css`, components from `src/web/adaptive`) while it is proven on the website's `/test` route.

## Why it exists

The shipped material picks the face from `--card` and the ink from `--foreground`, so Light and Dark mode alone decide what the glass looks like. A light-mode button over a dark photo is a white pane with dark text; the photo is what the user sees, and the text has nothing to stand on. Apple's Liquid Glass reads the content beneath it and flips small controls between light and dark treatments while large surfaces stay put and gain body instead. This layer does that with one material and one set of tokens, not a second theme.

## The layers, and why each one is separate

```text
appearance   the theme's assumption about the page
     +
background   what is actually behind the glass
     +
component    what kind of surface this is
     ↓
material     effective lightness, polarity, separation, dimming
     ↓
foreground   inks, and the theme's foreground family re-pointed
     ↓
accessibility  preferences replace one layer each
```

### 1. Appearance

`--glass-theme-luminance` is the only thing the theme contributes: `0.96` in light, `0.12` in dark. It is the fallback backdrop when nothing has declared one. The theme also names the two faces (`--glass-face-light`, `--glass-face-dark`) and the two inks (`--glass-ink-dark`, `--glass-ink-light`). There is no light glass recipe and no dark glass recipe.

Separate because: appearance is a guess about the page, and the material must be able to overrule a guess without a second stylesheet.

### 2. Background

`<GlassBackground>` publishes `--glass-backdrop-luminance`, a perceptual lightness from 0 to 1, for the region it wraps. Three ways to know it, cheapest first:

- declared: `luminance="dark"` or a number;
- derived: the colour stops of a `background` string, read once by a pure parser (`luminance.ts`), with the browser normalising any token the parser does not know;
- sampled: an `image` drawn once into a 24 by 24 canvas when it loads.

`<AdaptiveGlass sample>` may additionally read the image under its own box, once per layout through a ResizeObserver, for a pill over a picture with a bright half and a dark half. Nothing reads the screen and nothing runs per frame.

Separate because: the background is a fact about the region, not about the theme or the component, and the cheapest way to know it varies.

### 3. Component

Five knobs, each one attribute or property:

| Knob | Attribute or property | Effect |
| --- | --- | --- |
| `variant` regular, clear | `data-glass-variant` | translucency: `--glass-opacity`, `--glass-blur`, `--glass-saturate`, `--glass-smoke`, `--glass-dimming-gain` |
| `scale` small, medium, large | `data-glass-scale` | `--glass-adapt` (1, 0.7, 0.25) and `--glass-separation-gain` (0, 0.4, 1) |
| `tint` | `--glass-tint`, `--glass-tint-amount`, `--glass-tint-luminance` | a bounded cast on the face; its lightness enters the ink decision |
| `glint` | `data-glass-glint="0"` to turn off | rim, bevel and sheen through `--glass-glint` |
| `frosted` | `data-glass-frosted` | more blur and body, a hairline instead of a bevel |

Unlabelled surfaces default sensibly: a `.crumza-surface` control is small, a `.glass` pane is medium, overlays are medium.

Separate because: what a surface is does not change with the room it is in, and the same button must be small on every backdrop.

### 4. Material

On every top-level adaptive surface:

```text
L      = backdrop lightness, or the theme's
drift  = L - theme
Leff   = theme + drift * adapt              how far this surface follows the backdrop
separation = |drift| * separation-gain      what a steady surface converts into body
dimming = clamp((L - 0.6) * 1.5) * dimming-gain   clear glass over bright content
Lface  = mix(Leff, tint lightness, tint amount) * (1 - dimming * 0.35)
polarity     = clamp((Lface - 0.5) * 24 + 0.5)   face: 1 light, 0 dark, soft across the middle
ink polarity = clamp((Lface - 0.5) * 400 + 0.5)  ink: a hard step, never a grey ink on grey
ambiguity    = clamp(1 - |Lface - 0.5| * 3)      how close to the middle the backdrop sits
alpha  = opacity + frost + separation * 0.45 - (intensity - 0.5) * 0.36
smoke  = smoke + dimming * 0.22 + ambiguity * 0.12   ink-coloured haze
face   = mix(face-dark, face-light, polarity), cast by the tint
surface = color-mix(face alpha%, ink smoke%)
```

Small glass flips at the middle. Near the middle, where neither ink has much to stand on, the haze thickens so the face does the separating. Large glass barely moves its effective lightness, so it keeps the theme's ink, and the disagreement becomes alpha instead. Clear glass over bright content gains a veil (`dimming` raises the smoke) rather than turning opaque. `intensity`, the existing clarity knob, still moves alpha.

Separate because: this is the one place the numbers meet, so a change to the behaviour is a change to one rule.

### 5. Foreground

`--glass-foreground-primary`, `-secondary`, `-tertiary` and `-quaternary` are derived from the polarity. The theme's foreground family (`--foreground`, `--muted-foreground`, `--foreground-tertiary`, `--card`, `--muted`, `--border`, `--input`, `--ring`) is pointed at them on the surface and on the background context. Existing components use those tokens through Tailwind, so a Segment, Checkbox, Switch or Tab inside the glass follows without knowing about glass. Brand tones (`tone="primary"`) keep their supplied pairs.

Nested surfaces inherit their pane's polarity and inks and paint as fills. A button never flips against the card it sits in, and blur is never stacked.

Separate because: the ink is decided by the face it sits on, never by the theme, and the same rule must reach text the material did not render.

### 6. Accessibility

- Reduced transparency (`prefers-reduced-transparency`, `data-transparency="reduce"`): alpha 0.97, no blur, same polarity.
- More contrast (`prefers-contrast: more`, `data-contrast="more"`): the soft step becomes a hard one, the face is nearly opaque, secondary inks rise to 82% and 66%.
- Reduced motion: the material's transitions are `220ms * var(--motion-scale)`, which the token layer zeroes.
- Forced colours: `appearance.css` paints Canvas and CanvasText; this layer hands its remapped tokens to the system colours.
- No backdrop filter: alpha 0.94.

Separate because: each preference replaces one layer and leaves the rest, so a reduced-transparency user still gets the polarity that makes the text readable.

## Motion

Only `background-color`, `color`, `border-color`, `box-shadow` and `backdrop-filter` transition, at 220 to 260ms on the standard curve. Overlays keep their own discrete enter and exit transitions. Nothing scales, bounces or moves.

## Using it

```tsx
import { AdaptiveGlass, adaptiveGlass, GlassBackground } from '@crumza/ui/web/adaptive';

<GlassBackground image="/photo.jpg">
  <Button {...adaptiveGlass({ scale: 'small' })}>Share</Button>
  <AdaptiveGlass scale="large" tint="oklch(0.62 0.19 255)" glint frosted>
    …
  </AdaptiveGlass>
</GlassBackground>
```

`adaptiveGlass()` returns attributes for any existing surface. `AdaptiveGlass` is `Glass` plus the five knobs and `sample`. A surface outside any `GlassBackground` still adapts, to the theme's assumption.

## Not done here

- The liquid engine (`LiquidScene`, `LiquidSurface`) keeps its own `frosted`, `blur`, `glint`, `tint` and `tintColor` knobs and paints white ink. Feeding it the context's polarity (white milk over dark, black smoke over bright) is the next integration and needs no change to the material rules.
- `Card` stays an opaque content surface by design; a medium `AdaptiveGlass` is the glass card.
- Gradient backgrounds are estimated from their stops, not painted and sampled.
