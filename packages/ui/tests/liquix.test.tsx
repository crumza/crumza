import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  LiquixCapsule,
  LiquixCircle,
  LiquixStage,
  LiquixSurface,
  LiquixTabs,
  LiquixTabsShadow,
} from '../src/web';
import {
  defaultLiquixParams,
  defaultLiquixSurfaceParams,
  PANEL_KINDS,
} from '../src/web/liquix/params';
import { tileWindow } from '../src/web/liquix/backdrop';
import { LiquixCapsule, LiquixCircle, LiquixStage } from '../src/web';
import { defaultLiquixParams, frostedLiquixParams, PANEL_KINDS } from '../src/web/liquix/params';
import { gaussianKernel } from '../src/web/liquix/renderer';
import { MAX_SHAPES } from '../src/web/liquix/shader-lib';
import { FRAGMENT_MAIN, MAX_PANELS } from '../src/web/liquix/shaders';

describe('liquix shapes', () => {
  test('the capsule takes its corner radius from half its height', () => {
    const html = renderToStaticMarkup(<LiquixCapsule>Liquid Glass</LiquixCapsule>);
    expect(html).toContain('width:216px');
    expect(html).toContain('height:92px');
    expect(html).toContain('border-radius:46px');
    expect(html).toContain('data-slot="liquix-capsule"');
  });

  test('a taller capsule keeps the radius at half the height', () => {
    const html = renderToStaticMarkup(<LiquixCapsule width={300} height={60} />);
    expect(html).toContain('width:300px');
    expect(html).toContain('border-radius:30px');
  });

  test('the circle is square, at half its side', () => {
    const html = renderToStaticMarkup(<LiquixCircle>★</LiquixCircle>);
    expect(html).toContain('width:88px');
    expect(html).toContain('height:88px');
    expect(html).toContain('border-radius:44px');
    expect(html).toContain('data-slot="liquix-circle"');
  });

  test('the circle accepts a single dimension in place of size', () => {
    expect(renderToStaticMarkup(<LiquixCircle size={64} />)).toContain('height:64px');
    expect(renderToStaticMarkup(<LiquixCircle width={64} />)).toContain('height:64px');
    expect(renderToStaticMarkup(<LiquixCircle height={64} />)).toContain('width:64px');
  });

  test('outside a stage a shape marks itself as the CSS fallback', () => {
    expect(renderToStaticMarkup(<LiquixCapsule />)).toContain('data-fallback=""');
  });

  test('a shape is a real button, and passes its own props through', () => {
    const html = renderToStaticMarkup(
      <LiquixCapsule disabled title="Capsule" aria-label="Buy" className="text-lg" />,
    );
    expect(html).toStartWith('<button');
    expect(html).toContain('type="button"');
    expect(html).toContain('disabled');
    expect(html).toContain('title="Capsule"');
    expect(html).toContain('aria-label="Buy"');
    expect(html).toContain('class="liquix-button text-lg"');
  });
});

describe('liquix stage', () => {
  test('renders one panel per entry and stays server safe', () => {
    const html = renderToStaticMarkup(
      <LiquixStage
        panels={[
          { kind: PANEL_KINDS.checker, label: 'Checker' },
          { kind: PANEL_KINDS.spectrum, label: 'Spectrum' },
        ]}
      >
        <LiquixCapsule>Buy</LiquixCapsule>
      </LiquixStage>,
    );
    expect(html.match(/liquix-stage__panel/g)).toHaveLength(2);
    expect(html).toContain('Checker');
    expect(html).toContain('data-slot="liquix-capsule"');
  });

  test('the row gap comes from the effect parameters', () => {
    const html = renderToStaticMarkup(
      <LiquixStage params={{ rowGap: 12 }}>
        <LiquixCircle />
      </LiquixStage>,
    );
    expect(html).toContain('gap:12px');
  });

  test('a frosted stage marks itself, and clear glass does not', () => {
    const frosted = renderToStaticMarkup(
      <LiquixStage frosted>
        <LiquixCapsule>Buy</LiquixCapsule>
      </LiquixStage>,
    );
    expect(frosted).toContain('data-slot="liquix-stage" data-frosted=""');
    expect(renderToStaticMarkup(<LiquixStage />)).not.toContain('data-frosted');
  });

  test('overrides still win over the frosted material', () => {
    const html = renderToStaticMarkup(
      <LiquixStage frosted params={{ rowGap: 7 }}>
        <LiquixCircle />
      </LiquixStage>,
    );
    expect(html).toContain('gap:7px');
  });
});

