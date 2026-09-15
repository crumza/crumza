# Third-party provenance

The implementation was migrated from the owner's Chamak work. Its MIT notice is preserved in LICENSE.

React is a peer dependency. tailwind-merge is the sole direct runtime helper; its installed MIT license remains with the dependency. Tailwind is required by the consuming build, not bundled as a component runtime.

Radix, shadcn, Base UI, Fluid Functionalism and UILIB were inspected as behaviour/design references. Their repositories are not copied into this public package. No UILIB or Fluid Functionalism code was copied during the Crumza migration.

The liquid glass set (src/liquid) draws fifteen small glyphs whose path data is taken from Lucide (ISC licence, Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT), all other copyright (c) for Lucide are held by Lucide Contributors 2022). They are inlined in src/liquid/core/icons.tsx so no icon runtime is a dependency. The Lucide licence text is at https://github.com/lucide-icons/lucide/blob/main/LICENSE. The website's four liquid scene images under apps/website/public/liquid are the owner's own assets and a generated gradient; no watermarked or stock-licensed preview image is bundled.

The website self-hosts Inter from @fontsource-variable/inter, under the SIL Open Font License included with that font package. No Apple fonts, symbols or copyrighted reference screenshots are bundled.

Do not vendor further source without reviewing the exact file's license and carrying its required notices. Historical research notes are not a substitute for an attribution audit before publication.
