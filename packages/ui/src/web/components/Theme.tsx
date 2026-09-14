import type { ComponentProps, ReactElement } from 'react';
import { type AppearanceProps, type AppearanceStyle, appearanceStyle } from '../appearance';

export interface ColorPair {
  readonly background: string;
  readonly foreground: string;
}

export interface ThemeProps extends ComponentProps<'div'>, AppearanceProps {
  readonly scheme?: 'light' | 'dark' | undefined;
  readonly density?: 'compact' | 'comfortable' | undefined;
  readonly primary?: ColorPair | undefined;
  readonly secondary?: ColorPair | undefined;
  readonly reducedTransparency?: boolean | undefined;
}

/** A scoped theme that works in server rendering without a provider or hydration. */
export function Theme({
  material,
  intensity,
  radius,
  scheme,
  density,
  primary,
  secondary,
  reducedTransparency,
  style,
  ...props
}: ThemeProps): ReactElement {
  const variables: AppearanceStyle = appearanceStyle({ intensity, radius });
  if (primary) {
    variables['--primary'] = primary.background;
    variables['--primary-foreground'] = primary.foreground;
  }
  if (secondary) {
    variables['--secondary'] = secondary.background;
    variables['--secondary-foreground'] = secondary.foreground;
  }
  return (
    <div
      {...props}
      data-slot="theme"
      data-material={material}
      data-theme={scheme}
      data-density={density}
      data-transparency={reducedTransparency ? 'reduce' : undefined}
      style={{ ...variables, ...style }}
    />
  );
}
