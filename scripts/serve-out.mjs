#!/usr/bin/env node
// Zero-dependency static server for previewing the export: `npm run preview` → http://localhost:4173
// Mirrors a plain static host: /route/ → out/route/index.html, unknown paths → out/404.html (status 404).

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const ROOT = join(process.cwd(), "out");
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};

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
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  const file = await resolveFile(pathname);
  const target = file ?? join(ROOT, "404.html");
  res.writeHead(file ? 200 : 404, { "Content-Type": TYPES[extname(target)] ?? "application/octet-stream" });
  createReadStream(target).on("error", () => res.end("Not found")).pipe(res);
}).listen(PORT, () => console.log(`Serving out/ at http://localhost:${PORT}`));
