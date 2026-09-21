import { inner, LIQUID_RADIUS, type LiquidCSS, LiquidSurface, pill } from '@crumza/ui/liquid';
import { type KeyboardEvent, type ReactElement, useRef } from 'react';

/* The pieces on the studio floor. Each is a pane of the scene's glass with
   the reveal's glyphs on it: thin geometric shapes and a word or two, dark,
   because the floor is light. Geometry and states are in liquid.css. */

export type ShapeKind = 'circle' | 'triangle' | 'square' | 'hexagon';

export interface ShapeItem {
  readonly kind: ShapeKind;
  readonly label: string;
}

/** The menu's four rows, in the order the reveal shows them. */
export const SHAPES: readonly ShapeItem[] = [
  { kind: 'circle', label: 'One' },
  { kind: 'triangle', label: 'Two' },
  { kind: 'square', label: 'Three' },
  { kind: 'hexagon', label: 'Four' },
];

/** One of the reveal's shapes, drawn as an outline that fills when chosen. */
export function Shape({
  kind,
  filled = false,
}: {
  readonly kind: ShapeKind;
  readonly filled?: boolean;
}): ReactElement {
  return (
    <svg
      className="studio-shape"
      data-filled={filled || undefined}
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === 'circle' && <circle cx="12" cy="12" r="8" />}
      {kind === 'triangle' && <path d="M12 4.6 20.2 19H3.8z" />}
      {kind === 'square' && <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" />}
      {kind === 'hexagon' && <path d="M12 3.6 19.4 7.8v8.4L12 20.4 4.6 16.2V7.8z" />}
    </svg>
  );
}

type GlyphKind = 'left' | 'right' | 'plus' | 'close';

const GLYPHS: Record<GlyphKind, string> = {
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
};

/** A stroke glyph: the chevrons, the plus and the cross. */
export function Glyph({ kind }: { readonly kind: GlyphKind }): ReactElement {
  return (
    <svg
      className="studio-glyph"
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={GLYPHS[kind]} />
    </svg>
  );
}

/** Control height across the studio, so every pane's corner is the same curve. */
const CONTROL = 52;
const MENU_PAD = 8;

/**
 * The shape menu: a pane of rows, one chosen at a time. A radio group of
 * buttons, so the arrows move the choice and a press makes it.
 */
export function ShapeMenu({
  value,
  onChange,
}: {
  readonly value: number | null;
  readonly onChange: (index: number) => void;
}): ReactElement {
  const ref = useRef<HTMLDivElement | null>(null);
  const r = pill(CONTROL, LIQUID_RADIUS);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const n = SHAPES.length;
    let next: number;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = ((value ?? -1) + 1) % n;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = ((value ?? n) - 1 + n) % n;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = n - 1;
    else return;
    event.preventDefault();
    onChange(next);
    ref.current?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <div ref={ref} className="studio-menu-wrap" onKeyDown={onKeyDown}>
      <LiquidSurface
        radius={r}
        className="studio-menu"
        contentClassName="lq-content-interactive studio-menu-content"
        role="radiogroup"
        aria-label="Shape"
        style={{ '--lq-inner-r': `${inner(r, MENU_PAD)}px`, padding: MENU_PAD } as LiquidCSS}
      >
        {SHAPES.map((shape, i) => (
          <button
            key={shape.kind}
            type="button"
            role="radio"
            aria-checked={value === i}
            tabIndex={value === i || (value === null && i === 0) ? 0 : -1}
            className="studio-row"
            onClick={() => onChange(i)}
          >
            <Shape kind={shape.kind} filled={value === i} />
            <span className="studio-row-label">{shape.label}</span>
          </button>
        ))}
      </LiquidSurface>
    </div>
  );
}

/**
 * The pager: a pill of two chevrons and, beside it, a round cross. The
 * chevrons step the menu's choice and the cross clears it.
 */
export function Pager({
  onStep,
  onClear,
}: {
  readonly onStep: (direction: -1 | 1) => void;
  readonly onClear: () => void;
}): ReactElement {
  const r = pill(CONTROL, LIQUID_RADIUS);
  return (
    <div className="studio-pager">
      <LiquidSurface
        radius={r}
        className="studio-pill"
        contentClassName="lq-content-interactive studio-pill-content"
        role="group"
        aria-label="Step the shape"
        style={{ '--lq-inner-r': `${inner(r, 6)}px` } as LiquidCSS}
      >
        <button
          type="button"
          className="studio-glyph-button"
          aria-label="Previous shape"
          onClick={() => onStep(-1)}
        >
          <Glyph kind="left" />
        </button>
        <button
          type="button"
          className="studio-glyph-button"
          aria-label="Next shape"
          onClick={() => onStep(1)}
        >
          <Glyph kind="right" />
        </button>
      </LiquidSurface>
      <LiquidSurface
        as="button"
        type="button"
        radius={r}
        className="studio-round"
        aria-label="Clear the shape"
        onClick={onClear}
      >
        <Glyph kind="close" />
      </LiquidSurface>
    </div>
  );
}

/** The round plus. Pressed, the plus turns into a cross and stays until pressed again. */
export function RoundButton({
  pressed,
  onPressedChange,
}: {
  readonly pressed: boolean;
  readonly onPressedChange: (pressed: boolean) => void;
}): ReactElement {
  return (
    <LiquidSurface
      as="button"
      type="button"
      radius={LIQUID_RADIUS}
      className="studio-fab"
      aria-label="Add"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
    >
      <Glyph kind="plus" />
    </LiquidSurface>
  );
}

export interface Marks {
  readonly circle: boolean;
  readonly triangle: boolean;
}

/**
 * The trio: a circle, a triangle and Done, three separate panes in a row. The
 * two shapes are toggles that fill when pressed; Done puts the floor back the
 * way it was.
 */
export function Trio({
  marks,
  onMarksChange,
  onDone,
}: {
  readonly marks: Marks;
  readonly onMarksChange: (marks: Marks) => void;
  readonly onDone: () => void;
}): ReactElement {
  const r = pill(CONTROL, LIQUID_RADIUS);
  return (
    <div className="studio-trio">
      <LiquidSurface
        as="button"
        type="button"
        radius={r}
        className="studio-round"
        aria-label="Circle"
        aria-pressed={marks.circle}
        onClick={() => onMarksChange({ ...marks, circle: !marks.circle })}
      >
        <Shape kind="circle" filled={marks.circle} />
      </LiquidSurface>
      <LiquidSurface
        as="button"
        type="button"
        radius={r}
        className="studio-round"
        aria-label="Triangle"
        aria-pressed={marks.triangle}
        onClick={() => onMarksChange({ ...marks, triangle: !marks.triangle })}
      >
        <Shape kind="triangle" filled={marks.triangle} />
      </LiquidSurface>
      <LiquidSurface
        as="button"
        type="button"
        radius={r}
        className="studio-done"
        contentClassName="studio-done-content"
        onClick={onDone}
      >
        Done
      </LiquidSurface>
    </div>
  );
}