describe('liquix materials', () => {
  test('clear glass leaves the backdrop colour alone and shows no veil', () => {
    expect(defaultLiquixParams.saturation).toBe(100);
    expect(defaultLiquixParams.tint.a).toBe(0);
  });

  test('frosted is the Dock material: softened, a little saturated, thinly milked, soft at the rim', () => {
    expect(frostedLiquixParams.blurRadius).toBeGreaterThan(defaultLiquixParams.blurRadius * 2);
    expect(frostedLiquixParams.saturation).toBeGreaterThan(100);
    // a thin veil: the backdrop stays a picture through it, never a slab
    expect(frostedLiquixParams.tint).toEqual({ r: 255, g: 255, b: 255, a: 0.2 });
    expect(frostedLiquixParams.refDispersion).toBeLessThan(defaultLiquixParams.refDispersion);
    expect(frostedLiquixParams.refDistance).toBeLessThan(defaultLiquixParams.refDistance);
    expect(frostedLiquixParams.fresnelRange).toBeLessThan(defaultLiquixParams.fresnelRange);
    expect(frostedLiquixParams.glareFactor).toBeLessThan(defaultLiquixParams.glareFactor);
    // the bevel is a few pixels, not a frame: a wide one reads as a thick border
    expect(frostedLiquixParams.refThickness).toBeLessThanOrEqual(6);
    // the labels keep some protection over bright content, a touch less than
    // clear glass so the frost stays light
    expect(frostedLiquixParams.overLight).toBeGreaterThan(0);
    expect(frostedLiquixParams.overLight).toBeLessThanOrEqual(defaultLiquixParams.overLight);
    // and the physics are the same glass
    expect(frostedLiquixParams.pullBounce).toBe(defaultLiquixParams.pullBounce);
    expect(frostedLiquixParams.pullSaturation).toBe(defaultLiquixParams.pullSaturation);
  });
});

describe('liquix pipeline limits', () => {
  test('the blur kernel is normalised around its centre tap', () => {
    const kernel = gaussianKernel(defaultLiquixParams.blurRadius);
    const sum = kernel.weights.reduce((total, w, i) => total + (i === 0 ? w : w * 2), 0);
    expect(sum).toBeCloseTo(1, 10);
    expect(kernel.radius).toBe(8);
  });

  test('the kernel radius stays inside the range the shader declares', () => {
    expect(gaussianKernel(0).radius).toBe(1);
    expect(gaussianKernel(4096).radius).toBe(64);
  });

  test('the shader array bounds are what the stage allocates against', () => {
    expect(MAX_SHAPES).toBe(6);
    expect(MAX_PANELS).toBe(8);
  });
});

describe('liquix surface', () => {
  const paint = () => 0;

  test('renders content, underlay and overlay in their layers, and stays server safe', () => {
    const html = renderToStaticMarkup(
      <LiquixSurface
        paint={paint}
        paintKey="home"
        className="h-full w-full"
        underlay={<span>under</span>}
        overlay={<span>over</span>}
      >
        <p>content</p>
      </LiquixSurface>,
    );
    expect(html).toContain('data-slot="liquix-surface"');
    expect(html).toContain('class="relative overflow-hidden h-full w-full"');
    expect(html).toContain('<section tabindex="0" data-slot="liquix-surface-scroll"');
    expect(html).toContain('<p>content</p>');
    expect(html.indexOf('<span>under</span>')).toBeLessThan(html.indexOf('<canvas'));
    expect(html.indexOf('<canvas')).toBeLessThan(html.indexOf('<span>over</span>'));
    expect(html).not.toContain('data-fallback');
  });

  test('the surface defaults keep the shared pipeline but cut its physics and shadow', () => {
    expect(defaultLiquixSurfaceParams.refFactor).toBe(defaultLiquixParams.refFactor);
    expect(defaultLiquixSurfaceParams.tint).toEqual({ r: 18, g: 22, b: 30, a: 0.45 });
    expect(defaultLiquixSurfaceParams.blurRadius).toBe(6);
    expect(defaultLiquixSurfaceParams.refDispersion).toBe(3);
    expect(defaultLiquixSurfaceParams.blurEdge).toBe(false);
    // The bending lives in a rim, not the body: a pane of glass, not a lens.
    expect(defaultLiquixSurfaceParams.refThickness).toBe(10);
    expect(defaultLiquixSurfaceParams.overLight).toBe(50);
    expect(defaultLiquixSurfaceParams.pullStretch).toBe(0);
    expect(defaultLiquixSurfaceParams.pullSquash).toBe(0);
    expect(defaultLiquixSurfaceParams.pullShift).toBe(0);
    expect(defaultLiquixSurfaceParams.shadowFactor).toBe(0);
  });

  test('a long screen is handed the tiles around the scroll, with the scroll measured from them', () => {
    // Tiles of 500px. Short content passes straight through.
    expect(tileWindow(0, 500, 3)).toEqual({ first: 0, scroll: 0 });
    expect(tileWindow(1200, 500, 3)).toEqual({ first: 2, scroll: 200 });
    // Deep into a strip longer than the shader can take, the window slides with the scroll.
    expect(tileWindow(4700, 500, 12)).toEqual({ first: 9, scroll: 200 });
    // The last tile is the furthest the window starts, and an empty strip asks for nothing.
    expect(tileWindow(9000, 500, 12)).toEqual({ first: 11, scroll: 3500 });
    expect(tileWindow(300, 500, 0)).toEqual({ first: 0, scroll: 0 });
    expect(tileWindow(300, 0, 4)).toEqual({ first: 0, scroll: 0 });
  });

  test('the glass pass can punch everything outside the shape to alpha 0', () => {
    expect(FRAGMENT_MAIN).toContain('uniform int u_cutout;');
    expect(FRAGMENT_MAIN).toContain('float glassAlpha = coverage * alpha;');
    // The shadow is alpha outside the glass on a stencilled canvas only.
    expect(FRAGMENT_MAIN).toContain('float shadowAlpha = shade * (1.0 - coverage);');
  });

  test('a shape on a stencilled canvas can fade by its own alpha', () => {
    expect(FRAGMENT_MAIN).toContain('uniform float u_shapeAlpha[MAX_SHAPES];');
    expect(FRAGMENT_MAIN).toContain('alpha = u_shapeAlpha[owner];');
  });
});

