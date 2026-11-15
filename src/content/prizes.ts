// Prize registry (Bible §6 Prize Counter — UI in PART 11). Cosmetic only. Prices are in wallet coins (hidden coins +
// arcade rewards). Some prizes are granted by levels (levels.ts) or achievements (ACHIEVEMENT_GRANTS) instead.

import type { CursorSkinId } from "@/components/cursor/skins";

export type PrizeSlot = "cursorSkin" | "theme" | "byteHat" | "confetti";
export type ByteHat = "party" | "crown" | "headphones" | "wizard";
export type ConfettiStyle = "pixels" | "stars" | "hearts" | "coins";

export type Prize = {
  id: string;
  slot: PrizeSlot;
  /** What gets equipped (a cursor skin id, theme, hat or confetti style). */
  value: string;
  name: string;
  price: number;
  /** Not purchasable; granted by this achievement. */
  grantedBy?: string;
};

export const PRIZES = [
  { id: "cursor-pixel-pop", slot: "cursorSkin", value: "pixel-pop", name: "Pixel Pop cursor", price: 0 },
  { id: "cursor-retro-green", slot: "cursorSkin", value: "retro-green", name: "Retro Green cursor", price: 5 },
  { id: "cursor-pixel-sword", slot: "cursorSkin", value: "pixel-sword", name: "Pixel Sword cursor", price: 6 },
  { id: "cursor-robo-glove", slot: "cursorSkin", value: "robo-glove", name: "Robo Glove cursor", price: 6 },
  { id: "cursor-rainbow", slot: "cursorSkin", value: "rainbow", name: "Rainbow cursor", price: 8 },
  { id: "cursor-golden", slot: "cursorSkin", value: "golden", name: "Golden cursor", price: 0, grantedBy: "treasure-hunter" },
  { id: "theme-retro", slot: "theme", value: "retro", name: "Retro CRT theme", price: 10 },
  { id: "hat-party", slot: "byteHat", value: "party", name: "Party hat for BYTE", price: 3 },
  { id: "hat-headphones", slot: "byteHat", value: "headphones", name: "Headphones for BYTE", price: 4 },
  { id: "hat-wizard", slot: "byteHat", value: "wizard", name: "Wizard hat for BYTE", price: 6 },
  { id: "hat-crown", slot: "byteHat", value: "crown", name: "Crown for BYTE", price: 8 },
  { id: "confetti-pixels", slot: "confetti", value: "pixels", name: "Pixel confetti", price: 0 },
  { id: "confetti-stars", slot: "confetti", value: "stars", name: "Star confetti", price: 3 },
  { id: "confetti-hearts", slot: "confetti", value: "hearts", name: "Heart confetti", price: 3 },
  { id: "confetti-coins", slot: "confetti", value: "coins", name: "Coin confetti", price: 5 },
] as const satisfies readonly Prize[];

export type PrizeId = (typeof PRIZES)[number]["id"];

export const PRIZE_BY_ID: Readonly<Record<string, Prize>> = Object.fromEntries(PRIZES.map((p) => [p.id, p]));

/** Owned by every new save. */
export const DEFAULT_OWNED: readonly PrizeId[] = ["cursor-pixel-pop", "confetti-pixels"];

/** Achievements that grant a prize when they unlock. */
export const ACHIEVEMENT_GRANTS: Readonly<Record<string, PrizeId>> = {
  "treasure-hunter": "cursor-golden",
  "cheat-code": "theme-retro",
};

export const DEFAULT_EQUIPPED: { cursorSkin: CursorSkinId; theme: "night" | "day" | "retro"; byteHat: ByteHat | null; confetti: ConfettiStyle } = {
  cursorSkin: "pixel-pop",
  theme: "night",
  byteHat: null,
  confetti: "pixels",
};
