import { useState, type ReactElement, type ReactNode } from "react";
import { Scene, Theme, type Material } from "@crumza/ui/web";
import { glassBackdrop } from "./backdrops";

/** A static optical backdrop. It makes translucency and the bent rim inspectable. */
export function Frame({
  children,
  tall = false,
}: {
  children: ReactNode;
  tall?: boolean;
}): ReactElement {
  const [material, setMaterial] = useState<Material>('liquid');
  const [intensity, setIntensity] = useState(0.5);
  const [radius, setRadius] = useState(24);
  return (
    <Theme material={material} intensity={intensity} radius={radius}>
      <div className="appearance-controls demo-controls">
        <label>Material<select value={material} onChange={event => setMaterial(event.target.value as Material)}>
          <option value="liquid">Liquid glass</option><option value="frosted">Frosted</option><option value="solid">Solid</option>
        </select></label>
        <label>Clarity<input type="range" min="0" max="1" step=".05" value={intensity} disabled={material === 'solid'} onChange={event => setIntensity(Number(event.target.value))} /><output>{Math.round(intensity * 100)}%</output></label>
        <label>Radius<input type="range" min="0" max="24" step="2" value={radius} onChange={event => setRadius(Number(event.target.value))} /><output>{radius}</output></label>
      </div>
      <Scene
        backdrop={glassBackdrop}
        className="demo-frame"
        style={tall ? { minHeight: 280 } : undefined}
        data-slot="demo-frame"
      >
        {children}
      </Scene>
    </Theme>
  );
}
