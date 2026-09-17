import type { PanelRecord } from './renderer';

/**
 * Draws the scrollable content into a 2D context at the given width and
 * returns how tall it came out. `key` says which content, when a surface holds
 * more than one.
 */
export type LiquixPaint = (ctx: CanvasRenderingContext2D, width: number, key: string) => number;

export interface LiquixStrip {
  readonly panels: readonly PanelRecord[];
  /** CSS px the painting came out at. */
  readonly contentHeight: number;
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create a 2D context');
  return ctx;
}

/**
 * Turns a painted backdrop into the panel textures the shader refracts.
 *
 * The shader cannot sample DOM, it draws on a canvas of its own, so anything
 * meant to be refracted has to reach it as pixels. `paint` is how a caller
 * supplies them: draw the scrollable content into the 2D context it is given
 * and return its height. Whatever the DOM shows, paint the same thing, because
 * the two are seen together: the DOM around the glass, the painting inside it.
 *
 * The result is cut into tiles one screen tall. The shader treats the backdrop
 * as a strip of panels of exactly that height and cover-fits each one, so a
 * tile the size of the surface lands pixel for pixel with no crop.
 */
export function paintPanels(
  gl: WebGL2RenderingContext,
  paint: (ctx: CanvasRenderingContext2D, width: number) => number,
  width: number,
  height: number,
  dpr: number,
): LiquixStrip {
  // Height first, on a scratch context: the canvas cannot be sized until the
  // painting has been measured, and measuring means running the same code.
  const scratch = context2d(document.createElement('canvas'));
  scratch.scale(dpr, dpr);
  const total = Math.max(height, paint(scratch, width));

  const source = document.createElement('canvas');
  source.width = Math.ceil(width * dpr);
  source.height = Math.ceil(total * dpr);
  const ctx = context2d(source);
  ctx.scale(dpr, dpr);
  paint(ctx, width);

  const tileWidth = Math.ceil(width * dpr);
  const tileHeight = Math.ceil(height * dpr);
  const panels: PanelRecord[] = [];

  for (let i = 0; i < Math.ceil(total / height); i++) {
    const tile = document.createElement('canvas');
    tile.width = tileWidth;
    tile.height = tileHeight;
    context2d(tile).drawImage(source, 0, -i * tileHeight);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tile);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    // No mipmaps: a tile is the size of the surface it is drawn for, so it is
    // never minified, and building them is the expensive half of the upload.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    panels.push({ kind: 0, ready: true, texture, aspect: width / height });
  }

  return { panels, contentHeight: total };
}

export function disposePanels(gl: WebGL2RenderingContext, panels: readonly PanelRecord[]): void {
  for (const panel of panels) if (panel.texture) gl.deleteTexture(panel.texture);
}
