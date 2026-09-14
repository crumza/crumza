import { type RefObject, useLayoutEffect, useState } from 'react';
import { renderDisplacementMap } from './displacement-map';

export interface LensFilterOptions {
  readonly band: number;
  /** Margin the filtered element extends past the measured shape. */
  readonly inset?: number | undefined;
  readonly enabled?: boolean | undefined;
}

export interface LensFilter {
  /** The filter id, rotated whenever the map changes because WebKit caches filter output by id. */
  readonly id: string;
  readonly map: string;
}

/** Measures an element and keeps an edge-bend displacement map for its exact shape. */
export function useLensFilter(
  ref: RefObject<HTMLElement | null>,
  baseId: string,
  { band, inset = 0, enabled = true }: LensFilterOptions,
): LensFilter {
  const [shape, setShape] = useState({ width: 0, height: 0, radius: 0, version: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const measure = (): void => {
      const radius = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      const width = Math.round(el.offsetWidth);
      const height = Math.round(el.offsetHeight);
      setShape((prev) =>
        prev.width === width && prev.height === height && prev.radius === radius
          ? prev
          : { width, height, radius, version: prev.version + 1 },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // A radius-only theme change does not trigger ResizeObserver.
    const attributes = new MutationObserver(measure);
    for (let ancestor: HTMLElement | null = el; ancestor; ancestor = ancestor.parentElement) {
      attributes.observe(ancestor, {
        attributes: true,
        attributeFilter: ['style', 'class', 'data-material', 'data-theme'],
      });
    }
    return () => {
      ro.disconnect();
      attributes.disconnect();
    };
  }, [ref, enabled]);

  const map =
    enabled && shape.width > 0
      ? renderDisplacementMap({
          width: shape.width,
          height: shape.height,
          radius: shape.radius,
          band,
          inset,
        })
      : '';
  return { id: `lens-${baseId}-${shape.version}`, map };
}
