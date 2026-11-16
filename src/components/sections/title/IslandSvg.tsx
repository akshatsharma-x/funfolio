// Isometric SVG island (PART 5) — the NONE quality tier, the no-JS view and the placeholder while the 3D island loads.
// Server-rendered, decorative (aria-hidden): the landmark hotspot buttons on top of it carry the names (R9) and the
// keyboard path. Same landmark registry and colors as the 3D scene; original art (R4).

import { LANDMARKS, type Landmark, type LandmarkId } from "@/content/landmarks";

const U = 15; // px per island unit
const ISO_X = Math.cos(Math.PI / 6);
const iso = (x: number, z: number, y = 0): [number, number] => [(x - z) * ISO_X * U, (x + z) * 0.5 * U - y * U];
const pts = (list: [number, number][]) => list.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");
const radiusAt = (t: number) => 8.1 + Math.sin(t * 3 + 0.6) * 0.7 + Math.sin(t * 5 + 2.1) * 0.35;
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
};

/** An iso box: top, left and right faces. */
function Box({ x, z, y = 0, w, d, h, color }: { x: number; z: number; y?: number; w: number; d: number; h: number; color: string }) {
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const z0 = z - d / 2;
  const z1 = z + d / 2;
  const top = [iso(x0, z0, y + h), iso(x1, z0, y + h), iso(x1, z1, y + h), iso(x0, z1, y + h)];
  const left = [iso(x0, z1, y + h), iso(x1, z1, y + h), iso(x1, z1, y), iso(x0, z1, y)];
  const right = [iso(x1, z0, y + h), iso(x1, z1, y + h), iso(x1, z1, y), iso(x1, z0, y)];
  return (
    <g stroke="#07060F" strokeWidth="1.2" strokeLinejoin="round">
      <polygon points={pts(left)} fill={shade(color, 0.82)} />
      <polygon points={pts(right)} fill={shade(color, 0.62)} />
      <polygon points={pts(top)} fill={shade(color, 1.08)} />
    </g>
  );
}

const ANCHOR: Record<LandmarkId, number> = { house: 2.6, tower: 4.6, observatory: 2.9, workshop: 3.1, arcade: 2.6, tree: 3.6, pedestal: 2.4, radio: 4.8 };

