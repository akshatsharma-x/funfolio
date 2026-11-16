import type { ReactNode } from "react";
import { worldById, worldLabel, type WorldId } from "@/content/worlds";
import { cn } from "@/lib/cn";
import { Badge } from "./Badge";

type WorldHeaderProps = {
  world: WorldId;
  /** Heading level for the title (h2 on the page; deeper levels for previews). */
  as?: "h1" | "h2" | "h3" | "h4";
  /** Id for the heading (point the section's aria-labelledby at it). */
  id?: string;
  /** One-line kicker only ("WORLD 0 · TITLE SCREEN · Home") — for the Title Screen, where the h1 is the name. */
  compact?: boolean;
  className?: string;
  children?: ReactNode;
};

/**
 * World number + game title + plain name (R9: the metaphor always sits next to its plain name).
 * Game titles are title case and uppercased with CSS so screen readers read words, not letters.
 * PART 4's intro (src/components/fx/intros.ts) finds it by data-world-header. Server-safe.
 */
export function WorldHeader({ world, as: Heading = "h2", id, compact = false, className, children }: WorldHeaderProps) {
  const w = worldById[world];
  const label = worldLabel(w);

  if (compact) {
    return (
      <p className={cn("world-header__kicker", className)} data-world-header={world}>
        {label ? <Badge tone="world">{label}</Badge> : null}
        <span>
          {w.gameTitle} <span aria-hidden="true">·</span>
          <span className="sr-only">,</span> {w.plainTitle}
        </span>
      </p>
    );
  }

  return (
    <header className={cn("world-header", className)} data-world-header={world}>
      {label || w.stage ? (
        <p className="world-header__kicker">
          {label ? <Badge tone="world">{label}</Badge> : null}
          {w.stage ? <span>{w.stage}</span> : null}
        </p>
      ) : null}
      <Heading id={id} className="world-header__title">
        <span className={cn("world-header__game", w.rainbow && "text-rainbow")}>{w.gameTitle}</span>
        <span className="sr-only">: </span>
        <span className="world-header__plain">{w.plainTitle}</span>
      </Heading>
      {children}
    </header>
  );
}
