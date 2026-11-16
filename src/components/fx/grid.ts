// Living grid background (PART 4 #3): a fixed canvas of 32px cells with faint lines, replacing the static CSS grid
// (which stays as the no-JS / reduced-motion fallback). "The floor lights up where you walk": cells near the pointer
// light up in --world with a slight hue drift and fade over 600ms; clicks send a ripple ring outward; when idle, sparse
// twinkles (attract mode). Lines are drawn once; each frame repaints only lit (dirty) cells, and the loop sleeps when
// nothing is lit. Never lights cells behind reading text (R6). Not mounted under reduced motion.

import type { GridEngine } from "@/lib/juice";

const CELL = 32;
const FADE = 600;
const RING_STEP = 38; // ms per ring of the click ripple
const RING_MAX: Record<string, number> = { chill: 4, normal: 7, chaos: 10 };
const IDLE_START = 7000; // attract mode after 7s without the pointer moving
const ATTRACT_FOR = 60000; // …for at most a minute, then the grid sleeps for real
const READ = "p, li, dd, dt, h1, h2, h3, h4, h5, h6, blockquote, figcaption, td, th, pre, label, legend, .read, [data-read]";

type Lit = { born: number; peak: number };
type Ripple = { c: number; r: number; born: number; max: number; done: number };
type Hsl = { h: number; s: number; l: number };

