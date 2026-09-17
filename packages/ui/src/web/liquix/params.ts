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
 * The tint is light, and the glass dims itself over bright content the way
 * the stage's does, so the white labels LiquixTabs draws stay legible over
 * any picture without turning the glass frosted. Overscroll physics are
 * off because the container scrolls natively. The shader's drop shadow is off
 * because it is drawn into the backdrop pass as a darkening around the
 * silhouette, and with everything outside the glass cut away it would survive
 * only where the glass refracts it, as a dirty ring inside the rim. A surface
 * wears a CSS shadow instead, on an element under the canvas.
 */
export const defaultLiquixSurfaceParams: LiquixParams = {
  ...defaultLiquixParams,
  // A bar is a lens, not a pane: the bevel reaches the centre of a 56px bar, so
  // there is no flat interior to read as frosted, the backdrop stays sharp at
  // the lip and only softens with depth, and the tint is light enough that
  // the picture behind still shows through the middle.
  refThickness: 28,
  blurRadius: 4,
  blurEdge: false,
  tint: { r: 255, g: 255, b: 255, a: 0.14 },
  pullStretch: 0,
  pullSquash: 0,
  pullShift: 0,
  shadowFactor: 0,
};
