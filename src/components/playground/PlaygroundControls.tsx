"use client";

import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { WORLDS } from "@/content/worlds";
import { useHtmlAttribute } from "@/lib/hooks/useHtmlAttribute";

const PREVIEW_WORLDS = WORLDS.filter((w) => w.id !== "launchpad" && w.id !== "credits");

/**
 * Page theme (the real switch: saved, sweeps, unlocks "Lights Out") + preview world (sets <html data-world>).
 * Retro is a Prize Counter unlock, so here it is previewed with the session-only ?theme=retro override.
 */
export function PlaygroundControls() {
  const theme = useHtmlAttribute("data-theme", "night");
  const world = useHtmlAttribute("data-world", "title");

  return (
    <div className="grid gap-5">
      <fieldset className="grid gap-3">
        <legend className="mb-2 font-pixel text-sm uppercase tracking-wider text-muted">Page theme</legend>
        <div className="flex flex-wrap gap-3">
          {(["night", "day"] as const).map((t) => (
            <ArcadeButton
              key={t}
              size="sm"
              variant={theme === t ? "primary" : "secondary"}
              aria-pressed={theme === t}
              command={{ type: "theme", value: t }}
            >
              {t}
            </ArcadeButton>
          ))}
          <ArcadeButton href="?theme=retro" size="sm" variant={theme === "retro" ? "primary" : "secondary"}>
            retro (preview)
          </ArcadeButton>
        </div>
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="mb-2 font-pixel text-sm uppercase tracking-wider text-muted">Preview world (--world)</legend>
        <div className="flex flex-wrap gap-3">
          {PREVIEW_WORLDS.map((w) => (
            <ArcadeButton
              key={w.id}
              size="sm"
              variant={world === w.id ? "primary" : "ghost"}
              aria-pressed={world === w.id}
              onClick={() => document.documentElement.setAttribute("data-world", w.id)}
            >
              {w.gameTitle}
            </ArcadeButton>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
