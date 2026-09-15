# Crumza

A small, considered React design system and Astro catalogue. Public packages:

- @crumza/ui: native React components, solid/frosted/liquid materials, scoped brand colors and radius.
- @crumza/ui/liquid: a refracting LiquidScene and ten liquid glass components with frosted, blur, glint, tint and radius controls.
- @crumza/blocks: four open-source starter compositions.

## Local development

```sh
bun install
bun run dev
bun run validate
```

Website: http://127.0.0.1:4325. Routes: /, /ui, /blocks, /templates, /pro and /docs/getting-started.

The website uses Inter with three sizes only: 12, 13 and 16px. No logo mark, oversized hero or autoplay audio. The top bar carries a sound toggle and a light and dark mode toggle; sounds are opt-in and synthesized locally.

## Layout

packages/ui contains components, tokens, CSS, docs and tests. packages/blocks contains starter blocks. apps/website is the Astro catalogue/docs. apps/playground is the independent keyboard regression harness.

Research and reference clones remain outside this public checkout. Premium source belongs in the separate private crumza/crumza-pro repository, never in this tree.

## Status

Development alpha. The current glass styling is still under visual review, not an approved final design. Packages have not been published and no production domain has been changed. Templates, subscription checkout, authenticated agent access and the AI website builder are explicitly previews or planned work, not functioning services.

See packages/ui/docs/testing.md for verification scope and release requirements. No claim of Apple-native optical parity, React Native support or WCAG certification.
