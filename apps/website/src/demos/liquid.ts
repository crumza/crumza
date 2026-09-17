import {
  LIQUID_OPTICS,
  LIQUID_PATTERNS,
  LIQUID_RADIUS,
  type LiquidBackdrop,
  type LiquidGalleryImage,
} from '@crumza/ui/liquid';

/**
 * The strip every liquid demo scrolls, the way the liquix stage scrolls its
 * panels: the site's own scenes first, then the three generated panels liquix
 * shows. The patterns are not decoration, they are the test: straight lines
 * show the bend at the rim, the spectrum shows dispersion, and the hard bars
 * show the chromatic fringe. Scroll the scene to carry one under the glass.
 */
export const liquidBackdrops: readonly LiquidBackdrop[] = [
  { label: 'Ambience', src: '/liquid/ambience.svg' },
  { label: 'Ridge', src: '/liquid/ridge.jpg' },
  { label: 'Bloom', src: '/liquid/bloom.png' },
  { label: 'Duotone', src: '/liquid/duotone.png' },
  { label: 'Checker, refraction', css: LIQUID_PATTERNS.checker },
  { label: 'Spectrum, dispersion', css: LIQUID_PATTERNS.spectrum },
  { label: 'Bars, chromatic fringe', css: LIQUID_PATTERNS.bars },
];

/** The gallery's slides. The site owns the assets; the component only receives URLs. */
export const liquidGalleryImages: readonly LiquidGalleryImage[] = [
  { src: '/liquid/ridge.jpg', label: 'Ridge', meta: 'Depth 60 · splay 2' },
  { src: '/liquid/bloom.png', label: 'Bloom', meta: 'Depth 120 · splay 16' },
  { src: '/liquid/duotone.png', label: 'Duotone', meta: 'Depth 120 · splay 16' },
  { src: '/liquid/ambience.svg', label: 'Ambience', meta: 'Depth 120 · splay 40' },
];

/** Everything the inspector can change: the five material knobs and the panel
 *  of the strip the scene is parked on. */
export interface LiquidSettings {
  readonly frosted: boolean;
  readonly blur: number;
  readonly glint: number;
  readonly tint: number;
  readonly tintColor: string;
  readonly radius: number;
  readonly backdrop: number;
}

export const defaultLiquidSettings: LiquidSettings = {
  frosted: false,
  blur: LIQUID_OPTICS.clear.blur,
  glint: LIQUID_OPTICS.clear.glint,
  tint: LIQUID_OPTICS.clear.tint,
  tintColor: LIQUID_OPTICS.clear.tintColor,
  radius: LIQUID_RADIUS,
  backdrop: 0,
};

/** The toggle is a material change, so blur and glint move to that material's resting values. */
export function withFrosted(settings: LiquidSettings, frosted: boolean): LiquidSettings {
  const optic = frosted ? LIQUID_OPTICS.frosted : LIQUID_OPTICS.clear;
  return { ...settings, frosted, blur: optic.blur, glint: optic.glint };
}

/** The usage a reader can paste, reflecting the current settings. */
export function liquidSnippet(component: string, settings: LiquidSettings): string {
  const props = [
    'backdrops={LIQUID_BACKDROPS}',
    settings.frosted ? 'frosted' : '',
    `blur={${settings.blur}}`,
    `glint={${settings.glint}}`,
    `tint={${settings.tint}} tintColor="${settings.tintColor}"`,
  ]
    .filter(Boolean)
    .join(' ');
  return `import { LIQUID_BACKDROPS, LiquidScene, ${component} } from '@crumza/ui/liquid';\n\n<LiquidScene ${props} className="h-[420px]">\n  <${component} radius={${settings.radius}} />\n</LiquidScene>`;
}
