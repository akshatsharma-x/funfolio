// World 6 · SKILL TREE (PART 13): every value the tree, the inventory and the JD scanner show, computed on the server
// from content.ts (R1) — nodes, "Used in" evidence (alias-aware), the radial layout, the scanner's index and the build
// checks. Nothing here may reach a client bundle (content.ts, simple-icons paths); the scanner's index goes to the
// client island as a prop. The vocabulary itself (aliases, the JD scan) lives in src/lib/skills-index.ts (pure).

import type { PixelIconName } from "@/components/ui/pixel-icons";
import {
  ALIASES,
  EXTRA_ALIASES,
  SHORT_LABEL,
  VOCAB,
  compile,
  findAll,
  namesSkill,
  normalize,
  skillTerms,
  type SkillsIndex,
} from "@/lib/skills-index";
import { education, experience, player, projects, research, skills, type ItemType } from "./content";
import { ITEM_META, ITEM_TYPES, type Tone } from "./derived";
import { skillAnchor } from "./quests";
import { layoutTree, overlaps, ROOT, TREE_H, type FanId, type PlacedNode } from "./skillLayout";
import { SKILL_ICONS } from "./techIcons";

export { TREE_H };

// ── where skills can be used: the roles (Quest Log) and the projects (Cartridge Vault) ─────────────────────────────
type Entry = { kind: "quest" | "project"; id: string; name: string; href: string; stack: readonly string[] };

const ENTRIES: readonly Entry[] = [
  // a quest's heading (#quest-<id>) and a project's console screen (#screen-<id>, listed in full without JS and in
  // Speedrun Mode; in Play Mode the island inserts the cartridge instead)
  ...experience.map((e) => ({ kind: "quest" as const, id: e.id, name: e.company, href: `#quest-${e.id}`, stack: e.stack })),
  ...projects.map((p) => ({ kind: "project" as const, id: p.id, name: p.title, href: `#screen-${p.id}`, stack: p.stack })),
];

export type Evidence = {
  kind: "quest" | "project";
  id: string;
  name: string;
  href: string;
  /** The stack items that name the skill when they aren't spelled like it ("GPT-4.1", "Claude Sonnet 4.5" → LLMs). */
  via: string[];
};

export type SkillNode = {
  /** Position in content order across all item types (the client index uses the same order). */
  index: number;
  name: string;
  /** Node / slot label (the full name stays in the accessible name and the card). */
  short: string;
  slug: string;
  /** `skill-<slug>` — the Quest Log's and the Vault's loot links land here (PART 8 ids, unchanged). */
  anchor: string;
  type: ItemType;
  /** "Weapon · Languages" */
  typeLine: string;
  tone: Tone;
  pixel: PixelIconName;
  /** Sprite symbol id of its tech logo, or null (then the item-type pixel icon). */
  logo: string | null;
  signature: boolean;
  evidence: Evidence[];
};

const singular = (name: string) => name.replace(/s$/, "");
/** Every term that can name a skill in a stack item — its name, its aliases, families and the "loose" spellings. */
const stackTerms = (name: string): string[] => skillTerms(name, ALIASES[name], { loose: true }).map(([t]) => t);

let nodeCache: SkillNode[] | null = null;

/** Every skill in content order. Evidence = each role and project whose stack names it — by name, another spelling or
 *  a family ("GPT-4.1" is an LLM, "Django REST Framework" runs on Django). Never a proficiency score. */
