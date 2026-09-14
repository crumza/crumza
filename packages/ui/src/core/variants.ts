/**
 * A tiny, typed variant resolver. Zero dependencies, platform-neutral.
 * On the web the values are class strings; the native renderer will pass style objects.
 */

type VariantMap = Record<string, Record<string, string>>;

type VariantSelection<V extends VariantMap> = {
  readonly [K in keyof V]?: (keyof V[K] & string) | undefined;
};

export interface VariantsConfig<V extends VariantMap> {
  readonly base?: string;
  readonly variants: V;
  readonly defaults?: VariantSelection<V>;
}

export type VariantProps<T> = T extends (props?: infer P) => string
  ? Omit<NonNullable<P>, 'className'>
  : never;

/** Build a resolver: `button({ variant: 'glass', size: 'md', className })` returns one class string. */
export function variants<V extends VariantMap>(
  config: VariantsConfig<V>,
): (props?: VariantSelection<V> & { readonly className?: string }) => string {
  const keys = Object.keys(config.variants) as (keyof V & string)[];
  return (props) => {
    const out: string[] = [];
    if (config.base) out.push(config.base);
    for (const key of keys) {
      const chosen = props?.[key] ?? config.defaults?.[key];
      if (chosen === undefined) continue;
      const value = config.variants[key]?.[chosen];
      if (value) out.push(value);
    }
    if (props?.className) out.push(props.className);
    return out.join(' ');
  };
}
