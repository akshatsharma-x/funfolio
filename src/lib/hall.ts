// Tiny shared state between the Hall of Fame's HTML pedestal buttons (initial bundle) and its lazy 3D canvas
// (PART 14): which trophy is hovered or focused, which one the camera has dollied to, and whether the 3D view is live.
// No dependencies, so it stays cheap in the initial bundle (like src/lib/island.ts for the Title Screen).

type State = {
  hovered: string | null;
  /** The trophy whose detail card is open (the camera dollies to it). */
  selected: string | null;
  /** The 3D view is drawing (otherwise the CSS medallions are the hall). */
  live: boolean;
};

const state: State = { hovered: null, selected: null, live: false };
const listeners = new Set<() => void>();

export const hall = {
  get: (): Readonly<State> => state,
  set(patch: Partial<State>) {
    let changed = false;
    for (const k of Object.keys(patch) as (keyof State)[]) {
      if (state[k] !== patch[k]) {
        (state as Record<string, unknown>)[k] = patch[k];
        changed = true;
      }
    }
    if (changed) listeners.forEach((fn) => fn());
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
