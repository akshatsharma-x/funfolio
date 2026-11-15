import { useSyncExternalStore } from "react";

/** Live value of an attribute on <html> (data-theme, data-world, data-cursor-size…). `fallback` during SSR. */
export function useHtmlAttribute(name: string, fallback: string): string {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: [name] });
      return () => observer.disconnect();
    },
    () => document.documentElement.getAttribute(name) ?? fallback,
    () => fallback,
  );
}
