// Ask BYTE (PART 19): the offline dialogue tree. Server-side only — the layout builds it at build time and hands plain
// strings to the lazy chat panel (like BYTE's quips), so content.ts never ships to the client. R1: every fact in a line
// is read from content.ts, and each node lists the exact fragments it restates (`facts`); the build fails if one of
// them isn't in content.ts — an answer can't drift from the save file. "Coming soon" states stand in for TODOs. The
// connective words, the jokes and BYTE's own lines are game copy, never claims about Akshat.
import type { ByteMood } from "@/lib/byte";
import type { WorldId } from "./worlds";
import { education, experience, player, projects, research, skills } from "./content";
import { counts, known } from "./derived";
import { publicFileExists } from "@/lib/files";
import { GAME_BY_ID } from "./games";
import { skillNodes } from "./skills";

export type DialogueAction =
  | { type: "world"; id: WorldId; anchor?: string }
  | { type: "game"; id: string }
  | { type: "scroll"; paper: string }
  | { type: "cartridge"; id: string }
  | { type: "jd" }
  | { type: "pause"; tab: string }
  | { type: "terminal" }
  | { type: "copy-email" }
  | { type: "speedrun" }
  | { type: "download-resume" }
  | { type: "forget-name" };
export type DialogueOption = { label: string; next?: string; action?: DialogueAction };
export type DialogueNode = { id: string; line: string; mood: ByteMood; options: DialogueOption[] };
/** A type-to-ask route: the words (and multi-word phrases) that point at a node. */
export type DialogueIntent = { node: string; words: string[] };
export type DialogueData = {
  nodes: Record<string, DialogueNode>;
  /** The eight starter topics, in order (the hub's options; the fallback suggests three of them). */
  starters: DialogueOption[];
  intents: DialogueIntent[];
  /** BYTE's own jokes — about robots and code, never about Akshat. */
  jokes: string[];
  /** For "copy the email" — the same address the Co-op Lobby shows. */
  email: string;
  /** "Akshat" — how BYTE refers to him. */
  first: string;
};

const CONTENT_TEXT = JSON.stringify({ player, education, experience, projects, research, skills });
const first = player.name.split(/\s+/)[0] ?? player.name;
const nodes: Record<string, DialogueNode> = {};

/** Adds a node; every fact must be known and appear verbatim in content.ts, or the build stops (R1). */
function node(id: string, mood: ByteMood, line: string, facts: (string | undefined | null)[], options: DialogueOption[]): void {
  const missing = facts.filter((f) => !known(f ?? "") || !CONTENT_TEXT.includes(f as string));
  if (missing.length) throw new Error(`dialogue.ts: node "${id}" restates ${missing.map((m) => JSON.stringify(m)).join(", ")}, which content.ts doesn't contain (R1)`);
  nodes[id] = { id, line, mood, options };
}
const back: DialogueOption = { label: "Back to topics", next: "hub" };
const list = (items: string[]) => (items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);
const noDot = (s: string) => s.replace(/\.\s*$/, "");
/** A side quest the chat can start: a ready arcade game, or the JD scanner. */
const sideQuestOption = (id: string | null | undefined): DialogueOption | null => {
  if (!id) return null;
  if (id === "jd-scanner") return { label: "Open the JD scanner", action: { type: "jd" } };
  const g = GAME_BY_ID[id];
  return g?.ready && g.arcade ? { label: `Play ${g.name}`, action: { type: "game", id } } : null;
};
const statLine = (stats: readonly { label: string; value: string }[]) => stats.map((s) => `${s.label}: ${s.value}`).join(" · ");
/** Stats the lead sentence doesn't already say (Churn's bullet already has its 97% and 0.98). */
const fresh = (stats: readonly { label: string; value: string }[], lead: string) => stats.filter((s) => !lead.includes(s.value));
/** "Automated Resume Screening" + "& Candidate Classification Pipeline" reads as one name. */
const fullName = (title: string, subtitle: string) => (/^&/.test(subtitle) ? `${title} ${subtitle}` : `${title} — ${subtitle}`);

