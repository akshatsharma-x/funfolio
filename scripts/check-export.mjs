#!/usr/bin/env node
// Post-build tripwires for the static export (runs automatically after `npm run build`).
//   R1  — no raw "TODO", "undefined", "NaN" or "[object Object]" in any exported page's visible HTML
//   R10 — no third-party asset requests (scripts, styles, fonts, images, frames, CSS url()/@import)
//   §10 — initial JS for "/" stays under 250 KB gzip
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

for (const file of cssFiles) {
  const css = await readFile(file, "utf8");
  for (const re of [/url\(\s*["']?((?:https?:)?\/\/[^"')\s]+)/i, /@import\s+(?:url\()?\s*["']?((?:https?:)?\/\/[^"')\s]+)/i]) {
    const m = css.match(re);
    if (m) errors.push(`R10 ${rel(file)}: third-party url ${m[1]}`);
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
console.log(`✓ Export checks passed: ${htmlFiles.length} pages — R1 (no raw TODO/undefined/NaN), R10 (no third-party assets), §10 JS budget.`);
