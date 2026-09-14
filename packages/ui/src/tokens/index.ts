/**
 * The single source of truth for every design token.
 * `bun run tokens` compiles this file into src/web/styles/tokens.css.
 * React Native reads it directly. Never edit tokens.css by hand.
 *
 * Semantic color names are shadcn's, on purpose: every agent already knows
 * them, and any shadcn or tweakcn theme drops straight in.
 */

export const schemes = {
  light: {
    background: 'oklch(0.985 0 0)',
    foreground: 'oklch(0.16 0 0)',
    card: 'oklch(1 0 0)',
    'card-foreground': 'oklch(0.16 0 0)',
    popover: 'oklch(1 0 0)',
    'popover-foreground': 'oklch(0.16 0 0)',
    primary: '#245c46',
    'primary-foreground': 'oklch(0.99 0 0)',
    secondary: 'oklch(0.95 0 0)',
    'secondary-foreground': 'oklch(0.2 0 0)',
    muted: 'oklch(0.96 0 0)',
    'muted-foreground': 'oklch(0.5 0 0)',
    'foreground-tertiary': 'oklch(0.50 0 0)',
    'foreground-quaternary': 'oklch(0.76 0 0)',
    accent: 'oklch(0.94 0.02 255)',
    'accent-foreground': 'oklch(0.2 0 0)',
    destructive: 'oklch(0.58 0.21 27)',
    'destructive-foreground': 'oklch(0.99 0 0)',
    border: 'oklch(0 0 0 / 10%)',
    input: 'oklch(0 0 0 / 12%)',
    ring: 'oklch(0.16 0 0)',

    // Scheme-level glass colors. appearance.css owns the current material recipes;
    // the legacy alpha/ramp tokens below remain for standalone Lens compatibility.
    'glass-tint-color': 'oklch(0.985 0.008 220)',
    'glass-min-alpha': '0.5',
    'glass-alpha-base': '0.98',
    'glass-alpha-range': '0.5',
    'glass-alpha-floor': '0.45',
    'glass-ramp-top': '0.01',
    'glass-ramp-bottom': '-0.01',
    'glass-fill': 'rgb(0 0 0 / 0.06)',
    'glass-fill-hover': 'rgb(0 0 0 / 0.1)',
    'glass-solid': 'oklch(0.975 0.004 220)',
    'glass-edge': 'rgb(0 0 0 / 0.08)',
    'glass-rim-top': 'rgb(255 255 255 / 0.5)',
    'glass-control-tint': 'black',
    'glass-control-rim': 'rgb(255 255 255 / 0.5)',
    'glass-brightness': '1',
    'glass-saturate': '180%',
  },
  dark: {
    background: 'oklch(0.13 0 0)',
    foreground: 'oklch(0.97 0 0)',
    card: 'oklch(0.17 0 0)',
    'card-foreground': 'oklch(0.97 0 0)',
    popover: 'oklch(0.19 0 0)',
    'popover-foreground': 'oklch(0.97 0 0)',
    primary: '#b5e2c6',
    'primary-foreground': 'oklch(0.13 0 0)',
    secondary: 'oklch(0.24 0 0)',
    'secondary-foreground': 'oklch(0.97 0 0)',
    muted: 'oklch(0.22 0 0)',
    'muted-foreground': 'oklch(0.66 0 0)',
    'foreground-tertiary': 'oklch(0.7 0 0)',
    'foreground-quaternary': 'oklch(0.42 0 0)',
    accent: 'oklch(0.26 0.02 255)',
    'accent-foreground': 'oklch(0.97 0 0)',
    destructive: 'oklch(0.66 0.19 25)',
    'destructive-foreground': 'oklch(0.13 0 0)',
    border: 'oklch(1 0 0 / 12%)',
    input: 'oklch(1 0 0 / 14%)',
    ring: 'oklch(0.97 0 0)',

    // Dark neutral glass needs a denser floor against bright, unknown backgrounds.
    'glass-tint-color': 'oklch(0.22 0 0)',
    'glass-min-alpha': '0.66',
    'glass-alpha-base': '0.98',
    'glass-alpha-range': '0.5',
    'glass-alpha-floor': '0.45',
    'glass-ramp-top': '-0.01',
    'glass-ramp-bottom': '0.01',
    'glass-fill': 'rgb(255 255 255 / 0.08)',
    'glass-fill-hover': 'rgb(255 255 255 / 0.14)',
    'glass-solid': 'oklch(0.22 0 0)',
    'glass-edge': 'rgb(255 255 255 / 0.08)',
    'glass-rim-top': 'rgb(255 255 255 / 0.1)',
    'glass-control-tint': 'black',
    'glass-control-rim': 'rgb(255 255 255 / 0.14)',
    'glass-brightness': '1',
    'glass-saturate': '180%',
  },
} as const;

