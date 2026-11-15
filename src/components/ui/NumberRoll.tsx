"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";

type Part = { kind: "digit"; ch: string; d: number; i: number } | { kind: "text"; text: string };

/** "~30% fewer" → ["~", 3, 0, "% fewer"]: digits roll, everything else is static text. */
function tokenize(value: string): Part[] {
  const parts: Part[] = [];
  let i = 0;
  for (const ch of value) {
    if (ch >= "0" && ch <= "9") {
      parts.push({ kind: "digit", ch, d: Number(ch), i: i++ });
    } else {
      const last = parts[parts.length - 1];
      if (last?.kind === "text") last.text += ch;
      else parts.push({ kind: "text", text: ch });
    }
  }
  return parts;
}

type NumberRollProps = {
  value: string;
  className?: string;
  /** "view" (default): roll the first time it scrolls into view · "mount": roll right away (toasts, banners). */
  play?: "view" | "mount";
};

/**
 * Slot-machine digits on first view (Bible §4). Renders the value exactly as written ("$0.08–0.11/run", "10,000+"):
 * the real characters stay in the DOM for SEO, copy/paste and screen readers; the rolling strips are CSS-generated.
 * Numbers already on screen at load, and everything under reduced motion, simply show the final value.
 */
export function NumberRoll({ value, className, play = "view" }: NumberRollProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const parts = useMemo(() => tokenize(value), [value]);
  const digits = parts.filter((p) => p.kind === "digit").length;

  useEffect(() => {
    const el = ref.current;
    if (!el || digits === 0 || prefersReducedMotion()) return;
    let timer = 0;
    const roll = () => {
      el.dataset.state = "rolling";
      timer = window.setTimeout(() => {
        el.dataset.state = "done";
      }, 900 + digits * 55 + 120);
    };
    if (play === "mount") {
      const raf = requestAnimationFrame(roll);
      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(timer);
        delete el.dataset.state;
      };
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return; // visible at load → no flash
    el.dataset.state = "armed";

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        requestAnimationFrame(roll);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      delete el.dataset.state;
    };
  }, [digits, value, play]);

  return (
    <span ref={ref} className={cn("nr", className)}>
      {parts.map((p, idx) =>
        p.kind === "digit" ? (
          <span key={idx} className="nr__d" style={{ "--d": p.d, "--i": p.i } as CSSProperties}>
            <span>{p.ch}</span>
          </span>
        ) : (
          <span key={idx}>{p.text}</span>
        ),
      )}
    </span>
  );
}
