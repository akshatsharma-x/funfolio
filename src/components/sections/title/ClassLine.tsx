"use client";

import { useEffect, useRef } from "react";
import { bus } from "@/lib/bus";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";

const TYPE_MS = 22;

/**
 * Typewriter class line (PART 5): "AI/ML Engineer ▸ GenAI Builder ▸ …". The full line is always in the DOM (visible
 * without JS, reserving its space — no layout shift — and read once by screen readers); while typing, a typed copy is
 * drawn over the hidden ghost. Starts when the boot screen is gone; instant under reduced motion.
 */
export function ClassLine({ classes }: { classes: string[] }) {
  const line = useRef<HTMLParagraphElement>(null);
  const typed = useRef<HTMLSpanElement>(null);
  const full = classes.join(" ▸ ");

  useEffect(() => {
    const p = line.current;
    const t = typed.current;
    if (!p || !t) return;
    let timer = 0;
    const type = () => {
      if (prefersReducedMotion()) return;
      let n = 0;
      p.setAttribute("data-typing", "");
      const step = () => {
        n += 1;
        t.textContent = full.slice(0, n);
        if (n < full.length) timer = window.setTimeout(step, TYPE_MS);
        else {
          p.removeAttribute("data-typing");
          t.textContent = "";
        }
      };
      step();
    };
    if (document.documentElement.hasAttribute("data-boot")) {
      const off = bus.on("boot:done", () => {
        off();
        type();
      });
      return () => {
        off();
        window.clearTimeout(timer);
      };
    }
    type();
    return () => window.clearTimeout(timer);
  }, [full]);

  return (
    <p ref={line} className="title-classes">
      <span className="sr-only">Classes: {classes.join(", ")}.</span>
      <span className="title-classes__line" aria-hidden="true">
        <span className="title-classes__ghost">{full}</span>
        <span ref={typed} className="title-classes__typed" />
      </span>
    </p>
  );
}
