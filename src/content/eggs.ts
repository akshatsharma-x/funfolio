// PART 16 · what the eggs say, built on the server from content.ts (R1) and handed to the runtime as a prop (like BYTE's
// script), so content.ts stays out of client chunks: the terminal's pages, the loot chest's did-you-knows, the proctor
// banner and a hash of the content for the patch-notes toast.

import { createHash } from "node:crypto";
import * as content from "./content";
import { certificates, education, experience, honors, player, projects, research, skills } from "./content";
import { counts, known } from "./derived";
import { GAMES } from "./games";
import { LATEST_PATCH } from "./patchNotes";
import { bio } from "./profile";

export type TermTone = "accent" | "muted" | "ok" | "warn" | "title";
/** One line of terminal output — plain text (never HTML); `href` makes it a link. */
export type TermLine = { text: string; tone?: TermTone; href?: string };
export type TermPage = "whoami" | "about" | "experience" | "projects" | "research" | "skills" | "certs" | "contact" | "socials";

export type TerminalData = {
  user: string;
  host: string;
  motd: TermLine[];
  pages: Record<TermPage, TermLine[]>;
  email: string;
  games: { id: string; name: string }[];
};

export type EggData = {
  terminal: TerminalData;
  /** The loot chest's line: Akshat's own fun facts once content has some, otherwise did-you-knows from the résumé. */
  facts: string[];
  factsAreFun: boolean;
  /** The proctor banner — QuizMUJ's tab-switch tracking, while its bullets say so. */
  proctor: string;
  /** sha256 (first 12 hex) of every content.ts export: a new hash → the patch-notes toast for returning visitors. */
  contentHash: string;
};

const line = (text: string, tone?: TermTone, href?: string): TermLine => (href ? { text, tone, href } : tone ? { text, tone } : { text });

function pages(): Record<TermPage, TermLine[]> {
  const b = bio();
  const about: TermLine[] = [...b.lines.map((l) => line(l)), ...(b.draft ? [line("(a draft written from the résumé — Akshat's own bio is coming soon)", "muted")] : [])];
  about.push(line(""), line(`${education.degree} · ${education.school} · ${education.period}${known(education.cgpa) ? ` · CGPA ${education.cgpa}` : ""}`, "accent"));
  if (known(player.base)) about.push(line(`Spawn point: ${player.base}`, "muted"));
  if (known(player.availability)) about.push(line(`Availability: ${player.availability}`, "ok"));

  const exp: TermLine[] = [];
  for (const e of experience) {
    exp.push(line(`${e.company} — ${e.role}`, "accent"), line(`${e.period}${known(e.mode) ? ` · ${e.mode}` : ""}${e.current ? " · current quest" : ""}`, "muted"));
    for (const bullet of e.bullets) exp.push(line(`  • ${bullet}`));
    if (e.stack.length) exp.push(line(`  stack: ${e.stack.join(", ")}`, "muted"));
    exp.push(line(""));
  }

  const proj: TermLine[] = [];
  for (const p of projects) {
    proj.push(line(`${p.title} — ${p.subtitle}`, "accent"), line(`  ${p.genre} · ${p.stack.join(", ")}`, "muted"));
    for (const s of p.stats) proj.push(line(`  ${s.label}: ${s.value}`, "ok"));
    if (known(p.links.repo)) proj.push(line(`  repo: ${p.links.repo}`, undefined, p.links.repo));
    if (known(p.links.demo)) proj.push(line(`  demo: ${p.links.demo}`, undefined, p.links.demo));
    proj.push(line(""));
  }

  const res: TermLine[] = [];
  for (const r of research) {
    res.push(line(r.title, "accent"), line(`  ${r.venue} · ${r.status}${known(r.dates) ? ` · ${r.dates}` : ""}${known(r.host) ? ` · ${r.host}` : ""}`, "muted"));
    if (known(r.links.doi)) res.push(line(`  doi: ${r.links.doi}`, undefined, r.links.doi));
    res.push(line(""));
  }

  const sk: TermLine[] = [];
  for (const key of ["weapons", "spells", "gear", "gadgets", "runes"] as const) {
    const cat = skills[key];
    sk.push(line(`${cat.label} (${cat.items.length})`, "accent"), line(`  ${cat.items.join(", ")}`));
  }
  sk.push(line(""), line(`${counts.skills} skills in all — the Skill Tree shows where each one was used.`, "muted"));

  const certs: TermLine[] = certificates.length
    ? certificates.flatMap((c) => [line(c.name, "accent"), line(`  ${c.issuer}${known(c.date) ? ` · ${c.date}` : ""}`, "muted"), ...(c.credentialUrl && known(c.credentialUrl) ? [line(`  verify: ${c.credentialUrl}`, undefined, c.credentialUrl)] : [])])
    : [line("COMING SOON — next level loading…", "warn"), line(`Meanwhile, ${counts.honors} honors are in the Trophy Room:`, "muted"), ...honors.map((h) => line(`  • ${h.title} (${h.year})`))];

  const contact: TermLine[] = [
    line(`email     ${player.email}`, "accent", `mailto:${player.email}`),
    line(`linkedin  ${player.links.linkedin}`, undefined, player.links.linkedin),
    line(`github    ${player.links.github}`, undefined, player.links.github),
  ];
  if (player.showPhone && known(player.phone)) contact.push(line(`phone     ${player.phone}`, undefined, `tel:${player.phone.replace(/\s+/g, "")}`));
  contact.push(line(""), line("Or fling a message from the Co-op Lobby: type `sudo hire akshat`.", "muted"));

  return {
    whoami: [line(player.handle, "title"), line(`${player.name} — ${player.status}`), line(`class: ${player.classes.join(" · ")}`, "muted"), line(player.tagline, "accent")],
    about,
    experience: exp.slice(0, -1),
    projects: proj.slice(0, -1),
    research: res.slice(0, -1),
    skills: sk,
    certs,
    contact,
    socials: [line(`linkedin  ${player.links.linkedin}`, undefined, player.links.linkedin), line(`github    ${player.links.github}`, undefined, player.links.github)],
  };
}

