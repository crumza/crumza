import { type LiquidBackdrop, LiquidScene } from '@crumza/ui/liquid';
import { type ReactElement, useState } from 'react';
import { defaultLiquidSettings, liquidBackdrops } from '../demos/liquid';
import { LiquidInspector } from '../demos/LiquidInspector';
import { GlassSlider } from './GlassSlider';

/** The reference sits on a flat, light grey studio floor: the glass has only
 *  the rail and its own shadow to bend. The site's scenes follow, for the same
 *  lens over a picture. */
const studio: LiquidBackdrop = { css: '#c7c7cb', label: 'Studio' };
const backdrops: readonly LiquidBackdrop[] = [studio, ...liquidBackdrops];

/** The slider on a refracting stage, with the five liquid knobs over it. */
export function SliderStage(): ReactElement {
  const [settings, setSettings] = useState(defaultLiquidSettings);
  return (
    <div className="gs-page">
      <LiquidInspector
        settings={settings}
        onChange={setSettings}
        layout="row"
        backdrops={backdrops}
      />
      <LiquidScene
        backdrops={backdrops}
        backdrop={settings.backdrop}
        onBackdropChange={(backdrop) => setSettings((current) => ({ ...current, backdrop }))}
        frosted={settings.frosted}
        blur={settings.blur}
        glint={settings.glint}
        tint={settings.tint}
        tintColor={settings.tintColor}
        className="liquid-stage gs-stage"
      >
        <GlassSlider radius={settings.radius} defaultValue={60} aria-label="Volume" />
      </LiquidScene>
    </div>
  );
}
