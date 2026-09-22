import { type RefObject, useEffect, useRef, useState } from 'react';
import { useLiquidScene } from './scene';

/* A morph has four moments, not two. A control that grows into a panel is a
   panel while it grows and a control again only once it has shrunk back, so a
   component that renders from `open` alone either blinks its panel in whole or
   loses its rows before the glass has folded. The phase on each side gives
   the stylesheet a state to describe for the length of the move, and the
   scene paints through both, because a box that changes is glass that moves. */

export type MorphPhase = 'closed' | 'opening' | 'open' | 'closing';

/**
 * Follow `open` through a phase on each side: `opening` for `openMs`, then
 * `open`; `closing` for `closeMs`, then `closed`. The scene is pumped for the
 * length of each move.
 */
export function useMorphPhase(open: boolean, openMs: number, closeMs: number): MorphPhase {
  const { pump } = useLiquidScene();
  const [phase, setPhase] = useState<MorphPhase>(open ? 'open' : 'closed');
  useEffect(() => {
    setPhase((current) => {
      if (open) return current === 'open' ? current : 'opening';
      return current === 'closed' ? current : 'closing';
    });
    const ms = open ? openMs : closeMs;
    pump(ms + 300);
    const t = window.setTimeout(() => setPhase(open ? 'open' : 'closed'), ms);
    return () => window.clearTimeout(t);
  }, [open, openMs, closeMs, pump]);
  return phase;
}

/** True while the morph is on the panel's side: growing, grown or folding. */
export const isShowing = (phase: MorphPhase): boolean => phase !== 'closed';

/**
 * A press anywhere outside `root`, or Escape, calls `onDismiss` while `open`.
 * The flag says whether the thing being dismissed held focus, so a caller can
 * hand focus back only when it would otherwise be lost.
 */
export function useDismiss(
  open: boolean,
  root: RefObject<HTMLElement | null>,
  onDismiss: (hadFocus: boolean) => void,
): void {
  const latest = useRef(onDismiss);
  latest.current = onDismiss;
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent): void => {
      const el = root.current;
      if (!el || !(event.target instanceof Node) || el.contains(event.target)) return;
      latest.current(el.contains(document.activeElement));
    };
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') latest.current(true);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, root]);
}

/** Arrow keys walk `selector` inside `root` and wrap; Home and End go to the ends. */
export function walk(
  event: { key: string; preventDefault(): void },
  root: HTMLElement | null,
  selector: string,
  axis: 'x' | 'y' | 'both' = 'both',
): void {
  if (!root) return;
  const all = Array.from(root.querySelectorAll<HTMLElement>(selector));
  const n = all.length;
  const i = all.indexOf(document.activeElement as HTMLElement);
  const next = axis === 'y' ? 'ArrowDown' : 'ArrowRight';
  const prev = axis === 'y' ? 'ArrowUp' : 'ArrowLeft';
  const forward = event.key === next || (axis === 'both' && event.key === 'ArrowDown');
  const back = event.key === prev || (axis === 'both' && event.key === 'ArrowUp');
  let to: number;
  if (forward) to = (i + 1) % n;
  else if (back) to = (i - 1 + n) % n;
  else if (event.key === 'Home') to = 0;
  else if (event.key === 'End') to = n - 1;
  else return;
  event.preventDefault();
  all[to]?.focus();
}
