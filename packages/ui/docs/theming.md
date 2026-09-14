# Theming and brands

Material, color and shape are independent. Theme scopes CSS variables without React context or hydration.

## Global configuration

```tsx
import { Theme, Button } from '@crumza/ui';

<Theme
  material="liquid"
  intensity={0.5}
  radius={12}
  scheme="light"
  density="comfortable"
  primary={{ background: '#245c46', foreground: '#ffffff' }}
  secondary={{ background: '#dddbed', foreground: '#302846' }}
>
  <Button tone="primary">Continue</Button>
  <Button variant="bordered">Cancel</Button>
  <Button material="solid" radius={4}>Local override</Button>
</Theme>
```

| Setting | Values | Behaviour |
| --- | --- | --- |
| material | solid, frosted, liquid | Liquid is the root default; nested scopes inherit |
| intensity | finite number 0..1 | One clarity control; higher is clearer, clamped |
| radius | finite nonnegative pixels | Control, field, surface and dialog corners |
| scheme | light, dark | Explicit scheme; omission inherits or follows system at root |
| density | compact, comfortable | Comfortable is the root default |
| primary / secondary | background + foreground CSS colors | Always provide both for a new brand |
| reducedTransparency | boolean | Forces opaque descendants |

Theme accepts native div attributes, className, style and children. Changing a scheme resets scheme tokens in that scope; repeat a custom color pair on a nested scheme scope when needed.

## CSS configuration

```css
[data-brand="forest"] {
  --primary: #245c46;
  --primary-foreground: #ffffff;
  --secondary: #dddbed;
  --secondary-foreground: #302846;
  --glass-intensity: 0.5;
  --radius-control: 8px;
}
```

Use data-material on a scope or supported surface, and data-theme / data-density on html if convenient. Intensity is the only optical scalar. Material is a named recipe, not another blur slider. Do not expose independent blur, glare and distortion controls as product settings.

## Local overrides

Button and Glass accept material, intensity and radius. DialogContent and PopoverContent accept the same appearance properties. Ordinary fields stay opaque for readability. Variant describes a button's treatment; tone describes its color role. A capsule shape explicitly chooses fully rounded corners.

## Contrast and international use

Color pairs are explicit. Crumza does not magically generate an accessible palette from an arbitrary brand hex. Test text at 4.5:1, large text at 3:1 and meaningful control boundaries at 3:1, including focus and worst-case glass backdrops. Those are WCAG thresholds, not a guarantee that any configuration passes.

Use logical layout properties, document lang and dir, labels that tolerate translation, native number/date input conventions and Intl in your application. Do not concatenate translated sentences or assume all names and addresses use Latin scripts. Test RTL, long German strings, Arabic, CJK, 200% zoom and forced colors.

The website intentionally uses only Inter 12/13/16px. That editorial constraint does not restrict a consuming application's typography scale.
