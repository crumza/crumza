import { type ReactElement, useState } from 'react';
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

/** Ms the pop and the glass behind it take together. Kept in step with
 *  lqc-dock-pop and the pane's transition in mobile-nav.css. */
const PICK = 560;

/**
 * A dock at the foot of the scene, where a thumb can reach it.
 *
 * Choosing is two beats rather than one: the glyph jumps, and the glass slides
 * in under it a moment later, so the tap is answered before the state catches
 * up with it. Nothing else on the bar moves, and no glyph ever changes the size
 * it occupies, so the row stays exactly where it was through all of it.
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
  // `tick` is what makes a second tap on the same item pop again: it re-keys
  // the glyph, and an element that has just mounted runs its animation.
  const [picked, setPicked] = useState({ at: 0, tick: 0 });

  const r = pill(H.dock, radius);

  const choose = (at: number): void => {
    setPicked((last) => ({ at, tick: last.tick + 1 }));
    pump(PICK + 200); // the pane travels across the glass
  };

  return (
    <nav
      className="lqc-dock"
      data-slot="liquid-mobile-nav"
      aria-label="Sections"
      style={{ '--at': picked.at, '--n': TABS.length } as LiquidCSS}
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
        <span className="lqc-dock-pane" aria-hidden="true" />

        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            className="lqc-dock-item"
            aria-current={picked.at === i ? 'page' : undefined}
            aria-label={tab.label}
            onClick={() => choose(i)}
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