// ── the current role ───────────────────────────────────────────────────────────────────────────────────────────
const now = experience.find((e) => e.current) ?? experience[0];
if (now) {
  const article = /^[aeiou]/i.test(now.role) ? "an" : "a";
  const lead = now.bullets[0] ?? "";
  node(
    "now",
    "happy",
    `Right now ${first} is ${article} ${now.role} at ${now.company} (${now.period}).${lead ? ` ${lead}` : ""}`,
    [first, now.role, now.company, now.period, ...(lead ? [lead] : [])],
    [
      ...(now.bullets.length > 1 ? [{ label: "What did he build there?", next: "now-built" }] : []),
      ...(now.stats.length ? [{ label: "Any numbers?", next: "now-stats" }] : []),
      { label: "Other internships?", next: "experience" },
      ...[sideQuestOption(now.sideQuest)].filter((o): o is DialogueOption => !!o),
      { label: "Show me the Quest Log", action: { type: "world", id: "quests", anchor: `quest-${now.id}` } },
      back,
    ],
  );
  const built = now.bullets.slice(1, 3);
  if (built.length) node("now-built", "cool", built.join(" "), built, [{ label: "Any numbers?", next: "now-stats" }, { label: "Other internships?", next: "experience" }, back]);
  if (now.stats.length)
    node("now-stats", "surprised", `The numbers, straight from the save file — ${statLine(now.stats)}.`, now.stats.flatMap((s) => [s.label, s.value]), [
      ...[sideQuestOption(now.sideQuest)].filter((o): o is DialogueOption => !!o),
      { label: "Other internships?", next: "experience" },
      back,
    ]);
}

// ── the other roles ────────────────────────────────────────────────────────────────────────────────────────────
const before = experience.filter((e) => e !== now);
node(
  "experience",
  "thinking",
  `${counts.internships} internships on the save file. Before ${now?.company ?? "now"}: ${list(before.map((e) => `${e.role} at ${e.company} (${e.period})`))}. Pick one:`,
  before.flatMap((e) => [e.role, e.company, e.period]),
  [...before.map((e) => ({ label: e.company, next: `job-${e.id}` })), ...(now ? [{ label: now.company, next: "now" }] : []), back],
);
for (const e of before) {
  const mode = known(e.mode) ? ` · ${e.mode}` : "";
  const lead = e.bullets[0] ?? "";
  node(
    `job-${e.id}`,
    "happy",
    `${e.role} at ${e.company}, ${e.period}${mode}. ${noDot(lead)}${fresh(e.stats, lead).length ? ` (${statLine(fresh(e.stats, lead))})` : ""}.`,
    [e.role, e.company, e.period, lead, ...(known(e.mode) ? [e.mode] : []), ...e.stats.flatMap((s) => [s.label, s.value])],
    [
      ...[sideQuestOption(e.sideQuest)].filter((o): o is DialogueOption => !!o),
      { label: "Show the quest card", action: { type: "world", id: "quests", anchor: `quest-${e.id}` } },
      { label: "Other internships?", next: "experience" },
      back,
    ],
  );
}

// ── projects ("Best project?" — the save file doesn't rank them, so BYTE won't either) ─────────────────────────
node(
  "projects",
  "thinking",
  `The save file doesn't rank them — ${counts.projects} projects, ${counts.projects} cartridges in the Vault. Pick one:`,
  [],
  [...projects.map((p) => ({ label: p.title, next: `project-${p.id}` })), back],
);
for (const p of projects) {
  const lead = p.bullets[0] ?? "";
  const extra = p.stack.length ? ` Stack: ${p.stack.slice(0, 4).join(" · ")}.` : "";
  const stats = fresh(p.stats, lead);
  node(
    `project-${p.id}`,
    p.stats.length ? "surprised" : "happy",
    `${fullName(p.title, p.subtitle)} (${p.genre}). ${lead}${stats.length ? ` ${statLine(stats)}.` : ""}${extra}`,
    [p.title, p.subtitle, p.genre, lead, ...p.stats.flatMap((s) => [s.label, s.value]), ...p.stack.slice(0, 4)],
    [
      { label: "Insert the cartridge", action: { type: "cartridge", id: p.id } },
      ...[sideQuestOption(p.sideQuest)].filter((o): o is DialogueOption => !!o),
      { label: "Another project", next: "projects" },
      back,
    ],
  );
}

