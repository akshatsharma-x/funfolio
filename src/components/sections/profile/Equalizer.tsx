import type { CSSProperties } from "react";

/** The 8-bit equalizer next to "Currently playing" (decorative; compositor-only bars, paused with the other loops). */
export function Equalizer({ bars = 8 }: { bars?: number }) {
  return (
    <span className="eq" aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} className="eq__bar" style={{ "--i": i } as CSSProperties} />
      ))}
    </span>
  );
}
