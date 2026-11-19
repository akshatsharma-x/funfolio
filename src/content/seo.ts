// PART 17 · structured data for search (JSON-LD Person), built from content.ts (R1). Absolute URLs only when site.url
// is known (src/content/site.ts) — nothing is invented while the domain is "TODO".
import { education, experience, player } from "./content";
import { site, siteUrl } from "./site";

export function personJsonLd() {
  const now = experience.find((e) => e.current);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: player.name,
    ...(siteUrl ? { url: siteUrl.href } : {}),
    ...(now ? { jobTitle: now.role, worksFor: { "@type": "Organization", name: now.company } } : {}),
    alumniOf: { "@type": "CollegeOrUniversity", name: education.school },
    sameAs: [player.links.linkedin, player.links.github],
    description: site.description,
  };
}

/** JSON for a <script type="application/ld+json">: "<" is escaped, so no content can ever close the tag. */
export const jsonLd = (data: unknown): string => JSON.stringify(data).replace(/</g, "\\u003c");
