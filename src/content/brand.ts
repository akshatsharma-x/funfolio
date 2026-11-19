// PART 17 · the site's mark: BYTE's head as 16×16 pixel art (original, R4) — the favicon (src/app/icon.svg), the Apple
// touch icon and the OG character card all draw it from here. "." = transparent.

export const BYTE_HEAD_ROWS = [
  "......aa........",
  "......aa........",
  ".......k........",
  "..kkkkkkkkkkkk..",
  ".kssssssssssssk.",
  ".ksddddddddddsk.",
  ".ksdeeddddeedsk.",
  ".ksdeeddddeedsk.",
  ".ksddddddddddsk.",
  ".ksdddeeeedddsk.",
  ".ksddddddddddsk.",
  ".kssssssssssssk.",
  "..kkkkkkkkkkkk..",
  "......kkkk......",
  "....kkssssk.....",
  "....kkkkkkk.....",
] as const;

export const BYTE_HEAD_PALETTE: Readonly<Record<string, string>> = {
  k: "#07060F", // ink
  s: "#FFF4E0", // shell
  d: "#120F26", // screen
  e: "#2EE59D", // eyes (mint)
  a: "#FFC83D", // antenna bulb (coin gold)
};

/** One <rect> per run of same-coloured pixels. */
export function pixelRects(rows: readonly string[], palette: Readonly<Record<string, string>>, size = 1, ox = 0, oy = 0): { x: number; y: number; w: number; h: number; fill: string }[] {
  const out: { x: number; y: number; w: number; h: number; fill: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === "." || !palette[ch]) {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      out.push({ x: ox + x * size, y: oy + y * size, w: (end - x) * size, h: size, fill: palette[ch] });
      x = end;
    }
  });
  return out;
}

export function byteHeadSvg(): string {
  const rects = pixelRects(BYTE_HEAD_ROWS, BYTE_HEAD_PALETTE)
    .map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${rects}</svg>`;
}

/** A 5×7 pixel font (A–Z), for the OG card's name — drawn as rects, so no font file is needed. */
export const PIXEL_FONT: Readonly<Record<string, readonly string[]>> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "#..#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
};

/** The palette stripe (Bible §3): pink, orange, yellow, lime, mint, cyan, violet. */
export const RAINBOW = ["#FF3D8B", "#FF8A1F", "#FFD23F", "#B6FF3B", "#2EE59D", "#22D3EE", "#A78BFA"] as const;
