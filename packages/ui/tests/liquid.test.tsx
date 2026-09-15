import { describe, expect, test } from 'bun:test';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  inner,
  LIQUID_OPTICS,
  LIQUID_RADIUS,
  LIQUID_RADIUS_MAX,
  LiquidColorPicker,
  LiquidContextMenu,
  LiquidGallery,
  LiquidHeader,
  LiquidNotificationStack,
  LiquidPricingCard,
  LiquidScene,
  LiquidSearch,
  LiquidStepper,
  LiquidSurface,
  LiquidTabIndicator,
  LiquidTestimonials,
  pill,
  resolveLiquidParams,
} from '../src/liquid';

const IMAGES = [
  { src: '/a.jpg', label: 'Ridge', meta: 'one' },
  { src: '/b.jpg', label: 'Bloom', meta: 'two' },
  { src: '/c.jpg', label: 'Duotone', meta: 'three' },
  { src: '/d.jpg', label: 'Ambience', meta: 'four' },
];

const scene = (children: ReactNode): string =>
  renderToStaticMarkup(<LiquidScene background="/scene.jpg">{children}</LiquidScene>);

describe('liquid options', () => {
  test('clear glass is the default; the frosted toggle swaps the whole optic', () => {
    expect(resolveLiquidParams()).toEqual(LIQUID_OPTICS.clear);
    expect(resolveLiquidParams({ frosted: true })).toEqual(LIQUID_OPTICS.frosted);
    expect(LIQUID_OPTICS.frosted.depth).toBeGreaterThan(LIQUID_OPTICS.clear.depth);
    expect(LIQUID_OPTICS.frosted.splay).toBeGreaterThan(LIQUID_OPTICS.clear.splay);
  });
  test('only blur, glint and tint are adjustable, and each clamps to its range', () => {
    const params = resolveLiquidParams({ blur: 40, glint: -5, tint: 3, tintColor: '#ff6600' });
    expect(params.blur).toBe(15);
    expect(params.glint).toBe(0);
    expect(params.tint).toBe(1);
    expect(params.tintColor).toBe('#ff6600');
    // the rim optics are not public knobs, so they stay exactly as the optic set them
    expect(params.depth).toBe(LIQUID_OPTICS.clear.depth);
    expect(params.feather).toBe(LIQUID_OPTICS.clear.feather);
    expect(params.chroma).toBe(0);
  });
  test('the resting material is blur 2.5, glint 100 and a 20% black tint', () => {
    const rest = resolveLiquidParams();
    expect(rest.blur).toBe(2.5);
    expect(rest.glint).toBe(100);
    expect(rest.tint).toBe(0.2);
    expect(rest.tintColor).toBe('#000000');
    // frosted only changes the rim and the blur; glint and tint carry over
    const frosted = resolveLiquidParams({ frosted: true });
    expect(frosted.glint).toBe(100);
    expect(frosted.tint).toBe(0.2);
    expect(frosted.tintColor).toBe('#000000');
  });
  test('an omitted or non-finite knob takes the value of the optic it sits in', () => {
    expect(resolveLiquidParams({ frosted: true }).blur).toBe(5);
    expect(resolveLiquidParams({ frosted: false }).blur).toBe(2.5);
    expect(resolveLiquidParams({ blur: Number.NaN, glint: Number.POSITIVE_INFINITY })).toEqual(
      LIQUID_OPTICS.clear,
    );
  });
  test('pill caps a radius at half the control height; inner keeps a floor of 4px', () => {
    expect(LIQUID_RADIUS).toBe(LIQUID_RADIUS_MAX);
    expect(pill(44, LIQUID_RADIUS)).toBe(22);
    expect(pill(44, 8)).toBe(8);
    expect(inner(22, 6)).toBe(16);
    expect(inner(6, 6)).toBe(4);
  });
});

describe('liquid scene and surface contracts', () => {
  test('the scene owns its background and keeps glass in a separate interactive layer', () => {
    const html = scene(null);
    expect(html).toContain('data-slot="liquid-scene"');
    expect(html).toContain('class="lq-scene-bg" style="background-image:url(/scene.jpg)"');
    expect(html).toContain('class="lq-layer"');
    expect(html).not.toContain('data-frosted');
    expect(scene(null).indexOf('lq-scene')).toBeLessThan(scene(null).indexOf('lq-layer'));
    expect(renderToStaticMarkup(<LiquidScene frosted />)).toContain('data-frosted=""');
  });
  test('a draggable renders centred by the stylesheet until the script places it', () => {
    const html = scene(<LiquidStepper />);
    expect(html).toContain('data-slot="liquid-draggable" class="lq-drag"');
    expect(html).not.toContain('data-placed');
    expect(html).not.toContain('left:0');
  });
  test('a surface outside a scene fails loudly instead of rendering flat', () => {
    expect(() => renderToStaticMarkup(<LiquidSurface />)).toThrow('<LiquidScene>');
  });
  test('a surface carries its optics layers, its content and one filter housing', () => {
    const html = scene(<LiquidSurface radius={20}>Glass</LiquidSurface>);
    expect(html).toContain('data-slot="liquid-surface"');
    expect(html).toContain('border-radius:20px');
    for (const layer of ['lq-clip', 'lq-blur', 'lq-refraction', 'lq-tint', 'lq-glint']) {
      expect(html.match(new RegExp(`class="${layer}"`, 'g'))).toHaveLength(1);
    }
    expect(html).toContain('<span class="lq-content">Glass</span>');
    // the optics are in the markup, so they paint with the HTML rather than on hydration
    expect(html).toContain(
      'class="lq-blur" style="-webkit-backdrop-filter:blur(2.5px);backdrop-filter:blur(2.5px)"',
    );
    expect(html).toContain('class="lq-tint" style="background:#000000;opacity:0.2"');
    expect(html).toContain('class="lq-glint" style="opacity:1"');
    expect(html).toContain('class="lq-housing" aria-hidden="true"');
    expect(html).not.toContain('<canvas');
  });
  test('the server markup follows the scene options it was rendered with', () => {
    const html = renderToStaticMarkup(
      <LiquidScene frosted blur={0} glint={40} tint={0.5} tintColor="#ff6600">
        <LiquidSurface />
      </LiquidScene>,
    );
    expect(html).toContain('<div class="lq-blur"><div class="lq-refraction"></div></div>');
    expect(html).toContain('class="lq-tint" style="background:#ff6600;opacity:0.5"');
    expect(html).toContain('class="lq-glint" style="opacity:0.4"');
  });
  test('as="button" is a native non-submit button', () => {
    const html = scene(
      <LiquidSurface as="button" type="button" aria-label="Push">
        Push
      </LiquidSurface>,
    );
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Push"');
  });
});

