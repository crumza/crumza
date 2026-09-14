import type { ComponentProps, ReactElement } from 'react';
import { type AppearanceProps, type Tone, appearanceStyle } from '../appearance';
import { cn } from '../cn';
import { SurfaceOptics } from './surface-optics';

export interface GlassProps extends ComponentProps<'div'>, AppearanceProps {
  readonly interactive?: boolean | undefined;
  readonly tone?: Tone | undefined;
}

/** A material surface. Inherits its appearance from the nearest Theme. */
export function Glass({
  className,
  interactive = false,
  material,
  intensity,
  radius,
  tone = 'neutral',
  style,
  children,
  ...props
}: GlassProps): ReactElement {
  return (
    <div
      {...props}
      data-slot="glass"
      data-material={material}
      data-tone={tone}
      className={cn('glass', interactive && 'glass-interactive', className)}
      style={{ ...appearanceStyle({ intensity, radius }), ...style }}
    >
      <SurfaceOptics />
      {children}
    </div>
  );
}
