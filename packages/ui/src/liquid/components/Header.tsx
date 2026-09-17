import { type PointerEvent, type ReactElement, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  H,
  inner,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  LiquidSurface,
  pill,
  useEnterExit,
  useLiquidScene,
} from '../core';

const NAV = [
  { label: 'Product', items: ['Overview', 'Features', 'Pricing'] },
  { label: 'Resources', items: ['Docs', 'Guides', 'Blog'] },
  { label: 'Company', items: ['About', 'Careers', 'Contact'] },
] as const;
const MENU_PADDING = 6;
const MENU_EXIT = 240;

/**
 * A glass nav bar whose menus open beneath the item you point at.
 *
 * The panel is a single surface that SLIDES between items rather than one panel
 * per item: moving is a transform on a wrapper, so switching menus costs no new
 * displacement map at all. Every menu carries the same three rows for that
 * reason: same box, one cached map, and the move stays perfectly smooth.
 */
export function LiquidHeader({ radius = LIQUID_RADIUS }: LiquidComponentProps): ReactElement {
  const { pump } = useLiquidScene();
  const [active, setActive] = useState<string | null>(null);
  const { mounted, shown } = useEnterExit(!!active, MENU_EXIT);
  const [x, setX] = useState(0);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const headerRef = useRef<HTMLDivElement | null>(null);
  const slotRef = useRef<HTMLDivElement | null>(null);
  const lastActive = useRef<string>(NAV[0].label);

  if (active) lastActive.current = active;
  const openLabel = active ?? lastActive.current;
  const openItems: readonly string[] = NAV.find((n) => n.label === openLabel)?.items ?? [];

  const r = pill(H.bar, radius);

  // Follow the pointed-at item; the slide and the fade both need repaints. The
  // panel stays inside the bar: on a narrow scene the last item sits further
  // right than a panel of that width can start from.
  useEffect(() => {
    if (active) {
      const el = itemRefs.current[active];
      const room = headerRef.current?.clientWidth ?? 0;
      const panel = slotRef.current?.offsetWidth ?? 0;
      if (el) setX(Math.max(0, Math.min(el.offsetLeft, room - panel)));
    }
    pump(800);
  }, [active, pump]);

  return (
    <div
      ref={headerRef}
      className="lqc-header"
      data-slot="liquid-header"
      onPointerLeave={() => setActive(null)}
    >
      <LiquidSurface
        radius={r}
        className="lqc-header-bar"
        contentClassName="lq-content-interactive lqc-header-content"
        style={{ '--lq-inner-r': `${inner(r, 8)}px` }}
      >
        {NAV.map((nav) => (
          <button
            key={nav.label}
            ref={(el) => {
              itemRefs.current[nav.label] = el;
            }}
            type="button"
            className="lqc-header-nav"
            aria-expanded={active === nav.label}
            data-open={active === nav.label || undefined}
            onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
              // A tap fires pointerenter as well, and the click right behind
              // it would toggle the menu straight back shut. On touch the
              // click alone opens it.
              if (event.pointerType === 'touch') return;
              setActive(nav.label);
            }}
            onFocus={() => setActive(nav.label)}
            onClick={() => setActive((a) => (a === nav.label ? null : nav.label))}
          >
            <span>{nav.label}</span>
            <ChevronDown
              className="lqc-header-chevron"
              data-open={active === nav.label || undefined}
            />
          </button>
        ))}
      </LiquidSurface>

      {/* the slot moves; the surface inside only fades and settles */}
      <div ref={slotRef} className="lqc-header-slot" style={{ transform: `translateX(${x}px)` }}>
        {mounted && (
          <LiquidSurface
            radius={r}
            className={`lqc-header-menu ${shown ? 'is-shown' : ''}`}
            contentClassName="lq-content-interactive lqc-header-menu-content"
            role="menu"
            aria-label={openLabel}
            style={{ '--lq-inner-r': `${inner(r, MENU_PADDING)}px`, padding: MENU_PADDING }}
          >
            {openItems.map((item) => (
              <button key={item} type="button" role="menuitem" className="lqc-header-item">
                {item}
              </button>
            ))}
          </LiquidSurface>
        )}
      </div>
    </div>
  );
}
