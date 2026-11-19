// Tiny shared state between the Title Screen's HTML landmark buttons (initial bundle) and the lazy 3D island:
// which landmark is hovered/focused, the "go" request (camera swoop, then scroll), the spin (to peek behind the tower)
// and the scroll-out dive progress. No dependencies, so it stays cheap in the initial bundle.

import type { LandmarkId } from "@/content/landmarks";

type State = {
  hovered: LandmarkId | null;
  /** The 3D scene is live (else the SVG island is the target). */
  live: boolean;
  /** 0 = front, 1 = back (the island turned to show what hides behind the Quest Tower). */
  spun: boolean;
  /** Scroll-out dive 0…1. */
  dive: number;
  /** Right edge of the Title's text column (viewport px; 0 when the island isn't beside it): the moving plane's
   * button hides while it crosses the text, so it never steals a click or a hover from the name and the CTAs. */
  textRight: number;
  /** PART 17 · phones: the visitor tapped "Enable tilt" — device orientation drives the ≤ 3° parallax. */
  tilt: boolean;
};

const state: State = { hovered: null, live: false, spun: false, dive: 0, textRight: 0, tilt: false };
const listeners = new Set<() => void>();
let goHandler: ((id: LandmarkId) => Promise<void>) | null = null;
let planeHandler: (() => void) | null = null;

export const island = {
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
  /** The 3D scene registers its camera swoop; without it (SVG tier) "go" resolves at once. */
  onGo(fn: ((id: LandmarkId) => Promise<void>) | null) {
    goHandler = fn;
  },
  go(id: LandmarkId): Promise<void> {
    return goHandler ? goHandler(id) : Promise.resolve();
  },
  onPlane(fn: (() => void) | null) {
    planeHandler = fn;
  },
  plane() {
    planeHandler?.();
  },
};
