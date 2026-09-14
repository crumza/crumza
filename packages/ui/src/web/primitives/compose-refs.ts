import type { Ref, RefCallback } from 'react';

function setRef<T>(ref: Ref<T> | undefined, value: T | null): (() => void) | undefined {
  if (typeof ref === 'function') {
    const cleanup = ref(value);
    return typeof cleanup === 'function' ? cleanup : () => ref(null);
  }
  if (ref) {
    ref.current = value;
    return () => {
      ref.current = null;
    };
  }
  return undefined;
}

/** One callback ref that feeds several refs, honouring React 19 ref cleanups. */
export function composeRefs<T>(...refs: ReadonlyArray<Ref<T> | undefined>): RefCallback<T> {
  return (node) => {
    const cleanups = refs.map((ref) => setRef(ref, node));
    return () => {
      for (const cleanup of cleanups) cleanup?.();
    };
  };
}
