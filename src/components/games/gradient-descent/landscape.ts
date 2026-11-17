// Gradient Descent's loss landscape (PART 12): a procedural sum of Gaussians over a gentle bowl, with its analytic
// gradient. The ball's motion is literally heavy-ball gradient descent on it — no physics engine:
//   v ← μ·v − lr·∇h + tilt     p ← p + v       (12 visible iterations a second; rendering interpolates between them)
// Shared by the 3D scene (R3F) and the 2D fallback. Game copy, not data.

export type Bump = { x: number; y: number; a: number; s: number };
export type Point = { x: number; y: number };

export const HALF = 5; // the domain is [−5, 5]²
const BOWL = 0.018;
export const BUMPS: readonly Bump[] = [
  { x: 3.1, y: -2.9, a: -2.3, s: 0.85 }, // the global minimum
  { x: -2.6, y: 2.2, a: -1.05, s: 0.8 }, // local minima
  { x: 1.4, y: 2.9, a: -0.9, s: 0.7 },
  { x: -3.2, y: -2.4, a: -0.85, s: 0.75 },
  { x: 0.4, y: -0.3, a: 1.3, s: 1.1 }, // hills
  { x: -1.2, y: -1.8, a: 0.9, s: 0.9 },
  { x: 2.6, y: 0.9, a: 0.85, s: 0.85 },
  { x: -0.4, y: 3.6, a: 0.6, s: 0.9 },
];
export const GLOBAL = BUMPS[0];
export const LOCALS: readonly Bump[] = BUMPS.slice(1, 4);
export const START: Point = { x: -4.2, y: 4.1 };

export const ITER_MS = 1000 / 12;
export const MU = 0.85; // momentum
export const TILT = 0.045; // full tilt's push per iteration
export const WIN_RADIUS = 0.45;
export const HOLD_RADIUS = 0.4;
export const HOLD_MS = 2000;
export const DIVERGE_SPEED = 1.6; // units per iteration
/** The slider (0–100) on a log scale: 0 → 0.005, 40 → 0.05 (the default), 80 → 0.5, 100 → ≈1.58. */
export const lrOf = (v: number) => 0.005 * 10 ** (v / 40);
export const LR_DEFAULT = 40;

export function height(x: number, y: number): number {
  let h = BOWL * (x * x + y * y);
  for (const b of BUMPS) {
    const dx = x - b.x;
    const dy = y - b.y;
    h += b.a * Math.exp(-(dx * dx + dy * dy) / (2 * b.s * b.s));
  }
  return h;
}

export function gradient(x: number, y: number): [number, number] {
  let gx = 2 * BOWL * x;
  let gy = 2 * BOWL * y;
  for (const b of BUMPS) {
    const dx = x - b.x;
    const dy = y - b.y;
    const e = (b.a * Math.exp(-(dx * dx + dy * dy) / (2 * b.s * b.s))) / (b.s * b.s);
    gx -= e * dx;
    gy -= e * dy;
  }
  return [gx, gy];
}

/** The landscape's height range (sampled once), for the palette. */
export const RANGE: { min: number; max: number } = (() => {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i <= 80; i++)
    for (let j = 0; j <= 80; j++) {
      const h = height(-HALF + (i / 80) * 2 * HALF, -HALF + (j / 80) * 2 * HALF);
      min = Math.min(min, h);
      max = Math.max(max, h);
    }
  return { min, max };
})();

// height → color: deep violet in the pits, through cyan and lime, to yellow and pink on the hills (our palette)
const STOPS: readonly [number, [number, number, number]][] = [
  [0, [0x1b, 0x13, 0x36]],
  [0.22, [0x4c, 0x1d, 0x95]],
  [0.42, [0x0e, 0x74, 0x90]],
  [0.58, [0x22, 0xd3, 0xee]],
  [0.72, [0xb6, 0xff, 0x3b]],
  [0.86, [0xff, 0xd2, 0x3f]],
  [1, [0xff, 0x3d, 0x8b]],
];
/** RGB in 0–255 for a normalized height t ∈ [0, 1]. */
export function heightColor(t: number): [number, number, number] {
  const u = Math.min(1, Math.max(0, t));
  for (let i = 1; i < STOPS.length; i++) {
    const [b, cb] = STOPS[i];
    const [a, ca] = STOPS[i - 1];
    if (u <= b) {
      const k = (u - a) / (b - a);
      return [ca[0] + (cb[0] - ca[0]) * k, ca[1] + (cb[1] - ca[1]) * k, ca[2] + (cb[2] - ca[2]) * k];
    }
  }
  return STOPS[STOPS.length - 1][1];
}
export const normHeight = (h: number) => (h - RANGE.min) / (RANGE.max - RANGE.min);
