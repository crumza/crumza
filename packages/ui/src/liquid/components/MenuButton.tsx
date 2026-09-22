import { type KeyboardEvent, type ReactElement, useEffect, useRef } from 'react';
import {
  H,
  inner,
  isShowing,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  type LiquidCSS,
  LiquidSurface,
  pill,
  useControllableState,
  useDismiss,
  useMorphPhase,
  walk,
} from '../core';

export interface LiquidMenuButtonProps extends LiquidComponentProps {
  /** The rows of the menu. */
  readonly items?: readonly string[] | undefined;
  /** The row that is the current page, marked rather than reported again. */
  readonly current?: string | undefined;
  readonly onSelect?: ((item: string) => void) | undefined;
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly 'aria-label'?: string | undefined;
  readonly className?: string | undefined;
}

const SIZE = 52;
const PANEL_W = 224;
const PAD = 6;
const ROW_H = 40;
const ROW_GAP = 2;
/** Kept in step with menu-button.css. */
const OPEN = 280;
const CLOSE = 220;

const ITEMS = ['Overview', 'Material', 'Components', 'Pricing', 'Changelog'];

/**
 * A round with three bars that grows into a menu, and closes back into it.
 *
 * Press it and the two outer bars fold onto the middle one and turn into a
 * cross while the round grows right and down into a panel, the button staying
 * at its top-left corner where it was. The rows arrive from the top a beat
 * apart, out of a blur. A row, a press outside, or Escape closes it: the rows
 * blur out, the panel shrinks back into the round, and the cross opens into
 * the bars again.
 *
 * One pane whose box changes, never a transform, so its clone of the scene
 * stays aligned; the bars are three spans moved by transform above the glass,
 * so the compositor carries them and the filter is never repainted for them.
 *
 * `aria-haspopup="menu"` and `aria-expanded` on the button; a `role="menu"`
 * of `menuitem` buttons, the current one marked `aria-current="page"`. Focus
 * goes to the first row and comes back to the button.
 */
export function LiquidMenuButton({
  items = ITEMS,
  current = ITEMS[1],
  onSelect,
  open: openProp,
  defaultOpen,
  onOpenChange,
  'aria-label': ariaLabel = 'Menu',
  radius = LIQUID_RADIUS,
  className,
}: LiquidMenuButtonProps): ReactElement {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const phase = useMorphPhase(open, OPEN, CLOSE);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const restore = useRef(false);
  const r = pill(H.trigger, radius);

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
      buttonRef.current?.focus();
    }
  }, [phase, open]);

  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Tab') close(false);
    else walk(event, menuRef.current, '[role="menuitem"]', 'y');
  };

  const panelH = SIZE + items.length * ROW_H + (items.length - 1) * ROW_GAP + PAD;

  return (
    <div
      ref={rootRef}
      className={className ? `lqc-menubtn ${className}` : 'lqc-menubtn'}
      data-slot="liquid-menu-button"
      data-state={phase}
      style={
        {
          '--lqc-menubtn-size': `${SIZE}px`,
          '--lqc-menubtn-panel-w': `${PANEL_W}px`,
          '--lqc-menubtn-panel-h': `${panelH}px`,
          '--lqc-menubtn-row-r': `${inner(r, PAD)}px`,
        } as LiquidCSS
      }
    >
      <LiquidSurface
        radius={r}
        className="lqc-menubtn-glass"
        contentClassName="lq-content-interactive lqc-menubtn-content"
      >
        <button
          ref={buttonRef}
          type="button"
          className="lqc-menubtn-button"
          aria-label={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => (open ? close(true) : setOpen(true))}
        >
          <span className="lqc-menubtn-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        {isShowing(phase) && (
          <div
            ref={menuRef}
            role="menu"
            aria-label={ariaLabel}
            className="lqc-menubtn-menu"
            inert={phase === 'closing'}
            onKeyDown={onMenuKey}
          >
            {items.map((item, i) => (
              <button
                key={item}
                type="button"
                role="menuitem"
                className="lqc-menubtn-row"
                aria-current={item === current ? 'page' : undefined}
                style={{ '--at': i } as LiquidCSS}
                onClick={() => {
                  onSelect?.(item);
                  close(true);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </LiquidSurface>
    </div>
  );
}
