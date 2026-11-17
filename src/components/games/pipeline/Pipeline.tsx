"use client";

import { useEffect, useMemo, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { fitCanvas, rng, roundRect } from "../engine";
import { PIPELINE_SECONDS } from "../registry";
import type { GameProps } from "../types";

const TOTAL = PIPELINE_SECONDS * 1000;
const PACKETS = {
  JSON: { records: 400, color: "#22d3ee" },
  CSV: { records: 600, color: "#b6ff3b" },
  PDF: { records: 300, color: "#ff6aa6" },
  SQL: { records: 700, color: "#ffd23f" },
} as const;
type PacketType = keyof typeof PACKETS;
const TYPES: readonly PacketType[] = ["JSON", "JSON", "CSV", "PDF", "PDF", "SQL"];
const MAX_NULLS = 10;
const GROW = 2;
type Cell = { x: number; y: number };
type Packet = Cell & { type: PacketType };
const DIRS: Readonly<Record<string, Cell>> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const KEYS: Readonly<Record<string, keyof typeof DIRS>> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right" };
const ARROW = { up: "↑", left: "←", right: "→", down: "↓" } as const;
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * PIPELINE (WalkingTree · data aggregation pipelines): a grid snake in our style. The pipeline's head eats data packets
 * (JSON, CSV, PDF, SQL) and grows; NULL tiles and its own pipe burst it; edges wrap around; the speed ramps up.
 * Score = records processed. Arrows / WASD, a swipe, or the on-screen arrow pad.
 */
export default function Pipeline({ api, reduced, game, seed }: GameProps) {
  const rand = useMemo(() => rng(seed), [seed]);
  const target = game.target ?? 10000;
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const st = useRef({
    cols: 22,
    rows: 14,
    cell: 24,
    ox: 0,
    oy: 0,
    w: 600,
    h: 400,
    pipe: [] as Cell[],
    dir: DIRS.right,
    queue: [] as Cell[],
    acc: 0,
    t: 0,
    left: TOTAL,
    packets: [] as Packet[],
    nulls: [] as Cell[],
    nullIn: 5000,
    grow: 0,
    records: 0,
    eaten: 0,
    milestone: 2500,
    flow: 0,
    done: false,
    font: "sans-serif",
    sized: false,
  });

  const occupied = (c: Cell) => {
    const s = st.current;
    return s.pipe.some((p) => p.x === c.x && p.y === c.y) || s.nulls.some((p) => p.x === c.x && p.y === c.y) || s.packets.some((p) => p.x === c.x && p.y === c.y);
  };
  const freeCell = (minFromHead: number): Cell | null => {
    const s = st.current;
    const head = s.pipe[0];
    for (let tries = 0; tries < 200; tries++) {
      const c = { x: Math.floor(rand() * s.cols), y: Math.floor(rand() * s.rows) };
      if (occupied(c)) continue;
      if (head && Math.abs(c.x - head.x) + Math.abs(c.y - head.y) < minFromHead) continue;
      return c;
    }
    return null;
  };
  const addPacket = () => {
    const c = freeCell(3);
    if (c) st.current.packets.push({ ...c, type: TYPES[Math.floor(rand() * TYPES.length)] });
  };

  const finish = (why: "burst" | "time") => {
    const s = st.current;
    if (s.done) return;
    s.done = true;
    api.end({
      score: s.records,
      won: s.records >= target,
      headline: why === "burst" ? `Pipe burst at ${fmt(s.records)} records` : `Shipped: ${fmt(s.records)} records`,
      notes: [`Target ${fmt(target)}+ records${s.records >= target ? " ✓" : ""}`, `${s.eaten} packet${s.eaten === 1 ? "" : "s"} processed · pipe length ${s.pipe.length}`, why === "burst" ? "Hit a NULL tile or its own pipe." : "Time's up — the pipeline shipped."],
    });
  };
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });





  const step = () => {
    const s = st.current;
    const nextDir = s.queue.shift();
    if (nextDir) s.dir = nextDir;
    const head = s.pipe[0];
    const nh = { x: (head.x + s.dir.x + s.cols) % s.cols, y: (head.y + s.dir.y + s.rows) % s.rows };
    const body = s.grow > 0 ? s.pipe : s.pipe.slice(0, -1); // the tail moves away this step unless the pipe grows
    if (s.nulls.some((c) => c.x === nh.x && c.y === nh.y) || body.some((c) => c.x === nh.x && c.y === nh.y)) {
      api.sfx("thud");
      api.say(`Pipe burst at ${fmt(s.records)} records.`);
      finishRef.current("burst");
      return;
    }
    s.pipe.unshift(nh);
    const i = s.packets.findIndex((p) => p.x === nh.x && p.y === nh.y);
    if (i >= 0) {
      const p = s.packets[i];
      s.packets.splice(i, 1);
      const value = PACKETS[p.type].records;
      s.records += value;
      s.eaten += 1;
      s.grow += GROW;
      api.setScore(s.records);
      api.setStat(`Records ${fmt(s.records)} · target ${fmt(target)}`);
      api.float(s.ox + (nh.x + 0.5) * s.cell, s.oy + nh.y * s.cell, `+${fmt(value)} ${p.type}`, s.records >= target ? "gold" : "good");
      api.sfx("coin", { pitch: 1.1 });
      if (s.records >= s.milestone) {
        api.say(`${fmt(s.records)} records processed.`);
        s.milestone += 2500;
      }
      addPacket();
    }
    if (s.grow > 0) s.grow -= 1;
    else s.pipe.pop();
    while (s.packets.length < 2) addPacket();
  };

  const turn = (name: keyof typeof DIRS) => {
    const s = st.current;
    const d = DIRS[name];
    const last = s.queue.at(-1) ?? s.dir;
    if ((d.x === -last.x && d.y === -last.y) || (d.x === last.x && d.y === last.y) || s.queue.length >= 3) return;
    s.queue.push(d);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const s = st.current;
    const { cell, ox, oy, cols, rows } = s;
    ctx.clearRect(0, 0, s.w, s.h);
    // the board
    ctx.fillStyle = "#0d0a1c";
    ctx.fillRect(ox, oy, cols * cell, rows * cell);
    ctx.strokeStyle = "rgba(185, 178, 217, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < cols; x++) {
      ctx.moveTo(ox + x * cell + 0.5, oy);
      ctx.lineTo(ox + x * cell + 0.5, oy + rows * cell);
    }
    for (let y = 1; y < rows; y++) {
      ctx.moveTo(ox, oy + y * cell + 0.5);
      ctx.lineTo(ox + cols * cell, oy + y * cell + 0.5);
    }
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // a tile's label at the largest size that fits inside it
    const label = (text: string, cx: number, cy: number) => {
      let size = Math.round(cell * 0.34);
      ctx.font = `800 ${size}px ${s.font}`;
      const w = ctx.measureText(text).width;
      if (w > cell - 8) {
        size = Math.max(6, Math.floor((size * (cell - 8)) / w));
        ctx.font = `800 ${size}px ${s.font}`;
      }
      ctx.fillText(text, cx, cy);
    };
    // NULL tiles
    for (const c of s.nulls) {
      ctx.fillStyle = "#3a0d16";
      ctx.strokeStyle = "#ff4d4d";
      ctx.lineWidth = 2;
      roundRect(ctx, ox + c.x * cell + 2, oy + c.y * cell + 2, cell - 4, cell - 4, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffb4b4";
      label("NULL", ox + (c.x + 0.5) * cell, oy + (c.y + 0.5) * cell + 0.5);
    }
    // packets
    for (const p of s.packets) {
      ctx.fillStyle = PACKETS[p.type].color;
      ctx.strokeStyle = "#07060f";
      ctx.lineWidth = 2;
      roundRect(ctx, ox + p.x * cell + 2, oy + p.y * cell + 2, cell - 4, cell - 4, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#07060f";
      label(p.type, ox + (p.x + 0.5) * cell, oy + (p.y + 0.5) * cell + 0.5);
    }
    // the pipe: one path through the segment centres, broken where it wraps around an edge
    const path = new Path2D();
    s.pipe.forEach((c, i) => {
      const px = ox + (c.x + 0.5) * cell;
      const py = oy + (c.y + 0.5) * cell;
      const prev = s.pipe[i - 1];
      if (i === 0 || !prev || Math.abs(prev.x - c.x) + Math.abs(prev.y - c.y) !== 1) path.moveTo(px, py);
      else path.lineTo(px, py);
    });
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(182, 255, 59, 0.22)";
    ctx.lineWidth = cell * 0.95;
    ctx.stroke(path);
    ctx.strokeStyle = "#4d7c0f";
    ctx.lineWidth = cell * 0.66;
    ctx.stroke(path);
    ctx.strokeStyle = "#b6ff3b";
    ctx.lineWidth = cell * 0.36;
    ctx.stroke(path);
    // data flowing through it
    ctx.setLineDash([cell * 0.22, cell * 0.78]);
    ctx.lineDashOffset = reduced ? 0 : (s.flow / 1000) * cell * 4;
    ctx.strokeStyle = "#fff4e0";
    ctx.lineWidth = cell * 0.16;
    ctx.stroke(path);
    ctx.setLineDash([]);
    // the head
    const head = s.pipe[0];
    if (head) {
      const hx = ox + (head.x + 0.5) * cell;
      const hy = oy + (head.y + 0.5) * cell;
      ctx.fillStyle = "#07060f";
      ctx.beginPath();
      ctx.arc(hx, hy, cell * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e9ffd0";
      ctx.beginPath();
      ctx.arc(hx, hy, cell * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#07060f";
      ctx.beginPath();
      ctx.arc(hx + s.dir.x * cell * 0.13, hy + s.dir.y * cell * 0.13, cell * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.textAlign = "start";
  };

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const s = st.current;
    s.font = getComputedStyle(stage).fontFamily;
    const fit = () => {
      const r = stage.getBoundingClientRect();
      if (!s.sized) {
        // the grid is fixed for the run: landscape boards on wide screens, portrait on phones
        s.sized = true;
        [s.cols, s.rows] = r.width < 560 ? [14, 18] : [22, 14];
        const head = { x: Math.floor(s.cols / 2), y: Math.floor(s.rows / 2) };
        s.pipe = [0, 1, 2, 3].map((i) => ({ x: head.x - i, y: head.y }));
        addPacket();
        addPacket();
      }
      s.w = r.width;
      s.h = r.height;
      s.cell = Math.max(12, Math.floor(Math.min(r.width / s.cols, r.height / s.rows)));
      s.ox = Math.floor((r.width - s.cell * s.cols) / 2);
      s.oy = Math.floor((r.height - s.cell * s.rows) / 2);
      fitCanvas(canvas);
      draw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per run
  }, []);

  useEffect(() => {
    const qa = (window as unknown as { __QA_ARCADE?: Record<string, unknown> }).__QA_ARCADE;
    if (qa) qa.pipeline = st.current; // tests only: opt-in (DECISIONS #89)
    api.setTime(TOTAL);
    api.setScore(0);
    api.setStat(`Records 0 · target ${fmt(target)}`);
    const offTick = api.onTick((dt) => {
      const s = st.current;
      if (s.done || !s.sized) return;
      s.t += dt;
      s.left -= dt;
      s.flow += dt;
      api.setTime(s.left);
      const interval = lerp(140, 70, Math.min(1, s.t / TOTAL)) * (reduced ? 1.15 : 1);
      s.acc += dt;
      while (s.acc >= interval && !s.done) {
        s.acc -= interval;
        step();
      }
      s.nullIn -= dt;
      if (s.nullIn <= 0) {
        s.nullIn = 5000;
        if (s.nulls.length < MAX_NULLS) {
          const c = freeCell(5);
          if (c) s.nulls.push(c);
        }
      }
      if (!s.done && s.left <= 0) finishRef.current("time");
    });
    const offFrame = api.onFrame(() => draw());
    return () => {
      offTick();
      offFrame();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one subscription per run
  }, [api]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const name = KEYS[e.key];
    if (!name || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    turn(name);
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const from = swipe.current;
    if (!from) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
    swipe.current = { x: e.clientX, y: e.clientY };
  };

  return (
    <div className="pl" role="application" aria-label="Pipeline — steer with the arrow keys or W A S D, swipe, or use the arrow pad" tabIndex={0} data-game-focus="" onKeyDown={onKeyDown}>
      <div ref={stageRef} className="pl-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => (swipe.current = null)} onPointerCancel={() => (swipe.current = null)}>
        <canvas ref={canvasRef} className="pl-canvas" aria-hidden="true" />
      </div>
      <div className="pl-pad" role="group" aria-label="Arrow pad">
        {(["up", "left", "right", "down"] as const).map((d) => (
          <button key={d} type="button" className="pl-pad__btn" data-dir={d} tabIndex={-1} onClick={() => turn(d)} onPointerDown={(e) => e.stopPropagation()}>
            <span aria-hidden="true">{ARROW[d]}</span>
            <span className="sr-only">{d}</span>
          </button>
        ))}
      </div>
      <p className="pl-legend" aria-hidden="true">
        {(Object.keys(PACKETS) as PacketType[]).map((t) => (
          <span key={t} style={{ color: PACKETS[t].color }}>
            {t} {fmt(PACKETS[t].records)}
          </span>
        ))}
        <span className="pl-legend__null">NULL = burst</span>
      </p>
    </div>
  );
}
