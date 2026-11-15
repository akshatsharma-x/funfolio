"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { contrastRatio, parseCssColor, rateContrast } from "@/lib/contrast";

type ContrastSampleProps = {
  /** Any CSS color, e.g. "var(--fg-pink)". */
  fg: string;
  bg: string;
  label: string;
  /** Large text (≥ 24px / ≥ 18.66px bold) only needs 3:1. */
  large?: boolean;
  className?: string;
};

/**
 * Renders a text sample and MEASURES its rendered contrast (getComputedStyle), so the ratio always reflects the
 * real CSS in the current theme scope. Re-measures when the page theme or world changes.
 */
export function ContrastSample({ fg, bg, label, large = false, className }: ContrastSampleProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    let settle = 0;
    const measure = () => {
      const style = getComputedStyle(el);
      const f = parseCssColor(style.color);
      const b = parseCssColor(style.backgroundColor);
      setRatio(f && b ? contrastRatio(f, b) : null);
    };
    frame = requestAnimationFrame(measure);
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      frame = requestAnimationFrame(measure);
      settle = window.setTimeout(measure, 700); // after the 600ms --world transition
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-world"] });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      observer.disconnect();
    };
  }, []);

  const min = large ? 3 : 4.5;
  const verdict = ratio === null ? "…" : `${ratio.toFixed(2)}:1 · ${ratio >= min ? rateContrast(ratio) : "FAIL"}`;

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      <span
        ref={ref}
        className={cn("rounded-md border-2 border-ink px-2 py-1 font-semibold", large && "font-display text-[24px] leading-tight")}
        style={{ color: fg, backgroundColor: bg }}
      >
        {label}
      </span>
      <span className={cn("font-mono text-xs", ratio !== null && ratio < min && "font-bold text-red-fg")}>{verdict}</span>
    </span>
  );
}
