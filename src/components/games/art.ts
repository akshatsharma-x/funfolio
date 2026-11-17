// The arcade's marquee logos (PART 11): original 16×12 pixel emblems (R4), one per cabinet. Same format as the UI kit's
// pixel icons: one string per row, one char per pixel, "." transparent, "k" ink. Written as left halves and mirrored,
// so every emblem is symmetric. Shared by the server-rendered cabinets and the (client) game shell's title card.

export type PixelArtDef = { rows: readonly string[]; palette: Readonly<Record<string, string>> };

const INK = "#07060F";
const mirror = (halves: readonly string[]): string[] => halves.map((h) => h + [...h].reverse().join(""));

export const EMBLEMS: Readonly<Record<string, PixelArtDef>> = {
  // two arrows squeezing a word tile thin
  "token-squeeze": {
    palette: { k: INK, a: "#FF3D8B", w: "#FFF4E0" },
    rows: mirror(["........", "........", ".k......", ".kk.....", ".kak..kk", ".kaak.kw", ".kaaakkw", ".kaak.kw", ".kak..kk", ".kk.....", ".k......", "........"]),
  },
  // two identical cards with a hash mark, linked: a cache hit
  "cache-hit": {
    palette: { k: INK, c: "#FFF4E0", b: "#A78BFA", d: "#22D3EE" },
    rows: mirror(["........", ".kkkkkk.", ".kcccck.", ".kcbbck.", ".kbccbkd", ".kcbbckd", ".kbccbk.", ".kcccck.", ".kkkkkk.", "........", "........", "........"]),
  },
  // a glitch-bug: antennae, eyes, legs
  "bug-whack": {
    palette: { k: INK, a: "#FF4D4D", b: "#FFD23F", w: "#FFF4E0" },
    rows: mirror(["..k.....", "...k....", "....kkkk", "...kawaa", "k..kaaaa", ".kkkbbbb", "...kbbbb", "kkkkbbbb", "...kbbbb", "....kkkk", "........", "........"]),
  },
  // a glowing chunk falling into the retriever's basket
  "rag-catcher": {
    palette: { k: INK, d: "#22D3EE", a: "#FF3D8B" },
    rows: mirror(["........", "......kk", "......kd", "......kd", "......kk", "........", "..k.....", "..kk....", "..kakkkk", "...kaaaa", "....kkkk", "........"]),
  },
  // a pipe with data packets flowing through it
  pipeline: {
    palette: { k: INK, a: "#B6FF3B", e: "#FF8A1F" },
    rows: mirror(["........", ".kkk....", ".kak....", ".kak....", ".kak....", ".kakkkkk", ".kaaeaaa", ".kkkkkkk", "........", "........", "........", "........"]),
  },
  // a ball resting at the bottom of a loss valley
  "gradient-descent": {
    palette: { k: "#A78BFA", b: "#FFD23F" },
    rows: mirror(["........", "k.......", "k.......", ".k......", ".k......", "..k.....", "...k....", "....k..b", ".....kkk", "........", "........", "........"]),
  },
};

/** Run-length merge per color → one <path> per palette entry (a few dozen rects become ≤ 4 paths). */
export function pixelPaths(def: PixelArtDef): { d: string; fill: string }[] {
  const by = new Map<string, string[]>();
  def.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) run++;
      if (ch !== "." && def.palette[ch]) {
        const list = by.get(ch) ?? [];
        list.push(`M${x} ${y}h${run}v1h-${run}z`);
        by.set(ch, list);
      }
      x += run;
    }
  });
  return [...by].map(([ch, d]) => ({ d: d.join(""), fill: def.palette[ch] }));
}
