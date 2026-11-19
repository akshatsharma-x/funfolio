// Typed event bus for side effects (Bible §6: "side effects go through src/lib/bus.ts so the store stays pure").
// The store emits; toasts, sfx, fx, banners and later-part systems listen.

import type { ByteMood } from "./byte";

export type Point = { x: number; y: number };

export type BusEvents = {
  /** Shake-to-find fired at (x, y) → "shaky-hands". */
  "cursor:shake": Point;
  /** Ask the cursor layer to show where the pointer is (hotkey L, settings, BYTE…). */
  "cursor:locate": { source: "key" | "api" };
  /** XP actually granted (after one-time + session caps). origin = where it was earned, for the "+XP" ghost. */
  "xp:gained": { amount: number; reason: string; total: number; origin?: Point };
  "level:up": { level: number; title: string; rewards: string[] };
  "achievement:unlocked": { id: string };
  "coin:collected": { id: string; name: string; found: number; total: number; origin?: Point };
  /** Small "ITEM ACQUIRED" toasts: copied email, downloads, prizes… */
  "item:acquired": { title: string; detail?: string; icon?: string; kicker?: string };
  "world:enter": { id: string };
  /** First time a world scrolls into view (PART 4 plays the WorldHeader intro). */
  "world:first-visit": { id: string };
  /** Pause menu opened/closed — games and idle loops pause/resume. */
  "game:pause": Record<string, never>;
  "game:resume": Record<string, never>;
  "shop:bought": { itemId: string };
  /** PART 11 · arcade rewards paid into the wallet (after the session cap). */
  "coins:earned": { amount: number; reason: string; total: number };
  "shop:denied": { itemId: string; reason: "owned" | "locked" | "funds" };
  "save:reset": Record<string, never>;
  /** Backtick (PART 16). */
  "terminal:toggle": Record<string, never>;
  /** BYTE (PART 4) — use the facade in src/lib/byte.ts. */
  "byte:say": { text: string; mood?: ByteMood; ms?: number; now?: boolean };
  "byte:react": { mood: ByteMood };
  "byte:point": { selector: string };
  "byte:visit": { selector: string; text?: string };
  /** Something clickable appeared without a scroll or a layout change (a pop-in, a card) — BYTE re-checks its spot. */
  "byte:recheck": Record<string, never>;
  /** PART 15 · "Back to top": BYTE lights a jetpack while the page flies up. */
  "byte:jetpack": Record<string, never>;
  /** A WorldHeader intro started (PART 4). */
  "world:intro": { id: string };
  /** The boot screen is gone and the Title Screen is revealed (PART 5) — typewriters, blinks and BYTE's tips start. */
  "boot:done": { skipped: boolean };
  /** PART 7 · a soft gate opened (the runtime stored it; the gate's own island plays the unlock). */
  "gate:open": { id: string; how: string };
  /** PART 7 · the Launchpad hands its remaining crates (screen rects) to the Quest Log heading. */
  "gate:assemble": { crates: { x: number; y: number; w: number; h: number; angle: number; label: string }[] };
  /** Marks a world-header intro as already seen (another animation is about to own that header). */
  "intro:skip": { id: string };
  /** PART 13 · open a Skill Tree view (the JD Scanner side quest lands on "jd"): switch, scroll there, focus it. */
  "skills:open": { tab: "tree" | "inventory" | "jd" };
  /** PART 13 · insert a cartridge in the Vault (a skill's "Used in" project link, once the page has scrolled there). */
  "vault:insert": { id: string };
};

type EventName = keyof BusEvents;
type Handler<K extends EventName> = (payload: BusEvents[K]) => void;

const handlers = new Map<EventName, Set<(payload: never) => void>>();

export const bus = {
  on<K extends EventName>(type: K, handler: Handler<K>): () => void {
    let set = handlers.get(type);
    if (!set) {
      set = new Set();
      handlers.set(type, set);
    }
    set.add(handler as (payload: never) => void);
    return () => {
      set.delete(handler as (payload: never) => void);
    };
  },
  emit<K extends EventName>(type: K, payload: BusEvents[K]): void {
    handlers.get(type)?.forEach((h) => (h as Handler<K>)(payload));
  },
};
