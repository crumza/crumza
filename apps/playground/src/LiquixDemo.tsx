import { LiquixCapsule, LiquixCircle, LiquixStage, PANEL_KINDS, Switch } from '@crumza/ui/web';
import { type ReactElement, useState } from 'react';

// Generated patterns only, so the demo carries no image assets: a checker shows
// how the edge bends straight lines, and the spectrum and bars make the
// per-channel dispersion visible.
const PANELS = [
  { kind: PANEL_KINDS.checker, label: 'Checker, refraction' },
  { kind: PANEL_KINDS.spectrum, label: 'Spectrum, dispersion' },
  { kind: PANEL_KINDS.bars, label: 'Bars, chromatic fringe' },
];

/** Scroll the page: the panels travel behind the glass, and overscroll pulls it.
 *  The switch in the corner frosts the glass. */
export function LiquixDemo(): ReactElement {
  const [frosted, setFrosted] = useState(false);
  return (
    <>
      <LiquixStage panels={PANELS} frosted={frosted}>
        <LiquixCapsule title="Capsule" className="text-base">
          Liquid Glass
        </LiquixCapsule>
        <LiquixCircle title="Circle" aria-label="Favourite" className="text-base">
          ★
        </LiquixCircle>
      </LiquixStage>
      <a
        href="#"
        className="fixed top-6 left-6 z-20 rounded-full bg-black/40 px-4 py-2 text-[13px] text-white/80 backdrop-blur-sm"
      >
        Back to the playground
      </a>
      <div className="fixed top-6 right-6 z-20 rounded-full bg-black/40 px-4 py-2 text-[13px] text-white/80 backdrop-blur-sm">
        <Switch label="Frosted" checked={frosted} onCheckedChange={setFrosted} />
      </div>
    </>
  );
}
