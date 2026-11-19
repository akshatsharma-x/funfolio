// The easter-egg registry (PART 16) — what each egg is, how it's found and what it does. Data only, client-safe: the
// EggProvider (src/components/eggs/) attaches every listener once and runs the effects (a lazy chunk, keyed by id);
// /playground/eggs lists these with a trigger button each; the terminal's `cat secrets.txt` prints the hints.
// Every egg is harmless, ≤ 3s (the coffee steam 5s and the loot chest 6s, as briefed), offline, and never blocks
// content, links, selection or forms.

import type { AchievementId } from "@/content/achievements";

export type FxLevel = "chill" | "normal" | "chaos";
const FX_ORDER: Record<FxLevel, number> = { chill: 0, normal: 1, chaos: 2 };
const isFx = (v: string | null): v is FxLevel => v === "chill" || v === "normal" || v === "chaos";
/** Does the current `data-fx` level reach an egg's `minFx`? */
export const fxAllows = (current: string | null, min: FxLevel): boolean => FX_ORDER[isFx(current) ? current : "normal"] >= FX_ORDER[min];

export type EggId =
  | "corner-top-left"
  | "corner-top-right"
  | "corner-bottom-left"
  | "corner-bottom-right"
  | "cheat-code"
  | "word-akshat"
  | "word-hire"
  | "word-bug"
  | "word-coffee"
  | "word-sudo"
  | "terminal"
  | "devtools"
  | "proctor"
  | "idle-sleep"
  | "idle-bored"
  | "night-owl"
  | "context-menu"
  | "select-byte"
  | "loot-chest"
  | "milestone-clicks"
  | "milestone-time"
  | "milestone-worlds"
  | "patch-notes";

export type Egg = {
  id: EggId;
  name: string;
  /** How a visitor finds it (the playground's label). */
  trigger: string;
  /** What happens. */
  effect: string;
  achievement?: AchievementId;
  /** The lowest `data-fx` level it plays at. An egg's essential part (a theme switch, a scroll, a menu) always runs. */
  minFx: FxLevel;
  /** Stays on in Speedrun Mode — only the terminal and the right-click menu do. */
  speedrun?: boolean;
  /** A nudge for the terminal's secrets.txt — no spoilers. */
  hint: string;
};

