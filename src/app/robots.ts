// PART 17 · robots.txt at build time. Everything may be crawled; /playground keeps itself out with a noindex meta tag,
// never a Disallow (that would hide the noindex from crawlers — DECISIONS #15). The sitemap line once site.url exists.
import type { MetadataRoute } from "next";
import { siteUrl } from "@/content/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, ...(siteUrl ? { sitemap: new URL("/sitemap.xml", siteUrl).href } : {}) };
}
