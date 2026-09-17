import { type CSSProperties, type ReactElement, useEffect, useRef, useState } from 'react';
import { Glass, type GlassProps } from '../components/Glass';
import { useGlassBackground } from './GlassBackground';
import { colorLightness } from './luminance';

/* The component context of the adaptive material: what kind of surface this
   is. Variant, scale, tint, glint and frost are the only public knobs. Each
   becomes one data attribute or one custom property that adaptive.css reads;
   the material does the arithmetic. */

export type GlassVariant = 'regular' | 'clear';
export type GlassScale = 'small' | 'medium' | 'large';

export interface AdaptiveGlassOptions {
  /** Regular: controls, chrome, panels. Clear: over images and video. */
  readonly variant?: GlassVariant | undefined;
  /** How far the surface may follow what is behind it. Small flips; large steadies. */
  readonly scale?: GlassScale | undefined;
  /** A CSS colour cast on the face. Bounded, so contrast logic still holds. */
  readonly tint?: string | undefined;
  /** Specular rim and bevel. Off leaves a hairline. Default on. */
  readonly glint?: boolean | undefined;
  /** More blur and body, the way a system material frosts. */
  readonly frosted?: boolean | undefined;
}

export interface AdaptiveGlassAttributes {
  readonly 'data-glass-adaptive': '';
  readonly 'data-glass-variant'?: GlassVariant;
  readonly 'data-glass-scale'?: GlassScale;
  readonly 'data-glass-glint'?: '0';
  readonly 'data-glass-frosted'?: '';
  readonly style?: CSSProperties;
}

/** Bounded tint casts. Past this the surface is a brand pair, which is `tone`. */
const TINT_AMOUNT: Readonly<Record<GlassVariant, number>> = { regular: 0.34, clear: 0.22 };

/**
 * Attributes for any existing surface (Button, DialogContent, MenuContent,
 * Glass). Spread them, and the surface joins the adaptive material without a
 * change to the component.
 */
export function adaptiveGlass(options: AdaptiveGlassOptions = {}): AdaptiveGlassAttributes {
  const { variant, scale, tint, glint, frosted } = options;
  const out: {
    -readonly [K in keyof AdaptiveGlassAttributes]: AdaptiveGlassAttributes[K];
  } = { 'data-glass-adaptive': '' };
  if (variant) out['data-glass-variant'] = variant;
  if (scale) out['data-glass-scale'] = scale;
  if (glint === false) out['data-glass-glint'] = '0';
  if (frosted) out['data-glass-frosted'] = '';
  if (tint) {
    const style: Record<string, string | number> = {
      '--glass-tint': tint,
      '--glass-tint-amount': TINT_AMOUNT[variant ?? 'regular'],
    };
    // The cast shifts the face's lightness, so the ink decision must see it.
    const lightness = colorLightness(tint);
    if (lightness !== undefined) style['--glass-tint-luminance'] = Number(lightness.toFixed(3));
    out.style = style as CSSProperties;
  }
  return out;
}

export interface AdaptiveGlassProps extends GlassProps, AdaptiveGlassOptions {
  /**
   * Read the image under this surface's own box, once per layout, when the
   * nearest GlassBackground has an image. For a surface over a picture with
   * a bright and a dark half. Off by default: the context's mean is enough
   * for almost everything and costs nothing per surface.
   */
  readonly sample?: boolean | undefined;
}

/** Glass that adapts. Same props as Glass, plus the five material knobs. */
export function AdaptiveGlass({
  variant,
  scale,
  tint,
  glint,
  frosted,
  sample = false,
  style,
  ref: forwardedRef,
  ...props
}: AdaptiveGlassProps): ReactElement {
  const background = useGlassBackground();
  const ref = useRef<HTMLDivElement | null>(null);
  const [local, setLocal] = useState<number | undefined>(undefined);
  // sampleRect is re-made when the image finishes loading, which is when there is something to read.
  const sampleRect = background?.sampleRect;

  useEffect(() => {
    const element = ref.current;
    if (!sample || !element || !sampleRect) return;
    const read = (): void => {
      const value = sampleRect(element.getBoundingClientRect());
      setLocal(value === undefined ? undefined : Number(value.toFixed(3)));
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(element);
    const host = background?.ref.current;
    if (host) observer.observe(host);
    return () => observer.disconnect();
  }, [sample, sampleRect, background?.ref]);

  const attributes = adaptiveGlass({ variant, scale, tint, glint, frosted });
  const vars: Record<string, string | number> = { ...(attributes.style as Record<string, string>) };
  if (local !== undefined) vars['--glass-backdrop-luminance'] = local;

  return (
    <Glass
      {...props}
      {...attributes}
      data-glass-sampled={local !== undefined ? '' : undefined}
      ref={(node) => {
        ref.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      style={{ ...(vars as CSSProperties), ...style }}
    />
  );
}
