// Cartridge Vault (PART 10): every cartridge and its console screens, computed from content.ts on the server (R1).

import { projects, type ProjectCategory, type Stat } from "./content";
import { ITEM_META, known } from "./derived";
import { GAME_BY_ID } from "./games";
import { lootFor, type Loot } from "./quests";

export type Project = (typeof projects)[number];

/** Filter tabs from the brief — each a content category; a tab shows only while some project has it. */
const TABS: readonly { id: "all" | ProjectCategory; label: string; plain: string }[] = [
  { id: "all", label: "All", plain: "every project" },
  { id: "ai", label: "AI/ML", plain: "AI & ML projects" },
  { id: "fullstack", label: "Full-Stack", plain: "full-stack projects" },
  { id: "tools", label: "Tools", plain: "developer tools" },
];
export const vaultTabs = () => TABS.filter((t) => t.id === "all" || projects.some((p) => p.category === t.id));

/** Label monograms (game labels, like the Quest Log's guild emblems); anything new falls back to its initials. */
const CODES: Readonly<Record<string, string>> = {
  quizmuj: "QZ",
  "resume-screener": "RS",
  churn: "CH",
  "a11y-analyzer": "WA",
  nexus: "NX",
  researchx: "RX",
  "bbc-news-retrieval": "BN",
  vistara: "VS",
  cabinmuj: "CM",
  myhub: "MH",
};
const initials = (title: string) =>
  title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** Pink leads every label (R8); the category tints the gradient's far end. */
const TINT: Readonly<Record<ProjectCategory, string>> = { ai: "#A78BFA", fullstack: "#FF8A1F", tools: "#22D3EE" };
const PATTERNS = ["dots", "grid", "zigzag", "stripes", "checker"] as const;

/** A stat drawn as a bar only when its value is a proportion: "97%" → 97 · "0.98" → 98. Otherwise just the value. */
export function statBar(value: string): number | null {
  const pct = value.match(/^(\d+(?:\.\d+)?)\s*%$/);
  if (pct) return Math.min(100, Number(pct[1]));
  const ratio = value.match(/^(0?\.\d+|1(?:\.0+)?)$/);
  return ratio ? Math.round(Number(ratio[1]) * 100) : null;
}

export type SideQuest =
  | { kind: "game"; id: string; name: string }
  | { kind: "hint"; text: string }
  | { kind: "scan" };

function sideQuestOf(p: Project): SideQuest | null {
  if (p.sideQuest === "a11y-scan") return { kind: "scan" };
  if (p.sideQuest === "tab-switch-egg") return { kind: "hint", text: "Try switching tabs 😉" };
  const game = p.sideQuest ? GAME_BY_ID[p.sideQuest] : undefined;
  return game ? { kind: "game", id: game.id, name: game.name } : null;
}

export type Cartridge = {
  id: string;
  project: Project;
  code: string;
  category: ProjectCategory;
  from: string;
  to: string;
  pattern: (typeof PATTERNS)[number];
  /** One dot per stack item, in its Skill Tree item-type color (grey when the tree doesn't list it). */
  dots: { tone: string | null; name: string }[];
  story: string | null;
  abilities: string[];
  stats: (Stat & { bar: number | null })[];
  loot: Loot[];
  demo: string | null;
  repo: string | null;
  side: SideQuest | null;
};

export const cartridges = (): Cartridge[] =>
  projects.map((p, i) => {
    const loot = lootFor(p.stack);
    return {
      id: p.id,
      project: p,
      code: CODES[p.id] ?? initials(p.title),
      category: p.category,
      from: "#FF3D8B",
      to: TINT[p.category],
      pattern: PATTERNS[i % PATTERNS.length],
      dots: loot.map((l) => ({ tone: l.type ? ITEM_META[l.type].tone : null, name: l.name })),
      story: p.bullets[0] ?? null,
      abilities: p.bullets.slice(1),
      stats: p.stats.map((s) => ({ ...s, bar: statBar(s.value) })),
      loot,
      demo: known(p.links.demo) ? p.links.demo : null,
      repo: known(p.links.repo) ? p.links.repo : null,
      side: sideQuestOf(p),
    };
  });

export const cartridgeIds = (): string[] => projects.map((p) => p.id);

/** Build check (schema.ts): game side quests must exist in games.ts. */
export const vaultIssues = (): string[] =>
  projects.filter((p) => p.sideQuest && !["a11y-scan", "tab-switch-egg"].includes(p.sideQuest) && !GAME_BY_ID[p.sideQuest]).map((p) => `side quest "${p.sideQuest}" (${p.id}) is not in src/content/games.ts`);
