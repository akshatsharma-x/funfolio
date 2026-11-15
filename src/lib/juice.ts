// Juice kit API (Bible §4). PART 4 implements these on the single FX overlay canvas (FxCanvas), scaled by
// <html data-fx> and disabled/softened under reduced motion. Every call is safe today.
// confetti() is live since PART 3 (level-ups) on canvas-confetti's own canvas — PART 4 moves it onto the FX canvas.

import { prefersReducedMotion } from "./hooks/useReducedMotion";

const CONFETTI_COLORS = ["#FF3D8B", "#FF8A1F", "#FFD23F", "#B6FF3B", "#22D3EE", "#A78BFA", "#2EE59D"];
const CONFETTI_COUNT: Record<string, number> = { chill: 40, normal: 110, chaos: 220 };

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
  /** Celebration confetti (styles are Prize Counter unlocks). Lazy-loaded; nothing under reduced motion. */
  confetti(opts?: { style?: ConfettiStyle }): void {
    if (typeof window === "undefined" || prefersReducedMotion()) return;
    const level = document.documentElement.getAttribute("data-fx") ?? "normal";
    const style = opts?.style ?? "pixels";
    void import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: CONFETTI_COUNT[level] ?? 110,
        spread: 80,
        startVelocity: 40,
        ticks: 180,
        origin: { y: 0.12 },
        colors: style === "coins" ? ["#FFC83D", "#FFF1A8", "#C98A00"] : style === "hearts" ? ["#FF3D8B", "#FF4D4D", "#FFF4E0"] : CONFETTI_COLORS,
        shapes: style === "stars" ? ["star"] : style === "coins" ? ["circle"] : ["square"],
        scalar: style === "pixels" ? 0.8 : 1,
        disableForReducedMotion: true,
        zIndex: 2147483000,
      });
    });
  },
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
