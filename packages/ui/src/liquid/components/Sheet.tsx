import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';
import {
  H,
  inner,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  type LiquidCSS,
  LiquidSurface,
  pill,
  useControllableState,
  useEnterExit,
  useLiquidScene,
  X,
} from '../core';

export interface LiquidSheetAction {
  /** What `onAction` reports when the row is chosen. */
  readonly id: string;
  readonly label: string;
  /** The one action drawn as a filled button; the rest are glass. */
  readonly primary?: boolean | undefined;
}

export interface LiquidSheetProps extends LiquidComponentProps {
  /** Whether the sheet is up. Leave it out for uncontrolled. */
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /** The label of the button in the scene that raises the sheet. */
  readonly trigger?: string | undefined;
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly actions?: readonly LiquidSheetAction[] | undefined;
  /** An action was chosen; the sheet lowers after reporting it. */
  readonly onAction?: ((id: string) => void) | undefined;
  readonly className?: string | undefined;
}

const PAD = 16;
/** Ms the sheet takes to rise, and to lower. Kept in step with sheet.css. */
const RISE = 340;
const LOWER = 260;
/** Px of downward drag on the handle past which letting go lowers the sheet. */
const DISMISS = 80;
/** Px per ms of downward speed that lowers it from any distance. */
const FLICK = 0.6;

const ACTIONS: readonly LiquidSheetAction[] = [
  { id: 'export', label: 'Export PNG', primary: true },
  { id: 'copy', label: 'Copy link' },
];

/** One finger on the handle, kept out of React state so a move never renders. */
interface Drag {
  readonly id: number;
  readonly startY: number;
  y: number;
  at: number;
  v: number;
}

/**
 * A sheet of glass that rises from the foot of the scene.
 *
 * A pill in the scene raises it. The scene dims a little, and the sheet
 * slides up from below the edge of the stage, a handle at its head, a title,
 * a line of description and a row of actions at its foot. Choose an action,
 * press the cross, press outside, press Escape, or pull the handle down past
 * 80px and let go, and it lowers the way it came.
 *
 * The rise is a translate on a wrapper: the pane's box never changes, so it
 * keeps the one displacement map it was born with, and the engine only
 * repositions its clone of the scene on each frame the wrapper moves. The
 * scrim is not in the clone, so the glass shows the scene at full light while
 * the scene around it is dimmed, which is what a lit sheet over a darkened
 * room looks like.
 *
 * It is a `role="dialog"` named by its title and described by its text. Focus
 * lands on the first action when it rises, Tab and Shift+Tab stay inside it,
 * and it comes back to the trigger when the sheet lowers. The trigger carries
 * `aria-haspopup="dialog"` and `aria-expanded`. A drag on the handle is
 * pointer-only; the keyboard has Escape and the cross.
 */
