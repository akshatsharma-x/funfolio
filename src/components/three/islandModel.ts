// Procedural island model (PART 5) — deterministic, no assets (R10). Shared by the 3D scene.
// Grass top on a stepped noise heightmap, flat plateaus under the landmarks, dirt layers tapering to a point.

import { LANDMARKS } from "@/content/landmarks";

export type Cell = { x: number; z: number; h: number };
export type IslandModel = { cell: number; cells: Cell[]; taper: { x: number; y: number; z: number; depth: number }[]; heightAt: (x: number, z: number) => number; edge: { x: number; z: number; h: number } };

const hash = (x: number, z: number) => {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const smooth = (t: number) => t * t * (3 - 2 * t);
function valueNoise(x: number, z: number) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const tx = smooth(x - xi);
  const tz = smooth(z - zi);
  const a = hash(xi, zi);
  const b = hash(xi + 1, zi);
  const c = hash(xi, zi + 1);
  const d = hash(xi + 1, zi + 1);
  return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz;
}
const fbm = (x: number, z: number) => valueNoise(x, z) * 0.65 + valueNoise(x * 2.1 + 5, z * 2.1 + 9) * 0.35;

/** Island outline radius at angle θ (a lumpy circle). */
const radiusAt = (theta: number) => 8.1 + Math.sin(theta * 3 + 0.6) * 0.7 + Math.sin(theta * 5 + 2.1) * 0.35;

export function buildIsland(quality: "high" | "low"): IslandModel {
  const cell = quality === "high" ? 1 : 1.45;
  const plateau = 0.95;
  const heightAt = (x: number, z: number) => {
    for (const l of LANDMARKS) {
      if (Math.hypot(x - l.at[0], z - l.at[1]) < 1.45) return plateau; // flat ground under each landmark
    }
    const n = fbm(x * 0.22 + 3, z * 0.22 + 7);
    const centre = 1 - Math.min(1, Math.hypot(x, z) / 9);
    return 0.55 + Math.round((n * 1.6 + centre * 0.9) * 2) * 0.3;
  };

  const cells: Cell[] = [];
  const span = 10;
  for (let x = -span; x <= span; x += cell) {
    for (let z = -span; z <= span; z += cell) {
      const r = Math.hypot(x, z);
      if (r > radiusAt(Math.atan2(z, x))) continue;
      cells.push({ x, z, h: heightAt(x, z) });
    }
  }

  // tapering underside: layers shrink toward a point
  const layers = quality === "high" ? 6 : 4;
  const taper: IslandModel["taper"] = [];
  for (let k = 0; k < layers; k++) {
    const shrink = Math.pow(1 - (k + 1) / (layers + 1), 0.85);
    const y = -0.9 - k * 0.85;
    for (const c of cells) {
      const r = Math.hypot(c.x, c.z);
      if (r > radiusAt(Math.atan2(c.z, c.x)) * shrink) continue;
      // jitter the outline a little so the layers read as rock, not a cone
      if (hash(c.x * 3 + k, c.z * 3 - k) < 0.08 && k > 0) continue;
      taper.push({ x: c.x, y, z: c.z, depth: k / layers });
    }
  }

  // the waterfall pours off the front-right rim
  const theta = 0.35;
  const er = radiusAt(theta) - 0.6;
  const edge = { x: Math.cos(theta) * er, z: Math.sin(theta) * er, h: heightAt(Math.cos(theta) * er, Math.sin(theta) * er) };

  return { cell, cells, taper, heightAt, edge };
}
