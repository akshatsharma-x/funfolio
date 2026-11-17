"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { getQualityTier } from "@/lib/quality";
import { fitCanvas } from "../engine";
import { DESCENT_SECONDS } from "../registry";
import type { GameProps } from "../types";
import {
  DIVERGE_SPEED,
  GLOBAL,
  gradient,
  HALF,
  height,
  heightColor,
  HOLD_MS,
  HOLD_RADIUS,
  ITER_MS,
  LOCALS,
  LR_DEFAULT,
  lrOf,
  MU,
  normHeight,
  START,
  TILT,
  WIN_RADIUS,
  type Bump,
  type Point,
} from "./landscape";
import type { DescentView } from "./Scene3D";

const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false });
const TOTAL = DESCENT_SECONDS * 1000;
const TRAIL = 14;
const DEAD = 0.12;
type QaHook = { gdMode?: "2d" | "3d" } & Record<string, unknown>;

const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
const dead = (v: number) => (Math.abs(v) < DEAD ? 0 : (v - Math.sign(v) * DEAD) / (1 - DEAD));

/**
 * GRADIENT DESCENT (ML · the churn model): roll a ball into the glowing global minimum of a 3D loss landscape before
 * the time runs out. Its motion is heavy-ball gradient descent on the analytic surface (landscape.ts) plus your tilt
 * (mouse position, a drag, or the arrow keys). The LEARNING RATE slider scales the gradient's pull: too high overshoots
 * and diverges. Local-minimum pits hold the ball for 2s. 3D (R3F) with WebGL; a 2D top-down heatmap without it.
 */
