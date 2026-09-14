# Working on Crumza

- Website typography uses only 12px, 13px and 16px. No large hero headline, logo mark or decorative icons. Use spacing and weight for hierarchy. Recent.design is the primary reference; Augen is secondary.
- Sound is optional, off by default, and only follows an explicit user interaction. No ambient audio or pointer-tracking animation.

- Public packages live in `packages/`; the Astro website and playground live in `apps/`.
- Preserve strict TypeScript, keyboard semantics, visible focus, reduced motion and reduced transparency.
- Crumza is a liquid-glass system first, not a solid UI kit with an optional glass demo. Liquid is the root and preview default; solid and frosted are explicit alternatives. Brand colors, radius and material are independent.
- Prefer native elements and CSS. No Radix or other headless runtime dependency without explicit approval.
- Never copy reference repositories, credentials, private business plans or Pro source into this public repository.
- Run `bun run validate` before delivery. Do not commit, push or publish packages without explicit approval.
- Examples and installation instructions must match real exports. Mark unimplemented product features as previews.
- Use `Bunmaska`, `Crumza` and `@crumza/ui` exactly. No em dashes in authored code or documentation.
