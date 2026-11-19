// PART 17 · sitemap.xml at build time: the one page meant for search (the playgrounds are noindex). A sitemap needs
// absolute URLs, so it lists nothing until site.url is set (src/content/site.ts) — an empty, valid urlset.
import type { MetadataRoute } from "next";
import { siteUrl } from "@/content/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteUrl) return [];
  return [{ url: new URL("/", siteUrl).href, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
