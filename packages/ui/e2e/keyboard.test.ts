import { afterAll, beforeAll, expect, test } from 'bun:test';
import { type Browser, chromium, type Locator, type Page } from 'playwright';
import { BASE_URL } from './server';

let browser: Browser;
let page: Page;
const pageErrors: string[] = [];

beforeAll(async () => {
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.getByRole('toolbar').waitFor({ timeout: 10000 });
});
afterAll(async () => {
  await browser.close();
  expect(pageErrors).toEqual([]);
});

const active = (): Promise<string> =>
  page.evaluate(() => (document.activeElement?.textContent ?? '').trim());
const visible = (l: Locator): Promise<void> => l.waitFor({ state: 'visible' });
const gone = (l: Locator): Promise<void> => l.waitFor({ state: 'hidden' });

test('toolbar: arrows and Home/End move focus inside it', async () => {
  await page.click('role=toolbar >> text=Undo');
  await page.keyboard.press('ArrowRight');
  expect(await active()).toBe('Redo');
  await page.keyboard.press('End');
  expect(await active()).toBe('Share');
  await page.keyboard.press('Home');
  expect(await active()).toBe('File');
});

test('menu: ArrowDown opens on the first item, typeahead jumps, Escape returns focus', async () => {
  await page.locator('role=toolbar >> text=File').focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.locator('[role="menu"]:popover-open');
  await visible(menu);
  // The toggle event that moves focus is a queued task after showPopover.
  await page.locator('[role="menuitem"]:focus').waitFor();
  expect(await active()).toContain('New document');
  await page.keyboard.press('ArrowDown');
  expect(await active()).toContain('Open');
  await page.keyboard.type('s');
  expect(await active()).toContain('Save');
  await page.keyboard.press('Escape');
  await gone(menu);
  expect(await active()).toBe('File');
});

test('tabs: arrows select and skip disabled tabs', async () => {
  await page.click('role=tab[name="Style"]');
  await page.keyboard.press('ArrowRight');
  expect(await page.locator('role=tab[name="Layout"]').getAttribute('aria-selected')).toBe('true');
  expect(await page.locator('role=tabpanel').textContent()).toContain('Margins');
  await page.keyboard.press('ArrowRight');
  expect(await page.locator('role=tab[name="Style"]').getAttribute('aria-selected')).toBe('true');
});

test('accordion: arrows walk the triggers, skip disabled and Enter toggles', async () => {
  const material = page.locator('role=button[name="Material"]');
  const radius = page.locator('role=button[name="Radius"]');
  await material.focus();
  expect(await material.getAttribute('aria-expanded')).toBe('true');
  await page.keyboard.press('ArrowDown');
  expect(await active()).toBe('Radius');
  // Brand colours is disabled, so End lands on the last trigger that can take focus.
  await page.keyboard.press('End');
  expect(await active()).toBe('Radius');
  await page.keyboard.press('Enter');
  expect(await radius.getAttribute('aria-expanded')).toBe('true');
  // One at a time by default: opening Radius closed Material.
  expect(await material.getAttribute('aria-expanded')).toBe('false');
  await visible(page.locator('role=region[name="Radius"]'));
  await page.keyboard.press('Enter');
  expect(await radius.getAttribute('aria-expanded')).toBe('false');
  await gone(page.locator('role=region[name="Radius"]'));
  await page.keyboard.press('Home');
  expect(await active()).toBe('Material');
});

test('date picker: arrows walk the grid, bounds hold and Enter selects', async () => {
  const trigger = page.locator('#playground-starts');
  await trigger.click();
  const grid = page.locator('[role="grid"]');
  await visible(grid);
  // Opening lands on the selected day, not on the first cell of the month.
  await page.locator('[data-slot="calendar-day"]:focus').waitFor();
  expect(await active()).toBe('14');
  await page.keyboard.press('ArrowDown');
  expect(await active()).toBe('21');
  await page.keyboard.press('ArrowLeft');
  expect(await active()).toBe('20');
  await page.keyboard.press('Home');
  expect(await active()).toBe('16');
  // One Tab stop: the grid hands focus on rather than walking all 42 days.
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe(
    'Hour',
  );
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('PageUp');
  expect(await page.locator('[role="grid"]').getAttribute('aria-labelledby')).toBeTruthy();
  await page.locator('text=February 2026').waitFor();
  // March 2 is the minimum, so paging back again is refused.
  expect(await page.getByRole('button', { name: /Previous month/ }).getAttribute('disabled')).toBe(
    '',
  );
  await page.keyboard.press('PageDown');
  await page.locator('text=March 2026').waitFor();
  await page.keyboard.press('Enter');
  expect(await trigger.textContent()).toContain('16 Mar 2026');
  // The hidden input carries the local wall clock, with the time left alone.
  expect(await page.locator('input[name="starts"]').inputValue()).toBe('2026-03-16T09:05');
  // Today, pressed while another month is showing, has to bring its own month into view: the
  // focused day is the grid's only Tab stop, and it cannot be a cell that is not rendered.
  await page.keyboard.press('PageUp');
  await page.locator('text=February 2026').waitFor();
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  expect(await page.locator('[data-slot="calendar-day"][tabindex="0"]').count()).toBe(1);
  await page.keyboard.press('Escape');
  await gone(grid);
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('playground-starts');
});

