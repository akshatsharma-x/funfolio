// World 1 · PLAYER PROFILE (PART 6). Server-side, like boot.ts and quips.ts: every value below is read or computed
// from content.ts (R1). Perk names and the radar's domain buckets are game labels / a classification — never facts.
// schema.ts fails the build when something here points at a fact that no longer exists.

import type { PixelIconName } from "@/components/ui/pixel-icons";
import { education, experience, honors, player, projects, research } from "./content";
import { counts, known } from "./derived";

const current = () => experience.find((e) => e.current) ?? null;
const statOf = (expId: string, label: string) => experience.find((e) => e.id === expId)?.stats.find((s) => s.label === label)?.value ?? null;
const honorOf = (id: string) => honors.find((h) => h.id === id) ?? null;
/** "SCI-2026 — International Conference-SCI (Springer LNNS)" → "SCI-2026" when every paper shares one venue code. */
const venueCode = () => {
  const codes = [...new Set(research.map((r) => r.venue.match(/\b[A-Z]{2,}-\d{4}\b/)?.[0]).filter(known))];
  return codes.length === 1 ? codes[0] : null;
};
/** "Multi-Agent RAG" → "multi-agent RAG" (acronyms keep their case). */
const lower = (s: string) => s.replace(/[A-Za-z]+(?:-[A-Za-z]+)*/g, (w) => (/^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase()));

/* ── 1 · Character card ─────────────────────────────────────────────────────────────────────────────────────── */

export function characterSheet() {
  const now = current();
  const subclass = player.classes.find((c) => /full-stack/i.test(c)) ?? player.classes[1] ?? null;
  return {
    name: player.name,
    handle: player.handle,
    className: player.classes[0] ?? null,
    subclass,
    guild: education.school,
    /** "ONLINE @ <current company>" */
    online: now ? now.company : null,
  };
}

/* ── 2 · Origin story ───────────────────────────────────────────────────────────────────────────────────────── */

/**
 * DRAFT (PART 6, docs/DECISIONS.md #7): a first-person bio assembled ONLY from content.ts, shown while player.bio is
 * "TODO". Replace it by writing player.bio in content.ts. Every clause restates a content value; a clause whose
 * source is missing is left out.
 */
export function bioDraft(): string[] {
  const [degree, field] = education.degree.split(/\s+in\s+/);
  const now = current();
  const lines: string[] = [];
  const cgpa = known(education.cgpa) ? `, CGPA ${education.cgpa}` : "";
  lines.push(`I study ${field ?? education.degree} at ${education.school} (${degree.replace(/\.$/, "")}, ${education.period}${cgpa}).`);
  if (now) {
    const article = /^[aeiou]/i.test(now.role) ? "an" : "a";
    const first = now.bullets[0] ?? "";
    const doing = /^working on /i.test(first) ? `, ${first[0].toLowerCase()}${first.slice(1).replace(/\.$/, "")}` : "";
    lines.push(`Right now I'm ${article} ${now.role} at ${now.company}${doing}.`);
  }
  const range = projects.length >= 2 ? ` — from ${lower(projects[0].genre)} to ${lower(projects[1].genre)} —` : "";
  const code = venueCode();
  const verb = research.length > 0 && research.every((r) => r.status === "Published") ? "published" : "presented";
  const papers = research.length > 0 ? ` and ${counts.papers} paper${counts.papers === 1 ? "" : "s"} ${verb}${code ? ` at ${code}` : ""}` : "";
  lines.push(`So far: ${counts.internships} internships, ${counts.projects} projects${range}${papers}.`);
  return lines;
}

export const bio = (): { lines: string[]; draft: boolean } => (known(player.bio) ? { lines: [player.bio], draft: false } : { lines: bioDraft(), draft: true });

/* ── 3 · XP stats ───────────────────────────────────────────────────────────────────────────────────────────── */

/** "8.79/10" → { text: "8.79", max: "10", ratio: 0.879 } — null while unknown. */
export function cgpa() {
  if (!known(education.cgpa)) return null;
  const [value, max = "10"] = education.cgpa.split("/").map((s) => s.trim());
  const ratio = Number(value) / Number(max);
  return Number.isFinite(ratio) ? { text: value, max, ratio: Math.max(0, Math.min(1, ratio)) } : null;
}

/** Previous saves: "95.4%" → 95.4 for the meter; the label and text stay exactly as written. */
export const previousSaves = () =>
  education.previous.map((p) => ({ name: p.name, score: p.score, year: p.year, percent: Number.parseFloat(p.score) })).filter((p) => Number.isFinite(p.percent));

/* ── 4 · Currently playing ──────────────────────────────────────────────────────────────────────────────────── */

/** Phrases worth headlining for the current role — shown only while they appear verbatim in its bullets. */
const NOW_PLAYING = ["LLM Model Monitoring", "Cartographer"];

export function nowPlaying() {
  const now = current();
  if (!now) return null;
  const text = now.bullets.join(" ");
  return { role: now.role, company: now.company, since: now.period.split(/\s+[–-]\s+/)[0], focus: NOW_PLAYING.filter((p) => text.includes(p)) };
}

/* ── 5 · Perks ──────────────────────────────────────────────────────────────────────────────────────────────── */

export type Perk = { id: string; name: string; icon: PixelIconName; lines: string[]; source: string };
type PerkDef = { id: string; name: string; icon: PixelIconName; build: () => Omit<Perk, "id" | "name" | "icon"> | null };

const company = (id: string) => experience.find((e) => e.id === id)?.company ?? "";

