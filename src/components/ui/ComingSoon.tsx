import type { ReactNode } from "react";
import { known } from "@/content/derived";
import { cn } from "@/lib/cn";
import { PixelIcon } from "./PixelIcon";

/** Inline "Coming soon" — the only way a missing fact may render (R1: never a raw TODO). */
export function Soon({ label = "Coming soon", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("soon", className)}>
      <PixelIcon name="lock" mono />
      {label}
    </span>
  );
}

/** Block empty state (Bible §3 voice). */
export function SoonPanel({
  title = "COMING SOON — next level loading…",
  children,
  className,
}: {
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("soon-panel", className)}>
      <p className="soon-panel__title">{title}</p>
      {children ? <div className="text-muted">{children}</div> : null}
    </div>
  );
}

/** Renders a content value, or "Coming soon" when it is TODO/empty. */
export function Fact({ value, soonLabel }: { value: string; soonLabel?: string }) {
  return known(value) ? <>{value}</> : <Soon label={soonLabel} />;
}
