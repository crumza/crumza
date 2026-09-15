# Working with @crumza/ui

- Import components from @crumza/ui or @crumza/ui/web. Import Tailwind then @crumza/ui/styles.css in the application stylesheet.
- Crumza is liquid glass first. Default material is liquid. Theme scopes material="solid|frosted|liquid", intensity 0..1, radius in pixels, color pairs, scheme and density. A local prop overrides the inherited setting.
- Button variants: solid, muted, bordered, ghost, link. Tone: neutral, primary, secondary, destructive. Legacy aliases remain supported; see docs.
- Keep documents and long text opaque. Glass is the default control/chrome material. Dialogs retain a high-opacity floor regardless of the clarity setting.
- CSS glass has directional edge highlights and a bevel. Button/Glass inside Scene use owned-background edge refraction. Do not claim arbitrary DOM refraction, native Apple rendering or automatic backdrop-luminance adaptation. Standalone Lens remains experimental.
- Prefer native platform semantics. No Radix, Base UI or motion runtime dependency. Do not invent a second theme/state framework.
- Label every input; use DialogTitle and DialogDescription with DialogContent. Use render={<Button />} on trigger/close parts to style a native button.
- The liquid glass set lives in src/liquid (core engine, components, styles) and is exported as @crumza/ui/liquid. It exposes only frosted, blur, glint, tint and radius; do not add optics knobs. Components keep their exact stylesheets in src/liquid/styles.
- Tokens are authored in src/tokens/index.ts. Regenerate tokens.css with bun run tokens. Never hand-edit generated CSS.
- Preserve strict TS including exact optional properties, checked index access and isolated declarations. Core must compile without DOM types.
- Public APIs need docs and tests. Run bun run validate from the monorepo root.
- Website scale is strictly 12/13/16px. No logo marks, decorative icons, display headlines, continuous animation or autoplay sound.
- Do not commit, push, publish or claim release readiness without the user's approval. Preserve third-party license notices.