// ── research ───────────────────────────────────────────────────────────────────────────────────────────────────
const codeOf = (venue: string) => venue.match(/\b[A-Z]{2,}-\d{4}\b/)?.[0] ?? null;
const seriesOf = (venue: string) => venue.match(/\(([^)]+)\)\s*$/)?.[1] ?? null;
const codes = [...new Set(research.map((r) => codeOf(r.venue)).filter(known))];
const series = [...new Set(research.map((r) => seriesOf(r.venue)).filter(known))];
const allPresented = research.every((r) => r.status === "Presented");
node(
  "research",
  "cool",
  `${counts.papers} paper${counts.papers === 1 ? "" : "s"}, ${allPresented ? "presented" : "on the save file"}${codes.length ? ` at ${list(codes)}` : ""}${series.length ? ` (${list(series)})` : ""}. In the Lab each one is a boss fight. Pick one:`,
  [...codes, ...series],
  [...research.map((r) => ({ label: r.boss.name, next: `paper-${r.id}` })), { label: "Go to the Lab", action: { type: "world", id: "lab" } }, back],
);
for (const r of research) {
  const where = [codeOf(r.venue), known(r.host) ? r.host : null, known(r.dates) ? r.dates : null].filter(known);
  const other = research.find((x) => x !== r);
  node(
    `paper-${r.id}`,
    "thinking",
    `“${r.title}” — ${r.status}${where.length ? `, ${where.join(" · ")}` : ""}. Keywords: ${list(r.keywords)}. In the Lab it's ${r.boss.name} vs ${r.boss.weapon}.`,
    [r.title, r.status, ...where, ...r.keywords, r.boss.name, r.boss.weapon],
    [
      { label: "Read the scroll", action: { type: "scroll", paper: r.id } },
      ...(other ? [{ label: "The other paper", next: `paper-${other.id}` }] : []),
      { label: "Go to the Lab", action: { type: "world", id: "lab" } },
      back,
    ],
  );
}

// ── skills for an AI/ML role (evidence, never a self-rating) ─────────────────────────────────────────────────────
const spells = skillNodes().filter((s) => s.type === "spells");
const byEntry = new Map<string, string[]>();
for (const s of spells.filter((x) => x.evidence.length)) {
  const where = s.evidence[0]?.name;
  if (where) byEntry.set(where, [...(byEntry.get(where) ?? []), s.name]);
}
const receipts = [...byEntry.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 4);
const python = skillNodes().find((s) => s.name === "Python");
node(
  "skills-ai",
  "cool",
  `${spells.length} ${skills.spells.label} skills on the save file. With receipts in a role or project: ${receipts.map(([where, names]) => `${list(names.slice(0, 4))} (${where})`).join(" · ")}.${python?.evidence.length ? ` Plus ${python.name} (${list(python.evidence.map((e) => e.name))}).` : ""}`,
  [skills.spells.label, ...receipts.flatMap(([where, names]) => [where, ...names.slice(0, 4)]), ...(python?.evidence.length ? [python.name, ...python.evidence.map((e) => e.name)] : [])],
  [{ label: "Scan a job description", action: { type: "jd" } }, { label: "Show the Skill Tree", action: { type: "world", id: "skills" } }, back],
);

// ── availability · contact ─────────────────────────────────────────────────────────────────────────────────────
const contactOptions: DialogueOption[] = [
  { label: "Copy his email", action: { type: "copy-email" } },
  { label: "Take me to the Lobby", action: { type: "world", id: "lobby" } },
];
if (known(player.availability)) node("availability", "happy", player.availability, [player.availability], [...contactOptions, back]);
else
  node(
    "availability",
    "thinking",
    `That's not on the save file yet — ${first} hasn't posted roles or a start date here. The quickest way to ask him: the Co-op Lobby, or his email.`,
    [],
    [...contactOptions, back],
  );
