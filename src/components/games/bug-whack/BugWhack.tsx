"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { gridStep, rng } from "../engine";
import { BUG_WHACK_SECONDS, BUG_WHACK_TARGET } from "../registry";
import type { GameProps } from "../types";
import { highlight, SNIPPETS } from "./snippets";

const TOTAL = BUG_WHACK_SECONDS * 1000;
const LIVES = 3;
const FEATURE_CHANCE = 0.2;
type Kind = "bug" | "feature";
type Cell = { kind: Kind | null; until: number; line: number; n: number };
type Splat = { id: number; cell: number; kind: Kind | "miss" };
const EMPTY: Cell = { kind: null, until: 0, line: 0, n: 0 };
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** Numpad keys work by position (7 8 9 is the top row); the number row reads left to right, top to bottom. */
const NUMPAD: Readonly<Record<string, number>> = { Numpad7: 0, Numpad8: 1, Numpad9: 2, Numpad4: 3, Numpad5: 4, Numpad6: 5, Numpad1: 6, Numpad2: 7, Numpad3: 8 };

/**
 * BUG WHACK (Truechip · debugging): glitch-bugs pop out of the lines of nine mini code editors — whack them (click,
 * tap, keys 1–9 or the numpad) before they get away; spare the friendly "feature" sprites (each costs a life). 45s,
 * and it speeds up. Reused by the 404 page (PART 15) and the idle screensaver (PART 16) through openGame("bug-whack").
 */
