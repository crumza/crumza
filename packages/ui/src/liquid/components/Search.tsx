import {
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  H,
  inner,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  LiquidDraggable,
  LiquidSurface,
  pill,
  Search,
  useEnterExit,
  useLiquidScene,
  X,
} from '../core';

const CORPUS = [
  'Refraction map',
  'Specular bevel',
  'Chromatic split',
  'Feather radius',
  'Tint multiply',
  'Corner curve',
];
const PANEL_PADDING = 6;
const EXIT = 220;
/** How long the field takes to grow from the round button to the bar. Kept in
 *  step with the width transition in search.css. */
const GROW = 380;

/**
 * A round glass search button that grows into a search field, with a glass
 * results panel beneath it.
 *
 * The grow is a width transition on the glass itself, so the engine rebuilds
 * the rim through it on quantized maps while the scene is pumped. The panel's
 * height tracks the number of matches, so every keystroke that changes the
 * count resizes a glass surface too. Escape, or focus leaving the component
 * with nothing typed, folds it back to the button.
 */
export function LiquidSearch({ radius = LIQUID_RADIUS }: LiquidComponentProps): ReactElement {
  const { pump } = useLiquidScene();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const r = pill(H.input, radius);

  const matches = query
    ? CORPUS.filter((item) => item.toLowerCase().includes(query.toLowerCase()))
    : [];
  const { mounted, shown } = useEnterExit(query.length > 0, EXIT);

  /** Grow or fold the field. Folding also clears, so the panel leaves with it. */
  const expand = (next: boolean): void => {
    setOpen(next);
    if (!next) setQuery('');
    pump(GROW + 400);
  };

  // the field is only worth opening to type in, so opening focuses it
  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true });
  }, [open]);

  // every keystroke can open, close or resize the panel, so each one pumps
  const search = (next: string): void => {
    setQuery(next);
    pump(700);
  };

  const onToggle = (): void => {
    if (!open) expand(true);
    else if (query) inputRef.current?.focus({ preventScroll: true });
    else expand(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    expand(false);
    toggleRef.current?.focus({ preventScroll: true });
  };

  /* Focus leaving the whole component with nothing typed folds it back up. A
     move between the field's own controls (the clear button, the toggle) is not
     a leave. */
  const onBlur = (e: FocusEvent<HTMLElement>): void => {
    if (!open || query) return;
    const next = e.relatedTarget;
    if (next instanceof Node && e.currentTarget.contains(next)) return;
    expand(false);
  };

  /* A press on the bare glass (to drag it) must not steal focus from the field,
     or the blur above would fold the bar the moment it is grabbed. Cancelling
     the pointerdown stops the focus change; the drag and the clicks still run. */
  const keepFocus = (e: PointerEvent<HTMLElement>): void => {
    if (e.target instanceof Element && !e.target.closest('button, input')) e.preventDefault();
  };

  return (
    <LiquidDraggable>
      <search
        className="lqc-search"
        data-slot="liquid-search"
        data-open={open || undefined}
        onBlur={onBlur}
        onPointerDown={keepFocus}
      >
        <LiquidSurface
          radius={r}
          className="lqc-search-field"
          contentClassName="lq-content-interactive lqc-search-field-content"
          data-open={open || undefined}
        >
          <button
            ref={toggleRef}
            type="button"
            className="lqc-search-toggle"
            aria-label="Search"
            aria-expanded={open}
            onClick={onToggle}
          >
            <Search className="lqc-search-icon" aria-hidden="true" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Search the material"
            aria-label="Search"
            disabled={!open}
            onChange={(e) => search(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {query && (
            <button
              type="button"
              className="lqc-search-clear"
              aria-label="Clear"
              onClick={() => {
                search('');
                inputRef.current?.focus({ preventScroll: true });
              }}
            >
              <X />
            </button>
          )}
        </LiquidSurface>

        {mounted && (
          <LiquidSurface
            radius={r}
            className={`lqc-search-results ${shown ? 'is-shown' : ''}`}
            contentClassName="lq-content-interactive lqc-search-list"
            role="listbox"
            aria-label="Matches"
            style={{ '--lq-inner-r': `${inner(r, PANEL_PADDING)}px`, padding: PANEL_PADDING }}
          >
            {matches.length > 0 ? (
              matches.map((item) => (
                <button key={item} type="button" role="option" className="lqc-search-item">
                  <Highlight text={item} query={query} />
                </button>
              ))
            ) : (
              <span className="lqc-search-empty">No matches</span>
            )}
          </LiquidSurface>
        )}
      </search>
    </LiquidDraggable>
  );
}

/** Marks the matched run so the result explains itself at a glance. */
function Highlight({ text, query }: { readonly text: string; readonly query: string }): ReactNode {
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}