node("contact", "happy", `${player.email} — or LinkedIn and GitHub, both in the Co-op Lobby.`, [player.email], [...contactOptions, back]);
// the Save File: the PDF once it's in public/ (a build-time check), "coming soon" until then
const resumeReady = known(player.resumeUrl) && publicFileExists(player.resumeUrl);
node(
  "resume",
  resumeReady ? "happy" : "thinking",
  resumeReady
    ? `The Save File is ${first}'s résumé as a PDF — want it?`
    : `The Save File (the résumé PDF) isn't on the site yet — coming soon. Meanwhile Recruiter Speedrun Mode shows everything on one screen.`,
  [first],
  [...(resumeReady ? [{ label: "Download the Save File", action: { type: "download-resume" } } as DialogueOption] : []), { label: "Recruiter Speedrun Mode", action: { type: "speedrun" } }, back],
);

// ── education ──────────────────────────────────────────────────────────────────────────────────────────────────
node(
  "education",
  "happy",
  `${education.degree} at ${education.school} (${education.period}) — CGPA ${education.cgpa}. Before that: ${list(education.previous.map((p) => `${p.name} ${p.score} (${p.year})`))}.`,
  [education.degree, education.school, education.period, education.cgpa, ...education.previous.flatMap((p) => [p.name, p.score, p.year])],
  [{ label: "Coursework?", next: "coursework" }, { label: "Show the Player Profile", action: { type: "world", id: "profile" } }, back],
);
node("coursework", "thinking", `On the coursework list: ${list(education.coursework)}.`, education.coursework, [{ label: "Where did he study?", next: "education" }, back]);

// ── BYTE's own corner (game copy; the joke and the secret are picked at run time) ──────────────────────────────
node("hub", "happy", `Ask me anything that's on ${first}'s save file — or pick a topic:`, [first], []);
node("joke", "happy", "", [], [{ label: "Another one", next: "joke" }, back]);
node("secret", "cool", "", [], [
  { label: "Another hint", next: "secret" },
  { label: "Show my achievements", action: { type: "pause", tab: "achievements" } },
  { label: "Open the terminal", action: { type: "terminal" } },
  back,
]);
node("byte", "love", `I'm BYTE, ${first}'s tiny robot sidekick. I float in the corner, nap when you're quiet, and everything I tell you comes from his save file.`, [first], [back]);
node("thanks", "love", "Anytime! Anything else?", [], [back]);
node("fallback", "dizzy", "That's not in my save file! Try one of these:", [], []);

const starters: DialogueOption[] = [
  ...(now ? [{ label: `What does ${first} do at ${now.company}?`, next: "now" }] : []),
  { label: "Best project?", next: "projects" },
  { label: "Tell me about the research", next: "research" },
  { label: "Skills for an AI/ML role?", next: "skills-ai" },
  { label: "Is he available?", next: "availability" },
  { label: "Where did he study?", next: "education" },
  { label: "Tell me a joke", next: "joke" },
  { label: "Any secrets on this site?", next: "secret" },
];
nodes.hub.options = starters;

