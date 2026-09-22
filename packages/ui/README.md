# @crumza/ui

Configurable liquid-glass React components, built for Tailwind. Solid and frosted are alternatives. MIT licensed. Local alpha; not yet published.

```tsx
import { Theme, Button } from '@crumza/ui';

<Theme material="liquid" intensity={0.5} radius={24}>
  <Button tone="primary">Save changes</Button>
</Theme>
```

```css
@import 'tailwindcss';
@import '@crumza/ui/styles.css';
```

React 19.2+ and Tailwind 4 are required. Native dialogs, popovers and form controls keep the implementation small. No Radix, Base UI or animation runtime. The sole direct runtime helper is tailwind-merge; React is a peer.

A separate liquid entry, `@crumza/ui/liquid`, holds a refraction engine and twenty-one components (pricing card, testimonials, header, mobile nav, tab indicator, search, stepper, glass toggle, glass slider, colour picker, notification stack, context menu, dock menu, gallery, sheet, plus button, menu button, action pill, action dock, context toolbar, command palette). A `LiquidScene` owns a background image and every surface inside it bends a pixel-aligned clone of that image through a displacement map. Its options are deliberately few: a frosted toggle, blur, glint, tint and radius.

Material, brand color pairs and radius can be scoped with Theme; individual surfaces may override them. One clarity scalar controls glass. Liquid is the default. Text-heavy surfaces remain opaque and floating panels retain a high-opacity floor. Scene provides an optional owned backdrop for edge refraction on Button and Glass; arbitrary DOM refraction and Apple's automatic luminance adaptation are not implemented.

The package builds ESM and declarations; source remains included for Tailwind's scanner. React Native, AI generation, premium access and templates are future work, not implemented features of this package.

## Develop

From the public monorepo root: `bun install`, `bun run dev`, `bun run validate`. See docs/getting-started.md for the package and Astro setup, docs/theming.md for brand controls, and docs/testing.md for release gates.

No commit, package publication or production deployment has been made for this preview.
