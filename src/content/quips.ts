// BYTE's script (PART 4): click quips, once-only world lines and first-run tips. Server-side only — the layout builds
// the script at build time and hands plain strings to the lazy client mascot, so content.ts never ships to the client.
// R1: every fact is read from content.ts. A quip also lists the exact content fragments it restates ("uses"); if
// any is missing (content changed, or still TODO) the quip is dropped at build time instead of saying something false.
// The jokes are about BYTE, never invented facts about Akshat.

import type { ByteMood } from "@/lib/byte";
import { COINS } from "./coins";
import { education, experience, honors, player, projects, research } from "./content";
import { counts, known } from "./derived";
import type { WorldId } from "./worlds";

export type Quip = { text: string; mood: ByteMood };
export type WorldLine = { text: string; mood: ByteMood; requires?: string };
export type Tip = { key: string; text: string; mood: ByteMood; requires?: string };
export type ByteScript = { quips: Quip[]; worldLines: Partial<Record<WorldId, WorldLine>>; tips: Tip[] };

const CONTENT_TEXT = JSON.stringify({ player, education, experience, projects, research, honors });

const job = (id: string) => experience.find((e) => e.id === id);
const jobStat = (id: string, label: string) => job(id)?.stats.find((s) => s.label === label)?.value;
const project = (id: string) => projects.find((p) => p.id === id);
const projectStat = (id: string, label: string) => project(id)?.stats.find((s) => s.label === label)?.value;
const honor = (id: string) => honors.find((h) => h.id === id);
const paper = (id: string) => research.find((r) => r.id === id);
const venueCodes = [...new Set(research.map((r) => r.venue.match(/\b[A-Z]{2,}-\d{4}\b/)?.[0]).filter(known))];

type Draft = { mood: ByteMood; values: (string | number | undefined | null)[]; uses?: string[]; say: (...v: string[]) => string };

/** Keeps a quip only when every value is known and every restated fragment really is in content.ts. */
function build(drafts: Draft[]): Quip[] {
  const out: Quip[] = [];
  for (const d of drafts) {
    const values = d.values.map((v) => (v === undefined || v === null ? "" : String(v)));
    if (!values.every((v) => known(v))) continue;
    if (!(d.uses ?? []).every((frag) => CONTENT_TEXT.includes(frag))) continue;
    out.push({ mood: d.mood, text: d.say(...values) });
  }
  return out;
}

