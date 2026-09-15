# Getting started

Crumza is a configurable liquid-glass React UI library for Tailwind. The same components also support frosted and solid materials.

## Status and requirements

This is a local alpha, not a published npm release. React 19.2+, Tailwind CSS 4 and a modern browser are required. Native overlays require the Popover API, modal dialog, inert and modern CSS. Test your exact Safari, Chromium, Firefox or embedded-webview version before shipping. React Native is a future port, not a supported renderer today.

## Run this workspace

```sh
bun install
bun run dev
bun run validate
```

The Astro catalogue runs at http://127.0.0.1:4325. The independent component test harness uses another port.

## Use the package

After publication the install command will be `bun add @crumza/ui react react-dom`. Until then, build and pack the local package, or use the workspace dependency:

```json
{ "dependencies": { "@crumza/ui": "workspace:*" } }
```

Import the stylesheet after Tailwind. It registers component sources with Tailwind so utility classes used by the package are generated.

```css
@import 'tailwindcss';
@import '@crumza/ui/styles.css';
```

```tsx
import { Theme, Button, Card, Field, Input } from '@crumza/ui';

export function Project() {
  return (
    <Theme material="liquid" intensity={0.5} radius={24}>
      <Card className="grid gap-4 p-6">
        <Field label="Project name" htmlFor="project">
          <Input id="project" name="project" />
        </Field>
        <Button tone="primary">Save project</Button>
      </Card>
    </Theme>
  );
}
```

The example renders a UI; attach your own save action or form submission. Button defaults to type="button", so use type="submit" in a form.

## Astro

Use the React integration. Add `client:load` to an interactive React island such as a form, menu or dialog. Keep each compound component and its trigger/content in the same React island. Static Card, Theme and text do not need hydration.

## Distribution

The package builds ESM JavaScript and TypeScript declarations into dist. CSS and component source remain included for Tailwind source detection. Entries: @crumza/ui, @crumza/ui/web, @crumza/ui/liquid, @crumza/ui/core and @crumza/ui/tokens. The liquid entry holds the [refracting scene](/docs/liquid) and its components; its stylesheet is part of @crumza/ui/styles.css. Tokens and core are separate from browser rendering. Wrap interactive usage in a client boundary in React Server Component applications; that integration is not certified by this alpha.

## Accessibility

Always label controls. Use DialogTitle and DialogDescription with dialogs, aria-label on unnamed toolbars and icon-only controls, and explicit foreground/background brand pairs. Reduced motion, reduced transparency and forced colors have CSS fallbacks. These provisions are not a claim of WCAG certification.

Read [theming](/docs/theming), [materials](/docs/material), [Button](/docs/components/button) and [testing](/docs/testing) next.
