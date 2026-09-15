import { type ReactElement, useState } from 'react';
import {
  H,
  inner,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  LiquidDraggable,
  LiquidSurface,
  Minus,
  pill,
  Plus,
} from '../core';

const STEPPER_MIN = 0;
const STEPPER_MAX = 12;

/**
 * A glass minus/plus stepper. Nothing here moves the lens box, so the engine is
 * never asked to repaint.
 */
export function LiquidStepper({ radius = LIQUID_RADIUS }: LiquidComponentProps): ReactElement {
  const [count, setCount] = useState(3);
  const r = pill(H.stepper, radius);

  const nudge = (by: number): void =>
    setCount((c) => Math.max(STEPPER_MIN, Math.min(STEPPER_MAX, c + by)));

  return (
    <LiquidDraggable>
      <LiquidSurface
        radius={r}
        data-slot="liquid-stepper"
        className="lqc-stepper"
        contentClassName="lq-content-interactive lqc-stepper-content"
        style={{ '--lq-inner-r': `${inner(r, 6)}px` }}
      >
        <button
          type="button"
          className="lqc-stepper-btn"
          aria-label="Decrease"
          disabled={count === STEPPER_MIN}
          onClick={() => nudge(-1)}
        >
          <Minus />
        </button>

        {/* tabular figures, so 9 to 10 does not shift the buttons either side */}
        <span className="lqc-stepper-value" aria-live="polite">
          {count}
        </span>

        <button
          type="button"
          className="lqc-stepper-btn"
          aria-label="Increase"
          disabled={count === STEPPER_MAX}
          onClick={() => nudge(1)}
        >
          <Plus />
        </button>
      </LiquidSurface>
    </LiquidDraggable>
  );
}
