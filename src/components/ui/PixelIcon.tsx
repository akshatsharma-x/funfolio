import { cn } from "@/lib/cn";
import { PIXEL_ICONS, type PixelIconName } from "./pixel-icons";

export type { PixelIconName } from "./pixel-icons";

type Path = { color: string; d: string };
const cache = new Map<string, Path[]>();

/** Merges horizontal runs of the same color into one SVG path per color (few nodes, crisp at any integer scale). */
function pathsFor(name: PixelIconName, mono: boolean): Path[] {
  const key = `${name}:${mono ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const { rows, palette } = PIXEL_ICONS[name];
  const colors = palette as Readonly<Record<string, string>>;
  const byColor = new Map<string, string[]>();

  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x += 1;
        continue;
      }
      let end = x + 1;
      while (end < row.length && (mono ? row[end] !== "." : row[end] === ch)) end += 1;
      const color = mono ? "currentColor" : colors[ch];
      const parts = byColor.get(color) ?? [];
      parts.push(`M${x} ${y}h${end - x}v1h-${end - x}z`);
      byColor.set(color, parts);
      x = end;
    }
  });

  const paths = [...byColor].map(([color, parts]) => ({ color, d: parts.join("") }));
  cache.set(key, paths);
  return paths;
}

/** The single-color path of an icon — for SVG sprites that draw an icon once and `<use>` it (PART 13's Skill Tree). */
export const monoPixelPath = (name: PixelIconName): string => pathsFor(name, true)[0]?.d ?? "";

/** An icon's colored paths — for icons built at run time with DOM APIs (PART 16's eggs). */
export const pixelIconPaths = (name: PixelIconName): readonly Path[] => pathsFor(name, false);

type PixelIconProps = {
  name: PixelIconName;
  /** Rendered size in px; multiples of 16 stay pixel-perfect. */
  size?: number;
  /** Accessible name. Omit for decorative icons (then aria-hidden). */
  title?: string;
  /** Single color (currentColor) silhouette — for icons on colored fills. */
  mono?: boolean;
  className?: string;
};

/** Original 16×16 pixel icon rendered from an array to crisp SVG (Bible §3). Server-safe. */
export function PixelIcon({ name, size = 16, title, mono = false, className }: PixelIconProps) {
  return (
    <svg
      className={cn("pixel-icon", className)}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {pathsFor(name, mono).map((p) => (
        <path key={p.color} d={p.d} style={{ fill: p.color }} />
      ))}
    </svg>
  );
}
