#!/usr/bin/env node
// Builds the native pixel cursors (PART 2, truth layer): `npm run cursors`
//   in : src/components/cursor/skins.ts (skins, sizes, variants) + cursor-art.ts (16×16 masks)
//   out: public/cursors/<skin>/<px>/<variant>.svg + .png   (SVG first in CSS, PNG fallback)
//        src/app/cursors.generated.css                     (--cur-<variant> per skin × size)
//        public/cursors/proof.png                          (every cursor over hard backgrounds, for QA)
// Every asset gets the dual outline: 1 art cell white, then 1 art cell black (2px each at 32px).

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { BASE_SHAPES, SHAPE_OVERRIDES } from "../src/components/cursor/cursor-art.ts";
import { CURSOR_SIZES, CURSOR_SKINS, CURSOR_VARIANTS } from "../src/components/cursor/skins.ts";

const OUT = "public/cursors";
const CSS_OUT = "src/app/cursors.generated.css";
const N = 16;
const BLACK = "#000000";
const WHITE = "#FFFFFF";

/** Mask → cells with the generated white (W) and black (K) rings. */
function outline(rows) {
  if (rows.length !== N || rows.some((r) => r.length !== N)) throw new Error("cursor masks must be 16×16");
  const at = (x, y) => (x >= 0 && y >= 0 && x < N && y < N ? rows[y][x] : ".");
  const grid = rows.map((r) => r.split(""));
  const near = (test, x, y) => [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => (dx || dy) && test(x + dx, y + dy)));
  const masked = (x, y) => at(x, y) !== ".";
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!masked(x, y) && near(masked, x, y)) grid[y][x] = "W";
  const solid = (x, y) => x >= 0 && y >= 0 && x < N && y < N && grid[y][x] !== ".";
  const snapshot = grid.map((r) => [...r]);
  const solidBefore = (x, y) => x >= 0 && y >= 0 && x < N && y < N && snapshot[y][x] !== ".";
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!solid(x, y) && near(solidBefore, x, y)) grid[y][x] = "K";
  // Masks must leave room: a masked/white cell on the border would lose its outer ring.
  for (let i = 0; i < N; i++) {
    for (const [x, y] of [[i, 0], [i, N - 1], [0, i], [N - 1, i]]) {
      if (snapshot[y][x] !== "." && snapshot[y][x] !== "K") throw new Error(`mask touches the edge at ${x},${y}`);
    }
  }
  return grid;
}

function colorOf(ch, y, palette) {
  switch (ch) {
    case "K":
    case "k":
      return BLACK;
    case "W":
    case "w":
      return WHITE;
    case "#":
      return Array.isArray(palette.fill) ? palette.fill[Math.floor(y / 2) % palette.fill.length] : palette.fill;
    case "h":
      return palette.highlight;
    case "s":
      return palette.shade;
    case "1":
    case "2":
    case "3":
      return palette.accents[Number(ch) - 1];
    case "x":
      return "#FF4D4D";
    default:
      throw new Error(`unknown cursor char "${ch}"`);
  }
}

