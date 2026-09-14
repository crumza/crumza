# Liquid glass

Crumza is liquid glass first. Solid and frosted are explicit alternatives within the same component system, not separate button libraries.

## The material

The liquid recipe combines live backdrop blur and saturation, a translucent face, a directional rim, a fine inner bevel and soft elevation. Default controls are capsules; global and local radius overrides remain available.

Inside a `Scene`, Button and Glass also refract a copy of the supplied background in a narrow three-pixel edge band. The content and label are never filtered. The map is cached by shape and rebuilt when size or radius changes, not on every animation frame. No additional dependency or pointer-following loop is required.

```tsx
import { Scene, Theme, Button } from '@crumza/ui';

<Theme material="liquid" intensity={0.5} radius={24}>
  <Scene backdrop="linear-gradient(120deg, #a4bfda, #e8dfd0)" className="p-12">
    <Button>Liquid glass</Button>
    <Button tone="primary">Continue</Button>
    <Button material="solid" radius={8}>Opaque alternative</Button>
  </Scene>
</Theme>
```

Scene owns a CSS background image. It does not clone arbitrary text, video, forms or DOM. Without a Scene, buttons keep the portable CSS material but not scene refraction. Shape merging, native Apple luminance adaptation and device-motion lighting are not implemented. Continuously moving/transformed backgrounds are outside the automatic alignment contract; standalone Lens remains experimental.

## One clarity setting

`intensity` ranges from 0 (denser) to 1 (clearer). It is clamped; omitted values inherit. Material, brand color pairs and radius are independent settings. There are no separate public knobs for blur, bevel, glare or distortion on Button and Glass.

| Material | Face | Blur | Edge |
| --- | --- | --- | --- |
| Liquid, default | Clarity-dependent translucency | 10px, 160% saturation | Directional highlight, bevel, optional Scene refraction |
| Frosted | Denser, .90 to .74 alpha | 18px, 120% saturation | Quiet highlight; no refraction |
| Solid | Opaque | None | Modest border and soft shadow; no optics |

For liquid, starting alpha is `.70 - .46 * intensity`, then role and scheme floors apply. General light surfaces retain a .50 floor and dark surfaces .66. The website's controlled light optical test stages use .24; that is calibration for known backgrounds, not a universal setting. Brand-tinted buttons retain at least .84 alpha to protect their supplied label colors. They are deliberately more prominent than neutral glass.

Apple's user-facing Clear/Tinted preference is not the same as its developer-facing Regular/Clear variants. Crumza's numeric control is its own API, inspired by the preference rather than presented as an Apple API. [Apple iPhone guide](https://support.apple.com/en-ie/guide/iphone/iphd6804774e/ios)

## Hierarchy and readability

Keep documents, cards and editable fields opaque. Apply glass to controls and floating chrome; a glass toolbar should contain thin fills rather than another stack of blurred panes. This follows Apple's distinction between content and navigation layers. [Meet Liquid Glass, principles](https://developer.apple.com/videos/play/wwdc2025/219/?time=631)

Dialogs, menus, popovers and toasts retain at least .94 surface alpha in this web implementation. They still have the edge and elevation treatment; their words must not compete with content underneath. That floor is a conservative Crumza choice, not an Apple constant or universal contrast proof. Tooltips are opaque.

Brand colors must be supplied as foreground/background pairs. Check the actual backdrop, darkest and lightest content, focus state and translated labels. A translucent material cannot promise readable arbitrary color pairs. Use solid or reduced transparency when the background cannot be controlled.

## Motion and fallbacks

Glass overlays use short transform-only entrances. Buttons move by one pixel on press. No perpetual shimmer, animated blur, idle loop or pointer tracking runs in the normal material. Reduced motion removes transitions; reduced transparency and increased contrast remove refraction and force opaque fills. Forced colors uses system colors. Unsupported backdrop filters fall back to an opaque fill.

The default material is a web interpretation, not Apple's compositor. CSS backdrop filters affect available backdrop pixels; they do not reproduce all of Apple's optics and adaptation. [MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)

## Study references

- [Meet Liquid Glass, WWDC25](https://developer.apple.com/videos/play/wwdc2025/219/): dynamics at 1:29, adaptation at 6:00, principles at 10:31.
- [Applying Liquid Glass to custom views](https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views): Apple's shape, tint and morphing video examples.
- [Apple's design introduction](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/): official product imagery and material direction.
