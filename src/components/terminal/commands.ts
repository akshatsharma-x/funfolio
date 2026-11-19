// AKSHAT-OS commands (PART 16). Facts come from the server-built TerminalData (content.ts, R1); live game state from
// the save. Output is plain text lines — the terminal renders them as text nodes, never HTML (bytesay echoes the
// visitor's words safely).

import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID } from "@/content/achievements";
import { COINS } from "@/content/coins";
import type { TermLine, TerminalData, TermPage } from "@/content/eggs";
import { EGGS } from "@/lib/eggs";
import { useSave } from "@/lib/store";

export type Effect =
  | { kind: "close" }
  | { kind: "clear" }
  | { kind: "play"; id: string }
  | { kind: "theme"; value: "night" | "day" | "retro" }
  | { kind: "download" }
  | { kind: "hire" };
export type Result = { lines: TermLine[]; effects?: Effect[] };
export type Ctx = { data: TerminalData; resumeHref: string | null };

const t = (text: string, tone?: TermLine["tone"]): TermLine => (tone ? { text, tone } : { text });

export const COMMANDS: readonly { name: string; args?: string; about: string }[] = [
  { name: "help", about: "this list" },
  { name: "whoami", about: "who's on the other side of the screen" },
  { name: "about", about: "the bio" },
  { name: "experience", about: "quests completed (and the active one)" },
  { name: "projects", about: "the cartridge vault" },
  { name: "research", about: "papers and where they were presented" },
  { name: "skills", about: "the inventory, by type" },
  { name: "certs", about: "certificates" },
  { name: "contact", about: "how to reach Akshat" },
  { name: "resume", about: "the save file (PDF)" },
  { name: "socials", about: "LinkedIn and GitHub" },
  { name: "games", about: "the arcade's cabinets" },
  { name: "play", args: "<game>", about: "start an arcade game" },
  { name: "coins", about: "hidden coins you've found" },
  { name: "achievements", about: "your trophies" },
  { name: "hint", about: "a clue for a coin you haven't found" },
  { name: "theme", args: "<night|day|retro>", about: "switch the theme" },
  { name: "sound", args: "<on|off>", about: "sound effects" },
  { name: "fx", args: "<chill|normal|chaos>", about: "effects intensity" },
  { name: "ls", about: "list files" },
  { name: "cat", args: "<file>", about: "print a file" },
  { name: "bytesay", args: "<text>", about: "BYTE says it" },
  { name: "clear", about: "clear the screen" },
  { name: "exit", about: "close the terminal" },
];

const PAGES: readonly TermPage[] = ["whoami", "about", "experience", "projects", "research", "skills", "certs", "contact", "socials"];
const FILES = (resume: boolean) => ["about.txt", "experience.log", "projects/", "research/", "skills.db", "contact.vcf", "secrets.txt", ...(resume ? ["resume.pdf"] : [])];
const FILE_PAGE: Record<string, TermPage> = { "about.txt": "about", "experience.log": "experience", "skills.db": "skills", "contact.vcf": "contact" };

/** What Tab can complete after a command word. */
export function argChoices(cmd: string, ctx: Ctx): string[] {
  if (cmd === "play") return ctx.data.games.map((g) => g.id);
  if (cmd === "theme") return ["night", "day", "retro"];
  if (cmd === "sound") return ["on", "off"];
  if (cmd === "fx") return ["chill", "normal", "chaos"];
  if (cmd === "cat") return FILES(!!ctx.resumeHref);
  if (cmd === "sudo") return ["hire akshat"];
  return [];
}
export const commandNames = (): string[] => [...COMMANDS.map((c) => c.name), "sudo"];

