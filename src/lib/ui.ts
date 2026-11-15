// Session-only UI state (not persisted): current world, pause menu, previous visit. The save lives in store.ts.

import { create } from "zustand";
import type { WorldId } from "@/content/worlds";

export const PAUSE_TABS = ["resume", "map", "achievements", "settings", "controls", "patch", "save", "reset"] as const;
export type PauseTab = (typeof PAUSE_TABS)[number];

type UiState = {
  currentWorld: WorldId;
  pauseOpen: boolean;
  /** Mount the (lazy) pause menu only once it has been opened. */
  pauseEverOpened: boolean;
  pauseTab: PauseTab;
  /** meta.lastVisit before this session started (boot "CONTINUE?" in PART 5). */
  previousVisit: number | null;
  setCurrentWorld: (id: WorldId) => void;
  openPause: (tab?: PauseTab) => void;
  closePause: () => void;
  setPauseTab: (tab: PauseTab) => void;
  setPreviousVisit: (ts: number | null) => void;
};

export const useUi = create<UiState>()((set) => ({
  currentWorld: "title",
  pauseOpen: false,
  pauseEverOpened: false,
  pauseTab: "resume",
  previousVisit: null,
  setCurrentWorld: (id) => set({ currentWorld: id }),
  openPause: (tab) => set((s) => ({ pauseOpen: true, pauseEverOpened: true, pauseTab: tab ?? (s.pauseOpen ? s.pauseTab : "resume") })),
  closePause: () => set({ pauseOpen: false }),
  setPauseTab: (tab) => set({ pauseTab: tab }),
  setPreviousVisit: (ts) => set({ previousVisit: ts }),
}));

export function isPauseTab(v: unknown): v is PauseTab {
  return (PAUSE_TABS as readonly unknown[]).includes(v);
}
