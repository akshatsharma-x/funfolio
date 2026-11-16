// Juice kit API (Bible §4). A thin, always-safe facade: the FX engine (src/components/fx/engine.ts — the one overlay
// canvas) and the living grid (src/components/fx/grid.ts) register themselves when the lazy game runtime mounts them.
// Until then — and under reduced motion, where they never start — every call is a cheap no-op, so any module can
// call fx.* without importing the engines (keeps them out of the initial bundle).

export type BurstShape = "pixel" | "star" | "coin" | "heart" | "spark";
export type BurstOptions = {
  /** Default scales with <html data-fx>: chill 4 · normal 10 · chaos 24. */
  count?: number;
  colors?: string[];
  shape?: BurstShape;
  /** Launch speed multiplier (1 = default). */
  power?: number;
};
/** `font: "display"` draws the text in the display face — use it for scores: the pixel face's 5/S and 0/O look alike. */
export type FloatTextOptions = { color?: string; size?: number; rise?: number; ms?: number; font?: "pixel" | "display" };
export type ConfettiStyle = "pixels" | "stars" | "hearts" | "coins";
export type DissolveDirection = "up" | "down" | "left" | "right";
export type DissolveOptions = { color?: string; direction?: DissolveDirection };

export type FxEngine = {
  burst(x: number, y: number, opts?: BurstOptions): void;
  text(x: number, y: number, text: string, opts?: FloatTextOptions): void;
  confetti(opts?: { style?: ConfettiStyle }): void;
  shake(intensity?: number, target?: HTMLElement | null): void;
  hitStop(ms: number): Promise<void>;
  pixelDissolve(opts?: DissolveOptions): Promise<void>;
  trail(x: number, y: number, color: string): void;
  clearTrail(): void;
};

export type GridEngine = { ripple(x: number, y: number): void };

let engine: FxEngine | null = null;
let grid: GridEngine | null = null;

/** Called by the FX layer on mount (and with null on unmount). */
export function registerFx(next: FxEngine | null): void {
  engine = next;
}

export function registerGrid(next: GridEngine | null): void {
  grid = next;
}

export const fx = {
  /** Particle burst at viewport coordinates. */
  burst(x: number, y: number, opts?: BurstOptions): void {
    engine?.burst(x, y, opts);
  },
  /** Floating text like "+10 XP" or "CRIT!". */
  text(x: number, y: number, text: string, opts?: FloatTextOptions): void {
    engine?.text(x, y, text, opts);
  },
  /** Celebration confetti (styles are Prize Counter unlocks). */
  confetti(opts?: { style?: ConfettiStyle }): void {
    engine?.confetti(opts);
  },
  /** Screen shake — ≤ 6px, ≤ 200ms. Shakes the FX + grid layers (never the reading content, R6) and `target` if given
   *  (a game passes its own playfield). */
  shake(intensity = 4, target?: HTMLElement | null): void {
    engine?.shake(intensity, target);
  },
  /** Hit-stop freeze (50–80ms), games only. Resolves when time resumes. */
  hitStop(ms = 60): Promise<void> {
    return engine ? engine.hitStop(ms) : Promise.resolve();
  },
  /** Ripple ring on the background grid. */
  ripple(x: number, y: number): void {
    grid?.ripple(x, y);
  },
  /** Multicolor pixel-dissolve transition. Resolves once the screen is covered; the reveal follows on its own. */
  pixelDissolve(opts?: DissolveOptions): Promise<void> {
    return engine ? engine.pixelDissolve(opts) : Promise.resolve();
  },
  /** Cursor trail square (called by the cursor engine on pointer moves). */
  trail(x: number, y: number, color: string): void {
    engine?.trail(x, y, color);
  },
  clearTrail(): void {
    engine?.clearTrail();
  },
};
