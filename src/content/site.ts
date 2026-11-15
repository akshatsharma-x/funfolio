// Site-level metadata, composed from content.ts so it never drifts from the facts.

import { education, player } from "./content";
import { known } from "./derived";

export const site = {
  /** Canonical origin, e.g. "https://example.dev" — set once the domain exists (prompts.md Appendix A). */
  url: "TODO",
  name: `${player.handle} — The Funfolio`,
  title: `${player.name} — Funfolio · ${player.classes[0]} & ${player.classes[2]}`,
  description: `${player.tagline} ${player.name} — ${player.status}. ${education.degree}, ${education.school}.`,
};

/** `URL` for metadataBase, or undefined while the domain is unknown. */
export const siteUrl: URL | undefined = known(site.url) ? new URL(site.url) : undefined;
