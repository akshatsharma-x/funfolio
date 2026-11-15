"use client";

import { useEffect } from "react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { startSmoothScroll } from "@/lib/scroll";

/** Mounts Lenis (synced to the GSAP ticker + ScrollTrigger) once for the whole site; native scroll under reduced motion. */
export function SmoothScroll() {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    return startSmoothScroll();
  }, [reduced]);
  return null;
}