/** ASCII BYTE with a speech bubble (word-wrapped). */
export function byteSay(text: string): TermLine[] {
  const words = text.trim().replace(/\s+/g, " ").slice(0, 240).split(" ");
  const rows: string[] = [];
  let row = "";
  for (const w of words) {
    if ((row + " " + w).trim().length > 34) {
      rows.push(row.trim());
      row = w;
    } else row = `${row} ${w}`;
  }
  if (row.trim()) rows.push(row.trim());
  const width = Math.max(...rows.map((r) => r.length), 4);
  const top = ` ${"_".repeat(width + 2)}`;
  const bottom = ` ${"-".repeat(width + 2)}`;
  const body = rows.length === 1 ? [`< ${rows[0].padEnd(width)} >`] : rows.map((r, i) => `${i === 0 ? "/" : i === rows.length - 1 ? "\\" : "|"} ${r.padEnd(width)} ${i === 0 ? "\\" : i === rows.length - 1 ? "/" : "|"}`);
  return [
    t(top, "accent"),
    ...body.map((b) => t(b, "accent")),
    t(bottom, "accent"),
    t("      \\"),
    t("       \\   ┌─────────┐"),
    t("           │  o   o  │"),
    t("           │   \\_/   │"),
    t("           └────┬────┘"),
    t("              ──┴──"),
  ];
}

