"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";

const COLORS = ["#FF3D8B", "#22D3EE", "#B6FF3B", "#FFD23F", "#FF8A1F", "#A78BFA", "#2EE59D"];

/**
 * A busy, constantly redrawing canvas — a stand-in for a running game (illustrative, not data). Pauses off-screen and
 * in hidden tabs (R7); a single static frame under reduced motion. The crosshair cursor must stay visible on it.
 */
export function GameCanvasDemo() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const blobs = Array.from({ length: 26 }, (_, i) => ({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      s: 10 + Math.random() * 26,
      c: COLORS[i % COLORS.length],
    }));
    let raf = 0;
    let visible = false;
    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const g = ctx.createLinearGradient(0, 0, w, h);
      const t = now / 2400;
      g.addColorStop(0, `hsl(${(t * 60) % 360} 80% 12%)`);
      g.addColorStop(1, `hsl(${(t * 60 + 140) % 360} 80% 55%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (const b of blobs) {
        b.x = (b.x + b.vx * dt + w) % w;
        b.y = (b.y + b.vy * dt + h) % h;
        ctx.fillStyle = b.c;
        ctx.fillRect(Math.round(b.x), Math.round(b.y), b.s, b.s);
      }
    };
    const loop = (now: number) => {
      draw(now);
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const reduced = prefersReducedMotion();
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (reduced) {
        draw(performance.now());
        return;
      }
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    observer.observe(canvas);
    const onVisibility = () => {
      if (!document.hidden && visible && !raf && !reduced) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="Running game canvas stand-in (illustrative animation)"
      data-cursor="crosshair"
      data-cursor-label="PLAY"
      className="h-44 w-full rounded-xl border-[3px] border-ink"
    />
  );
}
