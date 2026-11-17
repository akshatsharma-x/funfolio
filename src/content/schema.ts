// Build-time validation of content.ts (R1). Import ONLY from server components — zod must never reach the client.
// `next build` prerenders the home page, so a malformed fact fails the build instead of shipping.

import { z } from "zod";
import * as content from "./content";
import { resolveHighlight } from "./derived";
import { GAME_BY_ID } from "./games";
import { PERK_DEFS, radarItems } from "./profile";
import { activeWidgetIssues, skillAnchor } from "./quests";
import { TECH_ICONS } from "./techIcons";
import { vaultIssues } from "./vault";
import { arcadeIssues } from "./arcade";

const todo = z.literal("TODO");
const text = z.string().trim().min(1);
const textOrTodo = z.union([todo, text]);
const httpsUrl = z.url({ protocol: /^https$/ });
const urlOrTodo = z.union([todo, httpsUrl]);
const sitePathOrTodo = z.union([todo, z.string().regex(/^\/[^\s?#]+$/, "must be a root-relative path like /resume/x.pdf")]);
const stat = z.strictObject({ label: text, value: text });
const sideQuest = z
  .enum(["token-squeeze", "bug-whack", "pipeline", "rag-catcher", "tab-switch-egg", "jd-scanner", "gradient-descent", "a11y-scan"])
  .nullable();

const player = z
  .strictObject({
    name: text,
    handle: text,
    tagline: text,
    classes: z.array(text).min(1),
    status: text,
    email: z.email(),
    phone: z.string(),
    showPhone: z.boolean(),
    links: z.strictObject({ linkedin: httpsUrl, github: httpsUrl }),
    resumeUrl: sitePathOrTodo,
    base: textOrTodo,
    bio: textOrTodo,
    availability: textOrTodo,
    photo: textOrTodo,
    funFacts: z.array(text),
    researchInterests: z.array(text),
  })
  .refine((p) => !p.showPhone || p.phone.trim().length > 0, {
    message: "showPhone is true but phone is empty",
    path: ["phone"],
  });

const education = z.strictObject({
  school: text,
  degree: text,
  period: text,
  cgpa: text,
  previous: z.array(z.strictObject({ name: text, score: text, year: text })),
  coursework: z.array(text),
});

const experience = z.strictObject({
  id: text,
  company: text,
  emblem: z.string().regex(/^[A-Z0-9]{1,3}$/, "emblem = 1–3 uppercase letters/digits (pixel monogram)"),
  role: text,
  period: text,
  current: z.boolean(),
  mode: textOrTodo,
  bullets: z.array(text).min(1),
  stats: z.array(stat),
  stack: z.array(text),
  sideQuest,
});

const project = z.strictObject({
  id: text,
  title: text,
  subtitle: text,
  genre: text,
  category: z.enum(["ai", "fullstack", "tools"]),
  bullets: z.array(text).min(1),
  stats: z.array(stat),
  stack: z.array(text),
  links: z.strictObject({ demo: urlOrTodo, repo: urlOrTodo }),
  media: textOrTodo,
  sideQuest,
});

const paper = z
  .strictObject({
    id: text,
    title: text,
    venue: text,
    host: textOrTodo,
    dates: textOrTodo,
    status: z.enum(["Presented", "Published"]),
    boss: z.strictObject({ name: text, domain: text, weapon: text }),
    keywords: z.array(text),
    abstract: textOrTodo,
    links: z.strictObject({ paper: urlOrTodo, doi: textOrTodo }),
    bibtex: textOrTodo,
  })
  .refine((p) => p.status !== "Published" || p.links.doi !== "TODO", {
    message: "a Published paper needs its DOI",
    path: ["links", "doi"],
  });

const honor = z.strictObject({
  id: text,
  title: text,
  year: text,
  org: text,
  detail: z.string(),
  trophy: z.enum(["cup", "medal", "star", "scroll"]),
});

const certificate = z.strictObject({
  id: text,
  name: text,
  issuer: text,
  date: text,
  credentialId: text.optional(),
  credentialUrl: httpsUrl.optional(),
  skills: z.array(text).optional(),
});

const category = z.strictObject({
  label: text,
  items: z.array(text).min(1).refine((a) => new Set(a).size === a.length, "duplicate skill in one category"),
});

const skills = z.strictObject({
  weapons: category,
  spells: category,
  gear: category,
  gadgets: category,
  runes: category,
  signature: z.array(text),
});

const uniqueIds = (items: { id: string }[]) => new Set(items.map((i) => i.id)).size === items.length;

const schema = z
  .strictObject({
    player,
    education,
    experience: z.array(experience).min(1).refine(uniqueIds, "duplicate experience id"),
    projects: z.array(project).min(1).refine(uniqueIds, "duplicate project id"),
    research: z.array(paper).refine(uniqueIds, "duplicate research id"),
    honors: z.array(honor).refine(uniqueIds, "duplicate honor id"),
    certificates: z.array(certificate).refine(uniqueIds, "duplicate certificate id"),
    skills,
  })
  .superRefine((c, ctx) => {
    for (const tile of content.speedrun.highlights) {
      for (const ref of tile.refs) {
        if (!resolveHighlight(ref)) ctx.addIssue({ code: "custom", message: `speedrun highlight points at a missing fact: ${JSON.stringify(ref)}`, path: ["speedrun"] });
      }
    }
    // PART 6 · Player Profile: perks restate facts; the radar buckets name real stack items (a typo would undercount)
    for (const perk of PERK_DEFS) {
      if (!perk.build()) ctx.addIssue({ code: "custom", message: `perk "${perk.name}" points at a missing fact (src/content/profile.ts)`, path: ["profile"] });
    }
    const stacks = new Set([...c.experience, ...c.projects].flatMap((e) => e.stack));
    for (const item of radarItems()) {
      if (!stacks.has(item)) ctx.addIssue({ code: "custom", message: `focus radar item "${item}" is in no experience/project stack (src/content/profile.ts)`, path: ["profile"] });
    }
    const all = new Set([c.skills.weapons, c.skills.spells, c.skills.gear, c.skills.gadgets, c.skills.runes].flatMap((s) => s.items));
    for (const s of c.skills.signature) {
      if (!all.has(s)) ctx.addIssue({ code: "custom", message: `signature skill "${s}" is not in any skill category`, path: ["skills", "signature"] });
    }
    // PART 8 · Quest Log: the active quest's widgets restate real stats; loot links land on a unique Skill Tree anchor
    for (const issue of activeWidgetIssues()) ctx.addIssue({ code: "custom", message: `active quest widget: ${issue} (src/content/quests.ts)`, path: ["experience"] });
    const anchors = new Map<string, string>();
    for (const item of all) {
      const id = skillAnchor(item);
      const clash = anchors.get(id);
      if (clash) ctx.addIssue({ code: "custom", message: `skills "${clash}" and "${item}" share the anchor #${id}`, path: ["skills"] });
      anchors.set(id, item);
    }
    for (const name of Object.keys(TECH_ICONS)) {
      if (!stacks.has(name)) ctx.addIssue({ code: "custom", message: `tech icon "${name}" matches no stack item (src/content/techIcons.ts)`, path: ["experience"] });
    }
    for (const e of c.experience) {
      if (e.sideQuest && !GAME_BY_ID[e.sideQuest]) ctx.addIssue({ code: "custom", message: `side quest "${e.sideQuest}" (${e.id}) is not in src/content/games.ts`, path: ["experience"] });
    }
    // PART 10 · Cartridge Vault: every project's game side quest exists
    for (const issue of vaultIssues()) ctx.addIssue({ code: "custom", message: issue, path: ["projects"] });
    for (const issue of arcadeIssues()) ctx.addIssue({ code: "custom", message: issue, path: ["experience"] });
  });

let checked = false;

/** Throws a readable error if content.ts is malformed. Runs once per process. */
export function assertContent(): void {
  if (checked) return;
  const result = schema.safeParse({
    player: content.player,
    education: content.education,
    experience: content.experience,
    projects: content.projects,
    research: content.research,
    honors: content.honors,
    certificates: content.certificates,
    skills: content.skills,
  });
  if (!result.success) {
    throw new Error(`src/content/content.ts failed validation (R1):\n${z.prettifyError(result.error)}`);
  }
  checked = true;
}
