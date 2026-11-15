// Juice kit API (Bible §4) — STUBS. PART 4 implements these on the single FX overlay canvas (FxCanvas), scaled by
// <html data-fx> and disabled/softened under reduced motion. Every call is safe today: it does nothing.

export type BurstShape = "pixel" | "star" | "coin" | "heart" | "spark";
export type BurstOptions = { count?: number; colors?: string[]; shape?: BurstShape };
export type FloatTextOptions = { color?: string; size?: number };
export type ConfettiStyle = "pixels" | "stars" | "hearts" | "coins";
export type DissolveDirection = "up" | "down" | "left" | "right";
export type DissolveOptions = { color?: string; direction?: DissolveDirection };

export const fx = {
  /** Particle burst at viewport coordinates. */
  burst(_x: number, _y: number, _opts?: BurstOptions): void {},
  /** Floating text like "+10 XP" or "CRIT!". */
  text(_x: number, _y: number, _text: string, _opts?: FloatTextOptions): void {},
  /** Celebration confetti (styles are Prize Counter unlocks). */
  confetti(_opts?: { style?: ConfettiStyle }): void {},
  /** Screen shake — games/celebrations only, ≤ 6px, ≤ 200ms. */
  shake(_intensity?: number): void {},
  /** Hit-stop freeze (50–80ms), games only. Resolves when time resumes. */
  hitStop(_ms = 60): Promise<void> {
    return Promise.resolve();
  },
  /** Ripple ring on the background grid. */
  ripple(_x: number, _y: number): void {},
  /** Multicolor pixel-dissolve transition. Resolves when covered/revealed. */
  pixelDissolve(_opts?: DissolveOptions): Promise<void> {
    return Promise.resolve();
  },
};
