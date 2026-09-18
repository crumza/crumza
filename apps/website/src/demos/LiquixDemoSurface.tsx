import { LiquixSurface } from '@crumza/ui/web';
import { type ReactElement, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

/**
 * The shell every liquix control demo sits in: a wallpaper picker, a
 * LiquixSurface showing the picture, and the control in its overlay.
 *
 * The one rule of a LiquixSurface: the shader cannot see DOM, so the picture
 * exists twice, once as the element below and once drawn into `paint`. Both
 * are cover-fitted into the same box, which is what keeps the picture inside
 * the glass lined up with the picture around it.
 */

// The wallpapers on offer, from public/assets, kept as they were given. Every
// one is rasterised up front, so swapping is a pointer swap on the GPU.
const WALLPAPERS = [
  { id: 'beach', label: 'Beach', src: '/assets/beach.jpg' },
  { id: 'lake', label: 'Lake', src: '/assets/lake.jpg' },
  { id: 'valley', label: 'Valley', src: '/assets/valley.jpg' },
  { id: 'field', label: 'Field', src: '/assets/field.jpg' },
  { id: 'moss', label: 'Moss', src: '/assets/mosh.jpg' },
  { id: 'neon', label: 'Neon', src: '/assets/mac-bg.jpeg' },
] as const;

type WallpaperId = (typeof WALLPAPERS)[number]['id'];
const WALLPAPER_IDS: readonly string[] = WALLPAPERS.map((wallpaper) => wallpaper.id);

/** object-fit: cover, object-position: center, as numbers the canvas can use. */
function cover(image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  return { x: (width - w) / 2, y: (height - h) / 2, w, h };
}

export interface LiquixDemoSurfaceProps {
  /** The box's height in CSS px. The picture fills it exactly, so nothing scrolls. */
  readonly height?: number;
  /** The control, given the surface's width in CSS px. */
  readonly overlay: (width: number) => ReactNode;
  readonly underlay?: ((width: number) => ReactNode) | undefined;
  readonly caption: ReactNode;
}

export function LiquixDemoSurface({ height = 440, overlay, underlay, caption }: LiquixDemoSurfaceProps): ReactElement {
  const [wallpaperId, setWallpaperId] = useState<WallpaperId>('beach');
  const wallpaper = WALLPAPERS.find((entry) => entry.id === wallpaperId) ?? WALLPAPERS[0];

  // The controls need the box's width in CSS px, and the box follows the page,
  // so it is measured rather than assumed.
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
  const [images, setImages] = useState<Partial<Record<WallpaperId, HTMLImageElement>>>({});
  useEffect(() => {
    let cancelled = false;
    for (const { id, src } of WALLPAPERS) {
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
      const image = images[key as WallpaperId];
      if (image) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const box = cover(image, paintWidth, height);
        ctx.drawImage(image, box.x, box.y, box.w, box.h);
      } else {
        ctx.fillStyle = '#1c1f26';
        ctx.fillRect(0, 0, paintWidth, height);
      }
      return height;
    },
    [images, height],
  );

  return (
    <>
      <div className="appearance-controls demo-controls">
        <label>
          Backdrop
          <select value={wallpaperId} onChange={(event) => setWallpaperId(event.target.value as WallpaperId)}>
            {WALLPAPERS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="demo-embed">
        <div ref={hostRef} style={{ height: `${height}px` }}>
          <LiquixSurface
            paint={paint}
            paintKey={wallpaperId}
            paintKeys={WALLPAPER_IDS}
            className="h-full w-full bg-[#1c1f26]"
            underlay={underlay?.(width)}
            overlay={overlay(width)}
          >
            <img
              src={wallpaper.src}
              alt={wallpaper.label}
              draggable={false}
              style={{ height: `${height}px` }}
              className="block w-full select-none object-cover object-center"
            />
          </LiquixSurface>
        </div>
        <p>{caption}</p>
      </div>
    </>
  );
}