describe('liquix tabs', () => {
  const Dot = () => <svg aria-hidden="true" />;
  const tabs = [
    { id: 'home', label: 'Home', Icon: Dot },
    { id: 'inbox', label: 'Inbox', Icon: Dot },
    { id: 'explore', label: 'Explore', Icon: Dot },
  ];

  test('a tablist of real buttons, the selected one marked', () => {
    const html = renderToStaticMarkup(
      <LiquixTabs tabs={tabs} active="inbox" onChange={() => undefined} width={390} />,
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Sections"');
    // The bar is dragged, so it must keep the browser's touch gestures off itself.
    expect(html).toMatch(/role="tablist"[^>]*class="[^"]*touch-none select-none/);
    expect(html.match(/role="tab"/g)).toHaveLength(3);
    expect(html).toMatch(/id="[^"]+-liquix-tabs-inbox" aria-selected="true" [^>]*tabindex="0"/);
    expect(html).toMatch(/id="[^"]+-liquix-tabs-home" aria-selected="false" [^>]*tabindex="-1"/);
    expect(html.match(/tabindex="-1"/g)).toHaveLength(2);
    // Colour is the capsule's, not the tab's: every label is drawn in both
    // colours and the two copies are clipped to the capsule and its complement.
    expect(html.match(/text-blue-600/g)).toHaveLength(3);
    expect(html.match(/liquix-ink/g)).toHaveLength(3);
    expect(html).toContain('data-slot="liquix-tabs-labels-active"');
    expect(html.match(/clip-path:polygon\(/g)).toHaveLength(2);
    expect(html).toContain('class="liquix-pill absolute will-change-transform"');
  });

  test('the bar is measured from the surface width and the geometry defaults', () => {
    const html = renderToStaticMarkup(
      <LiquixTabs tabs={tabs} active="home" onChange={() => undefined} width={390} />,
    );
    expect(html).toContain('bottom:28px');
    expect(html).toContain('width:362px;height:56px');
    // The pill is a tab wide, inset 4px each side: 362 / 3 - 8.
    expect(html).toContain(`width:${362 / 3 - 8}px;height:48px;border-radius:24px`);
  });

  test('geometry, label and classes are overridable', () => {
    const html = renderToStaticMarkup(
      <LiquixTabs
        tabs={tabs}
        active="home"
        onChange={() => undefined}
        width={300}
        inset={10}
        bottom={12}
        height={48}
        label="Pages"
        activeClassName="text-red-500"
        inactiveClassName="text-stone-500"
        pillClassName="bg-stone-200"
      />,
    );
    expect(html).toContain('aria-label="Pages"');
    expect(html).toContain('bottom:12px');
    expect(html).toContain('width:280px;height:48px');
    expect(html.match(/text-red-500/g)).toHaveLength(3);
    expect(html.match(/text-stone-500/g)).toHaveLength(3);
    expect(html).toContain('bg-stone-200');
    expect(html).not.toContain('text-blue-600');
    expect(html).toContain('liquix-pill absolute will-change-transform bg-stone-200');
  });

  test('outside a surface the pane and highlight fall back to CSS glass', () => {
    const html = renderToStaticMarkup(
      <LiquixTabs tabs={tabs} active="home" onChange={() => undefined} width={390} />,
    );
    expect(html).toContain('liquix-glass-pane');
    expect(html).toContain('liquix-glass-lens');
  });

  test('the shadow is the bar, one box down, for the surface underlay', () => {
    const html = renderToStaticMarkup(<LiquixTabsShadow width={390} />);
    expect(html).toContain('data-slot="liquix-tabs-shadow"');
    expect(html).toContain('bottom:28px');
    expect(html).toContain('width:362px;height:56px;border-radius:28px');
    expect(renderToStaticMarkup(<LiquixTabsShadow width={390} inset={20} height={40} />)).toContain(
      'width:350px;height:40px;border-radius:20px',
    );
  });
});
