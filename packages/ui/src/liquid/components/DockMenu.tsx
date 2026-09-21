import {
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Archive,
  ArrowLeft,
  Briefcase,
  ChevronRight,
  ChevronsUpDown,
  H,
  Heart,
  House,
  type IconComponent,
  IdCard,
  inner,
  LIQUID_RADIUS,
  Lightbulb,
  type LiquidComponentProps,
  type LiquidCSS,
  LiquidSurface,
  LogOut,
  PaintbrushVertical,
  pill,
  Search,
  Settings2,
  Sparkles,
  User,
  UserPlus,
  useControllableState,
  useLiquidScene,
} from '../core';

export interface LiquidDockMenuItem {
  /** What `onSelect` reports, and what a page of the menu is keyed by. */
  readonly id: string;
  readonly label: string;
  readonly icon: IconComponent;
  /** Rows of a page of its own. An item with these turns the menu to that page
   *  rather than choosing; the page opens with a Back row above them. */
  readonly items?: readonly LiquidDockMenuItem[] | undefined;
}

export interface LiquidDockMenuProps extends LiquidComponentProps {
  /** The menu, top level first. The first four are also the pill's glyphs;
   *  the fifth slot in the pill is always More, which unfolds the whole list. */
  readonly items?: readonly LiquidDockMenuItem[] | undefined;
  /** Whether the pill is unfolded into the menu. Leave it out for uncontrolled. */
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /** An item without a page was chosen, in the pill or in the menu. */
  readonly onSelect?: ((id: string) => void) | undefined;
  /** Names the pill and the menu for assistive technology. */
  readonly 'aria-label'?: string | undefined;
  readonly className?: string | undefined;
}

/** The pill's own items; the rest of the list is reached through More. */
const DOCK_SLOTS = 4;
/** One glyph's button in the pill, and the hairline between two. */
const SLOT = 36;
const SLOT_GAP = 1;
const DOCK_PAD = 4;
/** The panel's inset and its rows. */
const PANEL_PAD = 8;
const ROW_H = 32;
const ROW_GAP = 2;
/** Ms the glass takes to grow into the panel and to fold back into the pill.
 *  Kept in step with lqc-dockmenu-open and lqc-dockmenu-close in dock-menu.css. */
const OPEN = 200;
const CLOSE = 220;
/** Ms the rows take to leave before the next page arrives (lqc-dockmenu-row-out). */
const LEAVE = 50;
/** Ms the rows wait before arriving: on open, long enough for the glass to
 *  have grown under them; on a page turn, a beat. */
const ARRIVE_OPEN = 170;
const ARRIVE_TURN = 40;

const ITEMS: readonly LiquidDockMenuItem[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'discover', label: 'Discover', icon: Search },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  {
    id: 'notebooks',
    label: 'Notebooks',
    icon: Archive,
    items: [
      { id: 'personal', label: 'Personal', icon: User },
      { id: 'work', label: 'Work', icon: Briefcase },
      { id: 'ideas', label: 'Ideas', icon: Lightbulb },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings2,
    items: [
      { id: 'profile', label: 'Profile', icon: IdCard },
      { id: 'appearance', label: 'Appearance', icon: PaintbrushVertical },
      { id: 'upgrade', label: 'Upgrade', icon: Sparkles },
      { id: 'invite', label: 'Invite a friend', icon: UserPlus },
      { id: 'sign-out', label: 'Sign out', icon: LogOut },
    ],
  },
];

type Phase = 'dock' | 'opening' | 'menu' | 'closing';

/** Which page of the menu is showing, and how it should arrive. */
interface Page {
  /** ids from the top level down to the page; empty is the top level */
  readonly path: readonly string[];
  /** ms the rows wait before they arrive */
  readonly arrive: number;
  /** row to focus once the page has rendered, Back counted; null leaves focus alone */
  readonly focus: number | null;
}

const TOP: Page = { path: [], arrive: ARRIVE_OPEN, focus: null };

/** The rows of the page at `path`. */
function rowsAt(
  items: readonly LiquidDockMenuItem[],
  path: readonly string[],
): readonly LiquidDockMenuItem[] {
  let rows = items;
  for (const id of path) rows = rows.find((item) => item.id === id)?.items ?? [];
  return rows;
}

