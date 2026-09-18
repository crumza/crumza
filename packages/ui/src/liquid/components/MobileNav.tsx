import { type PointerEvent, type ReactElement, useEffect, useRef, useState } from 'react';
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
/** Ms a finger rests on the dock before the pane lifts to be dragged. */
const HOLD = 180;
/** Px of sideways travel that lifts the pane before the hold is up. */
const SLIP = 6;
/** How much of a drag past either end the pane actually follows. */
const RESIST = 0.3;
/** Slots past either end it can be pulled, at most. */
const OVER = 0.35;

interface Pick {
  readonly at: number;
  /** where the pane is leaving, so the throw can be drawn from there; fractional after a drag */
  readonly from: number;
  /** re-keys the pane and the glyph on every pick, which restarts their animations */
  readonly tick: number;
  /** 1 when the pick ends a drag: the pane and glyph settle from their lifted size */
  readonly lift: 0 | 1;
}

/** One finger on the dock, kept out of React state so a move never renders. */
interface Gesture {
  readonly id: number;
  /** slot the finger landed on */
  readonly at: number;
  readonly startX: number;
  /** px one slot is wide, measured once on the way down */
  readonly slot: number;
  /** where the pane is, in slots, fractional */
  x: number;
  /** the pane has lifted and is following the finger */
  live: boolean;
  hold: number;
}

const LAST = TABS.length - 1;

const nearest = (x: number): number => Math.round(Math.max(0, Math.min(LAST, x)));

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
 * Hold, and the pane lifts. A finger that rests for a beat, or slides at all,
 * takes the pane off the glass: it grows, the glyph under it grows with it, and
 * from there it follows the finger one to one across the bar, the glyph under
 * it swelling as it passes. Let go and it springs onto the nearest slot and
 * settles back down, and that slot is the pick.
 *
 * There is no frame loop here at all. The pane is a transform on one element
 * and the pop is one keyframe on another, both of them above the glass rather
 * than inside the filtered part of it, so the compositor carries the animation
 * and a phone has nothing to keep up with. A drag writes one custom property
 * per pointer event, straight to the DOM, and renders only when the finger
 * crosses into another slot.
 *
 * The chrome is the liquix stage's: its glyph shadow, its focus ring, and for
 * the pane the material liquix falls back to when it cannot run the shader.
 */
export function LiquidMobileNav({ radius = LIQUID_RADIUS }: LiquidComponentProps): ReactElement {
  const { pump } = useLiquidScene();
  const [picked, setPicked] = useState<Pick>({ at: 0, from: 0, tick: 0, lift: 0 });
  // The slot under the pane while it is being dragged; -1 when it is not.
  // Separate from `at` because a drag has not chosen yet: it chooses on release.
  const [hot, setHot] = useState(-1);
  const navRef = useRef<HTMLElement>(null);
  const gesture = useRef<Gesture | null>(null);

  useEffect(
    () => () => {
      if (gesture.current) window.clearTimeout(gesture.current.hold);
    },
    [],
  );

  const r = pill(H.dock, radius);

  const choose = (at: number): void => {
    setPicked((last) => ({ at, from: last.at, tick: last.tick + 1, lift: 0 }));
    pump(PICK + 200); // the pane travels across the glass
  };

  /** The pane comes off the glass and follows the finger from here on. */
  const lift = (): void => {
    const g = gesture.current;
    if (!g || g.live) return;
    g.live = true;
    window.clearTimeout(g.hold);
    navRef.current?.style.setProperty('--x', String(g.x));
    setHot(g.at);
    pump(400);
  };

  /** Carry the pane to the finger. Past either end it gets heavy rather than free. */
  const follow = (clientX: number): void => {
    const g = gesture.current;
    const nav = navRef.current;
    if (!g?.live || !nav) return;
    let x = g.at + (clientX - g.startX) / g.slot;
    if (x < 0) x = Math.max(-OVER, x * RESIST);
    else if (x > LAST) x = Math.min(LAST + OVER, LAST + (x - LAST) * RESIST);
    g.x = x;
    nav.style.setProperty('--x', String(x));
    setHot(nearest(x)); // same value, no render
    pump(160);
  };

  /** Let go: the pane springs onto the nearest slot, and that is the pick. */
  const settle = (): void => {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    window.clearTimeout(g.hold);
    if (!g.live) return; // a tap: it chose on the way down
    navRef.current?.style.removeProperty('--x');
    setHot(-1);
    setPicked((last) => ({ at: nearest(g.x), from: g.x, tick: last.tick + 1, lift: 1 }));
    pump(PICK + 200);
  };

  /* Down, not up. A discrete event renders before the next paint, so the pane
     is already on its way by the time the finger has finished landing. The
     pointer is captured so a finger that slides off the item keeps reporting. */
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, at: number): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (gesture.current) return; // a second finger changes nothing
    choose(at);
    const item = event.currentTarget;
    item.setPointerCapture?.(event.pointerId);
    gesture.current = {
      id: event.pointerId,
      at,
      startX: event.clientX,
      slot: item.getBoundingClientRect().width || 1,
      x: at,
      live: false,
      hold: window.setTimeout(lift, HOLD),
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>): void => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    if (!g.live && Math.abs(event.clientX - g.startX) > SLIP) lift();
    follow(event.clientX);
  };

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>): void => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    settle();
  };

  return (
    <nav
      ref={navRef}
      className="lqc-dock"
      data-slot="liquid-mobile-nav"
      data-drag={hot >= 0 ? '' : undefined}
      aria-label="Sections"
      style={
        {
          '--at': picked.at,
          '--from': picked.from,
          '--dist': Math.abs(picked.at - picked.from),
          '--lift': picked.lift,
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
            data-hot={hot === i ? '' : undefined}
            aria-label={tab.label}
            onPointerDown={(event) => onPointerDown(event, i)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
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
