// Shared game helpers (PART 11). A fixed-timestep loop that only runs while a game is being played (R7: no always-on
// rAF), DPR-aware canvas sizing for canvas games (PART 12), DOM floaters for in-game effects (the FX canvas sits under
// the dialog's top layer, so games draw their own), and a seeded RNG so shuffles stay pure (seeds come from events).

export type Loop = { start(): void; stop(): void; readonly running: boolean };

/** Fixed 60 Hz game steps driven by rAF, then one render per frame (alpha = how far into the next step we are, for
 * interpolation). A long gap (a stalled frame) is dropped, never fast-forwarded. */
export function createLoop(step: (dtMs: number) => void, frame?: (alpha: number) => void, stepMs = 1000 / 60, maxSteps = 6): Loop {
  let raf = 0;
  let last = 0;
  let acc = 0;
  let on = false;
  const render = frame;
  const tick = (t: number) => {
    if (!on) return;
    acc += last ? Math.min(t - last, 100) : 0;
    last = t;
    let n = 0;
    while (acc >= stepMs && n < maxSteps) {
      step(stepMs);
      acc -= stepMs;
      n++;
    }
    if (n === maxSteps) acc = 0;
    if (!on) return; // a step ended the run
    render?.(acc / stepMs);
    raf = requestAnimationFrame(tick);
  };
  return {
    start() {
      if (on) return;
      on = true;
      last = 0;
      acc = 0;
      raf = requestAnimationFrame(tick);
    },
    stop() {
      on = false;
      cancelAnimationFrame(raf);
    },
    get running() {
      return on;
    },
  };
}

/** Sizes a canvas's drawing buffer to its CSS box × DPR (clamped, Bible §10) and returns a context in CSS pixels. */
export function fitCanvas(canvas: HTMLCanvasElement, maxDpr = 1.5): CanvasRenderingContext2D | null {
  const dpr = Math.min(maxDpr, Math.max(1, window.devicePixelRatio || 1));
  const box = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(box.width * dpr));
  const h = Math.max(1, Math.round(box.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export type FloatTone = "good" | "bad" | "gold";

/** A floating word ("+10", "MEANING −5") over the playfield; positions are relative to `host`. Reduced motion fades. */
export function floatText(host: HTMLElement | null, x: number, y: number, text: string, tone: FloatTone = "good", reduced = false): void {
  if (!host) return;
  const el = document.createElement("span");
  el.className = "gfloat";
  el.dataset.tone = tone;
  el.textContent = text;
  el.setAttribute("aria-hidden", "true");
  el.style.left = `${Math.round(x)}px`;
  el.style.top = `${Math.round(y)}px`;
  host.append(el);
  const frames = reduced
    ? [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }]
    : [
        { transform: "translate(-50%, 0) scale(0.6)", opacity: 0 },
        { transform: "translate(-50%, -14px) scale(1.12)", opacity: 1, offset: 0.25 },
        { transform: "translate(-50%, -40px) scale(1)", opacity: 0 },
      ];
  const a = el.animate(frames, { duration: reduced ? 900 : 760, easing: "ease-out" });
  const done = () => el.remove();
  a.onfinish = done;
  a.oncancel = done;
}

/** mulberry32: a tiny seeded PRNG in [0, 1). */
export function rng(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Roving focus in a grid of buttons: the next index for an arrow key (2D by measured rows), Home/End. */
export function gridStep(buttons: readonly HTMLElement[], from: number, key: string): number | null {
  const n = buttons.length;
  if (n === 0) return null;
  if (key === "Home") return 0;
  if (key === "End") return n - 1;
  if (key === "ArrowRight") return Math.min(n - 1, from + 1);
  if (key === "ArrowLeft") return Math.max(0, from - 1);
  if (key !== "ArrowUp" && key !== "ArrowDown") return null;
  const r = buttons[from].getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const down = key === "ArrowDown";
  let best: number | null = null;
  let bestScore = Infinity;
  buttons.forEach((b, i) => {
    if (i === from) return;
    const q = b.getBoundingClientRect();
    const dy = down ? q.top - r.bottom : r.top - q.bottom;
    if (dy < -r.height / 2) return; // not on another row in that direction
    const score = Math.abs(dy) * 4 + Math.abs(q.left + q.width / 2 - cx);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}

/** The resolved font-family list behind a CSS font variable (canvas text can't take `var(--font-display)`). */
export function cssFont(host: Element, variable: string): string {
  const probe = document.createElement("span");
  probe.style.fontFamily = `var(${variable})`;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  host.append(probe);
  const family = getComputedStyle(probe).fontFamily;
  probe.remove();
  return family || "sans-serif";
}

/** A rounded rectangle path (canvas). */
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