export const EGGS: readonly Egg[] = [
  { id: "corner-top-left", name: "Corner · top-left", trigger: "Hold the pointer in the top-left corner for 600ms (touch: long-press it)", effect: "The HUD logo flips like a coin (all four corners → Corner Case)", achievement: "corner-case", minFx: "chill", hint: "Every screen has four corners. Linger in each." },
  { id: "corner-top-right", name: "Corner · top-right", trigger: "Hold the pointer in the top-right corner for 600ms (touch: long-press it)", effect: "A tiny secret gear appears — it switches on CHAOS mode (all four → Corner Case)", achievement: "corner-case", minFx: "chill", hint: "Every screen has four corners. Linger in each." },
  { id: "corner-bottom-left", name: "Corner · bottom-left", trigger: "Hold the pointer in the bottom-left corner for 600ms (touch: long-press it)", effect: "A pixel door creaks open on the dev room (all four → Corner Case)", achievement: "corner-case", minFx: "chill", hint: "Every screen has four corners. Linger in each." },
  { id: "corner-bottom-right", name: "Corner · bottom-right", trigger: "Hold the pointer in the bottom-right corner for 600ms (touch: long-press it)", effect: "BYTE peeks in from off-screen and waves (all four → Corner Case)", achievement: "corner-case", minFx: "chill", hint: "Every screen has four corners. Linger in each." },
  { id: "cheat-code", name: "Cheat code", trigger: "Press ↑ ↑ ↓ ↓ ← → ← → B A (outside a text box)", effect: "CHEAT ACTIVATED: the Retro CRT theme, BYTE in pixel shades, a coin rain", achievement: "cheat-code", minFx: "chill", hint: "Some codes are older than the web. ↑ ↑ …" },
  { id: "word-akshat", name: "Typed word · akshat", trigger: "Type akshat outside a text box", effect: "The letters rain down and bounce as physics blocks", minFx: "normal", hint: "Type the name. Not in a text box — anywhere else." },
  { id: "word-hire", name: "Typed word · hire", trigger: "Type hire outside a text box", effect: "Confetti, BYTE says “Excellent choice.” and the page flies to the Co-op Lobby", minFx: "chill", hint: "Type what recruiters are here to do." },
  { id: "word-bug", name: "Typed word · bug", trigger: "Type bug outside a text box", effect: "Three bugs scurry across the screen — squash them", minFx: "normal", hint: "Type what Akshat squashes for a living." },
  { id: "word-coffee", name: "Typed word · coffee", trigger: "Type coffee outside a text box", effect: "Steam rises from the cursor for 5 seconds", minFx: "normal", hint: "Type what powers every build." },
  { id: "word-sudo", name: "Typed word · sudo", trigger: "Type sudo outside a text box", effect: "Opens the terminal", minFx: "chill", speedrun: true, hint: "Admins type four letters before everything." },
  { id: "terminal", name: "Terminal · AKSHAT-OS", trigger: "Press ` (the key left of 1), the HUD's terminal button or the right-click menu", effect: "Opens AKSHAT-OS: type help", achievement: "hacker", minFx: "chill", speedrun: true, hint: "The key left of 1 opens a door for hackers." },
  { id: "devtools", name: "DevTools console", trigger: "Open the browser's console and call akshat.help() or akshat.hire()", effect: "A banner in the console and a window.akshat to play with", achievement: "console-cowboy", minFx: "chill", hint: "Developers: check your console." },
  { id: "proctor", name: "Proctor alert", trigger: "Switch to another tab and come back", effect: "The tab begs you to return; back here, the proctor noticed (QuizMUJ's tab-switch tracking)", achievement: "caught-switching-tabs", minFx: "chill", hint: "The proctor is watching. Switch tabs." },
  { id: "idle-sleep", name: "Idle · sleep", trigger: "Do nothing for 45 seconds", effect: "BYTE falls asleep and the grid plays an attract pattern", minFx: "chill", hint: "Leave BYTE alone for a while." },
  { id: "idle-bored", name: "Idle · bored", trigger: "Do nothing for 90 seconds", effect: "A “Bored? Squash some bugs” chip that opens Bug Whack", minFx: "chill", hint: "Leave it alone even longer." },
  { id: "night-owl", name: "Night owl", trigger: "Visit between midnight and 5 a.m. (your time)", effect: "BYTE wears a nightcap", achievement: "night-owl", minFx: "chill", hint: "Some visitors only come out at night." },
  { id: "context-menu", name: "Right-click menu", trigger: "Right-click the page (Shift + right-click keeps the browser's), or press Shift+F10", effect: "A game-style menu: copy email, résumé, sound, terminal, locate cursor, inspect", minFx: "chill", speedrun: true, hint: "Right-click somewhere that isn't a link." },
  { id: "select-byte", name: "Selection · BYTE", trigger: "Select the word BYTE anywhere on the page", effect: "BYTE blushes", minFx: "chill", hint: "Highlight the robot's name." },
  { id: "loot-chest", name: "Loot chest", trigger: "Rarely, entering a world (about 1 in 15, at most 3 a session) — click it within 6 seconds", effect: "+50 XP and a did-you-know from the résumé", minFx: "chill", hint: "Chests sometimes hop into the margins. Be quick." },
  { id: "milestone-clicks", name: "Milestone · 100 clicks", trigger: "Click 100 times", effect: "A mini fanfare", minFx: "chill", hint: "Click a lot." },
  { id: "milestone-time", name: "Milestone · 5 minutes", trigger: "Play for 5 minutes", effect: "A mini fanfare", minFx: "chill", hint: "Stay a while." },
  { id: "milestone-worlds", name: "Milestone · every world", trigger: "Visit every world", effect: "A mini fanfare (and Explorer)", achievement: "explorer", minFx: "chill", hint: "See everything." },
  { id: "patch-notes", name: "Patch notes", trigger: "Come back after the content changes (content.ts is hashed at build time)", effect: "A PATCH NOTES toast that opens the pause menu's list", minFx: "chill", hint: "Come back after an update." },
];

export const EGG_BY_ID: Readonly<Record<string, Egg>> = Object.fromEntries(EGGS.map((e) => [e.id, e]));

/** Typed words (outside fields, no modifier keys) → the egg they hatch. */
export const TYPED_WORDS: Readonly<Record<string, EggId>> = { akshat: "word-akshat", hire: "word-hire", bug: "word-bug", coffee: "word-coffee", sudo: "word-sudo" };
/** ↑ ↑ ↓ ↓ ← → ← → B A, as `KeyboardEvent.key` values (letters compared lower-case). */
export const CHEAT_CODE: readonly string[] = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
export const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
export type Corner = (typeof CORNERS)[number];

export const EGG_TIMING = {
  /** Hold the pointer (or a finger) in a corner this long. */
  cornerHoldMs: 600,
  /** The corner zone: a square this many CSS px from the viewport's corner. */
  cornerPx: 28,
  /** Typed letters older than this are forgotten. */
  wordGapMs: 1500,
  sleepAfterMs: 45000,
  boredAfterMs: 90000,
  chestOdds: 15,
  chestMax: 3,
  chestMs: 6000,
  steamMs: 5000,
  milestoneClicks: 100,
  milestonePlayedMs: 5 * 60 * 1000,
} as const;

/** Night owl: local time 00:00–04:59. */
export const isNightOwlHour = (d = new Date()): boolean => d.getHours() < 5;
