import { LiquixSurface, LiquixTabs, LiquixTabsShadow } from '@crumza/ui/web';
import { type ReactElement, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

/**
 * A photograph under a glass tab bar, inline in the docs page.
 *
 * The one rule of a LiquixSurface: the shader cannot see DOM, so the picture
 * exists twice, once as the element below and once drawn into `paint`. Both
 * are cover-fitted into the same box, which is what keeps the picture inside
 * the glass lined up with the picture around it.
 */

// The four stills are Unsplash-licensed, downscaled for the page.
const PLACES = [
  { id: 'fjord', label: 'Fjord', src: '/demos/fjord.jpg' },
  { id: 'valley', label: 'Valley', src: '/demos/valley.jpg' },
  { id: 'waterfall', label: 'Falls', src: '/demos/waterfall.jpg' },
  { id: 'city', label: 'City', src: '/demos/city.jpg' },
] as const;

type PlaceId = (typeof PLACES)[number]['id'];
const IDS: readonly string[] = PLACES.map((place) => place.id);

// The container's height, and how much taller the picture is than it, so
// there is something to scroll under the bar.
const HEIGHT = 440;
const CONTENT_HEIGHT = Math.round(HEIGHT * 1.6);

// Filled icons, inline because four of them is not worth a dependency. They
// inherit size and colour from the button, so the tab styling drives them.
function Icon({ children }: { children: ReactNode }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-[18px] w-[18px]">
      {children}
    </svg>
  );
}
const MountainIcon = (): ReactElement => (
  <Icon>
    <path d="m14 6 3.5 6L20 8l3 12H1l7-14 3.5 6z" />
  </Icon>
);
const SunIcon = (): ReactElement => (
  <Icon>
    <path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0-5 1.5 3h-3zm0 20-1.5-3h3zM2 12l3-1.5v3zm20 0-3 1.5v-3zM4.9 4.9l3.2 1.1-2.1 2.1zm14.2 14.2-3.2-1.1 2.1-2.1zM4.9 19.1l1.1-3.2 2.1 2.1zM19.1 4.9 18 8.1 15.9 6z" />
  </Icon>
);
const WaterIcon = (): ReactElement => (
  <Icon>
    <path d="M12 2.5c3.3 4.2 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.7-6.8 6-11" />
  </Icon>
);
const CityIcon = (): ReactElement => (
  <Icon>
    <path d="M3 21V9h5V4h8v8h5v9zm2-2h3v-3H5zm0-5h3v-3H5zm5 5h3v-3h-3zm0-5h3v-3h-3zm0-5h3V6h-3zm6 10h3v-3h-3zm0-5h3v-3h-3z" />
  </Icon>
);
const ICONS: Record<PlaceId, () => ReactElement> = {
  fjord: MountainIcon,
  valley: SunIcon,
  waterfall: WaterIcon,
  city: CityIcon,
};
const TABS = PLACES.map((place) => ({ id: place.id, label: place.label, Icon: ICONS[place.id] }));

/** object-fit: cover, object-position: center, as numbers the canvas can use. */
function cover(image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  return { x: (width - w) / 2, y: (height - h) / 2, w, h };
}

/** A glass tab bar over photographs, in an ordinary box on the page. */
export function LiquixTabsDemo(): ReactElement {
  const [active, setActive] = useState<string>(IDS[0] ?? 'fjord');
  const place = PLACES.find((entry) => entry.id === active) ?? PLACES[0];

  // The bar needs the box's width in CSS px, and the box follows the page, so
  // it is measured rather than assumed.
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  // The pictures, decoded once. `paint` is keyed on them, so the surface
  // repaints its strips as each one arrives.
  const [images, setImages] = useState<Partial<Record<PlaceId, HTMLImageElement>>>({});
  useEffect(() => {
    let cancelled = false;
    for (const { id, src } of PLACES) {
      const image = new Image();
      image.onload = () => {
        if (!cancelled) setImages((current) => ({ ...current, [id]: image }));
      };
      image.src = src;
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const paint = useCallback(
    (ctx: CanvasRenderingContext2D, paintWidth: number, key: string) => {
      const image = images[key as PlaceId];
      if (image) {
        const box = cover(image, paintWidth, CONTENT_HEIGHT);
        ctx.drawImage(image, box.x, box.y, box.w, box.h);
      } else {
        // Not decoded yet: the same dark ground the element shows.
        ctx.fillStyle = '#1c1f26';
        ctx.fillRect(0, 0, paintWidth, CONTENT_HEIGHT);
      }
      return CONTENT_HEIGHT;
    },
    [images],
  );

  return (
    <div className="demo-embed">
      <div ref={hostRef} style={{ height: `${HEIGHT}px` }}>
        <LiquixSurface
          paint={paint}
          paintKey={active}
          paintKeys={IDS}
          className="h-full w-full bg-[#1c1f26]"
          underlay={<LiquixTabsShadow width={width} />}
          overlay={<LiquixTabs tabs={TABS} active={active} onChange={setActive} width={width} />}
        >
          {/* The same picture the shader was handed, cover-fitted into the same box. */}
          <img
            src={place.src}
            alt={place.label}
            draggable={false}
            style={{ height: `${CONTENT_HEIGHT}px` }}
            className="block w-full select-none object-cover object-center"
          />
        </LiquixSurface>
      </div>
      <p>
        Switch tabs to send the highlight travelling as glass, and scroll the picture to move it under the bar.
        Needs WebGL2; without it the bar falls back to CSS.
      </p>
    </div>
  );
}
