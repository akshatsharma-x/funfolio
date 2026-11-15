import type { ReactNode } from "react";
import type { ItemType } from "@/content/content";
import { ITEM_META, type Tone } from "@/content/derived";
import { cn } from "@/lib/cn";
import { PixelIcon, type PixelIconName } from "./PixelIcon";

type ChipProps = {
  children: ReactNode;
  /** Item type (Bible §3) → color + icon: weapons pink · spells violet · gear cyan · gadgets orange · runes mint. */
  type?: ItemType;
  /** Override color; omit both `type` and `tone` for a neutral stack chip. */
  tone?: Tone | "world";
  /** Icon override, or `false` to hide the item-type icon. */
  icon?: PixelIconName | false;
  /** Signature items get the animated holo-foil ring. */
  holo?: boolean;
  className?: string;
};

/** Mono-font chip for skills and stacks. Server-safe. */
export function Chip({ children, type, tone, icon, holo = false, className }: ChipProps) {
  const meta = type ? ITEM_META[type] : undefined;
  const fill = tone ?? meta?.tone;
  const glyph = icon === false ? undefined : (icon ?? meta?.icon);
  return (
    <span className={cn("chip", className)} data-tone={fill} data-holo={holo ? "" : undefined}>
      {glyph ? <PixelIcon name={glyph} mono /> : null}
      <span>{children}</span>
    </span>
  );
}
