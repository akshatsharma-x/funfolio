"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { gridStep, rng } from "../engine";
import { TOKEN_SQUEEZE_SECONDS } from "../registry";
import type { GameProps } from "../types";
import { parsePrompt, PROMPTS } from "./prompts";

const POINTS_PER_TOKEN = 10;
const MEANING_COST = 5;
const TIME_BONUS = 3; // per second left, when every filler tile is gone
const METER_MAX = 45; // the meter's full width, in %

/**
 * TOKEN SQUEEZE (United Airlines · token compression): squeeze the filler out of a bloated prompt before the timer
 * runs out. Tiles are real buttons (click, tap, or arrows + Enter); the meter shows compression = tokens removed ÷
 * tokens in the prompt, with the real result's band marked. Squeezing a word that matters costs MEANING −5 (it stays).
 */
export default function TokenSqueeze({ api, reduced, game, seed }: GameProps) {
  const tiles = useMemo(() => parsePrompt(PROMPTS[Math.floor(rng(seed)() * PROMPTS.length)]), [seed]);
  const total = useMemo(() => tiles.reduce((n, t) => n + t.tokens, 0), [tiles]);
  const fillerCount = useMemo(() => tiles.filter((t) => t.filler).length, [tiles]);
  const band = game.band ?? [game.target ?? 22, game.target ?? 22];
  const target = game.target ?? band[0];
  const [gone, setGone] = useState<ReadonlySet<number>>(new Set());
  const [hidden, setHidden] = useState<ReadonlySet<number>>(new Set());
  const [shake, setShake] = useState<number | null>(null);
  const [cur, setCur] = useState(0);
  const state = useRef({ left: TOKEN_SQUEEZE_SECONDS * 1000, removed: 0, errors: 0, score: 0, done: false });
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const pct = (removed: number) => Math.round((removed / total) * 100);

  const finish = (allGone: boolean) => {
    const s = state.current;
    if (s.done) return;
    s.done = true;
    const bonus = allGone ? Math.ceil(s.left / 1000) * TIME_BONUS : 0;
    const score = Math.max(0, s.score + bonus);
    const p = pct(s.removed);
    const won = p >= target;
    api.end({
      score,
      won,
      headline: allGone ? `Squeezed it all: ${p}%` : `Squeezed ${p}%`,
      notes: [
        `Tokens ${total} → ${total - s.removed} · target ${target}%${won ? " ✓" : ""}`,
        p >= band[0] && p <= band[1] ? `Right inside the real band (${band[0]}–${band[1]}%).` : won ? `Past the real band (${band[0]}–${band[1]}%) — on a toy prompt.` : `The real band is ${band[0]}–${band[1]}%.`,
        s.errors ? `${s.errors} meaning slip${s.errors === 1 ? "" : "s"} (−${s.errors * MEANING_COST})` : "Meaning intact.",
        ...(bonus ? [`Time bonus +${bonus}`] : []),
      ],
      achievements: won ? ["compressor"] : [],
    });
  };
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  // the clock
  useEffect(() => {
    api.setTime(state.current.left);
    api.setStat(`Compression 0% · target ${target}%`);
    api.setScore(0);
    return api.onTick((dt) => {
      const s = state.current;
      if (s.done) return;
      s.left -= dt;
      api.setTime(s.left);
      if (s.left <= 0) finishRef.current(false);
    });
  }, [api, target]);

  const centerOf = (i: number) => {
    const b = buttons.current[i];
    const f = api.field();
    if (!b || !f) return { x: 0, y: 0 };
    const r = b.getBoundingClientRect();
    const q = f.getBoundingClientRect();
    return { x: r.left - q.left + r.width / 2, y: r.top - q.top };
  };

  const nextAlive = (from: number, removed: ReadonlySet<number>) => {
    for (let d = 1; d < tiles.length; d++) {
      if (from + d < tiles.length && !removed.has(from + d)) return from + d;
      if (from - d >= 0 && !removed.has(from - d)) return from - d;
    }
    return from;
  };

  const squeeze = (i: number) => {
    const s = state.current;
    if (s.done || gone.has(i)) return;
    const t = tiles[i];
    const at = centerOf(i);
    if (!t.filler) {
      s.errors += 1;
      s.score = Math.max(0, s.score - MEANING_COST);
      api.setScore(s.score);
      api.float(at.x, at.y, `MEANING −${MEANING_COST}`, "bad");
      api.sfx("error");
      api.say(`"${t.text}" matters. Meaning minus ${MEANING_COST}.`);
      setShake(i);
      return;
    }
    const next = new Set(gone).add(i);
    setGone(next);
    if (reduced) setHidden(new Set(hidden).add(i));
    s.removed += t.tokens;
    s.score += t.tokens * POINTS_PER_TOKEN;
    api.setScore(s.score);
    const p = pct(s.removed);
    api.setStat(`Compression ${p}% · target ${target}%`);
    api.float(at.x, at.y, `−${t.tokens} token${t.tokens === 1 ? "" : "s"}`, p >= target ? "gold" : "good");
    api.sfx("squish", { pitch: 0.9 + Math.min(0.5, p / 60) });
    if (p >= target && p - Math.round((t.tokens / total) * 100) < target) api.say(`${p}% — target reached!`);
    // focus moves on before the tile collapses (a hidden button can't hold it)
    const n = nextAlive(i, next);
    setCur(n);
    requestAnimationFrame(() => buttons.current[n]?.focus({ preventScroll: true }));
    if ([...next].filter((k) => tiles[k].filler).length === fillerCount) finishRef.current(true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const alive = tiles.map((_, i) => i).filter((i) => !gone.has(i));
    const list = alive.map((i) => buttons.current[i]).filter((b): b is HTMLButtonElement => !!b);
    const from = alive.indexOf(cur);
    if (from < 0) return;
    const step = gridStep(list, from, e.key);
    if (step === null) return;
    e.preventDefault();
    const i = alive[step];
    setCur(i);
    buttons.current[i]?.focus({ preventScroll: true });
  };

  const removed = [...gone].reduce((n, i) => n + tiles[i].tokens, 0);
  const p = pct(removed);
  return (
    <div className="ts">
      <div className="ts-meter" aria-hidden="true" style={{ "--p": Math.min(1, p / METER_MAX), "--a": band[0] / METER_MAX, "--b": band[1] / METER_MAX } as CSSProperties}>
        <span className="ts-meter__band" />
        <span className="ts-meter__fill" />
        <span className="ts-meter__label">
          Compression <b>{p}%</b>
        </span>
      </div>
      <p className="ts-tokens" aria-live="off">
        Tokens <b>{total}</b> → <b>{total - removed}</b>
      </p>
      <div className="ts-prompt" role="group" aria-label="The prompt — squeeze out the filler" onKeyDown={onKeyDown}>
        {tiles.map((t, i) => (
          <button
            key={i}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            className="ts-tile"
            data-gone={gone.has(i) ? "" : undefined}
            data-shake={shake === i ? "" : undefined}
            hidden={hidden.has(i)}
            tabIndex={i === cur ? 0 : -1}
            data-game-focus={i === cur ? "" : undefined}
            onClick={() => squeeze(i)}
            onAnimationEnd={(e) => {
              if (e.animationName === "ts-crunch") setHidden((h) => new Set(h).add(i));
              if (e.animationName === "ts-shake") setShake(null);
            }}
          >
            {t.text}
          </button>
        ))}
      </div>
    </div>
  );
}
