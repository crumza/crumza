import { type RefObject, useLayoutEffect } from 'react';
import { type Align, computePosition, type Side } from '../../core/position';

export interface AnchorPositionOptions {
  readonly open: boolean;
  readonly anchor: RefObject<Element | null>;
  readonly floating: RefObject<HTMLElement | null>;
  readonly side?: Side | undefined;
  readonly align?: Align | undefined;
  readonly offset?: number | undefined;
  readonly padding?: number | undefined;
}

/**
 * Positions a top-layer element (popover or dialog) next to its anchor with `position: fixed`,
 * and keeps it there through scroll and resize. Writes `left`, `top`, `data-side`,
 * `data-align` and `--crumza-transform-origin` straight onto the element: no React state,
 * no re-render, no containing-block trap because the top layer ignores ancestors.
 */
export function useAnchorPosition({
  open,
  anchor,
  floating,
  side = 'bottom',
  align = 'center',
  offset = 6,
  padding = 8,
}: AnchorPositionOptions): void {
  useLayoutEffect(() => {
    if (!open) return;
    const el = floating.current;
    const an = anchor.current;
    if (!el || !an) return;

    const update = (): void => {
      const a = an.getBoundingClientRect();
      const root = document.documentElement;
      const p = computePosition({
        anchor: a,
        // Layout size, not the transformed size: the entry animation starts scaled down.
        floating: { x: 0, y: 0, width: el.offsetWidth, height: el.offsetHeight },
        boundary: { x: 0, y: 0, width: root.clientWidth, height: root.clientHeight },
        side,
        align,
        offset,
        padding,
        rtl: getComputedStyle(el).direction === 'rtl',
      });
      el.style.position = 'fixed';
      el.style.inset = 'auto';
      el.style.margin = '0';
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
      el.style.setProperty('--crumza-transform-origin', p.transformOrigin);
      el.style.setProperty('--crumza-available-height', `${p.availableHeight}px`);
      el.dataset['side'] = p.side;
      el.dataset['align'] = p.align;
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    ro.observe(an);
    window.addEventListener('scroll', update, { capture: true, passive: true });
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', update, { capture: true });
      window.removeEventListener('resize', update);
    };
  }, [open, anchor, floating, side, align, offset, padding]);
}
