import type { Achievement } from "@/content/achievements";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";

/**
 * One achievement on the Trophy Room's shelf (PART 14) — server-safe, shared by the static shelf and the live one the
 * runtime portals in. Locked: a silhouette and the hint (secret ones: "???"). Unlocked: full color and its title.
 */
export function AchievementPlaque({ a, at }: { a: Achievement; at: number | null }) {
  const hidden = !at && a.secret;
  return (
    <li className="plaque" data-unlocked={at ? "" : undefined} data-ach={a.id}>
      <span className="plaque__trophy" aria-hidden="true">
        <PixelIcon name={a.icon as PixelIconName} size={32} />
      </span>
      <span className="plaque__title">{hidden ? "???" : a.title}</span>
      <span className="plaque__hint">{hidden ? "Secret achievement — keep exploring." : a.description}</span>
      <span className="plaque__state">
        {at ? "Unlocked" : "Locked"} <span aria-hidden="true">·</span> <span className="plaque__xp">+{a.xp} XP</span>
      </span>
    </li>
  );
}
