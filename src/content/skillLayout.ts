// The radial Skill Tree's layout (PART 13), computed at build time. Pure (no imports), so it can be tuned in Node.
// Units are percent of the tree's width (CSS: cqw); the box is 100 × TREE_H. Five fans of hex nodes radiate from the
// root — right, top, bottom and two on the left — each row or column bent into an arc around the root. Every node
// reserves room for a two-line label, so labels never collide whatever they say; `overlaps()` checks the result and
// the section falls back to the vertical tree when a branch outgrows its fan.

export const TREE_H = 70;
export const ROOT = { x: 50, y: 35, w: 7, h: 8 };

/** A node's reserved box around its hex centre: the hex (3.7 tall) and two label lines under it. */
export const NODE = { w: 8.4, top: 1.85, bottom: 1.85 + 0.35 + 2.07 };
const DX = 9.2; // centre-to-centre, side by side
const DY = 6.6; // centre-to-centre, stacked (columns)
const DY_ROWS = 7; // rows bend more, so they get a little more air
const GAP = 0.4; // smallest gap the overlap check accepts

export type FanId = "top" | "right" | "bottom" | "upperLeft" | "lowerLeft";
type Fan = {
  hub: { x: number; y: number };
  /** Lanes from the hub outward: rows (top/bottom) at a fixed y, or columns (sides) at a fixed x. */
  axis: "rows" | "cols";
  lanes: number[];
  /** Slot centres along a lane, inner end first (cols: y values; rows: centred on the hub's x). */
  slots: number;
  /** Rows: slots are centred on x = 50. Cols: the lane's slots, ordered from the hub side outward. */
  along: (count: number) => number[];
  /** Bend: pulls each node toward the root the further it sits from the fan's axis (an arc, not a grid). */
  bend: (x: number, y: number) => { x: number; y: number };
};

const centred = (count: number, centre: number, step: number) => Array.from({ length: count }, (_, i) => centre + (i - (count - 1) / 2) * step);

const FANS: Record<FanId, Fan> = {
  top: {
    hub: { x: 50, y: 27 },
    axis: "rows",
    lanes: [20, 20 - DY_ROWS, 20 - 2 * DY_ROWS],
    slots: 4,
    along: (n) => centred(n, 50, DX),
    bend: (x, y) => ({ x, y: y + 1.2 * ((x - 50) / 20) ** 2 }),
  },
  bottom: {
    hub: { x: 50, y: 43 },
    axis: "rows",
    lanes: [47.4, 47.4 + DY_ROWS, 47.4 + 2 * DY_ROWS],
    slots: 4,
    along: (n) => centred(n, 50, DX),
    bend: (x, y) => ({ x, y: y - 1.2 * ((x - 50) / 20) ** 2 }),
  },
  right: {
    hub: { x: 61.5, y: 35 },
    axis: "cols",
    lanes: [74, 83.2, 92.4],
    slots: 9,
    along: (n) => centred(n, 35, DY),
    bend: (x, y) => ({ x: x - 1.5 * ((y - 35) / 28) ** 2, y }),
  },
  upperLeft: {
    hub: { x: 37.5, y: 28 },
    axis: "cols",
    lanes: [26, 16.8, 7.6],
    slots: 4,
    along: (n) => Array.from({ length: n }, (_, i) => 28.9 - i * DY),
    bend: (x, y) => ({ x: x + 1.2 * ((y - 35) / 28) ** 2, y }),
  },
  lowerLeft: {
    hub: { x: 37.5, y: 42 },
    axis: "cols",
    lanes: [26, 16.8, 7.6],
    slots: 4,
    along: (n) => Array.from({ length: n }, (_, i) => 38.7 + i * DY),
    bend: (x, y) => ({ x: x + 1.2 * ((y - 35) / 28) ** 2, y }),
  },
};

export type PlacedNode = {
  x: number;
  y: number;
  lane: number;
  /** Where its edge starts (the hub, or the nearest node one lane in). */
  from: { x: number; y: number };
  /** One-shot timing (s): the edge grows at `edge`, the node pops at `pop`. */
  edge: number;
  pop: number;
};
export type PlacedBranch = { fan: FanId; hub: { x: number; y: number }; nodes: PlacedNode[]; hubPop: number };

