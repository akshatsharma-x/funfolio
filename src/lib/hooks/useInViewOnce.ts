import { useEffect, useState } from "react";

type Options = { rootMargin?: string; threshold?: number };

/**
 * Becomes true the first time the element enters the viewport, then stops observing.
 * Usage: `const [ref, seen] = useInViewOnce<HTMLDivElement>()` → `<div ref={ref}>`.
 */
export function useInViewOnce<T extends Element = HTMLElement>({ rootMargin = "0px 0px -10% 0px", threshold = 0.15 }: Options = {}) {
  const [node, setNode] = useState<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!node || seen) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, seen, rootMargin, threshold]);

  return [setNode, seen] as const;
}
