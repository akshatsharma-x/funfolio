"use client";

import { useState } from "react";
import { ACHIEVEMENTS } from "@/content/achievements";
import { COINS } from "@/content/coins";
import { GAMES } from "@/content/games";
import { levelTitle } from "@/content/levels";
import { command } from "@/lib/commands";
import { sfx } from "@/lib/sfx";
import { useSave } from "@/lib/store";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { Modal } from "@/components/ui/Modal";

const played = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  return `${s}s`;
};

/**
 * YOUR RUN (PART 15): the visitor's session in the credits, live from the save — time played, hidden coins,
 * achievements, best scores, level — with [Share my run] (copies a line and the page's address) and [NEW GAME+] (a
 * reset that keeps the cosmetics, behind a fun confirm). The runtime portals it into the footer (the store stays out
 * of the initial bundle), like the Prize Counter's booth and the trophy shelf.
 */
export default function CreditsRun({ shareName }: { shareName: string }) {
  const xp = useSave((s) => s.player.xp);
  const level = useSave((s) => s.player.level);
  const coins = useSave((s) => s.player.coinIds.length);
  const achievements = useSave((s) => Object.keys(s.achievements).length);
  const scores = useSave((s) => s.games.highScores);
  const ms = useSave((s) => s.stats.timePlayedMs);
  const [confirm, setConfirm] = useState(false);
  const arcade = GAMES.filter((g) => g.arcade);
  const share = () => {
    const url = location.origin + location.pathname; // the page itself — not ?speedrun, ?boot=0 or a #world
    const text = `I reached LV ${level} and found ${coins}/${COINS.length} coins in ${shareName}'s Funfolio → ${url}`;
    void navigator.clipboard?.writeText(text).then(
      () => command({ type: "item", title: "Run copied", detail: "Paste it anywhere — brag responsibly" }),
      () => command({ type: "item", title: "Copy blocked", detail: text }),
    );
  };
  return (
    <div className="run__live" data-run-live="">
      <dl className="run__stats">
        <div className="run__stat">
          <dt>Time played</dt>
          <dd data-run="time">{played(ms)}</dd>
        </div>
        <div className="run__stat">
          <dt>Hidden coins</dt>
          <dd data-run="coins">
            {coins}/{COINS.length}
          </dd>
        </div>
        <div className="run__stat">
          <dt>Achievements</dt>
          <dd data-run="achievements">
            {achievements}/{ACHIEVEMENTS.length}
          </dd>
        </div>
        <div className="run__stat">
          <dt>Level</dt>
          <dd data-run="level">
            LV {level} <span className="run__level-title">· {levelTitle(level)}</span>
            <span className="sr-only"> ({xp} XP)</span>
          </dd>
        </div>
      </dl>
      <div className="run__scores">
        <h4 className="run__subtitle">Best scores</h4>
        <ul className="run__score-list">
          {arcade.map((g) => (
            <li key={g.id} className="run__score" data-run-score={g.id}>
              <span>{g.name}</span> <span className="run__score-value">{scores[g.id] ? scores[g.id].toLocaleString("en") : "—"}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="run__actions">
        <ArcadeButton type="button" icon="star" onClick={share} data-run-share="">
          Share my run
        </ArcadeButton>
        <ArcadeButton type="button" variant="secondary" icon="controller" onClick={() => setConfirm(true)} data-run-ngp="">
          New Game+
        </ArcadeButton>
      </div>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Start NEW GAME+?"
        description="Your cosmetics come with you — cursor skins, BYTE's hats, confetti and themes. XP, coins, achievements and high scores start over."
        footer={
          <>
            <ArcadeButton
              type="button"
              icon="bolt"
              data-run-ngp-confirm=""
              onClick={() => {
                useSave.getState().newGamePlus();
                sfx.play("powerUp");
                setConfirm(false);
                command({ type: "item", kicker: "New Game+", title: "A fresh run begins", detail: "Your cosmetics came along" });
              }}
            >
              Start New Game+
            </ArcadeButton>
            <ArcadeButton type="button" variant="ghost" onClick={() => setConfirm(false)}>
              Keep playing
            </ArcadeButton>
          </>
        }
      >
        <p className="run__confirm">BYTE has packed your gear. Everything else goes back in the box.</p>
      </Modal>
    </div>
  );
}
