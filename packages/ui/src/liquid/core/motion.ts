import { useEffect, useRef } from 'react';
import { useLiquidScene } from './scene';

/* Per-frame motion helpers for the liquid set.

   Several components in the set follow the pointer or a moving target: a tab
   indicator that overshoots, a magnetic row. All of them need a value updated
   every frame and written straight to the DOM. Putting it in React state would
   re-render the whole surface (and its filter effect) sixty times a second.

   None of them start their own requestAnimationFrame either. The scene already
   runs exactly one driver for the refraction engine; a second loop would fight
   it for frames and drift out of phase with the paint it is trying to feed. */

/**
 * Run `fn` on the scene's driver, once per frame, for as long as the component
 * is mounted.
 *
 * The callback is held in a ref, so a component can close over fresh props and
 * state without re-subscribing (and without the surface's paint registration
 * being torn down and rebuilt) on every render.
 */
export function useSceneFrame(fn: (now: number) => void): void {
  const { register } = useLiquidScene();
  const latest = useRef(fn);
  latest.current = fn;

  useEffect(() => register((now) => latest.current(now)), [register]);
}

/**
 * Frame-rate-independent smoothing towards a target.
 *
 * `tau` is the time constant in ms: the time to close about 63% of the remaining
 * gap. Unlike the usual `x += (target - x) * 0.15`, this gives the same motion
 * on a 60Hz and a 120Hz display instead of running twice as fast on the latter.
 */
export function approach(current: number, target: number, dt: number, tau: number): number {
  if (tau <= 0) return target;
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

/** Below this, a follow is close enough to snap and stop asking for frames. */
export const SETTLE_EPSILON = 0.15;

/** Cosine ease over a 0..1 falloff: the smooth swell used by proximity effects. */
export const easeFalloff = (t: number): number =>
  (1 - Math.cos(Math.max(0, Math.min(1, t)) * Math.PI)) / 2;

/**
 * Elapsed-time tracker for the frame callbacks.
 *
 * The scene's driver hands out `performance.now()`, not a delta, and the first
 * frame after a long idle can be hundreds of ms, enough for an un-clamped
 * integrator to visibly jump. Clamping to about 4 frames keeps that honest.
 */
export function makeClock(): (now: number) => number {
  let last = 0;
  return (now: number): number => {
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    return dt;
  };
}
