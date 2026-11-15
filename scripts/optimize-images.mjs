#!/usr/bin/env node
// Pre-builds responsive AVIF + WebP variants, because a static export has no image optimizer at runtime (R10).
//   in : assets/images/**/*.{jpg,jpeg,png}
//   out: public/img/<path>/<name>-<width>.{avif,webp}
//        src/content/images.generated.json  → { "<path>/<name>": { width, height, widths: [...] } } (for width/height → no CLS)
// Unchanged sources are skipped. Run: `npm run images`.

import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import sharp from "sharp";

const SRC = "assets/images";
const OUT = "public/img";
const MANIFEST = "src/content/images.generated.json";
const WIDTHS = [480, 960, 1440, 1920];

async function* walk(dir) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(jpe?g|png)$/i.test(entry.name)) yield full;
  }
}

async function isFresh(output, sourceMtime) {
  try {
    return (await stat(output)).mtimeMs >= sourceMtime;
  } catch {
    return false;
  }
}

const manifest = {};
let written = 0;
let sources = 0;

for await (const file of walk(SRC)) {
  sources += 1;
  const key = relative(SRC, file).slice(0, -extname(file).length);
  const { width = 0, height = 0 } = await sharp(file).metadata();
  const widths = [...new Set([...WIDTHS.filter((w) => w < width), Math.min(width, WIDTHS.at(-1))])].sort((a, b) => a - b);
  const sourceMtime = (await stat(file)).mtimeMs;
  await mkdir(dirname(join(OUT, key)), { recursive: true });

  for (const w of widths) {
    const base = join(OUT, `${key}-${w}`);
    if (!(await isFresh(`${base}.avif`, sourceMtime))) {
      await sharp(file).resize({ width: w }).avif({ quality: 55, effort: 5 }).toFile(`${base}.avif`);
      written += 1;
    }
    if (!(await isFresh(`${base}.webp`, sourceMtime))) {
      await sharp(file).resize({ width: w }).webp({ quality: 78 }).toFile(`${base}.webp`);
      written += 1;
    }
  }
  manifest[key] = { width, height, widths };
}

if (sources === 0) {
  console.log(`No source images in ${SRC}/ yet — nothing to do.`);
} else {
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`✓ ${sources} source image(s) → ${written} new variant file(s) in ${OUT}/ · manifest: ${MANIFEST}`);
}
