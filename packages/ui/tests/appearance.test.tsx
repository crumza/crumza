import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { AccordionProps, HoverCardProps } from '../src/web';
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Button,
  DateTimePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Scene,
  Skeleton,
  Spinner,
  Theme,
  TimePicker,
} from '../src/web';
import { appearanceStyle } from '../src/web/appearance';
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
describe('accordion contracts', () => {
  const sections = (props: Partial<AccordionProps> = {}): string =>
    renderToStaticMarkup(
      <Accordion {...props}>
        <AccordionItem value="one">
          <AccordionTrigger>One</AccordionTrigger>
          <AccordionPanel>First</AccordionPanel>
        </AccordionItem>
        <AccordionItem value="two">
          <AccordionTrigger>Two</AccordionTrigger>
          <AccordionPanel>Second</AccordionPanel>
        </AccordionItem>
      </Accordion>,
    );

  test('a trigger is a native button in a heading, wired to its own panel', () => {
    const html = sections({ defaultValue: ['one'] });
    expect(html).toContain('<h3');
    expect(html).toContain('type="button"');
    const trigger = html.match(/id="([^"]+-trigger-one)"/)?.[1];
    const panel = html.match(/id="([^"]+-panel-one)"/)?.[1];
    expect(trigger).toBeDefined();
    expect(panel).toBeDefined();
    expect(html).toContain(`aria-controls="${panel}"`);
    expect(html).toContain(`aria-labelledby="${trigger}"`);
    // A labelled section is a region natively, so the role is not spelled out.
    expect(html).toContain('<section');
    expect(html).not.toContain('role="region"');
  });
  test('closed panels collapse rather than unmount, so their content survives', () => {
    const html = sections({ defaultValue: ['one'] });
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('Second');
    // The close is a CSS collapse, so no `hidden` attribute can short-circuit the transition.
    expect(html).not.toContain('hidden=""');
    expect(html.match(/data-state="closed"/g)).toHaveLength(3);
    // The type size sits on the root, where tailwind-merge cannot mistake it for a colour.
    expect(html).toContain('w-full text-ui');
    expect(html).toContain('pb-3 text-muted-foreground');
  });
  test('the collapsing track wraps the content, which keeps the consumer class', () => {
    const html = sections({ defaultValue: ['one'], multiple: true });
    expect(html).toContain('class="accordion-panel"');
    expect(html).toContain('class="accordion-track"');
  });
  test('without multiple a stale array cannot open two panels at once', () => {
    const html = sections({ defaultValue: ['one', 'two'] });
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
    expect(html).toContain('data-value="one" data-state="open"');
  });
  test('multiple honours every value it is given', () => {
    const html = sections({ defaultValue: ['one', 'two'], multiple: true });
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(2);
    expect(html).not.toContain('data-state="closed"');
  });
  test('the heading level follows the surrounding document', () => {
    expect(sections({ headingLevel: 2 })).toContain('<h2');
    expect(sections({ headingLevel: 6 })).toContain('<h6');
  });
  test('a part outside its accordion fails loudly instead of rendering unlabelled', () => {
    expect(() => renderToStaticMarkup(<AccordionPanel />)).toThrow('<AccordionPanel>');
  });
});
describe('date-time picker contracts', () => {
  const when = new Date(2026, 2, 14, 9, 5);

  test('the grid is a labelled table of six weeks, each day named in full', () => {
    const html = renderToStaticMarkup(
      <DateTimePicker defaultValue={when} locale="en-GB" aria-label="Starts at" />,
    );
    expect(html).toContain('role="grid"');
    expect(html).toContain('March 2026');
    // Six rows of seven, so the panel keeps one height as the months change.
    expect(html.match(/<tr>/g)).toHaveLength(7);
    expect(html.match(/data-slot="calendar-day"/g)).toHaveLength(42);
    expect(html).toContain('aria-label="Saturday, 14 March 2026"');
  });
  test('one tab stop for the whole grid, on the selected day', () => {
    const html = renderToStaticMarkup(<DateTimePicker defaultValue={when} locale="en-GB" />);
    const days = html.match(/<button[^>]*data-slot="calendar-day"[^>]*>/g) ?? [];
    expect(days.filter((day) => day.includes('tabindex="0"'))).toHaveLength(1);
    expect(days.filter((day) => day.includes('tabindex="-1"'))).toHaveLength(41);
    expect(html).toContain('data-day="2026-03-14" data-state="selected"');
  });
  test('a form gets the local wall clock, with no zone for a server to misread', () => {
    expect(
      renderToStaticMarkup(<DateTimePicker defaultValue={when} name="starts" locale="en-GB" />),
    ).toContain('name="starts" value="2026-03-14T09:05"');
    expect(
      renderToStaticMarkup(
        <DateTimePicker defaultValue={when} name="starts" time={false} locale="en-GB" />,
      ),
    ).toContain('name="starts" value="2026-03-14"');
    expect(renderToStaticMarkup(<DateTimePicker name="starts" />)).toContain(
      'name="starts" value=""',
    );
  });
  test('no name means no hidden input to submit', () => {
    expect(renderToStaticMarkup(<DateTimePicker defaultValue={when} />)).not.toContain(
      'type="hidden"',
    );
  });
  test('bounds disable the days outside them and the arrow that only leads further out', () => {
    const html = renderToStaticMarkup(
      <DateTimePicker
        defaultValue={when}
        min={new Date(2026, 2, 10)}
        max={new Date(2026, 2, 20)}
        locale="en-GB"
      />,
    );
    const days = html.match(/<button[^>]*data-slot="calendar-day"[^>]*>/g) ?? [];
    expect(days).toHaveLength(42);
    // Only 10..20 March are reachable; the other 31 cells in the grid are out of bounds.
    // They stay focusable and refuse, rather than dropping out of the arrow-key path.
    expect(days.filter((day) => day.includes('aria-disabled="true"')).length).toBe(31);
    expect(days.filter((day) => day.includes('disabled=""')).length).toBe(0);
    expect(html).toContain('aria-label="Previous month, February 2026"');
    // Today is outside the window, so the shortcut to it is closed too.
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Today<\/button>/);
  });
  test('an empty picker shows the placeholder and offers nothing to clear', () => {
    const html = renderToStaticMarkup(<DateTimePicker placeholder="Choose a slot" />);
    expect(html).toContain('Choose a slot');
    expect(html).toContain('data-empty=""');
    expect(html).not.toContain('data-state="selected"');
  });
  test('the clock is the segmented field, carrying the picked time, and goes with time off', () => {
    const html = renderToStaticMarkup(<DateTimePicker defaultValue={when} locale="en-GB" />);
    expect(html).toContain('data-slot="time-picker"');
    expect(html).toContain('aria-label="Hour"');
    expect(html).toContain('>09</span>');
    expect(html).toContain('>05</span>');
    expect(renderToStaticMarkup(<DateTimePicker defaultValue={when} time={false} />)).not.toContain(
      'data-slot="time-picker"',
    );
  });
  test('the week can start on any day the locale needs', () => {
    const sunday = renderToStaticMarkup(
      <DateTimePicker defaultValue={when} weekStartsOn={0} locale="en-GB" />,
    );
    expect(sunday.indexOf('Sun')).toBeLessThan(sunday.indexOf('Mon'));
    const monday = renderToStaticMarkup(<DateTimePicker defaultValue={when} locale="en-GB" />);
    expect(monday.indexOf('Mon')).toBeLessThan(monday.indexOf('Sun'));
  });
});
describe('hover card contracts', () => {
  const card = (props: Partial<HoverCardProps> = {}): string =>
    renderToStaticMarkup(
      <HoverCard {...props}>
        <HoverCardTrigger>@crumza</HoverCardTrigger>
        <HoverCardContent>Tailwind-first React components.</HoverCardContent>
      </HoverCard>,
    );

  test('the trigger is a native button wired to the card it opens', () => {
    const html = card();
    expect(html).toContain('type="button"');
    const id = html.match(/aria-controls="([^"]+)"/)?.[1];
    expect(id).toBeDefined();
    expect(html).toContain(`id="${id}"`);
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
  });
  test('the card is a manual popover, so it never dismisses the overlay around it', () => {
    const html = card();
    expect(html).toContain('popover="manual"');
    expect(html).toContain('role="dialog"');
    // Closed is a CSS state: the markup stays put so the exit transition has something to run
    // on, and no `hidden` attribute can short-circuit it.
    expect(html).toContain('data-state="closed"');
    expect(html).toContain('Tailwind-first React components.');
    expect(html).not.toContain('hidden=""');
  });
  test('defaultOpen renders the card open on the server', () => {
    const html = card({ defaultOpen: true });
    expect(html).toContain('aria-expanded="true"');
    expect(html.match(/data-state="open"/g)).toHaveLength(2);
  });
});
describe('time picker contracts', () => {
  /** The markup of each scrolling column, in the order they are drawn. */
  const columnsOf = (html: string): readonly string[] =>
    html.split('data-slot="time-column"').slice(1);

  test('each segment is a spinbutton with its own range, under one group', () => {
    const html = renderToStaticMarkup(
      <TimePicker defaultValue="09:05" locale="en-GB" aria-label="Start" />,
    );
    expect(html).toContain('role="group"');
    expect(html.match(/role="spinbutton"/g)).toHaveLength(2);
    expect(html).toContain('aria-valuenow="9" aria-valuemin="0" aria-valuemax="23"');
    expect(html).toContain('aria-valuenow="5" aria-valuemin="0" aria-valuemax="59"');
  });
  test('a 12-hour clock announces the displayed hour, inside the range it declares', () => {
    const html = renderToStaticMarkup(<TimePicker defaultValue="21:05" locale="en-US" />);
    // Nine in the evening reads 09 on this clock, and valuenow must not exceed valuemax.
    expect(html).toContain('aria-valuenow="9" aria-valuemin="1" aria-valuemax="12"');
    expect(html).not.toContain('aria-valuenow="21"');
    // Noon and midnight both read 12, never 0.
    expect(renderToStaticMarkup(<TimePicker defaultValue="00:30" locale="en-US" />)).toContain(
      'aria-valuenow="12"',
    );
  });
  test('one tab stop for the segments, then the button that opens the columns', () => {
    const html = renderToStaticMarkup(<TimePicker defaultValue="09:05" locale="en-US" />);
    // One stop across the three segments; the columns carry their own, inside a shut popover.
    expect(html.match(/<span[^>]*tabindex="0"/g)).toHaveLength(1);
    expect(html.match(/<span[^>]*tabindex="-1"/g)).toHaveLength(2);
    // The button is a native one, so it is a stop without carrying a tabindex of its own.
    expect(html).toContain('data-slot="time-picker-clock"');
  });
  test('the panel is one column per part, each a listbox pointing at its reading', () => {
    const html = renderToStaticMarkup(<TimePicker defaultValue="09:05" locale="en-GB" />);
    const columns = columnsOf(html);
    expect(columns).toHaveLength(2);
    // A 24-hour column runs the whole day, and the minutes the whole hour.
    expect(columns[0]?.match(/role="option"/g)).toHaveLength(24);
    expect(columns[1]?.match(/role="option"/g)).toHaveLength(60);
    // Each column points at its own reading rather than leaving it to be guessed.
    expect(columns[0]).toContain('aria-activedescendant');
    expect(html).toMatch(/aria-label="Hours"[^>]*data-slot="time-column"/);
  });
  test('every column is named, the period one included', () => {
    const html = renderToStaticMarkup(<TimePicker defaultValue="21:05" locale="en-US" />);
    // An unnamed listbox is a listbox nobody can tell apart.
    expect(html).not.toContain('aria-label=""');
    expect(html).toMatch(/aria-label="AM or PM"[^>]*data-slot="time-column"/);
  });
  test('seconds add a segment and a column, and lengthen the value', () => {
    const html = renderToStaticMarkup(
      <TimePicker defaultValue="09:05:30" locale="en-GB" seconds name="at" />,
    );
    expect(columnsOf(html)).toHaveLength(3);
    expect(html).toContain('aria-label="Second"');
    expect(html).toMatch(/aria-label="Seconds"[^>]*data-slot="time-column"/);
    expect(html).toContain('name="at" value="09:05:30"');
    expect(html.match(/role="spinbutton"/g)).toHaveLength(3);
  });
  test('without seconds the value stays at minutes, whatever it was given', () => {
    const html = renderToStaticMarkup(
      <TimePicker defaultValue="09:05:30" locale="en-GB" name="at" />,
    );
    expect(html).toContain('name="at" value="09:05"');
    expect(columnsOf(html)).toHaveLength(2);
  });
  test('a 12-hour clock gets a period column, and its hours run 12 then 1 to 11', () => {
    const html = renderToStaticMarkup(<TimePicker defaultValue="21:05" locale="en-US" />);
    expect(columnsOf(html)).toHaveLength(3);
    const hours = columnsOf(html)[0] ?? '';
    expect(hours.match(/>(\d\d)</g)?.slice(0, 3)).toEqual(['>12<', '>01<', '>02<']);
    // Nine in the evening selects the twenty-first hour behind the label 09.
    expect(hours).toMatch(/id="[^"]*-21" role="option" aria-selected="true"/);
    expect(html).toContain('>PM</div>');
  });
  test('a value off the step grid reads as its nearest row and points at a row that exists', () => {
    const html = renderToStaticMarkup(
      <TimePicker defaultValue="09:07" locale="en-GB" minuteStep={15} />,
    );
    // The attribute sits on the listbox's opening tag, ahead of the data-slot marker columnsOf
    // splits on, so it is read from the whole document: the second column is the minutes.
    const target = [...html.matchAll(/aria-activedescendant="([^"]+)"/g)][1]?.[1];
    expect(target).toBeDefined();
    // Seven minutes is nearest to the 00 row, and that row is really there to be pointed at.
    expect(target?.endsWith('-0')).toBe(true);
    expect(html).toContain(`id="${target}"`);
    // But nothing claims to be selected: the field still reads 07, not 00.
    expect(columnsOf(html)[1]).not.toContain('aria-selected="true"');
  });
  test('the minute column follows minuteStep rather than listing every minute', () => {
    const html = renderToStaticMarkup(
      <TimePicker defaultValue="09:15" locale="en-GB" minuteStep={15} />,
    );
    const minutes = columnsOf(html)[1] ?? '';
    expect(minutes.match(/role="option"/g)).toHaveLength(4);
    expect(minutes).toContain('>45<');
  });
  test('the panel offers the reader the choice of clock', () => {
    const html = renderToStaticMarkup(<TimePicker defaultValue="21:05" locale="en-GB" />);
    expect(html).toContain('aria-label="Hour format"');
    expect(html).toContain('>12h<');
    expect(html).toContain('>24h<');
    // It opens on the locale's own clock, so the choice starts where the reader expects.
    expect(html).toMatch(/checked=""[^>]*value="24"/);
  });
  test('a picker started on the other clock still reports a 24-hour value', () => {
    const html = renderToStaticMarkup(
      <TimePicker defaultValue="21:05" locale="en-GB" defaultHourCycle={12} name="at" />,
    );
    // The display changes, the value does not: still nine in the evening.
    expect(html).toContain('name="at" value="21:05"');
    expect(html).toContain('aria-label="AM or PM"');
    expect(html).toMatch(/checked=""[^>]*value="12"/);
  });
  test('forcing the cycle takes the switch away rather than leaving a dead one', () => {
    const forced = renderToStaticMarkup(<TimePicker defaultValue="21:05" hourCycle={12} />);
    expect(forced).not.toContain('aria-label="Hour format"');
    expect(forced).toContain('aria-label="AM or PM"');
    // Unless the caller asks for it back, having wired onHourCycleChange themselves.
    expect(
      renderToStaticMarkup(<TimePicker defaultValue="21:05" hourCycle={12} hourCycleToggle />),
    ).toContain('aria-label="Hour format"');
  });
  test('an empty or malformed value shows blanks rather than a silent zero', () => {
    for (const value of [null, '', 'noon', '25:00', '09:75']) {
      const html = renderToStaticMarkup(<TimePicker value={value} locale="en-GB" />);
      expect(html).toContain('data-empty=""');
      expect(html.match(/>--</g)).toHaveLength(2);
      expect(html).toContain('aria-valuetext="Empty"');
    }
  });
  test('a form gets the whole time, or nothing at all', () => {
    expect(renderToStaticMarkup(<TimePicker defaultValue="09:05" name="at" />)).toContain(
      'name="at" value="09:05"',
    );
    expect(renderToStaticMarkup(<TimePicker name="at" />)).toContain('name="at" value=""');
    expect(renderToStaticMarkup(<TimePicker defaultValue="09:05" />)).not.toContain(
      'type="hidden"',
    );
  });
  test('disabled takes the field out of the tab order entirely', () => {
    const html = renderToStaticMarkup(<TimePicker defaultValue="09:05" locale="en-GB" disabled />);
    // Only the columns' listboxes remain focusable, and they sit inside a shut popover.
    expect(html.match(/<span[^>]*tabindex="0"/g)).toBeNull();
    // The group and both of its segments, all marked.
    expect(html.match(/aria-disabled="true"/g)).toHaveLength(3);
    // The button is shut too, rather than opening a panel that cannot change anything.
    expect(html).toMatch(/<button[^>]*data-slot="time-picker-clock" disabled=""/);
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

describe('drawer contracts', () => {
  const panel = (props: { side?: 'left' | 'right' } = {}): string =>
    renderToStaticMarkup(
      <Drawer>
        <DrawerContent {...props}>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Narrow the results.</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );

  test('the side defaults to right and is always stated', () => {
    expect(panel()).toContain('data-side="right"');
  });
  test('the side follows the prop', () => {
    expect(panel({ side: 'left' })).toContain('data-side="left"');
    expect(panel({ side: 'left' })).not.toContain('data-side="right"');
  });
  test('the panel keeps the dialog behaviour it is built on', () => {
    const html = panel();
    // The class carries both: .dialog-content owns the backdrop and the material floor,
    // .drawer-content only restates geometry and the slide.
    expect(html).toContain('dialog-content');
    expect(html).toContain('drawer-content');
    expect(html).toContain('data-slot="drawer-content"');
  });
  test('labelling is wired and the drawer starts closed during SSR', () => {
    const html = panel();
    expect(html).toContain('aria-labelledby=');
    expect(html).toContain('aria-describedby=');
    expect(html).not.toContain('open=""');
  });
});

describe('spinner and skeleton contracts', () => {
  test('a bare spinner is decorative, so it is not announced twice beside its own text', () => {
    const html = renderToStaticMarkup(<Spinner />);
    expect(html).toContain('data-slot="spinner"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="status"');
  });
  test('a label turns it into a live status with hidden text', () => {
    const html = renderToStaticMarkup(<Spinner label="Checking" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('Checking');
    expect(html).toContain('sr-only');
  });
  test('an accessible name given directly is respected rather than hidden', () => {
    const html = renderToStaticMarkup(<Spinner aria-label="Checking" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Checking"');
    expect(html).not.toContain('aria-hidden="true" data-slot');
  });
  test('the size is stated on the root for CSS to size the ring', () => {
    expect(renderToStaticMarkup(<Spinner />)).toContain('data-size="md"');
    expect(renderToStaticMarkup(<Spinner size="lg" />)).toContain('data-size="lg"');
  });
  test('a skeleton is one hidden block, never a label to read out', () => {
    const html = renderToStaticMarkup(<Skeleton />);
    expect(html).toContain('data-slot="skeleton"');
    expect(html).toContain('data-shape="block"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role=');
  });
  test('the shape is stated so circles and lines can differ in CSS alone', () => {
    expect(renderToStaticMarkup(<Skeleton shape="circle" />)).toContain('data-shape="circle"');
  });
  test('text renders one line per line, under a stack that owns the className', () => {
    const html = renderToStaticMarkup(<Skeleton shape="text" lines={4} className="max-w-sm" />);
    expect(html).toContain('data-shape="text"');
    expect(html).toContain('max-w-sm');
    expect(html.match(/data-shape="line"/g)).toHaveLength(4);
  });
  test('a nonsense line count still renders one line rather than an empty stack', () => {
    expect(renderToStaticMarkup(<Skeleton shape="text" lines={0} />)).toContain(
      'data-shape="line"',
    );
    expect(
      renderToStaticMarkup(<Skeleton shape="text" lines={2.7} />).match(/data-shape="line"/g),
    ).toHaveLength(2);
  });
  test('consumer utilities merge last on every shape', () => {
    expect(renderToStaticMarkup(<Spinner className="text-red-500" />)).toContain('text-red-500');
    expect(renderToStaticMarkup(<Skeleton className="h-8" />)).toContain('h-8');
  });
});