const QUIPS = build([
  { mood: "cool", values: [jobStat("united", "Inference cost")], say: (v) => `Akshat cut inference cost to ${v.replace("/run", " per run")}. I asked for a raise. Denied.` },
  { mood: "happy", values: [jobStat("united", "Token compression")], say: (v) => `${v} token compression. I compressed my lunch break by 100%.` },
  {
    mood: "thinking",
    values: [jobStat("united", "Documentation artifacts")],
    uses: ["Cartographer"],
    say: (v) => `Cartographer turns out ${v.replace(/^(\d+) in /, "$1 documentation artifacts in ")}. I need two calls just to say hi.`,
  },
  { mood: "dizzy", values: [jobStat("united", "Eval scenarios")], say: (v) => `${v} eval scenarios. I failed the vibe check in all of them.` },
  { mood: "cool", values: [jobStat("truechip", "Test coverage")], say: (v) => `${v} test coverage at Truechip. My coverage: one charging cable.` },
  { mood: "happy", values: [jobStat("truechip", "Post-integration defects")], say: (v) => `Post-integration defects: ${v}. The bugs filed a complaint.` },
  { mood: "thinking", values: [jobStat("truechip", "Review turnaround time")], say: (v) => `Code review turnaround: ${v}. I review snacks. Turnaround: instant.` },
  {
    mood: "surprised",
    values: [jobStat("walkingtree", "Records"), jobStat("walkingtree", "Daily active users")],
    uses: ["Engazewell"],
    say: (r, d) => `Engazewell: ${r} records and ${d} daily active users. I have one daily user. Hi!`,
  },
  {
    mood: "cool",
    values: [jobStat("ey", "Engagement")],
    uses: ["regulated environment"],
    say: (v) => `At EY, Akshat shipped features for the ${v} engagement — a regulated environment. I'm regulated too. By naps.`,
  },
  {
    mood: "surprised",
    values: [projectStat("churn", "Accuracy"), projectStat("churn", "ROC-AUC")],
    say: (a, r) => `${a} accuracy and ${r} ROC-AUC on churn prediction. I still can't predict my own mood.`,
  },
  { mood: "happy", values: [counts.papers, venueCodes.length === 1 ? venueCodes[0] : undefined], say: (n, v) => `${n} papers presented at ${v}. I presented a nap. It went well.` },
  { mood: "thinking", values: [paper("cold-chain")?.boss.name, paper("cold-chain")?.boss.weapon], say: (b, w) => `${b} fears ${w}. Honestly? Same.` },
  { mood: "dizzy", values: [paper("pm25")?.boss.name, paper("pm25")?.boss.weapon], say: (b, w) => `${b} versus ${w}. Place your bets. (Bet on ${w}.)` },
  { mood: "cool", values: [education.cgpa], say: (v) => `CGPA ${v}. My CGPA is my screen's refresh rate.` },
  { mood: "happy", values: [education.previous[0]?.name, education.previous[0]?.score], say: (n, v) => `${n}: ${v}. I scored 404. Not found.` },
  { mood: "surprised", values: [honor("sih")?.year, honor("sih")?.detail], say: (y, d) => `Smart India Hackathon qualifier, ${y}. ${d} I was the unofficial mascot.` },
  { mood: "love", values: [honor("deans-list")?.year], say: (y) => `Dean's List, ${y}. I'm on a list too: "do not feed after midnight".` },
  { mood: "happy", values: [counts.skills], say: (n) => `${n} skills in the Skill Tree. I have one: beep.` },
  { mood: "cool", values: [counts.projects], say: (n) => `${n} cartridges in the vault. Blow on them first. It helps. (It doesn't.)` },
  {
    mood: "love",
    values: [project("cognivault")?.title],
    uses: ["A2A communication"],
    say: (t) => `${t} has agents that talk to each other over A2A. Finally, someone else to chat with.`,
  },
  {
    mood: "surprised",
    values: [project("quizmuj")?.title],
    uses: ["tab-switch tracking"],
    say: (t) => `${t} notices when you switch tabs during a live exam. I noticed too. I'm telling.`,
  },
  {
    mood: "thinking",
    values: [project("resume-screener")?.title],
    uses: ["TF-IDF + BERT"],
    say: (t) => `${t} runs a TF-IDF + BERT ensemble. My résumé is one line: "Beeps."`,
  },
  { mood: "cool", values: [project("a11y-analyzer")?.title], say: (t) => `Akshat built a ${t}. This site minds its manners.` },
  { mood: "happy", values: [counts.internships], say: (n) => `${n} internships so far. I'm still interning. Unpaid. In pixels.` },
  { mood: "cool", values: [player.status], say: (s) => `Current quest: ${s}. Mine: floating.` },
  {
    mood: "thinking",
    values: [job("united")?.stack.slice(0, 3).join(", ")],
    say: (s) => `${s}: Akshat gets them working together. I can't even get my antenna to work.`,
  },
  {
    mood: "happy",
    values: [job("walkingtree")?.company],
    uses: ["Power BI dashboards for workforce analytics"],
    say: (c) => `At ${c}, Akshat built Power BI dashboards for workforce analytics. I'm a dashboard too. Look: ▮▮▯.`,
  },
  { mood: "thinking", values: [education.coursework[1]], say: (c) => `${c} is on Akshat's coursework list. I speak fluent beep.` },
]);

/** Once-only lines on entering a world. `requires` = a selector for the feature the line talks about; the line waits
 *  until that feature exists on the page (later parts add the hooks), so BYTE never points at something that isn't
 *  there yet. The Bible's "quests" line is about the slingshot gate, which is World 2's Launchpad. */
const WORLD_LINES: Partial<Record<WorldId, WorldLine>> = {
  profile: { text: "Stats are real. I checked.", mood: "cool" },
  launchpad: { text: "Pull me back and let go. I'm a professional.", mood: "happy", requires: "[data-slingshot]" },
  lab: { text: "Boss fights ahead. Bring snacks.", mood: "surprised", requires: "[data-boss-fight]" },
  vault: { text: "Pick a cartridge. Blow on it first. Trust me.", mood: "cool", requires: "[data-cartridge]" },
  arcade: { text: "Every game here is based on real work Akshat did.", mood: "happy", requires: "[data-arcade-game]" },
  skills: { text: "Psst — paste a job description into the scanner.", mood: "thinking", requires: "[data-jd-scanner]" },
  trophies: { text: "Shiny things! Don't touch. Okay, touch.", mood: "love" },
  lobby: { text: "Write a message. I'll deliver it. By air.", mood: "happy", requires: "[data-contact-form]" },
};

const TIPS: Tip[] = [
  { key: "tip:click", text: "Click anything. Seriously, anything.", mood: "happy" },
  { key: "tip:pause", text: "Esc opens the pause menu.", mood: "cool" },
  { key: "tip:coins", text: `${COINS.length} coins are hidden. Good luck, Player 1.`, mood: "thinking", requires: "[data-coin]" },
];

export function buildByteScript(): ByteScript {
  return { quips: QUIPS, worldLines: WORLD_LINES, tips: TIPS };
}

export const QUIP_COUNT = QUIPS.length;
