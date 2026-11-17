// Quest Log (PART 8): everything the quest cards show, computed on the server from content.ts (R1). Nothing here may
// reach a client bundle (it imports content.ts and node:crypto).

import { createHash } from "node:crypto";
import type { SimpleIcon } from "simple-icons";
import { experience, projects, skills, type ItemType, type Stat } from "./content";
import { ITEM_META, ITEM_TYPES, known } from "./derived";
import { GAME_BY_ID } from "./games";
import { TECH_ICONS } from "./techIcons";

export type Quest = (typeof experience)[number];

export const activeQuest = (): Quest | null => experience.find((e) => e.current) ?? null;
/** Completed quests in content order — content.ts lists the roles newest first. */
export const completedQuests = (): Quest[] => experience.filter((e) => !e.current);

/** Work mode chip: only when known (a "Coming soon" chip would be noise; R1 never shows TODO). */
export const workMode = (q: Quest): string | null => (known(q.mode) ? q.mode : null);

// ── loot: stack items as game items ─────────────────────────────────────────────────────────────────────────────
const SKILL_TYPE = new Map<string, ItemType>(ITEM_TYPES.flatMap((t) => skills[t].items.map((item) => [item, t] as const)));

/** Anchor of a skill in the Skill Tree (World 6) — `#skill-<slug>`; PART 13 keeps the same ids. */
export const skillAnchor = (item: string): string =>
  `skill-${item
    .toLowerCase()
    .replace(/\+/g, "p")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

/** "Used in" evidence: every role and project whose stack lists the item (PART 13 reuses it). */
export const usedIn = (item: string): string[] => [
  ...experience.filter((e) => e.stack.includes(item)).map((e) => e.company),
  ...projects.filter((p) => p.stack.includes(item)).map((p) => p.title),
];

export type Loot = {
  name: string;
  /** Skill Tree item type (color + type line), or null when the item isn't in the Skill Tree. */
  type: ItemType | null;
  typeLine: string | null;
  anchor: string | null;
  logo: SimpleIcon | null;
  usedIn: string[];
};

const singular = (name: string) => name.replace(/s$/, "");

/** Any stack as loot (the Quest Log's roles, the Vault's cartridges). */
export const lootFor = (stack: readonly string[]): Loot[] =>
  stack.map((name) => {
    const type = SKILL_TYPE.get(name) ?? null;
    return {
      name,
      type,
      typeLine: type ? `${singular(ITEM_META[type].name)} · ${skills[type].label}` : null,
      anchor: type ? skillAnchor(name) : null,
      logo: TECH_ICONS[name] ?? null,
      usedIn: usedIn(name),
    };
  });

export const loot = (q: Quest): Loot[] => lootFor(q.stack);

/** Side quest button (a cartridge in the Arcade, PART 11), when the role has one. */
export const sideQuest = (q: Quest): { id: string; name: string } | null => {
  const game = q.sideQuest ? GAME_BY_ID[q.sideQuest] : undefined;
  return game ? { id: game.id, name: game.name } : null;
};

/** EY's stand-in for a side quest: a "Regulated env" stamp — only while its objectives say so (R1). */
export const regulated = (q: Quest): boolean => !q.sideQuest && q.bullets.some((b) => /\bregulated\b/i.test(b));


// ── the active quest's illustrative widgets ──────────────────────────────────────────────────────────────────────
// Each widget restates one stat of the current role, found by its label; the caption phrases must appear verbatim in
// its bullets. schema.ts fails the build when any of it stops matching content.ts.
export const ACTIVE_WIDGETS = {
  quest: "united",
  cost: "Inference cost",
  tokens: "Token compression",
  cache: "Eval scenarios",
  map: "Documentation artifacts",
  caption: ["6 documentation artifacts in 2 LLM calls", "35 eval scenarios"],
} as const;

export type ActiveWidgets = {
  cost: Stat;
  /** "$0.08" — the clickable part of the cost (coin #6) — and the rest of the value ("–0.11/run"). */
  coin: { head: string; tail: string } | null;
  tokens: Stat;
  /** Compression range in percent, e.g. [22, 25]. */
  squeeze: [number, number];
  cache: Stat;
  /** A real SHA-256 — of the objective that mentions the caching (decorative: no cache key is shown). */
  hash: string;
  map: Stat;
  /** "6 in 2 LLM calls" → 6 artifacts, 2 calls. */
  docs: number;
  calls: number;
  caption: string[];
};

function widgetsFor(q: Quest | null): ActiveWidgets | null {
  if (!q || q.id !== ACTIVE_WIDGETS.quest) return null;
  const stat = (label: string) => q.stats.find((s) => s.label === label) ?? null;
  const cost = stat(ACTIVE_WIDGETS.cost);
  const tokens = stat(ACTIVE_WIDGETS.tokens);
  const cache = stat(ACTIVE_WIDGETS.cache);
  const map = stat(ACTIVE_WIDGETS.map);
  const range = tokens?.value.match(/^(\d+)\s*[–-]\s*(\d+)\s*%$/);
  const counts = map?.value.match(/^(\d+)\D+(\d+)\b/);
  const hashed = q.bullets.find((b) => /SHA256/i.test(b));
  if (!cost || !tokens || !cache || !map || !range || !counts || !hashed) return null;
  const head = cost.value.match(/^\$\d+(?:\.\d+)?/)?.[0] ?? null;
  return {
    cost,
    coin: head ? { head, tail: cost.value.slice(head.length) } : null,
    tokens,
    squeeze: [Number(range[1]), Number(range[2])],
    cache,
    hash: createHash("sha256").update(hashed).digest("hex"),
    map,
    docs: Number(counts[1]),
    calls: Number(counts[2]),
    caption: ACTIVE_WIDGETS.caption.filter((p) => q.bullets.some((b) => b.includes(p))),
  };
}

export const activeWidgets = (): ActiveWidgets | null => widgetsFor(activeQuest());

/** Build check (schema.ts): why the widgets would be missing, or [] when they're fine. */
export function activeWidgetIssues(): string[] {
  const q = activeQuest();
  if (!q || q.id !== ACTIVE_WIDGETS.quest) return []; // a different current role: a plain active-quest card
  const issues: string[] = [];
  for (const label of [ACTIVE_WIDGETS.cost, ACTIVE_WIDGETS.tokens, ACTIVE_WIDGETS.cache, ACTIVE_WIDGETS.map]) {
    if (!q.stats.some((s) => s.label === label)) issues.push(`stat "${label}" is missing on ${q.id}`);
  }
  for (const phrase of ACTIVE_WIDGETS.caption) {
    if (!q.bullets.some((b) => b.includes(phrase))) issues.push(`caption phrase "${phrase}" is not in ${q.id}'s bullets`);
  }
  if (issues.length === 0 && !widgetsFor(q)) issues.push(`the ${q.id} stats no longer parse (cost "$…", compression "N–M%", artifacts "N … M")`);
  return issues;
}

