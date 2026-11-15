"use client";

import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { WORLDS } from "@/content/worlds";
import { useHtmlAttribute } from "@/lib/hooks/useHtmlAttribute";
import { setTheme, THEMES } from "@/lib/prefs";

const PREVIEW_WORLDS = WORLDS.filter((w) => w.id !== "launchpad" && w.id !== "credits");

/** Page theme (persists like the real switch will) + preview world (sets <html data-world>, i.e. --world). */
export function PlaygroundControls() {
  const theme = useHtmlAttribute("data-theme", "night");
  const world = useHtmlAttribute("data-world", "title");

  return (
    <div className="grid gap-5">
      <fieldset className="grid gap-3">
        <legend className="mb-2 font-pixel text-sm uppercase tracking-wider text-muted">Page theme</legend>
        <div className="flex flex-wrap gap-3">
          {THEMES.map((t) => (
            <ArcadeButton
              key={t}
              size="sm"
              variant={theme === t ? "primary" : "secondary"}
              aria-pressed={theme === t}
              onClick={() => setTheme(t)}
            >
              {t}
            </ArcadeButton>
          ))}
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
