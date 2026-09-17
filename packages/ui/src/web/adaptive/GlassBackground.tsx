import {
  type ComponentProps,
  type Context,
  type CSSProperties,
  createContext,
  type ReactElement,
  type RefObject,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  estimateLuminance,
  type LuminanceBand,
  luminanceBand,
  meanLightness,
  parseColor,
  type Rgba,
} from './luminance';

/* <GlassBackground>: the background context of the adaptive material.

   It is the second input after the theme. The theme says what the page is
   probably like; this says what is actually behind the glass, for the region
   it wraps. Every adaptive surface inside reads one inherited number,
   --glass-backdrop-luminance, and the CSS does the rest.

   Three ways to know the number, cheapest first:
   1. declared: luminance="dark", or a number 0..1;
   2. derived: the colour stops of the `background` string, read once;
   3. sampled: an `image` drawn once into a 24 by 24 canvas when it loads.
   Nothing samples the live screen and nothing runs per frame. */

/** Sampled image pixels, small enough to average a region in microseconds. */
interface Sample {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  /** natural image size, for the cover mapping */
  readonly imageWidth: number;
  readonly imageHeight: number;
}

export interface GlassBackgroundContextValue {
  /** Perceptual lightness of the backdrop, 0..1, or undefined while unknown. */
  readonly luminance: number | undefined;
  readonly band: LuminanceBand | undefined;
  readonly ref: RefObject<HTMLDivElement | null>;
  /** Mean lightness of the image under an element, or undefined without an image. */
  readonly sampleRect: (rect: DOMRectReadOnly) => number | undefined;
}

export const GlassBackgroundContext: Context<GlassBackgroundContextValue | null> =
  createContext<GlassBackgroundContextValue | null>(null);

/** The nearest background context, or null outside one. */
export function useGlassBackground(): GlassBackgroundContextValue | null {
  return useContext(GlassBackgroundContext);
}

export interface GlassBackgroundProps extends ComponentProps<'div'> {
  /** What is behind the glass: a band, or a lightness 0..1. Wins over estimates. */
  readonly luminance?: 'light' | 'dark' | number | undefined;
  /** A CSS background (colour, gradient list). Painted, and its stops are read for the estimate. */
  readonly background?: string | undefined;
  /** An image URL. Painted with cover and sampled once on load. */
  readonly image?: string | undefined;
}

const SAMPLE = 24;

/** Browser colour normalisation for tokens the pure parser does not know. */
function browserColor(token: string): Rgba | undefined {
  const parsed = parseColor(token);
  if (parsed) return parsed;
  if (typeof document === 'undefined') return undefined;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return undefined;
  ctx.fillStyle = '#010203';
  ctx.fillStyle = token;
  const normalised = String(ctx.fillStyle);
  return normalised === '#010203' ? undefined : parseColor(normalised);
}

function loadSample(src: string, onDone: (sample: Sample | undefined) => void): () => void {
  let cancelled = false;
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.decoding = 'async';
  image.onload = () => {
    if (cancelled) return;
    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE;
    canvas.height = SAMPLE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return onDone(undefined);
    try {
      ctx.drawImage(image, 0, 0, SAMPLE, SAMPLE);
      onDone({
        data: ctx.getImageData(0, 0, SAMPLE, SAMPLE).data,
        width: SAMPLE,
        height: SAMPLE,
        imageWidth: image.naturalWidth,
        imageHeight: image.naturalHeight,
      });
    } catch {
      /* Cross-origin without CORS: the material falls back to the theme. */
      onDone(undefined);
    }
  };
  image.onerror = () => {
    if (!cancelled) onDone(undefined);
  };
  image.src = src;
  return () => {
    cancelled = true;
  };
}

/**
 * The background context. Renders a div that paints the background and
 * publishes its lightness to every adaptive surface inside.
 */
export function GlassBackground({
  luminance,
  background,
  image,
  style,
  children,
  ref: forwardedRef,
  ...props
}: GlassBackgroundProps): ReactElement {
  const ref = useRef<HTMLDivElement | null>(null);
  const [sample, setSample] = useState<Sample | undefined>(undefined);
  const [browserEstimate, setBrowserEstimate] = useState<number | undefined>(undefined);

  // Declared wins; then the stops of the background; the image comes in by effect.
  const declared =
    luminance === 'light'
      ? 0.95
      : luminance === 'dark'
        ? 0.1
        : typeof luminance === 'number' && Number.isFinite(luminance)
          ? Math.max(0, Math.min(1, luminance))
          : undefined;
  const derived = useMemo(
    () => (declared === undefined && background ? estimateLuminance(background) : undefined),
    [declared, background],
  );

  useEffect(() => {
    // A stop the pure parser skipped (lab(), a rare keyword) gets a second read in the browser.
    if (declared !== undefined || derived !== undefined || !background) return;
    setBrowserEstimate(estimateLuminance(background, browserColor));
  }, [declared, derived, background]);

  useEffect(() => {
    if (!image) {
      setSample(undefined);
      return;
    }
    return loadSample(image, setSample);
  }, [image]);

  const sampled = useMemo(() => (sample ? meanLightness(sample.data) : undefined), [sample]);
  const resolved = declared ?? derived ?? browserEstimate ?? sampled;
  const band = resolved === undefined ? undefined : luminanceBand(resolved);

  const value = useMemo<GlassBackgroundContextValue>(
    () => ({
      luminance: resolved,
      band,
      ref,
      sampleRect: (rect) => {
        const host = ref.current;
        if (!sample || !host) return undefined;
        // The image is painted with `cover`, centred: map the element's box back onto it.
        const box = host.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) return undefined;
        const scale = Math.max(box.width / sample.imageWidth, box.height / sample.imageHeight);
        const drawnW = sample.imageWidth * scale;
        const drawnH = sample.imageHeight * scale;
        const offsetX = (box.width - drawnW) / 2;
        const offsetY = (box.height - drawnH) / 2;
        const toCol = (x: number): number =>
          Math.max(
            0,
            Math.min(
              sample.width - 1,
              Math.floor(((x - box.left - offsetX) / drawnW) * sample.width),
            ),
          );
        const toRow = (y: number): number =>
          Math.max(
            0,
            Math.min(
              sample.height - 1,
              Math.floor(((y - box.top - offsetY) / drawnH) * sample.height),
            ),
          );
        const c0 = toCol(rect.left);
        const c1 = toCol(rect.right);
        const r0 = toRow(rect.top);
        const r1 = toRow(rect.bottom);
        let total = 0;
        let count = 0;
        for (let row = r0; row <= r1; row++) {
          const from = (row * sample.width + c0) * 4;
          const to = (row * sample.width + c1 + 1) * 4;
          const mean = meanLightness(sample.data, 4, from, to);
          if (mean !== undefined) {
            total += mean;
            count++;
          }
        }
        return count ? total / count : undefined;
      },
    }),
    [resolved, band, sample],
  );

  const vars: CSSProperties & Record<`--${string}`, string | number> = {};
  if (resolved !== undefined) vars['--glass-backdrop-luminance'] = Number(resolved.toFixed(3));
  if (background) vars.background = background;
  if (image) {
    vars.backgroundImage = `url("${image}")`;
    vars.backgroundSize = 'cover';
    vars.backgroundPosition = 'center';
  }

  return (
    <GlassBackgroundContext.Provider value={value}>
      <div
        {...props}
        ref={(node) => {
          ref.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        data-slot="glass-background"
        data-glass-adaptive=""
        data-glass-backdrop={band}
        style={{ ...vars, ...style }}
      >
        {children}
      </div>
    </GlassBackgroundContext.Provider>
  );
}
