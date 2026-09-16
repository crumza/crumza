import type { ComponentProps, ReactElement } from 'react';
import { useMemo } from 'react';
import type { LiquixShape } from '../liquix/stage';
import { LiquixButtonBase } from './liquix-button';

export interface LiquixCircleProps extends Omit<ComponentProps<'button'>, 'style'> {
  /** The side, in CSS px. The corner radius is always half of it. */
  readonly size?: number | undefined;
  /** Stands in for size when only one dimension is known. */
  readonly width?: number | undefined;
  /** Stands in for size and width when only the height is known. */
  readonly height?: number | undefined;
  /** Superellipse exponent. 2 draws the true circular corner a circle wants. */
  readonly roundness?: number | undefined;
}

const DEFAULTS = { size: 88, roundness: 2 };

/**
 * A shader-drawn circle: equal sides, radius half of one. The icon-only shape.
 *
 * Render it inside a LiquixStage. Without one it falls back to CSS.
 */
export function LiquixCircle({
  size,
  width,
  height,
  roundness,
  ...props
}: LiquixCircleProps): ReactElement {
  const shape = useMemo<LiquixShape>(() => {
    const side = size ?? width ?? height ?? DEFAULTS.size;
    return {
      width: side,
      height: side,
      cornerRadius: side / 2,
      roundness: roundness ?? DEFAULTS.roundness,
    };
  }, [size, width, height, roundness]);

  return <LiquixButtonBase {...props} shape={shape} slot="liquix-circle" />;
}
