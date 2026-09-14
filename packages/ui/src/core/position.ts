/**
 * Pure anchor positioning: rects in, coordinates out. No DOM, so the web hook measures
 * with getBoundingClientRect and a native renderer can measure with measureInWindow.
 */

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'start' | 'center' | 'end';

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PositionInput {
  readonly anchor: Rect;
  /** Only width and height are read. */
  readonly floating: Rect;
  /** The area the floating box must stay inside, usually the viewport. */
  readonly boundary: Rect;
  readonly side: Side;
  readonly align: Align;
  /** Gap between anchor and floating box. */
  readonly offset: number;
  /** Minimum distance from the boundary edges. */
  readonly padding: number;
  readonly rtl?: boolean | undefined;
}

export interface Position {
  readonly x: number;
  readonly y: number;
  /** The side actually used after collision handling. */
  readonly side: Side;
  readonly align: Align;
  /** CSS transform-origin that makes a scale-in feel attached to the anchor. */
  readonly transformOrigin: string;
  readonly availableWidth: number;
  readonly availableHeight: number;
}

const OPPOSITE: Readonly<Record<Side, Side>> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

function isVertical(side: Side): boolean {
  return side === 'top' || side === 'bottom';
}

/** Space between the anchor's far edge and the boundary on a given side. */
function room(side: Side, anchor: Rect, boundary: Rect): number {
  switch (side) {
    case 'top':
      return anchor.y - boundary.y;
    case 'bottom':
      return boundary.y + boundary.height - (anchor.y + anchor.height);
    case 'left':
      return anchor.x - boundary.x;
    case 'right':
      return boundary.x + boundary.width - (anchor.x + anchor.width);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computePosition(input: PositionInput): Position {
  const { anchor, floating, boundary, offset, padding } = input;
  const need = (side: Side): number =>
    (isVertical(side) ? floating.height : floating.width) + offset + padding;

  // Flip to the opposite side only when it fits better.
  let side = input.side;
  if (
    room(side, anchor, boundary) < need(side) &&
    room(OPPOSITE[side], anchor, boundary) > room(side, anchor, boundary)
  ) {
    side = OPPOSITE[side];
  }

  // Logical start/end follow the writing direction on the horizontal axis.
  let align = input.align;
  if (input.rtl && isVertical(side))
    align = align === 'start' ? 'end' : align === 'end' ? 'start' : 'center';

  let x: number;
  let y: number;
  if (isVertical(side)) {
    y = side === 'top' ? anchor.y - floating.height - offset : anchor.y + anchor.height + offset;
    x =
      align === 'start'
        ? anchor.x
        : align === 'end'
          ? anchor.x + anchor.width - floating.width
          : anchor.x + anchor.width / 2 - floating.width / 2;
    x = clamp(x, boundary.x + padding, boundary.x + boundary.width - floating.width - padding);
  } else {
    x = side === 'left' ? anchor.x - floating.width - offset : anchor.x + anchor.width + offset;
    y =
      align === 'start'
        ? anchor.y
        : align === 'end'
          ? anchor.y + anchor.height - floating.height
          : anchor.y + anchor.height / 2 - floating.height / 2;
    y = clamp(y, boundary.y + padding, boundary.y + boundary.height - floating.height - padding);
  }

  const originX = isVertical(side)
    ? align === 'start'
      ? 'left'
      : align === 'end'
        ? 'right'
        : 'center'
    : side === 'left'
      ? 'right'
      : 'left';
  const originY = isVertical(side)
    ? side === 'top'
      ? 'bottom'
      : 'top'
    : align === 'start'
      ? 'top'
      : align === 'end'
        ? 'bottom'
        : 'center';

  return {
    x: Math.round(x),
    y: Math.round(y),
    side,
    align: input.align,
    transformOrigin: `${originX} ${originY}`,
    availableWidth: Math.max(
      0,
      room(isVertical(side) ? 'right' : side, anchor, boundary) - offset - padding,
    ),
    availableHeight: Math.max(
      0,
      room(isVertical(side) ? side : 'bottom', anchor, boundary) - offset - padding,
    ),
  };
}
