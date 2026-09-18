import {
  LiquidGlassSlider,
  LiquidGlassToggle,
  LiquidMobileNav,
  LiquidNotificationStack,
  LiquidScene,
  LiquidSearch,
  LiquidStepper,
  LiquidTabIndicator,
} from '@crumza/ui/liquid';
import { type ReactElement, useState } from 'react';

/* A self-contained scene image, so the harness carries no binary asset. Broad
   colour fields with a hard diagonal edge are what make the rim's bend legible. */
const SCENE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">' +
    '<rect width="800" height="500" fill="#c9b7e6"/>' +
    '<path d="M0 0H800V500Z" fill="#4c78c8"/>' +
    '<circle cx="580" cy="150" r="90" fill="#f4e5c2"/>' +
    '<rect x="80" y="330" width="260" height="90" rx="12" fill="#2b2f4a"/>' +
    '</svg>',
)}`;

/** Three toggles: one to drive, one already on, one that cannot be. */
function Toggles(): ReactElement {
  const [wifi, setWifi] = useState(false);
  return (
    <div className="flex items-center gap-6">
      <LiquidGlassToggle aria-label="Wi-Fi" checked={wifi} onCheckedChange={setWifi} />
      <LiquidGlassToggle aria-label="Bluetooth" defaultChecked size="sm" />
      <LiquidGlassToggle aria-label="Airplane mode" disabled />
    </div>
  );
}

/** Seven liquid surfaces on their own stages, for the keyboard, gesture and engine e2e. */
export function LiquidPlayground(): ReactElement {
  return (
    <section aria-label="Liquid glass" className="grid gap-4">
      <span className="font-mono text-ui-sm uppercase tracking-[0.1em] text-muted-foreground">
        liquid glass: one engine, seven surfaces
      </span>
      <div className="grid gap-4 md:grid-cols-2">
        <LiquidScene background={SCENE} className="h-72 rounded-2xl">
          <LiquidStepper />
        </LiquidScene>
        <LiquidScene background={SCENE} frosted className="h-72 rounded-2xl">
          <LiquidTabIndicator />
        </LiquidScene>
        <LiquidScene background={SCENE} className="h-80 rounded-2xl md:col-span-2">
          <LiquidSearch />
        </LiquidScene>
        <LiquidScene background={SCENE} className="h-[440px] rounded-2xl md:col-span-2">
          <LiquidNotificationStack />
        </LiquidScene>
        <LiquidScene background={SCENE} className="h-72 rounded-2xl md:col-span-2">
          <LiquidMobileNav />
        </LiquidScene>
        <LiquidScene background={SCENE} className="h-56 rounded-2xl">
          <Toggles />
        </LiquidScene>
        <LiquidScene background={SCENE} frosted className="h-56 rounded-2xl">
          <LiquidGlassToggle aria-label="Frosted" defaultChecked />
        </LiquidScene>
        {/* A line of type runs under the rail, so the lens has something to carry
            and the probe has something to read through it. */}
        <LiquidScene
          background={SCENE}
          className="h-56 rounded-2xl md:col-span-2"
          sceneContent={
            <p className="absolute inset-x-0 top-1/2 m-0 -translate-y-1/2 text-center text-sm font-semibold tracking-wide text-white">
              Brightness follows the lens along the rail
            </p>
          }
        >
          <LiquidGlassSlider aria-label="Brightness" defaultValue={40} />
        </LiquidScene>
      </div>
    </section>
  );
}
