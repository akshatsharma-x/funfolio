import type { ReactNode } from "react";

/**
 * A local skip link (PART 17): invisible until keyboard focus reaches it, then it shows at the top-left corner of its
 * (positioned) container and jumps past a mini-game — the same in-page handling as every `#` link (smooth scroll, focus
 * on the target). Server-safe; works without JS as a plain anchor.
 */
export function SkipLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a href={`#${to}`} className="arcade-btn skip-link skip-link--local" data-size="sm">
      {children}
    </a>
  );
}
