/** BYTE stand-in (the real mascot lands in PART 4): rounded CRT-monitor head, pixel eyes, antenna bulb in --world. */
export function BytePlaceholder({ size = 96 }: { size?: number }) {
  const ink = { stroke: "var(--ink)" };
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="BYTE, the robot mascot (placeholder)">
      <line x1="32" y1="12" x2="32" y2="5" style={ink} strokeWidth="3" />
      <circle cx="32" cy="5" r="4" style={{ ...ink, fill: "var(--world)" }} strokeWidth="2" />
      <rect x="8" y="12" width="48" height="34" rx="10" style={{ ...ink, fill: "#fff4e0" }} strokeWidth="3" />
      <rect x="14" y="17" width="36" height="23" rx="5" style={{ fill: "#07060f" }} />
      <rect x="22" y="24" width="5" height="8" style={{ fill: "var(--world)" }} />
      <rect x="37" y="24" width="5" height="8" style={{ fill: "var(--world)" }} />
      <rect x="27" y="35" width="10" height="2" style={{ fill: "var(--world)" }} />
      <rect x="25" y="46" width="14" height="4" style={{ ...ink, fill: "#b9b2d9" }} strokeWidth="2" />
      <rect x="18" y="50" width="28" height="11" rx="4" style={{ ...ink, fill: "#fff4e0" }} strokeWidth="3" />
      <rect x="9" y="52" width="9" height="5" rx="2.5" style={{ ...ink, fill: "#fff4e0" }} strokeWidth="2" />
      <rect x="46" y="52" width="9" height="5" rx="2.5" style={{ ...ink, fill: "#fff4e0" }} strokeWidth="2" />
    </svg>
  );
}
