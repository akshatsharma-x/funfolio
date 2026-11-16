import type { CSSProperties } from "react";
import { NumberRoll } from "@/components/ui/NumberRoll";
import { PlayOnView } from "@/components/ui/PlayOnView";

const R = 52;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * XP ring (PART 6): a circular gauge that fills to the real ratio on first view, with the value written exactly as in
 * content.ts in the middle ("8.79/10"). The ring is decorative; the text is the information.
 */
export function XpRing({ value, max, ratio, label }: { value: string; max: string; ratio: number; label: string }) {
  const style = { "--c": CIRCUMFERENCE.toFixed(2), "--p": ratio.toFixed(4) } as CSSProperties;
  return (
    <PlayOnView className="xp-ring" style={style} threshold={0.6}>
      <svg className="xp-ring__svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle className="xp-ring__track" cx="60" cy="60" r={R} />
        <circle className="xp-ring__fill" cx="60" cy="60" r={R} />
      </svg>
      <p className="xp-ring__value">
        <span className="sr-only">{label}: </span>
        <NumberRoll value={value} className="xp-ring__num" />
        <span className="xp-ring__max">/{max}</span>
      </p>
    </PlayOnView>
  );
}
