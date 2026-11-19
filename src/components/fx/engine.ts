// The ONE FX overlay canvas (Bible §7): bursts, floating text, confetti, the cursor trail, pixel dissolves, hit-stop
// and shake. Fixed, pointer-events:none, DPR ≤ 1.5, above the HUD and below the top layer (dialogs, toasts and the
// cursor follower stay on top — R2). The rAF loop runs only while something is alive; when the last particle dies it
// clears once and sleeps (data-awake is removed). Everything scales with <html data-fx>; under reduced motion the FX
// layer is not mounted at all (see FxLayer).

import type { BurstOptions, BurstShape, ConfettiStyle, DissolveOptions, FloatTextOptions, FxEngine } from "@/lib/juice";
import { readZoneRects, type Zone } from "./readZones";

const INK = "#07060f";
const RAINBOW = ["#FF3D8B", "#FF8A1F", "#FFD23F", "#B6FF3B", "#22D3EE", "#A78BFA", "#2EE59D"];
const GOLD = { g: "#FFC83D", h: "#FFF1A8", d: "#C98A00" };
const BURST_COUNT: Record<string, number> = { chill: 4, normal: 10, chaos: 24 };
const CONFETTI_COUNT: Record<string, number> = { chill: 40, normal: 110, chaos: 220 };
const TRAIL_MAX: Record<string, number> = { chill: 6, normal: 10, chaos: 14 };
const TRAIL_LIFE = 280;
const MAX_PARTICLES = 700;

// 5×5 pixel shapes: "#" = the particle color, letters = fixed palette (coins)
const BITMAPS: Record<"star" | "heart" | "coin", readonly string[]> = {
  star: ["..#..", ".###.", "#####", ".###.", ".#.#."],
  heart: [".#.#.", "#####", "#####", ".###.", "..#.."],
  coin: [".ggg.", "ghggd", "ghggd", "gggdd", ".gdd."],
};

type Kind = BurstShape | "confetti" | "trail";
type Particle = {
  kind: Kind;
  shape: BurstShape;
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  drag: number;
  born: number;
  life: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  wob: number;
};
type FloatText = { text: string; x: number; y: number; born: number; life: number; rise: number; color: string; size: number; weight: number; family: string };
type Dissolve = {
  started: number;
  cover: number;
  reveal: number;
  cell: number;
  cols: number;
  rows: number;
  order: Float32Array;
  colors: string[];
  covered: () => void;
  coveredFired: boolean;
};

const fxLevel = () => document.documentElement.getAttribute("data-fx") ?? "normal";
// PART 17 · Handheld Mode is lighter: fewer particles per burst and in the confetti
const handheld = typeof window !== "undefined" ? window.matchMedia("(pointer: coarse), (max-width: 47.99rem)") : null;
const lighter = (n: number) => (handheld?.matches ? Math.max(1, Math.round(n * 0.6)) : n);
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

