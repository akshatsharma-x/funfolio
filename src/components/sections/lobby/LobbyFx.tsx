"use client";

import { useEffect } from "react";

/**
 * The Co-op Lobby's island (PART 15). Its logic (`lobbyRun.ts` — validation with zod/mini, the fold, the flight, the
 * portals) is a chunk of its own, imported right after hydration: off the initial bundle (R7), and loaded long before
 * anyone can type a message, so the contact flow itself never touches the network (R10). Until it arrives the form is
 * what it is without JavaScript: a plain mailto: form with native checks (R3).
 */
export function LobbyFx() {
  useEffect(() => {
    const section = document.getElementById("lobby");
    if (!section) return;
    let off: (() => void) | null = null;
    let gone = false;
    void import("./lobbyRun")
      .then((m) => {
        if (!gone) off = m.mountLobby(section);
      })
      .catch(() => {}); // offline (PART 18): the plain mailto: form still works
    return () => {
      gone = true;
      off?.();
    };
  }, []);
  return null;
}
