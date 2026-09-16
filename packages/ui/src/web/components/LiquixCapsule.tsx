import type { ComponentProps, ReactElement } from 'react';
import { useMemo } from 'react';
import type { LiquixShape } from '../liquix/stage';
import { LiquixButtonBase } from './liquix-button';

export interface LiquixCapsuleProps extends Omit<ComponentProps<'button'>, 'style'> {
  /** CSS px. */
  readonly width?: number | undefined;
  /** CSS px. The corner radius is always half of it. */
  readonly height?: number | undefined;
  /** Superellipse exponent. 2 draws the true circular corner a capsule wants. */
  readonly roundness?: number | undefined;
}

const DEFAULTS = { width: 216, height: 92, roundness: 2 };

/**
 * A shader-drawn capsule: corner radius is half the height. The default shape
 * for text buttons, calls to action and pills.
 *
 * Render it inside a LiquixStage. Without one it falls back to CSS.
 */
export function LiquixCapsule({
  width,
  height,
  roundness,
  ...props
}: LiquixCapsuleProps): ReactElement {
  const shape = useMemo<LiquixShape>(() => {
    const box = height ?? DEFAULTS.height;
    return {
      width: width ?? DEFAULTS.width,
      height: box,
      cornerRadius: box / 2,
      roundness: roundness ?? DEFAULTS.roundness,
    };
  }, [width, height, roundness]);

  return <LiquixButtonBase {...props} shape={shape} slot="liquix-capsule" />;
}
