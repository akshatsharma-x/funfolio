// The Arcade's real-work map (PART 11): which résumé line every game is based on, the target it borrows from the real
// result, and the "That's real:" line its results screen shows — every piece assembled from content.ts values and
// checked against the bullets they restate (schema.ts fails the build when evidence disappears, R1). Server-only: the
// game runtime receives `buildArcadeData()` as a prop (layout → GameRuntimeLoader), so content.ts never reaches a client
// chunk. Game copy (prompts, code snippets, how-tos) lives with each game in src/components/games/.

import { createHash } from "node:crypto";
import { experience, projects } from "./content";
import { ITEM_META, type Tone } from "./derived";
import { ARCADE_IDS, GAME_BY_ID } from "./games";
import { lootFor } from "./quests";
import { TECH_ICONS } from "./techIcons";

type Entry = { kind: "experience" | "project"; id: string; label: string; bullets: readonly string[]; stats: readonly { label: string; value: string }[] };

const entry = (kind: Entry["kind"], id: string): Entry | null => {
  if (kind === "experience") {
    const e = experience.find((x) => x.id === id);
    return e ? { kind, id, label: e.company, bullets: e.bullets, stats: e.stats } : null;
  }
  const p = projects.find((x) => x.id === id);
  return p ? { kind, id, label: p.title, bullets: p.bullets, stats: p.stats } : null;
};
const stat = (e: Entry | null, label: string) => e?.stats.find((s) => s.label === label)?.value ?? null;
const says = (e: Entry | null, ...fragments: (string | null)[]) =>
  !!e && fragments.every((f) => f !== null && e.bullets.some((b) => b.toLowerCase().includes(f.toLowerCase())));

/** What each cabinet is based on: a résumé entry and a phrase that appears in its bullets. */
const BASED_ON: Readonly<Record<string, { kind: Entry["kind"]; id: string; topic: string }>> = {
  "token-squeeze": { kind: "experience", id: "united", topic: "token compression" },
  "cache-hit": { kind: "experience", id: "united", topic: "SHA256 caching" },
  "bug-whack": { kind: "experience", id: "truechip", topic: "debugging" },
  "rag-catcher": { kind: "project", id: "researchx", topic: "multi-agent research" },
  pipeline: { kind: "experience", id: "walkingtree", topic: "data aggregation pipelines" },
  "gradient-descent": { kind: "project", id: "churn", topic: "churn" },
};

export type ArcadeGame = {
  id: string;
  name: string;
  ready: boolean;
  /** Plain name (R9): "Token compression · United Airlines". */
  basedOn: string;
  /** The results screen's "That's real:" line, or null when its evidence is missing. */
  fact: string | null;
  /** A number the game's target borrows from the real result (Token Squeeze: 22 from "22–25%"), when it has one. */
  target: number | null;
  /** The real result's range, when the game shows it (Token Squeeze's meter marks 22–25%). */
  band: [number, number] | null;
};
export type CacheCard = { name: string; path: string; hash: string; tone: Tone | null };
export type ArcadeData = { games: Record<string, ArcadeGame>; cacheCards: CacheCard[] };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function factFor(id: string): { fact: string | null; target: number | null; band: [number, number] | null } {
  if (id === "token-squeeze" || id === "cache-hit") {
    const ua = entry("experience", "united");
    const compression = stat(ua, "Token compression");
    const cost = stat(ua, "Inference cost");
    const scenarios = stat(ua, "Eval scenarios");
    const range = compression?.match(/^(\d+)\s*[–-]\s*(\d+)%$/);
    const low = compression?.match(/^(\d+)/)?.[1];
    if (id === "token-squeeze")
      return {
        fact: says(ua, `${compression} token compression`, "SHA256 caching", cost) ? `Akshat's real result: ${compression} token compression + SHA256 caching → ${cost}.` : null,
        target: low ? Number(low) : null,
        band: range ? [Number(range[1]), Number(range[2])] : null,
      };
    return {
      fact: says(ua, `SHA256 caching across ${scenarios} eval scenarios`, cost) ? `Akshat's real result: SHA256 caching across ${scenarios} eval scenarios (plus token compression) → ${cost}.` : null,
      target: null,
      band: null,
    };
  }
  if (id === "bug-whack") {
    const tc = entry("experience", "truechip");
    const coverage = stat(tc, "Test coverage");
    const defects = stat(tc, "Post-integration defects");
    return { fact: says(tc, `${coverage} test coverage`, "post-integration defects") && defects ? `Real life: ${coverage} test coverage and ${defects} post-integration defects.` : null, target: null, band: null };
  }
  if (id === "rag-catcher") {
    const rx = entry("project", "researchx");
    return {
      fact: rx && says(rx, "LangGraph pipeline of 17 agents", "can only point to a source that exists") ? `Real life: ${rx.label} — a LangGraph pipeline of 17 agents, where a citation can only point to a source that exists.` : null,
      target: null,
      band: null,
    };
  }
  if (id === "pipeline") {
    const wt = entry("experience", "walkingtree");
    const records = stat(wt, "Records");
    const dau = stat(wt, "Daily active users");
    const n = records?.replace(/[^\d]/g, "");
    return {
      fact: says(wt, "data aggregation pipelines", `${records} records`, "enterprise") && dau ? `Real life: data aggregation pipelines on an enterprise system with ${records} records and ${dau} daily active users.` : null,
      target: n ? Number(n) : null,
      band: null,
    };
  }
  if (id === "gradient-descent") {
    const ch = entry("project", "churn");
    const acc = stat(ch, "Accuracy");
    const auc = stat(ch, "ROC-AUC");
    return { fact: says(ch, `${acc} accuracy and ${auc} ROC-AUC`) ? `Akshat's churn model: ${acc} accuracy · ${auc} ROC-AUC.` : null, target: null, band: null };
  }
  return { fact: null, target: null, band: null };
}

