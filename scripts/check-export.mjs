#!/usr/bin/env node
// Post-build tripwires for the static export (runs automatically after `npm run build`).
//   R1  — no raw "TODO", "undefined", "NaN" or "[object Object]" in any exported page's visible HTML
//   R10 — no third-party asset requests (scripts, styles, fonts, images, frames, CSS url()/@import)
//   §10 — initial JS for "/" stays under 250 KB gzip
//   CSS — no @keyframes name defined twice with different bodies (names are global)
// Exits 1 on any violation so a bad build never ships.

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const OUT = join(process.cwd(), "out");
const BUDGET_KB = 250;
const errors = [];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const rel = (file) => relative(OUT, file);
const snippet = (text, index) => text.slice(Math.max(0, index - 50), index + 50).replace(/\s+/g, " ");

const htmlFiles = [];
const cssFiles = [];
try {
  for await (const file of walk(OUT)) {
    if (file.endsWith(".html")) htmlFiles.push(file);
    else if (file.endsWith(".css")) cssFiles.push(file);
  }
} catch {
  console.error("✗ check-export: out/ not found — run `npm run build` first.");
  process.exit(1);
}

// ── R1: visible HTML (scripts/styles/comments removed — the RSC payload may legitimately carry raw TODO props) ──
const FORBIDDEN = [/\bTODO\b/, /\bundefined\b/, /\bNaN\b/, /\[object Object\]/];
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const visible = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  for (const re of FORBIDDEN) {
    const m = re.exec(visible);
    if (m) errors.push(`R1  ${rel(file)}: "${m[0]}" → …${snippet(visible, m.index)}…`);
  }

  // ── R10: tags that would fetch from another origin ──
  for (const [tag] of html.matchAll(/<(?:script|link|img|source|iframe|video|audio|embed|object|track)\b[^>]*>/gi)) {
    if (/^<link/i.test(tag) && /\brel=["']?(?:canonical|alternate|me|author)\b/i.test(tag)) continue;
    const url = tag.match(/\b(?:src|href|srcset|data|poster)=["']?\s*((?:https?:)?\/\/[^"'\s>]+)/i);
    if (url) errors.push(`R10 ${rel(file)}: third-party asset ${url[1]}`);
  }
}

const cursorAssets = new Set();
for (const file of cssFiles) {
  const css = await readFile(file, "utf8");
  for (const re of [/url\(\s*["']?((?:https?:)?\/\/[^"')\s]+)/i, /@import\s+(?:url\()?\s*["']?((?:https?:)?\/\/[^"')\s]+)/i]) {
    const m = css.match(re);
    if (m) errors.push(`R10 ${rel(file)}: third-party url ${m[1]}`);
  }
  // R2 — the pointer may never be hidden, and every cursor image the CSS points at must exist
  const hidden = css.match(/cursor\s*:\s*none/i);
  if (hidden) errors.push(`R2  ${rel(file)}: hidden cursor (value none) → …${snippet(css, hidden.index)}…`);
  for (const [, url] of css.matchAll(/url\(\s*["']?(\/cursors\/[^"')\s?]+)/g)) cursorAssets.add(url);
}
for (const url of cursorAssets) {
  try {
    await readFile(join(OUT, url));
  } catch {
    errors.push(`R2  cursor asset missing from the export: ${url}`);
  }
}
if (cursorAssets.size === 0) errors.push("R2  no pixel cursor assets referenced by the CSS (did cursors.generated.css load?)");

// CSS — @keyframes names are global: two stylesheets defining one name differently means the one loaded last
// silently restyles the other's animations (PART 10: the boot's `crt-on` ends at opacity 0 and blanked the Vault's screens).
const keyframes = new Map();
for (const file of cssFiles) {
  const css = await readFile(file, "utf8");
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{/g)) {
    let depth = 1;
    let i = m.index + m[0].length;
    for (; depth > 0 && i < css.length; i++) depth += css[i] === "{" ? 1 : css[i] === "}" ? -1 : 0;
    const body = css.slice(m.index + m[0].length, i - 1);
    const seen = keyframes.get(m[1]);
    if (!seen) keyframes.set(m[1], { body, file });
    else if (seen.body !== body) errors.push(`CSS @keyframes ${m[1]} is defined twice, differently (${rel(seen.file)} · ${rel(file)}): the later one wins for both`);
  }
}

// ── §10: initial JS budget for the home page ──
const index = await readFile(join(OUT, "index.html"), "utf8");
// `noModule` scripts (legacy polyfills) are never downloaded by modern browsers, so they don't count.
const scripts = new Set(
  [...index.matchAll(/<script\b[^>]*>/gi)]
    .map(([tag]) => (/\bnomodule\b/i.test(tag) ? null : tag.match(/\bsrc="([^"]+)"/i)?.[1]))
    .filter((s) => typeof s === "string" && s.startsWith("/")),
);
let total = 0;
for (const src of scripts) {
  total += gzipSync(await readFile(join(OUT, decodeURIComponent(src.split("?")[0])))).length;
}
const kb = total / 1024;
console.log(`• Initial JS for "/": ${kb.toFixed(1)} KB gzip in ${scripts.size} files (budget ${BUDGET_KB} KB)`);
if (kb > BUDGET_KB) errors.push(`§10 initial JS ${kb.toFixed(1)} KB gzip exceeds ${BUDGET_KB} KB`);

if (errors.length > 0) {
  console.error(`\n✗ Export checks failed (${errors.length}):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`✓ Export checks passed: ${htmlFiles.length} pages — R1 (no raw TODO/undefined/NaN), R2 (no hidden cursor, ${cursorAssets.size} cursor assets present), R10 (no third-party assets), §10 JS budget, CSS (unique @keyframes).`);
