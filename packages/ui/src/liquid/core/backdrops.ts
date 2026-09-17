import type { CSSProperties } from 'react';

/* The liquix stage's generated backdrops, written as CSS.

   The liquix stage paints its panels in a fragment shader and samples them as
   textures. A liquid surface cannot read those pixels: it refracts a DOM clone
   of the scene, so its backdrop has to BE DOM. These are the same three panels
   expressed as CSS, matched value for value to proceduralPanel() in
   web/liquix/shaders.ts, so both stages show the same field: a checker for the
   bend at the rim, a spectrum for dispersion, bars for the chromatic fringe. */

/** The generated panels, as CSS background values. */
export const LIQUID_PATTERNS: Record<'checker' | 'spectrum' | 'bars', string> = {
  /** 22px checker on a 44px pitch: straight lines, so the bend at the rim reads. */
  checker: 'repeating-conic-gradient(#ffffff 0% 25%, #2e2e2e 0% 50%) 0 0 / 44px 44px',
  /** A hue sweep of 1.15 turns across the width, crossed with 65px value bands.
   *  The dark band is the same colour at half value, which is what the shader's
   *  mix(0.5, 1.0) does, so a flat 50% black over the sweep is exact. */
  spectrum: [
    'repeating-linear-gradient(180deg, rgb(0 0 0 / 0.5) 0 65px, rgb(0 0 0 / 0) 65px 130px)',
    'linear-gradient(90deg,' +
      ' hsl(0 100% 54%) 0%,' +
      ' hsl(60 100% 54%) 14.49%,' +
      ' hsl(120 100% 54%) 28.99%,' +
      ' hsl(180 100% 54%) 43.48%,' +
      ' hsl(240 100% 54%) 57.97%,' +
      ' hsl(300 100% 54%) 72.46%,' +
      ' hsl(360 100% 54%) 86.96%,' +
      ' hsl(54 100% 54%) 100%)',
  ].join(', '),
  /** 32px bars on a 64px pitch: the hardest edge in the set. */
  bars: 'repeating-linear-gradient(90deg, #0d0f14 0 32px, #f5f7ff 32px 64px)',
};

/** One panel of a scrolling scene: an image, or any CSS background value. */
export interface LiquidBackdrop {
  /** Image URL. */
  readonly src?: string | undefined;
  /** Any CSS background value, for a generated panel. Ignored when `src` is set. */
  readonly css?: string | undefined;
  /** Caption drawn in the corner, the way the liquix stage labels its panels. */
  readonly label?: string | undefined;
}

/** The three generated panels as a strip, in the order the liquix stage shows them. */
export const LIQUID_BACKDROPS: readonly LiquidBackdrop[] = [
  { css: LIQUID_PATTERNS.checker, label: 'Checker, refraction' },
  { css: LIQUID_PATTERNS.spectrum, label: 'Spectrum, dispersion' },
  { css: LIQUID_PATTERNS.bars, label: 'Bars, chromatic fringe' },
];

/** What a panel paints. An image wins over a pattern; neither leaves the stage colour. */
export function liquidBackdropStyle(backdrop: LiquidBackdrop): CSSProperties {
  if (backdrop.src) return { backgroundImage: `url(${backdrop.src})` };
  if (backdrop.css) return { background: backdrop.css };
  return {};
}

/** Identity for a backdrop, so a strip can be keyed and versioned by what it paints. */
export const liquidBackdropKey = (backdrop: LiquidBackdrop): string =>
  backdrop.src ?? backdrop.css ?? backdrop.label ?? '';
