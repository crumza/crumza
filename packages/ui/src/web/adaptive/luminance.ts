/* Backdrop luminance, the one number the adaptive material reads.

   Everything here is pure and DOM-free so it runs on the server and in tests.
   The material wants a perceptual lightness from 0 (black) to 1 (white), not
   photometric luminance: a 50% grey is about 0.53 here, not 0.21, so the
   polarity threshold at 0.5 sits where the eye puts the middle. Colours are
   read from CSS strings (a fill, a gradient list) once, when the context is
   declared; nothing here runs per frame. */

export type LuminanceBand = 'dark' | 'mid' | 'light';

/** Straight sRGB in 0..1 per channel, alpha in 0..1. */
export interface Rgba {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/* A handful of keywords: the ones that turn up in backgrounds. Anything else
   is normalised by the browser in `parseColorInBrowser`. */
const NAMED: Readonly<Record<string, string>> = {
  white: '#ffffff',
  black: '#000000',
  gray: '#808080',
  grey: '#808080',
  silver: '#c0c0c0',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  navy: '#000080',
  teal: '#008080',
  orange: '#ffa500',
  yellow: '#ffff00',
  purple: '#800080',
  pink: '#ffc0cb',
  transparent: 'transparent',
};

const number = (token: string, scale = 1): number => {
  const t = token.trim();
  if (t === 'none') return 0;
  if (t.endsWith('%')) return (Number.parseFloat(t) / 100) * scale;
  if (t.endsWith('deg')) return Number.parseFloat(t);
  return Number.parseFloat(t);
};

const alphaOf = (token: string | undefined): number =>
  token === undefined ? 1 : clamp01(token.trim().endsWith('%') ? number(token) : Number(token));

const args = (body: string): { readonly values: string[]; readonly alpha: string | undefined } => {
  const [main, alpha] = body.split('/');
  const values = (main ?? '')
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  return { values, alpha: alpha?.trim() };
};

function hex(input: string): Rgba | undefined {
  const h = input.slice(1);
  const wide = h.length === 6 || h.length === 8;
  if (!(h.length === 3 || h.length === 4 || wide)) return undefined;
  const at = (i: number): number => {
    const part = wide ? h.slice(i * 2, i * 2 + 2) : (h[i]?.repeat(2) ?? '');
    return Number.parseInt(part, 16) / 255;
  };
  const hasAlpha = h.length === 4 || h.length === 8;
  const rgb = { r: at(0), g: at(1), b: at(2), a: hasAlpha ? at(3) : 1 };
  return Number.isNaN(rgb.r + rgb.g + rgb.b + rgb.a) ? undefined : rgb;
}

function hsl(values: string[], alpha: number): Rgba | undefined {
  const [h, s, l] = values;
  if (h === undefined || s === undefined || l === undefined) return undefined;
  const hue = (((number(h) % 360) + 360) % 360) / 360;
  const sat = clamp01(number(s));
  const lig = clamp01(number(l));
  const q = lig < 0.5 ? lig * (1 + sat) : lig + sat - lig * sat;
  const p = 2 * lig - q;
  const channel = (t0: number): number => {
    const t = ((t0 % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return { r: channel(hue + 1 / 3), g: channel(hue), b: channel(hue - 1 / 3), a: alpha };
}

const gammaEncode = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
const gammaDecode = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

function oklab(L: number, a: number, b: number, alpha: number): Rgba {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return {
    r: clamp01(gammaEncode(clamp01(r))),
    g: clamp01(gammaEncode(clamp01(g))),
    b: clamp01(gammaEncode(clamp01(bl))),
    a: alpha,
  };
}

/**
 * Parse a CSS colour without a DOM: hex, rgb(), hsl(), oklab(), oklch() and a
 * few keywords. Returns undefined for anything else, so a caller can fall back
 * to the browser.
 */
export function parseColor(input: string): Rgba | undefined {
  const raw = input.trim().toLowerCase();
  if (raw === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const named = NAMED[raw];
  if (named) return named === 'transparent' ? { r: 0, g: 0, b: 0, a: 0 } : hex(named);
  if (raw.startsWith('#')) return hex(raw);
  const fn = /^([a-z]+)\((.*)\)$/.exec(raw);
  if (!fn) return undefined;
  const name = fn[1] ?? '';
  const { values, alpha: alphaToken } = args(fn[2] ?? '');
  const legacyAlpha = values.length === 4 && alphaToken === undefined ? values.pop() : undefined;
  const alpha = alphaOf(alphaToken ?? legacyAlpha);
  const [x, y, z] = values;
  if (x === undefined || y === undefined || z === undefined) return undefined;
  switch (name) {
    case 'rgb':
    case 'rgba':
      return {
        r: clamp01(number(x, 255) / 255),
        g: clamp01(number(y, 255) / 255),
        b: clamp01(number(z, 255) / 255),
        a: alpha,
      };
    case 'hsl':
    case 'hsla':
      return hsl(values, alpha);
    case 'oklab':
      return oklab(number(x), number(y, 0.4), number(z, 0.4), alpha);
    case 'oklch': {
      const L = number(x);
      const C = number(y, 0.4);
      const H = (number(z) * Math.PI) / 180;
      return oklab(L, C * Math.cos(H), C * Math.sin(H), alpha);
    }
    default:
      return undefined;
  }
}

/** Photometric relative luminance (Y) of straight sRGB. */
export function relativeLuminance({ r, g, b }: Rgba): number {
  return 0.2126 * gammaDecode(r) + 0.7152 * gammaDecode(g) + 0.0722 * gammaDecode(b);
}

/** CIE L* scaled to 0..1: the perceptual lightness the material thresholds on. */
export function lightnessFromLuminance(Y: number): number {
  const y = clamp01(Y);
  const l = y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y;
  return clamp01(l / 100);
}

/** Perceptual lightness of one colour, 0..1, or undefined if it cannot be read here. */
export function colorLightness(color: string): number | undefined {
  const rgb = parseColor(color);
  if (!rgb || rgb.a === 0) return undefined;
  return lightnessFromLuminance(relativeLuminance(rgb));
}

/* Every colour token in a background list. Nested parentheses (a colour inside
   a gradient inside a list) are handled by matching balanced groups one deep. */
const COLOR_TOKEN =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklab|oklch|lab|lch|color)\((?:[^()]|\([^()]*\))*\)|\b(?:white|black|gr[ae]y|silver|red|green|blue|navy|teal|orange|yellow|purple|pink)\b/gi;

/**
 * Estimate the lightness of a CSS background: a colour, a gradient, or a
 * comma-separated list of them. Every colour stop counts once, weighted by its
 * alpha, and the answer is the mean lightness. A gradient from white to black
 * therefore reads as 0.5, the middle, rather than as a photometric average.
 * Returns undefined when nothing in the string is a colour this parser knows
 * (an image URL, an unknown keyword), so the caller can sample or declare.
 */
export function estimateLuminance(
  background: string,
  resolve: (token: string) => Rgba | undefined = parseColor,
): number | undefined {
  let total = 0;
  let weight = 0;
  for (const match of background.matchAll(COLOR_TOKEN)) {
    const rgb = resolve(match[0]);
    if (!rgb || rgb.a === 0) continue;
    total += lightnessFromLuminance(relativeLuminance(rgb)) * rgb.a;
    weight += rgb.a;
  }
  return weight > 0 ? total / weight : undefined;
}

/** Three bands for markup and readouts; the CSS reads the number itself. */
export function luminanceBand(lightness: number): LuminanceBand {
  return lightness < 0.42 ? 'dark' : lightness > 0.58 ? 'light' : 'mid';
}

/** Mean lightness of a run of RGBA bytes, the shape ImageData hands back. */
export function meanLightness(
  data: ArrayLike<number>,
  stride: number = 4,
  from: number = 0,
  to: number = data.length,
): number | undefined {
  let total = 0;
  let count = 0;
  for (let i = from; i + 2 < to; i += stride) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    total += relativeLuminance({ r: r / 255, g: g / 255, b: b / 255, a: 1 });
    count++;
  }
  return count ? lightnessFromLuminance(total / count) : undefined;
}
