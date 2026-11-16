import type { CSSProperties } from "react";
import { AVATAR, AVATAR_COLORS, AVATAR_LEGEND } from "@/content/avatar";
import { cn } from "@/lib/cn";
import { PixelLayer } from "./pixels";

const COLORS = Object.fromEntries(Object.entries(AVATAR_LEGEND).map(([ch, name]) => [ch, AVATAR_COLORS[name]]));

/**
 * The original pixel-art avatar (until player.photo exists). Decorative: the Character Card says who it is in text.
 * The raised hand is its own group so it can wave (rotating at the shoulder).
 */
export function PixelAvatar({ className }: { className?: string }) {
  const [px, py] = AVATAR.pivot;
  return (
    <svg className={cn("pixel-avatar", className)} viewBox={`0 0 ${AVATAR.width} ${AVATAR.height}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <g>
        <PixelLayer rows={AVATAR.body} colors={COLORS} />
      </g>
      <g className="pixel-avatar__arm" style={{ transformOrigin: `${px}px ${py}px` } as CSSProperties}>
        <PixelLayer rows={AVATAR.arm} colors={COLORS} />
      </g>
    </svg>
  );
}
