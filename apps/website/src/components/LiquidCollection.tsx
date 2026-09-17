import {
  LiquidColorPicker,
  LiquidContextMenu,
  LiquidGallery,
  LiquidHeader,
  LiquidNotificationStack,
  LiquidPricingCard,
  LiquidScene,
  LiquidSearch,
  LiquidStepper,
  LiquidTabIndicator,
  LiquidTestimonials,
} from '@crumza/ui/liquid';
import { type ReactElement, type ReactNode, useState } from 'react';
import {
  defaultLiquidSettings,
  liquidBackdrops,
  liquidGalleryImages,
  liquidSnippet,
} from '../demos/liquid';
import { LiquidInspector } from '../demos/LiquidInspector';

interface Entry {
  readonly title: string;
  readonly component: string;
  readonly href: string;
  readonly render: (radius: number) => ReactNode;
}

/** The set, grouped the way it is reached for rather than alphabetically. */
const groups: readonly { readonly heading: string; readonly items: readonly string[] }[] = [
  { heading: 'Cards', items: ['Pricing card', 'Testimonials'] },
  { heading: 'Navigation', items: ['Header', 'Tab indicator'] },
  { heading: 'Inputs', items: ['Search', 'Stepper', 'Color picker'] },
  { heading: 'Feedback', items: ['Notifications'] },
  { heading: 'Surfaces', items: ['Context menu'] },
  { heading: 'Media', items: ['Gallery'] },
];

const entries: Record<string, Entry> = {
  'Pricing card': {
    title: 'A plan worth choosing',
    component: 'LiquidPricingCard',
    href: 'liquid-pricing-card',
    render: (r) => <LiquidPricingCard radius={r} />,
  },
  Testimonials: {
    title: 'Words that carry',
    component: 'LiquidTestimonials',
    href: 'liquid-testimonials',
    render: (r) => <LiquidTestimonials radius={r} />,
  },
  Header: {
    title: 'A bar that follows you',
    component: 'LiquidHeader',
    href: 'liquid-header',
    render: (r) => <LiquidHeader radius={r} />,
  },
  'Tab indicator': {
    title: 'A drop that travels',
    component: 'LiquidTabIndicator',
    href: 'liquid-tab-indicator',
    render: (r) => <LiquidTabIndicator radius={r} />,
  },
  Search: {
    title: 'Found as you type',
    component: 'LiquidSearch',
    href: 'liquid-search',
    render: (r) => <LiquidSearch radius={r} />,
  },
  Stepper: {
    title: 'One more, one less',
    component: 'LiquidStepper',
    href: 'liquid-stepper',
    render: (r) => <LiquidStepper radius={r} />,
  },
  'Color picker': {
    title: 'Any shade you like',
    component: 'LiquidColorPicker',
    href: 'liquid-color-picker',
    render: (r) => <LiquidColorPicker radius={r} />,
  },
  Notifications: {
    title: 'A deck that fans out',
    component: 'LiquidNotificationStack',
    href: 'liquid-notification-stack',
    render: (r) => <LiquidNotificationStack radius={r} />,
  },
  'Context menu': {
    title: 'Right where you clicked',
    component: 'LiquidContextMenu',
    href: 'liquid-context-menu',
    render: (r) => <LiquidContextMenu radius={r} />,
  },
  Gallery: {
    title: 'Pictures in a frame',
    component: 'LiquidGallery',
    href: 'liquid-gallery',
    render: (r) => <LiquidGallery radius={r} images={liquidGalleryImages} />,
  },
};

const count = Object.keys(entries).length;

/** The liquid glass set: one nav, one refracting stage, one inspector with five knobs. */
export default function LiquidCollection(): ReactElement {
  const [active, setActive] = useState('Header');
  const [settings, setSettings] = useState(defaultLiquidSettings);
  const entry = entries[active] ?? entries['Header'];
  if (!entry) return <></>;
  return (
    <section className="liquid-section" aria-label="Liquid glass components">
      <div className="liquid-head">
        <div>
          <h2>Liquid glass</h2>
          <span className="liquid-count">{count} components</span>
        </div>
        <p>
          One refraction engine, shared by every surface. Scroll the scene to carry the next
          backdrop under the glass and watch the rim resample what passes beneath it.
        </p>
      </div>
      <div className="liquid-grid">
        <nav className="liquid-nav" aria-label="Liquid components">
          {groups.map((group) => (
            <div key={group.heading}>
              <h3>{group.heading}</h3>
              <div className="liquid-nav-list">
                {group.items.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="liquid-nav-item"
                    aria-pressed={active === name}
                    onClick={() => setActive(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="liquid-stage-wrap">
          <LiquidScene
            backdrops={liquidBackdrops}
            backdrop={settings.backdrop}
            onBackdropChange={(backdrop) => setSettings((current) => ({ ...current, backdrop }))}
            frosted={settings.frosted}
            blur={settings.blur}
            glint={settings.glint}
            tint={settings.tint}
            tintColor={settings.tintColor}
            className="liquid-stage"
          >
            {entry.render(settings.radius)}
          </LiquidScene>
          <a className="tile-label" href={`/docs/components/${entry.href}`}>
            <strong>{entry.title}</strong>
            <span>{entry.component}</span>
          </a>
        </div>
        <LiquidInspector settings={settings} onChange={setSettings} layout="column" />
      </div>
      <pre className="code-preview">
        <code>{liquidSnippet(entry.component, settings)}</code>
      </pre>
    </section>
  );
}
