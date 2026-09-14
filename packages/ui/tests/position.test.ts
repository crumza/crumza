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
