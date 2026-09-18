import {
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react';
import { cn } from '../cn';
import { useLiquixBox } from '../liquix/box';
import { type LiquixLensStyle, LiquixMotion, shapeFrame } from '../liquix/motion';
import { useBloom } from '../liquix/use-bloom';
import { useMeasure } from '../liquix/use-measure';

export interface LiquixToastOptions {
  readonly description?: ReactNode | undefined;
  /** ms before it dismisses itself; 0 keeps it until swiped or dismissed. */
  readonly duration?: number | undefined;
}

interface ToastRecord extends LiquixToastOptions {
  readonly id: number;
  readonly title: ReactNode;
  readonly closing: boolean;
}

// A module store: liquixToast() works from anywhere, LiquixToaster subscribes.
let toasts: readonly ToastRecord[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = (): void => {
  for (const listener of listeners) listener();
};
const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = (): readonly ToastRecord[] => toasts;
const empty: readonly ToastRecord[] = [];
const getServerSnapshot = (): readonly ToastRecord[] => empty;
// The shader draws at most six shapes a layer; three toasts leave room for the rest.
const MAX_SHOWN = 3;

function dismiss(id: number): void {
  if (!toasts.some((toast) => toast.id === id && !toast.closing)) return;
  toasts = toasts.map((toast) => (toast.id === id ? { ...toast, closing: true } : toast));
  emit();
}
function remove(id: number): void {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}
function show(title: ReactNode, options: LiquixToastOptions = {}): number {
  const id = nextId++;
  toasts = [...toasts, { id, title, closing: false, ...options }];
  const open = toasts.filter((toast) => !toast.closing);
  for (const old of open.slice(0, Math.max(0, open.length - MAX_SHOWN))) dismiss(old.id);
  emit();
  const duration = options.duration ?? 5000;
  if (duration > 0) setTimeout(() => dismiss(id), duration);
  return id;
}

export interface LiquixToastFn {
  /** Shows a toast and returns its id, for `liquixToast.dismiss(id)`. */
  (title: ReactNode, options?: LiquixToastOptions): number;
  readonly dismiss: (id: number) => void;
}

export const liquixToast: LiquixToastFn = Object.assign(show, { dismiss });

export interface LiquixToasterProps {
  /** Which edge of the surface the toasts rise from. */
  readonly position?: 'bottom' | 'top' | undefined;
  readonly align?: 'center' | 'start' | 'end' | undefined;
  readonly className?: string | undefined;
}

const SWIPE: LiquixLensStyle = {
  liftWidth: 8,
  liftHeight: 6,
  liftShadow: 24,
  lens: 0.3,
  stretch: 0.1,
  pinch: 0.06,
  fullSpeed: 1200,
};
const DISMISS_DISTANCE = 72;
const DISMISS_SPEED = 500;
const RADIUS = 18;

function ToastPane({
  toast,
  position,
}: {
  toast: ToastRecord;
  position: 'bottom' | 'top';
}): ReactElement {
  const { elementRef, entryRef, stage, fallback } = useLiquixBox(0);
  const box = useMeasure(elementRef);
  const swipe = useRef(new LiquixMotion({ restGlass: true }));
  const bloomRef = useRef(0);
  const drag = useRef({ pointerId: null as number | null, active: false, x: 0, startX: 0 });
  const [open, setOpenState] = [!toast.closing, undefined] as const;

  const onFrame = useCallback((progress: number) => {
    bloomRef.current = progress;
  }, []);
  const mounted = useBloom(open, onFrame);
  useEffect(() => {
    if (!mounted) remove(toast.id);
  }, [mounted, toast.id]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the refs from useLiquixBox never change.
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const entry = entryRef.current;
    const m = swipe.current;
    let registered = stage !== null;
    let raf = 0;
    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      if (drag.current.active) m.hold(drag.current.x);
      else if (m.held) {
        m.release();
        // A swipe past the edge, or a fling, dismisses; anything less springs back.
        if (Math.abs(m.x) > DISMISS_DISTANCE || Math.abs(m.vx) > DISMISS_SPEED) dismiss(toast.id);
        else m.target(0);
      }
      const frame = m.step(time);
      const bloom = bloomRef.current;
      const rise = (1 - bloom) * 18 * (position === 'bottom' ? 1 : -1);
      const scale = 0.94 + 0.06 * bloom;
      // Sliding away as it closes, if it was swiped.
      const away =
        toast.closing && Math.abs(frame.x) > 8 ? Math.sign(frame.x) * (1 - bloom) * 160 : 0;
      shapeFrame(entry, frame, { width: box.width * scale, height: box.height * scale }, SWIPE);
      entry.shape = { ...entry.shape, cornerRadius: RADIUS * scale, roundness: 3 };
      entry.alpha = bloom;
      entry.clarity = bloom;
      if (stage && bloom > 0 !== registered) {
        registered = bloom > 0;
        if (registered) stage.register(entry);
        else stage.unregister(entry);
      }
      element.style.opacity = bloom.toFixed(3);
      element.style.transform = `translate(${(frame.x + away).toFixed(2)}px, ${rise.toFixed(2)}px) scale(${scale.toFixed(4)})`;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [box.width, box.height, position, toast.id, toast.closing, stage]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0 || toast.closing) return;
    const state = drag.current;
    state.pointerId = event.pointerId;
    state.startX = event.clientX - swipe.current.x;
    state.active = false;
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const state = drag.current;
    if (state.pointerId !== event.pointerId) return;
    const x = event.clientX - state.startX;
    if (!state.active) {
      if (Math.abs(x) < 4) return;
      state.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    state.x = x;
  };
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>): void => {
    const state = drag.current;
    if (state.pointerId !== event.pointerId) return;
    state.pointerId = null;
    state.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  void setOpenState;

  return (
    <div
      ref={elementRef}
      role="status"
      data-slot="liquix-toast"
      data-fallback={fallback ? '' : undefined}
      style={{ borderRadius: `${RADIUS}px`, opacity: 0 }}
      className={cn(
        'liquix-ink pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] cursor-grab touch-none select-none flex-col gap-0.5 px-4 py-3 will-change-transform active:cursor-grabbing',
        fallback && 'liquix-glass-pane',
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <span className="text-[13px] font-semibold">{toast.title}</span>
      {toast.description ? (
        <span className="text-[12px] opacity-80">{toast.description}</span>
      ) : null}
    </div>
  );
}

/**
 * Where liquixToast() puts its toasts: panes of glass that rise from an edge
 * of the surface on a spring, stack, dismiss themselves in time, and can be
 * swiped away with a fling. Render it in a LiquixSurface overlay.
 */
export function LiquixToaster({
  position = 'bottom',
  align = 'center',
  className,
}: LiquixToasterProps): ReactElement {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <div
      data-slot="liquix-toaster"
      aria-live="polite"
      className={cn(
        'pointer-events-none absolute inset-x-0 flex flex-col gap-2 px-4',
        position === 'bottom' ? 'bottom-4 flex-col-reverse' : 'top-4',
        align === 'start' ? 'items-start' : align === 'end' ? 'items-end' : 'items-center',
        className,
      )}
    >
      {list.map((toast) => (
        <ToastPane key={toast.id} toast={toast} position={position} />
      ))}
    </div>
  );
}
