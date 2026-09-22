import { type KeyboardEvent, type ReactElement, useEffect, useId, useRef, useState } from 'react';
import {
  Command,
  CornerDownLeft,
  H,
  type IconComponent,
  inner,
  isShowing,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  type LiquidCSS,
  LiquidSurface,
  Moon,
  PaintbrushVertical,
  Palette,
  pill,
  Search,
  Settings2,
  Sparkles,
  Upload,
  useControllableState,
  useDismiss,
  useLiquidScene,
  useMorphPhase,
} from '../core';

export interface LiquidCommand {
  readonly id: string;
  readonly label: string;
  readonly icon: IconComponent;
  /** Shown at the trailing end of the row, as keys. */
  readonly shortcut?: string | undefined;
}

export interface LiquidCommandPaletteProps extends LiquidComponentProps {
  readonly commands?: readonly LiquidCommand[] | undefined;
  readonly onSelect?: ((id: string) => void) | undefined;
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly placeholder?: string | undefined;
  /** The label on the button at rest. */
  readonly trigger?: string | undefined;
  readonly className?: string | undefined;
}

const TRIGGER_W = 236;
const PANEL_W = 400;
const PAD = 6;
const FIELD_H = 52;
const ROW_H = 40;
const ROW_GAP = 2;
const EMPTY_H = 44;
/** Kept in step with command-palette.css. */
const OPEN = 300;
const CLOSE = 240;

const COMMANDS: readonly LiquidCommand[] = [
  { id: 'preset', label: 'Apply a preset', icon: Sparkles, shortcut: 'P' },
  { id: 'tint', label: 'Change the tint', icon: Palette, shortcut: 'T' },
  { id: 'paint', label: 'Repaint the scene', icon: PaintbrushVertical },
  { id: 'export', label: 'Export displacement map', icon: Upload, shortcut: 'E' },
  { id: 'dark', label: 'Toggle dark backdrop', icon: Moon, shortcut: 'D' },
  { id: 'settings', label: 'Open settings', icon: Settings2, shortcut: ',' },
];

/**
 * A button that becomes a command field, with the commands beneath it.
 *
 * At rest it is a pill with a search glyph, a label and the keys that open
 * it. Press it, or press them, and the pill widens and grows down into a
 * panel: the label becomes a field with the caret already in it, and the
 * commands arrive beneath as rows, a beat apart. Type and the rows that match
 * stay while the rest go, the panel taking the height of what is left. Up and
 * Down move the mark, Enter chooses, Escape or a press outside folds the
 * panel back into the pill.
 *
 * One pane whose box changes, never a transform. The trigger face and the
 * field face are content above the filtered layers and cross by opacity and
 * a little blur.
 *
 * The field is a `role="combobox"` over a `role="listbox"`, the marked row
 * its `aria-activedescendant`, so a screen reader hears the choice move
 * without focus leaving the field. The trigger carries `aria-expanded`.
 */
