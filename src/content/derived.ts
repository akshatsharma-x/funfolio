// Values computed from content.ts (Bible §11: "Computed everywhere, never hard-coded").
// Nothing here is a new fact — only counts, lookups and display helpers.

import {
  certificates,
  education,
  experience,
  honors,
  player,
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

// ── LED ticker dividers (PART 4): every item is computed from content.ts; unknown values are simply left out ──────

export type TickerSet = "start" | "quests" | "lab" | "vault" | "arcade" | "skills" | "trophies" | "lobby" | "credits";

const venueCode = () => {
  const codes = [...new Set(research.map((r) => r.venue.match(/\b[A-Z]{2,}-\d{4}\b/)?.[0]).filter(known))];
  return codes.length === 1 ? codes[0] : null;
};
/** "Smart India Hackathon — Qualifier" + "2024 & 2025" → "SIH Qualifier ×2". */
const honorShort = (id: string) => {
  const h = honors.find((x) => x.id === id);
  if (!h) return null;
  const [name, rank] = h.title.split(" — ");
  const words = name.split(/\s+/);
  const short = words.length >= 3 ? words.map((w) => w[0]).join("").toUpperCase() : name;
  const years = h.year.split(/&|,/).map((y) => y.trim()).filter(Boolean).length;
  return `${short}${rank ? ` ${rank}` : ""}${years > 1 ? ` ×${years}` : ""}`;
};

export function tickerItems(set: TickerSet): string[] {
  const current = experience.find((e) => e.current);
  const code = venueCode();
  const items: (string | null | undefined)[] = (() => {
    switch (set) {
      case "start":
        return [
          `${counts.internships} internships`,
          `${counts.papers} papers${code ? ` @ ${code}` : ""}`,
          `${counts.projects} projects`,
          honorShort("sih"),
          known(education.cgpa) ? `CGPA ${education.cgpa.split("/")[0]}` : null,
          current ? `Now: ${current.company}` : null,
        ];
      case "quests":
        return [...experience.map((e) => e.company), `${counts.internships} internships`];
      case "lab":
        return [
          `${counts.papers} papers ${research.every((r) => r.status === research[0]?.status) ? research[0]?.status.toLowerCase() : ""}`.trim(),
          code,
          ...research.map((r) => `Boss: ${r.boss.name}`),
          ...research.map((r) => r.boss.domain),
        ];
      case "vault":
        return [...projects.map((p) => p.title), `${counts.projects} cartridges`];
      case "arcade":
        return ["Bonus stage", "Insert coin", "Press start", "High score: you"];
      case "skills":
        return [`${counts.skills} skills`, ...ITEM_TYPES.map((t) => `${ITEM_META[t].name} · ${skills[t].label}`)];
      case "trophies":
        return [...honors.map((h) => `${h.title} · ${h.year}`), counts.certificates ? `${counts.certificates} certificates` : null];
      case "lobby":
        return ["Co-op lobby", "Say hi", player.email, "LinkedIn", "GitHub"];
      case "credits":
        return ["Thanks for playing", "GG", "No trackers · no cookies"];
    }
  })();
  return items.filter((v): v is string => typeof v === "string" && known(v) && !/\bTODO\b/i.test(v));
}
