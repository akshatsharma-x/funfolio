// Commands: requests from server-rendered islands (PRESS START, SAVE FILE, Speedrun toggles…) to the game runtime,
// which loads lazily after hydration. Commands issued before it is ready are queued, then replayed in order.
// Keeps the store (zustand + registries) out of the initial bundle. Plain objects → serializable as server props.

import type { Point } from "./bus";

export type Command =
  | { type: "cta"; id: string; origin?: Point }
  | { type: "achievement"; id: string }
  | { type: "xp"; amount: number; reason: string; origin?: Point }
  | { type: "coin"; id: string; origin?: Point }
  /** A spare coin (sticker peels): +1 wallet once per id — not one of the 12 hidden coins. */
  | { type: "spare-coin"; id: string; origin?: Point }
  | { type: "download"; what: "resume" }
  | { type: "speedrun"; on: boolean | "toggle" }
  | { type: "theme"; value: "night" | "day" | "retro" | "toggle"; origin?: Point }
  | { type: "setting"; key: "fx" | "sound" | "cursorSize" | "reducedMotion" | "byteVisible"; value: string | boolean | number }
  | { type: "pause"; tab?: string }
  | { type: "preview-cursor-skin"; id: string }
  | { type: "item"; title: string; detail?: string };

type Handler = (command: Command) => void;

let handler: Handler | null = null;
const queue: Command[] = [];

export function command(...commands: Command[]): void {
  for (const c of commands) {
    if (handler) handler(c);
    else if (queue.length < 50) queue.push(c);
  }
}

export function setCommandHandler(next: Handler): () => void {
  handler = next;
  while (queue.length > 0) next(queue.shift() as Command);
  return () => {
    if (handler === next) handler = null;
  };
}