test('time picker: arrows walk the segments, digits fill them and hand on', async () => {
  const hour = page.locator('#playground-at [data-segment="hour"]');
  const minute = page.locator('#playground-at [data-segment="minute"]');
  await hour.focus();
  expect(await hour.textContent()).toBe('09');
  await page.keyboard.press('ArrowUp');
  expect(await hour.textContent()).toBe('10');
  await page.keyboard.press('ArrowRight');
  expect(await active()).toBe('05');
  // Quarter-hour steps, and the minute wraps rather than running past the hour.
  await page.keyboard.press('ArrowDown');
  expect(await minute.textContent()).toBe('50');
  // Two digits fill the segment and focus moves on by itself.
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.type('07');
  expect(await hour.textContent()).toBe('07');
  expect(await active()).toBe('50');
  await page.keyboard.press('Backspace');
  expect(await minute.textContent()).toBe('--');
  // Half a clock is not a time, so the form carries nothing.
  expect(await page.locator('input[name="at"]').inputValue()).toBe('');
  await page.keyboard.type('30');
  // The seconds this field carries are untouched by typing the minute.
  expect(await page.locator('input[name="at"]').inputValue()).toBe('07:30:30');
});

test('time columns: a row press moves the reading, and the value follows', async () => {
  const field = page.locator('#playground-at');
  await field.locator('[data-slot="time-picker-clock"]').click();
  const hours = field.locator('[data-slot="time-column"]').first();
  await visible(hours);
  expect(await hours.getAttribute('aria-label')).toBe('Hours');
  // The column opens on whatever the field reads, not at the top of the list. Earlier tests
  // have already moved this field, so the segment is the thing to agree with.
  expect(await hours.locator('[aria-selected="true"]').textContent()).toBe(
    await field.locator('[data-segment="hour"]').textContent(),
  );
  await hours.locator('[data-time-option="14"]').click();
  await page.waitForTimeout(400);
  expect(await field.locator('[data-segment="hour"]').textContent()).toBe('14');
  expect(await hours.locator('[aria-selected="true"]').textContent()).toBe('14');
  // Quarter-hour steps mean four rows, not sixty.
  const minutes = field.locator('[data-slot="time-column"]').nth(1);
  expect(await minutes.locator('[role="option"]').count()).toBe(4);
  await minutes.locator('[data-time-option="45"]').click();
  await page.waitForTimeout(400);
  // Seconds are their own column, and they reach the value too.
  const secs = field.locator('[data-slot="time-column"]').nth(2);
  expect(await secs.getAttribute('aria-label')).toBe('Seconds');
  // The rows are keyed by their value, so seven seconds is 7 even though it reads 07.
  await secs.locator('[data-time-option="7"]').click();
  await page.waitForTimeout(400);
  expect(await page.locator('input[name="at"]').inputValue()).toBe('14:45:07');
  // Arrows walk the column that has focus.
  await hours.focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(400);
  expect(await field.locator('[data-segment="hour"]').textContent()).toBe('15');
  await page.keyboard.press('Escape');
  await gone(hours);
});

