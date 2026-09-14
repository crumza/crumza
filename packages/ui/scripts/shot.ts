/** Screenshots the playground in WebKit and Chromium. `bun run shot [url] [selector-to-click]`. */
import { chromium, webkit } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5190/';
const click = process.argv[3];
const tag = process.env['SHOT_TAG']
  ? `-${process.env['SHOT_TAG']}`
  : click
    ? `-${click.replace(/[^a-z0-9]+/gi, '_')}`
    : '';
const out = new URL('../shots/', import.meta.url).pathname;

for (const [name, engine] of [
  ['webkit', webkit],
  ['chromium', chromium],
] as const) {
  const browser = await engine.launch();
  for (const scheme of ['light', 'dark'] as const) {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 860 },
      colorScheme: scheme,
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    if (click) {
      await page.click(click);
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: `${out}${name}-${scheme}${tag}.png` });
    await page.close();
  }
  await browser.close();
  console.log(`shot ${name}`);
}
