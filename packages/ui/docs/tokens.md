# Tokens

One file, `src/tokens/index.ts`, is the source of truth. `bun run tokens` compiles it to
`src/web/styles/tokens.css`, which defines every custom property and maps them into Tailwind
through `@theme inline`. `bun run validate` fails if the generated file is stale.

## Why shadcn's names

Semantic color names are shadcn's (`--background`, `--foreground`, `--primary`, `--card`,
`--muted-foreground`, `--border`, `--ring` ...). Every agent already knows them, and any
shadcn-style color pairs can be adapted. Check all missing role tokens and contrast instead of assuming a theme drops in unchanged.

## Families

| Family | Tokens | Notes |
| --- | --- | --- |
| Surfaces | `background`, `card`, `popover`, `muted`, `secondary`, `accent` | each has a `-foreground` pair |
| Ink ramp | `foreground`, `muted-foreground`, `foreground-tertiary`, `foreground-quaternary` | four levels at one weight; this replaces bold |
| Accent | `primary`, `primary-foreground`, `primary-hi`, `primary-lo` | `-hi` and `-lo` are `color-mix` derivations; alphas via `bg-primary/12` |
| Danger | `destructive`, `destructive-foreground` | |
| Lines | `border`, `input`, `ring`, `hairline` | `--hairline` is 1px, 0.5px on 2x displays |
| Radius | `radius-xs` 4, `-sm` 6, `-md` 8, `-lg` 12, `-xl` 16, `-2xl` 20, `-dialog` 26, `-full` | shape by role, see below |
| Roles | `radius-control` (8), `radius-field` (8), `radius-surface` (16) | Theme radius overrides these |
| Material | `glass-intensity` plus private recipe variables in appearance.css | see [materials](/docs/material); old optical tokens are legacy |
| Motion | `duration-fast` 100ms, `-base` 150ms, `-slow` 200ms (exits at 0.66x), `ease-snappy` and `ease-out-cubic` `cubic-bezier(0.2,0,0,1)`, `ease-in-cubic` `cubic-bezier(0.4,0,1,1)`, `ease-standard`, `motion-scale` | `--motion-scale` is 0 under reduced motion |
| Type | `font-sans`, `font-mono`, `weight-control`, `text-ui`, `text-ui-sm` | system font first, nothing bundled |
| Density | `control-sm/md/lg`, `space-unit` | per `data-density` |

## Shape by role

Use role-based radius variables. Buttons default to 8px; shape="capsule" explicitly opts into
full rounding. Theme radius scopes all four corner roles; local surface radius wins.
Squircle corner support is an enhancement, not a browser requirement.

## Tailwind utilities you get

`bg-background`, `text-foreground`, `text-muted-foreground`, `text-foreground-tertiary`,
`bg-primary`, `text-primary-foreground`, `bg-primary/12`, `bg-card`, `border-border` or
`border-(--border)`, `bg-destructive`, `rounded-control`, `rounded-field`, `rounded-surface`,
`font-control`, `text-ui`, `text-ui-sm`, `ease-snappy`, `duration-(--duration-fast)`,
`h-(--control-md)`.

## Adding a token

Add it to `src/tokens/index.ts` in the right object (`schemes.light` and `schemes.dark` for
anything that changes with the scheme, `shared` otherwise, `densities` for dimensions), run
`bun run tokens`, and if Tailwind should see it, add the mapping line in
`scripts/build-tokens.ts`. Give it a one-line comment saying what it is for and when not to use
it: the token file is documentation for agents.
