import { LiquixCapsule, LiquixCircle, LiquixStage, PANEL_KINDS, Switch } from '@crumza/ui/web';
import { type ReactElement, useState } from 'react';

// Generated patterns only, so the page carries no image assets: a checker shows
// how the edge bends straight lines, and the spectrum and bars make the
// per-channel dispersion visible.
const PANELS = [
  { kind: PANEL_KINDS.checker, label: 'Checker, refraction' },
  { kind: PANEL_KINDS.spectrum, label: 'Spectrum, dispersion' },
  { kind: PANEL_KINDS.bars, label: 'Bars, chromatic fringe' },
];

/**
 * The liquix demo, on a page of its own.
 *
 * The stage is fixed to the window and takes the page scroll for its backdrop,
 * so a docs page embeds this in an iframe rather than inline: inside the frame
 * the window is the example window, and scroll and overscroll are the demo.
 *
 * ?shape picks what the stage holds, so each docs page shows its own component
 * and the stage page shows what it is for: several shapes as one field.
 * ?frosted is the LiquixFrosted page: it opens on the frosted material and is
 * the one frame that carries the switch, so the component pages stay clear
 * glass with nothing but the component in view.
 */
export function LiquixEmbed(): ReactElement {
  const query = new URLSearchParams(window.location.search);
  const shape = query.get('shape');
  const material = query.has('frosted');
  const [frosted, setFrosted] = useState(material);
  return (
    <>
      <LiquixStage panels={PANELS} frosted={frosted}>
        {shape !== 'circle' ? <LiquixCapsule title="Capsule">Liquid Glass</LiquixCapsule> : null}
        {shape !== 'capsule' ? (
          <LiquixCircle title="Circle" aria-label="Favourite">
            ★
          </LiquixCircle>
        ) : null}
      </LiquixStage>
      {/* The material toggle, above the stage: the one knob the frosted page exposes. */}
      {material ? (
        <div className="fixed top-4 right-4 z-20 rounded-full bg-black/45 px-3.5 py-2 text-[13px] text-white/90 backdrop-blur-sm">
          <Switch label="Frosted" checked={frosted} onCheckedChange={setFrosted} />
        </div>
      ) : null}
    </>
  );
}
