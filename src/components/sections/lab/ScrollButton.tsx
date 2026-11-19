"use client";

import { useState, type ReactNode } from "react";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { Modal } from "@/components/ui/Modal";
import { command } from "@/lib/commands";

/** [Read the scroll · Abstract] → the paper as an unrolling pixel scroll (the Modal, styled by .scroll-modal). */
export function ScrollButton({ id, all, title, children }: { id: string; all: string[]; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ArcadeButton
        size="sm"
        icon="scroll"
        data-fx-skip=""
        data-primary=""
        onClick={() => {
          setOpen(true);
          command({ type: "scroll", id, all });
        }}
      >
        Read the scroll · Abstract
      </ArcadeButton>
      <Modal open={open} onClose={() => setOpen(false)} title={title} className="scroll-modal">
        {children}
      </Modal>
    </>
  );
}
