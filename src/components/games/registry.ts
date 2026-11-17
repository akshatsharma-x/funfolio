// openGame(id) → this registry (PART 11): how each game is played, its goal line and its lazy module. What a game is
// *based on* (and its "That's real:" line) comes from content.ts via the server (src/content/arcade.ts).

import type { ComponentType } from "react";
import type { ArcadeGame } from "@/content/arcade";
import type { CursorVariant } from "@/components/cursor/skins";
import type { GameProps } from "./types";

export type HowStep = { keys: readonly string[]; text: string };
export type GameMeta = {
  /** Keyboard path (R5), shown as key icons on the title card. */
  how: readonly HowStep[];
  /** Mouse + touch, one line. */
  touch: string;
  goal: (g: ArcadeGame) => string;
  /** The game cursor while playing (useGameCursor); none = the normal pointer. */
  cursor?: CursorVariant;
  load: () => Promise<{ default: ComponentType<GameProps> }>;
};

export const TOKEN_SQUEEZE_SECONDS = 30;
export const CACHE_HIT_SECONDS = 60;
export const BUG_WHACK_SECONDS = 45;
export const BUG_WHACK_TARGET = 250;

export const GAME_META: Readonly<Record<string, GameMeta>> = {
  "token-squeeze": {
    how: [
      { keys: ["←", "→", "↑", "↓"], text: "pick a word" },
      { keys: ["Enter"], text: "squeeze it out" },
    ],
    touch: "Click or tap the filler words. Squeezing a word that matters costs MEANING −5.",
    goal: (g) => `Squeeze ${g.target ?? 22}% of the tokens out in ${TOKEN_SQUEEZE_SECONDS}s — and keep the meaning.`,
    load: () => import("./token-squeeze/TokenSqueeze"),
  },
  "cache-hit": {
    how: [
      { keys: ["←", "→", "↑", "↓"], text: "move" },
      { keys: ["Enter"], text: "flip a card" },
    ],
    touch: "Click or tap two cards: a matching pair is a cache hit.",
    goal: () => `Match all 8 pairs in ${CACHE_HIT_SECONDS}s. Every miss lowers your hit rate.`,
    load: () => import("./cache-hit/CacheHit"),
  },
  "bug-whack": {
    how: [
      { keys: ["1", "…", "9"], text: "whack that editor (the numpad works by position)" },
    ],
    touch: "Click or tap the bugs. Leave the friendly features alone — they cost a life.",
    goal: () => `Score ${BUG_WHACK_TARGET} in ${BUG_WHACK_SECONDS}s. It speeds up. 3 lives.`,
    cursor: "crosshair",
    load: () => import("./bug-whack/BugWhack"),
  },
};