/** Distinctive words of a name (lower case, no stop words) — "BBC News Retrieval" → bbc, news, retrieval. */
const nameWords = (name: string) =>
  name
    .toLowerCase()
    .replace(/[()]/g, " ")
    .split(/[^a-z0-9.+#]+/)
    .filter((w) => w.length > 2 && !["the", "and", "for", "with", "pvt", "ltd", "inc", "analysis", "system", "using", "solutions", "technologies", "web", "group"].includes(w));

/** What a role's own work is called, so a question about it finds the role (whether it's current or not). */
const ROLE_WORDS: Record<string, string[]> = { united: ["cartographer", "monitoring"] };

const intents: DialogueIntent[] = [
  // specific names first (they win ties); "resume" alone is the Save File, "resume screening" the project
  { node: "resume", words: ["resume", "résumé", "cv", "save file", "pdf"] },
  ...projects.map((p) => ({ node: `project-${p.id}`, words: [...nameWords(p.title), p.id] })),
  ...research.map((r) => ({ node: `paper-${r.id}`, words: [...nameWords(r.boss.name), ...r.keywords.flatMap(nameWords), r.id] })),
  ...before.map((e) => ({ node: `job-${e.id}`, words: [...nameWords(e.company), e.emblem.toLowerCase(), e.id, ...(ROLE_WORDS[e.id] ?? [])] })),
  ...(now ? [{ node: "now", words: [...nameWords(now.company), now.emblem.toLowerCase(), ...(ROLE_WORDS[now.id] ?? []), "current", "currently", "now", "doing", "right now", "job"] }] : []),
  ...(nodes["now-stats"] ? [{ node: "now-stats", words: ["numbers", "metrics", "stats", "results", "impact", "cost"] }] : []),
  { node: "experience", words: ["experience", "internship", "internships", "intern", "previous", "before", "companies", "career", "worked", "jobs", "history"] },
  { node: "projects", words: ["project", "projects", "built", "build", "portfolio", "cartridge", "cartridges", "best", "favourite", "favorite", "side projects"] },
  { node: "research", words: ["research", "paper", "papers", "publication", "publications", "published", "conference", "springer", "lnns", ...codes.map((c) => c.toLowerCase())] },
  { node: "skills-ai", words: ["skill", "skills", "stack", "tech", "technologies", "ai", "ml", "machine learning", "llm", "llms", "genai", "rag", "langgraph", "python", "tools", "languages"] },
  { node: "availability", words: ["available", "availability", "hire", "hiring", "recruit", "recruiter", "join", "start date", "open to work", "full time", "fulltime", "offer", "opening"] },
  { node: "contact", words: ["contact", "email", "mail", "reach", "linkedin", "github", "message", "talk", "call", "phone"] },
  { node: "coursework", words: ["coursework", "courses", "course", "subjects", "classes"] },
  { node: "education", words: ["study", "studied", "studies", "college", "university", "uni", "school", "education", "degree", "btech", "b.tech", "cgpa", "gpa", "grades", "marks", "cbse", "student", "graduate", "graduation", ...nameWords(education.school)] },
  { node: "joke", words: ["joke", "jokes", "funny", "laugh", "humor", "humour", "pun", "lol"] },
  { node: "secret", words: ["secret", "secrets", "coin", "coins", "easter egg", "egg", "eggs", "hidden", "hint", "hints", "cheat", "trick"] },
  { node: "byte", words: ["who are you", "byte", "robot", "mascot", "yourself"] },
  { node: "thanks", words: ["thanks", "thank", "thx", "cheers"] },
  { node: "hub", words: ["hi", "hello", "hey", "yo", "sup", "menu", "topics", "help", "start"] },
];

const JOKES = [
  "Why do programmers prefer dark mode? Light attracts bugs.",
  "I told my CPU a joke. It didn't laugh — it was busy caching the punchline.",
  "There are 10 kinds of robots: the ones who read binary and the ones who don't.",
  "Knock knock. — Who's there? — Recursion. — Recursion who? — Knock knock.",
  "I'd tell you a UDP joke, but you might not get it.",
  "My favourite exercise? Pushing commits. Then a quick git stretch.",
  "A robot walks into a bar. Ouch. It was a progress bar.",
];

export function buildDialogue(): DialogueData {
  return { nodes, starters, intents, jokes: JOKES, email: player.email, first };
}

/** Build-time check (schema.ts runs it): every node an option points at exists. */
export function dialogueIssues(): string[] {
  const issues: string[] = [];
  for (const n of Object.values(nodes)) for (const o of n.options) if (o.next && !nodes[o.next]) issues.push(`dialogue: "${n.id}" → "${o.next}" doesn't exist`);
  for (const i of intents) if (!nodes[i.node]) issues.push(`dialogue: intent → "${i.node}" doesn't exist`);
  return issues;
}
