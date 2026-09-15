/* Liquid glass refraction engine. Framework-agnostic.

   background scene -> displacement map (canvas SDF) -> SVG feDisplacementMap
                    -> composited blur, tint and glint -> component surface

   Nothing here touches React or assumes a scene size: every function takes
   explicit pixel geometry, so a surface can be any size the layout gives it. */

export interface LiquidGlassParams {
  readonly depth: number;
  readonly splay: number;
  readonly feather: number;
  readonly curve: number;
  readonly blur: number;
  readonly chroma: number;
  readonly glint: number;
  readonly tint: number;
  readonly tintColor: string;
}

/** The public knobs. Every other optic in LiquidGlassParams is fixed by the frosted toggle. */
export interface LiquidOptions {
  /** Frosted glass: a deeper, wider rim with a soft interior blur. Off is clear glass. */
  readonly frosted?: boolean | undefined;
  /** Interior blur in px, 0 to 15. Defaults to 2.5, or 5 when frosted. */
  readonly blur?: number | undefined;
  /** Specular rim intensity, 0 to 100. Defaults to 100. */
  readonly glint?: number | undefined;
  /** Tint strength, 0 to 1. Defaults to 0.2. */
  readonly tint?: number | undefined;
  /** Tint colour, any CSS colour. Defaults to black. */
  readonly tintColor?: string | undefined;
}

/** Padding around the glass window that the map and refraction layer overhang, so
 *  the edge displacement has real pixels to pull inward from. */
export const PAD = 20;
/** Saturation boost of the displacement map (how hard the rim bends light). */
export const BOOST = 0.8;
/** Supersample factor. Kept at 1: SS=2 quadruples filter pixels, which Safari
 *  cannot sustain at 60fps. Do not raise without re-testing WebKit. */
export const SS = 1;

/** The two optics. Clear is the resting material; frosted is the toggle. */
export const LIQUID_OPTICS: Record<'clear' | 'frosted', LiquidGlassParams> = {
  clear: {
    depth: 60,
    splay: 2,
    feather: 24,
    curve: 2,
    blur: 2.5,
    chroma: 0,
    glint: 100,
    tint: 0.2,
    tintColor: '#000000',
  },
  frosted: {
    depth: 120,
    splay: 16,
    feather: 26,
    curve: 2.6,
    blur: 5,
    chroma: 0,
    glint: 100,
    tint: 0.2,
    tintColor: '#000000',
  },
};