export function skillNodes(): SkillNode[] {
  if (nodeCache) return nodeCache;
  const signature = new Set(skills.signature);
  let index = 0;
  nodeCache = ITEM_TYPES.flatMap((type) =>
    skills[type].items.map((name): SkillNode => {
      const terms = stackTerms(name);
      const evidence = ENTRIES.flatMap((e): Evidence[] => {
        const items = e.stack.filter((item) => namesSkill(item, terms));
        return items.length ? [{ kind: e.kind, id: e.id, name: e.name, href: e.href, via: items.filter((i) => i !== name) }] : [];
      });
      const anchor = skillAnchor(name);
      const icon = SKILL_ICONS[name];
      return {
        index: index++,
        name,
        short: SHORT_LABEL[name] ?? name,
        slug: anchor.replace(/^skill-/, ""),
        anchor,
        type,
        typeLine: `${singular(ITEM_META[type].name)} · ${skills[type].label}`,
        tone: ITEM_META[type].tone,
        pixel: ITEM_META[type].icon,
        logo: icon ? `si-${icon.slug}` : null,
        signature: signature.has(name),
        evidence,
      };
    }),
  );
  return nodeCache;
}

/** The logos the section's sprite defines (each once, even when two skills share one). */
export function skillLogos(): { id: string; path: string; title: string }[] {
  const seen = new Map<string, { id: string; path: string; title: string }>();
  for (const icon of Object.values(SKILL_ICONS)) seen.set(icon.slug, { id: `si-${icon.slug}`, path: icon.path, title: icon.title });
  return [...seen.values()];
}

/** The root node's label: the first name, as on the Title Screen. */
export const rootLabel = (): string => (player.name.split(/\s+/)[0] ?? player.name).toUpperCase();

// ── the radial tree ───────────────────────────────────────────────────────────────────────────────────────────────
/** Biggest branch → the right fan (the widest room), then the two left halves, the bottom and the top. */
const FAN_ORDER: readonly FanId[] = ["right", "upperLeft", "lowerLeft", "bottom", "top"];

export type TreeBranch = {
  type: ItemType;
  name: string;
  label: string;
  tone: Tone;
  pixel: PixelIconName;
  fan: FanId | null;
  hub: { x: number; y: number } | null;
  hubPop: number;
  nodes: { node: SkillNode; at: PlacedNode | null }[];
};
export type TreeEdge = {
  x: number;
  y: number;
  len: number;
  rot: number;
  /** When it grows (s). */
  delay: number;
  tone: Tone | null;
  /** A data packet flows along it, starting at this offset (s); null = no packet. */
  packet: number | null;
};
export type SkillTreeData = { radial: boolean; root: { label: string; x: number; y: number }; branches: TreeBranch[]; edges: TreeEdge[] };

/** Estimated hub width (cqw) for the overlap check: the game name in the pixel face over "label · count". CSS caps
 *  hubs at the same width and lets them wrap, so the estimate is an upper bound. */
const hubWidth = (type: ItemType, count: number) => {
  const name = ITEM_META[type].name.length * 0.66 * 0.92 + 1.9;
  const plain = `${skills[type].label} · ${count}`.length * 0.55 * 0.78;
  return Math.min(13.2, Math.max(name, plain) + 1.8);
};

