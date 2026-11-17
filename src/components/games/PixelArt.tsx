import { pixelPaths, type PixelArtDef } from "./art";

/** Renders a pixel emblem crisply at any size (server or client). Decorative — always aria-hidden. */
export function PixelArt({ def, size, className }: { def: PixelArtDef; size: number; className?: string }) {
  const w = def.rows[0]?.length ?? 16;
  const h = def.rows.length;
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} width={size} height={(size * h) / w} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {pixelPaths(def).map((p) => (
        <path key={p.fill} d={p.d} fill={p.fill} />
      ))}
    </svg>
  );
}