export default function GradientDescent({ api, reduced, paused }: GameProps) {
  const [mode] = useState<"3d" | "2d">(() => {
    const forced = (window as unknown as { __QA_ARCADE?: QaHook }).__QA_ARCADE?.gdMode;
    return forced ?? (getQualityTier() === "none" ? "2d" : "3d");
  });
  const [low] = useState(() => getQualityTier() === "low");
  const [slider, setSlider] = useState(LR_DEFAULT);
  const [toast, setToast] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatRef = useRef<HTMLCanvasElement | null>(null);
  const view = useRef<DescentView>({ p: { ...START }, prev: { ...START }, acc: 0, trail: [] });
  const st = useRef({
    v: { x: 0, y: 0 },
    t: 0,
    left: TOTAL,
    lr: lrOf(LR_DEFAULT),
    keys: { up: false, down: false, left: false, right: false },
    pointer: { x: 0, y: 0 },
    hold: 0,
    holdCool: 0,
    diverged: 0,
    iters: 0,
    startH: height(START.x, START.y),
    best: height(START.x, START.y),
    loss: height(START.x, START.y),
    stat: "",
    done: false,
    w: 600,
    h: 400,
  });
  const hG = height(GLOBAL.x, GLOBAL.y);

  const finish = (won: boolean) => {
    const s = st.current;
    if (s.done) return;
    s.done = true;
    const secs = Math.max(0, Math.ceil(s.left / 1000));
    const progress = (s.startH - s.best) / (s.startH - hG);
    api.end({
      score: won ? Math.max(0, 1000 + secs * 20 - s.diverged * 100) : Math.max(0, Math.round(progress * 600) - s.diverged * 50),
      won,
      headline: won ? "Global minimum!" : "Still descending…",
      notes: [
        `Loss ${s.startH.toFixed(2)} → ${(won ? hG : s.best).toFixed(2)} (the global minimum is ${hG.toFixed(2)})`,
        `${s.iters} iterations · learning rate ${s.lr.toFixed(3)}`,
        s.diverged ? `Diverged ×${s.diverged} — too high a learning rate overshoots.` : "Never diverged.",
      ],
      achievements: won ? ["global-minimum"] : [],
    });
  };
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  const tilt = (): Point => {
    const { keys, pointer } = st.current;
    const kx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const ky = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (kx || ky) {
      const n = Math.hypot(kx, ky);
      return { x: kx / n, y: ky / n };
    }
    return pointer;
  };

  // world (x, y ∈ [−5, 5]) → playfield pixels, for floaters (2D top-down; close enough over the 3D view)
  const toScreen = (p: Point) => {
    const s = st.current;
    const size = Math.min(s.w, s.h);
    return { x: (s.w - size) / 2 + ((p.x + HALF) / (2 * HALF)) * size, y: (s.h - size) / 2 + ((p.y + HALF) / (2 * HALF)) * size };
  };

  const iterate = () => {
    const s = st.current;
    const vw = view.current;
    vw.prev = { ...vw.p };
    if (s.hold > 0) return;
    const t = tilt();
    const [gx, gy] = gradient(vw.p.x, vw.p.y);
    s.v.x = MU * s.v.x - s.lr * gx + TILT * t.x;
    s.v.y = MU * s.v.y - s.lr * gy + TILT * t.y;
    vw.p = { x: vw.p.x + s.v.x, y: vw.p.y + s.v.y };
    s.iters += 1;
    vw.trail = [...vw.trail.slice(-(TRAIL - 1)), { ...vw.p }];
    const speed = Math.hypot(s.v.x, s.v.y);
    if (Math.abs(vw.p.x) > HALF + 0.6 || Math.abs(vw.p.y) > HALF + 0.6 || speed > DIVERGE_SPEED) {
      s.diverged += 1;
      s.v = { x: 0, y: 0 };
      vw.p = { ...START };
      vw.prev = { ...START };
      vw.trail = [];
      setToast((n) => n + 1);
      api.sfx("error");
      api.say("Diverged! The learning rate is too high. Back to the start.");
      return;
    }
    const h = height(vw.p.x, vw.p.y);
    s.loss = h;
    s.best = Math.min(s.best, h);
    if (Math.hypot(vw.p.x - GLOBAL.x, vw.p.y - GLOBAL.y) < WIN_RADIUS) {
      api.sfx("fanfare");
      finishRef.current(true);
      return;
    }
    if (s.holdCool <= 0 && speed < 0.05) {
      const pit = LOCALS.find((b: Bump) => Math.hypot(vw.p.x - b.x, vw.p.y - b.y) < HOLD_RADIUS);
      if (pit) {
        s.hold = HOLD_MS;
        s.holdCool = HOLD_MS + 1600;
        s.v = { x: 0, y: 0 };
        const at = toScreen(vw.p);
        api.float(at.x, at.y - 18, "Local minimum — stuck 2s", "bad");
        api.sfx("thud");
        api.say("Stuck in a local minimum for two seconds.");
      }
    }
  };







  // 3D: the playfield size, for floaters
  useEffect(() => {
    if (mode !== "3d") return;
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => {
      const r = stage.getBoundingClientRect();
      st.current.w = r.width;
      st.current.h = r.height;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [mode]);

  const draw2d = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const heat = heatRef.current;
    if (!canvas || !ctx || !heat) return;
    const s = st.current;
    const size = Math.min(s.w, s.h);
    const ox = (s.w - size) / 2;
    const oy = (s.h - size) / 2;
    ctx.clearRect(0, 0, s.w, s.h);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(heat, ox, oy, size, size);
    const to = (p: Point) => ({ x: ox + ((p.x + HALF) / (2 * HALF)) * size, y: oy + ((p.y + HALF) / (2 * HALF)) * size });
    for (const b of LOCALS) {
      const c = to(b);
      ctx.strokeStyle = "rgba(196, 181, 253, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, (HOLD_RADIUS / (2 * HALF)) * size, 0, Math.PI * 2);
      ctx.stroke();
    }
    const g = to(GLOBAL);
    ctx.strokeStyle = "#b6ff3b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(g.x, g.y, (WIN_RADIUS / (2 * HALF)) * size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#fff4e0";
    ctx.fillRect(g.x - 1, g.y - 22, 2, 22);
    ctx.fillStyle = "#b6ff3b";
    ctx.beginPath();
    ctx.moveTo(g.x + 1, g.y - 22);
    ctx.lineTo(g.x + 16, g.y - 17);
    ctx.lineTo(g.x + 1, g.y - 12);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 244, 224, 0.7)";
    for (const p of view.current.trail) {
      const c = to(p);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const vw = view.current;
    const a = Math.min(1, vw.acc / ITER_MS);
    const ball = to({ x: vw.prev.x + (vw.p.x - vw.prev.x) * a, y: vw.prev.y + (vw.p.y - vw.prev.y) * a });
    ctx.fillStyle = "#07060f";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff4e0";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2);
    ctx.fill();
  };

  useEffect(() => {
    const qa = (window as unknown as { __QA_ARCADE?: QaHook }).__QA_ARCADE;
    if (qa) qa["gradient-descent"] = { st: st.current, view: view.current, viewRef: view, mode }; // tests only (DECISIONS #89)
    api.setTime(TOTAL);
    api.setScore(0);
    const offTick = api.onTick((dt) => {
      const s = st.current;
      if (s.done) return;
      s.t += dt;
      s.left -= dt;
      api.setTime(s.left);
      s.hold = Math.max(0, s.hold - dt);
      s.holdCool = Math.max(0, s.holdCool - dt);
      view.current.acc += dt;
      while (view.current.acc >= ITER_MS && !s.done) {
        view.current.acc -= ITER_MS;
        iterate();
      }
      const stat = `Loss ${s.loss.toFixed(2)} · lr ${s.lr.toFixed(3)}`;
      if (stat !== s.stat) {
        s.stat = stat;
        api.setStat(stat);
      }
      if (!s.done && s.left <= 0) finishRef.current(false);
    });
    const offFrame = mode === "2d" ? api.onFrame(() => draw2d()) : () => {};
    return () => {
      offTick();
      offFrame();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one subscription per run
  }, [api]);

  // 2D: size the canvas and paint the heatmap (with contour lines) once per size
  useEffect(() => {
    if (mode !== "2d") return;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const fit = () => {
      const r = stage.getBoundingClientRect();
      st.current.w = r.width;
      st.current.h = r.height;
      fitCanvas(canvas);
      const n = 160;
      const heat = document.createElement("canvas");
      heat.width = heat.height = n;
      const hctx = heat.getContext("2d");
      if (hctx) {
        const img = hctx.createImageData(n, n);
        for (let j = 0; j < n; j++)
          for (let i = 0; i < n; i++) {
            const x = -HALF + ((i + 0.5) / n) * 2 * HALF;
            const y = -HALF + ((j + 0.5) / n) * 2 * HALF;
            const t = normHeight(height(x, y));
            const [r1, g1, b1] = heightColor(t);
            const contour = Math.abs((t * 14) % 1) < 0.06 ? 0.55 : 1;
            const k = (j * n + i) * 4;
            img.data[k] = r1 * contour;
            img.data[k + 1] = g1 * contour;
            img.data[k + 2] = b1 * contour;
            img.data[k + 3] = 255;
          }
        hctx.putImageData(img, 0, 0);
      }
      heatRef.current = heat;
      draw2d();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [mode]);

  const pointerTilt = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    st.current.pointer = { x: clamp1(dead(((e.clientX - r.left) / r.width) * 2 - 1)), y: clamp1(dead(((e.clientY - r.top) / r.height) * 2 - 1)) };
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>, down: boolean) => {
    if ((e.target as HTMLElement).tagName === "INPUT") return; // the slider uses its own arrows
    const map: Record<string, "up" | "down" | "left" | "right"> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    const k = map[e.key];
    if (!k) return;
    e.preventDefault();
    st.current.keys[k] = down;
  };

  // the "Diverged!" banner shows for a moment after each divergence
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(0), 1500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const lr = lrOf(slider);
  return (
    <div
      className="gd"
      role="application"
      aria-label="Gradient Descent — tilt the landscape with the arrow keys, the mouse or a drag; the learning-rate slider comes next"
      tabIndex={0}
      data-game-focus=""
      data-mode={mode}
      onKeyDown={(e) => onKey(e, true)}
      onKeyUp={(e) => onKey(e, false)}
    >
      <div
        ref={stageRef}
        className="gd-stage"
        onPointerMove={(e) => {
          if (e.pointerType === "mouse" || e.buttons) pointerTilt(e);
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pointerTilt(e);
        }}
        onPointerUp={(e) => {
          if (e.pointerType !== "mouse") st.current.pointer = { x: 0, y: 0 };
        }}
        onPointerLeave={() => {
          st.current.pointer = { x: 0, y: 0 };
        }}
      >
        {mode === "3d" ? <Scene3D view={view} paused={paused} low={low} reduced={reduced} /> : <canvas ref={canvasRef} className="gd-canvas" aria-hidden="true" />}
        {toast ? (
          <p className="gd-toast" aria-hidden="true">
            Diverged! <span>The learning rate is too high.</span>
          </p>
        ) : null}
      </div>
      <div className="gd-controls">
        <label className="gd-lr" style={{ "--lr": slider / 100 } as CSSProperties}>
          <span className="gd-lr__label">Learning rate</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={slider}
            aria-valuetext={`${lr.toFixed(3)}${slider >= 75 ? " — high: it may diverge" : slider <= 15 ? " — low: slow descent" : ""}`}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSlider(v);
              st.current.lr = lrOf(v);
            }}
          />
          <output className="gd-lr__value">{lr.toFixed(3)}</output>
        </label>
        <p className="gd-legend" aria-hidden="true">
          <span className="gd-legend__flag">▲ global minimum</span> <span className="gd-legend__pit">○ local minimum</span>
        </p>
      </div>
    </div>
  );
}
