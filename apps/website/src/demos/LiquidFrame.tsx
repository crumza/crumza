import { LiquidScene } from '@crumza/ui/liquid';
import { type ReactElement, type ReactNode, useState } from 'react';
import { defaultLiquidSettings, liquidBackdrops } from './liquid';
import { LiquidInspector } from './LiquidInspector';

/** A refracting stage above a docs page, with the five liquid knobs over it.
 *  The backdrop strip scrolls behind the component: wheel over the scene, or
 *  sweep it. */
export function LiquidFrame({
  children,
  height = 420,
}: {
  readonly children: (radius: number) => ReactNode;
  readonly height?: number;
}): ReactElement {
  const [settings, setSettings] = useState(defaultLiquidSettings);
  return (
    <>
      <LiquidInspector settings={settings} onChange={setSettings} layout="row" />
      <LiquidScene
        backdrops={liquidBackdrops}
        backdrop={settings.backdrop}
        onBackdropChange={(backdrop) => setSettings((current) => ({ ...current, backdrop }))}
        frosted={settings.frosted}
        blur={settings.blur}
        glint={settings.glint}
        tint={settings.tint}
        tintColor={settings.tintColor}
        className="liquid-stage"
        style={{ minHeight: height }}
        data-slot="demo-frame"
      >
        {children(settings.radius)}
      </LiquidScene>
    </>
  );
}
