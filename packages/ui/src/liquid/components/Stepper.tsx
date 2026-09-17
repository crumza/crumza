import { type ReactElement, useState } from 'react';
import {
  H,
  inner,
  LIQUID_RADIUS,
  type LiquidComponentProps,
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
  const [up, setUp] = useState(true);
  const r = pill(H.stepper, radius);

  const nudge = (by: number): void => {
    setUp(by > 0);
    setCount((c) => Math.max(STEPPER_MIN, Math.min(STEPPER_MAX, c + by)));
  };

  return (
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

      {/* Tabular figures, so 9 to 10 does not shift the buttons either side.
          The live region is the outer span and stays put; the inner one is keyed
          by the value, so each number rolls in from the side it came from
          without the announcement being remounted out from under it. */}
      <span className="lqc-stepper-value" aria-live="polite">
        <span key={count} data-from={up ? 'below' : 'above'}>
          {count}
        </span>
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
  );
}
