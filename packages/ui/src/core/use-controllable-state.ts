import { useCallback, useRef, useState } from 'react';

export interface ControllableStateOptions<T> {
  /** Controlled value. Leave undefined for uncontrolled. */
  readonly value?: T | undefined;
  readonly defaultValue: T;
  readonly onChange?: ((value: T) => void) | undefined;
}

/** Controlled-or-uncontrolled state with one setter. The `onChange` ref never goes stale. */
export function useControllableState<T>(
  options: ControllableStateOptions<T>,
): readonly [T, (next: T) => void] {
  const [internal, setInternal] = useState(options.defaultValue);
  const controlled = options.value !== undefined;
  const value = controlled ? (options.value as T) : internal;
  const onChangeRef = useRef(options.onChange);
  onChangeRef.current = options.onChange;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInternal(next);
      onChangeRef.current?.(next);
    },
    [controlled],
  );
  return [value, set] as const;
}