test('time picker: the clock switch changes the reading, not the value', async () => {
  const field = page.locator('#playground-at');
  await field.locator('[data-slot="time-picker-clock"]').click();
  const hours = field.locator('[data-slot="time-column"]').first();
  await visible(hours);
  // The playground is en-GB, so it opens on a 24-hour clock with no period column.
  const before = await page.locator('input[name="at"]').inputValue();
  expect(await field.locator('[data-slot="time-column"]').count()).toBe(3);
  // The radio itself is visually hidden; the label is what a reader presses.
  await field.locator('[data-slot="segment"]', { hasText: '12h' }).click();
  await page.waitForTimeout(400);
  // A period column appears and the hour reads on the other clock.
  expect(await field.locator('[data-slot="time-column"]').count()).toBe(4);
  expect(await field.locator('[data-segment="period"]').count()).toBe(1);
  // The value is untouched by how it is being read.
  expect(await page.locator('input[name="at"]').inputValue()).toBe(before);
  await field.locator('[data-slot="segment"]', { hasText: '24h' }).click();
  await page.waitForTimeout(400);
  expect(await field.locator('[data-segment="period"]').count()).toBe(0);
  expect(await page.locator('input[name="at"]').inputValue()).toBe(before);
  await page.keyboard.press('Escape');
  await gone(hours);
});

test('time picker: the panel is as wide as its columns, and no wider', async () => {
  const field = page.locator('#playground-at');
  await field.locator('[data-slot="time-picker-clock"]').click();
  const panel = page.locator('[data-slot="popover-content"]:popover-open').last();
  await visible(panel);
  const geometry = async () => {
    const box = await panel.boundingBox();
    const columns = field.locator('[data-slot="time-column"]');
    const last = columns.last();
    const lastBox = await last.boundingBox();
    const trigger = await field.locator('[data-slot="time-picker-clock"]').boundingBox();
    if (!box || !lastBox || !trigger) throw new Error('nothing to measure');
    return {
      width: box.width,
      columns: await columns.count(),
      // Only the panel's own padding should sit past the final column.
      slack: box.x + box.width - (lastBox.x + lastBox.width),
      offTrigger: Math.abs(box.x + box.width - (trigger.x + trigger.width)),
    };
  };
  // Earlier tests leave the clock wherever they finished, so start from a known one.
  await field.locator('[data-slot="segment"]', { hasText: '12h' }).click();
  await page.waitForTimeout(450);
  const wide = await geometry();
  await field.locator('[data-slot="segment"]', { hasText: '24h' }).click();
  await page.waitForTimeout(450);
  const narrow = await geometry();
  expect(narrow.columns).toBe(wide.columns - 1);
  // Dropping the period column takes its width off the panel rather than leaving a hole.
  expect(narrow.width).toBeLessThan(wide.width - 40);
  expect(narrow.slack).toBeCloseTo(wide.slack, 0);
  // And the panel stays hung off the trigger while it resizes.
  expect(narrow.offTrigger).toBeLessThan(2);
  await field.locator('[data-slot="segment"]', { hasText: '12h' }).click();
  await page.waitForTimeout(450);
  expect((await geometry()).width).toBeCloseTo(wide.width, 0);
  await page.keyboard.press('Escape');
  await gone(panel);
});

test('dialog: focus stays inside, Escape closes and returns focus', async () => {
  await page.click('text=Delete document');
  const dialog = page.locator('dialog[open]');
  await visible(dialog);
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.closest('dialog') !== null)).toBe(true);
  await page.keyboard.press('Escape');
  await gone(dialog);
  expect(await active()).toBe('Delete document');
});

test('drawer: parks on its side, holds focus, and Escape returns it to the trigger', async () => {
  for (const [trigger, side] of [
    ['Document outline', 'left'],
    ['Style inspector', 'right'],
  ] as const) {
    await page.getByRole('button', { name: trigger }).click();
    const drawer = page.locator('dialog[open][data-slot="drawer-content"]');
    await visible(drawer);
    expect(await drawer.getAttribute('data-side')).toBe(side);

    // The panel is offset while it settles, so measure the resting position, not a frame
    // part way through the transition.
    await page.waitForFunction(() => {
      const panel = document.querySelector('dialog[open][data-slot="drawer-content"]');
      return panel !== null && getComputedStyle(panel).transform === 'none';
    });
    // Parked against its own edge rather than centred like a dialog.
    const box = await drawer.boundingBox();
    const width = page.viewportSize()?.width ?? 0;
    if (side === 'left') expect(box?.x).toBeCloseTo(0, 0);
    else expect((box?.x ?? 0) + (box?.width ?? 0)).toBeCloseTo(width, 0);

    // The page behind a modal is inert. Chromium's cycle passes through <body> on its way
    // round, so the guarantee to assert is that no control outside the drawer is reachable.
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const escaped = await page.evaluate(() => {
        const at = document.activeElement;
        return (
          at !== null && at !== document.body && at.closest('[data-slot="drawer-content"]') === null
        );
      });
      expect(escaped).toBe(false);
    }

    await page.keyboard.press('Escape');
    await gone(drawer);
    expect(await active()).toBe(trigger);
  }
});

