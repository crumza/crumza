import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  LiquixButton,
  LiquixField,
  LiquixMenu,
  LiquixPopover,
  LiquixSegmentedControl,
  LiquixSwitch,
  LiquixToaster,
  liquixToast,
} from '../src/web';

describe('liquix controls on the server', () => {
  test('a segmented control is a radiogroup of radios sharing the bar', () => {
    const html = renderToStaticMarkup(
      <LiquixSegmentedControl
        label="Range"
        options={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month', disabled: true },
        ]}
        defaultValue="week"
      />,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Range"');
    expect(html.match(/role="radio"/g)).toHaveLength(3);
    expect(html).toMatch(/aria-checked="true"[^>]*tabindex="0"[^>]*data-state="active"/);
    expect(html).toContain('disabled=""');
    expect(html).toContain('height:40px');
    expect(html).toContain('data-slot="liquix-segmented-control-bar"');
    // Both coloured copies of every label, clipped to the capsule and around it.
    expect(html.match(/text-blue-600/g)).toHaveLength(3);
    expect(html.match(/clip-path:polygon\(/g)).toHaveLength(2);
  });

  test('a button is a real button of glass that sizes to its label', () => {
    const html = renderToStaticMarkup(
      <LiquixButton size="lg" disabled className="mt-2">
        Go
      </LiquixButton>,
    );
    expect(html).toStartWith('<button');
    expect(html).toContain('type="button"');
    expect(html).toContain('disabled');
    expect(html).toContain('data-slot="liquix-button"');
    expect(html).toContain('h-13');
    expect(html).toContain('mt-2');
    // Away from a surface it is CSS glass.
    expect(html).toContain('data-fallback=""');
    expect(html).toContain('liquix-glass-lens');
  });

  test('a field wraps a live input in a trough', () => {
    const html = renderToStaticMarkup(
      <LiquixField
        aria-label="Search"
        placeholder="Search"
        leading={<svg aria-hidden="true" />}
        className="w-72"
      />,
    );
    expect(html).toContain('data-slot="liquix-field"');
    expect(html).toContain('<input');
    expect(html).toContain('aria-label="Search"');
    expect(html).toContain('placeholder="Search"');
    expect(html).toContain('liquix-glass-pane');
  });

  test('a switch is a switch, with its knob on the checked side', () => {
    const off = renderToStaticMarkup(<LiquixSwitch aria-label="Wi-Fi" />);
    const on = renderToStaticMarkup(<LiquixSwitch aria-label="Wi-Fi" defaultChecked />);
    expect(off).toContain('role="switch"');
    expect(off).toContain('aria-checked="false"');
    expect(on).toContain('aria-checked="true"');
    expect(on).toContain('data-state="checked"');
    expect(off).toContain('width:52px;height:32px');
    expect(off).toContain('data-slot="liquix-switch-knob"');
    // The tint has a hole where the knob rests: at the left when off.
    expect(off).toContain('clip-path:polygon(16.00px 0px');
    expect(on).toContain('clip-path:polygon(36.00px 0px');
  });

  test('a closed menu is its trigger alone; open, it is a menu of items', () => {
    const items = [
      { id: 'new', label: 'New' },
      { id: 'delete', label: 'Delete', disabled: true },
    ];
    const closed = renderToStaticMarkup(
      <LiquixMenu label="Options" items={items} onSelect={() => undefined} />,
    );
    expect(closed).toContain('aria-haspopup="menu"');
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).not.toContain('role="menu"');
    const open = renderToStaticMarkup(
      <LiquixMenu label="Options" items={items} onSelect={() => undefined} defaultOpen />,
    );
    expect(open).toContain('role="menu"');
    expect(open.match(/role="menuitem"/g)).toHaveLength(2);
    expect(open).toContain('aria-disabled="true"');
    expect(open).toContain('data-slot="liquix-menu-panel"');
  });

  test('a popover is closed until shown, and open it describes its trigger', () => {
    const closed = renderToStaticMarkup(
      <LiquixPopover content="Hi">
        <button type="button">Open</button>
      </LiquixPopover>,
    );
    expect(closed).not.toContain('role="tooltip"');
    expect(closed).not.toContain('aria-describedby');
    const open = renderToStaticMarkup(
      <LiquixPopover content="Hi" defaultOpen>
        <button type="button">Open</button>
      </LiquixPopover>,
    );
    expect(open).toContain('role="tooltip"');
    expect(open).toContain('Hi');
    expect(open).toMatch(/aria-describedby="([^"]+)"[\s\S]*id="\1"/);
  });

  test('the toaster is a live region, empty on the server, and toasts queue', () => {
    const html = renderToStaticMarkup(<LiquixToaster position="top" align="end" />);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('top-4');
    expect(html).toContain('items-end');
    expect(html).not.toContain('data-slot="liquix-toast"');
    const id = liquixToast('Saved', { duration: 0 });
    expect(id).toBeGreaterThan(0);
    liquixToast.dismiss(id);
  });
});