/** Scheme-independent tokens. */
export const shared = {
  // The accent enters components through these derivations and nothing else. Alphas come
  // from Tailwind's opacity modifiers (bg-primary/12), so no alpha tokens are needed here.
  'primary-hi': 'color-mix(in oklab, var(--primary) 55%, white)',
  'primary-lo': 'color-mix(in oklab, var(--primary) 80%, black)',

  // Geometry, shape by role: capsule = action, 6 = chip, 8 = field and dense control,
  // 12 = popover and card, 16 = dialog and panel. Children stay concentric: inner = outer - inset.
  'radius-xs': '4px',
  'radius-sm': '6px',
  'radius-md': '8px',
  'radius-lg': '12px',
  'radius-xl': '16px',
  'radius-2xl': '20px',
  'radius-dialog': '26px',
  'radius-full': '9999px',
  'radius-control': 'var(--radius-full)',
  'radius-field': 'var(--radius-md)',
  'radius-surface': 'var(--radius-xl)',
  // One device pixel. The only elevation primitive besides the material itself.
  hairline: '1px',

  // One clarity scalar. Floors reduce contrast risk; arbitrary brand/background
  // combinations still require contrast testing and are not guaranteed accessible.
  'glass-intensity': '0.5',
  'glass-blur': '40px',
  'glass-contrast': '1',

  // Motion. Exit is faster than enter. Reduced motion sets --motion-scale to 0 and every
  // translate collapses to a crossfade.
  'duration-fast': '100ms',
  'duration-base': '150ms',
  'duration-slow': '200ms',
  // Apple's and Discord's curves: a fast ease-out for entrances, a sharp ease-in for exits.
  'ease-snappy': 'cubic-bezier(0.2, 0, 0, 1)',
  'ease-out-quint': 'cubic-bezier(0.2, 0, 0, 1)',
  'ease-in-cubic': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-out-cubic': 'cubic-bezier(0.2, 0, 0, 1)',
  'ease-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'motion-scale': '1',

  // Type. System font first: SF on Apple, Segoe on Windows, Adwaita on GNOME. Nothing bundled.
  'font-sans':
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI Variable', 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
  'font-mono':
    "ui-monospace, 'SF Mono', Menlo, 'Cascadia Mono', Consolas, 'Noto Sans Mono', monospace",
  // Body is 400. Control labels on filled capsules are the one place 500 earns its keep.
  'weight-control': '500',
} as const;

/** Density rewrites control heights and UI type. Desktop apps default to compact. */
export const densities = {
  compact: {
    'control-sm': '24px',
    'control-md': '28px',
    'control-lg': '32px',
    'text-ui': '13px',
    'text-ui-sm': '11px',
    'space-unit': '4px',
  },
  comfortable: {
    'control-sm': '32px',
    'control-md': '36px',
    'control-lg': '44px',
    'text-ui': '14px',
    'text-ui-sm': '12px',
    'space-unit': '4px',
  },
} as const;

export type SchemeName = keyof typeof schemes;
export type SchemeToken = keyof (typeof schemes)['light'];
export type SharedToken = keyof typeof shared;
export type DensityName = keyof typeof densities;
export type DensityToken = keyof (typeof densities)['compact'];

/** Tokens exposed to Tailwind as `bg-*`, `text-*`, `border-*` utilities. Glass internals stay CSS-only. */
export const tailwindColors: readonly (SchemeToken | 'primary-hi' | 'primary-lo')[] = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'foreground-tertiary',
  'foreground-quaternary',
  'primary-hi',
  'primary-lo',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
];
