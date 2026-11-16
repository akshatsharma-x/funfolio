"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type PeelProps = {
  children: ReactNode;
  /** Accessible name of the corner button. */
  label?: string;
};

/**
 * Sticker corner peel (PART 4): hovering the bottom-right corner curls the sticker back and reveals a secret
 * (fun fact, pixel doodle, code joke, rarely a spare coin). Mouse: hover opens (a click keeps it open), leaving the
 * card closes it. Touch, pen and keyboard: the focusable "peek" corner button toggles it (aria-expanded).
 */
export function Peel({ children, label = "Peek under the sticker" }: PeelProps) {
  const [open, setOpen] = useState(false);
  const pointer = useRef<string>("");
  const closeTimer = useRef(0);
  const id = useId();
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <div
      className="peel"
      data-open={open ? "" : undefined}
      onPointerEnter={() => window.clearTimeout(closeTimer.current)}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        // small hysteresis: a pixel of jitter at the edge must not flicker the curl
        window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => setOpen(false), 160);
      }}
    >
      <div id={id} className="peel__secret" hidden={!open}>
        {children}
      </div>
      <button
        type="button"
        className="peel__corner"
        data-cursor-label="PEEK"
        data-fx-skip=""
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
      >
        <span className="peel__flap" aria-hidden="true" />
      </button>
    </div>
  );
}
