import { type KeyboardEvent, type ReactElement, useEffect, useRef } from 'react';
import {
  Bookmark,
  H,
  type IconComponent,
  inner,
  isShowing,
  Link,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  type LiquidCSS,
  LiquidSurface,
  MessageCircle,
  pill,
  Share,
  Sparkles,
  useControllableState,
  useDismiss,
  useMorphPhase,
  walk,
  X,
} from '../core';

export interface LiquidPillAction {
  readonly id: string;
  readonly label: string;
  readonly icon: IconComponent;
}

export interface LiquidActionPillProps extends LiquidComponentProps {
  readonly actions?: readonly LiquidPillAction[] | undefined;
  readonly onSelect?: ((id: string) => void) | undefined;
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /** Names the toggle and the row of actions. */
  readonly 'aria-label'?: string | undefined;
  readonly className?: string | undefined;
}

const SIZE = 48;
const PAD = 4;
const SLOT = 40;
const GAP = 2;
/** Kept in step with action-pill.css. */
const OPEN = 300;
const CLOSE = 240;

const ACTIONS: readonly LiquidPillAction[] = [
  { id: 'share', label: 'Share', icon: Share },
  { id: 'link', label: 'Copy link', icon: Link },
  { id: 'save', label: 'Save', icon: Bookmark },
  { id: 'comment', label: 'Comment', icon: MessageCircle },
];

/**
 * A round with one glyph that widens into a row of actions, and narrows back.
 *
 * Press the round and it widens to the right into a pill, the glyph turning
 * into a cross where it is, at the leading end, and the actions arriving one
 * after another from the leading edge, out of a blur, each a beat behind the
 * last, so the pill seems to pour rather than appear. Choose one, press the
 * cross, press outside, or Escape, and it narrows back.
 *
 * One pane whose width changes, never a transform. The glyphs are content
 * above the filtered layers, so their blur and fade are the compositor's.
 *
 * The toggle carries `aria-expanded`; the row is a `role="toolbar"` of
 * labelled buttons, one Tab stop, the arrows walking it and wrapping.
 */
export function LiquidActionPill({
  actions = ACTIONS,
  onSelect,
  open: openProp,
  defaultOpen,
  onOpenChange,
  'aria-label': ariaLabel = 'Actions',
  radius = LIQUID_RADIUS,
  className,
}: LiquidActionPillProps): ReactElement {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const phase = useMorphPhase(open, OPEN, CLOSE);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const restore = useRef(false);
  const r = pill(H.tab, radius);

  const close = (focusToggle: boolean): void => {
    restore.current = focusToggle;
    setOpen(false);
  };
  useDismiss(open, rootRef, close);

  useEffect(() => {
    if (phase === 'opening' && open) barRef.current?.querySelector<HTMLElement>('button')?.focus();
    if (phase === 'closing' && restore.current) {
      restore.current = false;
      toggleRef.current?.focus();
    }
  }, [phase, open]);

  const onBarKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Tab') close(false);
    else walk(event, barRef.current, 'button', 'x');
  };

  const openW = SIZE + actions.length * (SLOT + GAP) + PAD;

  return (
    <div
      ref={rootRef}
      className={className ? `lqc-pill ${className}` : 'lqc-pill'}
      data-slot="liquid-action-pill"
      data-state={phase}
      style={
        {
          '--lqc-pill-size': `${SIZE}px`,
          '--lqc-pill-open-w': `${openW}px`,
          '--lqc-pill-slot-r': `${inner(r, PAD)}px`,
        } as LiquidCSS
      }
    >
      <LiquidSurface
        radius={r}
        className="lqc-pill-glass"
        contentClassName="lq-content-interactive lqc-pill-content"
      >
        <button
          ref={toggleRef}
          type="button"
          className="lqc-pill-toggle"
          aria-label={ariaLabel}
          aria-expanded={open}
          onClick={() => (open ? close(true) : setOpen(true))}
        >
          <Sparkles className="lqc-pill-glyph lqc-pill-glyph-idle" />
          <X className="lqc-pill-glyph lqc-pill-glyph-open" />
        </button>
        {isShowing(phase) && (
          <div
            ref={barRef}
            role="toolbar"
            aria-label={ariaLabel}
            className="lqc-pill-bar"
            inert={phase === 'closing'}
            onKeyDown={onBarKey}
          >
            {actions.map((action, i) => (
              <button
                key={action.id}
                type="button"
                className="lqc-pill-action"
                aria-label={action.label}
                style={{ '--at': i } as LiquidCSS}
                onClick={() => {
                  onSelect?.(action.id);
                  close(true);
                }}
              >
                <action.icon />
              </button>
            ))}
          </div>
        )}
      </LiquidSurface>
    </div>
  );
}
