import type { CSSProperties } from "react";
import type { Tone } from "@/content/derived";
import { cn } from "@/lib/cn";

type MeterProps = {
  value: number;
  max?: number;
  segments?: number;
  /** Accessible name and visible label. */
  label: string;
  /** Spoken + shown value, e.g. "7 of 10 coins". Defaults to "value/max". */
  valueText?: string;
  showLabel?: boolean;
  tone?: Tone | "world";
  /** "floor" never lights a segment that isn't fully earned (real scores: 95.4% of 20 segments → 19). */
  rounding?: "round" | "floor";
  className?: string;
};

/**
 * Segmented pixel bar (XP, timers, progress). Only feed it real or game-state values — never invented skill levels (R1).
 * Server-safe.
 */
export function Meter({ value, max = 100, segments = 10, label, valueText, showLabel = true, tone, rounding = "round", className }: MeterProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const lit = (rounding === "floor" ? Math.floor : Math.round)((clamped / max) * segments);
  const text = valueText ?? `${clamped}/${max}`;
  const style = tone ? ({ "--meter-fill": "var(--tone)" } as CSSProperties) : undefined;

  return (
    <div className={cn("grid gap-1.5", className)}>
      {showLabel ? (
        <div className="flex justify-between gap-4 font-pixel text-xs uppercase tracking-wider" aria-hidden="true">
          <span>{label}</span>
          <span className="text-muted">{text}</span>
        </div>
      ) : null}
      <div
        className="meter"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        aria-valuetext={text}
        data-tone={tone}
        style={style}
      >
        {Array.from({ length: segments }, (_, i) => (
          <span key={i} className="meter__seg" data-on={i < lit ? "" : undefined} />
        ))}
      </div>
    </div>
  );
}
