import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** In-app override first (Settings → Reduced motion sets data-motion="reduce" | "full" on <html>), else the OS. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  const override = document.documentElement.getAttribute("data-motion");
  if (override === "reduce") return true;
  if (override === "full") return false;
  return window.matchMedia(QUERY).matches;
}

function subscribe(onChange: () => void) {
  const list = window.matchMedia(QUERY);
  list.addEventListener("change", onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => {
    list.removeEventListener("change", onChange);
    observer.disconnect();
  };
}

/** True when motion should be reduced (Bible §4: CHILL + no shake/parallax/trails/camera flights; changes become fades). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