export function arcadeGames(): ArcadeGame[] {
  return ARCADE_IDS.map((id) => {
    const g = GAME_BY_ID[id];
    const b = BASED_ON[id];
    const e = b ? entry(b.kind, b.id) : null;
    const basedOn = e && b && says(e, b.topic) ? `${cap(b.topic)} · ${e.label}` : "";
    return { id, name: g.name, ready: g.ready, basedOn, ...factFor(id) };
  });
}

/** Cache Hit!'s eight pairs: stack items with a bundled logo, each with a real SHA-256 of its name (the card's "hash"). */
const CACHE_ITEMS = ["LangGraph", "Next.js", "TypeScript", "React", "Tailwind CSS", "PostgreSQL", "MongoDB", "Git"];
export function cacheCards(): CacheCard[] {
  const stacks = new Set([...experience.flatMap((e) => e.stack), ...projects.flatMap((p) => p.stack)]);
  return CACHE_ITEMS.filter((n) => TECH_ICONS[n] && stacks.has(n)).map((name) => {
    const type = lootFor([name])[0]?.type ?? null;
    return { name, path: TECH_ICONS[name].path, hash: createHash("sha256").update(name).digest("hex").slice(0, 8), tone: type ? ITEM_META[type].tone : null };
  });
}

export const buildArcadeData = (): ArcadeData => ({ games: Object.fromEntries(arcadeGames().map((g) => [g.id, g])), cacheCards: cacheCards() });

/** Build-time checks (schema.ts): every ready game has its real-work line and fact; Cache Hit! has its eight pairs. */
export function arcadeIssues(): string[] {
  const issues: string[] = [];
  for (const g of arcadeGames()) {
    if (!g.basedOn) issues.push(`arcade: "${g.id}" — its based-on phrase no longer appears in that entry's bullets`);
    if (g.ready && !g.fact) issues.push(`arcade: "${g.id}" — its "That's real" line lost its evidence in content.ts`);
  }
  if (arcadeGames().find((g) => g.id === "token-squeeze")?.target == null) issues.push('arcade: Token Squeeze needs the "Token compression" stat (its target)');
  if (arcadeGames().find((g) => g.id === "pipeline")?.target == null) issues.push('arcade: Pipeline needs WalkingTree\'s "Records" stat (its target)');
  if (cacheCards().length < 8) issues.push(`arcade: Cache Hit! needs 8 stack items with logos (has ${cacheCards().length})`);
  return issues;
}
