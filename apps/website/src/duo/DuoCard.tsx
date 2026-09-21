import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

/* A folded business card.

   Closed it is one panel, 256 by 358, the cover. Open it is two panels side by
   side: the inside of the cover on the left and a second page on the right,
   joined at the fold. Progress runs 0..1 and is the only state that moves;
   everything else is derived from it, in `pose`.

   The cover swings about the fold in a scene with perspective. Its body is a
   real 3D element, so it projects as a trapezoid and the corners nearest the
   viewer lift above and below the card. Its printed faces are not: a page in
   perspective would stretch its type, so each face is the flat panel, anchored
   at the fold and clipped where the body's free edge lands on screen. A
   progressive blur and a fold shadow across the face sell the turn, and the
   interior sits in the cover's shadow until it is most of the way open.

   Three ways in: a tap toggles it on a spring, a drag on the card follows the
   finger and settles to the nearer side, and the slider drives progress
   directly. The spring runs on one requestAnimationFrame loop
   and writes custom properties straight to the root, so a frame never renders
   React; React renders only when the card crosses from closed to open. */

/** One panel, px. Open, the card is two of these. The height, 358px (the 5:7
 *  of a folded card), only the stylesheet needs. */
const W = 256;
/** Perspective distance, px. Measured from how far the near corners lift. */
const DEPTH = 1200;
/** Px of pointer travel across the card for a full open: a panel and a half. */
const DRAG = 384;
/** Px a pointer may wander before a press becomes a drag. */
const SLOP = 4;
/** The toggle spring. A touch under critical damping (0.91), which lands it in
 *  about half a second with an overshoot too small to see; fitted to the
 *  reference frame by frame. */
const STIFFNESS = 120;
const DAMPING = 20;
/** The stage the card needs at full size: two panels plus the free edge's overshoot. */
const ROOM = 560;

/** Placeholder identity. Swap the fields, the layout holds. */
const card = {
  name: 'Mira Holt',
  title: 'Design Engineer',
  handle: '@miraholt',
  pronouns: 'they/them',
  tagline: ['Designing with code.', 'Small details matter.'],
  avatar: '/duo/avatar.jpg',
  links: [
    ['Web', 'miraholt.com'],
    ['GitHub', 'miraholt'],
    ['X', '@miraholt'],
    ['LinkedIn', 'miraholt'],
  ],
} as const;

/** The monogram: a 10 by 5 grid of 4px squares, drawn the way the card's
 *  pixel mark is. Rows are strings, X is ink. */
const MARK = ['X...X.X..X', 'XX.XX.X..X', 'X.X.X.XXXX', 'X...X.X..X', 'X...X.X..X'];
const MARK_PATH = MARK.map((row, y) =>
  [...row].map((cell, x) => (cell === 'X' ? `M${x} ${y}h1v1h-1z` : '')).join(''),
).join('');

type Vars = CSSProperties & Record<`--${string}`, string | number>;

interface Pose {
  /** where the fold is, px from the centre of the stage */
  readonly spine: number;
  /** width of the cover on screen, px: from the fold to its projected free edge */
  readonly face: number;
  /** which printed side of the cover shows */
  readonly front: boolean;
  /** black over the interior, 0..0.75: it sits in the cover's shadow */
  readonly shade: number;
  /** strength of the fold shadow across the visible face, 0..1 */
  readonly fold: number;
  /** blur at the free edge of the visible face, px */
  readonly blur: number;
}

/** Everything the stylesheet needs, from progress alone. */
function pose(p: number): Pose {
  const theta = p * Math.PI;
  // The closed card is centred and the open card is centred, so the fold
  // travels half a panel to the right as it opens.
  const spine = -(W / 2) * (1 - p);
  // The free edge comes toward the viewer as the cover turns, and the scene's
  // vanishing point is its centre, so the edge projects away from the fold.
  const depth = W * Math.sin(theta);
  const free = (spine + W * Math.cos(theta)) * (DEPTH / (DEPTH - depth));
  const front = free >= spine;
  return {
    spine,
    face: Math.abs(free - spine),
    front,
    shade: Math.min(0.75, 1.17 * (1 - p)),
    fold: front ? Math.min(1, 2 * p) : Math.min(1, 2.6 * (1 - p)),
    blur: 40 * Math.min(p, 1 - p),
  };
}

const clamp = (p: number): number => Math.min(1, Math.max(0, p));

/** The markup is born closed. Kept as one object so React never rewrites the
 *  properties the loop owns. */
const INITIAL: Vars = {
  '--p': 0,
  '--theta': '0deg',
  '--spine': `${-W / 2}px`,
  '--face': `${W}px`,
  '--reach': '0px',
  '--shade': 0.75,
  '--fold': 0,
  '--blur': '0px',
  '--duo-zoom': 1,
};

/** One finger on the card, kept out of React state so a move never renders. */
interface Gesture {
  readonly id: number;
  readonly startX: number;
  readonly startP: number;
  /** the press has travelled past SLOP and is a drag, not a tap */
  moved: boolean;
  lastX: number;
  lastT: number;
  /** progress per second, from the last two moves */
  velocity: number;
}