test('popover: opens from its trigger and light-dismisses on an outside click', async () => {
  await page.click('text=Page setup');
  const popover = page.locator('[data-slot="popover-content"]:popover-open');
  await visible(popover);
  await page.mouse.click(1200, 850);
  await gone(popover);
});

test('hover card: the dwell, the grace period and the skip window, on a controlled clock', async () => {
  // The dwell, the grace period and the skip window are all timers. Measuring them against
  // wall-clock time on a loaded runner is a race, so this test gets a page of its own with a
  // clock it advances by hand; the shared page keeps real time for everything else.
  const own = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const noon = new Date(2026, 0, 1, 12);
  await own.clock.install({ time: noon });
  await own.goto(BASE_URL, { waitUntil: 'networkidle' });
  await own.getByRole('toolbar').waitFor({ timeout: 10000 });
  // install() alone lets fake time flow at its natural pace, so real time spent between steps
  // would still fire the dwell early. Pausing freezes it: from here only runFor moves the clock.
  await own.clock.pauseAt(new Date(noon.getTime() + 60_000));
  const trigger = own.getByRole('button', { name: '@crumza' });
  const card = own.locator('[data-slot="hover-card-content"]:popover-open');
  const focused = (): Promise<string> =>
    own.evaluate(() => (document.activeElement?.textContent ?? '').trim());

  // The dwell is 120ms: nothing at 119, the card at 120.
  await trigger.hover();
  await own.clock.runFor(119);
  expect(await card.count()).toBe(0);
  await own.clock.runFor(1);
  await visible(card);

  // Crossing the gap into the card cancels the close it was already scheduling.
  await card.getByRole('link', { name: 'Read the docs' }).hover();
  await own.clock.runFor(1000);
  expect(await card.isVisible()).toBe(true);

  // Leaving starts the 200ms grace period; the card holds until it runs out.
  await own.mouse.move(2, 2);
  await own.clock.runFor(199);
  expect(await card.isVisible()).toBe(true);
  await own.clock.runFor(1);
  await gone(card);

  // Inside the 300ms skip window a second read opens with no dwell at all.
  await own.clock.runFor(100);
  await trigger.hover();
  await visible(card);
  await own.mouse.move(2, 2);
  await own.clock.runFor(200);
  await gone(card);

  // Past the window, focus still opens at once: the dwell is a hover idea, not a focus one.
  await own.clock.runFor(1000);
  await trigger.focus();
  await visible(card);
  await own.keyboard.press('Tab');
  expect(await focused()).toBe('Read the docs');
  await own.keyboard.press('Escape');
  await gone(card);

  // A touch press focuses the button on Android; that focus must not open the card.
  await own.clock.runFor(1000);
  await trigger.dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true });
  await trigger.focus();
  await own.clock.runFor(500);
  expect(await card.count()).toBe(0);
  await own.close();
});

test('toast: announces through a status region', async () => {
  await page.click('text=Success with action');
  const toast = page.locator('[role="status"]', { hasText: 'Exported to PDF' });
  await visible(toast);
  await toast.getByRole('button', { name: 'Dismiss' }).click();
  await gone(toast);
});

test('material: solid avoids filtering; liquid has a static rim; reduced transparency wins', async () => {
  const button = page.getByRole('button', { name: 'Share', exact: true }).first();
  await page.evaluate(() => document.documentElement.setAttribute('data-material', 'solid'));
  expect(await button.evaluate((el) => getComputedStyle(el).backdropFilter)).toBe('none');
  await button.evaluate((el) => el.setAttribute('data-material', 'liquid'));
  expect(await button.evaluate((el) => getComputedStyle(el).backdropFilter)).toContain(
    'blur(10px)',
  );
  expect(
    Number(await button.evaluate((el) => getComputedStyle(el, '::before').opacity)),
  ).toBeGreaterThan(0.8);
  await page.evaluate(() => document.documentElement.setAttribute('data-transparency', 'reduce'));
  expect(await button.evaluate((el) => getComputedStyle(el).backdropFilter)).toBe('none');
  await page.evaluate(() => document.documentElement.removeAttribute('data-transparency'));
  await button.evaluate((el) => el.removeAttribute('data-material'));
});

