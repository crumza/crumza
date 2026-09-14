# Crumza website

The catalogue and docs site: Astro 6, React islands, MDX and Tailwind v4. It renders
`../../packages/ui/docs` directly and imports the UI and blocks from their package source.

```bash
bun run dev        # http://127.0.0.1:4325
bun run validate   # Astro check + build, from this directory
```

Install dependencies from the workspace root. Its `bun run validate` also runs package
tests, the website cache regression and the static link audit. Output is static HTML
and assets in `dist/`; running a build does not deploy to crumza.com.

## Preview hydration

Keep Vite dependency caches separate by `NODE_ENV`. Astro check/sync uses production
mode and previously overwrote a running development server's React JSX runtime.
The symptom was previews appearing in the initial HTML, then disappearing with
`jsxDEV is not a function` when React hydrated. The fix is in `astro.config.mjs`.

Run `bun run test:website` from the workspace root to check cache isolation. For the
browser regression, leave `bun run dev` running, run root `bun run validate`, reload
`/ui`, then click Save changes, filter Forms/All, change Material and open/close the
dialog. Also check `/` and `/docs/components/button`. Static HTML alone cannot verify
that the interactive previews survived hydration.
