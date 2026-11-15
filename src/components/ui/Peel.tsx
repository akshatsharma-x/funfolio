"use client";

import { useId, useRef, useState, type ReactNode } from "react";

type PeelProps = {
  children: ReactNode;
  /** Accessible name of the corner button. */
  label?: string;
};

/**
 * Sticker corner peel (basic version; PART 4 adds the curl). Mouse: hovering the bottom-right corner reveals the
 * secret (a click keeps it open). Touch, pen and keyboard (Enter/Space on the focusable "peek" button) toggle it.
 */
export function Peel({ children, label = "Peek under the sticker" }: PeelProps) {
  const [open, setOpen] = useState(false);
  const pointer = useRef<string>("");
  const id = useId();

  return (
    <div className="peel" data-open={open ? "" : undefined} onPointerLeave={() => setOpen(false)}>
      <button
        type="button"
        className="peel__corner"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onPointerDown={(e) => {
          pointer.current = e.pointerType;
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setOpen(true);
        }}
        onClick={(e) => {
          // A mouse click right after the hover-open must not close it again; keyboard clicks have detail 0.
          const mouseClick = e.detail > 0 && pointer.current === "mouse";
          setOpen((v) => (mouseClick ? true : !v));
        }}
      />
      <div id={id} className="peel__secret" hidden={!open}>
        {children}
      </div>
    </div>
  );
}
