import { type ReactElement, type ReactNode, useEffect, useRef, useSyncExternalStore } from 'react';
import { cn } from '../cn';
import { Button } from './Button';

export interface ToastOptions {
  readonly description?: ReactNode;
  readonly variant?: 'default' | 'success' | 'error' | undefined;
  /** ms before auto-dismiss; `0` keeps it until closed. */
  readonly duration?: number | undefined;
  readonly action?: { readonly label: string; readonly onClick: () => void } | undefined;
}

interface ToastRecord extends ToastOptions {
  readonly id: number;
  readonly title: ReactNode;
  readonly closing: boolean;
}

// A tiny module store: toast() works from anywhere, the Toaster subscribes.
let toasts: readonly ToastRecord[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = (): void => {
  for (const l of listeners) l();
};
const subscribe = (l: () => void): (() => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = (): readonly ToastRecord[] => toasts;
const emptySnapshot: readonly ToastRecord[] = [];
const getServerSnapshot = (): readonly ToastRecord[] => emptySnapshot;

function dismiss(id: number): void {
  toasts = toasts.map((t) => (t.id === id ? { ...t, closing: true } : t));
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 200);
}

function show(title: ReactNode, options: ToastOptions = {}): number {
  const id = nextId++;
  toasts = [...toasts, { id, title, closing: false, ...options }];
  emit();
  const duration = options.duration ?? 5000;
  if (duration > 0) setTimeout(() => dismiss(id), duration);
  return id;
}

export interface ToastFn {
  /** Show a toast. Returns its id for `toast.dismiss(id)`. */
  (title: ReactNode, options?: ToastOptions): number;
  readonly dismiss: (id: number) => void;
  readonly success: (title: ReactNode, options?: ToastOptions) => number;
  readonly error: (title: ReactNode, options?: ToastOptions) => number;
}

export const toast: ToastFn = Object.assign(show, {
  dismiss,
  success: (title: ReactNode, options: ToastOptions = {}): number =>
    show(title, { ...options, variant: 'success' }),
  error: (title: ReactNode, options: ToastOptions = {}): number =>
    show(title, { ...options, variant: 'error' }),
});

export interface ToasterProps {
  readonly className?: string | undefined;
}

/** Mount once, near the app root. Lives in the top layer and re-raises itself above any open dialog. */
export function Toaster({ className }: ToasterProps): ReactElement {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ref = useRef<HTMLElement | null>(null);
  const count = items.length;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (count === 0) {
      if (el.matches(':popover-open')) el.hidePopover();
      return;
    }
    // Re-showing moves the region to the top of the top layer, above a dialog opened later.
    if (el.matches(':popover-open')) el.hidePopover();
    el.showPopover();
  }, [count]);

  return (
    <section
      ref={ref}
      popover="manual"
      aria-label="Notifications"
      data-slot="toaster"
      className={cn('toaster', className)}
    >
      {items.map((t) => (
        <div
          key={t.id}
          role={t.variant === 'error' ? 'alert' : 'status'}
          data-slot="toast"
          data-variant={t.variant ?? 'default'}
          data-state={t.closing ? 'closing' : 'open'}
          className="toast glass"
        >
          <div className="grid min-w-0 flex-1 gap-0.5">
            <div className="text-ui">{t.title}</div>
            {t.description ? (
              <div className="text-ui-sm text-muted-foreground">{t.description}</div>
            ) : null}
          </div>
          {t.action ? (
            <Button
              size="sm"
              variant="secondary"
              shape="rect"
              onClick={() => {
                t.action?.onClick();
                dismiss(t.id);
              }}
            >
              {t.action.label}
            </Button>
          ) : null}
          <Button
            size="icon"
            variant="ghost"
            shape="rect"
            aria-label="Dismiss"
            className="size-6"
            onClick={() => dismiss(t.id)}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              aria-hidden="true"
              className="size-3.5"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </Button>
        </div>
      ))}
    </section>
  );
}
