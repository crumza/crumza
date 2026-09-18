import { type RefObject, useEffect, useState } from 'react';

export interface Measured {
  readonly width: number;
  readonly height: number;
}

/**
 * The element's box in CSS px, kept current through a ResizeObserver. The
 * shader needs boxes in the units it is given everything else, so a shape
 * that sizes to its content is measured rather than assumed.
 */
export function useMeasure(
  ref: RefObject<HTMLElement | null>,
  initial: Measured = { width: 0, height: 0 },
  /** Changes when the element may have mounted or unmounted, so it is observed again. */
  revision: unknown = true,
): Measured {
  const [size, setSize] = useState(initial);
  // biome-ignore lint/correctness/useExhaustiveDependencies: revision is the signal that ref.current changed.
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      setSize(initial);
      return;
    }
    // The border box, padding included, is the box the glass should fill;
    // offset sizes are that box before any transform, so a panel blooming
    // from 0.9 scale still reports its resting size.
    const read = () => {
      const width = Math.round(element.offsetWidth);
      const height = Math.round(element.offsetHeight);
      setSize((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    };
    const observer = new ResizeObserver(read);
    read();
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, revision]);
  return size;
}
