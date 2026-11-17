"use client";

import { useRef } from "react";
import type { ArcadeData } from "@/content/arcade";
import { useUi } from "@/lib/ui";
import { Modal } from "@/components/ui/Modal";
import { GameShell, type ShellHandle } from "./GameShell";

/**
 * openGame(id) lands here (PART 11): the open game, full-screen in the Modal (top layer — the pixel cursor stays on
 * top, R2), on any page — the Arcade, the Quest Log's and the Vault's side quests, and later the 404 page and the idle
 * screensaver. Esc pauses a running game first; the Eject button (and Esc when not playing) leaves; focus returns to
 * whatever opened it. Lazy: mounted by the runtime after the first openGame.
 */
export default function GameHost({ data }: { data: ArcadeData }) {
  const game = useUi((s) => s.game);
  const shown = useUi((s) => s.lastGame);
  const shell = useRef<ShellHandle>(null);
  const def = shown ? data.games[shown.id] : null;

  return (
    <Modal
      open={!!game}
      onClose={() => useUi.getState().closeGame()}
      onEscape={() => shell.current?.escape() ?? false}
      title={
        def ? (
          <>
            {def.name} <span className="gshell__plain">· {def.basedOn || "Mini-game"}</span>
          </>
        ) : (
          "Arcade"
        )
      }
      size="full"
      dismissOnBackdrop={false}
      className="game-modal"
    >
      {shown ? <GameShell key={`${shown.id}-${shown.nonce}`} ref={shell} id={shown.id} data={data} active={!!game} /> : null}
    </Modal>
  );
}
