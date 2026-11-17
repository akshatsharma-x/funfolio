"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { gridStep, rng, shuffle } from "../engine";
import { CACHE_HIT_SECONDS } from "../registry";
import type { GameProps } from "../types";

const PAIRS = 8;
const MISS_MS = 750; // a miss stays face up this long (game time — pausing freezes it)
const HIT_POINTS = 100;
const TIME_POINTS = 10;
const PERFECT_BONUS = 500;

type Card = { key: number; name: string; path: string; hash: string; tone: string | null };

/**
 * CACHE HIT! (United Airlines · SHA256 caching): a 4×4 memory match. Every card is a cache entry — a stack item's logo
 * and the first 8 hex digits of the real SHA-256 of its name. Two equal hashes = a cache hit. HUD: hit rate
 * (hits ÷ lookups) and the clock. All 8 pairs in time wins; no misses at all = CACHE HIT 100%.
 */
export default function CacheHit({ api, reduced, data, seed }: GameProps) {
  const deck = useMemo<Card[]>(() => {
    const pairs = data.cacheCards.slice(0, PAIRS);
    return shuffle([...pairs, ...pairs], rng(seed)).map((c, key) => ({ key, ...c }));
  }, [data.cacheCards, seed]);
  const [up, setUp] = useState<readonly number[]>([]);
  const [matched, setMatched] = useState<ReadonlySet<number>>(new Set());
  const [cur, setCur] = useState(0);
  const [hitFx, setHitFx] = useState<readonly number[]>([]);
  const state = useRef({ left: CACHE_HIT_SECONDS * 1000, hits: 0, lookups: 0, missLeft: 0, pending: [] as number[], done: false });
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const rate = (hits: number, lookups: number) => (lookups ? Math.round((hits / lookups) * 100) : 100);

  const finish = (all: boolean) => {
    const s = state.current;
    if (s.done) return;
    s.done = true;
    const perfect = all && s.lookups === PAIRS;
    const secs = Math.max(0, Math.ceil(s.left / 1000));
    const score = s.hits * HIT_POINTS + (all ? secs * TIME_POINTS : 0) + (perfect ? PERFECT_BONUS : 0);
    api.end({
      score,
      won: all,
      headline: perfect ? "CACHE HIT 100%" : all ? `All ${PAIRS} pairs cached` : `${s.hits} of ${PAIRS} pairs cached`,
      notes: [
        `Hit rate ${rate(s.hits, s.lookups)}% (${s.hits} hits ÷ ${s.lookups} lookups)`,
        ...(all ? [`Time bonus +${secs * TIME_POINTS}`] : ["Time's up — the cache went cold."]),
        ...(perfect ? [`Perfect run +${PERFECT_BONUS}`] : []),
      ],
    });
  };
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  useEffect(() => {
    api.setTime(state.current.left);
    api.setStat("Hit rate —");
    api.setScore(0);
    return api.onTick((dt) => {
      const s = state.current;
      if (s.done) return;
      s.left -= dt;
      api.setTime(s.left);
      if (s.missLeft > 0) {
        s.missLeft -= dt;
        if (s.missLeft <= 0) {
          s.pending = [];
          setUp([]);
        }
      }
      if (s.left <= 0) finishRef.current(false);
    });
  }, [api]);

  const centerOf = (i: number) => {
    const b = buttons.current[i];
    const f = api.field();
    if (!b || !f) return { x: 0, y: 0 };
    const r = b.getBoundingClientRect();
    const q = f.getBoundingClientRect();
    return { x: r.left - q.left + r.width / 2, y: r.top - q.top + r.height / 3 };
  };

  const flip = (i: number) => {
    const s = state.current;
    if (s.done || s.missLeft > 0 || matched.has(i) || s.pending.includes(i)) return;
    const pending = [...s.pending, i];
    s.pending = pending;
    setUp(pending);
    api.sfx("blip", { pitch: 1.2 });
    if (pending.length < 2) {
      api.say(`${deck[i].name}, hash ${deck[i].hash}.`);
      return;
    }
    s.lookups += 1;
    const [a, b] = pending;
    const at = centerOf(b);
    if (deck[a].hash === deck[b].hash) {
      s.hits += 1;
      s.pending = [];
      const next = new Set(matched).add(a).add(b);
      setMatched(next);
      setUp([]);
      setHitFx([a, b]);
      api.setScore(s.hits * HIT_POINTS);
      api.float(at.x, at.y, "CACHE HIT!", "gold");
      api.sfx("coin");
      api.say(`${deck[b].name} — cache hit! ${s.hits} of ${PAIRS}.`);
      if (s.hits === PAIRS) finishRef.current(true);
    } else {
      s.missLeft = MISS_MS;
      api.float(at.x, at.y, "MISS", "bad");
      api.sfx("error", { volume: 0.6 });
      api.say(`${deck[b].name}. No match.`);
    }
    api.setStat(`Hit rate ${rate(s.hits, s.lookups)}%`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = buttons.current.filter((b): b is HTMLButtonElement => !!b);
    const step = gridStep(list, cur, e.key);
    if (step === null) return;
    e.preventDefault();
    setCur(step);
    list[step]?.focus({ preventScroll: true });
  };

  return (
    <div className="ch" data-reduced={reduced ? "" : undefined}>
      <div className="ch-grid" role="group" aria-label="Cache: 16 cards, find the 8 pairs" onKeyDown={onKeyDown}>
        {deck.map((c, i) => {
          const faceUp = up.includes(i) || matched.has(i);
          return (
            <button
              key={c.key}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              className="ch-card"
              data-up={faceUp ? "" : undefined}
              data-matched={matched.has(i) ? "" : undefined}
              data-hit={hitFx.includes(i) ? "" : undefined}
              data-tone={c.tone ?? undefined}
              tabIndex={i === cur ? 0 : -1}
              data-game-focus={i === cur ? "" : undefined}
              onClick={() => {
                setCur(i);
                flip(i);
              }}
              onAnimationEnd={(e) => {
                if (e.animationName === "ch-hit") setHitFx((h) => h.filter((k) => k !== i));
              }}
            >
              {/* named by the face that shows (no aria-label: the visible words are the name, WCAG 2.5.3) */}
              <span className="sr-only">{`Card ${i + 1}: `}</span>
              <span className="ch-card__inner">
                <span className="ch-card__back" aria-hidden={faceUp}>
                  <span className="ch-card__chip" aria-hidden="true" />
                  <span className="ch-card__word">Cache</span>
                  <span className="sr-only">— face down</span>
                </span>
                <span className="ch-card__front" aria-hidden={!faceUp}>
                  <svg viewBox="0 0 24 24" width="34" height="34" className="ch-card__logo" aria-hidden="true" focusable="false">
                    <path d={c.path} fill="currentColor" />
                  </svg>
                  <span className="ch-card__name">{c.name}</span>
                  <span className="ch-card__hash">sha256 {c.hash}</span>
                  {matched.has(i) ? <span className="sr-only">— cached</span> : null}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
