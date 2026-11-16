// The Bug Fortress (PART 7) in world units: a 1600 × 1000 stage (16:10) the canvas scales to fit. Tuned in Node with
// the engine's own integration, launching from where BYTE is pulled back to: the longest full pull lands ≈ 1524 (past
// the far tower); only a full-power lob at ≈ 50–58° reaches the coin above the front tower (never at ≤ 88% power).

export const WORLD = { w: 1600, h: 1000, groundY: 920 } as const;

export const PHYSICS = {
  /** Fixed timestep (ms) — one Engine.update per tick. */
  dt: 1000 / 60,
  gravityY: 1,
  gravityScale: 0.001,
  /** BYTE's air friction; the trajectory preview uses the very same number. */
  frictionAir: 0.004,
  /** Launch speed at full power (world units per tick). */
  vmax: 22,
  /** Pull radius in world units (the screen radius never drops under 88px, so phones get a usable drag). */
  pullMax: 170,
  minPower: 0.22,
  /** Launch angle limits (degrees above the horizon). */
  minAngle: -10,
  maxAngle: 78,
} as const;

/** Gravity per tick exactly as Matter applies it: force = mass · g · scale, integrated as (force / mass) · dt². */
export const G_TICK = PHYSICS.gravityY * PHYSICS.gravityScale * PHYSICS.dt * PHYSICS.dt;

export const ANCHOR = { x: 262, y: 700 } as const; // BYTE at rest, between the pylon tips
export const PYLONS = [
  { x: 226, top: 650 },
  { x: 298, top: 650 },
] as const;
export const BYTE_R = 30;
export const COIN = { x: 1080, y: 400, r: 30 } as const;

export const CRATE = 92;
/**
 * Crate labels: DM Sans 800 caps (the pixel face's C/O, 5/S and 0/O look alike at this size — "500 ERROR" read
 * "SOO ERROR"). One line at 16 units, two at 14; `y` is each line's alphabetic baseline, caps (≈ 0.7em) centered on
 * the lime stripe. Shared by the canvas renderer and the server poster.
 */
export const CRATE_TEXT = { weight: 800, one: 16, two: 14, maxWidth: CRATE - 14 } as const;
export function crateText(label: string): { size: number; lines: { text: string; y: number }[] } {
  const words = label.split(" ");
  const cut = Math.ceil(words.length / 2);
  const lines = words.length > 1 ? [words.slice(0, cut).join(" "), words.slice(cut).join(" ")] : [label];
  const size = lines.length > 1 ? CRATE_TEXT.two : CRATE_TEXT.one;
  const centers = lines.length > 1 ? [-7.5, 7.5] : [0];
  return { size, lines: lines.map((text, i) => ({ text, y: centers[i] + size * 0.35 })) };
}
/** Bottom → top. Nine dev nightmares (original labels). */
export const TOWERS = [
  { x: 1080, labels: ["LEGACY CODE", "TECH DEBT", "MERGE CONFLICT"] },
  { x: 1265, labels: ["NULL POINTER", "FLAKY TEST", "MEMORY LEAK"] },
  { x: 1450, labels: ["CORS ERROR", "TIMEOUT", "500 ERROR"] },
] as const;

export const BUG_R = 26;
/** One glitch-bug on each tower, two guarding the gaps on the ground. */
export const BUGS: readonly ({ tower: number } | { ground: number })[] = [{ tower: 0 }, { tower: 1 }, { tower: 2 }, { ground: 1172 }, { ground: 1357 }];

export const SHOTS = 3;
export const SCORE = { bug: 500, crate: 50 } as const;

/** Impact speed (relative speed along the contact normal, world units / tick) that pops a bug, and a "big hit". */
export const POP_SPEED = 4.2;
export const BIG_HIT = 9;
/** A bug that drops this far below where it stood has fallen (pops); a crate tipped this far (rad) is toppled. */
export const FALL = 70;
export const TOPPLE = 0.5;
export const TOPPLE_SHIFT = 45;

/** Preview: 12 dots, one every 3 ticks. */
export const PREVIEW_DOTS = 12;
export const PREVIEW_EVERY = 3;