export const PERK_DEFS: readonly PerkDef[] = [
  {
    id: "token-miser",
    name: "Token Miser",
    icon: "coin",
    build: () => {
      const v = statOf("united", "Inference cost");
      return v ? { lines: [`Inference cost cut to ${v}`], source: company("united") } : null;
    },
  },
  {
    id: "test-fanatic",
    name: "Test Fanatic",
    icon: "check",
    build: () => {
      const v = statOf("truechip", "Test coverage");
      return v ? { lines: [`${v} test coverage`], source: company("truechip") } : null;
    },
  },
  {
    id: "bug-exterminator",
    name: "Bug Exterminator",
    icon: "bug",
    build: () => {
      const v = statOf("truechip", "Post-integration defects");
      return v ? { lines: [`${v} post-integration defects`], source: company("truechip") } : null;
    },
  },
  {
    id: "published",
    // R1 (PART 18 fact audit): the brief's "Published", but both papers are "Presented" in content.ts — the name follows
    // the status and becomes "Published" by itself once content says so (with the DOI)
    name: research.length > 0 && research.every((r) => r.status === "Published") ? "Published" : "Presenter",
    icon: "scroll",
    build: () => {
      const h = honorOf("sci-2026");
      return h ? { lines: [h.title], source: h.org } : null;
    },
  },
  {
    id: "hackathon-veteran",
    name: "Hackathon Veteran",
    icon: "bolt",
    build: () => {
      const h = honorOf("sih");
      if (!h) return null;
      const level = h.org.match(/\(([^)]+)\)/)?.[1];
      return { lines: [`${h.title} · ${h.year}`, ...(known(h.detail) ? [h.detail] : [])], source: level ? `${level[0].toUpperCase()}${level.slice(1)}` : h.org };
    },
  },
  {
    id: "honor-roll",
    name: "Honor Roll",
    icon: "trophy",
    build: () => {
      const a = honorOf("deans-list");
      const b = honorOf("excellence");
      if (!a || !b) return null;
      return { lines: [`${a.title} · ${a.year}`, `${b.title} · ${b.year}`], source: a.org === b.org ? a.org : `${a.org} · ${b.org}` };
    },
  },
];

export const perks = (): Perk[] => PERK_DEFS.flatMap((d) => {
  const built = d.build();
  return built ? [{ id: d.id, name: d.name, icon: d.icon, ...built }] : [];
});

/* ── 7 · Quick stats ────────────────────────────────────────────────────────────────────────────────────────── */

export const quickStats = () => [
  { label: "Internships", value: counts.internships },
  { label: "Projects", value: counts.projects },
  { label: "Papers", value: counts.papers },
  { label: "Skills", value: counts.skills },
];

/* ── 8 · Focus radar ────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * Six domains; each axis = how many résumé entries (roles, projects, papers) show evidence of it. A role or project
 * counts once when its stack lists at least one of the domain's items; Research = the number of papers. A
 * classification, not a self-rating — edit the buckets here (schema.ts checks every item exists in some stack).
 */
export const FOCUS_DOMAINS: readonly { id: string; label: string; items: readonly string[] }[] = [
  { id: "genai", label: "GenAI", items: ["LangGraph", "GPT-4.1", "Claude Sonnet 4.5", "LLM Monitoring", "Knowledge Graphs", "Token Compression", "SHA256 Caching", "LangChain", "Gemini 1.5", "Gemini Vision", "A2A", "RAG", "FAISS", "HyDE", "Ragas"] },
  { id: "ml", label: "ML & Data", items: ["Python", "Streamlit", "Transformers", "BERT", "TF-IDF", "XAI", "PCA", "TensorFlow", "KerasTuner", "SMOTE", "Stacking Ensemble", "Feature Importance", "Power BI"] },
  { id: "backend", label: "Backend", items: ["Django REST Framework", "JWT", "REST APIs", "PostgreSQL", "Postman", "MongoDB", "FastAPI", "Node.js", "Express.js", "Socket.io", "Docker"] },
  { id: "frontend", label: "Frontend", items: ["Next.js", "TypeScript", "React", "Tailwind CSS", "WCAG 2.1", "Headless DOM Crawler"] },
  { id: "java", label: "Java & OOP", items: ["Java", "OOP"] },
  { id: "research", label: "Research", items: [] },
];

export type RadarAxis = { id: string; label: string; value: number; evidence: string[] };

export function focusRadar(): RadarAxis[] {
  const entries = [...experience.map((e) => ({ name: e.company, stack: e.stack })), ...projects.map((p) => ({ name: p.title, stack: p.stack }))];
  const code = venueCode();
  return FOCUS_DOMAINS.map((d) => {
    if (d.id === "research") return { id: d.id, label: d.label, value: counts.papers, evidence: counts.papers ? [`${counts.papers} paper${counts.papers === 1 ? "" : "s"}${code ? ` · ${code}` : ""}`] : [] };
    const evidence = entries.filter((e) => e.stack.some((s) => d.items.includes(s))).map((e) => e.name);
    return { id: d.id, label: d.label, value: evidence.length, evidence };
  });
}

/** Every stack item named by the radar buckets (schema.ts: each must exist in some stack — a typo would undercount). */
export const radarItems = () => FOCUS_DOMAINS.flatMap((d) => d.items);

/* ── 9 · Mystery crate · 10 · Spawn point ───────────────────────────────────────────────────────────────────── */

export const crateFact = (): string | null => player.funFacts.find(known) ?? null;
export const spawnPoint = (): string | null => (known(player.base) ? player.base : null);
