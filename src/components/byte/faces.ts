// BYTE's face sheet (PART 4): 8 moods + a blink frame, drawn on the CRT screen as a 16×10 pixel grid.
// "#" = --world (the screen glows in the current world's color) · "p" = pink (love) · "w" = white glint ·
// "d" = a "thinking" dot (animated one by one). Merged into one SVG path per color, like PixelIcon.

import type { ByteMood } from "@/lib/byte";

export const FACE_COLS = 16;
export const FACE_ROWS = 10;

const E = "................";

export const FACES: Record<ByteMood | "blink", readonly string[]> = {
  idle: [E, E, "....#......#....", "...###....###...", "...###....###...", "...###....###...", "....#......#....", E, E, E],
  blink: [E, E, E, E, E, "...###....###...", E, E, E, E],
  happy: [E, E, E, "....#......#....", "...#.#....#.#...", "..#...#..#...#..", E, "......####......", E, E],
  surprised: [E, "...###....###...", "..#...#..#...#..", "..#...#..#...#..", "..#...#..#...#..", "...###....###...", E, ".......##.......", E, E],
  love: [E, "...p.p....p.p...", "..ppppp..ppppp..", "..ppppp..ppppp..", "...ppp....ppp...", "....p......p....", E, E, E, E],
  sleepy: [E, E, E, E, E, "...###....###...", E, ".......##.......", E, E],
  dizzy: [E, "...###....###...", "..#...#..#...#..", "..#.###..#.###..", "..#.#.#..#.#.#..", "...###....###...", E, ".....##..##.....", E, E],
  cool: [E, E, ".##############.", ".#w###....#w###.", "..####....####..", "...##......##...", E, "........###.....", E, E],
  thinking: [E, ".....##.....##..", ".....##.....##..", E, E, E, E, "....d...d...d...", E, E],
};

const COLORS: Record<string, string> = { "#": "var(--world)", p: "#FF3D8B", w: "#FFFFFF" };

export type FacePart = { color: string; d: string };
export type Face = { parts: FacePart[]; dots: [number, number][] };

const cache = new Map<string, Face>();

/** Paths for one face (unit = 1 cell; the caller scales the group to the screen). */
export function faceFor(mood: ByteMood | "blink"): Face {
  const hit = cache.get(mood);
  if (hit) return hit;
  const rows = FACES[mood];
  const byColor = new Map<string, string[]>();
  const dots: [number, number][] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x += 1;
        continue;
      }
      if (ch === "d") {
        dots.push([x, y]);
        x += 1;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end += 1;
      const color = COLORS[ch] ?? COLORS["#"];
      const list = byColor.get(color) ?? [];
      list.push(`M${x} ${y}h${end - x}v1h-${end - x}z`);
      byColor.set(color, list);
      x = end;
    }
  });
  const face = { parts: [...byColor].map(([color, d]) => ({ color, d: d.join("") })), dots };
  cache.set(mood, face);
  return face;
}