export function LiquidCommandPalette({
  commands = COMMANDS,
  onSelect,
  open: openProp,
  defaultOpen,
  onOpenChange,
  placeholder = 'Type a command',
  trigger = 'Search commands',
  radius = LIQUID_RADIUS,
  className,
}: LiquidCommandPaletteProps): ReactElement {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const { prewarm, pump } = useLiquidScene();
  const phase = useMorphPhase(open, OPEN, CLOSE);
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const restore = useRef(false);
  const [query, setQuery] = useState('');
  const [mark, setMark] = useState(0);
  const r = pill(H.menu, radius);

  const matches = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;
  const marked = matches[Math.min(mark, matches.length - 1)];

  const close = (focusTrigger: boolean): void => {
    restore.current = focusTrigger;
    setOpen(false);
  };
  useDismiss(open, rootRef, close);

  // Command or Control with K opens it from anywhere on the page.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (phase === 'opening' && open) inputRef.current?.focus({ preventScroll: true });
    if (phase === 'closing' && restore.current) {
      restore.current = false;
      triggerRef.current?.focus({ preventScroll: true });
    }
    if (phase === 'closed') {
      setQuery('');
      setMark(0);
    }
  }, [phase, open]);

  const choose = (command: LiquidCommand | undefined): void => {
    if (!command) return;
    onSelect?.(command.id);
    close(true);
  };

  const onFieldKey = (event: KeyboardEvent<HTMLInputElement>): void => {
    const n = matches.length;
    switch (event.key) {
      case 'ArrowDown':
        if (n) setMark((m) => (Math.min(m, n - 1) + 1) % n);
        break;
      case 'ArrowUp':
        if (n) setMark((m) => (Math.min(m, n - 1) - 1 + n) % n);
        break;
      case 'Home':
        setMark(0);
        break;
      case 'End':
        setMark(Math.max(0, n - 1));
        break;
      case 'Enter':
        choose(marked);
        break;
      case 'Tab':
        close(false);
        return;
      default:
        return;
    }
    event.preventDefault();
  };

  const listH = matches.length ? matches.length * ROW_H + (matches.length - 1) * ROW_GAP : EMPTY_H;
  const panelH = FIELD_H + listH + PAD;
  const showing = isShowing(phase);
  const listId = `${id}-list`;

  return (
    <div
      ref={rootRef}
      className={className ? `lqc-cmd ${className}` : 'lqc-cmd'}
      data-slot="liquid-command-palette"
      data-state={phase}
      onPointerEnter={() => prewarm(PANEL_W, panelH, r)}
      style={
        {
          '--lqc-cmd-trigger-w': `${TRIGGER_W}px`,
          '--lqc-cmd-panel-w': `${PANEL_W}px`,
          '--lqc-cmd-panel-h': `${panelH}px`,
          '--lqc-cmd-row-r': `${inner(r, PAD)}px`,
        } as LiquidCSS
      }
    >
      <LiquidSurface
        radius={r}
        className="lqc-cmd-glass"
        contentClassName="lq-content-interactive lqc-cmd-content"
      >
        {/* The pill's face. Inert while the field is showing. */}
        <button
          ref={triggerRef}
          type="button"
          className="lqc-cmd-trigger"
          aria-expanded={open}
          aria-haspopup="listbox"
          inert={showing}
          onClick={() => setOpen(true)}
        >
          <Search className="lqc-cmd-trigger-glyph" />
          <span className="lqc-cmd-trigger-label">{trigger}</span>
          <kbd className="lqc-cmd-keys">
            <Command />K
          </kbd>
        </button>

        {showing && (
          <div className="lqc-cmd-panel" inert={phase === 'closing'}>
            <div className="lqc-cmd-field">
              <Search className="lqc-cmd-field-glyph" />
              <input
                ref={inputRef}
                type="text"
                className="lqc-cmd-input"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={marked ? `${id}-${marked.id}` : undefined}
                aria-autocomplete="list"
                aria-label={trigger}
                placeholder={placeholder}
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setMark(0);
                  pump(400);
                }}
                onKeyDown={onFieldKey}
              />
              <kbd className="lqc-cmd-keys lqc-cmd-esc">esc</kbd>
            </div>
            <div id={listId} role="listbox" aria-label="Commands" className="lqc-cmd-list">
              {matches.length === 0 && <span className="lqc-cmd-empty">No commands match</span>}
              {matches.map((command, i) => (
                <button
                  key={command.id}
                  type="button"
                  role="option"
                  id={`${id}-${command.id}`}
                  aria-selected={command === marked}
                  className="lqc-cmd-row"
                  tabIndex={-1}
                  style={{ '--at': i } as LiquidCSS}
                  onPointerMove={() => setMark(i)}
                  onClick={() => choose(command)}
                >
                  <command.icon className="lqc-cmd-row-icon" />
                  <span className="lqc-cmd-row-label">{command.label}</span>
                  {command.shortcut && <kbd className="lqc-cmd-keys">{command.shortcut}</kbd>}
                  {command === marked && <CornerDownLeft className="lqc-cmd-row-enter" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </LiquidSurface>
    </div>
  );
}
