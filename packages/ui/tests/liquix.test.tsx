import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { LiquixCapsule, LiquixCircle, LiquixStage } from '../src/web';
import { defaultLiquixParams, PANEL_KINDS } from '../src/web/liquix/params';
import { gaussianKernel } from '../src/web/liquix/renderer';
import { MAX_SHAPES } from '../src/web/liquix/shader-lib';
import { MAX_PANELS } from '../src/web/liquix/shaders';

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
