"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { HudState, LaunchpadController, RoundResult } from "@/components/games/launchpad/game";
import { ANCHOR, SHOTS, WORLD } from "@/components/games/launchpad/level";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { announce } from "@/lib/announce";
import { bus } from "@/lib/bus";
import { command, type GateHow } from "@/lib/commands";
import { useHtmlAttribute } from "@/lib/hooks/useHtmlAttribute";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * THE LAUNCHPAD stage (PART 7): HUD + game screen. The physics chunk loads when the stage nears the viewport (not
 * under reduced motion — the poster offers "Play anyway"; Speedrun Mode hides the whole world). Skip ▶▶ works at
 * any moment, even before the game has loaded.
 */
export function LaunchpadStage({ poster }: { poster: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const ctl = useRef<LaunchpadController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mode = useHtmlAttribute("data-mode", "play");
  const [near, setNear] = useState(false);
  const [playAnyway, setPlayAnyway] = useState(false);
  const [live, setLive] = useState(false);
  const [hud, setHud] = useState<HudState | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const want = mode !== "speedrun" && (playAnyway || (near && !reduced));

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!want || ctl.current) return;
    let cancelled = false;
    void import("@/components/games/launchpad/game").then((m) => {
      if (cancelled || !screen.current || !handle.current) return;
      ctl.current = m.startLaunchpad({
        screen: screen.current,
        handle: handle.current,
        onHud: setHud,
        onAnnounce: announce,
        onEnd: (r) => {
          setResult(r);
          command({ type: "gate", id: "quest-log", how: r.cleared ? "cleared" : "played" });
          announce(r.cleared ? `Fortress cleared! Score ${fmt(r.score)}. The Quest Log is unlocked.` : `Close enough! ${r.popped} of ${r.total} bugs popped, score ${fmt(r.score)}. Quest Log unlocked anyway.`);
          requestAnimationFrame(() => resultRef.current?.querySelector<HTMLElement>("[data-primary]")?.focus());
        },
      });
      setLive(true);
    });
    return () => {
      cancelled = true;
    };
  }, [want]);

  useEffect(
    () => () => {
      ctl.current?.destroy();
      ctl.current = null;
    },
    [],
  );

  /** Off to the Quest Log: the remaining crates fly up and assemble into its heading (QuestGate plays it). */
  const toQuestLog = (how?: GateHow) => {
    const crates = ctl.current?.liftCrates() ?? [];
    bus.emit("gate:assemble", { crates });
    if (how) command({ type: "gate", id: "quest-log", how });
  };
  const playAgain = () => {
    setResult(null);
    ctl.current?.reset();
    screen.current?.focus();
  };

  const shots = hud?.shots ?? SHOTS;
  return (
    <div ref={wrap} className="lp" data-slingshot="" data-live={live ? "" : undefined} data-phase={hud?.phase}>
      <div className="lp__hud" role="group" aria-label="Launchpad status and controls">
        <span className="lp__stat">
          <span className="lp__k">Shots</span>
          <span className="lp__shots" role="img" aria-label={`${shots} of ${SHOTS} shots left`}>
            {Array.from({ length: SHOTS }, (_, i) => (
              <span key={i} className="lp__shot" data-on={i < shots ? "" : undefined} aria-hidden="true" />
            ))}
          </span>
        </span>
        <span className="lp__stat">
          <span className="lp__k">Score</span>
          <span className="lp__v">{fmt(hud?.score ?? 0)}</span>
        </span>
        <span className="lp__stat">
          <span className="lp__k">Best</span>
          <span className="lp__v">{hud?.best != null ? fmt(hud.best) : "—"}</span>
        </span>
        <span className="lp__hud-actions">
          <button type="button" className="lp__btn" data-fx-skip="" onClick={() => toQuestLog("skipped")}>
            Skip ▶▶
          </button>
          <button type="button" className="lp__btn" data-fx-skip="" disabled={!live} onClick={playAgain}>
            Reset ↺
          </button>
        </span>
      </div>
      <div
        ref={screen}
        className="lp__screen"
        tabIndex={live ? 0 : -1}
        role={live ? "application" : undefined}
        aria-label={live ? "The Launchpad — slingshot game" : undefined}
        aria-describedby={live ? "lp-help" : undefined}
        data-fx-skip=""
        data-game-screen=""
        data-primary={live ? "" : undefined}
        data-primary-keys="ArrowUp Enter"
      >
        {poster}
        <div ref={handle} className="lp__handle" data-cursor="grab" aria-hidden="true" style={{ left: `${(ANCHOR.x / WORLD.w) * 100}%`, top: `${(ANCHOR.y / WORLD.h) * 100}%` } as CSSProperties} />
        {!live && reduced && mode !== "speedrun" ? (
          <div className="lp__cover">
            <p className="lp__cover-text">Reduced motion is on, so the Quest Log below is already unlocked.</p>
            <ArcadeButton size="sm" icon="controller" data-fx-skip="" onClick={() => setPlayAnyway(true)}>
              Play anyway
            </ArcadeButton>
          </div>
        ) : null}
        {live && hud?.phase === "aim" && hud.shots === SHOTS && hud.power === 0 ? (
          <p className="lp__tip" aria-hidden="true">
            Drag BYTE back and let go
          </p>
        ) : null}
        <p className="lp__keys" aria-hidden="true">
          <kbd>←</kbd> <kbd>→</kbd> angle · <kbd>↑</kbd> <kbd>↓</kbd> power · <kbd>Space</kbd> launch · <kbd>R</kbd> reset
        </p>
        <p id="lp-help" className="sr-only">
          Left and right arrows aim, up and down set the power, Space launches, R resets. Skip goes straight to the Quest Log.
        </p>
        {result ? (
          <div ref={resultRef} className="lp__result" data-cleared={result.cleared ? "" : undefined}>
            <p className="lp__result-title">{result.cleared ? "Fortress cleared!" : "Close enough! Quest Log unlocked anyway 😄"}</p>
            <p className="lp__result-score">
              Score <span className="lp__num">{fmt(result.score)}</span> · Best <span className="lp__num">{fmt(result.best)}</span>
              {result.newBest ? <span className="lp__new-best"> · New best!</span> : null} ·{" "}
              <span className="lp__num">
                {result.popped}/{result.total}
              </span>{" "}
              bugs
            </p>
            <div className="lp__result-actions">
              <ArcadeButton size="sm" data-primary="" data-fx-skip="" onClick={() => toQuestLog()}>
                Continue to the Quest Log ▼
              </ArcadeButton>
              <ArcadeButton size="sm" variant="secondary" data-fx-skip="" onClick={playAgain}>
                Play again ↺
              </ArcadeButton>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
