import type { BossArt } from "@/content/bossArt";
import { cn } from "@/lib/cn";

type Run = { x: number; y: number; w: number; fill: string };

/** Horizontal runs of one color → one rect each (a 24×24 sprite becomes ~100 rects instead of ~400). */
function runs(art: BossArt, rows: readonly string[]): Run[] {
  const out: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      out.push({ x, y, w: end - x, fill: art.palette[ch] ?? "#ff00ff" });
      x = end;
    }
  });
  return out;
}

/**
 * An original 24×24 pixel boss (R4), server-rendered. Each frame is its own SVG inside an HTML wrapper: the steps()
 * idle swaps the wrappers' opacity (compositor-only — never animate SVG children, CLAUDE.md).
 */
export function BossSprite({ art, className }: { art: BossArt; className?: string }) {
  return (
    <span className={cn("boss-sprite", className)} aria-hidden="true">
      {art.frames.map((frame, i) => (
        <span key={i} className={i === 0 ? "boss-sprite__frame" : "boss-sprite__frame boss-sprite__frame--b"}>
          <svg viewBox="0 0 24 24" shapeRendering="crispEdges" focusable="false">
            {runs(art, frame).map((r) => (
              <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />
            ))}
          </svg>
        </span>
      ))}
    </span>
  );
}