export interface LiquidRange {
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

/** Slider ranges for the three adjustable optics. */
export const LIQUID_RANGES: Record<'blur' | 'glint' | 'tint', LiquidRange> = {
  blur: { min: 0, max: 15, step: 0.5 },
  glint: { min: 0, max: 100, step: 1 },
  tint: { min: 0, max: 1, step: 0.02 },
};

const clamp = (value: number, range: LiquidRange): number =>
  Math.min(range.max, Math.max(range.min, value));

const pick = (value: number | undefined, fallback: number, range: LiquidRange): number =>
  value !== undefined && Number.isFinite(value) ? clamp(value, range) : fallback;

/** Turn the public options into the full parameter set the engine paints with. */
export function resolveLiquidParams(options: LiquidOptions = {}): LiquidGlassParams {
  const base = options.frosted ? LIQUID_OPTICS.frosted : LIQUID_OPTICS.clear;
  return {
    ...base,
    blur: pick(options.blur, base.blur, LIQUID_RANGES.blur),
    glint: pick(options.glint, base.glint, LIQUID_RANGES.glint),
    tint: pick(options.tint, base.tint, LIQUID_RANGES.tint),
    tintColor: options.tintColor ?? base.tintColor,
  };
}

/* displacement map */

/** Every map ever built lives here, keyed by geometry and optics, so resizing,
 *  opening a menu or scrubbing back over a previous value re-uses a decoded
 *  PNG instead of re-running the per-pixel SDF loop. Shared across surfaces:
 *  two surfaces of the same size cost one map, not two. */
const mapCache = new Map<string, string>();
const MAP_CACHE_LIMIT = 300;

const clamp255 = (v: number): number => (v < 0 ? 0 : v > 255 ? 255 : v);

export function lensMapKey(
  mw: number,
  mh: number,
  winW: number,
  winH: number,
  radius: number,
  rim: number,
  curve: number,
  feather: number,
): string {
  return `${mw}:${mh}:${winW}:${winH}:${radius}:${rim}:${curve}:${feather}`;
}

/**
 * Build (or fetch from cache) the RG displacement map for a rounded-rect lens.
 *
 * R is the x displacement, G the y displacement, both centred on 127.5 (no shift).
 * B is unused: the specular highlight is a composited CSS layer, not a filter pass.
 */
export function buildLensMap(
  mw: number,
  mh: number,
  winW: number,
  winH: number,
  radius: number,
  rim: number,
  curve: number,
  feather: number,
): string {
  const key = lensMapKey(mw, mh, winW, winH, radius, rim, curve, feather);
  const hit = mapCache.get(key);
  if (hit) return hit;

  const cv = document.createElement('canvas');
  cv.width = mw;
  cv.height = mh;
  const ctx = cv.getContext('2d');
  if (!ctx) return '';

  const img = ctx.createImageData(mw, mh);
  const px = img.data;

  const hx = winW / 2;
  const hy = winH / 2;
  const r = Math.min(radius, hx, hy); // a radius larger than the half-size would invert the SDF

  // signed distance to the rounded-rect glass edge (0 = on the edge, <0 = inside)
  const sdf = (x: number, y: number): number => {
    const qx = Math.abs(x - mw / 2) - (hx - r);
    const qy = Math.abs(y - mh / 2) - (hy - r);
    const ox = Math.max(qx, 0);
    const oy = Math.max(qy, 0);
    return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
  };

  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      const cx = x + 0.5;
      const cy = y + 0.5;
      const s = sdf(cx, cy);
      const gx = sdf(cx + 1, cy) - sdf(cx - 1, cy); // outward edge normal
      const gy = sdf(cx, cy + 1) - sdf(cx, cy - 1);
      const len = Math.hypot(gx, gy) || 1;
      const nx = gx / len;
      const ny = gy / len;
      const span = s < 0 ? rim + feather : rim; // inner side: wider, softer falloff
      let amt = Math.max(0, 1 - Math.abs(s) / span); // ring centred on the edge
      amt = amt * amt * amt * (amt * (amt * 6 - 15) + 10); // smootherstep (no crease)
      amt = amt ** curve; // curvature shapes the bevel profile

      const i = (y * mw + x) * 4;
      px[i] = clamp255(Math.round(127.5 - nx * amt * 127 * BOOST));
      px[i + 1] = clamp255(Math.round(127.5 - ny * amt * 127 * BOOST));
      px[i + 2] = 128;
      px[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const url = cv.toDataURL('image/png');

  if (mapCache.size > MAP_CACHE_LIMIT) {
    const oldest = mapCache.keys().next().value;
    if (oldest) mapCache.delete(oldest);
  }
  mapCache.set(key, url);
  return url;
}

/** Map-geometry quantum, in px. While a surface is mid-resize (a panel opening,
 *  a stage resize) its exact size changes every frame, which would mint and
 *  decode a brand-new map per frame. Building on a quantized size and letting
 *  the filter's feImage stretch it to the real box keeps the rim field correct
 *  to the eye at a handful of cached maps instead of a hundred. The settled
 *  frame is always built at the exact size. */
export const MAP_QUANTUM = 8;
export const quantizeMapDim = (v: number): number =>
  Math.max(MAP_QUANTUM, Math.ceil(v / MAP_QUANTUM) * MAP_QUANTUM);

/** Cache lookup without building. Lets a caller mid-animation decide to reuse
 *  the map it already has rather than block a frame on the SDF loop. */
export function peekLensMap(
  mw: number,
  mh: number,
  winW: number,
  winH: number,
  radius: number,
  rim: number,
  curve: number,
  feather: number,
): string | undefined {
  return mapCache.get(lensMapKey(mw, mh, winW, winH, radius, rim, curve, feather));
}

/** Best-effort idle prebuild and decode, so the first paint of a geometry the UI
 *  is about to need (an opening menu, an expanding panel) is not a cold start. */
const prewarmed: HTMLImageElement[] = [];
export function prewarmLensMap(
  mw: number,
  mh: number,
  winW: number,
  winH: number,
  radius: number,
  rim: number,
  curve: number,
  feather: number,
): void {
  if (mapCache.has(lensMapKey(mw, mh, winW, winH, radius, rim, curve, feather))) return;
  const idle = (cb: () => void): void => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(cb);
    else window.setTimeout(cb, 16);
  };
  idle(() => {
    const url = buildLensMap(mw, mh, winW, winH, radius, rim, curve, feather);
    if (!url) return;
    const im = new Image();
    im.src = url;
    void im.decode?.().catch(() => undefined);
    prewarmed.push(im);
    if (prewarmed.length > 40) prewarmed.shift();
  });
}

/* SVG filter */

let filterSerial = 0;

export interface LensFilterUpdate {
  readonly mapUrl: string;
  readonly mapW: number;
  readonly mapH: number;
  readonly depth: number;
  readonly chroma: number;
  /** Re-mint the filter id even when nothing else changed. Needed when the
   *  SOURCE content is animating, because Safari caches a filter's output by id
   *  and would otherwise freeze the first frame it rendered. */
  readonly remint?: boolean | undefined;
}

export interface LensFilterHandle {
  update(next: LensFilterUpdate): void;
}

/**
 * Owns one <filter> and mutates it in place.
 *
 * Rewriting the housing's innerHTML (a string carrying a base64 map ~40KB long)
 * on every frame would re-parse the filter graph and re-decode the map sixty
 * times a second. Here the graph is built once and only the attributes that
 * actually changed are touched (`scale`, the feImage box), which is enough to
 * invalidate the filter and re-render.
 *
 * The Safari id trick is kept, but paid for only when it is needed: whenever the
 * map image itself changes, and on demand for animated source content. Re-minting
 * is just an id swap on the existing nodes. No re-parse, no re-decode.
 */
export function createLensFilter(housing: SVGSVGElement, target: HTMLElement): LensFilterHandle {
  const XLINK = 'http://www.w3.org/1999/xlink';

  let id = '';
  let chromaMode: boolean | null = null;
  let filterEl: Element | null = null;
  let feImage: Element | null = null;
  let dispA: Element | null = null; // single pass, or the red pass
  let dispB: Element | null = null; // the green+blue pass (chroma only)

  let curUrl = '';
  let curW = -1;
  let curH = -1;
  let curScaleA = Number.NaN;
  let curScaleB = Number.NaN;

  const build = (chroma: boolean): void => {
    id = `lq-lens-${++filterSerial}`;
    const disp = chroma
      ? // Red/cyan chromatic aberration: red takes the larger displacement, green+blue
        // the smaller one. Two passes rather than a full per-channel split. Alpha is
        // kept on both layers so the arithmetic add survives premultiplication.
        `<feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G" result="dR"/>
         <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G" result="dGB"/>
         <feColorMatrix in="dR"  type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cR"/>
         <feColorMatrix in="dGB" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cGB"/>
         <feComposite in="cR" in2="cGB" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="disp"/>`
      : `<feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G" result="disp"/>`;

    housing.innerHTML = `
      <defs>
        <filter id="${id}" x="0" y="0" width="100%" height="100%"
                filterUnits="objectBoundingBox" color-interpolation-filters="sRGB">
          <feImage x="0" y="0" preserveAspectRatio="none" result="map"/>
          ${disp}
        </filter>
      </defs>`;

    filterEl = housing.querySelector('filter');
    feImage = housing.querySelector('feImage');
    const disps = housing.querySelectorAll('feDisplacementMap');
    dispA = disps[0] ?? null;
    dispB = disps[1] ?? null;

    chromaMode = chroma;
    curUrl = '';
    curW = -1;
    curH = -1;
    curScaleA = Number.NaN;
    curScaleB = Number.NaN;
    // displacement only: the CSS blur lives on its own wrapper, because Safari
    // over-blurs a blur() chained onto a url() filter
    target.style.filter = `url(#${id})`;
  };

  const remint = (): void => {
    if (!filterEl) return;
    id = `lq-lens-${++filterSerial}`;
    filterEl.setAttribute('id', id);
    target.style.filter = `url(#${id})`;
  };

  return {
    update({ mapUrl, mapW, mapH, depth, chroma, remint: force }) {
      const useChroma = chroma > 0;
      if (chromaMode !== useChroma) build(useChroma);
      if (!feImage || !dispA) return;

      let mapChanged = false;
      if (mapUrl !== curUrl) {
        curUrl = mapUrl;
        feImage.setAttribute('href', mapUrl);
        feImage.setAttributeNS(XLINK, 'xlink:href', mapUrl);
        mapChanged = true;
      }
      // the map is always presented at the surface's true size; preserveAspectRatio
      // "none" stretches a quantized map onto the real box during a size tween
      if (mapW !== curW) {
        curW = mapW;
        feImage.setAttribute('width', String(mapW));
      }
      if (mapH !== curH) {
        curH = mapH;
        feImage.setAttribute('height', String(mapH));
      }

      const sc = depth * SS; // displacement scale in px
      const scaleA = useChroma ? sc * (1 + chroma) : sc;
      if (scaleA !== curScaleA) {
        curScaleA = scaleA;
        dispA.setAttribute('scale', String(scaleA));
      }
      if (dispB) {
        const scaleB = sc * (1 - chroma);
        if (scaleB !== curScaleB) {
          curScaleB = scaleB;
          dispB.setAttribute('scale', String(scaleB));
        }
      }

      // A changed map image is the one case WebKit will happily keep serving stale,
      // so pay for an id swap there; otherwise only when the caller asks.
      if (mapChanged || force) remint();
    },
  };
}
