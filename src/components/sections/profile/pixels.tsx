// Pixel rows ("." = transparent, one letter per pixel) → SVG paths, one per color: each horizontal run of equal
// letters becomes a single rectangle. Shared by the avatar and the mystery crate (server-safe).

export function PixelLayer({ rows, colors }: { rows: readonly string[]; colors: Readonly<Record<string, string>> }) {
  const byColor = new Map<string, string[]>();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === "." || !colors[ch]) {
        x += 1;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end += 1;
      const list = byColor.get(colors[ch]) ?? [];
      list.push(`M${x} ${y}h${end - x}v1h-${end - x}z`);
      byColor.set(colors[ch], list);
      x = end;
    }
  });
  return (
    <>
      {[...byColor].map(([fill, d]) => (
        <path key={fill} d={d.join("")} fill={fill} />
      ))}
    </>
  );
}
