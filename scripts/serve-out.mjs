#!/usr/bin/env node
// Zero-dependency static server for previewing the export: `npm run preview` → http://localhost:4173
// Mirrors a plain static host: /route/ → out/route/index.html, unknown paths → out/404.html (status 404) — and, like
// Vercel / Netlify / Cloudflare Pages / GitHub Pages, compresses text (brotli or gzip) and caches the hashed
// /_next/static/ files for a year (PART 17: Lighthouse runs against this, so it should behave like the real thing).

import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const ROOT = join(process.cwd(), "out");
const PORT = Number(process.argv[2] ?? 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".webmanifest": "application/manifest+json",
};
const TEXT = new Set([".html", ".js", ".css", ".json", ".txt", ".xml", ".svg", ".webmanifest"]);

// PART 18 · out/_headers (public/_headers), applied the way Netlify and Cloudflare Pages do: every block whose path
// pattern matches (`*` = anything) adds its headers — so the preview and the tests run under the production CSP.
async function loadHeaderRules() {
  try {
    const rules = [];
    let cur = null;
    for (const line of (await readFile(join(ROOT, "_headers"), "utf8")).split("\n")) {
      if (!line.trim() || line.trimStart().startsWith("#")) continue;
      if (!/^\s/.test(line)) {
        cur = { re: new RegExp(`^${line.trim().replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`), headers: [] };
        rules.push(cur);
      } else if (cur) {
        const i = line.indexOf(":");
        if (i > 0) cur.headers.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
      }
    }
    return rules;
  } catch {
    return [];
  }
}
let headerRules = await loadHeaderRules();
let headerRulesAt = Date.now();
const packed = new Map(); // file|encoding → compressed bytes (the export doesn't change while serving)

async function resolveFile(urlPath) {
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const candidates = safe.endsWith("/") ? [join(ROOT, safe, "index.html")] : [join(ROOT, safe), join(ROOT, safe, "index.html"), join(ROOT, `${safe}.html`)];
  for (const file of candidates) {
    try {
      if ((await stat(file)).isFile()) return file;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    const file = await resolveFile(pathname);
    const target = file ?? join(ROOT, "404.html");
    const ext = extname(target);
    const headers = { "Content-Type": TYPES[ext] ?? "application/octet-stream", Vary: "Accept-Encoding" };
    headers["Cache-Control"] = pathname.startsWith("/_next/static/") ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate";
    if (Date.now() - headerRulesAt > 2000) {
      headerRules = await loadHeaderRules(); // a rebuild may have changed them
      headerRulesAt = Date.now();
    }
    for (const rule of headerRules) if (rule.re.test(pathname)) for (const [k, v] of rule.headers) headers[k] = v;
    let body = await readFile(target);
    const accept = String(req.headers["accept-encoding"] ?? "");
    if (TEXT.has(ext) && body.length > 1024) {
      const enc = /\bbr\b/.test(accept) ? "br" : /\bgzip\b/.test(accept) ? "gzip" : null;
      if (enc) {
        const st = await stat(target);
        const key = `${target}|${st.mtimeMs}|${st.size}|${enc}`; // a rebuild changes the file — never serve stale bytes
        let z = packed.get(key);
        if (!z) {
          z = enc === "br" ? brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 9 } }) : gzipSync(body, { level: 9 });
          packed.set(key, z);
        }
        body = z;
        headers["Content-Encoding"] = enc;
      }
    }
    headers["Content-Length"] = String(body.length);
    res.writeHead(file ? 200 : 404, headers);
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(500);
    res.end("Server error");
  }
}).listen(PORT, () => console.log(`Serving out/ at http://localhost:${PORT}`));
