"use client";

import { useEffect } from "react";
import { command } from "@/lib/commands";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";

const ZOOM_MS = 380;

/**
 * The Arcade hall's one island (PART 11): Play on a cabinet (click, Enter or Space) zooms into its screen — a CRT-dark
 * panel grows from the screen to the whole viewport (pointer-events: none, under the top layer: the cursor stays on
 * top, R2) — then the game opens full-screen (openGame → the runtime's game host). Reduced motion: no zoom.
 * Hover lean, marquee flicker and joystick wiggle are CSS.
 */
export function ArcadeFx() {
  useEffect(() => {
    const section = document.getElementById("arcade");
    if (!section) return;
    const abort = new AbortController();
    let busy = false;
    section.addEventListener(
      "click",
      (e) => {
        const btn = (e.target as Element).closest<HTMLElement>("[data-play-game]");
        const id = btn?.dataset.playGame;
        if (!btn || !id || busy) return;
        btn.focus({ preventScroll: true }); // Safari doesn't focus clicked buttons — the dialog returns focus here on exit
        const screen = btn.closest(".cab")?.querySelector<HTMLElement>("[data-cab-screen]");
        if (!screen || prefersReducedMotion()) {
          command({ type: "openGame", id });
          return;
        }
        busy = true;
        const r = screen.getBoundingClientRect();
        const z = document.createElement("div");
        z.className = "arcade-zoom";
        z.setAttribute("aria-hidden", "true");
        Object.assign(z.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
        document.body.append(z);
        const sx = window.innerWidth / r.width;
        const sy = window.innerHeight / r.height;
        const tx = window.innerWidth / 2 - (r.left + r.width / 2);
        const ty = window.innerHeight / 2 - (r.top + r.height / 2);
        const grow = z.animate([{ transform: "none" }, { transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})` }], { duration: ZOOM_MS, easing: "cubic-bezier(0.7, 0, 0.84, 0)", fill: "forwards" });
        const done = () => {
          command({ type: "openGame", id });
          // fade the panel out under the dialog's pop-in (and never leave it behind)
          window.setTimeout(() => {
            z.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: "forwards" }).onfinish = () => z.remove();
            busy = false;
          }, 140);
        };
        grow.onfinish = done;
        grow.oncancel = done;
        window.setTimeout(() => z.isConnected && z.remove(), 2000);
      },
      { signal: abort.signal },
    );
    return () => abort.abort();
  }, []);
  return null;
}