export function createFxEngine(canvas: HTMLCanvasElement, opts: { shakeTargets?: () => (Element | null)[] } = {}): FxEngine & { destroy(): void } {
  const ctx = canvas.getContext("2d");
  const parts: Particle[] = [];
  const texts: FloatText[] = [];
  let trailCount = 0;
  let dissolve: Dissolve | null = null;
  let raf = 0;
  let last = 0;
  let frozenUntil = 0;
  let dpr = 1;
  let w = 0;
  let h = 0;
  let sizeDirty = true;
  const fonts = { pixel: "", display: "" };
  const fontFor = (kind: "pixel" | "display") => {
    if (!fonts[kind]) {
      const v = getComputedStyle(document.documentElement).getPropertyValue(kind === "pixel" ? "--font-pixelface" : "--font-unbounded").trim();
      const fallback = kind === "pixel" ? "monospace" : "sans-serif";
      fonts[kind] = v ? `${v}, ${fallback}` : fallback;
    }
    return fonts[kind];
  };
  let lastTrail = { x: -999, y: -999, t: 0 };
  const sprites = new Map<string, HTMLCanvasElement>();

  const resize = () => {
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    sizeDirty = false;
  };
  const onResize = () => {
    sizeDirty = true;
  };
  window.addEventListener("resize", onResize);

  /** Pre-rendered sprite (shape + color + pixel size) with a 1px ink rim, so particles read on light and dark. */
  const sprite = (shape: BurstShape, color: string, px: number): HTMLCanvasElement => {
    const key = `${shape}|${color}|${px}`;
    const hit = sprites.get(key);
    if (hit) return hit;
    const c = document.createElement("canvas");
    const g = c.getContext("2d");
    if (shape === "pixel" || shape === "spark") {
      const s = px;
      c.width = c.height = s + 2;
      if (g) {
        g.fillStyle = INK;
        g.fillRect(0, 0, s + 2, s + 2);
        g.fillStyle = color;
        g.fillRect(1, 1, s, s);
      }
    } else {
      const rows = BITMAPS[shape];
      const size = rows.length * px + 2;
      c.width = c.height = size;
      if (g) {
        const cells: [number, number, string][] = [];
        rows.forEach((row, y) =>
          [...row].forEach((ch, x) => {
            if (ch === ".") return;
            const fill = ch === "#" ? color : GOLD[ch as keyof typeof GOLD];
            cells.push([x, y, fill]);
          }),
        );
        g.fillStyle = INK;
        for (const [x, y] of cells) g.fillRect(x * px, y * px, px + 2, px + 2);
        for (const [x, y, fill] of cells) {
          g.fillStyle = fill;
          g.fillRect(x * px + 1, y * px + 1, px, px);
        }
      }
    }
    if (sprites.size > 200) sprites.clear();
    sprites.set(key, c);
    return c;
  };

  const setAwake = (on: boolean) => {
    if (on) canvas.setAttribute("data-awake", "");
    else canvas.removeAttribute("data-awake");
  };

  const wake = () => {
    if (raf) return;
    if (sizeDirty) resize();
    last = performance.now();
    setAwake(true);
    raf = requestAnimationFrame(frame);
  };

  const push = (p: Particle) => {
    if (parts.length >= MAX_PARTICLES) parts.shift();
    parts.push(p);
  };

  function drawParticle(p: Particle, now: number) {
    if (!ctx) return;
    const t = (now - p.born) / p.life;
    ctx.globalAlpha = Math.max(0, t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4);
    if (p.kind === "trail") {
      trailCount++;
      const s = Math.max(2, Math.round(p.size * (0.35 + 0.65 * (1 - t))));
      ctx.drawImage(sprite("pixel", p.color, s), Math.round(p.x - s / 2) - 1, Math.round(p.y - s / 2) - 1);
    } else if (p.kind === "confetti") {
      const img = sprite(p.shape, p.color, p.shape === "pixel" ? p.size : 2);
      const flip = Math.cos(p.wob * 2.2); // paper turning over
      ctx.setTransform(dpr * Math.cos(p.rot), dpr * Math.sin(p.rot), -dpr * Math.sin(p.rot) * flip, dpr * Math.cos(p.rot) * flip, p.x * dpr, p.y * dpr);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    } else if (p.kind === "spark") {
      const len = Math.min(14, Math.hypot(p.vx, p.vy) * 22);
      const ang = Math.atan2(p.vy, p.vx);
      ctx.setTransform(dpr * Math.cos(ang), dpr * Math.sin(ang), -dpr * Math.sin(ang), dpr * Math.cos(ang), p.x * dpr, p.y * dpr);
      ctx.fillStyle = INK;
      ctx.fillRect(-len - 1, -2, len + 2, 4);
      ctx.fillStyle = p.color;
      ctx.fillRect(-len, -1, len, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    } else {
      const px = p.kind === "pixel" ? Math.max(2, Math.round(p.size * (1 - t * 0.5))) : 2;
      const img = sprite(p.kind, p.color, px);
      ctx.drawImage(img, Math.round(p.x - img.width / 2), Math.round(p.y - img.height / 2));
    }
  }

  // Confetti never sits on reading text (R6): erase the text boxes from it, as if it fell behind the words. The boxes
  // are re-measured after scrolling and at most every 300ms (only while confetti is alive).
  let zones: Zone[] = [];
  let zonesAt = -1e9;
  let zonesDirty = true;
  const onScroll = () => {
    zonesDirty = true;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  function maskReadZones(now: number) {
    if (!ctx) return;
    if (zonesDirty || now - zonesAt > 300) {
      zones = readZoneRects();
      zonesAt = now;
      zonesDirty = false;
    }
    if (!zones.length) return;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
    for (const z of zones) ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.globalCompositeOperation = "source-over";
  }

  function frame(now: number) {
    raf = 0;
    if (!ctx) return;
    if (sizeDirty) resize();
    const dt = Math.min(50, now - last);
    last = now;
    const frozen = now < frozenUntil;
    ctx.clearRect(0, 0, w, h);

    // particles: physics first, then confetti under the reading-zone mask, then everything else on top
    let write = 0;
    let confetti = 0;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const age = now - p.born;
      if (age >= p.life) continue;
      if (age < 0) {
        parts[write++] = p; // staggered spawn: not born yet
        continue;
      }
      if (!frozen) {
        const k = Math.pow(p.drag, dt);
        p.vx *= k;
        p.vy = p.vy * k + p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === "confetti") {
          p.rot += p.vr * dt;
          p.wob += dt * 0.012;
          p.x += Math.sin(p.wob) * 0.06 * dt;
        }
      }
      if (p.kind === "confetti") confetti++;
      parts[write++] = p;
    }
    parts.length = write;
    trailCount = 0;
    if (confetti) {
      for (const p of parts) if (p.kind === "confetti" && now >= p.born) drawParticle(p, now);
      maskReadZones(now);
    }
    for (const p of parts) if (p.kind !== "confetti" && now >= p.born) drawParticle(p, now);

    // floating text
    if (texts.length) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      let tw = 0;
      for (let i = 0; i < texts.length; i++) {
        const tx = texts[i];
        const age = now - tx.born;
        if (age >= tx.life) continue;
        const t = age / tx.life;
        const ease = 1 - Math.pow(1 - t, 3);
        const pop = t < 0.12 ? 1.3 - (t / 0.12) * 0.3 : 1;
        ctx.globalAlpha = t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35;
        ctx.font = `${tx.weight} ${Math.round(tx.size * pop)}px ${tx.family}`;
        const y = tx.y - tx.rise * ease;
        ctx.lineWidth = 5;
        ctx.strokeStyle = INK;
        ctx.strokeText(tx.text, tx.x, y);
        ctx.fillStyle = tx.color;
        ctx.fillText(tx.text, tx.x, y);
        texts[tw++] = tx;
      }
      texts.length = tw;
    }

    // pixel dissolve (cover → resolve → reveal)
    if (dissolve) {
      const d = dissolve;
      const age = now - d.started;
      const covering = age < d.cover;
      const p = covering ? age / d.cover : (age - d.cover) / d.reveal;
      ctx.globalAlpha = 1;
      for (let r = 0; r < d.rows; r++) {
        for (let c = 0; c < d.cols; c++) {
          const o = d.order[r * d.cols + c];
          const on = covering ? o <= p : o > p;
          if (!on) continue;
          ctx.fillStyle = d.colors[(r * 7 + c * 3) % d.colors.length];
          ctx.fillRect(c * d.cell, r * d.cell, d.cell + 1, d.cell + 1);
        }
      }
      if (!covering && !d.coveredFired) {
        d.coveredFired = true;
        d.covered();
      }
      if (age >= d.cover + d.reveal) dissolve = null;
    }

    ctx.globalAlpha = 1;
    if (parts.length || texts.length || dissolve) raf = requestAnimationFrame(frame);
    else {
      ctx.clearRect(0, 0, w, h);
      setAwake(false);
    }
  }

  const engine: FxEngine & { destroy(): void } = {
    burst(x, y, o: BurstOptions = {}) {
      const level = fxLevel();
      const count = lighter(Math.max(1, Math.round(o.count ?? BURST_COUNT[level] ?? 10)));
      const colors = o.colors?.length ? o.colors : RAINBOW;
      const shape = o.shape ?? "pixel";
      const power = o.power ?? 1;
      const now = performance.now();
      canvas.setAttribute("data-last-burst", String(count));
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2 + rand(-0.35, 0.35);
        const speed = rand(0.18, 0.42) * power * (shape === "heart" ? 0.6 : 1);
        push({
          kind: shape,
          shape,
          x,
          y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed - (shape === "heart" ? 0.12 : 0.05),
          g: shape === "heart" ? -0.0002 : 0.0011,
          drag: 0.994,
          born: now,
          life: rand(420, 680) * (shape === "heart" ? 1.5 : 1),
          size: Math.round(rand(4, 7)),
          color: pick(colors),
          rot: 0,
          vr: 0,
          wob: 0,
        });
      }
      wake();
    },

    text(x, y, text, o: FloatTextOptions = {}) {
      if (texts.length > 12) texts.shift();
      canvas.setAttribute("data-last-text", text);
      const display = o.font === "display";
      texts.push({ text, x, y, born: performance.now(), life: o.ms ?? 760, rise: o.rise ?? 34, color: o.color ?? "#FFD23F", size: o.size ?? 18, weight: display ? 800 : 500, family: fontFor(display ? "display" : "pixel") });
      wake();
    },

    confetti(o: { style?: ConfettiStyle } = {}) {
      const style = o.style ?? "pixels";
      const count = lighter(CONFETTI_COUNT[fxLevel()] ?? 110);
      canvas.setAttribute("data-last-confetti", `${count} ${style}`);
      const shape: BurstShape = style === "stars" ? "star" : style === "hearts" ? "heart" : style === "coins" ? "coin" : "pixel";
      const colors = style === "hearts" ? ["#FF3D8B", "#FF4D4D", "#FFF4E0"] : style === "coins" ? [GOLD.g] : RAINBOW;
      if (sizeDirty) resize();
      const now = performance.now();
      // two cannons near the top corners, aimed inward and up — the shower falls mostly toward the edges
      for (let i = 0; i < count; i++) {
        const left = i % 2 === 0;
        const ox = left ? w * 0.08 : w * 0.92;
        const a = rand(0.15, 1.37); // 0 = flat, π/2 = straight up
        const ang = left ? -a : -Math.PI + a;
        const speed = rand(0.55, 1.15);
        push({
          kind: "confetti",
          shape,
          x: ox + rand(-12, 12),
          y: h * 0.18 + rand(-10, 10),
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          g: 0.0011,
          drag: 0.9965,
          born: now + rand(0, 140),
          life: rand(1900, 2700),
          size: Math.round(rand(5, 8)),
          color: pick(colors),
          rot: rand(0, Math.PI * 2),
          vr: rand(-0.012, 0.012),
          wob: rand(0, Math.PI * 2),
        });
      }
      wake();
    },

    shake(intensity = 4, target) {
      const level = fxLevel();
      const amp = Math.min(6, intensity * (level === "chill" ? 0.5 : level === "chaos" ? 1.3 : 1));
      if (amp <= 0) return;
      const frames = Array.from({ length: 6 }, (_, i) => {
        const k = 1 - i / 6;
        return { translate: `${rand(-amp, amp) * k}px ${rand(-amp, amp) * k}px` };
      });
      frames.push({ translate: "0px 0px" });
      const els = [canvas, ...(opts.shakeTargets?.() ?? []), target ?? null].filter((el): el is Element => !!el);
      for (const el of els) el.animate(frames, { duration: 180, easing: "linear" });
    },

    hitStop(ms) {
      const t = Math.max(0, Math.min(120, ms));
      frozenUntil = Math.max(frozenUntil, performance.now() + t);
      return new Promise((resolve) => window.setTimeout(resolve, t));
    },

    pixelDissolve(o: DissolveOptions = {}) {
      if (sizeDirty) resize();
      const cell = 24;
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      const order = new Float32Array(cols * rows);
      const dir = o.direction ?? "down";
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const base = dir === "down" ? r / rows : dir === "up" ? 1 - r / rows : dir === "right" ? c / cols : 1 - c / cols;
          order[r * cols + c] = Math.min(0.999, base * 0.75 + Math.random() * 0.25);
        }
      }
      dissolve?.covered(); // a newer dissolve replaces a running one
      return new Promise<void>((resolve) => {
        dissolve = {
          started: performance.now(),
          cover: 320,
          reveal: 320,
          cell,
          cols,
          rows,
          order,
          colors: o.color ? [o.color] : RAINBOW,
          covered: resolve,
          coveredFired: false,
        };
        wake();
      });
    },

    trail(x, y, color) {
      const now = performance.now();
      if (Math.hypot(x - lastTrail.x, y - lastTrail.y) < 7 && now - lastTrail.t < 40) return;
      lastTrail = { x, y, t: now };
      const max = TRAIL_MAX[fxLevel()] ?? 10;
      if (trailCount >= max) {
        const i = parts.findIndex((p) => p.kind === "trail");
        if (i >= 0) parts.splice(i, 1);
      }
      trailCount++;
      push({ kind: "trail", shape: "pixel", x, y, vx: 0, vy: 0, g: 0, drag: 1, born: now, life: TRAIL_LIFE, size: rand(5, 8), color, rot: 0, vr: 0, wob: 0 });
      wake();
    },

    clearTrail() {
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].kind === "trail") parts.splice(i, 1);
      trailCount = 0;
    },

    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      parts.length = 0;
      texts.length = 0;
      dissolve?.covered();
      dissolve = null;
      sprites.clear();
    },
  };
  return engine;
}
