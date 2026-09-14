import type { Ref } from 'react';

type Props = Record<string, unknown>;
type Handler = (...args: unknown[]) => unknown;

function isHandlerKey(key: string): boolean {
  return (
    key.length > 2 && key.startsWith('on') && key.charCodeAt(2) >= 65 && key.charCodeAt(2) <= 90
  );
}

/**
 * Merge prop objects the way a composition layer must: later handlers run first and earlier
 * ones after unless prevented, classNames concatenate, styles merge, everything else last-wins.
 * Refs are skipped here; compose them with composeRefs.
 */
export function mergeProps(...sources: ReadonlyArray<object | undefined>): Props {
  const out: Props = {};
  for (const raw of sources) {
    if (!raw) continue;
    const source = raw as Props;
    for (const key of Object.keys(source)) {
      const next = source[key];
      const prev = out[key];
      if (key === 'ref') continue;
      if (key === 'className') {
        out[key] = [prev, next].filter((c) => typeof c === 'string' && c.length > 0).join(' ');
      } else if (
        key === 'aria-describedby' &&
        typeof prev === 'string' &&
        typeof next === 'string'
      ) {
        out[key] = [...new Set(`${prev} ${next}`.split(/\s+/).filter(Boolean))].join(' ');
      } else if (key === 'style' && typeof prev === 'object' && typeof next === 'object') {
        out[key] = { ...(prev as object), ...(next as object) };
      } else if (isHandlerKey(key) && typeof next === 'function' && typeof prev === 'function') {
        out[key] = (...args: unknown[]): unknown => {
          const result = (next as Handler)(...args);
          const event = args[0];
          if (
            !(
              typeof event === 'object' &&
              event !== null &&
              'defaultPrevented' in event &&
              event.defaultPrevented === true
            )
          ) {
            (prev as Handler)(...args);
          }
          return result;
        };
      } else if (next !== undefined) {
        out[key] = next;
      }
    }
  }
  return out;
}

/** The `ref` a consumer put on a `render` element, if any. */
export function refOf<T>(props: unknown): Ref<T> | undefined {
  return typeof props === 'object' && props !== null && 'ref' in props
    ? (props.ref as Ref<T>)
    : undefined;
}
