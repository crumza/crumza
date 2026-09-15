import { type CSSProperties, type ReactElement, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  H,
  inner,
  LIQUID_RADIUS,
  type LiquidComponentProps,
  LiquidDraggable,
  LiquidSurface,
  pill,
  Star,
  useLiquidScene,
} from '../core';

const QUOTES = [
  {
    quote:
      'The first glass I have used that does not fall apart the moment something moves behind it.',
    name: 'Jonas Lindqvist',
    role: 'Design lead, Fathom',
    initials: 'JL',
    hue: 26,
    stars: 5,
  },
  {
    quote:
      'We replaced three blur layers and a shadow stack with one surface. It looked better on day one.',
    name: 'Priya Natarajan',
    role: 'Staff engineer, Loom & Co',
    initials: 'PN',
    hue: 288,
    stars: 5,
  },
  {
    quote:
      'Dragging a button across a photo and watching the edge bend is the demo that sold the room.',
    name: 'Theo Marchetti',
    role: 'Founder, Parallax',
    initials: 'TM',
    hue: 196,
    stars: 4,
  },
];
const STAR_SLOTS = ['one', 'two', 'three', 'four', 'five'];
const CARD_PAD = 12;

/**
 * A testimonial section: a glass kicker pill, prev/next glass arrows, three
 * quote cards and dot indicators. One card is the subject: it lifts and the
 * other two recede. The lift is a transform on the glass itself, so every step
 * is pumped. Collapses to the featured card only under 760px.
 */
export function LiquidTestimonials({ radius = LIQUID_RADIUS }: LiquidComponentProps): ReactElement {
  const { pump } = useLiquidScene();
  const [active, setActive] = useState(0);
  const r = pill(H.button, radius);
  const chipR = pill(H.chip, radius);

  const feature = (i: number): void => {
    setActive(i);
    pump(520);
  };
  const step = (d: number): void => feature((active + d + QUOTES.length) % QUOTES.length);

  return (
    <LiquidDraggable>
      <section
        className="lqc-testimonials"
        aria-label="Testimonials"
        data-slot="liquid-testimonials"
      >
        <header className="lqc-testimonials-head">
          <LiquidSurface radius={chipR} className="lqc-testimonials-kicker">
            <Star aria-hidden="true" /> Loved by 2,400 teams
          </LiquidSurface>
          <div className="lqc-testimonials-nav">
            <LiquidSurface
              as="button"
              type="button"
              radius={chipR}
              className="lqc-testimonials-arrow"
              aria-label="Previous testimonial"
              onClick={() => step(-1)}
            >
              <ChevronLeft />
            </LiquidSurface>
            <LiquidSurface
              as="button"
              type="button"
              radius={chipR}
              className="lqc-testimonials-arrow"
              aria-label="Next testimonial"
              onClick={() => step(1)}
            >
              <ChevronRight />
            </LiquidSurface>
          </div>
        </header>

        <div className="lqc-testimonials-row">
          {QUOTES.map((q, i) => (
            <LiquidSurface
              key={q.name}
              radius={r}
              className={`lqc-quote ${i === active ? 'is-active' : ''}`}
              contentClassName="lq-content-interactive lqc-quote-content"
              style={{ '--lq-inner-r': `${inner(r, CARD_PAD)}px` }}
              onPointerEnter={() => feature(i)}
            >
              <span className="lqc-quote-stars" role="img" aria-label={`${q.stars} out of 5`}>
                {STAR_SLOTS.map((slot, k) => (
                  <Star key={slot} className={k < q.stars ? 'is-filled' : ''} aria-hidden="true" />
                ))}
              </span>
              <blockquote className="lqc-quote-text">{q.quote}</blockquote>
              <footer className="lqc-quote-who">
                <span
                  className="lqc-quote-avatar"
                  aria-hidden="true"
                  style={{ '--avatar-hue': q.hue } as CSSProperties}
                >
                  {q.initials}
                </span>
                <span>
                  <strong>{q.name}</strong>
                  <small>{q.role}</small>
                </span>
              </footer>
            </LiquidSurface>
          ))}
        </div>

        <div className="lqc-testimonials-dots" role="tablist" aria-label="Testimonial">
          {QUOTES.map((q, i) => (
            <button
              key={q.name}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={q.name}
              className={`lqc-testimonials-dot ${i === active ? 'is-active' : ''}`}
              onClick={() => feature(i)}
            />
          ))}
        </div>
      </section>
    </LiquidDraggable>
  );
}