// ── Cartographer: a tiny code knowledge graph (illustrative), laid out once on the server ──────────────────────────
export type GraphNode = { x: number; y: number; r: number; kind: "hub" | "module" | "leaf"; order: number };
export type GraphEdge = { a: number; b: number; order: number };

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let graphCache: { nodes: GraphNode[]; edges: GraphEdge[]; w: number; h: number } | null = null;

/** Fruchterman–Reingold on a fixed seed: deterministic, so the server HTML and every build agree. */
export function cartographerGraph() {
  if (graphCache) return graphCache;
  const W = 220;
  const H = 130;
  const rand = mulberry32(8);
  // a hub (the repo), 4 modules, 9 leaves (functions / classes), plus 4 cross-links
  const tree: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 5], [1, 6], [2, 7], [2, 8], [3, 9], [3, 10], [4, 11], [4, 12], [4, 13],
  ];
  const cross: [number, number][] = [[6, 7], [9, 2], [12, 3], [5, 11]];
  const links = [...tree, ...cross];
  const n = 14;
  const pos = Array.from({ length: n }, () => ({ x: W / 2 + (rand() - 0.5) * W * 0.6, y: H / 2 + (rand() - 0.5) * H * 0.6 }));
  const k = Math.sqrt((W * H) / n) * 0.62;
  for (let it = 0; it < 300; it++) {
    const temp = 9 * (1 - it / 300) + 0.3;
    const disp = pos.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i].x - pos[j].x;
        const dy = pos[i].y - pos[j].y;
        const d = Math.max(0.5, Math.hypot(dx, dy));
        const f = (k * k) / d;
        disp[i].x += (dx / d) * f;
        disp[i].y += (dy / d) * f;
        disp[j].x -= (dx / d) * f;
        disp[j].y -= (dy / d) * f;
      }
    for (const [a, b] of links) {
      const dx = pos[a].x - pos[b].x;
      const dy = pos[a].y - pos[b].y;
      const d = Math.max(0.5, Math.hypot(dx, dy));
      const f = (d * d) / k;
      disp[a].x -= (dx / d) * f;
      disp[a].y -= (dy / d) * f;
      disp[b].x += (dx / d) * f;
      disp[b].y += (dy / d) * f;
    }
    for (let i = 0; i < n; i++) {
      const d = Math.max(0.5, Math.hypot(disp[i].x, disp[i].y));
      pos[i].x = Math.min(W - 12, Math.max(12, pos[i].x + (disp[i].x / d) * Math.min(d, temp)));
      pos[i].y = Math.min(H - 12, Math.max(12, pos[i].y + (disp[i].y / d) * Math.min(d, temp)));
    }
  }
  // draw order: breadth-first from the hub, so the map "draws itself" outward
  const depth = new Array(n).fill(Infinity);
  depth[0] = 0;
  for (let changed = true; changed; ) {
    changed = false;
    for (const [a, b] of tree) {
      if (depth[a] + 1 < depth[b]) {
        depth[b] = depth[a] + 1;
        changed = true;
      }
    }
  }
  const nodes: GraphNode[] = pos.map((p, i) => ({
    x: Math.round(p.x * 10) / 10,
    y: Math.round(p.y * 10) / 10,
    r: i === 0 ? 9 : depth[i] === 1 ? 6 : 4,
    kind: i === 0 ? "hub" : depth[i] === 1 ? "module" : "leaf",
    order: depth[i],
  }));
  const edges: GraphEdge[] = links.map(([a, b], i) => ({ a, b, order: i < tree.length ? depth[b] : 3 }));
  graphCache = { nodes, edges, w: W, h: H };
  return graphCache;
}
