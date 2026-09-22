import { type KeyboardEvent, type ReactElement, useEffect, useRef } from 'react';
import {
  Camera,
  FolderPlus,
  H,
  type IconComponent,
  inner,
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
  useLiquidScene,
  useMorphPhase,
  walk,
} from '../core';

export interface LiquidPlusAction {
  /** What `onSelect` reports. */
  readonly id: string;
  readonly label: string;
  readonly icon: IconComponent;
}

export interface LiquidPlusButtonProps extends LiquidComponentProps {
  readonly actions?: readonly LiquidPlusAction[] | undefined;
  readonly onSelect?: ((id: string) => void) | undefined;
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /** Names the button and the menu. */
  readonly 'aria-label'?: string | undefined;
  readonly className?: string | undefined;
}

const SIZE = 56;
const PANEL_W = 208;
const PAD = 6;
const ROW_H = 40;
const ROW_GAP = 2;
/** Ms the round takes to grow into the panel, and to shrink back. Kept in step with plus-button.css. */
const OPEN = 260;
const CLOSE = 220;

const ACTIONS: readonly LiquidPlusAction[] = [
  { id: 'note', label: 'New note', icon: Pencil },
  { id: 'folder', label: 'New folder', icon: FolderPlus },
  { id: 'upload', label: 'Upload file', icon: Upload },
  { id: 'photo', label: 'Take a photo', icon: Camera },
];

/**
 * A round plus that grows into a small menu of actions, and shrinks back.
 *
 * At rest it is a 56px round with a plus. Press it and the round grows up and
 * out into a panel with the actions as rows, the plus turning a quarter into a
 * cross as it goes and staying where it was, at the panel's foot, so the thing
 * you pressed is still under your finger. The rows arrive a beat apart from
 * the bottom, out of a blur, nearest first. Choose one and it reports, and
 * the panel shrinks back into the round the way it came; so does a press
 * outside, or Escape.
 *
 * The round and the panel are ONE pane whose box changes, never a transform,
 * so the clone of the scene inside it stays aligned through the morph and the
 * engine builds the rim on quantized maps while the box moves.
 *
 * The button carries `aria-haspopup="menu"` and `aria-expanded`; the rows are
 * a `role="menu"` of `menuitem` buttons. Opening puts focus on the first row,
 * the arrows walk them and wrap, and Escape or a choice hands focus back.
 */
export function LiquidPlusButton({
  actions = ACTIONS,
  onSelect,
  open: openProp,
  defaultOpen,
  onOpenChange,
  'aria-label': ariaLabel = 'Create',
  radius = LIQUID_RADIUS,
  className,
}: LiquidPlusButtonProps): ReactElement {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const { prewarm } = useLiquidScene();
  const phase = useMorphPhase(open, OPEN, CLOSE);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const restore = useRef(false);
  const r = pill(H.button, radius);
  const showing = isShowing(phase);

  const close = (focusButton: boolean): void => {
    restore.current = focusButton;
    setOpen(false);
  };
  useDismiss(open, rootRef, close);

  // The first row takes focus once the rows exist; the button takes it back as the panel folds.
  useEffect(() => {
    if (phase === 'opening' && open)
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    if (phase === 'closing' && restore.current) {
      restore.current = false;
      buttonRef.current?.focus();
    }
  }, [phase, open]);

  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Tab') close(false);
    else walk(event, menuRef.current, '[role="menuitem"]', 'y');
  };

  const panelH = SIZE + PAD + actions.length * ROW_H + (actions.length - 1) * ROW_GAP;

  return (
    <div
      ref={rootRef}
      className={className ? `lqc-plus ${className}` : 'lqc-plus'}
      data-slot="liquid-plus-button"
      data-state={phase}
      onPointerEnter={() => prewarm(PANEL_W, panelH, r)}
      style={
        {
          '--lqc-plus-size': `${SIZE}px`,
          '--lqc-plus-panel-w': `${PANEL_W}px`,
          '--lqc-plus-panel-h': `${panelH}px`,
          '--lqc-plus-row-r': `${inner(r, PAD)}px`,
        } as LiquidCSS
      }
    >
      <LiquidSurface
        radius={r}
        className="lqc-plus-glass"
        contentClassName="lq-content-interactive lqc-plus-content"
      >
        {showing && (
          <div
            ref={menuRef}
            role="menu"
            aria-label={ariaLabel}
            className="lqc-plus-menu"
            inert={phase === 'closing'}
            onKeyDown={onMenuKey}
          >
            {actions.map((action, i) => (
              <button
                key={action.id}
                type="button"
                role="menuitem"
                className="lqc-plus-row"
                style={{ '--at': actions.length - 1 - i } as LiquidCSS}
                onClick={() => {
                  onSelect?.(action.id);
                  close(true);
                }}
              >
                <action.icon className="lqc-plus-row-icon" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
        <button
          ref={buttonRef}
          type="button"
          className="lqc-plus-button"
          aria-label={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => (open ? close(true) : setOpen(true))}
        >
          <Plus className="lqc-plus-glyph" />
        </button>
      </LiquidSurface>
    </div>
  );
}