function LandmarkArt({ l }: { l: Landmark }) {
  const [x, z] = l.at;
  const y = 0.9;
  switch (l.id) {
    case "house":
      return (
        <g>
          <Box x={x} z={z} y={y} w={1.7} d={1.5} h={1.2} color={l.color} />
          <polygon points={pts([iso(x - 0.95, z + 0.85, y + 1.2), iso(x, z, y + 2.2), iso(x + 0.95, z + 0.85, y + 1.2)])} fill="#0E7490" stroke="#07060F" strokeWidth="1.2" />
          <polygon points={pts([iso(x + 0.95, z + 0.85, y + 1.2), iso(x, z, y + 2.2), iso(x + 0.95, z - 0.85, y + 1.2)])} fill="#0B5C72" stroke="#07060F" strokeWidth="1.2" />
        </g>
      );
    case "tower":
      return (
        <g>
          {[0, 1, 2, 3].map((f) => (
            <Box key={f} x={x} z={z} y={y + f * 0.86} w={1.45 - f * 0.12} d={1.45 - f * 0.12} h={0.86} color={f === 3 ? "#D9FF8A" : f % 2 ? "#8BD62E" : l.color} />
          ))}
        </g>
      );
    case "observatory": {
      const [cx, cy] = iso(x, z, y + 1);
      return (
        <g>
          <Box x={x} z={z} y={y} w={1.8} d={1.8} h={1} color="#FFF4E0" />
          <path d={`M${cx - 15} ${cy} A15 13 0 0 1 ${cx + 15} ${cy} Z`} fill={l.color} stroke="#07060F" strokeWidth="1.2" />
          <line x1={cx + 2} y1={cy - 12} x2={cx + 12} y2={cy - 22} stroke="#07060F" strokeWidth="2" />
          <ellipse cx={cx + 13} cy={cy - 23} rx="6" ry="3.5" fill="#DDD6FE" stroke="#07060F" strokeWidth="1.2" />
        </g>
      );
    }
    case "workshop":
      return (
        <g>
          <Box x={x} z={z} y={y} w={1.9} d={1.4} h={1.1} color={l.color} />
          <Box x={x} z={z} y={y + 1.5} w={1.4} d={0.25} h={1.05} color="#9E9AB5" />
          <Box x={x} z={z + 0.14} y={y + 1.85} w={1} d={0.05} h={0.5} color="#FFF4E0" />
        </g>
      );
    case "arcade":
      return (
        <g>
          <Box x={x} z={z} y={y} w={1.2} d={1.1} h={1.5} color="#2A1D5E" />
          <Box x={x} z={z} y={y + 1.5} w={1.3} d={1.2} h={0.45} color={l.color} />
        </g>
      );
    case "tree":
      return (
        <g>
          <Box x={x} z={z} y={y} w={0.4} d={0.4} h={1.7} color="#7A4C2A" />
          {[[0, 0, 1.6], [0.6, 0.1, 1.4], [-0.6, -0.1, 1.4], [0, 0.6, 1.5], [0, -0.6, 1.5], [0, 0, 2.25]].map(([dx, dz, dy], i) => (
            <Box key={i} x={x + dx} z={z + dz} y={y + dy} w={0.85} d={0.85} h={0.75} color={i % 2 ? "#B6E34A" : "#8BD62E"} />
          ))}
          {[[0.7, 0.6, 2.1], [-0.6, 0.4, 2.3], [0.2, -0.5, 3]].map(([dx, dz, dy], i) => (
            <Box key={`f${i}`} x={x + dx} z={z + dz} y={y + dy} w={0.26} d={0.26} h={0.26} color={l.color} />
          ))}
        </g>
      );
    case "pedestal": {
      const [cx, cy] = iso(x, z, y + 1.6);
      return (
        <g>
          <Box x={x} z={z} y={y} w={1} d={1} h={0.9} color={l.color} />
          <path d={`M${cx - 9} ${cy - 8} h18 l-4 12 h-10 Z`} fill="#FFC83D" stroke="#07060F" strokeWidth="1.2" />
          <rect x={cx - 2} y={cy + 4} width="4" height="5" fill="#C98A00" stroke="#07060F" strokeWidth="1" />
          <rect x={cx - 6} y={cy + 8} width="12" height="3" fill="#FFC83D" stroke="#07060F" strokeWidth="1" />
        </g>
      );
    }
    case "radio": {
      const [bx, by] = iso(x, z, y);
      const [tx, ty] = iso(x, z, y + 3.6);
      return (
        <g stroke="#07060F" strokeWidth="1.6" fill="none">
          <line x1={bx - 9} y1={by} x2={tx} y2={ty} />
          <line x1={bx + 9} y1={by} x2={tx} y2={ty} />
          <line x1={bx - 6} y1={by - 18} x2={bx + 6} y2={by - 18} />
          <line x1={bx - 3} y1={by - 36} x2={bx + 3} y2={by - 36} />
          <circle cx={tx} cy={ty} r="3.5" fill={l.color} />
          <circle className="island-svg__ring" cx={tx} cy={ty} r="10" stroke={l.color} strokeWidth="2" />
          <circle className="island-svg__ring island-svg__ring--2" cx={tx} cy={ty} r="17" stroke={l.color} strokeWidth="2" />
        </g>
      );
    }
  }
}

/** Layout shared with the hotspots: viewBox + each target's position as % of the art box. */
export function islandSvgLayout() {
  const cells: [number, number][] = [];
  for (let x = -9; x <= 9; x += 1.6) for (let z = -9; z <= 9; z += 1.6) if (Math.hypot(x, z) <= radiusAt(Math.atan2(z, x))) cells.push([x, z]);
  const all = cells.flatMap(([x, z]) => [iso(x - 0.8, z - 0.8, 0.9), iso(x + 0.8, z + 0.8, 0.9)]);
  const minX = Math.min(...all.map((p) => p[0])) - 40;
  const maxX = Math.max(...all.map((p) => p[0])) + 40;
  const minY = Math.min(...all.map((p) => p[1])) - 110;
  const maxY = Math.max(...all.map((p) => p[1])) + 150;
  const w = maxX - minX;
  const h = maxY - minY;
  const pct = ([px, py]: [number, number]) => [((px - minX) / w) * 100, ((py - minY) / h) * 100] as const;
  const spots: Record<string, readonly [number, number]> = {};
  for (const l of LANDMARKS) spots[l.id] = pct(iso(l.at[0], l.at[1], 0.9 + ANCHOR[l.id]));
  spots.plane = pct([maxX - 90, minY + 50]);
  const tower = LANDMARKS.find((l) => l.id === "tower")!;
  spots.coin = pct(iso(tower.at[0] - 1.1, tower.at[1] - 1.1, 2.2));
  return { cells, viewBox: `${minX.toFixed(0)} ${minY.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}`, spots, minX, minY, maxX, maxY };
}

