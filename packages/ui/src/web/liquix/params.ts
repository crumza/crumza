import type { ReactNode } from 'react';

/** Straight RGBA, 0..255 per channel and 0..1 alpha, the way the shader wants it. */
export interface LiquixTint {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

/**
 * Every knob the pipeline reads. Ranges match the reference studio, so a value
 * that looks right there looks the same here.
 */
export interface LiquixParams {
  /** Gap between the shapes the stage lays out, in pixels. */
  readonly rowGap: number;
  /** CSS px of bevel measured inwards from the silhouette. */
  readonly refThickness: number;
  readonly refDistance: number;
  /** Index of refraction. */
  readonly refFactor: number;
  /** Per-channel index spread. */
  readonly refDispersion: number;
  readonly fresnelRange: number;
  readonly fresnelHardness: number;
  readonly fresnelFactor: number;
  readonly glareRange: number;
  readonly glareHardness: number;
  readonly glareFactor: number;
  readonly glareConvergence: number;
  readonly glareOppositeFactor: number;
  /** Degrees. */
  readonly glareAngle: number;
  readonly blurRadius: number;
  /** True: the whole shape reads the blurred backdrop. */
  readonly blurEdge: boolean;
  /** Percent saturation of the backdrop seen through the glass. 100 leaves it
   *  as it is; a system material lifts it so colour survives blur and veil. */
  readonly saturation: number;
  /** Blur passes run at this fraction of canvas resolution. */
  readonly blurScale: number;
  /** Growth along the pull axis at full pull. */
  readonly pullStretch: number;
  /** Pinch across it, which is what reads as stretching. */
  readonly pullSquash: number;
  /** CSS px the row travels in the pull direction. */
  readonly pullShift: number;
  /** Px of absorbed scroll that counts as a full pull. */
  readonly pullSaturation: number;
  /** 0 settles flat, 1 rings for about two seconds. */
  readonly pullBounce: number;
  /** Percent dimming at full brightness behind. */
  readonly overLight: number;
  /** Backdrop luminance the transition centres on. */
  readonly overLightPoint: number;
  readonly tint: LiquixTint;
  readonly shadowExpand: number;
  readonly shadowFactor: number;
  readonly shadowOffsetX: number;
  readonly shadowOffsetY: number;
  /** 0 sdf, 1 normals, 2 edge factor, 3 blur mask, 4 finished glass. */
  readonly step: number;
}

/**
 * Default effect parameters.
 *
 * The body of the glass dims over a bright backdrop so light labels stay
 * legible; that is `overLight` and `overLightPoint`, measured per pixel from
 * the backdrop the stage owns, not from arbitrary page content behind it.
 */
export const defaultLiquixParams: LiquixParams = {
  rowGap: 30,
  refThickness: 20,
  refDistance: 0.05,
  refFactor: 1.4,
  refDispersion: 7,
  fresnelRange: 30,
  fresnelHardness: 20,
  fresnelFactor: 26,
  glareRange: 30,
  glareHardness: 20,
  glareFactor: 90,
  glareConvergence: 50,
  glareOppositeFactor: 80,
  glareAngle: -45,
  blurRadius: 8,
  blurEdge: true,
  saturation: 100,
  blurScale: 0.4,
  pullStretch: 0.05,
  pullSquash: 0.04,
  pullShift: 8,
  pullSaturation: 120,
  pullBounce: 0.8,
  overLight: 40,
  overLightPoint: 58,
  tint: { r: 255, g: 255, b: 255, a: 0 },
  shadowExpand: 25,
  shadowFactor: 18,
  shadowOffsetX: 0,
  shadowOffsetY: 10,
  step: 4,
};

/* LiquixFrosted
   ------------------------------------------------------------------------
   The frosted material, documented at docs/components/liquix-frosted.md. A
   stage with `frosted` set merges its `params` over this preset instead of
   over the defaults above. */

/**
 * The frosted material: the glass of the macOS Dock.
 *
 * The backdrop stays visible through it, its colour intact and its detail
 * softened rather than erased, lifted by a little milk rather than dimmed to a
 * slab; `overLight` still dims it where the backdrop is bright, a touch less
 * than clear glass does, so the white labels keep their contrast the way the
 * Dock greys over a white desktop. The bevel narrows to a few pixels with
 * almost no dispersion, because frost diffuses the light a clear edge would
 * bend, and the Fresnel and glare bands close down to the hairline a frosted
 * pane shows at its rim: a wide bevel here reads as a thick frame, and a dense
 * veil reads as paint, and a frosted pane must have neither. The overscroll
 * physics are the same glass; the shadow sits a little softer and lower.
 */
export const frostedLiquixParams: LiquixParams = {
  ...defaultLiquixParams,
  refThickness: 6,
  refDistance: 0.02,
  refDispersion: 1.5,
  fresnelRange: 12,
  fresnelHardness: 30,
  fresnelFactor: 24,
  glareRange: 12,
  glareFactor: 30,
  glareOppositeFactor: 40,
  blurRadius: 20,
  saturation: 125,
  overLight: 30,
  tint: { r: 255, g: 255, b: 255, a: 0.2 },
  shadowExpand: 30,
  shadowFactor: 22,
  shadowOffsetY: 14,
};

/** The colour scheme a stage draws for. Light glass carries dark ink, dark glass light ink. */
export type LiquixScheme = 'light' | 'dark';

/** The two materials, each in both schemes. */
export type LiquixMaterial = 'clear' | 'frosted';

/**
 * The material matrix. The defaults above are clear glass in the dark scheme,
 * the reference studio's look: no veil, white labels, and a dimming over
 * bright content that protects them. The other three follow from it.
 *
 * Light clear glass lifts a little white into the pane and needs far less
 * dimming, because its labels are dark and read best on a bright surface.
 * Light frosted glass is the Dock over a photo, the preset above. Dark frosted
 * glass is the Dock at night: the same softening blur under a smoke of near
 * black rather than milk, with white labels and the full dimming kept.
 */
export const LIQUIX_MATERIALS: Record<LiquixMaterial, Record<LiquixScheme, LiquixParams>> = {
  clear: {
    dark: defaultLiquixParams,
    light: {
      ...defaultLiquixParams,
      tint: { r: 255, g: 255, b: 255, a: 0.12 },
      overLight: 12,
    },
  },
  frosted: {
    light: frostedLiquixParams,
    dark: {
      ...frostedLiquixParams,
      tint: { r: 22, g: 24, b: 30, a: 0.32 },
      overLight: 40,
    },
  },
};

/** The base parameters for a material in a scheme; a stage merges its `params` over these. */
export function liquixMaterialParams(frosted: boolean, scheme: LiquixScheme): LiquixParams {
  return LIQUIX_MATERIALS[frosted ? 'frosted' : 'clear'][scheme];
}

/** What a backdrop panel draws. Patterns make refraction and dispersion easy to read. */
export const PANEL_KINDS = {
  image: 0,
  checker: 1,
  spectrum: 2,
  bars: 3,
} as const;

export type PanelKind = (typeof PANEL_KINDS)[keyof typeof PANEL_KINDS];

export interface LiquixPanel {
  readonly kind?: PanelKind | undefined;
  /** Image URL, for kind image. */
  readonly src?: string | undefined;
  /** Caption drawn in the corner of the panel. */
  readonly label?: string | undefined;
  /** DOM that scrolls with the panel, behind the glass. */
  readonly content?: ReactNode | undefined;
}

export const defaultLiquixPanels: readonly LiquixPanel[] = [
  { kind: PANEL_KINDS.image, label: 'Photograph' },
  { kind: PANEL_KINDS.checker, label: 'Checker, refraction' },
  { kind: PANEL_KINDS.spectrum, label: 'Spectrum, dispersion' },
  { kind: PANEL_KINDS.bars, label: 'Bars, chromatic fringe' },
];

/**
 * Effect parameters for a LiquixSurface, whose glass sits over live DOM rather
 * than over a backdrop the host owns.
 *
 * The tint is dark, and the glass dims itself further over bright content,
 * so the white labels LiquixTabs draws stay legible over any picture, a pale
 * sky as much as dark trees, without turning the glass frosted. Overscroll
 * physics are
 * off because the container scrolls natively. The drop shadow is off by
 * default: a surface draws it as alpha outside the glass, per shape, which a
 * lifted shape asks for through its entry, and a bar that never lifts wears a
 * CSS shadow on an element under the canvas instead.
 */
export const defaultLiquixSurfaceParams: LiquixParams = {
  ...defaultLiquixParams,
  // The material the way Apple's Liquid Glass behaves: the body of a pane is a
  // lightly blurred, lightly tinted view of what is behind it, and the bending
  // lives in a rim a few pixels deep, where the backdrop is sharp at the lip
  // and the specular highlights ride. A shape that wants a deeper lens, a
  // lifted pill say, asks for it through its entry's bevel.
  refThickness: 10,
  refDispersion: 3,
  blurRadius: 6,
  blurEdge: false,
  tint: { r: 18, g: 22, b: 30, a: 0.45 },
  overLight: 50,
  pullStretch: 0,
  pullSquash: 0,
  pullShift: 0,
  shadowFactor: 0,
};
