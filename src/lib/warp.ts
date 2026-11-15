// Quick warp-streak effect for level-select jumps (PART 3 #7). Decorative, pointer-events:none, never over text for
// long (300ms). Skipped under reduced motion. PART 4 may move it onto the shared FX canvas.

import { prefersReducedMotion } from "./hooks/useReducedMotion";

export function warp(): void {
  if (typeof document === "undefined" || prefersReducedMotion()) return;
  const layer = document.createElement("div");
  layer.className = "warp-streaks";
  layer.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("i");
    s.style.left = `${4 + Math.random() * 92}%`;
    s.style.animationDelay = `${Math.random() * 90}ms`;
    s.style.height = `${20 + Math.random() * 40}vh`;
    layer.append(s);
  }
  document.body.append(layer);
  window.setTimeout(() => layer.remove(), 420);
}
