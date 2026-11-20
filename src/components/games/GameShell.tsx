"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ComponentType, type KeyboardEvent, type Ref } from "react";
import type { ArcadeData } from "@/content/arcade";
import { ACHIEVEMENT_BY_ID } from "@/content/achievements";
import { COIN_BY_ID } from "@/content/coins";
import { ARCADE_IDS } from "@/content/games";
import { levelTitle } from "@/content/levels";
import { announce } from "@/lib/announce";
import { useGameCursor } from "@/lib/hooks/useGameCursor";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { sfx } from "@/lib/sfx";
import { useSave } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { EMBLEMS } from "./art";
import { createLoop, floatText, type Loop } from "./engine";
import { PixelArt } from "./PixelArt";
import { GAME_META } from "./registry";
import type { GameApi, GameProps, GameResult } from "./types";

type Phase = "title" | "playing" | "paused" | "results";
type Hud = { score: number; lives: number | null; time: number | null; stat: string | null };
type Summary = GameResult & { newBest: boolean; best: number; coins: number; hidden: string | null; xp: number; unlocked: string[]; level: number | null };
export type ShellHandle = { escape(): boolean };

const EMPTY_HUD: Hud = { score: 0, lives: null, time: null, stat: null };
const XP_RUN = 10;
const XP_TARGET = 25;

/** Focus the first match inside root one frame later — after React has rendered it (and the dialog is shown). */
function focusSoon(root: () => HTMLElement | null, selector: string) {
  requestAnimationFrame(() => root()?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true }));
}

/**
 * The game shell every arcade game runs in (PART 11): PRESS START title card with the how-to, the HUD (score, best,
 * time, lives, a game stat), pause (P / Esc, and automatically on window blur or a hidden tab), restart, exit, and the
 * results screen (best score saved, wallet coins, coin #9 the first time any game's target is beaten, achievements,
 * XP, and a "That's real:" line from content.ts). Games are lazy modules; they get a fixed-timestep tick that only runs
 * while they're being played, and a seed for their shuffles.
 */
