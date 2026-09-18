import { describe, expect, test } from 'bun:test';
import { LIQUIX_TIMING, LiquixMotion, shapeFrame } from '../src/web/liquix/motion';
import type { LiquixShapeEntry } from '../src/web/liquix/stage';

/** Steps a motion at 60fps and collects the frames. */
function run(motion: LiquixMotion, frames: number, from = 0) {
  const out = [];
  for (let i = 1; i <= frames; i++) out.push(motion.step(from + i * (1000 / 60)));
  return out;
}

describe('liquix motion', () => {
  test('a travel arrives as frosted glass first and clears after', () => {
    const m = new LiquixMotion();
    m.jump(0);
    m.target(200);
    const frames = run(m, 12);
    const glass = frames.map((f) => f.glass);
    const lens = frames.map((f) => f.lens);
    // Glass rises from the first frame; the lens waits until the glass is mostly there.
    expect(glass[0]).toBeGreaterThan(0);
    expect(lens[0]).toBe(0);
    expect(glass[5]).toBeGreaterThan(0.9);
    expect(lens[11]).toBeGreaterThan(0.9);
    for (let i = 1; i < glass.length; i++)
      expect(glass[i]).toBeGreaterThanOrEqual(glass[i - 1] ?? 0);
  });

  test('landing frosts first and then gives way, in about a hundred milliseconds, once', () => {
    const m = new LiquixMotion();
    m.jump(0);
    m.target(200);
    // Long enough for the spring to arrive and every overshoot to die down.
    const frames = run(m, 120);
    const settled = frames.findIndex((f) => !f.moving);
    expect(settled).toBeGreaterThan(0);
    const after = frames.slice(settled);
    // The lens goes before the glass.
    const lensGone = after.findIndex((f) => f.lens === 0);
    const glassGone = after.findIndex((f) => f.glass === 0);
    expect(lensGone).toBeGreaterThanOrEqual(0);
    expect(glassGone).toBeGreaterThan(lensGone);
    expect(glassGone * (1000 / 60)).toBeLessThan(150);
    // One fade out, no flicker: glass never rises again after settling.
    const glass = after.map((f) => f.glass);
    for (let i = 1; i < glass.length; i++)
      expect(glass[i]).toBeLessThanOrEqual((glass[i - 1] ?? 0) + 1e-9);
    expect(m.visible).toBe(false);
    expect(Math.abs(m.x - 200)).toBeLessThan(0.1);
  });

  test('holding lifts and follows the pointer; release hands the spring a bounded fling', () => {
    const m = new LiquixMotion();
    m.jump(0);
    let t = 0;
    for (let i = 1; i <= 10; i++) {
      m.hold(i * 40);
      t = i * (1000 / 60);
      m.step(t);
    }
    expect(m.x).toBe(400);
    expect(Math.abs(m.vx)).toBeLessThanOrEqual(LIQUIX_TIMING.fling);
    const held = m.step(t + 16);
    expect(held.held).toBe(true);
    expect(held.lifted).toBeGreaterThan(0.5);
    expect(held.glass).toBeGreaterThan(0.5);
    m.release();
    m.target(400);
    const frames = run(m, 90, t + 16);
    expect(frames[frames.length - 1]?.lifted).toBe(0);
    expect(frames[frames.length - 1]?.moving).toBe(false);
  });

  test('glass at rest stays glass, and still lifts while held', () => {
    const m = new LiquixMotion({ restGlass: true });
    m.jump(0);
    const [still] = run(m, 1);
    expect(still?.glass).toBe(1);
    expect(still?.lens).toBe(1);
    m.hold(0);
    const frames = run(m, 12, 100);
    expect(frames[frames.length - 1]?.lifted).toBeGreaterThan(0.9);
  });

  test('a frame writes the stretched, lifted shape and its lens into an entry', () => {
    const entry: LiquixShapeEntry = {
      el: null,
      label: null,
      shape: { width: 0, height: 0, cornerRadius: 0, roundness: 2 },
      scale: 1,
      scaleTarget: 1,
      glow: 0,
      glowTarget: 0,
    };
    const shape = shapeFrame(
      entry,
      {
        x: 0,
        y: 0,
        vx: 900,
        vy: 0,
        lifted: 1,
        glass: 0.5,
        lens: 0.25,
        moving: true,
        held: true,
        elapsed: 1 / 60,
      },
      { width: 100, height: 40 },
    );
    // 20% wider at full speed plus the lift; 12% shorter plus the lift.
    expect(shape.width).toBeCloseTo(100 * 1.2 + 12, 5);
    expect(shape.height).toBeCloseTo(40 * 0.88 + 20, 5);
    expect(entry.shape.cornerRadius).toBeCloseTo(shape.height / 2, 5);
    expect(entry.alpha).toBe(0.5);
    expect(entry.clarity).toBe(0.25);
    expect(entry.shadow).toBe(35);
    expect(entry.bevel).toBeCloseTo(shape.height * 0.3, 5);
  });
});
