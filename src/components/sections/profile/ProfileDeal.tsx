"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { revealElement } from "@/lib/scroll";

const STAGGER = 50;
const DURATION = 640;

/**
 * The character-sheet bento "deals" its tiles from a deck in the middle of the screen the first time it comes into
 * view (50ms stagger, back.out); under reduced motion they just fade in. Tiles are never hidden without JS, in
 * Speedrun Mode, or when the grid is already on screen at load (deep link) — no flash, nothing to wait for.
 */
export function ProfileDeal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = ref.current;
    if (!grid || document.documentElement.dataset.mode === "speedrun") return;
    const r = grid.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;
    const reduced = prefersReducedMotion();
    grid.dataset.deal = "armed";
    const tiles = [...grid.children] as HTMLElement[];
    const clear = () => tiles.forEach((el) => ["--deal-i", "--deal-dx", "--deal-dy", "--deal-rot"].forEach((p) => el.style.removeProperty(p)));
    let timer = 0;
    let skipped = false;
    // PART 18 · a keyboard visitor tabbing in gets no deal: an armed tile is invisible but focusable, and one flying in
    // moves the focus with it — the tiles are simply there, and the focused one is shown whole under the HUD (2.4.11)
    const onFocusIn = (e: FocusEvent) => {
      if (grid.dataset.deal !== "done") {
        skipped = true;
        io.disconnect();
        window.clearTimeout(timer);
        grid.dataset.deal = "done";
        clear();
      }
      const t = e.target;
      if (t instanceof HTMLElement) requestAnimationFrame(() => revealElement(t));
    };
    grid.addEventListener("focusin", onFocusIn);
    const io = new IntersectionObserver(
      (entries) => {
        if (skipped || !entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        // the deck sits in the middle of the grid's visible part
        const g = grid.getBoundingClientRect();
        const top = Math.max(g.top, 0);
        const bottom = Math.min(g.bottom, window.innerHeight);
        const deck = { x: g.left + g.width / 2, y: (top + bottom) / 2 };
        tiles.forEach((el, i) => {
          const t = el.getBoundingClientRect();
          el.style.setProperty("--deal-i", String(i));
          el.style.setProperty("--deal-dx", `${Math.round(deck.x - (t.left + t.width / 2))}px`);
          el.style.setProperty("--deal-dy", `${Math.round(deck.y - (t.top + t.height / 2))}px`);
          el.style.setProperty("--deal-rot", `${((i * 37) % 17) - 8}deg`);
        });
        grid.dataset.deal = reduced ? "fade" : "play";
        timer = window.setTimeout(() => {
          grid.dataset.deal = "done";
          clear();
        }, tiles.length * STAGGER + DURATION + 80);
      },
      { threshold: 0.08 },
    );
    io.observe(grid);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      grid.removeEventListener("focusin", onFocusIn);
      delete grid.dataset.deal;
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