export function GameShell({ id, data, active, ref }: { id: string; data: ArcadeData; active: boolean; ref?: Ref<ShellHandle> }) {
  const meta = GAME_META[id];
  const game = data.games[id];
  const reduced = useReducedMotion();
  const best = useSave((s) => s.games.highScores[id]);
  const [phase, setPhase] = useState<Phase>("title");
  const [why, setWhy] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [seed, setSeed] = useState(1);
  const [Game, setGame] = useState<ComponentType<GameProps> | null>(null);
  const [failed, setFailed] = useState(false);
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const [summary, setSummary] = useState<Summary | null>(null);
  const phaseRef = useRef<Phase>("title");
  const ticks = useRef(new Set<(dt: number) => void>());
  const frames = useRef(new Set<(alpha: number) => void>());
  const loopRef = useRef<Loop | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const reducedRef = useRef(reduced);

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  const go = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // the game's module (lazy) — fetched as the dialog opens, while the title card is up
  useEffect(() => {
    let live = true;
    meta?.load().then(
      (m) => live && setGame(() => m.default),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [meta]);

  // one fixed-timestep loop, running only while playing in an open dialog
  useEffect(() => {
    const loop = createLoop(
      (dt) => {
        for (const fn of ticks.current) fn(dt);
      },
      (alpha) => {
        for (const fn of frames.current) fn(alpha);
      },
    );
    loopRef.current = loop;
    return () => loop.stop();
  }, []);
  useEffect(() => {
    if (phase === "playing" && active) loopRef.current?.start();
    else loopRef.current?.stop();
  }, [phase, active]);

  useGameCursor(phase === "playing" && active ? (meta?.cursor ?? null) : null);

  const freeze = (on: boolean) => {
    for (const a of fieldRef.current?.getAnimations({ subtree: true }) ?? []) {
      if (on && a.playState === "running") a.pause();
      else if (!on && a.playState === "paused") a.play();
    }
  };

  const pause = useCallback(
    (reason: string | null = null) => {
      if (phaseRef.current !== "playing") return false;
      go("paused");
      setWhy(reason);
      for (const a of fieldRef.current?.getAnimations({ subtree: true }) ?? []) if (a.playState === "running") a.pause();
      sfx.play("blip", { pitch: 0.6 });
      announce(reason ? `Paused: ${reason}.` : "Paused.");
      focusSoon(() => rootRef.current, "[data-shell-resume]");
      return true;
    },
    [go],
  );

  const resume = () => {
    if (phaseRef.current !== "paused") return;
    go("playing");
    setWhy(null);
    freeze(false);
    announce("Resumed.");
  };

  const start = () => {
    ticks.current.clear();
    frames.current.clear();
    setHud(EMPTY_HUD);
    setSummary(null);
    setWhy(null);
    setSeed(Math.floor(Math.random() * 2 ** 31));
    setRound((r) => r + 1);
    go("playing");
    sfx.play("insertCoin");
  };

  const exit = () => useUi.getState().closeGame();

  const finish = useCallback(
    (r: GameResult) => {
      if (phaseRef.current !== "playing") return;
      loopRef.current?.stop();
      const store = useSave.getState();
      const levelBefore = store.player.level;
      const { best: newBest, highScore } = store.recordScore(id, r.score);
      const hidden = r.won && store.collectCoin("arcade-target") ? (COIN_BY_ID["arcade-target"]?.name ?? "Hidden coin") : null;
      const coins = store.earnCoins(r.won ? 2 : r.score > 0 ? 1 : 0, `arcade:${id}`);
      const xp = store.addXp(r.won ? XP_TARGET : XP_RUN, `game:${id}`);
      const unlocked: string[] = [];
      for (const a of r.achievements ?? []) if (store.unlock(a)) unlocked.push(a);
      const plays = useSave.getState().games.plays;
      if (ARCADE_IDS.every((g) => (plays[g] ?? 0) > 0) && store.unlock("arcade-rat")) unlocked.push("arcade-rat");
      const levelNow = useSave.getState().player.level;
      setSummary({ ...r, newBest, best: highScore, coins, hidden, xp, unlocked, level: levelNow > levelBefore ? levelNow : null });
      go("results");
      sfx.play(r.won ? "win" : "lose");
      announce(`${r.headline}. Score ${r.score}${newBest ? ", a new best" : ""}.`);
      focusSoon(() => rootRef.current, "[data-shell-again]");
    },
    [go, id],
  );

  const api = useMemo<GameApi>(
    () => ({
      onTick: (fn) => {
        ticks.current.add(fn);
        return () => {
          ticks.current.delete(fn);
        };
      },
      onFrame: (fn) => {
        frames.current.add(fn);
        return () => {
          frames.current.delete(fn);
        };
      },
      setScore: (score) => setHud((h) => (h.score === score ? h : { ...h, score })),
      setLives: (lives) => setHud((h) => (h.lives === lives ? h : { ...h, lives })),
      setTime: (ms) => {
        const time = ms === null ? null : Math.max(0, Math.ceil(ms / 1000));
        setHud((h) => (h.time === time ? h : { ...h, time }));
      },
      setStat: (stat) => setHud((h) => (h.stat === stat ? h : { ...h, stat })),
      end: (r) => finish(r),
      float: (x, y, text, tone) => floatText(fieldRef.current, x, y, text, tone, reducedRef.current),
      say: (text) => announce(text),
      sfx: (name, opts) => sfx.play(name, opts),
      field: () => fieldRef.current,
    }),
    [finish],
  );

  // Esc (from the Modal) pauses a running game; otherwise the dialog closes (exit)
  useImperativeHandle(ref, () => ({ escape: () => pause(null) }), [pause]);

  // auto-pause: the window lost focus or the tab was hidden
  useEffect(() => {
    if (phase !== "playing" || !active) return;
    const onBlur = () => pause("the window lost focus");
    const onVis = () => {
      if (document.hidden) pause("the tab was hidden");
    };
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [phase, active, pause]);

  // the title card's PRESS START takes focus once the dialog is up
  useEffect(() => {
    if (active && phase === "title") focusSoon(() => rootRef.current, "[data-shell-start]");
  }, [active, phase]);
  // playing (a start, a restart, a resume — or the game's module arriving): focus goes into the game, onto its current
  // control (each game marks it data-game-focus), so its keys work at once
  useEffect(() => {
    if (active && phase === "playing" && Game) focusSoon(() => fieldRef.current, "[data-game-focus]");
  }, [active, phase, Game, round]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === "p") {
      if (phaseRef.current === "playing") pause();
      else if (phaseRef.current === "paused") resume();
      else return;
      e.preventDefault();
    } else if (k === "r" && (phaseRef.current === "paused" || phaseRef.current === "results")) {
      e.preventDefault();
      start();
    }
  };

  if (!meta || !game) return <p className="gshell__msg">Oops — that&apos;s a glitch. This game isn&apos;t in the arcade.</p>;
  const playing = phase === "playing" || phase === "paused";

  return (
    <div ref={rootRef} className="gshell" data-phase={phase} data-game={id} onKeyDown={onKeyDown}>
      {playing ? (
        <div className="gshell__hud" role="group" aria-label="Game status">
          <span className="gshell__readout">
            <span>Score</span>
            <b>{hud.score}</b>
          </span>
          <span className="gshell__readout">
            <span>Best</span>
            <b>{best ?? "—"}</b>
          </span>
          {hud.time !== null ? (
            <span className="gshell__readout" data-low={hud.time <= 5 ? "" : undefined}>
              <span>Time</span>
              <b>{hud.time}s</b>
            </span>
          ) : null}
          {hud.lives !== null ? (
            <span className="gshell__readout">
              <span>Lives</span>
              <b className="gshell__lives">
                <span className="sr-only">{`${hud.lives} of 3`}</span>
                {Array.from({ length: 3 }, (_, i) => (
                  <PixelIcon key={i} name="heart" size={16} className={i < (hud.lives ?? 0) ? undefined : "gshell__life--lost"} />
                ))}
              </b>
            </span>
          ) : null}
          {hud.stat ? <span className="gshell__readout gshell__stat">{hud.stat}</span> : null}
          <button type="button" className="gshell__pause" onClick={() => pause()} disabled={phase !== "playing"}>
            <PixelIcon name="pause" size={16} mono /> Pause <kbd>P</kbd>
          </button>
        </div>
      ) : null}

      <div className="gshell__stage">
        {phase === "title" ? (
          <div className="gshell__card gshell__title">
            <PixelArt def={EMBLEMS[id]} size={112} className="gshell__emblem" />
            <h3 className="gshell__name">{game.name}</h3>
            <p className="gshell__based">
              <span className="gshell__kicker">Based on real work</span> {game.basedOn}
            </p>
            <ul className="gshell__how" aria-label="How to play">
              {meta.how.map((step) => (
                <li key={step.text}>
                  {step.keys.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}{" "}
                  {step.text}
                </li>
              ))}
              <li>{meta.touch}</li>
            </ul>
            <p className="gshell__goal">{meta.goal(game)}</p>
            <p className="gshell__best">
              Best <b>{best ?? "no score yet"}</b>
            </p>
            <ArcadeButton size="lg" icon="controller" onClick={start} data-shell-start="" data-fx-skip="">
              Press start
            </ArcadeButton>
            <p className="gshell__hint">
              <kbd>P</kbd> or <kbd>Esc</kbd> pauses · <kbd>Esc</kbd> again leaves the arcade
            </p>
          </div>
        ) : null}

        {playing ? (
          <div ref={fieldRef} className="gshell__field" inert={phase === "paused"} data-reduced={reduced ? "" : undefined}>
            {Game ? (
              <Game key={round} api={api} reduced={reduced} game={game} data={data} seed={seed} paused={phase === "paused"} />
            ) : (
              <p className="gshell__msg">{failed ? "Oops — that's a glitch. The game didn't load — check your connection, then reload the page." : "Loading the cartridge…"}</p>
            )}
          </div>
        ) : null}

        {phase === "paused" ? (
          <div className="gshell__overlay">
            <div className="gshell__card gshell__paused">
              <h3 className="gshell__name">Paused</h3>
              {why ? <p className="text-muted">Paused because {why}.</p> : <p className="text-muted">The game waits for you.</p>}
              <div className="gshell__actions">
                <ArcadeButton icon="controller" onClick={resume} data-shell-resume="" data-fx-skip="">
                  Resume <kbd>P</kbd>
                </ArcadeButton>
                <ArcadeButton variant="secondary" onClick={start} data-fx-skip="">
                  Restart <kbd>R</kbd>
                </ArcadeButton>
                <ArcadeButton variant="ghost" onClick={exit} data-fx-skip="">
                  Exit
                </ArcadeButton>
              </div>
            </div>
          </div>
        ) : null}

        {phase === "results" && summary ? (
          <div className="gshell__card gshell__results" data-won={summary.won ? "" : undefined}>
            <p className="gshell__kicker">{summary.won ? "Target reached!" : "Game over"}</p>
            <h3 className="gshell__headline">{summary.headline}</h3>
            <p className="gshell__score">
              <span>Score</span> <b>{summary.score}</b>
              {summary.newBest ? <span className="gshell__new">New best!</span> : <span className="text-muted">Best {summary.best}</span>}
            </p>
            {summary.notes?.length ? (
              <ul className="gshell__notes">
                {summary.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            ) : null}
            <ul className="gshell__loot" aria-label="Rewards">
              {summary.coins > 0 ? (
                <li>
                  <PixelIcon name="coin" size={16} /> +{summary.coins} coin{summary.coins === 1 ? "" : "s"} for the Prize Counter
                </li>
              ) : null}
              {summary.hidden ? (
                <li>
                  <PixelIcon name="coin" size={16} /> Hidden coin found: {summary.hidden}
                </li>
              ) : null}
              {summary.xp > 0 ? (
                <li>
                  <PixelIcon name="star" size={16} /> +{summary.xp} XP
                </li>
              ) : null}
              {summary.level ? (
                <li>
                  <PixelIcon name="sparkle" size={16} /> Level up! LV {summary.level} · {levelTitle(summary.level)}
                </li>
              ) : null}
              {summary.unlocked.map((a) => (
                <li key={a}>
                  <PixelIcon name="trophy" size={16} /> Achievement: {ACHIEVEMENT_BY_ID[a]?.title ?? a}
                </li>
              ))}
            </ul>
            {game.fact ? (
              <div className="gshell__real">
                <p className="gshell__kicker">That&apos;s real</p>
                <p>{game.fact}</p>
              </div>
            ) : null}
            <div className="gshell__actions">
              <ArcadeButton icon="controller" onClick={start} data-shell-again="" data-fx-skip="">
                Play again <kbd>R</kbd>
              </ArcadeButton>
              <ArcadeButton variant="ghost" onClick={exit} data-fx-skip="">
                Exit
              </ArcadeButton>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
