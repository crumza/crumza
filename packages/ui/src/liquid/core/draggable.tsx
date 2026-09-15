import {
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import { useLiquidScene } from './scene';

export interface LiquidDraggableProps {
  readonly children?: ReactNode;
  readonly className?: string | undefined;
}

/**
 * Positions a component anywhere over the scene and lets the user drag it there.
 *
 * Position is written straight to `style.left/top` (never React state) so a drag
 * costs one repaint per frame and no re-render. Every move bumps the scene's
 * dirty token, which is what makes the glass re-sample the part of the image it
 * has just moved over: dragging is the clearest way to see the refraction.
 *
 * A drag is only a drag past a 4px threshold, so taps still click through; a
 * focused text field (and anything marked [data-no-drag]) never initiates one.
 */
export function LiquidDraggable({ children, className }: LiquidDraggableProps): ReactElement {
  const { requestPaint, pump } = useLiquidScene();
  const ref = useRef<HTMLDivElement | null>(null);
  const st = useRef({
    down: false,
    moved: false,
    captured: false,
    sx: 0,
    sy: 0,
    ox: 0,
    oy: 0,
    x: 0,
    y: 0,
    fieldToBlur: null as HTMLElement | null,
  });

  // Centre on mount, before the browser paints. The stylesheet already centres
  // the wrapper with a transform, so server-rendered markup sits in the middle
  // from its first paint; this swaps that for a pixel position the drag can move.
  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const x = Math.round((parent.clientWidth - el.offsetWidth) / 2);
    const y = Math.round((parent.clientHeight - el.offsetHeight) / 2);
    st.current.x = x;
    st.current.y = y;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.dataset['placed'] = '';
    requestPaint();
  }, [requestPaint]);

  // keep it inside the stage when the stage itself resizes
  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const ro = new ResizeObserver(() => {
      const s = st.current;
      s.x = Math.max(0, Math.min(s.x, parent.clientWidth - el.offsetWidth));
      s.y = Math.max(0, Math.min(s.y, parent.clientHeight - el.offsetHeight));
      el.style.left = `${s.x}px`;
      el.style.top = `${s.y}px`;
      requestPaint();
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, [requestPaint]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    const el = ref.current;
    if (!el || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-drag]')) return;
    // A focused text field owns the pointer so its text stays selectable; an
    // unfocused one is just part of the surface and drags with it (a tap below
    // the threshold still focuses it).
    const field = target.closest<HTMLElement>('input, textarea');
    if (field && document.activeElement === field) return;
    // mousedown focuses the field regardless; if this turns into a drag, hand
    // the focus back so the surface stays draggable from its whole face
    st.current.fieldToBlur = field;
    const s = st.current;
    s.down = true;
    s.moved = false;
    s.captured = false;
    s.sx = e.clientX;
    s.sy = e.clientY;
    s.ox = s.x;
    s.oy = s.y;
    // Deliberately NOT capturing here: pointer capture on this wrapper would
    // retarget the pointerup, and the resulting click would land on the wrapper
    // instead of the button inside it. Capture is taken in onPointerMove, once
    // the movement threshold says this is a drag rather than a tap.
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    const el = ref.current;
    const parent = el?.parentElement;
    const s = st.current;
    if (!s.down || !el || !parent) return;
    const dx = e.clientX - s.sx;
    const dy = e.clientY - s.sy;
    if (!s.moved && Math.hypot(dx, dy) < 4) return;
    if (!s.captured) {
      // now that it is a drag, capture so a fast pointer leaving the element
      // keeps feeding moves
      s.captured = true;
      el.setPointerCapture(e.pointerId);
      s.fieldToBlur?.blur();
      s.fieldToBlur = null;
    }
    s.moved = true;
    el.dataset['dragging'] = 'true';
    s.x = Math.max(0, Math.min(s.ox + dx, parent.clientWidth - el.offsetWidth));
    s.y = Math.max(0, Math.min(s.oy + dy, parent.clientHeight - el.offsetHeight));
    el.style.left = `${s.x}px`;
    el.style.top = `${s.y}px`;
    requestPaint();
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>): void => {
    const el = ref.current;
    const s = st.current;
    if (!s.down) return;
    s.down = false;
    if (s.captured) {
      s.captured = false;
      el?.releasePointerCapture?.(e.pointerId);
    }
    s.fieldToBlur = null;
    if (el) delete el.dataset['dragging'];
    pump(200); // settle the last frames of the release transition
  };

  return (
    <div
      ref={ref}
      data-slot="liquid-draggable"
      className={className ? `lq-drag ${className}` : 'lq-drag'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={(e) => {
        // a drag must not also activate whatever it was grabbed by
        if (st.current.moved) {
          st.current.moved = false;
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      {children}
    </div>
  );
}
