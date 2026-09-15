import { type ReactElement, useRef, useState } from 'react';
import {
  approach,
  H,
  inner,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  LiquidDraggable,
  LiquidSurface,
  makeClock,
  pill,
  SETTLE_EPSILON,
  useSceneFrame,
} from '../core';

const TABS = ['Optics', 'Depth', 'Sheen', 'Rim'];

const TAU = 62;
/** How much travel speed turns into horizontal stretch. */
const STRETCH = 0.011;
const STRETCH_MAX = 0.42;

/**
 * Tabs with an indicator that stretches as it travels and settles as it lands.
 *
 * The squash and stretch is derived from the indicator's own velocity each
 * frame, not from a keyframed animation, so it is always proportional to the
 * distance actually being covered. All of it happens inside a surface that
 * never changes size, so the engine does no work at all here: the most
 * animated component in the set is also the cheapest.
 */
export function LiquidTabIndicator({ radius = LIQUID_RADIUS }: LiquidComponentProps): ReactElement {
  const [index, setIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const blobRef = useRef<HTMLSpanElement | null>(null);
  const st = useRef({ x: Number.NaN, w: 0, v: 0 });
  const clock = useRef(makeClock());

  const r = pill(H.tabBar, radius);

  useSceneFrame((now) => {
    const blob = blobRef.current;
    const target = tabRefs.current[index];
    if (!blob || !target) return;

    const dt = clock.current(now);
    const tx = target.offsetLeft;
    const tw = target.offsetWidth;
    const s = st.current;

    if (Number.isNaN(s.x)) {
      // first frame: appear already under the active tab
      s.x = tx;
      s.w = tw;
    }

    const nx = approach(s.x, tx, dt, TAU);
    const nw = approach(s.w, tw, dt, TAU);
    const settled =
      Math.abs(tx - s.x) < SETTLE_EPSILON &&
      Math.abs(tw - s.w) < SETTLE_EPSILON &&
      Math.abs(s.v) < SETTLE_EPSILON;
    if (settled) {
      if (s.v === 0 && s.x === tx) return;
      s.x = tx;
      s.w = tw;
      s.v = 0;
    } else {
      s.v = ((nx - s.x) / dt) * 16; // px per frame-equivalent
      s.x = nx;
      s.w = nw;
    }

    // Stretch along the direction of travel and thin out across it, so the blob
    // conserves its apparent volume the way a droplet would.
    const stretch = Math.min(STRETCH_MAX, Math.abs(s.v) * STRETCH);
    blob.style.transform = `translateX(${s.x.toFixed(2)}px) scaleX(${(1 + stretch).toFixed(3)}) scaleY(${(1 - stretch * 0.55).toFixed(3)})`;
    blob.style.width = `${s.w.toFixed(2)}px`;
  });

  return (
    <LiquidDraggable>
      <LiquidSurface
        radius={r}
        data-slot="liquid-tab-indicator"
        className="lqc-indicator-bar"
        contentClassName="lq-content-interactive lqc-indicator-content"
        role="tablist"
        aria-label="Liquid tabs"
        style={{ '--lq-inner-r': `${inner(r, 6)}px` }}
      >
        {/* the blob sits under the labels, and is a plain element: putting a
            second glass surface here would mean a map per position */}
        <span ref={blobRef} className="lqc-indicator-blob" aria-hidden="true" />

        {TABS.map((label, i) => (
          <button
            key={label}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`lqc-indicator-tab ${i === index ? 'is-active' : ''}`}
            onClick={() => setIndex(i)}
          >
            {label}
          </button>
        ))}
      </LiquidSurface>
    </LiquidDraggable>
  );
}
