import { type CSSProperties, type ReactElement, useState } from 'react';
import {
  Check,
  H,
  inner,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  LiquidSurface,
  pill,
  useLiquidScene,
} from '../core';

const FEATURES = [
  'Unlimited scenes',
  'Every optics preset',
  'Chromatic split',
  'Export displacement maps',
];
const CARD_PAD = 12;

/**
 * A glass pricing card with a monthly/yearly switch. The price block keeps a
 * fixed height so the surface never resizes (only the label crossfades), and
 * the switch's knob is the one thing that pumps, because it slides.
 */
export function LiquidPricingCard({ radius = LIQUID_RADIUS }: LiquidComponentProps): ReactElement {
  const { pump } = useLiquidScene();
  const [yearly, setYearly] = useState(false);
  const r = pill(H.button, radius);
  const switchR = pill(H.toggle, radius);

  return (
    <LiquidSurface
      radius={r}
      data-slot="liquid-pricing-card"
      className="lqc-pricing"
      contentClassName="lq-content-interactive lqc-pricing-content"
      style={{ '--lq-inner-r': `${inner(r, CARD_PAD)}px` }}
    >
      <div className="lqc-pricing-head">
        <div>
          <span className="lqc-pricing-eyebrow">Studio</span>
          <span className="lqc-pricing-blurb">For teams shipping glass.</span>
        </div>
        <span className="lqc-pricing-chip">Popular</span>
      </div>

      <div className="lqc-pricing-price">
        <span key={String(yearly)} className="lqc-pricing-amount">
          <sup>$</sup>
          {yearly ? '19' : '24'}
        </span>
        <span className="lqc-pricing-period">
          / month
          <small>{yearly ? 'billed yearly' : 'billed monthly'}</small>
        </span>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={yearly}
        className={`lqc-pricing-switch ${yearly ? 'is-on' : ''}`}
        style={{ '--period-r': `${switchR}px` } as CSSProperties}
        onClick={() => {
          setYearly((v) => !v);
          pump(360); // the knob slides across the glass
        }}
      >
        <span className="lqc-pricing-knob" />
        <span className="lqc-pricing-side" data-side="monthly">
          Monthly
        </span>
        <span className="lqc-pricing-side" data-side="yearly">
          Yearly <em>−20%</em>
        </span>
      </button>

      <ul className="lqc-pricing-features">
        {FEATURES.map((f) => (
          <li key={f}>
            <Check aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>

      <button type="button" className="lqc-pricing-cta">
        Start 14-day trial
      </button>
    </LiquidSurface>
  );
}
