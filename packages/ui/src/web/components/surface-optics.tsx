import { type ReactElement, useContext, useId, useLayoutEffect, useRef } from 'react';
import { useLensFilter } from '../primitives/use-lens-filter';
import { LensFilterSvg } from './LensFilterSvg';
import { SceneContext, type SceneContextValue } from './Lens';

/** Optional edge refraction of an owned Scene background, never arbitrary page DOM. */
export function SurfaceOptics(): ReactElement | null {
  const scene = useContext(SceneContext);
  return scene ? <OwnedOptics scene={scene} /> : null;
}

function OwnedOptics({ scene }: { readonly scene: SceneContextValue }): ReactElement {
  const host = useRef<HTMLElement | null>(null);
  const layer = useRef<HTMLSpanElement | null>(null);
  const id = useId().replace(/:/g, '');
  const filter = useLensFilter(host, id, { band: 3 });

  useLayoutEffect(() => {
    const element = host.current;
    const backdrop = scene.ref.current;
    const copy = layer.current;
    if (!element || !backdrop || !copy) return;
    const align = (): void => {
      const a = backdrop.getBoundingClientRect();
      const b = element.getBoundingClientRect();
      copy.style.backgroundSize = `${a.width}px ${a.height}px`;
      copy.style.backgroundPosition = `${a.left - b.left - element.clientLeft}px ${a.top - b.top - element.clientTop}px`;
    };
    align();
    const observer = new ResizeObserver(align);
    observer.observe(element);
    observer.observe(backdrop);
    backdrop.addEventListener('scroll', align, { capture: true, passive: true });
    return () => {
      observer.disconnect();
      backdrop.removeEventListener('scroll', align, true);
    };
  });

  return (
    <span
      className="surface-optics"
      aria-hidden="true"
      ref={(node) => {
        host.current = node?.parentElement ?? null;
      }}
    >
      {filter.map ? (
        <LensFilterSvg id={filter.id} map={filter.map} scale={-7} dispersion={0} />
      ) : null}
      <span className="surface-optics-edge">
        <span
          ref={layer}
          className="surface-optics-copy"
          style={{
            backgroundImage: scene.backdrop,
            filter: filter.map ? `url(#${filter.id})` : undefined,
          }}
        />
      </span>
    </span>
  );
}
