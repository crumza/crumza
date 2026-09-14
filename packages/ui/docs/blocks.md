# Starter blocks

Four small server-renderable compositions live in @crumza/blocks. They use React, the UI tokens and a small stylesheet. No animation, icon or headless runtime.

## Setup

In this workspace use @crumza/blocks as a workspace dependency. The package is not published yet.

```css
@import 'tailwindcss';
@import '@crumza/ui/styles.css';
@import '@crumza/blocks/styles.css';
```

```tsx
import { HeroBlock, FeatureGrid, PricingBlock, FAQBlock } from '@crumza/blocks';
import { Button } from '@crumza/ui';

<HeroBlock
  eyebrow="For your next idea"
  heading="Make room for good work."
  description="A considered introduction."
  actions={<Button onClick={startProject}>Start a project</Button>}
/>
```

Supply your own startProject action. For navigation, pass a real anchor as actions.

## API

All blocks extend native section attributes. className, style, id and aria attributes are forwarded.

| Component | Required | Optional |
| --- | --- | --- |
| HeroBlock | heading, description | eyebrow, actions (ReactNode) |
| FeatureGrid | heading, items | Each item: unique id, title, description |
| PricingBlock | heading, price, features, action | cadence |
| FAQBlock | heading, items | Each item: unique id, question, answer (ReactNode) |

PricingBlock takes a display string such as "Free"; it does not implement checkout or currency conversion. FAQ uses native details/summary and needs no JavaScript. Headings are h2 with h3 feature titles, so compose under your page h1.

## Design

Blocks inherit the brand and corner tokens from Theme. Long-form block content stays opaque. Typography is deliberately modest; override through your application's classes when needed. There are no decorative icons.

## License and roadmap

These four blocks are MIT, including commercial use with attribution notices retained. Premium blocks and finished templates are not included and do not yet have an approved commercial license.