/** Lane sizes for `n` nodes: as even as possible with the remainder outward, then tilted one step (inner lane −1,
 *  outer lane +1) when there's room, so the fan widens away from its hub: 9 → 2·3·4, 24 → 7·8·9, 12 on 4-slot lanes → 4·4·4. */
function split(n: number, lanes: number, cap: number): number[] | null {
  if (n > lanes * cap || n < 1) return null;
  const base = Math.floor(n / lanes);
  const out = Array.from({ length: lanes }, () => base);
  for (let i = 0; i < n - base * lanes; i++) out[lanes - 1 - i] += 1;
  if (lanes > 1 && out[0] > 1 && out[lanes - 1] < cap && out[0] >= out[lanes - 1]) {
    out[0] -= 1;
    out[lanes - 1] += 1;
  }
  return out.filter((c) => c > 0);
}

const round = (v: number) => Math.round(v * 100) / 100;

/** Places `counts[i]` nodes on fan `fans[i]`. Null when a branch doesn't fit its fan (the vertical tree takes over). */
export function layoutTree(branches: readonly { fan: FanId; count: number }[]): PlacedBranch[] | null {
  const placed: PlacedBranch[] = [];
  for (const [b, { fan: id, count }] of branches.entries()) {
    const fan = FANS[id];
    const sizes = split(count, fan.lanes.length, fan.slots);
    if (!sizes) return null;
    const nodes: PlacedNode[] = [];
    let prev: { x: number; y: number }[] = [fan.hub];
    sizes.forEach((size, lane) => {
      const along = fan.along(size);
      const here = along.map((a) => fan.bend(fan.axis === "rows" ? a : fan.lanes[lane], fan.axis === "rows" ? fan.lanes[lane] : a));
      here.forEach((p, j) => {
        const from = prev.reduce((best, q) => (Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(best.x - p.x, best.y - p.y) ? q : best));
        const edge = 0.34 + lane * 0.16 + b * 0.03 + j * 0.018;
        nodes.push({ x: round(p.x), y: round(p.y), lane, from: { x: round(from.x), y: round(from.y) }, edge: round(edge), pop: round(edge + 0.18) });
      });
      prev = here;
    });
    placed.push({ fan: id, hub: fan.hub, nodes, hubPop: round(0.2 + b * 0.03) });
  }
  return placed;
}

type Box = { name: string; l: number; t: number; r: number; b: number };

/** Every pair of boxes closer than GAP, and anything outside the tree — empty when the layout is clean. */
export function overlaps(tree: readonly PlacedBranch[], hubWidths: readonly number[], hubHeight = 3.8): string[] {
  const boxes: Box[] = [{ name: "root", l: ROOT.x - ROOT.w / 2, t: ROOT.y - ROOT.h / 2, r: ROOT.x + ROOT.w / 2, b: ROOT.y + ROOT.h / 2 }];
  tree.forEach((br, i) => {
    const w = hubWidths[i] ?? 12;
    boxes.push({ name: `hub ${br.fan}`, l: br.hub.x - w / 2, t: br.hub.y - hubHeight / 2, r: br.hub.x + w / 2, b: br.hub.y + hubHeight / 2 });
    br.nodes.forEach((n, j) => boxes.push({ name: `${br.fan} #${j}`, l: n.x - NODE.w / 2, t: n.y - NODE.top, r: n.x + NODE.w / 2, b: n.y + NODE.bottom }));
  });
  const out: string[] = [];
  for (const a of boxes) if (a.l < 0.5 || a.t < 0.5 || a.r > 99.5 || a.b > TREE_H - 0.5) out.push(`${a.name} leaves the tree`);
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const c = boxes[j];
      if (a.l < c.r + GAP && c.l < a.r + GAP && a.t < c.b + GAP && c.t < a.b + GAP) out.push(`${a.name} × ${c.name}`);
    }
  return out;
}
