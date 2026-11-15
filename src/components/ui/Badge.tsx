import type { ReactNode } from "react";
import type { Tone } from "@/content/derived";
import { cn } from "@/lib/cn";
import { PixelIcon, type PixelIconName } from "./PixelIcon";

type BadgeProps = {
  /** Fill color (ink text on top). Omit for a neutral surface badge. */
  tone?: Tone | "world";
  icon?: PixelIconName;
  children: ReactNode;
  className?: string;
};

/** Small pixel-cornered label: "CURRENT QUEST", "PRESENTED", "WORLD 3". Server-safe. */
export function Badge({ tone, icon, children, className }: BadgeProps) {
  return (
    <span className={cn("badge", className)} data-tone={tone}>
      {icon ? <PixelIcon name={icon} mono /> : null}
      {children}
    </span>
  );
}
