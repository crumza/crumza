import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../src/web/components/Button';
import {
  AdaptiveGlass,
  adaptiveGlass,
  colorLightness,
  estimateLuminance,
  GlassBackground,
  lightnessFromLuminance,
  luminanceBand,
  meanLightness,
  parseColor,
} from '../src/web/adaptive';

describe('colour reading', () => {
  test('hex, rgb, hsl and oklch agree on white and black', () => {
    for (const white of [
      '#fff',
      '#ffffff',
      'rgb(255 255 255)',
      'hsl(0 0% 100%)',
      'oklch(1 0 0)',
      'white',
    ]) {
      expect(colorLightness(white)).toBeCloseTo(1, 2);
    }
    for (const black of ['#000', 'rgb(0, 0, 0)', 'hsl(0, 0%, 0%)', 'oklab(0 0 0)', 'black']) {
      expect(colorLightness(black)).toBeCloseTo(0, 2);
    }
  });
  test('lightness is perceptual: mid grey reads near the middle', () => {
    expect(colorLightness('#808080')).toBeGreaterThan(0.5);
    expect(colorLightness('#808080')).toBeLessThan(0.6);
    expect(lightnessFromLuminance(0.18)).toBeCloseTo(0.5, 1);
  });
  test('alpha is carried and transparent is skipped', () => {
    expect(parseColor('rgb(0 0 0 / 50%)')?.a).toBeCloseTo(0.5);
    expect(parseColor('rgba(0, 0, 0, 0.25)')?.a).toBeCloseTo(0.25);
    expect(colorLightness('transparent')).toBeUndefined();
  });
  test('unknown input is undefined rather than a guess', () => {
    expect(parseColor('url(/x.png)')).toBeUndefined();
    expect(parseColor('#12')).toBeUndefined();
    expect(estimateLuminance('url(/liquid/bloom.png)')).toBeUndefined();
  });
});

describe('background estimate', () => {
  test('a gradient averages its stops', () => {
    expect(estimateLuminance('linear-gradient(white, black)')).toBeCloseTo(0.5, 2);
    const light = estimateLuminance(
      'linear-gradient(135deg, #fbfbf9 0%, #eceee9 55%, #dfe4ea 100%)',
    );
    const dark = estimateLuminance(
      'linear-gradient(135deg, #15181d 0%, #1f2530 55%, #0f1216 100%)',
    );
    expect(light).toBeGreaterThan(0.85);
    expect(dark).toBeLessThan(0.2);
    expect(luminanceBand(light ?? 0)).toBe('light');
    expect(luminanceBand(dark ?? 1)).toBe('dark');
  });
  test('nested colour functions inside a list are found', () => {
    const value = estimateLuminance(
      'radial-gradient(circle at 20% 30%, oklch(0.78 0.19 35) 0, transparent 40%), linear-gradient(oklch(0.96 0.02 80), oklch(0.9 0.03 250))',
    );
    expect(value).toBeDefined();
    expect(value ?? 0).toBeGreaterThan(0.7);
  });
  test('image bytes average to a lightness', () => {
    const bytes = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
    expect(meanLightness(bytes)).toBeCloseTo(0.76, 1);
    expect(meanLightness(bytes, 4, 4, 8)).toBeCloseTo(0, 2);
    expect(meanLightness(new Uint8ClampedArray(0))).toBeUndefined();
  });
});

describe('adaptive attributes', () => {
  test('only what is set is emitted', () => {
    expect(adaptiveGlass()).toEqual({ 'data-glass-adaptive': '' });
    expect(adaptiveGlass({ glint: true })).toEqual({ 'data-glass-adaptive': '' });
    const all = adaptiveGlass({ variant: 'clear', scale: 'large', glint: false, frosted: true });
    expect(all['data-glass-variant']).toBe('clear');
    expect(all['data-glass-scale']).toBe('large');
    expect(all['data-glass-glint']).toBe('0');
    expect(all['data-glass-frosted']).toBe('');
    expect(all.style).toBeUndefined();
  });
  test('tint is bounded and carries its lightness for the ink decision', () => {
    const style = adaptiveGlass({ tint: '#245c46' }).style as Record<string, string | number>;
    expect(style['--glass-tint']).toBe('#245c46');
    expect(style['--glass-tint-amount']).toBeLessThanOrEqual(0.4);
    expect(style['--glass-tint-luminance']).toBeLessThan(0.5);
    const clear = adaptiveGlass({ tint: 'white', variant: 'clear' }).style as Record<
      string,
      number
    >;
    expect(clear['--glass-tint-amount']).toBeLessThan(0.34);
  });
});

describe('server rendering', () => {
  test('GlassBackground publishes a declared or derived luminance and no window access', () => {
    const declared = renderToStaticMarkup(<GlassBackground luminance="dark">x</GlassBackground>);
    expect(declared).toContain('data-glass-adaptive');
    expect(declared).toContain('data-glass-backdrop="dark"');
    expect(declared).toContain('--glass-backdrop-luminance:0.1');
    const derived = renderToStaticMarkup(
      <GlassBackground background="linear-gradient(white, #eee)">x</GlassBackground>,
    );
    expect(derived).toContain('data-glass-backdrop="light"');
    const image = renderToStaticMarkup(<GlassBackground image="/a.png">x</GlassBackground>);
    expect(image).not.toContain('--glass-backdrop-luminance');
    expect(image).toContain('background-size:cover');
  });
  test('AdaptiveGlass is a Glass with the material attributes, and Button takes them as a spread', () => {
    const glass = renderToStaticMarkup(
      <AdaptiveGlass
        variant="clear"
        scale="large"
        tint="oklch(0.62 0.19 255)"
        glint={false}
        frosted
      >
        pane
      </AdaptiveGlass>,
    );
    expect(glass).toContain('class="glass"');
    expect(glass).toContain('data-glass-variant="clear"');
    expect(glass).toContain('data-glass-scale="large"');
    expect(glass).toContain('data-glass-glint="0"');
    expect(glass).toContain('data-glass-frosted');
    expect(glass).toContain('--glass-tint-amount:0.22');
    const button = renderToStaticMarkup(<Button {...adaptiveGlass({ scale: 'small' })}>Go</Button>);
    expect(button).toContain('data-glass-scale="small"');
    expect(button).toContain('crumza-button crumza-surface');
  });
});
