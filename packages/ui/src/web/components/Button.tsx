import type { ComponentProps, ReactElement } from 'react';
import { type AppearanceProps, type Tone, appearanceStyle } from '../appearance';
import { cn } from '../cn';
import { SurfaceOptics } from './surface-optics';

export type ButtonVariant =
  | 'solid'
  | 'muted'
  | 'bordered'
  | 'ghost'
  | 'link'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'glass'
  | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
export type ButtonShape = 'capsule' | 'rect';

export interface ButtonProps extends ComponentProps<'button'>, AppearanceProps {
  readonly variant?: ButtonVariant | undefined;
  readonly tone?: Tone | undefined;
  readonly size?: ButtonSize | undefined;
  readonly shape?: ButtonShape | undefined;
}

export function Button({
  className,
  variant = 'solid',
  tone,
  size = 'md',
  shape,
  material,
  intensity,
  radius,
  style,
  type = 'button',
  children,
  ...props
}: ButtonProps): ReactElement {
  const resolvedTone =
    tone ??
    (variant === 'primary' ? 'primary' : variant === 'destructive' ? 'destructive' : 'neutral');
  return (
    <button
      {...props}
      type={type}
      data-slot="button"
      data-variant={variant}
      data-tone={resolvedTone}
      data-size={size}
      data-shape={shape}
      data-material={material ?? (variant === 'glass' ? 'liquid' : undefined)}
      className={cn('crumza-button crumza-surface', className)}
      style={{ ...appearanceStyle({ intensity, radius }), ...style }}
    >
      <SurfaceOptics />
      {children}
    </button>
  );
}