interface Motion {
  p: number;
  velocity: number;
  target: number;
  frame: number;
  last: number;
}

function Mark(): ReactElement {
  return (
    <svg className="duo-mark" viewBox="0 0 10 5" width="40" height="20" aria-hidden="true">
      <path d={MARK_PATH} fill="currentColor" shapeRendering="crispEdges" />
    </svg>
  );
}

/** One printed side of the cover. The sheet is drawn four times: once sharp,
 *  then three copies each blurred harder than the last and masked to a band
 *  further from the fold, so the type softens by degrees toward the free edge
 *  instead of all at once. Only the first copy is read out. */
function Face({
  side,
  hidden,
  children,
}: {
  readonly side: 'front' | 'back';
  readonly hidden: boolean;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className={`duo-face duo-${side}`} aria-hidden={hidden}>
      <span className="duo-sheet">{children}</span>
      <span className="duo-sheet duo-soft duo-soft-1" aria-hidden="true">
        {children}
      </span>
      <span className="duo-sheet duo-soft duo-soft-2" aria-hidden="true">
        {children}
      </span>
      <span className="duo-sheet duo-soft duo-soft-3" aria-hidden="true">
        {children}
      </span>
      {side === 'back' ? <span className="duo-shade" aria-hidden="true" /> : null}
      <span className="duo-fold" aria-hidden="true" />
    </div>
  );
}

/** The parts every printed page shares: the mark and handle up top, the name
 *  at the foot. `children` is what sits between. */
function Page({ children }: { readonly children?: ReactNode }): ReactElement {
  return (
    <>
      <span className="duo-head">
        <Mark />
        <span className="duo-mono">{card.handle}</span>
      </span>
      {children ?? <span />}
      <span className="duo-foot">
        <span className="duo-name">{card.name}</span>
        <span className="duo-title">{card.title}</span>
      </span>
    </>
  );
}