function parseColor(value: string): Hsl | null {
  const m = value.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i) ?? null;
  let r: number, g: number, b: number;
  if (m) {
    [r, g, b] = [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255];
  } else {
    const hex = value.trim().match(/^#([0-9a-f]{6})$/i);
    if (!hex) return null;
    const n = parseInt(hex[1], 16);
    [r, g, b] = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function createGrid(canvas: HTMLCanvasElement): GridEngine & { destroy(): void } {
  const ctx = canvas.getContext("2d");
  const root = document.documentElement;
  const lit = new Map<number, Lit>();
  const ripples: Ripple[] = [];
  let dpr = 1;
  let cols = 0;
  let rows = 0;
  let lineW = 1;
  let lineColor = "rgba(255,255,255,0.08)";
  let world: Hsl = { h: 45, s: 100, l: 62 };
  let worldReadAt = 0;
  let alphaMax = 0.42;
  let raf = 0;
  let lastCell = -1;
  let lastMove = performance.now();
  let twinkleTimer = 0;

  const fxLevel = () => root.getAttribute("data-fx") ?? "normal";
  const paused = () => root.hasAttribute("data-paused") || document.hidden;

  const cellX = (c: number) => Math.round(c * CELL * dpr);
  /** Device-pixel rect inside the grid lines of cell index i. */
  const cellRect = (i: number): [number, number, number, number] => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x0 = cellX(c) + lineW;
    const y0 = Math.round(r * CELL * dpr) + lineW;
    return [x0, y0, cellX(c + 1) - x0, Math.round((r + 1) * CELL * dpr) - y0];
  };

  const readTheme = () => {
    const cs = getComputedStyle(root);
    lineColor = cs.getPropertyValue("--line").trim() || lineColor;
    alphaMax = root.getAttribute("data-theme") === "day" ? 0.5 : 0.42;
  };
  const readWorld = (now: number) => {
    if (now - worldReadAt < 200) return; // --world animates between worlds; re-read at most 5×/s
    worldReadAt = now;
    const parsed = parseColor(getComputedStyle(root).getPropertyValue("--world"));
    if (parsed) world = parsed;
  };

  /** Full redraw: size + lines. Lit cells are repainted by the next frame. */
  const drawLines = () => {
    if (!ctx) return;
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    lineW = Math.max(1, Math.round(dpr * 0.75));
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    cols = Math.ceil(window.innerWidth / CELL) + 1;
    rows = Math.ceil(window.innerHeight / CELL) + 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = lineColor;
    for (let c = 0; c <= cols; c++) ctx.fillRect(cellX(c), 0, lineW, canvas.height);
    for (let r = 0; r <= rows; r++) ctx.fillRect(0, Math.round(r * CELL * dpr), canvas.width, lineW);
    lit.clear();
    ripples.length = 0;
  };

  const setAwake = (on: boolean) => {
    if (on) canvas.setAttribute("data-awake", "");
    else canvas.removeAttribute("data-awake");
  };
  const wake = () => {
    if (raf) return;
    setAwake(true);
    raf = requestAnimationFrame(frame);
  };

  const light = (i: number, peak: number, now: number) => {
    if (i < 0 || i >= cols * rows) return;
    const cur = lit.get(i);
    const curLevel = cur ? cur.peak * (1 - (now - cur.born) / FADE) : 0;
    if (peak >= curLevel) lit.set(i, { born: now, peak });
  };

  function frame(now: number) {
    raf = 0;
    if (!ctx) return;
    readWorld(now);
    // ripples: light the next ring(s)
    for (let k = ripples.length - 1; k >= 0; k--) {
      const rp = ripples[k];
      const ring = Math.min(rp.max, Math.floor((now - rp.born) / RING_STEP));
      for (let r = rp.done + 1; r <= ring; r++) {
        const cc = rp.c % cols;
        const cr = Math.floor(rp.c / cols);
        for (let y = cr - r; y <= cr + r; y++) {
          for (let x = cc - r; x <= cc + r; x++) {
            if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
            if (Math.round(Math.hypot(x - cc, y - cr)) !== r) continue;
            light(y * cols + x, 0.85 * (1 - r / (rp.max + 1)), now);
          }
        }
      }
      rp.done = ring;
      if (ring >= rp.max) ripples.splice(k, 1);
    }
    // repaint dirty cells
    for (const [i, cell] of lit) {
      const [x, y, cw, ch] = cellRect(i);
      ctx.clearRect(x, y, cw, ch);
      const t = (now - cell.born) / FADE;
      if (t >= 1) {
        lit.delete(i);
        continue;
      }
      const level = cell.peak * (1 - t);
      const drift = Math.sin(i * 0.7 + now / 900) * 18; // slight rainbow hue drift
      ctx.fillStyle = `hsla(${(world.h + drift + 360) % 360}, ${world.s.toFixed(1)}%, ${world.l.toFixed(1)}%, ${(level * alphaMax).toFixed(3)})`;
      ctx.fillRect(x, y, cw, ch);
    }
    if (lit.size || ripples.length) raf = requestAnimationFrame(frame);
    else setAwake(false);
  }

  const cellAt = (x: number, y: number) => {
    const c = Math.floor(x / CELL);
    const r = Math.floor(y / CELL);
    return c < 0 || r < 0 || c >= cols || r >= rows ? -1 : r * cols + c;
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return; // touch: taps ripple (click juice), no hover lighting
    lastMove = performance.now();
    if (paused()) return;
    const i = cellAt(e.clientX, e.clientY);
    if (i === lastCell) return;
    lastCell = i;
    if (i < 0) return;
    // reading zones stay calm (R6): no lighting behind paragraphs
    if (e.target instanceof Element && e.target.closest(READ)) return;
    const now = performance.now();
    const c = i % cols;
    const r = Math.floor(i / cols);
    const radius = fxLevel() === "chill" ? 0 : 1;
    for (let y = r - radius; y <= r + radius; y++) {
      for (let x = c - radius; x <= c + radius; x++) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        const d = Math.hypot(x - c, y - r);
        if (d > 1.5) continue;
        light(y * cols + x, d === 0 ? 1 : 0.45, now);
      }
    }
    wake();
  };

  // attract mode: sparse twinkles while nobody moves (not in CHILL, not while paused/hidden, and only for a minute)
  const scheduleTwinkle = () => {
    window.clearTimeout(twinkleTimer);
    twinkleTimer = window.setTimeout(twinkle, 900 + Math.random() * 800);
  };
  function twinkle() {
    const idle = performance.now() - lastMove;
    if (idle > IDLE_START && idle < IDLE_START + ATTRACT_FOR && !paused() && fxLevel() !== "chill") {
      for (let tries = 0; tries < 5; tries++) {
        const i = Math.floor(Math.random() * cols * rows);
        const c = i % cols;
        const r = Math.floor(i / cols);
        const el = document.elementFromPoint(c * CELL + CELL / 2, r * CELL + CELL / 2);
        if (el && el.closest(READ)) continue; // never behind text
        light(i, 0.7, performance.now());
        wake();
        break;
      }
    }
    scheduleTwinkle();
  }

  const onResize = () => drawLines();
  const themeObserver = new MutationObserver(() => {
    readTheme();
    drawLines();
  });

  readTheme();
  drawLines();
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("resize", onResize);
  themeObserver.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  scheduleTwinkle();
  root.setAttribute("data-grid", "live");

  return {
    ripple(x, y) {
      const i = cellAt(x, y);
      if (i < 0 || paused()) return;
      ripples.push({ c: i, r: 0, born: performance.now(), max: RING_MAX[fxLevel()] ?? 7, done: -1 });
      if (ripples.length > 6) ripples.shift();
      wake();
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.clearTimeout(twinkleTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      themeObserver.disconnect();
      root.removeAttribute("data-grid");
      setAwake(false);
    },
  };
}
