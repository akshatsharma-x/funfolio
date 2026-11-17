"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { fitCanvas, rng, roundRect, shuffle } from "../engine";
import { RAG_SECONDS } from "../registry";
import type { GameProps } from "../types";
import { HALLUCINATIONS, JUNK, QUERIES, splitKeyword } from "./queries";

const TOTAL = RAG_SECONDS * 1000;
const WINDOW = 10;
const LIVES = 3;
const BASKET_H = 22;
const BASKET_GAP = 14; // from the bottom
const KEY_SPEED = 0.62; // px per ms
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
type Kind = "relevant" | "junk" | "hallucination";
type Chunk = { id: number; kind: Kind; text: string; parts: [string, string, string] | null; x: number; y: number; w: number; vy: number; jx: number; jy: number };
type QaHook = Record<string, unknown>;

/**
 * RAG CATCHER (Cognivault AI · RAG with FAISS + HyDE): document chunks fall under a query banner. Relevant ones glow
 * cyan on the keyword they share with the query; junk is grey; hallucinations are jittery red glitches. Move the
 * RETRIEVER (mouse, ←/→, touch drag): good chunks fill the context window, junk pollutes it, a hallucination costs a
 * life. Ends when the window is full, the lives are gone or the time is up; the results grade precision and recall.
 */
