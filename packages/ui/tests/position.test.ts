import { expect, test } from 'bun:test';
import { computePosition } from '../src/core/position';

const boundary = { x: 0, y: 0, width: 1000, height: 600 };
const floating = { x: 0, y: 0, width: 200, height: 100 };

test('places below, centered', () => {
  const p = computePosition({
    anchor: { x: 400, y: 100, width: 100, height: 30 },
    floating,
    boundary,
    side: 'bottom',
    align: 'center',
    offset: 8,
    padding: 8,
  });
  expect([p.x, p.y, p.side]).toEqual([350, 138, 'bottom']);
  expect(p.transformOrigin).toBe('center top');
});

test('flips when there is no room below and shifts to stay inside', () => {
  const p = computePosition({
    anchor: { x: 950, y: 560, width: 40, height: 30 },
    floating,
    boundary,
    side: 'bottom',
    align: 'start',
    offset: 8,
    padding: 8,
  });
  expect(p.side).toBe('top');
  expect(p.y).toBe(452);
  expect(p.x).toBe(792);
});

test('rtl mirrors logical alignment', () => {
  const p = computePosition({
    anchor: { x: 400, y: 100, width: 100, height: 30 },
    floating,
    boundary,
    side: 'bottom',
    align: 'start',
    offset: 0,
    padding: 0,
    rtl: true,
  });
  expect(p.x).toBe(300);
});

test('the arrow sits under the anchor centre, not the middle of the box', () => {
  const p = computePosition({
    anchor: { x: 400, y: 100, width: 100, height: 30 },
    floating,
    boundary,
    side: 'bottom',
    align: 'start',
    offset: 8,
    padding: 8,
    arrowSize: 12,
  });
  // Aligned to the anchor's left edge, so the anchor's centre is 50px into a 200px box.
  expect([p.x, p.arrow]).toEqual([400, 50]);
});

test('the arrow follows the anchor when the box is shifted off it to stay inside', () => {
  const p = computePosition({
    anchor: { x: 950, y: 560, width: 40, height: 30 },
    floating,
    boundary,
    side: 'bottom',
    align: 'start',
    offset: 8,
    padding: 8,
    arrowSize: 12,
  });
  // The box was pushed left to 792; the anchor's centre is still at 970.
  expect([p.x, p.arrow]).toEqual([792, 178]);
});

test('the arrow stops short of the corners instead of rounding them off', () => {
  const p = computePosition({
    anchor: { x: 970, y: 100, width: 30, height: 30 },
    floating,
    boundary,
    side: 'bottom',
    align: 'center',
    offset: 8,
    padding: 8,
    arrowSize: 12,
  });
  // The anchor's centre is 193px into the box, past the 188px limit.
  expect(p.arrow).toBe(188);
});

test('the arrow runs down the cross axis on a horizontal side', () => {
  const beside = {
    anchor: { x: 500, y: 300, width: 40, height: 20 },
    floating,
    boundary,
    side: 'right',
    offset: 8,
    padding: 8,
    arrowSize: 12,
  } as const;
  expect(computePosition({ ...beside, align: 'center' }).arrow).toBe(50);
  // Top-aligned, the anchor's centre is 10px down a 100px box: held clear of the corner.
  expect(computePosition({ ...beside, align: 'start' }).arrow).toBe(12);
  // With no arrow to keep clear, the same case reports the true centre.
  expect(computePosition({ ...beside, align: 'start', arrowSize: 0 }).arrow).toBe(10);
});
