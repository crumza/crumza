import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  H,
  inner,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  LiquidSurface,
  pill,
  Pipette,
} from '../core';

/** HSV to RGB. Kept local and dependency-free; the pad is authored in HSV
 *  because that is the space its two axes actually are. */
function hsvToRgb(h: number, s: number, v: number): readonly [number, number, number] {
  const c = v * s;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x];
  const m = v - c;
  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ] as const;
}

const toHex = (h: number, s: number, v: number): string =>
  `#${hsvToRgb(h, s, v)
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')}`;

const SWATCHES = [
  { h: 0, s: 0, v: 1 },
  { h: 22, s: 0.92, v: 1 },
  { h: 48, s: 0.9, v: 1 },
  { h: 145, s: 0.7, v: 0.85 },
  { h: 200, s: 0.8, v: 0.95 },
  { h: 265, s: 0.6, v: 0.9 },
  { h: 330, s: 0.72, v: 0.95 },
];

type Axis = 'pad' | 'hue';

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/**
 * A glass colour picker: a saturation/value pad, a hue rail and a hex readout.
 *
 * The pad and the rail share one pointer routine parameterised by axis. They
 * are the same gesture (press anywhere to set, drag to refine, keep receiving
 * moves after the pointer leaves the element). Nothing here resizes, so the
 * surface holds one map throughout.
 */
export function LiquidColorPicker({ radius = LIQUID_RADIUS }: LiquidComponentProps): ReactElement {
  const [hsv, setHsv] = useState({ h: 200, s: 0.8, v: 0.95 });
  const dragging = useRef<Axis | null>(null);

  const r = pill(H.frame, radius);
  const hex = toHex(hsv.h, hsv.s, hsv.v);
  const [rr, gg, bb] = hsvToRgb(hsv.h, hsv.s, hsv.v);

  /** Read a pointer against an element's box and update the matching axes. */
  const track = useCallback((kind: Axis, el: HTMLElement, clientX: number, clientY: number) => {
    const b = el.getBoundingClientRect();
    const fx = clamp01((clientX - b.left) / b.width);
    const fy = clamp01((clientY - b.top) / b.height);
    if (kind === 'pad') {
      // x is saturation, y is value inverted: bright at the top, as expected
      setHsv((c) => ({ ...c, s: fx, v: 1 - fy }));
    } else {
      setHsv((c) => ({ ...c, h: Math.round(fx * 359) }));
    }
  }, []);

  const bind = (kind: Axis) => ({
    // data-no-drag: this gesture is the component's, so the scene must not read
    // it as a scroll of the backdrop behind it
    'data-no-drag': true,
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      dragging.current = kind;
      e.currentTarget.setPointerCapture(e.pointerId);
      track(kind, e.currentTarget, e.clientX, e.clientY);
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (dragging.current === kind) track(kind, e.currentTarget, e.clientX, e.clientY);
    },
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => {
      dragging.current = null;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    },
  });

  /* Keyboard for the pad: left/right walk saturation, up/down walk brightness. */
  const onPadKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    const step = 0.04;
    const ds = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
    const dv = e.key === 'ArrowDown' ? -step : e.key === 'ArrowUp' ? step : 0;
    if (!ds && !dv) return;
    e.preventDefault();
    setHsv((c) => ({ ...c, s: clamp01(c.s + ds), v: clamp01(c.v + dv) }));
  };

  return (
    <LiquidSurface
      radius={r}
      data-slot="liquid-color-picker"
      className="lqc-color"
      contentClassName="lq-content-interactive lqc-color-content"
      role="group"
      aria-label="Colour picker"
      style={{ '--lq-inner-r': `${inner(r, 10)}px` }}
    >
      {/* the pad: a hue wash, a white-to-transparent saturation ramp and a
            transparent-to-black value ramp, stacked */}
      <div
        className="lqc-color-pad"
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.v * 100)}
        aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
        style={{ '--hue': hsv.h } as CSSProperties}
        onKeyDown={onPadKey}
        {...bind('pad')}
      >
        <span
          className="lqc-color-knob"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }}
        />
      </div>

      <div
        className="lqc-color-hue"
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={hsv.h}
        onKeyDown={(e) => {
          const by = e.key === 'ArrowLeft' ? -4 : e.key === 'ArrowRight' ? 4 : 0;
          if (!by) return;
          e.preventDefault();
          setHsv((c) => ({ ...c, h: (c.h + by + 360) % 360 }));
        }}
        {...bind('hue')}
      >
        <span
          className="lqc-color-hue-knob"
          style={{ left: `${(hsv.h / 359) * 100}%`, background: `hsl(${hsv.h} 100% 50%)` }}
        />
      </div>

      <div className="lqc-color-foot">
        <span className="lqc-color-preview" style={{ background: hex }} aria-hidden="true">
          <Pipette />
        </span>
        <span className="lqc-color-values">
          <span className="lqc-color-hex">{hex.toUpperCase()}</span>
          <span className="lqc-color-rgb">
            rgb({rr} {gg} {bb})
          </span>
        </span>
      </div>

      <div className="lqc-color-swatches">
        {SWATCHES.map((sw) => {
          const swHex = toHex(sw.h, sw.s, sw.v);
          return (
            <button
              key={swHex}
              type="button"
              data-no-drag
              className={`lqc-color-swatch ${swHex === hex ? 'is-active' : ''}`}
              style={{ background: swHex }}
              aria-label={swHex}
              onClick={() => setHsv(sw)}
            />
          );
        })}
      </div>
    </LiquidSurface>
  );
}
