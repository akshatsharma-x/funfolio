// Pixel trail for the cursor follower — TEMPORARY own canvas; PART 4 moves it onto the shared FX overlay canvas.
// ≤ 14 squares, 280ms life, only while the pointer moves; clears only the dirty area; draw() returns false when empty.

const LIFE = 280;
const MAX_BY_FX: Record<string, number> = { chill: 6, normal: 10, chaos: 14 };

type Particle = { x: number; y: number; born: number; color: string; size: number };

export type Trail = {
  add(x: number, y: number, color: string): void;
  draw(now: number): boolean;
  clear(): void;
  destroy(): void;
};

export function createTrail(canvas: HTMLCanvasElement): Trail {
  const ctx = canvas.getContext("2d");
  const parts: Particle[] = [];
  let dpr = 1;
  let dirty: [number, number, number, number] | null = null;
  let lastX = -999;
  let lastY = -999;
  let lastAdd = 0;

  const resize = () => {
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = null;
  };
  resize();
  window.addEventListener("resize", resize);

  return {
    add(x, y, color) {
      const now = performance.now();
      if (Math.hypot(x - lastX, y - lastY) < 7 && now - lastAdd < 40) return;
      lastX = x;
      lastY = y;
      lastAdd = now;
      parts.push({ x, y, born: now, color, size: 5 + Math.random() * 3 });
      const max = MAX_BY_FX[document.documentElement.getAttribute("data-fx") ?? "normal"] ?? 10;
      while (parts.length > max) parts.shift();
    },
    draw(now) {
      if (!ctx) return false;
      if (dirty) ctx.clearRect(dirty[0], dirty[1], dirty[2] - dirty[0], dirty[3] - dirty[1]);
      while (parts.length > 0 && now - parts[0].born > LIFE) parts.shift();
      if (parts.length === 0) {
        dirty = null;
        return false;
      }
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const p of parts) {
        const k = 1 - (now - p.born) / LIFE;
        const s = Math.max(2, Math.round(p.size * (0.35 + 0.65 * k)));
        const px = Math.round(p.x - s / 2);
        const py = Math.round(p.y - s / 2);
        ctx.globalAlpha = 0.55 * k;
        ctx.fillStyle = "#07060f";
        ctx.fillRect(px - 1, py - 1, s + 2, s + 2); // ink rim so squares read on light backgrounds too
        ctx.globalAlpha = k;
        ctx.fillStyle = p.color;
        ctx.fillRect(px, py, s, s);
        x0 = Math.min(x0, px - 2);
        y0 = Math.min(y0, py - 2);
        x1 = Math.max(x1, px + s + 2);
        y1 = Math.max(y1, py + s + 2);
      }
      ctx.globalAlpha = 1;
      dirty = [x0, y0, x1, y1];
      return true;
    },
    clear() {
      parts.length = 0;
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      dirty = null;
    },
    destroy() {
      window.removeEventListener("resize", resize);
      parts.length = 0;
    },
  };
}