export function LiquidSheet({
  open: openProp,
  defaultOpen,
  onOpenChange,
  trigger = 'Export scene',
  title = 'Export this scene',
  description = 'A PNG of the stage at twice its size, with every pane as it stands. The link opens the same scene in the studio.',
  actions = ACTIONS,
  onAction,
  radius = LIQUID_RADIUS,
  className,
}: LiquidSheetProps): ReactElement {
  const { pump } = useLiquidScene();
  const id = useId();
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const { mounted, shown } = useEnterExit(open, LOWER);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const slotRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<Drag | null>(null);
  /** focus goes back to the trigger when the sheet lowers on its own account */
  const restore = useRef(false);

  const r = pill(H.sheet, radius);
  const triggerR = pill(H.trigger, radius);
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  // Rising and lowering both move glass, so the scene paints through them.
  useEffect(() => {
    pump((open ? RISE : LOWER) + 200);
  }, [open, pump]);

  // Focus lands on the first action once the sheet is in the DOM.
  useEffect(() => {
    if (!open || !mounted) return;
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
  }, [open, mounted]);

  // And comes back to the trigger as the sheet lowers, if the sheet had it.
  useEffect(() => {
    if (open || !restore.current) return;
    restore.current = false;
    rootRef.current
      ?.querySelector<HTMLElement>('.lqc-sheet-trigger')
      ?.focus({ preventScroll: true });
  }, [open]);

  const close = useCallback(
    (focusTrigger: boolean) => {
      restore.current = focusTrigger;
      setOpen(false);
    },
    [setOpen],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') close(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  /** Tab stays inside the sheet while it is up. */
  const onDialogKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const stops = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled)'));
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  /* The handle: pull down and the sheet follows the finger, one to one. Let go
     past the threshold, or with a flick, and it lowers from where it was; let
     go short of it and it eases back up. The offset is one custom property
     written straight to the wrapper, so a move never renders. */
  const onGripDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return;
    drag.current = {
      id: event.pointerId,
      startY: event.clientY,
      y: 0,
      at: performance.now(),
      v: 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    slotRef.current?.setAttribute('data-drag', '');
  };
  const onGripMove = (event: PointerEvent<HTMLDivElement>): void => {
    const g = drag.current;
    if (!g || g.id !== event.pointerId) return;
    const now = performance.now();
    const y = Math.max(0, event.clientY - g.startY);
    g.v = (y - g.y) / Math.max(1, now - g.at);
    g.y = y;
    g.at = now;
    slotRef.current?.style.setProperty('--lqc-sheet-drag', `${y}px`);
    pump(120);
  };
  const onGripUp = (event: PointerEvent<HTMLDivElement>): void => {
    const g = drag.current;
    if (!g || g.id !== event.pointerId) return;
    drag.current = null;
    const slot = slotRef.current;
    slot?.removeAttribute('data-drag');
    if (g.y > DISMISS || g.v > FLICK) {
      // the lowering starts from where the finger left it
      close(true);
      return;
    }
    slot?.style.removeProperty('--lqc-sheet-drag');
    pump(RISE);
  };

  return (
    <div
      ref={rootRef}
      className={className ? `lqc-sheet ${className}` : 'lqc-sheet'}
      data-slot="liquid-sheet"
      data-state={open ? 'open' : 'closed'}
    >
      <LiquidSurface
        as="button"
        type="button"
        radius={triggerR}
        className="lqc-sheet-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {trigger}
      </LiquidSurface>

      {mounted && (
        <>
          {/* The dim over the scene. A press on it lowers the sheet; the strip
              must not read that press as the start of a scroll. */}
          <div
            className="lqc-sheet-scrim"
            data-shown={shown ? '' : undefined}
            data-no-drag=""
            aria-hidden="true"
            onClick={() => close(true)}
          />
          {/* The wrapper carries the rise and the drag; the pane inside never
              changes its box. */}
          <div ref={slotRef} className="lqc-sheet-slot" data-shown={shown ? '' : undefined}>
            <LiquidSurface
              radius={r}
              className="lqc-sheet-pane"
              contentClassName="lq-content-interactive lqc-sheet-content"
              style={{ '--lq-inner-r': `${inner(r, PAD)}px` } as LiquidCSS}
            >
              <div
                ref={dialogRef}
                role="dialog"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="lqc-sheet-dialog"
                inert={!open}
                onKeyDown={onDialogKey}
              >
                <div
                  className="lqc-sheet-grip"
                  aria-hidden="true"
                  onPointerDown={onGripDown}
                  onPointerMove={onGripMove}
                  onPointerUp={onGripUp}
                  onPointerCancel={onGripUp}
                >
                  <span className="lqc-sheet-handle" />
                </div>
                <h2 id={titleId} className="lqc-sheet-title">
                  {title}
                </h2>
                <p id={descriptionId} className="lqc-sheet-description">
                  {description}
                </p>
                <div className="lqc-sheet-actions">
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className="lqc-sheet-action"
                      data-primary={action.primary ? '' : undefined}
                      onClick={() => {
                        onAction?.(action.id);
                        close(true);
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="lqc-sheet-close"
                  aria-label="Close"
                  onClick={() => close(true)}
                >
                  <X />
                </button>
              </div>
            </LiquidSurface>
          </div>
        </>
      )}
    </div>
  );
}