describe('liquid component contracts', () => {
  test('every component renders inside a scene with its own slot', () => {
    const roots: readonly [string, ReactNode][] = [
      ['liquid-pricing-card', <LiquidPricingCard key="p" />],
      ['liquid-gallery', <LiquidGallery key="g" images={IMAGES} />],
      ['liquid-notification-stack', <LiquidNotificationStack key="n" />],
      ['liquid-stepper', <LiquidStepper key="s" />],
      ['liquid-color-picker', <LiquidColorPicker key="c" />],
      ['liquid-context-menu', <LiquidContextMenu key="m" />],
      ['liquid-tab-indicator', <LiquidTabIndicator key="t" />],
      ['liquid-search', <LiquidSearch key="q" />],
      ['liquid-header', <LiquidHeader key="h" />],
      ['liquid-testimonials', <LiquidTestimonials key="x" />],
    ];
    for (const [slot, node] of roots) {
      expect(scene(node)).toContain(`data-slot="${slot}"`);
    }
  });
  test('pricing card: the period switch is a native button with switch semantics', () => {
    const html = scene(<LiquidPricingCard />);
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('billed monthly');
    expect(html).toContain('Start 14-day trial');
    // the card corner is capped by the button height, not by its own tall box
    expect(html).toContain('border-radius:28px');
  });
  test('gallery: one slide on show, the rest hidden, thumbnails as tabs on a focusable frame', () => {
    const html = scene(<LiquidGallery images={IMAGES} />);
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html).toContain('tabindex="0"');
    expect(html.match(/role="img"/g)).toHaveLength(4);
    expect(html.match(/aria-hidden="true"/g)?.length).toBeGreaterThanOrEqual(3);
    expect(html.match(/role="tab"/g)).toHaveLength(4);
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html).toContain('1 of 4: Ridge');
  });
  test('stepper: starts inside its bounds with a live value', () => {
    const html = scene(<LiquidStepper radius={8} />);
    expect(html).toContain('aria-label="Decrease"');
    expect(html).toContain('aria-label="Increase"');
    expect(html).not.toContain('disabled=""');
    expect(html).toContain('aria-live="polite">3<');
    expect(html).toContain('--lq-inner-r:4px');
  });
  test('tab indicator: a tablist with one selected tab and a decorative blob', () => {
    const html = scene(<LiquidTabIndicator />);
    expect(html).toContain('role="tablist"');
    expect(html.match(/role="tab"/g)).toHaveLength(4);
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html).toContain('class="lqc-indicator-blob" aria-hidden="true"');
  });
  test('search: a labelled field and no results panel until something is typed', () => {
    const html = scene(<LiquidSearch />);
    expect(html).toContain('aria-label="Search"');
    expect(html).toContain('placeholder="Search the material"');
    expect(html).not.toContain('role="listbox"');
  });
  test('header: three closed expanders and no menu', () => {
    const html = scene(<LiquidHeader />);
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(3);
    expect(html).not.toContain('role="menu"');
  });
  test('context menu: only the hint until the scene is right-clicked', () => {
    const html = scene(<LiquidContextMenu />);
    expect(html).toContain('Right-click anywhere on the scene');
    expect(html).not.toContain('role="menu"');
  });
  test('colour picker: two keyboard sliders with values, a readout and seven swatches', () => {
    const html = scene(<LiquidColorPicker />);
    expect(html.match(/role="slider"/g)).toHaveLength(2);
    expect(html.match(/aria-valuenow="/g)).toHaveLength(2);
    expect(html).toContain('#30B2F2');
    expect(html).toContain('rgb(48 178 242)');
    expect(html.match(/class="lqc-color-swatch[ "]/g)).toHaveLength(7);
  });
  test('notification stack: three status cards behind a push button', () => {
    const html = scene(<LiquidNotificationStack />);
    expect(html).toContain('Push notification');
    expect(html.match(/role="status"/g)).toHaveLength(3);
    expect(html).not.toContain('lqc-notif-count');
  });
  test('testimonials: three quotes, three tabs and readable ratings', () => {
    const html = scene(<LiquidTestimonials />);
    expect(html.match(/<blockquote/g)).toHaveLength(3);
    expect(html.match(/role="tab"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="4 out of 5"');
    expect(html).toContain('Loved by 2,400 teams');
  });
});
