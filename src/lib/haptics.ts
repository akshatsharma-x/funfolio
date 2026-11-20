// PART 17 · haptics on handheld devices: navigator.vibrate (where it exists) for 10–20ms — only on a coarse pointer,
// never under reduced motion, in CHILL or in Speedrun Mode, and never before the visitor's first tap.
import { prefersReducedMotion } from "./hooks/useReducedMotion";

/** Handheld Mode: a coarse pointer or a narrow screen (< 768px). CSS uses the same media query. */
export const HANDHELD_QUERY = "(pointer: coarse), (max-width: 47.99rem)";

export function haptic(ms = 12): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  const h = document.documentElement;
  if (prefersReducedMotion() || h.getAttribute("data-fx") === "chill" || h.getAttribute("data-mode") === "speedrun") return;
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  // only after the visitor has touched the page: Chrome blocks (and logs a console error for) a vibration before the
  // first tap — an achievement at load (Night Owl) or one earned by scrolling alone (Explorer) — PART 18
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  if (!activation?.hasBeenActive) return;
  try {
    navigator.vibrate(Math.max(10, Math.min(20, ms)));
  } catch {
    // some browsers throw without a user activation — haptics are a bonus
  }
}