export default function RagCatcher({ api, reduced, seed }: GameProps) {
  const set = useMemo(() => QUERIES[Math.floor(rng(seed)() * QUERIES.length)], [seed]);
  const rand = useMemo(() => rng(seed ^ 0x5bd1e995), [seed]);
  const [slots, setSlots] = useState<readonly ("relevant" | "junk")[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    t: 0,
    left: TOTAL,
    spawnIn: 500,
    chunks: [] as Chunk[],
    n: 0,
    w: 600,
    h: 400,
    bx: 300,
    target: null as number | null,
    keys: { left: false, right: false },
    caught: { relevant: 0, junk: 0, hallucination: 0 },
    seen: 0,
    lives: LIVES,
    score: 0,
    combo: 0,
    flash: 0,
    done: false,
    slots: [] as ("relevant" | "junk")[],
    queues: { relevant: [] as string[], junk: [] as string[], hallucination: [] as string[] },
    font: "sans-serif",
    stat: "",
  });

  const finish = (why: "full" | "lives" | "time") => {
    const s = st.current;
    if (s.done) return;
    s.done = true;
    const { relevant, junk, hallucination } = s.caught;
    const all = relevant + junk + hallucination;
    const p = all ? relevant / all : 0;
    const r = s.seen ? relevant / s.seen : 0;
    const f1 = p + r ? (2 * p * r) / (p + r) : 0;
    const rank = f1 >= 0.8 ? "Nearest-Neighbor Legend" : f1 >= 0.55 ? "Senior" : "Junior";
    api.end({
      score: Math.max(0, s.score + (why === "full" ? 200 : 0) + Math.round(f1 * 300)),
      won: f1 >= 0.55,
      headline: `Retriever rank: ${rank}`,
      notes: [
        `Precision ${Math.round(p * 100)}% — relevant ÷ everything caught (${relevant} of ${all})`,
        `Recall ${Math.round(r * 100)}% — relevant caught ÷ relevant that fell (${relevant} of ${s.seen})`,
        why === "full" ? "Context window full." : why === "lives" ? "Three hallucinations — that answer can't be trusted." : "Time's up.",
        junk ? `${junk} junk chunk${junk === 1 ? "" : "s"} polluted the context.` : "No junk in the context.",
      ],
    });
  };
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  const next = (kind: Kind): string => {
    const q = st.current.queues;
    const list = q[kind];
    if (list.length === 0) list.push(...shuffle(kind === "relevant" ? set.relevant : kind === "junk" ? JUNK : HALLUCINATIONS, rand));
    return list.shift() ?? "";
  };

  // size the canvas to its box (DPR-aware); keep the basket inside
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    st.current.font = rootRef.current ? getComputedStyle(rootRef.current).fontFamily : "sans-serif";
    const fit = () => {
      const r = stage.getBoundingClientRect();
      st.current.w = Math.max(240, r.width);
      st.current.h = Math.max(240, r.height);
      st.current.bx = Math.min(Math.max(st.current.bx, 60), st.current.w - 60);
      fitCanvas(canvas);
    };
    st.current.bx = stage.getBoundingClientRect().width / 2;
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);



  const catchChunk = (c: Chunk) => {
    const s = st.current;
    const at = { x: s.bx, y: s.h - BASKET_GAP - BASKET_H - 6 };
    if (c.kind === "relevant") {
      s.caught.relevant += 1;
      s.seen += 1;
      s.combo += 1;
      const pts = 100 + Math.min(5, s.combo - 1) * 20;
      s.score += pts;
      s.slots = [...s.slots, "relevant"];
      api.float(at.x, at.y, `+${pts}`, s.combo >= 3 ? "gold" : "good");
      api.sfx("blip", { pitch: 1 + Math.min(0.6, s.combo * 0.08) });
    } else if (c.kind === "junk") {
      s.caught.junk += 1;
      s.combo = 0;
      s.score = Math.max(0, s.score - 30);
      s.slots = [...s.slots, "junk"];
      api.float(at.x, at.y, "junk −30", "bad");
      api.sfx("squish", { pitch: 0.6 });
    } else {
      s.caught.hallucination += 1;
      s.combo = 0;
      s.lives -= 1;
      s.flash = 400;
      api.setLives(s.lives);
      api.float(at.x, at.y, "HALLUCINATION!", "bad");
      api.sfx("error");
      api.say(`Hallucination caught. ${s.lives} ${s.lives === 1 ? "life" : "lives"} left.`);
    }
    api.setScore(s.score);
    setSlots(s.slots);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const s = st.current;
    ctx.clearRect(0, 0, s.w, s.h);
    ctx.font = `600 13px ${s.font}`;
    ctx.textBaseline = "middle";
    for (const c of s.chunks) {
      const x = c.x - c.w / 2 + c.jx;
      const y = c.y + c.jy;
      if (c.kind === "relevant") {
        ctx.fillStyle = "rgba(34, 211, 238, 0.18)";
        roundRect(ctx, x - 4, y - 4, c.w + 8, 38, 12);
        ctx.fill();
        ctx.fillStyle = "#0c2632";
        ctx.strokeStyle = "#22d3ee";
      } else if (c.kind === "junk") {
        ctx.fillStyle = "#262138";
        ctx.strokeStyle = "#5b5375";
      } else {
        ctx.fillStyle = "#3a0d16";
        ctx.strokeStyle = "#ff4d4d";
      }
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, c.w, 30, 9);
      ctx.fill();
      ctx.stroke();
      const tx = x + 13;
      const ty = y + 15;
      if (c.kind === "relevant" && c.parts) {
        const [a, k, b] = c.parts;
        ctx.fillStyle = "#e9fdf9";
        ctx.fillText(a, tx, ty);
        const ax = tx + ctx.measureText(a).width;
        ctx.font = `800 13px ${s.font}`;
        ctx.fillStyle = "#6be6ff";
        ctx.fillText(k, ax, ty);
        const kx = ax + ctx.measureText(k).width;
        ctx.font = `600 13px ${s.font}`;
        ctx.fillStyle = "#e9fdf9";
        ctx.fillText(b, kx, ty);
      } else if (c.kind === "hallucination") {
        if (!reduced) {
          ctx.fillStyle = "rgba(34, 211, 238, 0.55)";
          ctx.fillText(c.text, tx - 1.5, ty);
          ctx.fillStyle = "rgba(255, 61, 139, 0.55)";
          ctx.fillText(c.text, tx + 1.5, ty);
        }
        ctx.fillStyle = "#ffd0d0";
        ctx.fillText(c.text, tx, ty);
      } else {
        ctx.fillStyle = "#b9b2d9";
        ctx.fillText(c.text, tx, ty);
      }
    }
    // the retriever
    const bw = Math.min(140, Math.max(92, s.w * 0.16));
    const bx = s.bx - bw / 2;
    const by = s.h - BASKET_GAP - BASKET_H;
    ctx.fillStyle = s.flash > 0 ? "#ff6b6b" : "#ffc83d";
    ctx.strokeStyle = "#07060f";
    ctx.lineWidth = 3;
    roundRect(ctx, bx, by, bw, BASKET_H, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#07060f";
    ctx.font = `800 11px ${s.font}`;
    ctx.textAlign = "center";
    ctx.fillText("RETRIEVER", s.bx, by + BASKET_H / 2 + 1);
    ctx.textAlign = "start";
  };

  useEffect(() => {
    const qa = (window as unknown as { __QA_ARCADE?: QaHook }).__QA_ARCADE;
    if (qa) qa["rag-catcher"] = st.current; // tests only: opt-in (like the Launchpad's hook, DECISIONS #89)
    api.setTime(TOTAL);
    api.setLives(LIVES);
    api.setScore(0);
    api.setStat("Precision — · Recall —");
    const offTick = api.onTick((dt) => {
      const s = st.current;
      if (s.done) return;
      s.t += dt;
      s.left -= dt;
      api.setTime(s.left);
      const p = Math.min(1, s.t / TOTAL);
      const bw = Math.min(140, Math.max(92, s.w * 0.16));
      // the retriever: keys move it; otherwise it eases toward the pointer
      if (s.keys.left !== s.keys.right) s.bx += (s.keys.left ? -1 : 1) * KEY_SPEED * dt;
      else if (s.target !== null) s.bx += (s.target - s.bx) * Math.min(1, dt / 70);
      s.bx = Math.min(Math.max(s.bx, bw / 2), s.w - bw / 2);
      s.flash = Math.max(0, s.flash - dt);
      // spawn
      s.spawnIn -= dt;
      if (s.spawnIn <= 0) {
        s.spawnIn = lerp(950, 540, p) * (0.8 + rand() * 0.4) * (reduced ? 1.2 : 1);
        const roll = rand();
        const kind: Kind = s.t < 2500 ? (roll < 0.6 ? "relevant" : "junk") : roll < 0.45 ? "relevant" : roll < 0.8 ? "junk" : "hallucination";
        const text = next(kind);
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) ctx.font = `600 13px ${s.font}`;
        const w = Math.min(s.w - 16, (ctx?.measureText(text).width ?? text.length * 7) + 26);
        s.n += 1;
        s.chunks.push({ id: s.n, kind, text, parts: kind === "relevant" ? splitKeyword(text, set.keywords) : null, x: w / 2 + 8 + rand() * (s.w - w - 16), y: -30, w, vy: lerp(0.095, 0.215, p) * (0.9 + rand() * 0.2) * (reduced ? 0.8 : 1), jx: 0, jy: 0 });
      }
      // fall, catch, miss
      const top = s.h - BASKET_GAP - BASKET_H;
      const kept: Chunk[] = [];
      for (const c of s.chunks) {
        c.y += c.vy * dt;
        if (c.kind === "hallucination" && !reduced) {
          c.jx = (rand() - 0.5) * 6;
          c.jy = (rand() - 0.5) * 3;
        }
        const bottom = c.y + 15;
        if (bottom >= top && c.y < top + BASKET_H && c.x + c.w / 2 > s.bx - bw / 2 && c.x - c.w / 2 < s.bx + bw / 2) {
          catchChunk(c);
          continue;
        }
        if (c.y > s.h + 20) {
          if (c.kind === "relevant") s.seen += 1;
          continue;
        }
        kept.push(c);
      }
      s.chunks = kept;
      const { relevant, junk, hallucination } = s.caught;
      const all = relevant + junk + hallucination;
      const stat = `Precision ${all ? Math.round((relevant / all) * 100) : 0}% · Recall ${s.seen ? Math.round((relevant / s.seen) * 100) : 0}%`;
      if (stat !== s.stat) {
        s.stat = stat;
        api.setStat(stat);
      }
      if (s.slots.length >= WINDOW) finishRef.current("full");
      else if (s.lives <= 0) finishRef.current("lives");
      else if (s.left <= 0) finishRef.current("time");
    });
    const offFrame = api.onFrame(() => draw());
    return () => {
      offTick();
      offFrame();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one subscription per run (api, rand and set are per run)
  }, [api]);

  const stagePoint = (e: PointerEvent<HTMLElement>) => {
    const r = stageRef.current?.getBoundingClientRect();
    return r ? e.clientX - r.left : null;
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>, down: boolean) => {
    const k = e.key;
    const s = st.current;
    if (k === "ArrowLeft" || k === "a" || k === "A") s.keys.left = down;
    else if (k === "ArrowRight" || k === "d" || k === "D") s.keys.right = down;
    else return;
    e.preventDefault();
    if (down) s.target = null; // the keyboard takes over from the pointer
  };

  const rel = slots.filter((k) => k === "relevant").length;
  return (
    <div
      ref={rootRef}
      className="rc"
      role="application"
      aria-label="RAG Catcher — move the retriever with the left and right arrow keys, the mouse, or by dragging"
      tabIndex={0}
      data-game-focus=""
      onKeyDown={(e) => onKey(e, true)}
      onKeyUp={(e) => onKey(e, false)}
    >
      <div className="rc-top">
        <p className="rc-query">
          <span className="rc-query__kicker">Query</span> <b>{set.query}</b>
        </p>
        <div className="rc-window" role="img" aria-label={`Context window: ${slots.length} of ${WINDOW} — ${rel} relevant, ${slots.length - rel} junk`}>
          <span className="rc-window__label" aria-hidden="true">
            Context window
          </span>
          <span className="rc-window__slots" aria-hidden="true">
            {Array.from({ length: WINDOW }, (_, i) => (
              <i key={i} data-kind={slots[i]} />
            ))}
          </span>
        </div>
      </div>
      <div
        ref={stageRef}
        className="rc-stage"
        onPointerMove={(e) => {
          if (e.pointerType === "mouse" || e.buttons) st.current.target = stagePoint(e);
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          st.current.target = stagePoint(e);
        }}
      >
        <canvas ref={canvasRef} className="rc-canvas" aria-hidden="true" />
      </div>
    </div>
  );
}