/** The panel's height for a page: its rows, the hairlines between them, the inset. */
const panelHeight = (rows: number): number =>
  2 * PANEL_PAD + rows * ROW_H + Math.max(0, rows - 1) * ROW_GAP;

/**
 * A pill of glyphs that unfolds into a menu.
 *
 * At rest it is a dock: the first four items as glyphs, with a label over the
 * one you point at, and More. Press More and the pill squashes to a bar, then
 * grows up and out into a panel with the whole list as rows, which arrive a
 * beat apart from the top. A row with a page of its own turns the menu to that
 * page: the rows blur out, the panel takes the new page's height, and the new
 * rows arrive behind a Back row. A press outside, or Escape, folds the panel
 * back down into the pill the same way it came.
 *
 * The pill and the panel are ONE pane of glass whose box changes, never a
 * transform: a scaled lens would carry its clone of the scene off the scene
 * behind it, where a box that grows keeps every pixel of the clone aligned.
 * The engine builds the rim on a quantized size while the box is moving and
 * the exact size once it settles, so the whole morph costs a handful of cached
 * maps. The two faces, glyphs and rows, are content above the filtered layers,
 * so their blur and fade are the compositor's and never touch the filter.
 *
 * It is a `role="menu"` of `menuitem` buttons while unfolded: the arrows walk
 * it, Right turns to a page and Left comes back, Escape folds it and hands
 * focus back to More. The pill's buttons are labelled, and the label over the
 * pointed-at glyph is the same name shown to sighted readers.
 */
