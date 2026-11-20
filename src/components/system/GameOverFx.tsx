"use client";

import { useEffect } from "react";

/**
 * The 404 page's island (PART 15): a loader for `gameOverRun.ts`. Next ships the root not-found boundary's client
 * code with every page, so this stays a few hundred bytes and the countdown arrives as a chunk of its own.
 */
export function GameOverFx() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-gameover]");
    if (!root) return;
    let off: (() => void) | null = null;
    let gone = false;
    void import("./gameOverRun")
      .then((m) => {
        if (!gone) off = m.runGameOver(root);
      })
      .catch(() => {}); // offline (PART 18): CONTINUE ▶ is a plain link home
    return () => {
      gone = true;
      off?.();
    };
  }, []);
  return null;
}
