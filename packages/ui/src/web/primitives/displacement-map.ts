/**
 * An edge-weighted displacement map for a rounded rectangle, as a PNG data URL.
 * R is the X offset and G the Y offset (128 neutral), A is always 255. The interior stays
 * neutral so content under the centre is untouched; the band along the edge bends outward
 * with a smooth falloff, which is what reads as a thick pane of glass.
 */
export interface LensShape {
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  /** How far in from the edge the bend reaches, in px. */
  readonly band: number;
  /** Extra margin around the shape covered by the map (the lens copy bleeds past its box). */
  readonly inset?: number | undefined;
}

const MAX_SIDE = 512;
const cache = new Map<string, string>();

export function renderDisplacementMap(shape: LensShape): string {
  const inset = shape.inset ?? 0;
  const key = `${shape.width}x${shape.height}r${shape.radius}b${shape.band}i${inset}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const fullW = shape.width + inset * 2;
  const fullH = shape.height + inset * 2;
  const s = Math.min(1, MAX_SIDE / Math.max(fullW, fullH, 1));
  const w = Math.max(2, Math.round(fullW * s));
  const h = Math.max(2, Math.round(fullH * s));
  const rectW = shape.width * s;
  const rectH = shape.height * s;
  const r = Math.min(shape.radius * s, rectW / 2, rectH / 2);
  const band = Math.max(1, shape.band * s);
  const cx = w / 2;
  const cy = h / 2;
  const hx = rectW / 2 - r;
  const hy = rectH / 2 - r;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - cx;
      const py = y + 0.5 - cy;
      // Signed distance to the rounded rectangle and the outward normal at this pixel.
      const qx = Math.abs(px) - hx;
      const qy = Math.abs(py) - hy;
      let nx = 0;
      let ny = 0;
      let depth: number;
      if (qx > 0 && qy > 0) {
        const len = Math.hypot(qx, qy) || 1;
        nx = (qx / len) * Math.sign(px);
        ny = (qy / len) * Math.sign(py);
        depth = r - len;
      } else if (qx > qy) {
        nx = Math.sign(px);
        depth = r - qx;
      } else {
        ny = Math.sign(py);
        depth = r - qy;
      }
      const t = Math.min(Math.max(depth / band, 0), 1);
      const m = (1 - t) * (1 - t);
      const i = (y * w + x) * 4;
      d[i] = Math.round(128 + nx * m * 127);
      d[i + 1] = Math.round(128 + ny * m * 127);
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL('image/png');
  if (cache.size > 64) cache.clear();
  cache.set(key, url);
  return url;
}