function toSvg(grid, palette, size) {
  const byColor = new Map();
  grid.forEach((row, y) => {
    let x = 0;
    while (x < N) {
      if (row[x] === ".") {
        x += 1;
        continue;
      }
      const color = colorOf(row[x], y, palette);
      let end = x + 1;
      while (end < N && row[end] !== "." && colorOf(row[end], y, palette) === color) end += 1;
      byColor.set(color, (byColor.get(color) ?? "") + `M${x} ${y}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  });
  const paths = [...byColor].map(([c, d]) => `<path fill="${c}" d="${d}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges">${paths}</svg>\n`;
}

async function assertCrisp(png, label) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let soft = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] !== 0 && data[i] !== 255) soft += 1;
  if (soft > 0) throw new Error(`${label}: ${soft} semi-transparent pixels (expected crisp pixel art)`);
  return info;
}

await rm(OUT, { recursive: true, force: true });
const hash = createHash("sha1");
const files = [];
const pngs = new Map(); // `${skin}/${px}/${variant}` → png buffer

for (const skin of CURSOR_SKINS) {
  const overrides = skin.shapes ? SHAPE_OVERRIDES[skin.shapes] : {};
  for (const px of Object.values(CURSOR_SIZES)) {
    for (const variant of CURSOR_VARIANTS) {
      const rows = overrides[variant] ?? BASE_SHAPES[variant].rows;
      const svg = toSvg(outline(rows), skin.palette, px);
      const base = join(OUT, skin.id, String(px), variant);
      await mkdir(dirname(base), { recursive: true });
      await writeFile(`${base}.svg`, svg);
      const png = await sharp(Buffer.from(svg)).png({ palette: true, dither: 0, compressionLevel: 9 }).toBuffer();
      const info = await assertCrisp(png, `${skin.id}/${px}/${variant}`);
      if (info.width !== px || info.height !== px) throw new Error(`${base}.png is ${info.width}×${info.height}, expected ${px}`);
      await writeFile(`${base}.png`, png);
      hash.update(svg).update(png);
      pngs.set(`${skin.id}/${px}/${variant}`, png);
      files.push(base);
    }
  }
}

// ── CSS variables: one block per skin × size (the :root block = no-JS default) ──
const version = hash.digest("hex").slice(0, 8);
const blocks = [];
for (const skin of CURSOR_SKINS) {
  for (const [size, px] of Object.entries(CURSOR_SIZES)) {
    const scale = px / N;
    const vars = CURSOR_VARIANTS.map((variant) => {
      const [hx, hy] = BASE_SHAPES[variant].hotspot.map((v) => Math.min(px - 1, Math.floor(v * scale)));
      const url = (ext) => `url("/cursors/${skin.id}/${px}/${variant}.${ext}?v=${version}") ${hx} ${hy}`;
      return `  --cur-${variant}: ${url("svg")}, ${url("png")};`;
    });
    const selector = `html[data-cursor-skin="${skin.id}"][data-cursor-size="${size}"]`;
    const isDefault = skin.id === CURSOR_SKINS[0].id && size === "normal";
    blocks.push(`${isDefault ? ":root,\n" : ""}${selector} {\n${vars.join("\n")}\n}`);
  }
}
await writeFile(
  CSS_OUT,
  `/* GENERATED by scripts/build-cursors.mjs — do not edit (npm run cursors). Cache key ${version}.\n   ${CURSOR_SKINS.length} skins × ${Object.keys(CURSOR_SIZES).length} sizes × ${CURSOR_VARIANTS.length} variants. Rules that use these live in src/app/cursors.css. */\n\n${blocks.join("\n\n")}\n`,
);

// ── Proof sheet: Pixel Pop over hard backgrounds, then every skin on mid-gray ──
const T = 48;
const swatch = (fill) => `<rect width="${T}" height="${T}" fill="${fill}"/>`;
const BACKGROUNDS = [
  swatch("#000000"), swatch("#FFFFFF"), swatch("#808080"), swatch("#0E0B1E"), swatch("#FFF4E0"),
  ...["#FF3D8B", "#22D3EE", "#B6FF3B", "#FFD23F", "#FF8A1F", "#8B5CF6", "#2EE59D", "#FF4D4D", "#FFC83D"].map(swatch),
  // checkerboard + rainbow stripes + a soft "3D" gradient stand-in (illustrative)
  `${swatch("#FFFFFF")}${[0, 1, 2, 3, 4, 5].flatMap((y) => [0, 1, 2, 3, 4, 5].map((x) => ((x + y) % 2 ? `<rect x="${x * 8}" y="${y * 8}" width="8" height="8" fill="#000"/>` : ""))).join("")}`,
  ["#FF3D8B", "#FF8A1F", "#FFD23F", "#B6FF3B", "#22D3EE", "#A78BFA"].map((c, i) => `<rect x="${i * 8}" width="8" height="${T}" fill="${c}"/>`).join(""),
  `<defs><radialGradient id="g" cx="35%" cy="30%"><stop offset="0" stop-color="#FFF1A8"/><stop offset=".5" stop-color="#8B5CF6"/><stop offset="1" stop-color="#07060F"/></radialGradient></defs><rect width="${T}" height="${T}" fill="url(#g)"/>`,
];
const rowsA = BACKGROUNDS.length;
const cols = CURSOR_VARIANTS.length;
const width = cols * T;
const height = (rowsA + CURSOR_SKINS.length) * T;
const tiles = [];
const tile = async (svgInner) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${T}" height="${T}">${svgInner}</svg>`)).png().toBuffer();
for (let r = 0; r < rowsA; r++) {
  const bg = await tile(BACKGROUNDS[r]);
  CURSOR_VARIANTS.forEach((variant, c) => {
    tiles.push({ input: bg, left: c * T, top: r * T });
    tiles.push({ input: pngs.get(`${CURSOR_SKINS[0].id}/32/${variant}`), left: c * T + 8, top: r * T + 8 });
  });
}
const gray = await tile(swatch("#808080"));
CURSOR_SKINS.forEach((skin, i) => {
  CURSOR_VARIANTS.forEach((variant, c) => {
    tiles.push({ input: gray, left: c * T, top: (rowsA + i) * T });
    tiles.push({ input: pngs.get(`${skin.id}/32/${variant}`), left: c * T + 8, top: (rowsA + i) * T + 8 });
  });
});
await sharp({ create: { width, height, channels: 4, background: "#00000000" } }).composite(tiles).png().toFile(join(OUT, "proof.png"));

const bytes = (await Promise.all(files.flatMap((f) => [readFile(`${f}.svg`), readFile(`${f}.png`)]))).reduce((n, b) => n + b.length, 0);
console.log(
  `✓ ${files.length} cursors × (svg + png) · ${CURSOR_SKINS.length} skins × ${Object.keys(CURSOR_SIZES).length} sizes · ${(bytes / 1024).toFixed(1)} KB · all crisp · key ${version}\n  → ${OUT}/ · ${CSS_OUT} · ${OUT}/proof.png`,
);
