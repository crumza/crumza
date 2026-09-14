# Testing

Use the validation gate from the monorepo root before handing off a change.

```sh
bun run validate
```

It verifies generated tokens, formatting, lint, strict TypeScript, unit tests, keyboard integration tests, package builds, block types and the Astro production site.

## What to test

- Controlled and uncontrolled state; disabled controls; native form behaviour.
- Tab, arrows, Home/End, Escape, typeahead and focus return.
- Dialog nesting, portalled overlays, focus-visible and visible labels.
- Solid, frosted and liquid with brand colors and both schemes.
- Reduced motion, reduced transparency, forced colors and high zoom.
- Long translated strings and RTL.
- Package tarball in an independent consumer, not only local source aliases.

## Evidence boundaries

Core, web and block packages check declaration libraries with skipLibCheck=false.
Only the development-tools config uses skipLibCheck=true: installed Bun 1.4.2
declarations reference missing Node util/TLS types. Application source remains
fully strict; this exception skips dependency declaration checks, not source checks.

The included automation currently exercises Chromium. It does not certify Safari, Firefox, WebKitGTK, WebView2, screen-reader behaviour, mobile devices or React Native. Use actual target devices before release. Historical research probes are not a current CI result.

The local package build emits JavaScript and declaration files. A successful Astro source build alone does not prove package exports; use the independent tarball smoke check recorded in the handoff.

## Release checklist

Complete manual browser and assistive-technology checks, confirm package-name ownership, review licensing, approve the design, run the full gate, install packed artifacts in a fresh app, and only then publish. No package publication or production deployment is part of this local preview.
