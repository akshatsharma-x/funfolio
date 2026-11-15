// XP & levels (Bible §6, PART 3). LV 1–10.

import type { PrizeId } from "./prizes";

export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200] as const;
export const LEVEL_TITLES = [
  "Lurker",
  "Visitor",
  "Explorer",
  "Adventurer",
  "Quest Taker",
  "Bug Hunter",
  "Power User",
  "Speedrunner",
  "Legend",
  "Hire-Worthy",
] as const;
export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

/** What reaching a level grants (shown on the level-up banner). */
export const LEVEL_REWARDS: Readonly<Partial<Record<number, PrizeId>>> = {
  3: "hat-party",
  5: "cursor-retro-green",
  7: "theme-retro",
  10: "cursor-rainbow",
};

/** XP economy. One-time reasons (visit/open/cta/coin/achievement) pay once; game XP is capped per session. */
export const XP_RULES = {
  firstVisit: 50,
  openDetails: 10,
  cta: 5,
  coin: 25,
  gameSessionCap: 200,
} as const;

export function levelForXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  return level;
}

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(Math.max(level, 1), MAX_LEVEL) - 1];
}

/** Progress inside the current level: 0..1 (1 at max level). */
export function levelProgress(xp: number): { level: number; title: string; into: number; span: number; ratio: number } {
  const level = levelForXp(xp);
  if (level >= MAX_LEVEL) return { level, title: levelTitle(level), into: 0, span: 0, ratio: 1 };
  const floor = LEVEL_THRESHOLDS[level - 1];
  const span = LEVEL_THRESHOLDS[level] - floor;
  return { level, title: levelTitle(level), into: xp - floor, span, ratio: (xp - floor) / span };
}
