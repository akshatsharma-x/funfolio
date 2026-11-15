import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PixelFrameProps = {
  /** Small pixel tab above the content, e.g. "SAVE FILE". */
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
};

/**
 * Stepped-corner dialog frame (Bible §3): an ink layer and a surface layer clipped to the same pixel polygon,
 * with a hard drop shadow that follows the steps. Keep ≥ 20px of inner padding so focus rings aren't clipped.
 */
export function PixelFrame({ title, children, className, innerClassName }: PixelFrameProps) {
  return (
    <div className={cn("pixel-frame", className)}>
      <div className="pixel-frame__outline">
        <div className={cn("pixel-frame__inner", innerClassName)}>
          {title ? <div className="pixel-frame__title">{title}</div> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
