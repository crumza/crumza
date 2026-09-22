import { type KeyboardEvent, type ReactElement, useEffect, useRef } from 'react';
import {
  Camera,
  H,
  type IconComponent,
  isShowing,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  type LiquidCSS,
  LiquidSurface,
  Pencil,
  pill,
  Plus,
  Upload,
  useControllableState,
  useDismiss,
  useMorphPhase,
  walk,
} from '../core';

export interface LiquidDockAction {
  readonly id: string;
  readonly label: string;
  readonly icon: IconComponent;
}

export interface LiquidActionDockProps extends LiquidComponentProps {
  /** Up to five; they fan out in an arc over the button. */
  readonly actions?: readonly LiquidDockAction[] | undefined;
  readonly onSelect?: ((id: string) => void) | undefined;
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly 'aria-label'?: string | undefined;
  readonly className?: string | undefined;
}

const SIZE = 56;
const SATELLITE = 44;
/** Px from the button's centre to a satellite's centre. */
const REACH = 88;
/** Kept in step with action-dock.css. */
const OPEN = 380;
const CLOSE = 260;

const ACTIONS: readonly LiquidDockAction[] = [
  { id: 'write', label: 'Write', icon: Pencil },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'photo', label: 'Photo', icon: Camera },
];

/**
 * A round button whose actions emerge from behind it, and go back in.
 *
 * Press the round and small rounds come out from under it, one after another,
 * and settle in an arc over it, each on the set's one damped curve with a
 * hair of carry and no bounce; the plus turns a quarter into a cross. Choose
 * one and they all go back in, the way they came, nearest last. So does a
 * press outside, or Escape.
 *
 * Every satellite is its own pane of the scene's glass, so each bends what is
 * behind it where it lands. The move is a translate on a wrapper around each,
 * so no pane changes size: four panes of two sizes cost two cached maps, and
 * the engine only repositions their clones on the frames they travel.
 *
 * The button carries `aria-haspopup="menu"` and `aria-expanded`; the
 * satellites are a `role="menu"` of labelled `menuitem` buttons that the
 * arrows walk. Focus goes to the first and comes back to the button.
 */
export function LiquidActionDock({
  actions = ACTIONS,
  onSelect,
  open: openProp,
  defaultOpen,
  onOpenChange,
  'aria-label': ariaLabel = 'Create',
  radius = LIQUID_RADIUS,
  className,
}: LiquidActionDockProps): ReactElement {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const phase = useMorphPhase(open, OPEN, CLOSE);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const restore = useRef(false);
  const r = pill(H.button, radius);
  const satelliteR = pill(SATELLITE, radius);
  const n = Math.min(actions.length, 5);

  const close = (focusButton: boolean): void => {
    restore.current = focusButton;
    setOpen(false);
  };
  useDismiss(open, rootRef, close);

  useEffect(() => {
    if (phase === 'opening' && open)
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    if (phase === 'closing' && restore.current) {
      restore.current = false;
      rootRef.current?.querySelector<HTMLElement>('.lqc-fab-button')?.focus();
    }
  }, [phase, open]);

  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Tab') close(false);
    else walk(event, menuRef.current, '[role="menuitem"]');
  };

  /* The arc: from left to right over the button, its span growing with the
     count so two sit at ten and two o'clock and five fill the half circle. */
  const span = n <= 1 ? 0 : Math.min(Math.PI, (Math.PI / 4) * (n - 1) + Math.PI / 4);
  const place = (i: number): { x: number; y: number } => {
    const angle = Math.PI / 2 + (n <= 1 ? 0 : -span / 2 + (span * i) / (n - 1));
    return { x: Math.cos(angle) * REACH, y: -Math.sin(angle) * REACH };
  };

  return (
    <div
      ref={rootRef}
      className={className ? `lqc-fab ${className}` : 'lqc-fab'}
      data-slot="liquid-action-dock"
      data-state={phase}
      style={
        {
          '--lqc-fab-size': `${SIZE}px`,
          '--lqc-fab-satellite': `${SATELLITE}px`,
          '--lqc-fab-reach': `${REACH}px`,
          '--lqc-fab-n': n,
        } as LiquidCSS
      }
    >
      {isShowing(phase) && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={ariaLabel}
          className="lqc-fab-menu"
          inert={phase === 'closing'}
          onKeyDown={onMenuKey}
        >
          {actions.slice(0, n).map((action, i) => {
            const at = place(i);
            return (
              <div
                key={action.id}
                className="lqc-fab-slot"
                style={
                  {
                    '--at': i,
                    '--from-end': n - 1 - i,
                    '--x': `${at.x.toFixed(1)}px`,
                    '--y': `${at.y.toFixed(1)}px`,
                  } as LiquidCSS
                }
              >
                <LiquidSurface
                  as="button"
                  type="button"
                  role="menuitem"
                  radius={satelliteR}
                  className="lqc-fab-satellite"
                  aria-label={action.label}
                  onClick={() => {
                    onSelect?.(action.id);
                    close(true);
                  }}
                >
                  <action.icon />
                </LiquidSurface>
              </div>
            );
          })}
        </div>
      )}
      <LiquidSurface
        as="button"
        type="button"
        radius={r}
        className="lqc-fab-button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close(true) : setOpen(true))}
      >
        <Plus className="lqc-fab-glyph" />
      </LiquidSurface>
    </div>
  );
}
