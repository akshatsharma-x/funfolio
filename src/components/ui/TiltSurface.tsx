"use client";

import { useRef, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";
import { useIsTouch } from "@/lib/hooks/useIsTouch";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

type TiltSurfaceProps = HTMLAttributes<HTMLElement> & {
  as: "div" | "article" | "li" | "section";
  /** Max tilt in degrees (Bible: ≤ 8°). Halved in CHILL mode. */
  max?: number;
  children: ReactNode;
};

/**
 * Tilts toward the mouse with a moving glare (CSS vars --rx/--ry/--gx/--gy, read by .sticker[data-tilt]).
 * Off on touch and under reduced motion. Never moves the real cursor (R2).
 */
export function TiltSurface({ as, max = 8, children, onPointerMove, onPointerLeave, ...rest }: TiltSurfaceProps) {
  const reduced = useReducedMotion();
  const touch = useIsTouch();
  const enabled = !reduced && !touch;
  const frame = useRef(0);

  const handleMove = (event: PointerEvent<HTMLElement>) => {
    onPointerMove?.(event);
    if (!enabled || event.pointerType !== "mouse") return;
    const el = event.currentTarget;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const px = (clientX - r.left) / r.width;
      const py = (clientY - r.top) / r.height;
      const limit = document.documentElement.getAttribute("data-fx") === "chill" ? max / 2 : max;
      el.style.setProperty("--rx", `${((0.5 - py) * 2 * limit).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((px - 0.5) * 2 * limit).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
    });
  };

  const handleLeave = (event: PointerEvent<HTMLElement>) => {
    onPointerLeave?.(event);
    cancelAnimationFrame(frame.current);
    event.currentTarget.style.removeProperty("--rx");
    event.currentTarget.style.removeProperty("--ry");
  };

  const Tag = as;
  return (
    <Tag {...rest} data-tilt={enabled ? "" : undefined} onPointerMove={handleMove} onPointerLeave={handleLeave}>
      {children}
    </Tag>
  );
}
