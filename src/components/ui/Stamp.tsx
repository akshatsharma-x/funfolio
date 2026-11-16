import type { ReactNode } from "react";
import { PixelIcon, type PixelIconName } from "./PixelIcon";

/** A rubber stamp — "Complete" and "Regulated env" (Quest Log), "Defeated" (The Lab). Styles: `.stamp` (quests.css). */
export function Stamp({ kind, icon, children }: { kind: string; icon: PixelIconName; children: ReactNode }) {
  return (
    <span className={`stamp stamp--${kind}`} data-stamp={kind}>
      <PixelIcon name={icon} mono size={16} />
      <span>{children}</span>
    </span>
  );
}
