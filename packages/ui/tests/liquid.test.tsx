import { describe, expect, test } from 'bun:test';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { IconComponent } from '../src/liquid';
import {
  inner,
  LIQUID_BACKDROPS,
  LIQUID_OPTICS,
  LIQUID_PATTERNS,
  LIQUID_RADIUS,
  LIQUID_RADIUS_MAX,
  LiquidActionDock,
  LiquidActionPill,
  LiquidColorPicker,
  LiquidCommandPalette,
  LiquidContextMenu,
  LiquidContextToolbar,
  LiquidDockMenu,
  LiquidGallery,
  LiquidGlassSlider,
  LiquidGlassToggle,
  LiquidHeader,
  LiquidMenuButton,
  LiquidMobileNav,
  LiquidNotificationStack,
  LiquidPlusButton,
  LiquidPricingCard,
  LiquidScene,
  LiquidSearch,
  LiquidSheet,
  LiquidStepper,
  LiquidSurface,
  LiquidTabIndicator,
  LiquidTestimonials,
  liquidBackdropStyle,
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
    expect(LIQUID_OPTICS.clear.frosted).toBe(false);
    expect(LIQUID_OPTICS.frosted.frosted).toBe(true);
    // frost diffuses what a clear edge bends: the frosted rim is the slighter
    // one, so a blurred pane does not wear its bend as a thick frame
    expect(LIQUID_OPTICS.frosted.depth).toBeLessThan(LIQUID_OPTICS.clear.depth);
    expect(LIQUID_OPTICS.frosted.splay).toBeLessThanOrEqual(LIQUID_OPTICS.clear.splay);
    expect(LIQUID_OPTICS.frosted.feather).toBeLessThan(LIQUID_OPTICS.clear.feather);
  });
  test('frosted is the Dock material: a softening blur, a little saturation, a thin milk veil', () => {
    const frosted = LIQUID_OPTICS.frosted;
    expect(frosted.blur).toBe(14);
    expect(frosted.saturate).toBe(1.25);
    expect(frosted.tint).toBe(0.14);
    expect(frosted.tintColor).toBe('#ffffff');
    expect(LIQUID_OPTICS.clear.saturate).toBe(1);
    // the clone reaches far enough past the edge for that blur to sample real
    // pixels there: about three standard deviations, and past the clear overhang
    expect(frosted.overhang).toBeGreaterThanOrEqual(frosted.blur * 2.5);
    expect(frosted.overhang).toBeGreaterThan(LIQUID_OPTICS.clear.overhang);
  });
  test('only blur, glint and tint are adjustable, and each clamps to its range', () => {
    const params = resolveLiquidParams({ blur: 60, glint: -5, tint: 3, tintColor: '#ff6600' });
    expect(params.blur).toBe(40);
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
    // frosted keeps the glint; its veil is a thin white milk rather than a black tint
    const frosted = resolveLiquidParams({ frosted: true });
    expect(frosted.glint).toBe(100);
    expect(frosted.tint).toBe(0.14);
    expect(frosted.tintColor).toBe('#ffffff');
  });
  test('an omitted or non-finite knob takes the value of the optic it sits in', () => {
    expect(resolveLiquidParams({ frosted: true }).blur).toBe(14);
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
  test('a component ships itself and nothing else: the layer is what places it', () => {
    const html = scene(<LiquidStepper />);
    expect(html).toContain('<div class="lq-layer">');
    // no positioner, and no inline placement to hydrate around
    expect(html).not.toContain('liquid-draggable');
    expect(html).not.toContain('lq-drag');
    expect(html).not.toContain('left:');
    expect(html).not.toContain('top:');
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
      <LiquidScene blur={0} glint={40} tint={0.5} tintColor="#ff6600">
        <LiquidSurface />
      </LiquidScene>,
    );
    expect(html).toContain('<div class="lq-blur"><div class="lq-refraction"></div></div>');
    expect(html).toContain('class="lq-tint" style="background:#ff6600;opacity:0.5"');
    expect(html).toContain('class="lq-glint" style="opacity:0.4"');
  });
  test('frosted markup stands in with the whole interior: the blur and the saturation', () => {
    const html = renderToStaticMarkup(
      <LiquidScene frosted>
        <LiquidSurface />
      </LiquidScene>,
    );
    expect(html).toContain('data-frosted=""');
    expect(html).toContain(
      'class="lq-blur" style="-webkit-backdrop-filter:blur(14px) saturate(1.25);backdrop-filter:blur(14px) saturate(1.25)"',
    );
    expect(html).toContain('class="lq-tint" style="background:#ffffff;opacity:0.14"');
    // with the blur turned off the saturation lift still stands in on its own
    const flat = renderToStaticMarkup(
      <LiquidScene frosted blur={0}>
        <LiquidSurface />
      </LiquidScene>,
    );
    expect(flat).toContain(
      'class="lq-blur" style="-webkit-backdrop-filter:saturate(1.25);backdrop-filter:saturate(1.25)"',
    );
  });
  test('a surface refracts its own content when asked, laid over the clone of the scene', () => {
    const html = scene(<LiquidSurface refracted={<span className="echo" />} />);
    expect(html).toContain(
      '<div class="lq-refraction"><div class="lq-refracted"><span class="echo"></span></div></div>',
    );
    // nothing extra when there is nothing to refract
    expect(scene(<LiquidSurface />)).toContain('<div class="lq-refraction"></div>');
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

describe('the scrolling backdrop strip', () => {
  test('the generated panels are the ones the liquix stage draws', () => {
    // 22px cells on a 44px pitch, 32px bars on a 64px pitch: the same numbers
    // proceduralPanel() in web/liquix/shaders.ts uses.
    expect(LIQUID_PATTERNS.checker).toContain('44px 44px');
    expect(LIQUID_PATTERNS.bars).toContain('0 32px');
    expect(LIQUID_PATTERNS.bars).toContain('32px 64px');
    expect(LIQUID_PATTERNS.spectrum).toContain('0 65px');
    expect(LIQUID_BACKDROPS.map((panel) => panel.css)).toEqual([
      LIQUID_PATTERNS.checker,
      LIQUID_PATTERNS.spectrum,
      LIQUID_PATTERNS.bars,
    ]);
  });
  test('an image wins over a pattern, and a panel with neither paints nothing', () => {
    expect(liquidBackdropStyle({ src: '/a.jpg', css: 'red' })).toEqual({
      backgroundImage: 'url(/a.jpg)',
    });
    expect(liquidBackdropStyle({ css: 'red' })).toEqual({ background: 'red' });
    expect(liquidBackdropStyle({ label: 'Empty' })).toEqual({});
  });
  test('a strip renders one panel each, and the stage carries the count it divides by', () => {
    const html = renderToStaticMarkup(
      <LiquidScene
        backdrops={[{ src: '/a.jpg', label: 'Ridge' }, { css: LIQUID_PATTERNS.bars }]}
      />,
    );
    expect(html).toContain('--lq-panels:2');
    expect(html).toContain('data-strip=""');
    expect(html.match(/class="lq-panel"/g)).toHaveLength(2);
    expect(html).toContain('class="lq-panel" style="background-image:url(/a.jpg)"');
    expect(html).toContain('<span class="lq-panel-label">Ridge</span>');
    // the strip replaces the single background, and stays inside the scene
    expect(html).not.toContain('lq-scene-bg');
    expect(html.indexOf('lq-strip')).toBeLessThan(html.indexOf('lq-layer'));
  });
  test('one backdrop is a strip with nothing to scroll', () => {
    const html = renderToStaticMarkup(<LiquidScene backdrops={[{ css: 'red' }]} />);
    expect(html).toContain('--lq-panels:1');
    expect(html).not.toContain('data-strip');
  });
  test('the strip starts at the top: the offset is written by the driver, not the markup', () => {
    const html = renderToStaticMarkup(<LiquidScene backdrops={LIQUID_BACKDROPS} />);
    expect(html).not.toContain('--lq-scroll');
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
      ['liquid-mobile-nav', <LiquidMobileNav key="d" />],
      ['liquid-testimonials', <LiquidTestimonials key="x" />],
      ['liquid-glass-toggle', <LiquidGlassToggle key="g" aria-label="Wi-Fi" />],
      ['liquid-glass-slider', <LiquidGlassSlider key="r" aria-label="Brightness" />],
      ['liquid-dock-menu', <LiquidDockMenu key="k" />],
      ['liquid-sheet', <LiquidSheet key="e" />],
      ['liquid-plus-button', <LiquidPlusButton key="pb" />],
      ['liquid-menu-button', <LiquidMenuButton key="mb" />],
      ['liquid-action-pill', <LiquidActionPill key="ap" />],
      ['liquid-action-dock', <LiquidActionDock key="ad" />],
      ['liquid-context-toolbar', <LiquidContextToolbar key="ct" />],
      ['liquid-command-palette', <LiquidCommandPalette key="cp" />],
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
  test('glass toggle: a native switch holding two panes of the scene, capped white at rest', () => {
    const html = scene(<LiquidGlassToggle aria-label="Wi-Fi" />);
    expect(html).toContain('<button type="button" role="switch" aria-checked="false"');
    expect(html).toContain('aria-label="Wi-Fi"');
    expect(html).toContain('data-slot="liquid-glass-toggle"');
    expect(html).toContain('data-size="default"');
    // the track and the thumb are both surfaces: the same engine, the same material
    expect(html.match(/data-slot="liquid-surface"/g)).toHaveLength(2);
    expect(html).toContain('class="lq-lens lqc-toggle-track"');
    expect(html).toContain('class="lq-lens lqc-toggle-lens"');
    // the thumb's box is a plain wrapper; the lens inside it is a slight loupe
    // whose corner is the track's less the inset, capped to round by the engine
    expect(html).toContain(
      'class="lqc-toggle-thumb" aria-hidden="true" style="--lqc-toggle-thumb-r:19px"',
    );
    expect(html).toContain('class="lq-lens lqc-toggle-lens" style="border-radius:19px"');
    // under the cap the lens carries the on-colour and a sheen, in that order
    expect(html).toContain(
      '<span class="lqc-toggle-glaze"></span><span class="lqc-toggle-sheen"></span><span class="lqc-toggle-cap"></span>',
    );
    expect(html).toContain('<span class="lqc-toggle-fill"></span>');
    // its side is a custom property the stylesheet reads; a settled thumb has no --x
    expect(html).toContain('--on:0');
    expect(html).not.toContain('--x:');
    expect(html).not.toContain('data-lift');
    // the geometry travels as properties, so one calc places the thumb for every size
    expect(html).toContain('--lqc-toggle-w:64px');
    expect(html).toContain('--lqc-toggle-thumb:26px');
    expect(html).toContain('--lqc-toggle-inset:3px');
  });
  test('glass toggle: checked, disabled and the small size are in the markup', () => {
    const html = scene(<LiquidGlassToggle aria-label="Wi-Fi" defaultChecked disabled size="sm" />);
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('--on:1');
    expect(html).toContain('disabled=""');
    expect(html).toContain('data-size="sm"');
    expect(html).toContain('--lqc-toggle-w:50px');
    expect(html).toContain('--lqc-toggle-thumb:20px');
    // a controlled value wins over the default
    expect(
      scene(<LiquidGlassToggle aria-label="Wi-Fi" checked={false} defaultChecked />),
    ).toContain('aria-checked="false"');
    // the radius knob reaches the thumb: 8 on the track, 5 on the thumb inside its 3px inset
    const square = scene(<LiquidGlassToggle aria-label="Wi-Fi" radius={8} />);
    expect(square).toContain('class="lq-lens lqc-toggle-track" style="border-radius:8px"');
    expect(square).toContain('class="lq-lens lqc-toggle-lens" style="border-radius:5px"');
  });
  test('glass slider: a keyboard slider on a thin rail, its lens a pane carrying a copy of the rail', () => {
    const html = scene(<LiquidGlassSlider aria-label="Brightness" defaultValue={40} />);
    expect(html).toContain('data-slot="liquid-glass-slider"');
    expect(html).toContain('role="slider"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Brightness"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('aria-valuenow="40"');
    // the position at rest is a fraction the stylesheet reads; a settled lens has no --x
    expect(html).toContain('--v:0.4');
    expect(html).not.toContain('--x:');
    expect(html).not.toContain('data-lift');
    // the rail is a plain bar filled to the lens; the lens is the one pane
    expect(html).toContain(
      '<div class="lqc-slider-rail" aria-hidden="true"><span class="lqc-slider-fill"></span></div>',
    );
    expect(html.match(/data-slot="liquid-surface"/g)).toHaveLength(1);
    expect(html).toContain('class="lq-lens lqc-slider-lens"');
    // the copy of the rail rides in the pane's refraction layer; the light and the cap sit over the glass
    expect(html).toContain(
      '<div class="lq-refracted"><span class="lqc-slider-echo"><span class="lqc-slider-echo-fill"></span></span></div>',
    );
    expect(html).toContain(
      '<span class="lqc-slider-sheen"></span><span class="lqc-slider-cap"></span>',
    );
    // the geometry travels as properties: an oversized capsule over a thin rail
    expect(html).toContain('--lqc-slider-thumb-w:64px');
    expect(html).toContain('--lqc-slider-thumb-h:40px');
    expect(html).toContain('--lqc-slider-rail:6px');
    expect(html).toContain('--lqc-slider-hit:52px');
  });
  test('glass slider: values snap to the step inside the range; disabled leaves the tab order', () => {
    const stepped = scene(
      <LiquidGlassSlider aria-label="Zoom" min={50} max={200} step={10} defaultValue={123} />,
    );
    expect(stepped).toContain('aria-valuenow="120"');
    expect(stepped).toContain('aria-valuemin="50"');
    expect(
      scene(<LiquidGlassSlider aria-label="Zoom" min={50} max={200} defaultValue={-5} />),
    ).toContain('aria-valuenow="50"');
    expect(
      scene(<LiquidGlassSlider aria-label="Zoom" step={0.1} defaultValue={0.3} max={1} />),
    ).toContain('aria-valuenow="0.3"');
    // a controlled value wins over the default; the text for it passes through
    const controlled = scene(
      <LiquidGlassSlider aria-label="Zoom" value={70} defaultValue={10} aria-valuetext="Loud" />,
    );
    expect(controlled).toContain('aria-valuenow="70"');
    expect(controlled).toContain('aria-valuetext="Loud"');
    const off = scene(<LiquidGlassSlider aria-label="Zoom" disabled defaultValue={10} />);
    expect(off).toContain('aria-disabled="true"');
    expect(off).toContain('tabindex="-1"');
    expect(off).toContain('data-disabled=""');
  });
  test('dock menu: at rest a pill of labelled glyphs and More, sized for the menu it will unfold into', () => {
    const html = scene(<LiquidDockMenu />);
    expect(html).toContain('data-slot="liquid-dock-menu"');
    expect(html).toContain('data-state="dock"');
    // the pill is a nav of buttons, each named; the two with pages say so
    expect(html).toContain('<nav class="lqc-dockmenu-dock" aria-label="Menu">');
    for (const label of ['Home', 'Discover', 'Favorites', 'Notebooks', 'More']) {
      expect(html).toContain(`aria-label="${label}"`);
    }
    expect(html).toContain('aria-label="Notebooks" aria-haspopup="menu"');
    expect(html).toContain('aria-label="More" aria-haspopup="menu" aria-expanded="false"');
    // the menu is not in the markup until it unfolds; the pill is the one pane
    expect(html).not.toContain('role="menu"');
    expect(html.match(/data-slot="liquid-surface"/g)).toHaveLength(1);
    expect(html).toContain('class="lq-lens lqc-dockmenu-glass"');
    // the geometry travels as properties: five slots in a 192px pill, and the
    // panel's height for the five rows it will show
    expect(html).toContain('--lqc-dockmenu-pill:192px');
    expect(html).toContain('--lqc-dockmenu-slots:5');
    expect(html).toContain('--lqc-dockmenu-h:184px');
    // the shared radius reaches both insets: 18 for a glyph's round, 14 for a row
    expect(html).toContain('--lqc-dockmenu-item-r:18px');
    expect(html).toContain('--lqc-dockmenu-row-r:14px');
    // the label over the pill is there, hidden, with its slot
    expect(html).toContain('class="lqc-dockmenu-tip" aria-hidden="true" style="--i:0"');
  });
  test('dock menu: unfolded, a menu of menuitems with the pill inert behind it', () => {
    const html = scene(<LiquidDockMenu defaultOpen />);
    expect(html).toContain('data-state="menu"');
    expect(html).toContain('role="menu"');
    expect(html).toContain('aria-label="More" aria-haspopup="menu" aria-expanded="true"');
    expect(html.match(/role="menuitem"/g)).toHaveLength(5);
    // More, Notebooks in the pill, Notebooks and Settings as rows
    expect(html.match(/aria-haspopup="menu"/g)).toHaveLength(4);
    expect(html).toContain('<nav class="lqc-dockmenu-dock" aria-label="Menu" inert="">');
    // rows arrive a beat apart from the top, after the glass has grown
    expect(html).toContain('--lqc-dockmenu-arrive:170ms');
    expect(html).toContain('style="--at:4"');
    expect(html.match(/lqc-dockmenu-row-caret"/g)).toHaveLength(2);
    // a controlled open wins over the default
    expect(scene(<LiquidDockMenu open={false} defaultOpen />)).toContain('data-state="dock"');
  });
  test('dock menu: your own items size the pill and the panel, and a square radius reaches the insets', () => {
    const Dot: IconComponent = (props) => <svg {...props} />;
    const items = [
      { id: 'a', label: 'Alpha', icon: Dot },
      { id: 'b', label: 'Beta', icon: Dot },
      { id: 'c', label: 'Gamma', icon: Dot, items: [{ id: 'd', label: 'Delta', icon: Dot }] },
    ];
    const html = scene(<LiquidDockMenu items={items} aria-label="Sections" />);
    // three glyphs and More: 8 of inset, four 36px slots, three hairlines
    expect(html).toContain('--lqc-dockmenu-pill:155px');
    expect(html).toContain('--lqc-dockmenu-slots:4');
    // three rows: 16 of inset, 96 of rows, 4 of gaps
    expect(html).toContain('--lqc-dockmenu-h:116px');
    expect(html).toContain('aria-label="Sections"');
    expect(html).toContain('aria-label="Gamma" aria-haspopup="menu"');
    const square = scene(<LiquidDockMenu radius={12} />);
    expect(square).toContain('class="lq-lens lqc-dockmenu-glass" style="border-radius:12px"');
    expect(square).toContain('--lqc-dockmenu-item-r:8px');
    expect(square).toContain('--lqc-dockmenu-row-r:4px');
  });
  test('sheet: closed, a trigger that promises a dialog; open, a dialog named and described by its text', () => {
    const html = scene(<LiquidSheet />);
    expect(html).toContain('data-state="closed"');
    expect(html).toContain('aria-haspopup="dialog" aria-expanded="false"');
    expect(html).not.toContain('role="dialog"');
    expect(html).toContain('class="lq-lens lqc-sheet-trigger" style="border-radius:26px"');
    const up = scene(<LiquidSheet defaultOpen />);
    expect(up).toContain('data-state="open"');
    expect(up).toMatch(
      /role="dialog" aria-labelledby="([^"]+)-title" aria-describedby="\1-description"/,
    );
    expect(up).toContain('class="lqc-sheet-action" data-primary="">Export PNG</button>');
    expect(up).toContain('aria-label="Close"');
    expect(up).toContain(
      'class="lqc-sheet-scrim" data-shown="" data-no-drag="" aria-hidden="true"',
    );
    expect(up).toContain(
      'class="lq-lens lqc-sheet-pane" style="border-radius:28px;--lq-inner-r:12px"',
    );
    expect(scene(<LiquidSheet open={false} defaultOpen />)).not.toContain('role="dialog"');
  });
  test('every morph is closed at rest: one pane, a button that promises what it opens, and nothing open in the markup', () => {
    const plus = scene(<LiquidPlusButton />);
    expect(plus).toContain('data-slot="liquid-plus-button" data-state="closed"');
    expect(plus).toContain('aria-label="Create" aria-haspopup="menu" aria-expanded="false"');
    expect(plus).not.toContain('role="menu"');
    expect(plus.match(/data-slot="liquid-surface"/g)).toHaveLength(1);
    // four rows of 40 and their hairlines above the 56px round, inside a 6px inset
    expect(plus).toContain('--lqc-plus-panel-h:228px');
    expect(plus).toContain('--lqc-plus-row-r:22px');

    const menu = scene(<LiquidMenuButton />);
    expect(menu).toContain('data-slot="liquid-menu-button" data-state="closed"');
    expect(menu).toContain('aria-label="Menu" aria-haspopup="menu" aria-expanded="false"');
    expect(menu).toContain(
      '<span class="lqc-menubtn-bars" aria-hidden="true"><span></span><span></span><span></span></span>',
    );
    expect(menu).not.toContain('role="menu"');
    expect(menu).toContain('--lqc-menubtn-panel-h:266px');

    const pillHtml = scene(<LiquidActionPill />);
    expect(pillHtml).toContain('data-slot="liquid-action-pill" data-state="closed"');
    expect(pillHtml).toContain('aria-label="Actions" aria-expanded="false"');
    expect(pillHtml).not.toContain('role="toolbar"');
    // the round plus four 40px slots and their hairlines, plus the trailing inset
    expect(pillHtml).toContain('--lqc-pill-open-w:220px');

    const dock = scene(<LiquidActionDock />);
    expect(dock).toContain('data-slot="liquid-action-dock" data-state="closed"');
    expect(dock).toContain('aria-label="Create" aria-haspopup="menu" aria-expanded="false"');
    expect(dock).not.toContain('role="menu"');
    expect(dock.match(/data-slot="liquid-surface"/g)).toHaveLength(1);

    const bar = scene(<LiquidContextToolbar />);
    expect(bar).toContain('data-slot="liquid-context-toolbar" data-state="closed"');
    expect(bar).toContain('aria-label="Text format" aria-expanded="false"');
    expect(bar).not.toContain('role="toolbar"');
    expect(bar).not.toContain('data-lifted');

    const cmd = scene(<LiquidCommandPalette />);
    expect(cmd).toContain('data-slot="liquid-command-palette" data-state="closed"');
    expect(cmd).toContain('aria-expanded="false" aria-haspopup="listbox"');
    expect(cmd).toContain('Search commands');
    expect(cmd).not.toContain('role="combobox"');
    expect(cmd).toContain('--lqc-cmd-panel-h:308px');
  });
  test('every morph open: the rows, tools or options are in the markup with their roles, and the trigger says so', () => {
    const plus = scene(<LiquidPlusButton defaultOpen />);
    expect(plus).toContain('data-state="open"');
    expect(plus).toContain('aria-expanded="true"');
    expect(plus.match(/role="menuitem"/g)).toHaveLength(4);
    expect(plus).toContain('New note');

    const menu = scene(
      <LiquidMenuButton defaultOpen items={['One', 'Two', 'Three']} current="Two" />,
    );
    expect(menu.match(/role="menuitem"/g)).toHaveLength(3);
    expect(menu).toContain('aria-current="page"');
    expect(menu).toContain('--lqc-menubtn-panel-h:182px');

    const pillHtml = scene(<LiquidActionPill defaultOpen />);
    expect(pillHtml).toContain('role="toolbar" aria-label="Actions"');
    expect(pillHtml.match(/class="lqc-pill-action"/g)).toHaveLength(4);
    expect(pillHtml).toContain('aria-label="Copy link"');

    const dock = scene(<LiquidActionDock defaultOpen />);
    expect(dock.match(/role="menuitem"/g)).toHaveLength(3);
    // three satellites and the button: four panes of two sizes
    expect(dock.match(/data-slot="liquid-surface"/g)).toHaveLength(4);
    expect(dock).toContain('border-radius:22px');
    // the middle one sits straight above; three span a three-quarter arc, so the outer two sit 67.5 degrees off it
    expect(dock).toContain('--x:0.0px;--y:-88.0px');
    expect(dock).toContain('--x:-81.3px;--y:-33.7px');

    const bar = scene(
      <LiquidContextToolbar
        defaultOpen
        defaultValue={{ bold: true, italic: false, underline: false, align: 'center' }}
      />,
    );
    expect(bar).toContain('role="toolbar" aria-label="Text format"');
    expect(bar).toContain('aria-label="Bold" aria-pressed="true"');
    expect(bar).toContain('aria-label="Italic" aria-pressed="false"');
    expect(bar).toContain('role="radiogroup" aria-label="Alignment"');
    expect(bar).toContain('aria-label="Align centre" aria-checked="true"');
    expect(bar.match(/data-slot="liquid-surface"/g)).toHaveLength(2);

    const cmd = scene(<LiquidCommandPalette defaultOpen />);
    expect(cmd).toContain('aria-expanded="true" aria-haspopup="listbox" inert=""');
    expect(cmd).toMatch(
      /role="combobox" aria-expanded="true" aria-controls="([^"]+)-list" aria-activedescendant="\1-preset"/,
    );
    expect(cmd).toContain('role="listbox" aria-label="Commands"');
    expect(cmd.match(/role="option"/g)).toHaveLength(6);
    expect(cmd.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(cmd).toContain('placeholder="Type a command"');
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
    expect(html).toContain('aria-live="polite"><span data-from="below">3</span>');
    expect(html).toContain('--lq-inner-r:4px');
  });
  test('tab indicator: a tablist with one selected tab and a decorative blob', () => {
    const html = scene(<LiquidTabIndicator />);
    expect(html).toContain('role="tablist"');
    expect(html.match(/role="tab"/g)).toHaveLength(4);
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html).toContain('class="lqc-indicator-blob" aria-hidden="true"');
  });
  test('search: a round button holding a folded, disabled field and no results panel', () => {
    const html = scene(<LiquidSearch />);
    expect(html).toContain('class="lqc-search-toggle" aria-label="Search" aria-expanded="false"');
    expect(html).toContain('placeholder="Search the material" aria-label="Search" disabled=""');
    expect(html).not.toContain('data-open');
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
    // there is no right button on a phone, so the hint has a touch half too
    expect(html).toContain('Long-press anywhere on the scene');
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
