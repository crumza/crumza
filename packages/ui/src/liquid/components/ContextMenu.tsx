import {
  type MouseEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ChevronRight,
  Copy,
  CornerUpLeft,
  H,
  type IconComponent,
  inner,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  type LiquidCSS,
  LiquidSurface,
  pill,
  Scissors,
  Sparkles,
  Trash2,
  useEnterExit,
  useLiquidScene,
} from '../core';

const EXIT = 180;
const MENU_W = 216;
const MENU_H = 226;
const SUB_W = 168;
const PANEL_PADDING = 6;

interface Row {
  readonly label: string;
  readonly Icon?: IconComponent;
  readonly shortcut?: string;
  readonly submenu?: readonly string[];
  readonly divider?: boolean;
  readonly danger?: boolean;
}

const ROWS: readonly Row[] = [
  { label: 'Copy optics', Icon: Copy, shortcut: '⌘C' },
  { label: 'Cut surface', Icon: Scissors, shortcut: '⌘X' },
  { label: 'Apply preset', Icon: Sparkles, submenu: ['Soft', 'Thick', 'Frosted', 'Cut'] },
  { label: '', divider: true },
  { label: 'Revert', Icon: CornerUpLeft, shortcut: '⌘Z' },
  { label: 'Delete', Icon: Trash2, danger: true },
];

interface Anchor {
  readonly x: number;
  readonly y: number;
  readonly flip: boolean;
}

/**
 * A glass menu that opens wherever the scene is right-clicked.
 *
 * The position is clamped against the scene rather than the viewport, because
 * the menu lives inside the stage: a menu allowed to run past the stage edge
 * would be clipped by it, and the part hanging over the edge would have no
 * scene left to sample. The submenu flips left when there is no room right.
 */
export function LiquidContextMenu({ radius = LIQUID_RADIUS }: LiquidComponentProps): ReactElement {
  const { pump } = useLiquidScene();
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [at, setAt] = useState<Anchor | null>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const { mounted, shown } = useEnterExit(!!at, EXIT);

  const r = pill(H.menu, radius);

  // opening and closing both move glass, so each pumps the scene
  const place = useCallback(
    (next: Anchor | null) => {
      setAt(next);
      pump(600);
    },
    [pump],
  );

  useEffect(() => {
    if (!at) return;
    const close = (): void => place(null);
    const onKey = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape') close();
    };
    // A pointerdown anywhere (including inside, which is a selection) closes,
    // matching how a native context menu behaves.
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [at, place]);

  const onContextMenu = (e: MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const field = fieldRef.current;
    if (!field) return;
    const b = field.getBoundingClientRect();
    const x = e.clientX - b.left;
    const y = e.clientY - b.top;
    setOpenSub(null);
    // On a scene narrower than the menu, the panel is capped by the stylesheet;
    // clamp against the width it will actually be drawn at, not the nominal one.
    const width = Math.min(MENU_W, b.width);
    place({
      x: Math.max(0, Math.min(x, b.width - width)),
      y: Math.max(0, Math.min(y, b.height - MENU_H)),
      // no room on the right for a submenu: open it to the left instead
      flip: x + width + SUB_W > b.width,
    });
  };

  const panelStyle = (width: number): LiquidCSS => ({
    '--lq-inner-r': `${inner(r, PANEL_PADDING)}px`,
    padding: PANEL_PADDING,
    width: `min(${width}px, var(--lq-room))`,
  });

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the whole stage is the right-click target; the menu it opens is a real role="menu" of buttons.
    <div
      ref={fieldRef}
      className="lqc-ctx-field"
      data-slot="liquid-context-menu"
      onContextMenu={onContextMenu}
    >
      <span className="lqc-ctx-hint">
        <span className="lqc-ctx-hint-pointer">Right-click anywhere on the scene</span>
        <span className="lqc-ctx-hint-touch">Long-press anywhere on the scene</span>
      </span>

      {mounted && at && (
        <div
          className="lqc-ctx-slot"
          style={{ left: at.x, top: at.y }}
          // the menu is its own pointer island: clicks inside must not be read
          // as the outside-click that closes it
          onPointerDown={(e) => e.stopPropagation()}
        >
          <LiquidSurface
            radius={r}
            className={`lqc-ctx-menu ${shown ? 'is-shown' : ''}`}
            contentClassName="lq-content-interactive lqc-ctx-content"
            role="menu"
            style={panelStyle(MENU_W)}
          >
            {ROWS.map((row) =>
              row.divider ? (
                <hr key="divider" className="lqc-ctx-divider" />
              ) : (
                <div
                  key={row.label}
                  className="lqc-ctx-row-wrap"
                  style={{ '--at': ROWS.indexOf(row) } as LiquidCSS}
                  onPointerEnter={() => setOpenSub(row.submenu ? row.label : null)}
                >
                  <button
                    type="button"
                    role="menuitem"
                    aria-haspopup={row.submenu ? 'menu' : undefined}
                    aria-expanded={row.submenu ? openSub === row.label : undefined}
                    className={`lqc-ctx-row ${row.danger ? 'is-danger' : ''} ${
                      openSub === row.label ? 'is-open' : ''
                    }`}
                    onClick={() => !row.submenu && place(null)}
                  >
                    {row.Icon && <row.Icon className="lqc-ctx-icon" />}
                    <span className="lqc-ctx-label">{row.label}</span>
                    {row.shortcut && <span className="lqc-ctx-shortcut">{row.shortcut}</span>}
                    {row.submenu && <ChevronRight className="lqc-ctx-caret" />}
                  </button>

                  {row.submenu && openSub === row.label && (
                    <div className={`lqc-ctx-sub ${at.flip ? 'is-flipped' : ''}`}>
                      <LiquidSurface
                        radius={r}
                        className="lqc-ctx-submenu is-shown"
                        contentClassName="lq-content-interactive lqc-ctx-content"
                        role="menu"
                        style={panelStyle(SUB_W)}
                      >
                        {row.submenu.map((item) => (
                          <button
                            key={item}
                            type="button"
                            role="menuitem"
                            className="lqc-ctx-row"
                            onClick={() => place(null)}
                          >
                            <span className="lqc-ctx-label">{item}</span>
                          </button>
                        ))}
                      </LiquidSurface>
                    </div>
                  )}
                </div>
              ),
            )}
          </LiquidSurface>
        </div>
      )}
    </div>
  );
}
