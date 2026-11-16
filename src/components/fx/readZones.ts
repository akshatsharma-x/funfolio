// Reading zones (R6): the elements that carry text people read. Click juice stays silent near them (READ), and
// celebration confetti is masked out of every box with words on it (TEXT), so it falls behind the words, not over them.

export const READ = "p, li, dd, dt, h1, h2, h3, h4, h5, h6, blockquote, figcaption, td, th, pre, label, legend, .read, [data-read]";

/** Everything with words on it — reading text plus labelled controls. Celebrations stay off all of it (R6). */
export const TEXT = `${READ}, a, button, summary, select, input, textarea, [role="button"]`;

export type Zone = { x: number; y: number; w: number; h: number };

/** On-screen boxes of text (CSS px, padded). Measures layout, so call it at most once per frame. */
export function readZoneRects(selector = TEXT, pad = 6): Zone[] {
  const out: Zone[] = [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    const r = el.getBoundingClientRect();
    if (r.width < 3 || r.height < 3) continue; // hidden, or a screen-reader-only copy
    if (r.bottom < -pad || r.top > vh + pad || r.right < -pad || r.left > vw + pad) continue;
    out.push({ x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 });
  }
  return out;
}
