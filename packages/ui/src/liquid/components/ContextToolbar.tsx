import { type KeyboardEvent, type ReactElement, useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  H,
  inner,
  isShowing,
  Italic,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  type LiquidCSS,
  LiquidSurface,
  pill,
  Type,
  Underline,
  useControllableState,
  useDismiss,
  useLiquidScene,
  useMorphPhase,
  walk,
} from '../core';

export type LiquidAlign = 'left' | 'center' | 'right';

export interface LiquidTextFormat {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly align: LiquidAlign;
}

export interface LiquidContextToolbarProps extends LiquidComponentProps {
  readonly value?: LiquidTextFormat | undefined;
  readonly defaultValue?: LiquidTextFormat | undefined;
  readonly onValueChange?: ((value: LiquidTextFormat) => void) | undefined;
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly 'aria-label'?: string | undefined;
  readonly className?: string | undefined;
}

const SIZE = 44;
const BAR_W = 292;
const PAD = 4;
/** Px the bar sits above the round once it has arrived. */
const LIFT = 12;
/** Kept in step with context-toolbar.css. */
const OPEN = 320;
const CLOSE = 240;

const FORMAT: LiquidTextFormat = { bold: false, italic: false, underline: false, align: 'left' };
const ALIGNS: readonly {
  readonly id: LiquidAlign;
  readonly label: string;
  readonly Icon: typeof AlignLeft;
}[] = [
  { id: 'left', label: 'Align left', Icon: AlignLeft },
  { id: 'center', label: 'Align centre', Icon: AlignCenter },
  { id: 'right', label: 'Align right', Icon: AlignRight },
];

/**
 * A formatting toolbar that comes out of the icon that summons it.
 *
 * At rest it is a 44px round with a type glyph. Press it and a pane the same
 * size lifts off the round and, as it rises, widens into a toolbar above it,
 * its controls arriving from the middle out: bold, italic and underline as
 * toggles, then three alignments as a radio group. The round stays where it
 * was, so the bar has somewhere it came from and somewhere to go back to.
 * Press the round again, press outside, or Escape, and the bar narrows and
 * settles back down onto the round.
 *
 * The bar is a second pane whose box and position change by layout, never a
 * transform, so its clone stays aligned while it travels and the rim is built
 * on quantized maps on the way. The round never changes at all.
 *
 * The bar is a `role="toolbar"`, one Tab stop that the arrows walk; the
 * toggles carry `aria-pressed` and the alignments are `role="radio"` buttons
 * in a `radiogroup`. The round carries `aria-expanded`.
 */
export function LiquidContextToolbar({
  value,
  defaultValue = FORMAT,
  onValueChange,
  open: openProp,
  defaultOpen,
  onOpenChange,
  'aria-label': ariaLabel = 'Text format',
  radius = LIQUID_RADIUS,
  className,
}: LiquidContextToolbarProps): ReactElement {
  const [format, setFormat] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const { prewarm } = useLiquidScene();
  const phase = useMorphPhase(open, OPEN, CLOSE);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const restore = useRef(false);
  /** the bar is placed on the round for its first frame, then eased into place */
  const [lifted, setLifted] = useState(open);
  const r = pill(H.toggle, radius);

  const close = (focusButton: boolean): void => {
    restore.current = focusButton;
    setOpen(false);
  };
  useDismiss(open, rootRef, close);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => {
        setLifted(true);
        barRef.current?.querySelector<HTMLElement>('button')?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
    setLifted(false);
    if (restore.current) {
      restore.current = false;
      rootRef.current?.querySelector<HTMLElement>('.lqc-ctxbar-button')?.focus();
    }
    return undefined;
  }, [open]);

  const onBarKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Tab') close(false);
    else walk(event, barRef.current, 'button', 'x');
  };

  const flip = (key: 'bold' | 'italic' | 'underline'): void =>
    setFormat({ ...format, [key]: !format[key] });

  return (
    <div
      ref={rootRef}
      className={className ? `lqc-ctxbar ${className}` : 'lqc-ctxbar'}
      data-slot="liquid-context-toolbar"
      data-state={phase}
      onPointerEnter={() => prewarm(BAR_W, SIZE, r)}
      data-lifted={lifted ? '' : undefined}
      style={
        {
          '--lqc-ctxbar-size': `${SIZE}px`,
          '--lqc-ctxbar-w': `${BAR_W}px`,
          '--lqc-ctxbar-lift': `${LIFT}px`,
          '--lqc-ctxbar-slot-r': `${inner(r, PAD)}px`,
        } as LiquidCSS
      }
    >
      <LiquidSurface
        as="button"
        type="button"
        radius={r}
        className="lqc-ctxbar-button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => (open ? close(true) : setOpen(true))}
      >
        <Type />
      </LiquidSurface>
      {isShowing(phase) && (
        <LiquidSurface
          radius={r}
          className="lqc-ctxbar-bar"
          contentClassName="lq-content-interactive lqc-ctxbar-content"
        >
          <div
            ref={barRef}
            role="toolbar"
            aria-label={ariaLabel}
            className="lqc-ctxbar-tools"
            inert={phase === 'closing'}
            onKeyDown={onBarKey}
          >
            <button
              type="button"
              className="lqc-ctxbar-tool"
              aria-label="Bold"
              aria-pressed={format.bold}
              style={{ '--at': 2 } as LiquidCSS}
              onClick={() => flip('bold')}
            >
              <Bold />
            </button>
            <button
              type="button"
              className="lqc-ctxbar-tool"
              aria-label="Italic"
              aria-pressed={format.italic}
              style={{ '--at': 1 } as LiquidCSS}
              onClick={() => flip('italic')}
            >
              <Italic />
            </button>
            <button
              type="button"
              className="lqc-ctxbar-tool"
              aria-label="Underline"
              aria-pressed={format.underline}
              style={{ '--at': 0 } as LiquidCSS}
              onClick={() => flip('underline')}
            >
              <Underline />
            </button>
            <span className="lqc-ctxbar-divider" style={{ '--at': 0 } as LiquidCSS} />
            <div role="radiogroup" aria-label="Alignment" className="lqc-ctxbar-group">
              {ALIGNS.map((align, i) => (
                // biome-ignore lint/a11y/useSemanticElements: a native radio cannot be styled as a glass tool or pressed like one; the group carries the radio semantics.
                <button
                  key={align.id}
                  type="button"
                  role="radio"
                  className="lqc-ctxbar-tool"
                  aria-label={align.label}
                  aria-checked={format.align === align.id}
                  style={{ '--at': i } as LiquidCSS}
                  onClick={() => setFormat({ ...format, align: align.id })}
                >
                  <align.Icon />
                </button>
              ))}
            </div>
          </div>
        </LiquidSurface>
      )}
    </div>
  );
}
