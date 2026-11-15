// WCAG 2.x contrast math. Used by the playground's style tile to measure the *rendered* colors.

export type Rgb = { r: number; g: number; b: number; a: number };

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Composites `top` over an opaque `bottom` (for translucent foregrounds). */
function over(top: Rgb, bottom: Rgb): Rgb {
  const a = top.a;
  return { r: top.r * a + bottom.r * (1 - a), g: top.g * a + bottom.g * (1 - a), b: top.b * a + bottom.b * (1 - a), a: 1 };
}

export function contrastRatio(fg: Rgb, bg: Rgb): number {
  const solidFg = fg.a < 1 ? over(fg, bg) : fg;
  const l1 = relativeLuminance(solidFg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Parses what getComputedStyle returns: `rgb(r, g, b)`, `rgba(...)`, `rgb(r g b / a)`, `color(srgb r g b / a)` and
 * `#rrggbb`. Returns null for anything else.
 */
export function parseCssColor(input: string): Rgb | null {
  const s = input.trim();
  const hex = s.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const rgb = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i);
  if (rgb) {
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: alpha(rgb[4]) };
  }
  const srgb = s.match(/^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i);
  if (srgb) {
    return { r: +srgb[1] * 255, g: +srgb[2] * 255, b: +srgb[3] * 255, a: alpha(srgb[4]) };
  }
  return null;
}

function alpha(v: string | undefined): number {
  if (v === undefined) return 1;
  return v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v);
}

export type ContrastRating = "AAA" | "AA" | "AA large" | "Fail";

export function rateContrast(ratio: number): ContrastRating {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA large";
  return "Fail";
}