export function LiquidDockMenu({
  items = ITEMS,
  open: openProp,
  defaultOpen,
  onOpenChange,
  onSelect,
  'aria-label': ariaLabel = 'Menu',
  radius = LIQUID_RADIUS,
  className,
}: LiquidDockMenuProps): ReactElement {
  const { pump, prewarm } = useLiquidScene();
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const [phase, setPhase] = useState<Phase>(open ? 'menu' : 'dock');
  const [page, setPage] = useState<Page>(TOP);
  const [leaving, setLeaving] = useState(false);
  // The label over the pill: which slot, and whether it is showing. The slot
  // is kept while it hides so the label fades where it was rather than jumping.
  const [tip, setTip] = useState({ at: 0, on: false });

  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLButtonElement | null>(null);
  const turnTimer = useRef(0);
  /** focus goes back to More once the panel starts folding */
  const restore = useRef(false);
  /** the page whose focus request has been honoured */
  const focused = useRef<Page | null>(null);

  const r = pill(H.menu, radius);
  const dock = items.slice(0, DOCK_SLOTS);
  const slots = dock.length + 1;
  const pillW = 2 * DOCK_PAD + slots * SLOT + (slots - 1) * SLOT_GAP;
  const rows = rowsAt(items, page.path);
  const paged = page.path.length > 0;
  const rowCount = rows.length + (paged ? 1 : 0);
  const showing = phase === 'opening' || phase === 'menu';
  const pageLabel = paged
    ? (rowsAt(items, page.path.slice(0, -1)).find((item) => item.id === page.path.at(-1))?.label ??
      ariaLabel)
    : ariaLabel;

  // The glass follows `open` through a phase on each side, so the panel exists
  // while it grows and the pill is back before the rows have gone. Both moves
  // change the box, so the scene keeps painting for their length.
  useEffect(() => {
    setPhase((current) => {
      if (open) return current === 'menu' ? current : 'opening';
      return current === 'dock' ? current : 'closing';
    });
    pump((open ? OPEN : CLOSE) + 300);
    const t = window.setTimeout(
      () => {
        setPhase(open ? 'menu' : 'dock');
        // folded, the menu is back at its top level for whoever opens it next
        if (!open) setPage(TOP);
      },
      open ? OPEN : CLOSE,
    );
    return () => window.clearTimeout(t);
  }, [open, pump]);

  useEffect(() => () => window.clearTimeout(turnTimer.current), []);

  // A page that asked for focus gets it once its rows are in the DOM: on open
  // that is a render after the phase moves off the pill.
  useEffect(() => {
    if (phase === 'dock' || page.focus === null || focused.current === page) return;
    focused.current = page;
    const all = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (!all || all.length === 0) return;
    all[Math.min(page.focus, all.length - 1)]?.focus();
  }, [page, phase]);

  // Focus comes back to More as the panel folds, once the pill is no longer inert.
  useEffect(() => {
    if (phase !== 'closing' || !restore.current) return;
    restore.current = false;
    moreRef.current?.focus();
  }, [phase]);

  /** Fold the panel; `focusMore` says whether focus comes back to the More button. */
  const close = useCallback(
    (focusMore: boolean) => {
      restore.current = focusMore;
      setOpen(false);
    },
    [setOpen],
  );

  // A press anywhere outside folds it, and so does Escape, as a menu does. A
  // press outside takes focus back only if the menu had it, so a click on
  // something focusable out there keeps the focus it is about to be given.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: globalThis.PointerEvent): void => {
      const root = rootRef.current;
      if (!root || !(event.target instanceof Node) || root.contains(event.target)) return;
      close(root.contains(document.activeElement));
    };
    const onKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') close(true);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  /** Unfold onto a page, with focus on one of its rows. */
  const unfold = (path: readonly string[], focus: number): void => {
    setPage({ path, arrive: ARRIVE_OPEN, focus });
    setOpen(true);
  };

  /** Turn to another page: the rows leave, then the next page arrives. */
  const turn = (path: readonly string[], focus: number | null): void => {
    window.clearTimeout(turnTimer.current);
    setLeaving(true);
    pump(LEAVE + 400);
    turnTimer.current = window.setTimeout(() => {
      setLeaving(false);
      setPage({ path, arrive: ARRIVE_TURN, focus });
    }, LEAVE);
  };

  const back = (): void => {
    const parentPath = page.path.slice(0, -1);
    const id = page.path.at(-1);
    const parentRows = rowsAt(items, parentPath);
    const at = parentRows.findIndex((item) => item.id === id);
    // the row that opened this page takes focus again, Back counted on a deeper page
    turn(parentPath, at < 0 ? 0 : at + (parentPath.length > 0 ? 1 : 0));
  };

  const choose = (item: LiquidDockMenuItem, fromDock: boolean): void => {
    if (item.items) {
      // a page of the menu, reached from the pill or from a row; focus lands
      // on its first row past Back
      if (fromDock) unfold([item.id], 1);
      else turn([...page.path, item.id], 1);
      return;
    }
    onSelect?.(item.id);
    if (!fromDock) close(true);
  };

  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    const menu = menuRef.current;
    if (!menu) return;
    const all = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const n = all.length;
    const i = all.indexOf(document.activeElement as HTMLElement);
    switch (event.key) {
      case 'ArrowDown':
        all[(i + 1) % n]?.focus();
        break;
      case 'ArrowUp':
        all[(i - 1 + n) % n]?.focus();
        break;
      case 'Home':
        all[0]?.focus();
        break;
      case 'End':
        all[n - 1]?.focus();
        break;
      case 'ArrowRight': {
        const item = rows[i - (paged ? 1 : 0)];
        if (!item?.items) return;
        choose(item, false);
        break;
      }
      case 'ArrowLeft':
        if (!paged) return;
        back();
        break;
      case 'Tab':
        // focus is leaving: the menu folds and Tab goes where it was going
        close(false);
        return;
      default:
        return;
    }
    event.preventDefault();
  };

  /** Point at a glyph and its name appears over it. A tap has no hover to name. */
  const onSlotEnter = (event: PointerEvent<HTMLButtonElement>, at: number): void => {
    if (event.pointerType === 'touch') return;
    setTip({ at, on: true });
  };
  const onSlotFocus = (event: FocusEvent<HTMLButtonElement>, at: number): void => {
    if (event.target.matches(':focus-visible')) setTip({ at, on: true });
  };
  const hideTip = (): void => setTip((current) => ({ ...current, on: false }));

  /** The panel is about to be needed: have its map ready before it grows. */
  const warm = (): void => {
    const root = rootRef.current;
    if (root) prewarm(root.clientWidth, panelHeight(items.length), r);
  };

  const tipLabel = tip.at < dock.length ? (dock[tip.at]?.label ?? '') : 'More';

  return (
    <div
      ref={rootRef}
      className={className ? `lqc-dockmenu ${className}` : 'lqc-dockmenu'}
      data-slot="liquid-dock-menu"
      data-state={phase}
      style={
        {
          '--lqc-dockmenu-h': `${panelHeight(rowCount)}px`,
          '--lqc-dockmenu-pill': `${pillW}px`,
          '--lqc-dockmenu-slots': slots,
          '--lqc-dockmenu-item-r': `${inner(r, DOCK_PAD)}px`,
          '--lqc-dockmenu-row-r': `${inner(r, PANEL_PAD)}px`,
        } as LiquidCSS
      }
    >
      <LiquidSurface
        radius={r}
        className="lqc-dockmenu-glass"
        contentClassName="lq-content-interactive lqc-dockmenu-content"
      >
        {/* The pill's face. Inert while the rows are showing, so Tab cannot
            reach a glyph that has faded out. */}
        <nav
          className="lqc-dockmenu-dock"
          aria-label={ariaLabel}
          inert={showing}
          onPointerEnter={warm}
          onPointerLeave={hideTip}
        >
          {dock.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className="lqc-dockmenu-item"
              aria-label={item.label}
              aria-haspopup={item.items ? 'menu' : undefined}
              onPointerEnter={(event) => onSlotEnter(event, i)}
              onFocus={(event) => onSlotFocus(event, i)}
              onBlur={hideTip}
              onClick={() => choose(item, true)}
            >
              <item.icon />
            </button>
          ))}
          <button
            ref={moreRef}
            type="button"
            className="lqc-dockmenu-item"
            aria-label="More"
            aria-haspopup="menu"
            aria-expanded={open}
            onPointerEnter={(event) => onSlotEnter(event, dock.length)}
            onFocus={(event) => onSlotFocus(event, dock.length)}
            onBlur={hideTip}
            onClick={() => (open ? close(true) : unfold([], 0))}
          >
            <ChevronsUpDown />
          </button>
        </nav>

        {/* The panel's face: one page at a time, re-keyed by page so its rows
            arrive afresh. Inert while folding, so nothing in it can be reached
            after the fold began. */}
        {phase !== 'dock' && (
          <div
            key={page.path.join('/')}
            ref={menuRef}
            role="menu"
            aria-label={pageLabel}
            className="lqc-dockmenu-menu"
            data-leaving={leaving || undefined}
            inert={phase === 'closing'}
            style={{ '--lqc-dockmenu-arrive': `${page.arrive}ms` } as LiquidCSS}
            onKeyDown={onMenuKey}
          >
            {paged && (
              <button
                type="button"
                role="menuitem"
                className="lqc-dockmenu-row"
                style={{ '--at': 0 } as LiquidCSS}
                onClick={back}
              >
                <ArrowLeft className="lqc-dockmenu-row-icon" />
                <span className="lqc-dockmenu-row-label">Back</span>
              </button>
            )}
            {rows.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className="lqc-dockmenu-row"
                aria-haspopup={item.items ? 'menu' : undefined}
                style={{ '--at': i + (paged ? 1 : 0) } as LiquidCSS}
                onClick={() => choose(item, false)}
              >
                <item.icon className="lqc-dockmenu-row-icon" />
                <span className="lqc-dockmenu-row-label">{item.label}</span>
                {item.items && <ChevronRight className="lqc-dockmenu-row-caret" />}
              </button>
            ))}
          </div>
        )}
      </LiquidSurface>

      {/* The name of the glyph under the pointer, over the pill. It repeats the
          button's own label, so assistive technology already has it. */}
      <span
        className="lqc-dockmenu-tip"
        aria-hidden="true"
        data-show={tip.on && phase === 'dock' ? '' : undefined}
        style={{ '--i': tip.at } as LiquidCSS}
      >
        {tipLabel}
      </span>
    </div>
  );
}