export function runCommand(input: string, ctx: Ctx): Result {
  const raw = input.trim();
  if (!raw) return { lines: [] };
  const [word, ...rest] = raw.split(/\s+/);
  const cmd = word.toLowerCase();
  const arg = rest.join(" ");
  const s = useSave.getState();

  if ((PAGES as readonly string[]).includes(cmd)) return { lines: ctx.data.pages[cmd as TermPage] };
  switch (cmd) {
    case "help":
      return {
        lines: [
          t("AKSHAT-OS commands", "title"),
          ...COMMANDS.map((c) => t(`  ${`${c.name}${c.args ? ` ${c.args}` : ""}`.padEnd(26)} ${c.about}`)),
          t("  sudo hire akshat".padEnd(28) + " (you know you want to)", "muted"),
          t("Tab completes · ↑/↓ history · Esc closes", "muted"),
        ],
      };
    case "resume":
      return ctx.resumeHref ? { lines: [t("Downloading the save file…", "ok")], effects: [{ kind: "download" }] } : { lines: [t("COMING SOON — the résumé PDF isn't on the shelf yet.", "warn"), t("Meanwhile: type experience, projects or skills.", "muted")] };
    case "games":
      return { lines: [t("Arcade cabinets", "title"), ...ctx.data.games.map((g) => t(`  ${g.id.padEnd(18)} ${g.name}`)), t("Type play <game> — e.g. play bug-whack", "muted")] };
    case "play": {
      if (!arg) return { lines: [t("usage: play <game>   (games lists them)", "warn")] };
      const g = ctx.data.games.find((x) => x.id === arg.toLowerCase() || x.name.toLowerCase() === arg.toLowerCase());
      return g ? { lines: [t(`Inserting ${g.name}…`, "ok")], effects: [{ kind: "play", id: g.id }, { kind: "close" }] } : { lines: [t(`play: no such cartridge: ${arg}`, "warn"), t("games lists them", "muted")] };
    }
    case "coins": {
      const ids = s.player.coinIds;
      return { lines: [t(`${ids.length}/${COINS.length} hidden coins found`, "title"), ...COINS.map((c) => t(`  #${String(c.number).padStart(2, "0")} ${ids.includes(c.id) ? `✓ ${c.name}` : "? ???"}`, ids.includes(c.id) ? "ok" : "muted")), t(`Wallet: ${s.player.wallet} coin${s.player.wallet === 1 ? "" : "s"} · hint gives a clue`, "muted")] };
    }
    case "achievements": {
      const got = Object.entries(s.achievements).sort((a, b) => b[1] - a[1]);
      return { lines: [t(`${got.length}/${ACHIEVEMENTS.length} achievements unlocked`, "title"), ...got.slice(0, 8).map(([id]) => t(`  ★ ${ACHIEVEMENT_BY_ID[id]?.title ?? id}`, "ok")), ...(got.length > 8 ? [t(`  …and ${got.length - 8} more (Pause → Achievements)`, "muted")] : []), ...(got.length ? [] : [t("  none yet — try typing something nice", "muted")])] };
    }
    case "hint": {
      const missing = COINS.filter((c) => !s.player.coinIds.includes(c.id));
      if (!missing.length) return { lines: [t("All 12 hidden coins found. The Golden cursor is yours.", "ok")] };
      const c = missing[Math.floor(Math.random() * missing.length)];
      return { lines: [t(`Coin #${c.number}: ${c.hint}`, "accent")] };
    }
    case "theme": {
      const v = arg.toLowerCase();
      if (v !== "night" && v !== "day" && v !== "retro") return { lines: [t("usage: theme <night|day|retro>", "warn")] };
      if (v === "retro" && !s.inventory.owned.includes("theme-retro")) return { lines: [t("theme: retro is locked — reach LV 7, find the old code, or visit the Prize Counter.", "warn")] };
      return { lines: [t(`Theme: ${v}`, "ok")], effects: [{ kind: "theme", value: v }] };
    }
    case "sound": {
      const v = arg.toLowerCase();
      if (v !== "on" && v !== "off") return { lines: [t(`usage: sound <on|off>   (now ${s.settings.sound ? "on" : "off"})`, "warn")] };
      s.setSetting("sound", v === "on");
      return { lines: [t(`Sound ${v}.`, "ok")] };
    }
    case "fx": {
      const v = arg.toLowerCase();
      if (v !== "chill" && v !== "normal" && v !== "chaos") return { lines: [t(`usage: fx <chill|normal|chaos>   (now ${s.settings.fx})`, "warn")] };
      s.setSetting("fx", v);
      return { lines: [t(`Effects: ${v}.`, "ok")] };
    }
    case "ls":
      return { lines: [t(FILES(!!ctx.resumeHref).join("   "))] };
    case "cat": {
      const f = arg.trim();
      if (!f) return { lines: [t("usage: cat <file>   (ls lists them)", "warn")] };
      if (FILE_PAGE[f]) return { lines: ctx.data.pages[FILE_PAGE[f]] };
      if (f === "secrets.txt") return { lines: [t("secrets.txt — no spoilers, just nudges", "title"), ...[...new Set(EGGS.map((e) => e.hint))].map((h) => t(`  • ${h}`))] };
      if (f.endsWith("/")) return { lines: [t(`cat: ${f}: Is a directory — try ${f.slice(0, -1)}`, "warn")] };
      if (f === "resume.pdf" && ctx.resumeHref) return { lines: [t("cat: resume.pdf: binary file — try resume", "warn")] };
      return { lines: [t(`cat: ${f}: No such file`, "warn")] };
    }
    case "bytesay":
      return { lines: byteSay(arg || "Beep boop. Type help.") };
    case "clear":
      return { lines: [], effects: [{ kind: "clear" }] };
    case "exit":
    case "quit":
      return { lines: [t("Bye, Player 2.", "muted")], effects: [{ kind: "close" }] };
    case "sudo":
      if (/^hire\s+akshat$/i.test(arg)) return { lines: [t("[sudo] password for player2: ********", "muted"), t("ROOT ACCESS GRANTED.", "ok"), t("Opening the Co-op Lobby…", "accent")], effects: [{ kind: "hire" }] };
      return { lines: [t(`sudo: ${arg || "a command"}: permission denied — BYTE has root.`, "warn"), t("(try: sudo hire akshat)", "muted")] };
    default:
      return { lines: [t(`command not found: ${word}`, "warn"), t("type help", "muted")] };
  }
}

/** Tab completion: the completed input, or the choices to show when it's ambiguous. */
export function complete(input: string, ctx: Ctx): { value: string; choices: string[] } {
  const m = input.match(/^(\s*)(\S*)(\s+)?(.*)$/);
  if (!m) return { value: input, choices: [] };
  const [, , first, space, restIn] = m;
  if (!space) {
    const hits = commandNames().filter((c) => c.startsWith(first.toLowerCase()));
    if (hits.length === 1) return { value: `${hits[0]} `, choices: [] };
    return { value: commonPrefix(hits) || first, choices: hits.length > 1 ? hits : [] };
  }
  const opts = argChoices(first.toLowerCase(), ctx);
  const hits = opts.filter((o) => o.startsWith(restIn.toLowerCase()));
  if (hits.length === 1) return { value: `${first} ${hits[0]}`, choices: [] };
  const pre = commonPrefix(hits);
  return { value: `${first} ${pre || restIn}`, choices: hits.length > 1 ? hits : [] };
}

function commonPrefix(list: string[]): string {
  if (!list.length) return "";
  let p = list[0];
  for (const s of list) while (!s.startsWith(p)) p = p.slice(0, -1);
  return p;
}
