// Tiny typed event bus for side effects (Bible §6 / PART 3: "side effects go through src/lib/bus.ts so the store stays
// pure"). PART 2 adds the cursor events; PART 3 extends BusEvents with achievements, toasts, sfx and fx.

export type BusEvents = {
  /** Shake-to-find fired at (x, y). PART 3 unlocks "Shaky Hands" from it. */
  "cursor:shake": { x: number; y: number };
  /** Ask the cursor layer to show where the pointer is (hotkey L, settings, BYTE…). */
  "cursor:locate": { source: "key" | "api" };
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
