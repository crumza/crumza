import { type ReactElement, useCallback, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  H,
  inner,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  LiquidSurface,
  pill,
} from '../core';

export interface LiquidGalleryImage {
  readonly src: string;
  readonly label: string;
  readonly meta: string;
}

export interface LiquidGalleryProps extends LiquidComponentProps {
  /** The slides. Any image URL works; the frame is a fixed 344 by 208 box. */
  readonly images: readonly LiquidGalleryImage[];
}

/**
 * A glass-framed gallery with a thumbnail rail.
 *
 * Images crossfade in place rather than sliding: a slide would need the frame
 * to clip a track wider than itself, and the material's own rim already reads
 * as the edge of the picture. Every slide is absolutely positioned in the same
 * box and opacity is the only thing that changes, which also means the frame's
 * displacement map is built exactly once.
 */
export function LiquidGallery({
  images,
  radius = LIQUID_RADIUS,
}: LiquidGalleryProps): ReactElement {
  const [index, setIndex] = useState(0);
  const r = pill(H.frame, radius);
  const current = images[index];

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + images.length) % images.length),
    [images.length],
  );

  return (
    <LiquidSurface
      radius={r}
      data-slot="liquid-gallery"
      className="lqc-gallery"
      contentClassName="lq-content-interactive lqc-gallery-content"
      role="group"
      aria-roledescription="carousel"
      aria-label="Scenes"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(-1);
        if (e.key === 'ArrowRight') go(1);
      }}
      style={{ '--lq-inner-r': `${inner(r, 10)}px` }}
    >
      <div className="lqc-gallery-stage">
        {images.map((shot, i) => (
          <span
            key={shot.label}
            className="lqc-gallery-slide"
            data-shown={i === index || undefined}
            // aria-hidden keeps the faded-out slides out of the a11y tree,
            // so the frame reads as one image rather than several
            aria-hidden={i !== index}
            role="img"
            aria-label={`${i + 1} of ${images.length}: ${shot.label}`}
            style={{ backgroundImage: `url(${shot.src})` }}
          />
        ))}

        {/* caption sits over the image, under its own gradient scrim so the
              text survives a bright frame */}
        <span className="lqc-gallery-caption">
          <strong>{current?.label}</strong>
          <span>{current?.meta}</span>
        </span>

        <button
          type="button"
          className="lqc-gallery-nav is-prev"
          aria-label="Previous scene"
          onClick={() => go(-1)}
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          className="lqc-gallery-nav is-next"
          aria-label="Next scene"
          onClick={() => go(1)}
        >
          <ChevronRight />
        </button>
      </div>

      <div className="lqc-gallery-rail" role="tablist" aria-label="Choose scene">
        {images.map((shot, i) => (
          <button
            key={shot.label}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={shot.label}
            className={`lqc-gallery-thumb ${i === index ? 'is-active' : ''}`}
            style={{ backgroundImage: `url(${shot.src})` }}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </LiquidSurface>
  );
}