export default function BugWhack({ api, reduced, seed }: GameProps) {
  const [cells, setCells] = useState<readonly Cell[]>(() => SNIPPETS.map(() => EMPTY));
  const [splats, setSplats] = useState<readonly Splat[]>([]);
  const [cur, setCur] = useState(4);
  const rand = useMemo(() => rng(seed), [seed]);
  const st = useRef({ t: 0, left: TOTAL, spawnIn: 700, score: 0, lives: LIVES, combo: 0, bestCombo: 0, squashed: 0, features: 0, escaped: 0, n: 0, splat: 0, done: false, cells: SNIPPETS.map(() => EMPTY) as Cell[] });
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const finish = () => {
    const s = st.current;
    if (s.done) return;
    s.done = true;
    api.end({
      score: s.score,
      won: s.score >= BUG_WHACK_TARGET,
      headline: `${s.squashed} bug${s.squashed === 1 ? "" : "s"} squashed`,
      notes: [
        `Target ${BUG_WHACK_TARGET}${s.score >= BUG_WHACK_TARGET ? " ✓" : ""} · best combo ×${s.bestCombo}`,
        s.features ? `${s.features} feature${s.features === 1 ? "" : "s"} whacked by mistake` : "No features were harmed.",
        `${s.escaped} got away${s.lives <= 0 ? " · out of lives" : ""}`,
      ],
    });
  };
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  useEffect(() => {
    api.setTime(TOTAL);
    api.setLives(LIVES);
    api.setScore(0);
    api.setStat("Combo ×0");
    return api.onTick((dt) => {
      const s = st.current;
      if (s.done) return;
      s.t += dt;
      s.left -= dt;
      api.setTime(s.left);
      const p = Math.min(1, s.t / TOTAL);
      let changed = false;
      s.cells = s.cells.map((c) => {
        if (!c.kind || c.until > s.t) return c;
        changed = true;
        if (c.kind === "bug") {
          s.escaped += 1;
          if (s.combo) api.setStat("Combo ×0");
          s.combo = 0;
        }
        return EMPTY;
      });
      s.spawnIn -= dt;
      if (s.spawnIn <= 0) {
        s.spawnIn = lerp(900, 430, p) * (reduced ? 1.2 : 1) * (0.75 + rand() * 0.5);
        const free = s.cells.flatMap((c, i) => (c.kind ? [] : [i]));
        const count = p > 0.55 && rand() < 0.35 ? 2 : 1;
        for (let k = 0; k < count && free.length; k++) {
          const i = free.splice(Math.floor(rand() * free.length), 1)[0];
          const feature = s.t > 3000 && rand() < FEATURE_CHANCE;
          const life = lerp(1250, 650, p) * (feature ? 1.3 : 1) * (reduced ? 1.25 : 1);
          s.n += 1;
          s.cells[i] = { kind: feature ? "feature" : "bug", until: s.t + life, line: Math.floor(rand() * 4), n: s.n };
          changed = true;
        }
      }
      if (changed) setCells([...s.cells]);
      if (s.left <= 0) finishRef.current();
    });
  }, [api, rand, reduced]);

  const centerOf = (i: number) => {
    const b = buttons.current[i];
    const f = api.field();
    if (!b || !f) return { x: 0, y: 0 };
    const r = b.getBoundingClientRect();
    const q = f.getBoundingClientRect();
    return { x: r.left - q.left + r.width / 2, y: r.top - q.top + r.height * 0.35 };
  };

  const splat = (cell: number, kind: Splat["kind"]) => {
    const s = st.current;
    s.splat += 1;
    const id = s.splat;
    setSplats((list) => [...list.slice(-6), { id, cell, kind }]);
  };

  const whack = (i: number) => {
    const s = st.current;
    if (s.done) return;
    const c = s.cells[i];
    const at = centerOf(i);
    if (c.kind === "bug") {
      s.combo += 1;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      s.squashed += 1;
      const pts = 10 + Math.min(4, s.combo - 1) * 5;
      s.score += pts;
      api.setScore(s.score);
      api.setStat(`Combo ×${s.combo}`);
      api.float(at.x, at.y, `+${pts}`, s.combo >= 3 ? "gold" : "good");
      api.sfx("squish", { pitch: 0.9 + Math.min(0.6, s.combo * 0.08) });
    } else if (c.kind === "feature") {
      s.lives -= 1;
      s.features += 1;
      s.combo = 0;
      api.setLives(s.lives);
      api.setStat("Combo ×0");
      api.float(at.x, at.y, "That's a feature!", "bad");
      api.sfx("error");
      api.say(`That was a feature. ${s.lives} ${s.lives === 1 ? "life" : "lives"} left.`);
    } else {
      if (s.combo) api.setStat("Combo ×0");
      s.combo = 0;
      api.sfx("blip", { pitch: 0.5, volume: 0.5 });
      splat(i, "miss");
      return;
    }
    splat(i, c.kind);
    s.cells[i] = EMPTY;
    setCells([...s.cells]);
    if (s.lives <= 0) finishRef.current();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const pad = NUMPAD[e.code];
    const digit = /^Digit[1-9]$/.test(e.code) ? Number(e.code.slice(5)) - 1 : undefined;
    const i = pad ?? digit;
    if (i !== undefined) {
      e.preventDefault();
      setCur(i);
      buttons.current[i]?.focus({ preventScroll: true });
      whack(i);
      return;
    }
    const list = buttons.current.filter((b): b is HTMLButtonElement => !!b);
    const step = gridStep(list, cur, e.key);
    if (step === null) return;
    e.preventDefault();
    setCur(step);
    list[step]?.focus({ preventScroll: true });
  };

  return (
    <div className="bw" data-reduced={reduced ? "" : undefined}>
      <div className="bw-grid" role="group" aria-label="Nine code editors — whack the bugs with keys 1 to 9" onKeyDown={onKeyDown}>
        {SNIPPETS.map((snip, i) => {
          const c = cells[i];
          return (
            <button
              key={snip.file}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              className="bw-cell"
              data-kind={c.kind ?? undefined}
              tabIndex={i === cur ? 0 : -1}
              data-game-focus={i === cur ? "" : undefined}
              onClick={() => whack(i)}
            >
              <span className="bw-cell__bar" aria-hidden="true">
                <span className="bw-cell__dots" />
                <span className="bw-cell__file">{snip.file}</span>
                <kbd className="bw-cell__key">{i + 1}</kbd>
              </span>
              <span className="bw-code" aria-hidden="true">
                {snip.lines.map((ln, l) => (
                  <span key={l} className="bw-line" data-glitch={c.kind === "bug" && c.line === l ? "" : undefined}>
                    {highlight(ln).map((t, k) => (
                      <span key={k} className={t.kind ? `bw-${t.kind}` : undefined}>
                        {t.text}
                      </span>
                    ))}
                  </span>
                ))}
              </span>
              {c.kind ? (
                <span key={c.n} className="bw-sprite" data-kind={c.kind} style={{ "--line": c.line } as CSSProperties} aria-hidden="true">
                  <PixelIcon name={c.kind === "bug" ? "bug" : "sparkle"} size={32} />
                  {c.kind === "feature" ? <span className="bw-sprite__tag">feature</span> : null}
                </span>
              ) : null}
              {splats
                .filter((sp) => sp.cell === i)
                .map((sp) => (
                  <span
                    key={sp.id}
                    className="bw-splat"
                    data-kind={sp.kind}
                    aria-hidden="true"
                    onAnimationEnd={() => setSplats((list) => list.filter((x) => x.id !== sp.id))}
                  />
                ))}
              <span className="sr-only">{`Editor ${i + 1}${c.kind === "bug" ? ": a bug — whack it!" : c.kind === "feature" ? ": a feature — leave it" : ""}`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
