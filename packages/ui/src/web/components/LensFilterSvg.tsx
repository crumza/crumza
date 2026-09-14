import type { ReactElement } from 'react';

export interface LensFilterSvgProps {
  readonly id: string;
  readonly map: string;
  readonly scale: number;
  readonly dispersion: number;
}

/** The SVG filter that bends pixels through a displacement map, with optional chromatic dispersion. */
export function LensFilterSvg({ id, map, scale, dispersion }: LensFilterSvgProps): ReactElement {
  return (
    <svg className="lens-svg" aria-hidden="true">
      <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feImage href={map} preserveAspectRatio="none" result="map" />
        {dispersion > 0 ? (
          <>
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={scale * (1 - 0.12 * dispersion)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="r"
            />
            <feColorMatrix
              in="r"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="rr"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="g"
            />
            <feColorMatrix
              in="g"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="gg"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={scale * (1 + 0.16 * dispersion)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="b"
            />
            <feColorMatrix
              in="b"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="bb"
            />
            <feBlend in="rr" in2="gg" mode="screen" result="rg" />
            <feBlend in="rg" in2="bb" mode="screen" />
          </>
        ) : (
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        )}
      </filter>
    </svg>
  );
}
