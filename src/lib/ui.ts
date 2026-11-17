// Session-only UI state (not persisted): current world, pause menu, previous visit. The save lives in store.ts.

import { create } from "zustand";
import type { WorldId } from "@/content/worlds";

export const PAUSE_TABS = ["resume", "map", "achievements", "prizes", "settings", "controls", "patch", "save", "reset"] as const;
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
  /** PART 11 — the open arcade game (any page; `nonce` remounts the shell for every opening). */
  game: { id: string; nonce: number } | null;
  /** The game the host keeps rendering while its dialog animates closed. */
  lastGame: { id: string; nonce: number } | null;
  /** Mount the (lazy) game host only once a game has been opened. */
  gameEverOpened: boolean;
  openGame: (id: string) => void;
  closeGame: () => void;
  /** After the dialog's close animation: forget the last game, so its shell (and any WebGL canvas) unmounts. */
  clearLastGame: () => void;
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
  game: null,
  lastGame: null,
  gameEverOpened: false,
  openGame: (id) =>
    set((s) => {
      const game = { id, nonce: (s.lastGame?.nonce ?? 0) + 1 };
      return { game, lastGame: game, gameEverOpened: true, pauseOpen: false };
    }),
  closeGame: () => set({ game: null }),
  clearLastGame: () => set((s) => (s.game ? {} : { lastGame: null })),
}));

export function isPauseTab(v: unknown): v is PauseTab {
  return (PAUSE_TABS as readonly unknown[]).includes(v);
}
