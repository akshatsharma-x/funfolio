import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** OS setting OR the in-app switch (PART 3 sets data-motion="reduce" on <html>). Usable outside React too. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(QUERY).matches || document.documentElement.getAttribute("data-motion") === "reduce";
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
