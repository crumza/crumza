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

test('popover: opens from its trigger and light-dismisses on an outside click', async () => {
  await page.click('text=Page setup');
  const popover = page.locator('[data-slot="popover-content"]:popover-open');
  await visible(popover);
  await page.mouse.click(1200, 850);
  await gone(popover);
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
