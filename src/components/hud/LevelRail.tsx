"use client";

import { worldById, worldLabel, type WorldId } from "@/content/worlds";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";
import { useHtmlAttribute } from "@/lib/hooks/useHtmlAttribute";
import { useSave } from "@/lib/store";
import { useUi } from "@/lib/ui";

const ITEMS: { ids: WorldId[]; icon: PixelIconName }[] = [
  { ids: ["title"], icon: "coin" },
  { ids: ["profile"], icon: "heart" },
  { ids: ["launchpad", "quests"], icon: "sword" },
  { ids: ["lab"], icon: "potion" },
  { ids: ["vault"], icon: "cartridge" },
  { ids: ["arcade"], icon: "controller" },
  { ids: ["skills"], icon: "gear" },
  { ids: ["trophies"], icon: "trophy" },
  { ids: ["lobby"], icon: "mail" },
  { ids: ["credits"], icon: "star" },
];

/**
 * Level-select rail (PART 3 #7): right edge, one icon per world. Current bounces, visited gets a check, hover/focus
 * shows the name. Links jump with Lenis + a warp streak (lib/scroll.ts handles every same-page anchor).
 */
export function LevelRail() {
  const current = useUi((s) => s.currentWorld);
  const visited = useSave((s) => s.visitedWorlds);
  const speedrun = useHtmlAttribute("data-mode", "play") === "speedrun";

  return (
    <nav className="rail" aria-label="Level select">
      <ol>
        {ITEMS.map(({ ids, icon }) => {
          // World 2 = Launchpad gate, or straight to the Quest Log in Speedrun Mode (gates skipped)
          const id = ids.length > 1 && speedrun ? ids[1] : ids[0];
          if (speedrun && id === "arcade") return null;
          const w = worldById[id];
          const label = worldLabel(w) || "Credits";
          const isCurrent = ids.includes(current);
          const isVisited = ids.some((x) => visited.includes(x));
          const name = `${label} · ${w.gameTitle}${w.gameTitle === w.plainTitle ? "" : ` · ${w.plainTitle}`}`;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                data-warp=""
                className="rail__item"
                aria-current={isCurrent ? "location" : undefined}
                data-visited={isVisited ? "" : undefined}
                aria-label={`${name}${isVisited ? " (visited)" : ""}`}
              >
                <PixelIcon name={icon} />
                {isVisited ? (
                  <span className="rail__check" aria-hidden="true">
                    <PixelIcon name="check" />
                  </span>
                ) : null}
                <span className="rail__label" aria-hidden="true">
                  {name}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
