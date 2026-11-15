// Build-time file checks. Server components only (runs during `next build`; never bundled for the client).

import { existsSync } from "node:fs";
import { join } from "node:path";

const PUBLIC_DIR = join(process.cwd(), "public");

/** True when a root-relative URL path (e.g. "/resume/x.pdf") exists in public/. Lets missing files render "Coming soon". */
export function publicFileExists(urlPath: string): boolean {
  if (!urlPath.startsWith("/") || urlPath.includes("..")) return false;
  return existsSync(join(PUBLIC_DIR, decodeURIComponent(urlPath)));
}