const r2 = (v: number) => Math.round(v * 100) / 100;
const edge = (from: { x: number; y: number }, to: { x: number; y: number }, delay: number, tone: Tone | null, packet: number | null): TreeEdge => ({
  x: from.x,
  y: from.y,
  len: r2(Math.hypot(to.x - from.x, to.y - from.y)),
  rot: r2((Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI),
  delay,
  tone,
  packet,
});

export function skillTree(): SkillTreeData {
  const nodes = skillNodes();
  const byType = ITEM_TYPES.map((t) => nodes.filter((n) => n.type === t));
  const ranked = ITEM_TYPES.map((t, i) => ({ t, i, n: byType[i].length })).sort((a, b) => b.n - a.n || a.i - b.i);
  const fanOf = new Map(ranked.map((r, k) => [r.t, FAN_ORDER[k]] as const));
  const placed = layoutTree(ITEM_TYPES.map((t, i) => ({ fan: fanOf.get(t) ?? "top", count: byType[i].length })));
  const radial = !!placed && overlaps(placed, ITEM_TYPES.map((t, i) => hubWidth(t, byType[i].length))).length === 0;

  const edges: TreeEdge[] = [];
  const branches = ITEM_TYPES.map((type, b): TreeBranch => {
    const at = radial && placed ? placed[b] : null;
    const meta = ITEM_META[type];
    if (at) {
      edges.push(edge(ROOT, at.hub, 0, meta.tone, r2(b * 0.62)));
      const inner = at.nodes.filter((n) => n.lane === 0);
      at.nodes.forEach((n) => {
        // packets ride the outermost spokes of the first lane: enough motion to read as "data flowing out"
        const k = n.lane === 0 ? inner.indexOf(n) : -1;
        const packet = k === 0 || (k === inner.length - 1 && k > 0) ? r2(0.35 + b * 0.62 + k * 0.4) : null;
        edges.push(edge(n.from, n, n.edge, meta.tone, packet));
      });
    }
    return {
      type,
      name: meta.name,
      label: skills[type].label,
      tone: meta.tone,
      pixel: meta.icon,
      fan: at?.fan ?? null,
      hub: at?.hub ?? null,
      hubPop: at?.hubPop ?? 0,
      nodes: byType[b].map((node, j) => ({ node, at: at?.nodes[j] ?? null })),
    };
  });
  return { radial, root: { label: rootLabel(), x: ROOT.x, y: ROOT.y }, branches, edges };
}

// ── the scanner's index (client prop) ─────────────────────────────────────────────────────────────────────────────
type Extra = { name: string; sources: string[]; terms: string[] };

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Résumé items that aren't Skill Tree entries — stack items no skill names, coursework, research keywords — and the
 *  vocabulary words content.ts already uses (bullets, genres, titles). The scanner lists them as "also on the save
 *  file"; the rest of the vocabulary is what it may call "not on the save file yet". */
function extrasAndVocab(): { extras: Extra[]; vocab: { name: string; terms: string[] }[] } {
  const terms = skillNodes().map((n) => stackTerms(n.name));
  const extras = new Map<string, Extra>();
  const add = (name: string, source: string, more: readonly string[] = []) => {
    const key = normalize(name);
    const x = extras.get(key) ?? { name, sources: [], terms: [...new Set([name, ...(EXTRA_ALIASES[name] ?? []), ...more])] };
    if (!x.sources.includes(source)) x.sources.push(source);
    extras.set(key, x);
  };
  // one label per paper, so a keyword and its paper's title never list the same source twice
  const paper = (r: (typeof research)[number]) => {
    const code = r.venue.match(/\b[A-Z]{2,}-\d{4}\b/)?.[0];
    return code ? `Research paper · ${code}` : "Research paper";
  };
  for (const e of ENTRIES) for (const item of e.stack) if (!terms.some((t) => namesSkill(item, t))) add(item, e.name);
  for (const course of education.coursework) add(course, "Coursework");
  for (const r of research) for (const kw of r.keywords) add(kw, paper(r));

  const texts = [
    ...experience.map((e) => ({ source: e.company, text: [e.role, ...e.bullets].join("\n") })),
    ...projects.map((p) => ({ source: p.title, text: [p.title, p.subtitle, p.genre, ...p.bullets].join("\n") })),
    ...research.map((r) => ({ source: paper(r), text: r.title })),
  ];
  // …and every entry whose text mentions one (NLP: coursework + the résumé screener's NLP pipeline)
  const list = [...extras.values()];
  const extraMatcher = compile(list.map((x, i) => ({ target: i, prio: 1, terms: x.terms.map((t) => [t, 1] as const) })));
  for (const { source, text } of texts) for (const hit of findAll(extraMatcher, text)) if (!list[hit.target].sources.includes(source)) list[hit.target].sources.push(source);

  const vocab = Object.entries(VOCAB);
  const matcher = compile(vocab.map(([, t], i) => ({ target: i, prio: 2, terms: t.map((s) => [s, 1] as const) })));
  const mentioned = new Map<number, string>();
  for (const { source, text } of texts)
    for (const hit of findAll(matcher, text)) {
      const display = mentioned.get(hit.target) ?? capitalise(hit.via);
      mentioned.set(hit.target, display);
      add(display, source, vocab[hit.target][1]);
    }
  return {
    extras: [...extras.values()],
    vocab: vocab.filter((_, i) => !mentioned.has(i)).map(([name, t]) => ({ name, terms: [...t] })),
  };
}

export function skillsIndex(): SkillsIndex {
  const nodes = skillNodes();
  const entryIndex = new Map(ENTRIES.map((e, i) => [`${e.kind}:${e.id}`, i] as const));
  const { extras, vocab } = extrasAndVocab();
  return {
    types: ITEM_TYPES.map((t) => ({ id: t, name: ITEM_META[t].name, label: skills[t].label, tone: ITEM_META[t].tone })),
    skills: nodes.map((n) => ({
      slug: n.slug,
      name: n.name,
      type: ITEM_TYPES.indexOf(n.type),
      ev: n.evidence.map((e) => entryIndex.get(`${e.kind}:${e.id}`) ?? -1).filter((i) => i >= 0),
      terms: skillTerms(n.name, ALIASES[n.name]),
    })),
    entries: ENTRIES.map((e) => ({ name: e.name, kind: e.kind, id: e.id })),
    extras: extras.map((x) => ({ name: x.name, source: x.sources.join(" · "), terms: x.terms })),
    vocab,
  };
}

// ── build checks (schema.ts) ──────────────────────────────────────────────────────────────────────────────────────
/** Every skill once; every alias, short label and logo points at a real skill; one term never names two things; every
 *  stack item spelled exactly like a skill shows up in that skill's evidence. */
export function skillIssues(): string[] {
  const issues: string[] = [];
  const names = ITEM_TYPES.flatMap((t) => skills[t].items);
  const seen = new Map<string, string>();
  for (const n of names) {
    const k = normalize(n);
    const prev = seen.get(k);
    if (prev) issues.push(`skill "${n}" is listed twice (also as "${prev}") — every skill appears exactly once`);
    seen.set(k, n);
  }
  const set = new Set(names);
  const where = "src/lib/skills-index.ts";
  for (const k of Object.keys(ALIASES)) if (!set.has(k)) issues.push(`alias entry "${k}" is not a skill in content.skills (${where})`);
  for (const k of Object.keys(SHORT_LABEL)) if (!set.has(k)) issues.push(`short label "${k}" is not a skill in content.skills (${where})`);
  for (const k of Object.keys(SKILL_ICONS)) if (!set.has(k)) issues.push(`skill logo "${k}" is not a skill in content.skills (src/content/techIcons.ts)`);

  const owner = new Map<string, string>();
  const claim = (spec: string, who: string) => {
    if (spec.endsWith("*")) return;
    const k = normalize(spec.replace(/^=/, ""));
    const prev = owner.get(k);
    if (prev && prev !== who) issues.push(`"${spec}" names both ${prev} and ${who} (${where})`);
    owner.set(k, who);
  };
  for (const n of names) for (const [t] of skillTerms(n, ALIASES[n], { loose: true })) claim(t, `the skill ${n}`);
  const { extras, vocab } = extrasAndVocab();
  for (const x of extras) for (const t of x.terms) claim(t, `the résumé item ${x.name}`);
  for (const v of vocab) for (const t of v.terms) claim(t, `the vocabulary word ${v.name}`);
  for (const k of Object.keys(EXTRA_ALIASES))
    if (!extras.some((x) => x.name === k)) issues.push(`extra alias "${k}" matches no coursework, stack item or research keyword (${where})`);

  const nodes = skillNodes();
  for (const e of ENTRIES)
    for (const item of e.stack) {
      const n = nodes.find((x) => x.name === item);
      if (n && !n.evidence.some((ev) => ev.kind === e.kind && ev.id === e.id)) issues.push(`"${item}" (${e.name}) is missing from its skill's "Used in" evidence`);
    }
  return issues;
}