/** Did-you-knows that restate content values (R1) — used while player.funFacts is empty. */
function didYouKnow(): string[] {
  const out: string[] = [];
  const now = experience.find((e) => e.current);
  if (now) out.push(`Akshat is ${/^[aeiou]/i.test(now.role) ? "an" : "a"} ${now.role} at ${now.company}.`);
  out.push(`${counts.internships} internships so far — from ${experience[experience.length - 1].company} to ${experience[0].company}.`);
  if (known(education.cgpa)) out.push(`CGPA ${education.cgpa} at ${education.school}.`);
  for (const e of experience) for (const s of e.stats) if (known(s.value)) out.push(`${s.label}: ${s.value} — at ${e.company}.`);
  for (const p of projects) for (const s of p.stats) if (known(s.value)) out.push(`${s.label}: ${s.value} — ${p.title}.`);
  for (const h of honors) out.push(`${h.title} (${h.year}).`);
  return out;
}

function proctorLine(): string {
  const quiz = projects.find((p) => p.bullets.some((b) => /tab-switch/i.test(b)));
  return quiz ? `⚠ TAB SWITCH DETECTED — just like ${quiz.title}'s proctoring. −0 marks.` : "⚠ TAB SWITCH DETECTED — the proctor noticed. −0 marks.";
}

function contentHash(): string {
  const all = content as Record<string, unknown>;
  const json = JSON.stringify(Object.keys(all).sort().map((k) => [k, all[k]]));
  return createHash("sha256").update(json).digest("hex").slice(0, 12);
}

export function buildEggData(): EggData {
  const fun = player.funFacts.filter(known);
  return {
    terminal: {
      user: "player2",
      host: "akshat-os",
      motd: [
        line(`AKSHAT-OS v${LATEST_PATCH} — ${player.name}'s Funfolio`, "title"),
        line("Type help for commands · Tab completes · ↑/↓ history · Esc closes", "muted"),
      ],
      pages: pages(),
      email: player.email,
      games: GAMES.filter((g) => g.ready && g.arcade).map((g) => ({ id: g.id, name: g.name })),
    },
    facts: fun.length ? fun : didYouKnow(),
    factsAreFun: fun.length > 0,
    proctor: proctorLine(),
    contentHash: contentHash(),
  };
}
