import { type ReactElement, type ReactNode, useState } from 'react';
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

/**
 * A glass search field with a glass results panel.
 *
 * The panel's height tracks the number of matches, so every keystroke that
 * changes the count resizes a glass surface. That is the one thing the engine
 * cannot see coming, and the one thing that needs a pump.
 */
export function LiquidSearch({ radius = LIQUID_RADIUS }: LiquidComponentProps): ReactElement {
  const { pump } = useLiquidScene();
  const [query, setQuery] = useState('');
  const r = pill(H.input, radius);

  const matches = query
    ? CORPUS.filter((item) => item.toLowerCase().includes(query.toLowerCase()))
    : [];
  const { mounted, shown } = useEnterExit(query.length > 0, EXIT);

  // every keystroke can open, close or resize the panel, so each one pumps
  const search = (next: string): void => {
    setQuery(next);
    pump(700);
  };

  return (
    <LiquidDraggable>
      <div className="lqc-search" data-slot="liquid-search">
        <LiquidSurface
          radius={r}
          className="lqc-search-field"
          contentClassName="lq-content-interactive lqc-search-field-content"
        >
          <Search className="lqc-search-icon" aria-hidden="true" />
          <input
            type="text"
            value={query}
            placeholder="Search the material"
            aria-label="Search"
            onChange={(e) => search(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="lqc-search-clear"
              aria-label="Clear"
              onClick={() => search('')}
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
      </div>
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
