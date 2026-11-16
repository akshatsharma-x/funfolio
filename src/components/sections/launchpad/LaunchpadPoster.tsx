import { ANCHOR, BUG_R, BUGS, BYTE_R, COIN, CRATE, CRATE_TEXT, crateText, PYLONS, TOWERS, WORLD } from "@/components/games/launchpad/level";

const INK = "#07060F";
const CREAM = "#FFF4E0";
const LIME = "#B6FF3B";

const LABELS = TOWERS.flatMap((t) => t.labels);
const DESCRIPTION = `The Launchpad: a neon launcher holding BYTE, and the Bug Fortress — three towers of crates labeled ${LABELS.slice(0, -1).join(", ")} and ${LABELS[LABELS.length - 1]}, guarded by ${BUGS.length} glitch-bugs, with a coin floating high above.`;

/**
 * The static Launchpad (PART 7): the same scene as the game, drawn once in SVG from the same layout. It is the view
 * without JavaScript, the placeholder while the physics loads, and the reduced-motion poster ("Play anyway").
 */
export function LaunchpadPoster() {
  return (
    <svg className="lp__poster" viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} role="img" aria-label={DESCRIPTION} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="lp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B0920" />
          <stop offset="0.72" stopColor="#17112F" />
          <stop offset="1" stopColor="#0B0920" />
        </linearGradient>
        <pattern id="lp-grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M50 0H0V50" fill="none" stroke="rgba(182,255,59,0.07)" strokeWidth="2" />
        </pattern>
      </defs>
      <rect width={WORLD.w} height={WORLD.h} fill="url(#lp-sky)" />
      <rect width={WORLD.w} height={WORLD.groundY} fill="url(#lp-grid)" />
      <rect y={WORLD.groundY} width={WORLD.w} height={WORLD.h - WORLD.groundY} fill="#0F1A0A" />
      <rect y={WORLD.groundY - 2} width={WORLD.w} height="5" fill={LIME} />
      {PYLONS.map((p) => (
        <g key={p.x}>
          <rect x={p.x - 8} y={p.top} width="16" height={WORLD.groundY - p.top} fill="#1A2810" stroke={LIME} strokeWidth="4" />
          <circle cx={p.x} cy={p.top} r="12" fill={LIME} stroke={INK} strokeWidth="3" />
        </g>
      ))}
      <line x1={PYLONS[0].x} y1={PYLONS[0].top} x2={ANCHOR.x} y2={ANCHOR.y} stroke={LIME} strokeWidth="6" strokeLinecap="round" />
      <line x1={PYLONS[1].x} y1={PYLONS[1].top} x2={ANCHOR.x} y2={ANCHOR.y} stroke={LIME} strokeWidth="6" strokeLinecap="round" />
      <g transform={`translate(${ANCHOR.x} ${ANCHOR.y})`}>
        <circle r={BYTE_R} fill={CREAM} stroke={INK} strokeWidth="4" />
        <rect x="-19" y="-14" width="38" height="27" rx="7" fill="#141026" stroke={INK} strokeWidth="3" />
        <rect x="-11" y="-6" width="6" height="6" fill="#22D3EE" />
        <rect x="5" y="-6" width="6" height="6" fill="#22D3EE" />
        <rect x="-5" y="6" width="10" height="3" fill="#22D3EE" />
        <line y1={-BYTE_R + 1} y2={-BYTE_R - 9} stroke={INK} strokeWidth="3" />
        <circle cy={-BYTE_R - 12} r="5" fill={LIME} stroke={INK} strokeWidth="3" />
      </g>
      {TOWERS.map((t) =>
        t.labels.map((label, i) => {
          const y = WORLD.groundY - CRATE / 2 - i * CRATE;
          const text = crateText(label);
          return (
            <g key={label} transform={`translate(${t.x} ${y})`}>
              <rect x={-CRATE / 2} y={-CRATE / 2} width={CRATE} height={CRATE} rx="9" fill={CREAM} stroke={INK} strokeWidth="5" />
              <rect x={-CRATE / 2 + 5} y="-17" width={CRATE - 10} height="34" fill={LIME} stroke={INK} strokeWidth="3" />
              {text.lines.map((line) => (
                <text key={line.text} className="lp__poster-label" y={line.y} textAnchor="middle" fontSize={text.size} fontWeight={CRATE_TEXT.weight}>
                  {line.text}
                </text>
              ))}
            </g>
          );
        }),
      )}
      {BUGS.map((b, i) => {
        const x = "tower" in b ? TOWERS[b.tower].x : b.ground;
        const y = "tower" in b ? WORLD.groundY - TOWERS[b.tower].labels.length * CRATE - BUG_R : WORLD.groundY - BUG_R;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path d={`M-8 ${-BUG_R + 6}L-14 ${-BUG_R - 14}M8 ${-BUG_R + 6}L14 ${-BUG_R - 14}`} stroke={INK} strokeWidth="3" />
            <circle cx="-14" cy={-BUG_R - 16} r="5" fill={LIME} stroke={INK} strokeWidth="3" />
            <circle cx="14" cy={-BUG_R - 16} r="5" fill={LIME} stroke={INK} strokeWidth="3" />
            <circle r={BUG_R} fill={LIME} stroke={INK} strokeWidth="4" />
            <ellipse cx="-9" cy="-4" rx="7" ry="8" fill={CREAM} stroke={INK} strokeWidth="2" />
            <ellipse cx="9" cy="-4" rx="7" ry="8" fill={CREAM} stroke={INK} strokeWidth="2" />
            <circle cx="-11" cy="-4" r="3.4" fill={INK} />
            <circle cx="7" cy="-4" r="3.4" fill={INK} />
            <path d="M-5 9a6 6 0 0 0 10 0" fill="none" stroke={INK} strokeWidth="2.5" />
          </g>
        );
      })}
      <g transform={`translate(${COIN.x} ${COIN.y})`}>
        <circle r={COIN.r} fill="#FFC83D" stroke={INK} strokeWidth="4" />
        <circle r={COIN.r - 9} fill="none" stroke="#C98A00" strokeWidth="3" />
        <rect x="-9" y="-15" width="6" height="10" fill="#FFF1A8" />
      </g>
    </svg>
  );
}
