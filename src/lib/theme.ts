// Theme switch with a circular sweep from the toggle (PART 3 #12) via the View Transitions API.
// Falls back to an instant switch without the API, without an origin, or under reduced motion.

import type { Point } from "./bus";
import { prefersReducedMotion } from "./hooks/useReducedMotion";

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

export function sweepTheme(apply: () => void, origin?: Point): void {
  const doc = document as TransitionDocument;
  if (!origin || typeof doc.startViewTransition !== "function" || prefersReducedMotion()) {
    apply();
    return;
  }
  const { x, y } = origin;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const transition = doc.startViewTransition(apply);
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {
      // transition skipped (e.g. tab hidden) — the theme is already applied
    });
}
