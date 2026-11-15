"use client";

import { useState } from "react";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { Modal } from "@/components/ui/Modal";
import { player } from "@/content/content";

/** Opens the Modal (focus trap, Esc, backdrop click, scroll lock). */
export function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ArcadeButton icon="chest" cursorLabel="OPEN" onClick={() => setOpen(true)}>
        Open save file
      </ArcadeButton>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Save file"
        description="Modal demo: Tab stays inside, Esc or the backdrop closes it, and focus returns to the button."
        footer={
          <>
            <ArcadeButton variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </ArcadeButton>
            <ArcadeButton onClick={() => setOpen(false)}>Got it</ArcadeButton>
          </>
        }
      >
        <p className="read">
          {player.name} · {player.status}
        </p>
      </Modal>
    </>
  );
}

/** Toggles the button's LOADING… pixel-dot state for 2.4s. */
export function LoadingDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <ArcadeButton
      variant="secondary"
      cursorLabel="LAUNCH"
      loading={loading}
      onClick={() => {
        setLoading(true);
        window.setTimeout(() => setLoading(false), 2400);
      }}
    >
      Launch
    </ArcadeButton>
  );
}
