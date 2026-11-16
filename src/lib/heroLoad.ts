// Loading progress of the hero 3D island (PART 5) — the boot screen is a real preloader for it.
// The Title island reports: wanted (it will load during the boot), chunk progress (dynamic import), drei useProgress
// (asset loaders, if any) and the first rendered frame (done). Shared module instance across chunks.

type HeroState = { wanted: boolean; progress: number; done: boolean };
const state: HeroState = { wanted: false, progress: 0, done: false };
const listeners = new Set<() => void>();

export const heroLoad = {
  get: (): Readonly<HeroState> => state,
  report(patch: Partial<HeroState>) {
    Object.assign(state, patch);
    if (patch.progress !== undefined) state.progress = Math.max(0, Math.min(1, patch.progress));
    if (state.done) state.progress = 1;
    listeners.forEach((fn) => fn());
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
