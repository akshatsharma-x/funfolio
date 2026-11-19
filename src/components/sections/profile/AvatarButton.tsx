"use client";

import { useRef, type ReactNode } from "react";
import { byte } from "@/lib/byte";
import { command } from "@/lib/commands";

/**
 * The Character Card's avatar (or photo) as a button: a click (or Enter / Space) makes the avatar wave and BYTE fly
 * in for a high-five (byte.visit — it never lands on anything clickable; from its corner under reduced motion).
 */
export function AvatarButton({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      className="avatar-btn"
      data-avatar=""
      data-primary=""
      data-fx-skip=""
      data-cursor-label="HI!"
      aria-label={label}
      onClick={() => {
        const el = ref.current;
        if (!el || el.hasAttribute("data-wave")) return;
        el.setAttribute("data-wave", ""); // the wave is 900ms (none under reduced motion — the timer still resets it)
        window.setTimeout(() => el.removeAttribute("data-wave"), 950);
        byte.visit("[data-avatar]");
        command({ type: "cta", id: "high-five" });
      }}
    >
      {children}
    </button>
  );
}
