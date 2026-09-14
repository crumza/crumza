import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { appearanceStyle } from '../src/web/appearance';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Scene,
  Theme,
} from '../src/web';
import { mergeProps } from '../src/web/primitives/merge-props';

describe('appearance boundaries', () => {
  test('omission inherits instead of serializing undefined values', () => {
    expect(appearanceStyle({})).toEqual({});
  });
  test('clarity clamps to the documented interval', () => {
    expect(appearanceStyle({ intensity: -2 })['--glass-intensity']).toBe(0);
    expect(appearanceStyle({ intensity: 9 })['--glass-intensity']).toBe(1);
    expect(appearanceStyle({ intensity: 0.35 })['--glass-intensity']).toBe(0.35);
  });
  test('non-finite values cannot leak into CSS', () => {
    expect(appearanceStyle({ intensity: NaN, radius: Infinity })).toEqual({});
  });
  test('radius updates all scoped corner roles and clamps negative input', () => {
    const style = appearanceStyle({ radius: -4 });
    expect(style['--radius-dialog']).toBe('0px');
    expect(style['--radius-field']).toBe('0px');
    expect(style['--radius-control']).toBe('0px');
  });
});
describe('server-rendered contracts', () => {
  test('Button is a native non-submit filled button that inherits its material', () => {
    const html = renderToStaticMarkup(<Button>Save</Button>);
    expect(html).toContain('type="button"');
    expect(html).toContain('data-variant="solid"');
    expect(html).toContain('data-tone="neutral"');
    expect(html).not.toContain('data-material=');
  });
  test('owned optics preserve a single native button and a text-only accessible name', () => {
    const html = renderToStaticMarkup(
      <Scene backdrop="linear-gradient(white, blue)">
        <Button>Save</Button>
      </Scene>,
    );
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain('class="surface-optics" aria-hidden="true"');
    expect(html).not.toContain('<canvas');
    expect(html).toContain('Save</button>');
  });
  test('explicit appearance and native submit/disabled are preserved', () => {
    const html = renderToStaticMarkup(
      <Button type="submit" material="liquid" tone="primary" intensity={2} radius={20} disabled>
        Send
      </Button>,
    );
    expect(html).toContain('type="submit"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('data-material="liquid"');
    expect(html).toContain('--glass-intensity:1');
    expect(html).toContain('border-radius:20px');
  });
  test('legacy glass alias remains usable but a local material wins', () => {
    expect(renderToStaticMarkup(<Button variant="glass">Glass</Button>)).toContain(
      'data-material="liquid"',
    );
    expect(
      renderToStaticMarkup(
        <Button variant="glass" material="solid">
          Solid
        </Button>,
      ),
    ).toContain('data-material="solid"');
  });
  test('Theme serializes paired brand colors and reduced transparency without a provider', () => {
    const html = renderToStaticMarkup(
      <Theme
        material="frosted"
        reducedTransparency
        primary={{ background: '#245c46', foreground: '#ffffff' }}
      >
        Content
      </Theme>,
    );
    expect(html).toContain('data-transparency="reduce"');
    expect(html).toContain('--primary:#245c46');
    expect(html).toContain('--primary-foreground:#ffffff');
  });
  test('dialog metadata exists without accessing window during SSR', () => {
    const html = renderToStaticMarkup(
      <Dialog>
        <DialogContent>
          <DialogTitle>Review</DialogTitle>
          <DialogDescription>Check before saving.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(html).toContain('aria-labelledby=');
    expect(html).toContain('aria-describedby=');
    expect(html).not.toContain('open=""');
  });
});
describe('composition', () => {
  test('consumer preventDefault cancels the internal action', () => {
    const calls: string[] = [];
    const event = { defaultPrevented: false };
    const props = mergeProps(
      { onClick: () => calls.push('internal') },
      {
        onClick: () => {
          event.defaultPrevented = true;
          calls.push('consumer');
        },
      },
    );
    (props['onClick'] as (e: typeof event) => void)(event);
    expect(calls).toEqual(['consumer']);
  });
  test('handlers otherwise compose in consumer-first order', () => {
    const calls: string[] = [];
    const props = mergeProps(
      { onClick: () => calls.push('internal') },
      { onClick: () => calls.push('consumer') },
    );
    (props['onClick'] as () => void)();
    expect(calls).toEqual(['consumer', 'internal']);
  });
  test('descriptions are combined without duplicated ids', () => {
    expect(
      mergeProps({ 'aria-describedby': 'help error' }, { 'aria-describedby': 'error tip' })[
        'aria-describedby'
      ],
    ).toBe('help error tip');
  });
});
