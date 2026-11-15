// Typed event bus for side effects (Bible §6: "side effects go through src/lib/bus.ts so the store stays pure").
// The store emits; toasts, sfx, fx, banners and later-part systems listen.

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
  "item:acquired": { title: string; detail?: string; icon?: string };
  "world:enter": { id: string };
  /** First time a world scrolls into view (PART 4 plays the WorldHeader intro). */
  "world:first-visit": { id: string };
  /** Pause menu opened/closed — games and idle loops pause/resume. */
  "game:pause": Record<string, never>;
  "game:resume": Record<string, never>;
  "shop:bought": { itemId: string };
  "shop:denied": { itemId: string; reason: "owned" | "locked" | "funds" };
  "save:reset": Record<string, never>;
  /** Backtick (PART 16). */
  "terminal:toggle": Record<string, never>;
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
