"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";

type PlayOnViewProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Share of the element that must be visible before it plays. */
  threshold?: number;
};

/**
 * One-shot "play on first view" wrapper (rings fill, radars draw…). The server-rendered state is the FINAL one, so
 * without JS, under reduced motion, or when it is already on screen at load nothing ever hides. Otherwise it sets
 * data-play="armed" (the CSS shows the start pose) and "run" when it scrolls into view; CSS owns the animation.
 */
export function PlayOnView({ children, threshold = 0.35, ...rest }: PlayOnViewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return; // visible at load → no flash
    el.dataset.play = "armed";
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        raf = requestAnimationFrame(() => {
          el.dataset.play = "run";
        });
      },
      { threshold },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      delete el.dataset.play;
    };
  }, [threshold]);

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
