import {
  type CSSProperties,
  type PointerEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  H,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  LiquidSurface,
  pill,
  useLiquidScene,
  X,
} from '../core';

const COPY = [
  { title: 'Map rebuilt', body: 'Geometry settled at 264 × 60.' },
  { title: 'Preset applied', body: 'Frosted: blur 5, splay 16.' },
  { title: 'Scene replaced', body: 'Every surface re-cloned its source.' },
  { title: 'Cache trimmed', body: '38 displacement maps released.' },
];

/** Deck geometry when collapsed: each card behind loses this much scale and
 *  sits this far down, which is what reads as depth rather than a list. */
const DECK_SHIFT = 20;
const DECK_SCALE = 0.045;
const DECK_VISIBLE = 3;
/** Row pitch once the deck is fanned out: card height plus the gap. Kept in
 *  step with .lqc-notif's height in notification-stack.css. */
const DECK_ROW = 76;
const SWIPE = 76;
const EXIT = 300;

interface Notif {
  readonly id: number;
  readonly title: string;
  readonly body: string;
  readonly leaving?: boolean;
}

/**
 * A deck of notifications that collapses into a stack and fans out on hover.
 *
 * Both states are transforms on wrappers, so the surfaces themselves never
 * resize: the whole deck shares a single cached displacement map no matter how
 * it is arranged. Swiping a card out is the one motion that does move glass, so
 * the deck pumps through the throw.
 */
export function LiquidNotificationStack({
  radius = LIQUID_RADIUS,
}: LiquidComponentProps): ReactElement {
  const { pump, requestPaint } = useLiquidScene();
  const [notifs, setNotifs] = useState<Notif[]>(() =>
    COPY.slice(0, 3).map((c, i) => ({ id: i, ...c })),
  );
  const [expanded, setExpanded] = useState(false);
  const nextId = useRef(COPY.length);
  const timers = useRef<number[]>([]);
  const swipe = useRef({ id: -1, startX: 0, dx: 0, el: null as HTMLElement | null });

  const r = pill(H.notif, radius);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of pending) window.clearTimeout(t);
    };
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      setNotifs((list) => list.map((n) => (n.id === id ? { ...n, leaving: true } : n)));
      pump(EXIT + 400);
      timers.current.push(
        window.setTimeout(() => setNotifs((list) => list.filter((n) => n.id !== id)), EXIT),
      );
    },
    [pump],
  );

  const push = useCallback(() => {
    const id = nextId.current++;
    const copy = COPY[id % COPY.length];
    if (!copy) return;
    // newest on top: the deck is rendered front-to-back
    setNotifs((list) => [{ id, ...copy }, ...list].slice(0, 5));
    pump(700);
  }, [pump]);

  /* Swipe: the card is translated directly and only leaves the array if the
     throw passed the threshold, so an abandoned swipe springs back with no
     re-render at all. */
  const onCardDown = (id: number) => (e: PointerEvent<HTMLElement>) => {
    if (!expanded) return; // collapsed cards are a deck, not individual targets
    // A press on the dismiss button is a click, not a swipe. Capturing the
    // pointer here would retarget the pointerup to the card and the click
    // would never reach the button.
    if (e.target instanceof Element && e.target.closest('.lqc-notif-close')) return;
    const el = e.currentTarget;
    swipe.current = { id, startX: e.clientX, dx: 0, el };
    el.setPointerCapture(e.pointerId);
  };

  const onCardMove = (e: PointerEvent<HTMLElement>): void => {
    const s = swipe.current;
    if (s.id < 0 || !s.el) return;
    s.dx = e.clientX - s.startX;
    s.el.style.setProperty('--swipe', `${s.dx.toFixed(1)}px`);
    s.el.style.setProperty('--swipe-fade', String(Math.max(0, 1 - Math.abs(s.dx) / 180)));
    requestPaint();
  };

  const onCardUp = (e: PointerEvent<HTMLElement>): void => {
    const s = swipe.current;
    if (s.id < 0 || !s.el) return;
    s.el.releasePointerCapture?.(e.pointerId);
    const { id, dx, el } = s;
    swipe.current = { id: -1, startX: 0, dx: 0, el: null };
    el.style.removeProperty('--swipe');
    el.style.removeProperty('--swipe-fade');
    if (Math.abs(dx) > SWIPE) dismiss(id);
    else pump(320); // springs back
  };

  return (
    <div className="lqc-notif-field" data-slot="liquid-notification-stack">
      <LiquidSurface
        as="button"
        type="button"
        radius={pill(H.magnetic, radius)}
        className="lqc-notif-push"
        onClick={push}
      >
        Push notification
      </LiquidSurface>

      <div
        className="lqc-notif-deck"
        data-expanded={expanded || undefined}
        onPointerEnter={() => {
          setExpanded(true);
          pump(600); // the deck fans out
        }}
        onPointerLeave={() => {
          setExpanded(false);
          pump(600);
        }}
      >
        {notifs.map((n, i) => (
          <div
            key={n.id}
            className={`lqc-notif-slot ${n.leaving ? 'is-leaving' : ''}`}
            data-buried={!expanded && i >= DECK_VISIBLE ? 'true' : undefined}
            style={
              {
                // collapsed: stacked with depth. expanded: CSS lays them out in
                // a column and both of these fall back to zero.
                '--deck-y': `${i * DECK_SHIFT}px`,
                '--deck-scale': String(Math.max(0.8, 1 - i * DECK_SCALE)),
                '--deck-z': String(notifs.length - i),
                '--deck-fade': String(Math.max(0, 1 - Math.max(0, i - 1) * 0.34)),
                '--open-y': `${i * DECK_ROW}px`,
              } as CSSProperties
            }
          >
            <LiquidSurface
              radius={r}
              className="lqc-notif"
              contentClassName="lq-content-interactive lqc-notif-content"
              role="status"
              onPointerDown={onCardDown(n.id)}
              onPointerMove={onCardMove}
              onPointerUp={onCardUp}
              onPointerCancel={onCardUp}
            >
              <span className="lqc-notif-text">
                <strong>{n.title}</strong>
                <span>{n.body}</span>
              </span>
              <button
                type="button"
                className="lqc-notif-close"
                aria-label={`Dismiss ${n.title}`}
                onClick={() => dismiss(n.id)}
              >
                <X />
              </button>
            </LiquidSurface>
          </div>
        ))}

        {notifs.length === 0 && <span className="lqc-notif-empty">No notifications</span>}

        {/* the count only makes sense while the deck is closed */}
        {notifs.length > DECK_VISIBLE && !expanded && (
          <span className="lqc-notif-count">+{notifs.length - DECK_VISIBLE}</span>
        )}
      </div>
    </div>
  );
}