test('owned glass optics track radius, remain idle and disappear for solid or reduced transparency', async () => {
  const button = page.getByTestId('optical-button');
  const optics = button.locator('.surface-optics');
  await button.locator('feImage').waitFor({ state: 'attached' });
  expect(await optics.evaluate((el) => getComputedStyle(el).display)).toBe('block');
  const id = await button.locator('filter').getAttribute('id');
  await button.evaluate((el) => {
    el.style.borderRadius = '4px';
  });
  await page.waitForFunction(
    (previous) => document.querySelector('[data-testid="optical-button"] filter')?.id !== previous,
    id,
  );
  expect(await button.locator('filter').getAttribute('id')).not.toBe(id);
  expect(await optics.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  await button.evaluate((el) => {
    el.setAttribute('data-material', 'solid');
  });
  expect(await optics.evaluate((el) => getComputedStyle(el).display)).toBe('none');
  expect(await button.evaluate((el) => getComputedStyle(el).backdropFilter)).toBe('none');
  expect(await button.evaluate((el) => getComputedStyle(el).boxShadow)).not.toContain('4px 0px');
  await button.evaluate((el) => {
    el.setAttribute('data-material', 'liquid');
  });
  await page.evaluate(() => document.documentElement.setAttribute('data-transparency', 'reduce'));
  expect(await optics.evaluate((el) => getComputedStyle(el).display)).toBe('none');
  await page.evaluate(() => document.documentElement.removeAttribute('data-transparency'));
  await button.evaluate((el) => {
    el.style.removeProperty('border-radius');
  });
});

test('dialog: dense readable material, centered geometry and reduced motion', async () => {
  await page.evaluate(() => document.documentElement.setAttribute('data-material', 'liquid'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.click('text=Delete document');
  const dialog = page.locator('dialog[open]');
  await visible(dialog);
  const geometry = await dialog.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      position: style.position,
      centerX: rect.x + rect.width / 2,
      viewport: innerWidth / 2,
      opacity: style.opacity,
      transition: style.transitionDuration,
      background: style.backgroundColor,
    };
  });
  expect(geometry.position).toBe('fixed');
  expect(Math.abs(geometry.centerX - geometry.viewport)).toBeLessThan(2);
  expect(geometry.opacity).toBe('1');
  expect(geometry.transition).toBe('0s');
  const alpha = geometry.background.match(/\/\s*([\d.]+)/)?.[1];
  expect(alpha === undefined || Number(alpha) >= 0.94).toBe(true);
  await page.keyboard.press('Escape');
  await gone(dialog);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => document.documentElement.setAttribute('data-material', 'solid'));
});

test('liquid stepper: the buttons hold the bounds and the value announces itself', async () => {
  const stepper = page.locator('[data-slot="liquid-stepper"]');
  await stepper.scrollIntoViewIfNeeded();
  // Centred by the interactive layer: a component ships itself, not a positioner.
  const [box, stage] = await Promise.all([
    stepper.boundingBox(),
    stepper.locator('xpath=ancestor::*[@data-slot="liquid-scene"]').boundingBox(),
  ]);
  if (!box || !stage) throw new Error('nothing to measure');
  expect(Math.abs(box.x + box.width / 2 - (stage.x + stage.width / 2))).toBeLessThan(2);
  expect(Math.abs(box.y + box.height / 2 - (stage.y + stage.height / 2))).toBeLessThan(2);
  const value = stepper.locator('[aria-live="polite"]');
  const decrease = stepper.getByRole('button', { name: 'Decrease' });
  const increase = stepper.getByRole('button', { name: 'Increase' });
  expect(await value.textContent()).toBe('3');
  for (let i = 0; i < 3; i++) await decrease.click();
  expect(await value.textContent()).toBe('0');
  expect(await decrease.isDisabled()).toBe(true);
  await increase.click();
  expect(await value.textContent()).toBe('1');
  expect(await decrease.isDisabled()).toBe(false);
  // The engine painted: the surface's filter is fed a displacement map built on a canvas.
  await stepper.locator('feImage').first().waitFor({ state: 'attached' });
  expect(await stepper.locator('feImage').first().getAttribute('href')).toStartWith(
    'data:image/png',
  );
});

