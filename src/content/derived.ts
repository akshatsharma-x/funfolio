// Values computed from content.ts (Bible §11: "Computed everywhere, never hard-coded").
// Nothing here is a new fact — only counts, lookups and display helpers.

import {
  certificates,
  experience,
  honors,
  projects,
  research,
  skills,
  type HighlightRef,
  type ItemType,
  type ProjectCategory,
} from "./content";

export const TODO = "TODO";

/** True for "TODO", empty or whitespace — anything that must render as "Coming soon" (R1). */
export function isTodo(value: string | null | undefined): boolean {
  if (value == null) return true;
  const v = value.trim();
  return v === "" || v.toUpperCase() === TODO;
}

/** Type guard for a real, displayable value. */
export function known(value: string | null | undefined): value is string {
  return !isTodo(value);
}

export const ITEM_TYPES: readonly ItemType[] = ["weapons", "spells", "gear", "gadgets", "runes"];

/** Tone names match the .tone-* / [data-tone] rules in globals.css. */
export type Tone = "pink" | "cyan" | "lime" | "yellow" | "orange" | "violet" | "mint" | "red" | "gold";

/** Bible §3 item types → game name, color and pixel icon. */
export const ITEM_META: Readonly<Record<ItemType, { name: string; tone: Tone; icon: "sword" | "sparkle" | "gear" | "controller" | "scroll" }>> = {
  weapons: { name: "Weapons", tone: "pink", icon: "sword" },
  spells: { name: "Spells", tone: "violet", icon: "sparkle" },
  gear: { name: "Gear", tone: "cyan", icon: "gear" },
  gadgets: { name: "Gadgets", tone: "orange", icon: "controller" },
  runes: { name: "Runes", tone: "mint", icon: "scroll" },
};

export const CATEGORY_LABEL: Readonly<Record<ProjectCategory, string>> = {
  ai: "AI & ML",
  fullstack: "Full-Stack",
  tools: "Developer Tools",
};

const allSkills = ITEM_TYPES.flatMap((t) => skills[t].items);

export const counts = {
  internships: experience.filter((e) => /\bintern\b/i.test(e.role)).length,
  experiences: experience.length,
  projects: projects.length,
  papers: research.length,
  skills: new Set(allSkills).size,
  honors: honors.length,
  certificates: certificates.length,
} as const;

export type ResolvedStat = { value: string; label: string; context: string };

/** Resolves a Speedrun highlight reference to the real fact, or null if it no longer exists (schema.ts fails the build). */
export function resolveHighlight(ref: HighlightRef): ResolvedStat | null {
  if (ref.from === "honor") {
    const h = honors.find((x) => x.id === ref.id);
    return h ? { value: h.title, label: h.org, context: h.year } : null;
  }
  const owner = ref.from === "experience" ? experience.find((x) => x.id === ref.id) : projects.find((x) => x.id === ref.id);
  const stat = owner?.stats.find((s) => s.label === ref.stat);
  if (!owner || !stat) return null;
  return { value: stat.value, label: stat.label, context: "company" in owner ? owner.company : owner.title };
}
