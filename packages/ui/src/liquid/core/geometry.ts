import { type CSSProperties, useEffect, useState } from 'react';

/* Shared geometry and mount/unmount timing for the liquid component set.
   Everything here is deliberately material-agnostic: it decides how big a box
   is and how round its corners may be, never how the glass looks. */

export interface LiquidComponentProps {
  /** Corner radius in px, 0 to 40. Capped per surface so a panel and its control match. */
  readonly radius?: number | undefined;
}

/** Inline style that may carry the set's custom properties (`--lq-inner-r` and friends). */
export type LiquidCSS = CSSProperties & { [custom: `--${string}`]: string | number };

/** The radius control's top of range: every surface reads as a full pill here,
 *  which is where the set starts. */
export const LIQUID_RADIUS_MAX = 40;
export const LIQUID_RADIUS: number = LIQUID_RADIUS_MAX;

/** Control heights. One place, so corners stay in step across the set. */
export const H = {
  bar: 56,
  button: 56,
  input: 52,
  trigger: 52,
  header: 52,
  answer: 52,
  toggle: 44,
  segmented: 44,
  slider: 44,
  stepper: 44,
  progress: 36,
  row: 44,
  tab: 48,
  tooltip: 36,
  toast: 60,
  dock: 68,
  /* lenses: a loupe is a circle, so its "height" is its diameter and pill()
     resolves it to a true half-round every time */
  cursor: 64,
  loupe: 148,
  rail: 44,
  /* interactions */
  hoverCard: 56,
  magnetic: 52,
  tabBar: 52,
  chip: 40,
  /* overlays */
  sheet: 56,
  menu: 44,
  palette: 56,
  notif: 60,
  /* pickers */
  frame: 56,
  calendar: 44,
  swatch: 44,
  viewer: 56,
} as const;

/**
 * The radius a surface should actually use.
 *
 * A radius can never exceed half a box's shorter side, so a tall panel asked for
 * 40 would round to 40 while the 52px control next to it capped at 26; the two
 * then read as different materials. Panels are therefore capped by the height of
 * the CONTROL they belong to, not their own, so a menu's corners carry exactly
 * the curvature of the trigger above it.
 */
export const pill = (height: number, radius: number): number => Math.min(radius, height / 2);

/** Radius for a layer inset inside a surface (a menu row, a segment). */
export const inner = (outer: number, padding: number): number => Math.max(4, outer - padding);

export interface EnterExitState {
  readonly mounted: boolean;
  readonly shown: boolean;
}

/**
 * Mount/unmount with an exit animation.
 *
 * Unmounting on close is what makes panels blink out: the element vanishes on the
 * same frame the state flips. Here the node stays mounted until its exit has
 * played, and `shown` flips a frame after mount so the enter transition has a
 * from-state to travel from.
 */
export function useEnterExit(open: boolean, exitMs: number): EnterExitState {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(t);
  }, [open, exitMs]);

  return { mounted, shown };
}
