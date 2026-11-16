import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Peel } from "./Peel";
import { TiltSurface } from "./TiltSurface";

type StickerCardProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  as?: "div" | "article" | "li" | "section";
  /** default = surface · world = filled with the world color (ink text) · holo = animated holo-foil frame */
  variant?: "default" | "world" | "holo";
  /** Pointer tilt ≤ 8° + glare (off on touch / reduced motion). */
  tilt?: boolean;
  /** Max tilt in degrees (default 8; keep it low on text-heavy cards — R6). */
  tiltMax?: number;
  /** Secret revealed by the corner peel. */
  peel?: ReactNode;
  peelLabel?: string;
  /** Arcade-button press: translateY(4px) + short shadow while pressed. */
  pressable?: boolean;
  bodyClassName?: string;
  children: ReactNode;
};

/**
 * The core surface (Bible §3): 3px ink outline, radius 20, hard 0 6px 0 shadow + inner top highlight.
 * Server-safe; only `tilt` / `peel` add small client islands.
 */
export function StickerCard({
  as = "div",
  variant = "default",
  tilt = false,
  tiltMax = 8,
  peel,
  peelLabel,
  pressable = false,
  className,
  bodyClassName,
  children,
  ...rest
}: StickerCardProps) {
  const shared = {
    ...rest,
    className: cn("sticker", className),
    "data-variant": variant === "default" ? undefined : variant,
    "data-pressable": pressable ? "" : undefined,
  };
  const inner = (
    <>
      <div className={cn("sticker__body", bodyClassName)}>{children}</div>
      {peel ? <Peel label={peelLabel}>{peel}</Peel> : null}
    </>
  );

  if (tilt) {
    return (
      <TiltSurface as={as} max={Math.min(8, tiltMax)} {...shared}>
        {inner}
      </TiltSurface>
    );
  }
  const Tag = as;
  return <Tag {...shared}>{inner}</Tag>;
}
