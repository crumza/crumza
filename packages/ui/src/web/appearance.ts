import type { CSSProperties } from 'react';

export type Material = 'solid' | 'frosted' | 'liquid';
export type Tone = 'neutral' | 'primary' | 'secondary' | 'destructive';

export interface AppearanceProps {
  readonly material?: Material | undefined;
  /** Glass clarity from 0 (denser) to 1 (clearer). */
  readonly intensity?: number | undefined;
  /** Corner radius in CSS pixels. Omit to inherit the theme. */
  readonly radius?: number | undefined;
}

export interface AppearanceStyle extends CSSProperties {
  '--glass-intensity'?: number;
  '--radius-control'?: string;
  '--radius-field'?: string;
  '--radius-surface'?: string;
  '--radius-dialog'?: string;
  '--primary'?: string;
  '--primary-foreground'?: string;
  '--secondary'?: string;
  '--secondary-foreground'?: string;
}

export function appearanceStyle({ intensity, radius }: AppearanceProps): AppearanceStyle {
  const style: AppearanceStyle = {};
  if (intensity !== undefined && Number.isFinite(intensity)) {
    style['--glass-intensity'] = Math.max(0, Math.min(1, intensity));
  }
  if (radius !== undefined && Number.isFinite(radius)) {
    const value = `${Math.max(0, radius)}px`;
    style['--radius-control'] = value;
    style['--radius-field'] = value;
    style['--radius-surface'] = value;
    style['--radius-dialog'] = value;
    style.borderRadius = value;
  }
  return style;
}