export function DuoCard(): ReactElement {
  const fitRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLParagraphElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const openRef = useRef(false);
  const zoomRef = useRef(1);
  const reducedRef = useRef(false);
  const motion = useRef<Motion>({ p: 0, velocity: 0, target: 0, frame: 0, last: 0 });
  const gesture = useRef<Gesture | null>(null);

  /** Write one frame to the DOM. `fromSlider` leaves the slider's own value
   *  alone while a thumb is being dragged. */
  const apply = useCallback((raw: number, fromSlider = false): void => {
    const root = rootRef.current;
    if (!root) return;
    const p = clamp(raw);
    const g = pose(p);
    root.style.setProperty('--p', String(p));
    root.style.setProperty('--theta', `${p * 180}deg`);
    root.style.setProperty('--spine', `${g.spine}px`);
    root.style.setProperty('--face', `${g.face}px`);
    root.style.setProperty('--reach', `${g.front ? 0 : g.face}px`);
    root.style.setProperty('--shade', String(g.shade));
    root.style.setProperty('--fold', String(g.fold));
    root.style.setProperty('--blur', `${g.blur}px`);
    root.dataset['side'] = g.front ? 'front' : 'back';
    if (p <= 0.001 || p >= 0.999) root.dataset['rest'] = '';
    else delete root.dataset['rest'];
    const degrees = Math.round(p * 180);
    if (readoutRef.current) readoutRef.current.textContent = `p ${p.toFixed(2)} / θ ${degrees}°`;
    const slider = sliderRef.current;
    if (slider) {
      if (!fromSlider) slider.value = String(p);
      slider.setAttribute('aria-valuetext', `${degrees} degrees`);
    }
    const isOpen = p >= 0.5;
    if (isOpen !== openRef.current) {
      openRef.current = isOpen;
      setOpen(isOpen);
    }
  }, []);

  const stop = useCallback((): void => {
    const m = motion.current;
    if (m.frame) cancelAnimationFrame(m.frame);
    m.frame = 0;
    m.last = 0;
  }, []);

  /** Carry progress to 0 or 1 on the spring, from wherever it is and however
   *  fast it is already going. */
  const settle = useCallback(
    (target: 0 | 1, velocity = 0): void => {
      const m = motion.current;
      stop();
      m.target = target;
      if (reducedRef.current) {
        m.p = target;
        m.velocity = 0;
        apply(target);
        return;
      }
      m.velocity = velocity;
      const tick = (now: number): void => {
        // The first frame after a long idle can be late; a clamped step keeps
        // the integrator honest.
        const dt = m.last ? Math.min(0.032, (now - m.last) / 1000) : 1 / 60;
        m.last = now;
        const accel = -STIFFNESS * (m.p - m.target) - DAMPING * m.velocity;
        m.velocity += accel * dt;
        m.p += m.velocity * dt;
        if (Math.abs(m.p - m.target) < 0.0005 && Math.abs(m.velocity) < 0.01) {
          m.p = m.target;
          m.velocity = 0;
          m.frame = 0;
          m.last = 0;
          apply(m.p);
          return;
        }
        apply(m.p);
        m.frame = requestAnimationFrame(tick);
      };
      m.frame = requestAnimationFrame(tick);
    },
    [apply, stop],
  );

  const toggle = useCallback((): void => {
    const m = motion.current;
    // Mid-flight, a tap turns it round rather than asking where it is now.
    const opening = m.frame ? m.target === 1 : m.p >= 0.5;
    settle(opening ? 0 : 1);
  }, [settle]);

  // The card is drawn at full size and zoomed down where the stage is narrower
  // than it needs. The observer watches the unzoomed wrapper, so the zoom it
  // sets never feeds back into the width it reads.
  useEffect(() => {
    const fit = fitRef.current;
    const root = rootRef.current;
    if (!fit || !root) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const readMotion = (): void => {
      reducedRef.current = media.matches;
    };
    readMotion();
    media.addEventListener('change', readMotion);
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? ROOM;
      const zoom = Math.min(1, Math.round((width / ROOM) * 1000) / 1000);
      zoomRef.current = zoom;
      root.style.setProperty('--duo-zoom', String(zoom));
    });
    observer.observe(fit);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', readMotion);
      stop();
    };
  }, [stop]);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (gesture.current) return; // a second finger changes nothing
    stop();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    gesture.current = {
      id: event.pointerId,
      startX: event.clientX,
      startP: motion.current.p,
      moved: false,
      lastX: event.clientX,
      lastT: event.timeStamp,
      velocity: 0,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    const zoom = zoomRef.current || 1;
    const dx = (event.clientX - g.startX) / zoom;
    if (!g.moved) {
      if (Math.abs(dx) < SLOP) return;
      g.moved = true;
      setDragging(true);
    }
    // Leftward travel opens: that is the way the free edge goes.
    const p = clamp(g.startP - dx / DRAG);
    const dt = (event.timeStamp - g.lastT) / 1000;
    if (dt > 0) g.velocity = (g.lastX - event.clientX) / zoom / DRAG / dt;
    g.lastX = event.clientX;
    g.lastT = event.timeStamp;
    motion.current.p = p;
    motion.current.velocity = 0;
    apply(p);
  };

  const release = (event: ReactPointerEvent<HTMLButtonElement>, cancelled: boolean): void => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    gesture.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (g.moved) {
      setDragging(false);
      // Where it would be a beat from now decides the side, so a flick carries.
      const ahead = motion.current.p + g.velocity * 0.12;
      settle(ahead >= 0.5 ? 1 : 0, g.velocity);
    } else if (!cancelled) {
      toggle();
    }
  };

  return (
    <div className="duo-fit" ref={fitRef}>
      <div
        className="duo"
        ref={rootRef}
        style={INITIAL}
        data-side="front"
        data-rest=""
        data-drag={dragging ? '' : undefined}
      >
        <div className="duo-scene">
          {/* The second page. It never moves; the fold travels and it follows. */}
          <div className="duo-panel duo-right" aria-hidden={!open}>
            <Page>
              <span className="duo-links">
                {card.links.map(([label, value]) => (
                  <span key={label} className="duo-link">
                    <span className="duo-mono">{label}</span>
                    <span className="duo-mono duo-value">{value}</span>
                  </span>
                ))}
              </span>
            </Page>
            <span className="duo-shade" aria-hidden="true" />
          </div>

          {/* The cover's body: the one thing in true perspective. */}
          <div className="duo-body" aria-hidden="true" />

          {/* The cover, printed side. */}
          <Face side="front" hidden={open}>
            <Page />
          </Face>

          {/* The cover, inside. */}
          <Face side="back" hidden={!open}>
            <img className="duo-avatar" src={card.avatar} alt="" width={64} height={64} decoding="async" />
            <span />
            <span className="duo-foot">
              <span className="duo-tagline">
                {card.tagline[0]}
                <br />
                {card.tagline[1]}
              </span>
              <span className="duo-mono duo-pronouns">{card.pronouns}</span>
            </span>
          </Face>

          {/* One control over the whole card: press to toggle, drag to turn. */}
          <button
            type="button"
            className="duo-hit"
            aria-expanded={open}
            aria-label={`Business card, ${open ? 'open' : 'closed'}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(event) => release(event, false)}
            onPointerCancel={(event) => release(event, true)}
            // The pointer has already answered by the time a click lands. A
            // click with no detail came from the keyboard, and that one counts.
            onClick={(event) => {
              if (event.detail === 0) toggle();
            }}
          />
        </div>

        <div className="duo-controls">
          <p className="duo-caption">Drag the page or the slider.</p>
          <input
            ref={sliderRef}
            className="duo-slider"
            type="range"
            min={0}
            max={1}
            step={0.001}
            defaultValue={0}
            aria-label="How far the card is open"
            aria-valuetext="0 degrees"
            onInput={(event) => {
              stop();
              const p = clamp(Number(event.currentTarget.value));
              motion.current.p = p;
              motion.current.velocity = 0;
              apply(p, true);
            }}
          />
          <p ref={readoutRef} className="duo-readout">
            p 0.00 / θ 0°
          </p>
        </div>
      </div>
    </div>
  );
}
