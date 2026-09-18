import { LiquixCapsule, LiquixCircle, LiquixStage, PANEL_KINDS, Switch } from '@crumza/ui/web';
import type { LiquixScheme } from '@crumza/ui/web';
import { type ReactElement, useEffect, useState } from 'react';

// Generated patterns only, so the page carries no image assets: a checker shows
// how the edge bends straight lines, and the spectrum and bars make the
// per-channel dispersion visible.
const PANELS = [
  { kind: PANEL_KINDS.checker, label: 'Checker, refraction' },
  { kind: PANEL_KINDS.spectrum, label: 'Spectrum, dispersion' },
  { kind: PANEL_KINDS.bars, label: 'Bars, chromatic fringe' },
];

/** The docs page this frame sits in, when it is same-origin and there is one. */
function parentRoot(): HTMLElement | null {
  try {
    return window.parent !== window ? window.parent.document.documentElement : null;
  } catch {
    return null;
  }
}

/**
 * The scheme the glass draws for. ?scheme pins it; otherwise the frame follows
 * the docs page around it, live, so the site's theme switch re-inks the glass
 * in the example too. Standing alone it follows the system.
 */
function useScheme(): LiquixScheme {
  const pinned = new URLSearchParams(window.location.search).get('scheme');
  const [scheme, setScheme] = useState<LiquixScheme>(() =>
    pinned === 'light' || pinned === 'dark' ? pinned : 'dark',
  );
  useEffect(() => {
    if (pinned === 'light' || pinned === 'dark') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const root = parentRoot();
    const read = () => {
      const theme = root?.dataset['theme'];
      setScheme(theme === 'light' || theme === 'dark' ? theme : media.matches ? 'dark' : 'light');
    };
    read();
    media.addEventListener('change', read);
    const observer = root ? new MutationObserver(read) : null;
    observer?.observe(root as HTMLElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      media.removeEventListener('change', read);
      observer?.disconnect();
    };
  }, [pinned]);
  // The page's own controls (the switch) take the same theme as the glass.
  useEffect(() => {
    document.documentElement.dataset['theme'] = scheme;
  }, [scheme]);
  return scheme;
}

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
 * glass with nothing but the component in view. ?scheme pins light or dark;
 * without it the frame follows the docs page's theme.
 */
export function LiquixEmbed(): ReactElement {
  const query = new URLSearchParams(window.location.search);
  const shape = query.get('shape');
  const material = query.has('frosted');
  const [frosted, setFrosted] = useState(material);
  const scheme = useScheme();
  return (
    <>
      <LiquixStage panels={PANELS} frosted={frosted} scheme={scheme}>
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