export function IslandSvg() {
  const { cells, viewBox, minX, minY, maxX, maxY } = islandSvgLayout();
  // the underside: the island outline converging to a rocky point
  const rim = Array.from({ length: 28 }, (_, i) => {
    const t = (i / 28) * Math.PI * 2;
    const r = radiusAt(t);
    return iso(Math.cos(t) * r, Math.sin(t) * r, 0.2);
  }).sort((a, b) => a[0] - b[0]);
  const left = rim[0];
  const right = rim[rim.length - 1];
  const bottom: [number, number] = [(left[0] + right[0]) / 2 + 10, maxY - 40];
  const tower = LANDMARKS.find((l) => l.id === "tower")!;
  const [coinX, coinY] = iso(tower.at[0] - 1.1, tower.at[1] - 1.1, 2.2);
  const edge = iso(Math.cos(0.35) * 7.6, Math.sin(0.35) * 7.6, 0.6);
  return (
    <svg className="island-svg" viewBox={viewBox} role="presentation" aria-hidden="true" focusable="false">
      <g className="island-svg__clouds" fill="#FFF4E0" stroke="#07060F" strokeWidth="1.2">
        <rect x={minX + 24} y={minY + 30} width="70" height="20" rx="10" />
        <rect x={minX + 50} y={minY + 18} width="42" height="20" rx="10" />
        <rect x={maxX - 150} y={minY + 70} width="60" height="18" rx="9" />
      </g>
      <g className="island-svg__plane" stroke="#07060F" strokeWidth="1.2">
        <ellipse cx={maxX - 90} cy={minY + 50} rx="70" ry="18" fill="none" strokeDasharray="3 6" opacity="0.5" />
        <g className="island-svg__plane-body">
          <rect x={maxX - 100} y={minY + 46} width="22" height="7" rx="3" fill="#FFF4E0" />
          <rect x={maxX - 93} y={minY + 41} width="7" height="17" fill="#FF4D4D" />
          <rect x={maxX - 102} y={minY + 43} width="4" height="7" fill="#FF4D4D" />
        </g>
      </g>
      <polygon points={pts([left, bottom, right])} fill="#6B4429" stroke="#07060F" strokeWidth="1.4" />
      <polygon points={pts([[left[0] + 30, left[1] + 8], [bottom[0] - 4, bottom[1] - 40], [right[0] - 40, right[1] + 6]])} fill="#5A3A23" />
      {cells.map(([x, z], i) => (
        <polygon
          key={i}
          points={pts([iso(x - 0.8, z - 0.8, 0.9), iso(x + 0.8, z - 0.8, 0.9), iso(x + 0.8, z + 0.8, 0.9), iso(x - 0.8, z + 0.8, 0.9)])}
          fill={(Math.round(x / 1.6) + Math.round(z / 1.6)) % 2 ? "#6FD46B" : "#63C760"}
          stroke="#2F6B2D"
          strokeWidth="0.6"
        />
      ))}
      <g className="island-svg__water" fill="#7FE7F7" stroke="#07060F" strokeWidth="1">
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <rect key={k} x={edge[0] + (k % 2) * 6} y={edge[1] + k * 18} width="10" height="14" />
        ))}
      </g>
      {/* coin #2 hides behind the Quest Tower (drawn before the tower so the tower covers it) */}
      <g className="island-svg__coin">
        <ellipse cx={coinX} cy={coinY} rx="7" ry="8" fill="#FFC83D" stroke="#07060F" strokeWidth="1.4" />
        <ellipse cx={coinX - 1.5} cy={coinY - 1.5} rx="2.5" ry="3.5" fill="#FFF1A8" />
      </g>
      {[...LANDMARKS]
        .sort((a, b) => a.at[0] + a.at[1] - (b.at[0] + b.at[1]))
        .map((l) => (
          <LandmarkArt key={l.id} l={l} />
        ))}
      {/* turned around: the same coin, now in front of the tower */}
      <g className="island-svg__coin island-svg__coin--front">
        <ellipse cx={coinX} cy={coinY} rx="8" ry="9" fill="#FFC83D" stroke="#07060F" strokeWidth="1.6" />
        <ellipse cx={coinX - 1.5} cy={coinY - 2} rx="2.8" ry="4" fill="#FFF1A8" />
      </g>
    </svg>
  );
}
