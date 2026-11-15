import type Lenis from "lenis";
import { useSyncExternalStore } from "react";
import { getLenis, subscribeLenis } from "../scroll";

/**
 * The shared Lenis instance (Lenis ↔ GSAP ticker ↔ ScrollTrigger.update, wired in lib/scroll.ts and started by
 * <SmoothScroll/>), or null under reduced motion / before it loads. Use for scrollTo, stop/start, velocity.
 */
export function useLenis(): Lenis | null {
  return useSyncExternalStore(subscribeLenis, getLenis, () => null);
}
