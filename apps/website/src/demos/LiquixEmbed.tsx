import { LiquixCapsule, LiquixCircle, LiquixStage, PANEL_KINDS } from '@crumza/ui/web';
import type { ReactElement } from 'react';

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
 */
export function LiquixEmbed(): ReactElement {
  const shape = new URLSearchParams(window.location.search).get('shape');
  return (
    <LiquixStage panels={PANELS}>
      {shape !== 'circle' ? <LiquixCapsule title="Capsule">Liquid Glass</LiquixCapsule> : null}
      {shape !== 'capsule' ? (
        <LiquixCircle title="Circle" aria-label="Favourite">
          ★
        </LiquixCircle>
      ) : null}
    </LiquixStage>
  );
}
