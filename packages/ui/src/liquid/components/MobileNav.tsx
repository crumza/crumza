import { type PointerEvent, type ReactElement, useState } from 'react';
import {
  Bell,
  CircleUser,
  Compass,
  H,
  House,
  type IconComponent,
  inner,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  type LiquidCSS,
  LiquidSurface,
  pill,
  Search,
  useLiquidScene,
} from '../core';

interface Tab {
  readonly label: string;
  readonly Icon: IconComponent;
}

const TABS: readonly Tab[] = [
  { label: 'Home', Icon: House },
  { label: 'Explore', Icon: Compass },
  { label: 'Search', Icon: Search },
  { label: 'Inbox', Icon: Bell },
  { label: 'You', Icon: CircleUser },
];

/** Ms a pick takes end to end. Kept in step with lqc-dock-pop and the pane's
 *  two animations in mobile-nav.css. */
const PICK = 360;

/**
 * A dock at the foot of the scene, where a thumb can reach it.
 *
 * It answers on the way DOWN. A click arrives on release, which on a phone is
 * a hundred milliseconds after the finger landed and reads as the glass
 * chasing the touch rather than meeting it, so the pick is made on pointerdown
 * and the glass is already moving while the finger is still on it.
 *
 * The pane does not slide, it throws: it leaves on a curve that overshoots and
 * settles, and stretches along the way in proportion to how far it has to go,
 * the way a run of glass would. The glyph swells and drops back over the same
 * 360ms, so the two read as one movement rather than a sequence.
 *
 * There is no frame loop here at all. The pane is a transform on one element
 * and the pop is one keyframe on another, both of them above the glass rather
 * than inside the filtered part of it, so the compositor carries the animation
 * and a phone has nothing to keep up with.
 *
 * The chrome is the liquix stage's: its glyph shadow, its focus ring, and for
 * the pane the material liquix falls back to when it cannot run the shader.
 */
export function LiquidMobileNav({ radius = LIQUID_RADIUS }: LiquidComponentProps): ReactElement {
  const { pump } = useLiquidScene();
  // `from` is where the pane is leaving, so the throw can be drawn from there.
  // `tick` is what makes a second tap on the same item answer again: it re-keys
  // the pane and the glyph, and an element that has just mounted runs its
  // animations from the start.
  const [picked, setPicked] = useState({ at: 0, from: 0, tick: 0 });

  const r = pill(H.dock, radius);

  const choose = (at: number): void => {
    setPicked((last) => ({ at, from: last.at, tick: last.tick + 1 }));
    pump(PICK + 200); // the pane travels across the glass
  };

  /* Down, not up. A discrete event renders before the next paint, so the pane
     is already on its way by the time the finger has finished landing. */
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, at: number): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    choose(at);
  };

  return (
    <nav
      className="lqc-dock"
      data-slot="liquid-mobile-nav"
      aria-label="Sections"
      style={
        {
          '--at': picked.at,
          '--from': picked.from,
          '--dist': Math.abs(picked.at - picked.from),
          '--n': TABS.length,
        } as LiquidCSS
      }
    >
      <LiquidSurface
        radius={r}
        className="lqc-dock-bar"
        contentClassName="lq-content-interactive lqc-dock-content"
        style={{ '--lq-inner-r': `${inner(r, 8)}px` }}
      >
        {/* The glass behind the current glyph. One element that travels, not one
            per item: a pane per position would be a displacement map per
            position, and this is a plain surface for the same reason the tab
            indicator's blob is. */}
        <span key={picked.tick} className="lqc-dock-pane" aria-hidden="true" />

        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            className="lqc-dock-item"
            aria-current={picked.at === i ? 'page' : undefined}
            aria-label={tab.label}
            onPointerDown={(event) => onPointerDown(event, i)}
            // The pointer has already chosen by the time a click lands. A click
            // with no detail came from the keyboard, and that one is this item's.
            onClick={(event) => {
              if (event.detail === 0) choose(i);
            }}
          >
            <span
              key={picked.at === i ? picked.tick : 'rest'}
              className="lqc-dock-icon"
              aria-hidden="true"
            >
              <tab.Icon />
            </span>
          </button>
        ))}
      </LiquidSurface>
    </nav>
  );
}