test('liquid tab indicator: a press selects the tab and the indicator settles under it', async () => {
  const bar = page.locator('[data-slot="liquid-tab-indicator"]');
  await bar.scrollIntoViewIfNeeded();
  await bar.getByRole('tab', { name: 'Sheen' }).click();
  expect(await bar.getByRole('tab', { name: 'Sheen' }).getAttribute('aria-selected')).toBe('true');
  expect(await bar.getByRole('tab', { name: 'Optics' }).getAttribute('aria-selected')).toBe(
    'false',
  );
  // The blob is moved by the scene's frame driver, not React, so wait for it to land.
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-slot="liquid-tab-indicator"]');
    const blob = root?.querySelector('.lqc-indicator-blob');
    const tab = root?.querySelector('[role="tab"][aria-selected="true"]');
    if (!blob || !tab) return false;
    const a = blob.getBoundingClientRect();
    const b = tab.getBoundingClientRect();
    return Math.abs(a.left - b.left) < 1.5 && Math.abs(a.width - b.width) < 1.5;
  });
  // A frosted scene marks itself, and its glass carries the interior blur.
  const stage = bar.locator('xpath=ancestor::*[@data-slot="liquid-scene"]');
  expect(await stage.getAttribute('data-frosted')).toBe('');
  const blurLayer = bar.locator('.lq-blur');
  expect(await blurLayer.evaluate((el) => getComputedStyle(el).filter)).toContain('blur(5px)');
  // The backdrop blur only stands in before the engine's first paint; the clone carries it now.
  expect(await blurLayer.evaluate((el) => getComputedStyle(el).backdropFilter)).toBe('none');
});

test('liquid search: a round button grows into the field, and folds back when empty', async () => {
  const search = page.locator('[data-slot="liquid-search"]');
  await search.scrollIntoViewIfNeeded();
  const fieldWidth = (): Promise<number> =>
    page.evaluate(
      () =>
        document
          .querySelector('[data-slot="liquid-search"] .lqc-search-field')
          ?.getBoundingClientRect().width ?? 0,
    );
  const focusedTag = (): Promise<string | undefined> =>
    page.evaluate(() => document.activeElement?.tagName);
  // Folded: a 52px round button, the field disabled behind it.
  expect(await fieldWidth()).toBeCloseTo(52, 0);
  expect(await search.getByRole('textbox', { name: 'Search' }).isDisabled()).toBe(true);
  await search.getByRole('button', { name: 'Search' }).click();
  // The grow is a width transition; it lands on the full bar with the field focused.
  await page.waitForFunction(
    () =>
      Math.abs(
        (document
          .querySelector('[data-slot="liquid-search"] .lqc-search-field')
          ?.getBoundingClientRect().width ?? 0) - 296,
      ) < 1,
  );
  expect(await focusedTag()).toBe('INPUT');
  await search.getByRole('textbox', { name: 'Search' }).fill('ra');
  const list = search.getByRole('listbox');
  await visible(list);
  expect(await list.getByRole('option').count()).toBe(2);
  expect(await list.getByRole('option').first().textContent()).toBe('Refraction map');
  // Clearing keeps the bar open and the field focused; Escape folds it back to the button.
  await search.getByRole('button', { name: 'Clear' }).click();
  await gone(list);
  expect(await search.getByRole('textbox', { name: 'Search' }).inputValue()).toBe('');
  expect(await focusedTag()).toBe('INPUT');
  await page.keyboard.press('Escape');
  await page.waitForFunction(
    () =>
      (document
        .querySelector('[data-slot="liquid-search"] .lqc-search-field')
        ?.getBoundingClientRect().width ?? 0) < 53,
  );
  expect(await focusedTag()).toBe('BUTTON');
});

test('liquid notifications: the deck fans out on hover and the cross dismisses its card', async () => {
  const stack = page.locator('[data-slot="liquid-notification-stack"]');
  await stack.scrollIntoViewIfNeeded();
  expect(await stack.getByRole('status').count()).toBe(3);
  await stack.locator('.lqc-notif-deck').hover();
  await page.waitForFunction(() =>
    document
      .querySelector('[data-slot="liquid-notification-stack"] .lqc-notif-deck')
      ?.hasAttribute('data-expanded'),
  );
  // The card captures the pointer for swipes; a press on the cross must stay a click.
  await stack.getByRole('button', { name: 'Dismiss Map rebuilt' }).click();
  await page.waitForFunction(
    () =>
      document.querySelectorAll('[data-slot="liquid-notification-stack"] [role="status"]')
        .length === 2,
  );
  expect(await stack.getByText('Map rebuilt').count()).toBe(0);
  await page.mouse.move(2, 2);
});
