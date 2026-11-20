"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ACHIEVEMENTS } from "@/content/achievements";
import { COINS } from "@/content/coins";
import { levelProgress } from "@/content/levels";
import { LATEST_PATCH, PATCH_NOTES } from "@/content/patchNotes";
import { WORLDS, worldLabel } from "@/content/worlds";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { Soon } from "@/components/ui/ComingSoon";
import { Meter } from "@/components/ui/Meter";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/cn";
import { useHtmlAttribute } from "@/lib/hooks/useHtmlAttribute";
import { useSave, type ReducedMotionSetting } from "@/lib/store";
import type { FxLevel, Theme } from "@/lib/prefs";
import type { CursorSize } from "@/components/cursor/skins";
import { useUi } from "@/lib/ui";
import { jumpToWorld, setSpeedrun, switchTheme } from "./useGameRuntime";

function formatPlayed(ms: number) {
  const m = Math.floor(ms / 60000);
  return m < 1 ? "under a minute" : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

export function ResumePanel({ onResume }: { onResume: () => void }) {
  const xp = useSave((s) => s.player.xp);
  const coins = useSave((s) => s.player.coinIds.length);
  const trophies = useSave((s) => Object.keys(s.achievements).length);
  const played = useSave((s) => s.stats.timePlayedMs);
  const { level, title } = levelProgress(xp);
  return (
    <div className="grid gap-5">
      <p className="read text-muted">Everything pauses while this menu is open. Your progress is saved on this device only.</p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Level", `LV ${level} · ${title}`],
          ["XP", String(xp)],
          ["Coins", `${coins}/${COINS.length}`],
          ["Trophies", `${trophies}/${ACHIEVEMENTS.length}`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border-2 border-line bg-surface-2 px-3 py-2">
            <dt className="font-pixel text-xs uppercase tracking-wider text-muted">{k}</dt>
            <dd className="font-display font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted">Time played: {formatPlayed(played)}</p>
      <div>
        <ArcadeButton icon="controller" onClick={onResume} sfx="close">
          Resume
        </ArcadeButton>
      </div>
    </div>
  );
}

export function MapPanel({ onJump }: { onJump: () => void }) {
  const visited = useSave((s) => s.visitedWorlds);
  const speedrun = useHtmlAttribute("data-mode", "play") === "speedrun";
  const pct = Math.round((visited.length / WORLDS.length) * 100);
  return (
    <div className="grid gap-4">
      <Meter label="World completion" value={visited.length} max={WORLDS.length} segments={WORLDS.length} valueText={`${pct}% · ${visited.length} of ${WORLDS.length} worlds visited`} />
      <ul className="grid gap-2 sm:grid-cols-2">
        {WORLDS.map((w) => {
          const seen = visited.includes(w.id);
          const skipped = speedrun && (w.id === "launchpad" || w.id === "arcade");
          return (
            <li key={w.id} className="flex items-center justify-between gap-3 rounded-xl border-2 border-line bg-surface-2 px-3 py-2">
              <span className="grid">
                <span className="font-pixel text-xs uppercase tracking-wider text-muted">{worldLabel(w) || "Credits"}</span>
                <span className="font-semibold">
                  {w.gameTitle} <span className="text-muted">· {w.plainTitle}</span>
                </span>
              </span>
              <span className="flex items-center gap-2">
                {seen ? (
                  <span className="flex items-center gap-1 text-sm" title="Visited">
                    <PixelIcon name="check" title="Visited" />
                  </span>
                ) : null}
                <ArcadeButton
                  size="sm"
                  variant="secondary"
                  disabled={skipped}
                  aria-label={`Go to ${w.gameTitle}, ${w.plainTitle}`}
                  onClick={() => {
                    onJump();
                    window.setTimeout(() => {
                      if (w.number !== undefined) jumpToWorld(w.number);
                      else document.getElementById(w.id)?.scrollIntoView({ block: "start" });
                    }, 220);
                  }}
                >
                  Go
                </ArcadeButton>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AchievementsPanel() {
  const unlocked = useSave((s) => s.achievements);
  const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  return (
    <div className="grid gap-4">
      <Meter label="Achievements" value={count} max={ACHIEVEMENTS.length} segments={12} valueText={`${count} of ${ACHIEVEMENTS.length} unlocked`} tone="gold" />
      <ul className="grid gap-2 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const at = unlocked[a.id];
          const hidden = !at && "secret" in a && a.secret;
          return (
            <li key={a.id} className={cn("ach", at ? "ach--on" : "ach--off")}>
              <span className="ach__icon" aria-hidden="true">
                <PixelIcon name={a.icon as PixelIconName} size={32} mono={!at} />
              </span>
              <span className="grid">
                <span className="font-semibold">{hidden ? "???" : a.title}</span>
                <span className="text-sm text-muted">{hidden ? "Secret achievement — keep exploring." : a.description}</span>
                <span className="font-pixel text-xs uppercase tracking-wider text-muted">
                  {at ? `Unlocked ${new Date(at).toLocaleDateString()} · +${a.xp} XP` : `Locked · ${a.xp} XP`}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SettingsPanel() {
  const settings = useSave((s) => s.settings);
  const ownsRetro = useSave((s) => s.inventory.owned.includes("theme-retro"));
  const setSetting = useSave((s) => s.setSetting);
  const theme = useHtmlAttribute("data-theme", settings.theme) as Theme;
  const speedrun = useHtmlAttribute("data-mode", settings.mode) === "speedrun";
  return (
    <div className="grid gap-6">
      <Switch
        label="Recruiter Speedrun Mode"
        checked={speedrun}
        onChange={(v) => setSpeedrun(v)}
        onText="On"
        offText="Off"
      />
      <Switch label="Sound effects" checked={settings.sound} onChange={(v) => setSetting("sound", v)} />
      <label className="grid gap-2">
        <span className="font-semibold">Volume</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(settings.volume * 100)}
          aria-valuetext={`${Math.round(settings.volume * 100)}%`}
          onChange={(e) => setSetting("volume", Number(e.target.value) / 100)}
          className="pixel-range"
          style={{ "--val": `${Math.round(settings.volume * 100)}%` } as CSSProperties}
        />
      </label>
      <Segmented<FxLevel>
        legend="Effects"
        value={settings.fx}
        onChange={(v) => setSetting("fx", v)}
        options={[
          { value: "chill", label: "Chill" },
          { value: "normal", label: "Normal" },
          { value: "chaos", label: "Chaos" },
        ]}
      />
      <Segmented<ReducedMotionSetting>
        legend="Reduced motion"
        value={settings.reducedMotion}
        onChange={(v) => setSetting("reducedMotion", v)}
        options={[
          { value: "system", label: "Follow system" },
          { value: "reduce", label: "Reduce" },
          { value: "full", label: "Full motion" },
        ]}
      />
      <Segmented<Theme>
        legend="Theme"
        value={theme}
        onChange={(v) => switchTheme(v)}
        options={[
          { value: "night", label: "Night" },
          { value: "day", label: "Day" },
          { value: "retro", label: ownsRetro ? "Retro CRT" : "Retro (locked)", disabled: !ownsRetro, hint: "Reach LV 7 or visit the Prize Counter" },
        ]}
      />
      <Segmented<CursorSize>
        legend="Cursor size"
        value={settings.cursorSize}
        onChange={(v) => setSetting("cursorSize", v)}
        options={[
          { value: "normal", label: "Normal 32" },
          { value: "large", label: "Large 48" },
          { value: "xl", label: "XL 64" },
        ]}
      />
      <Switch label="BYTE the mascot" checked={settings.byteVisible} onChange={(v) => setSetting("byteVisible", v)} onText="Shown" offText="Hidden" />
      <p className="text-sm text-muted">Reduced motion and Recruiter Speedrun Mode keep effects on Chill.</p>
    </div>
  );
}

const SHORTCUTS: [string, string][] = [
  ["0 – 8", "Jump to a world"],
  ["Esc", "Pause menu / resume"],
  ["M", "Map"],
  ["L", "Locate your cursor (or shake the mouse)"],
  ["Shift + S", "Sound on / off"],
  ["Shift + D", "Day / night"],
  ["Shift + R", "Recruiter Speedrun Mode"],
  ["`", "Terminal · AKSHAT-OS (type help)"],
  ["Shift + F10", "Game menu (or right-click; Shift + right-click: the browser's)"],
  ["?", "This list"],
  ["Tab / Shift + Tab", "Move between controls"],
];

export function ControlsPanel() {
  return (
    <div className="grid gap-4">
      <p className="read text-muted">Shortcuts never fire while you type in a field. Inside a game or a dialog only Esc is global.</p>
      <div>
        {/* phones have no ` key — the terminal is one tap away here (PART 16) */}
        <ArcadeButton type="button" variant="secondary" icon="terminal" size="sm" onClick={() => useUi.getState().setTerminal(true)}>
          Open the terminal
        </ArcadeButton>{" "}
        {/* PART 19 · the chat, one tap away on phones too */}
        <ArcadeButton type="button" variant="secondary" icon="chat" size="sm" data-speedrun="hide" onClick={() => useUi.getState().setChat(true)}>
          Ask BYTE
        </ArcadeButton>
      </div>
      <table className="w-full border-separate border-spacing-y-1 text-left">
        <thead className="sr-only">
          <tr>
            <th scope="col">Keys</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {SHORTCUTS.map(([keys, action]) => (
            <tr key={keys}>
              <td className="w-40 py-1 pr-4">
                <kbd className="kbd">{keys}</kbd>
              </td>
              <td className="py-1">{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PatchNotesPanel({ active }: { active: boolean }) {
  const markPatchSeen = useSave((s) => s.markPatchSeen);
  useEffect(() => {
    if (active) markPatchSeen(LATEST_PATCH);
  }, [active, markPatchSeen]);
  return (
    <ol className="grid gap-4">
      {PATCH_NOTES.map((p) => (
        <li key={p.version} className="rounded-xl border-2 border-line bg-surface-2 p-4">
          <p className="font-pixel text-xs uppercase tracking-wider text-muted">
            v{p.version} · {p.date}
          </p>
          <p className="mb-2 font-display font-bold">{p.title}</p>
          <ul className="grid list-disc gap-1 pl-5 text-sm">
            {p.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export function SaveFilePanel({ resumeHref }: { resumeHref: string | null }) {
  return (
    <div className="grid gap-4">
      <p className="read">The Save File is the résumé — the same facts as this site, as a PDF.</p>
      {resumeHref ? (
        <div>
          <ArcadeButton href={resumeHref} download icon="chest" cursorLabel="OPEN" command={{ type: "download", what: "resume" }}>
            Save file · Résumé
          </ArcadeButton>
        </div>
      ) : (
        <p className="flex flex-wrap items-center gap-3">
          <ArcadeButton disabled icon="lock" variant="secondary">
            Save file · Résumé
          </ArcadeButton>
          <Soon />
        </p>
      )}
      <p className="text-sm text-muted">
        Your game progress (XP, coins, achievements, settings) lives in this browser&apos;s local storage. Nothing is
        sent anywhere.
      </p>
    </div>
  );
}

export function ResetPanel() {
  const [step, setStep] = useState<"idle" | "confirm" | "done">("idle");
  const resetSave = useSave((s) => s.resetSave);
  if (step === "done") return <p className="read">Save erased. A fresh run starts now — good luck, Player One.</p>;
  return (
    <div className="grid gap-4">
      <p className="read text-muted">Erases XP, coins, achievements, prizes and visited worlds. Your settings stay.</p>
      {step === "idle" ? (
        <div>
          <ArcadeButton variant="danger" icon="bug" onClick={() => setStep("confirm")}>
            Reset save
          </ArcadeButton>
        </div>
      ) : (
        <div className="grid gap-3 rounded-xl border-[3px] border-dashed border-red-fg p-4" role="alertdialog" aria-label="Confirm reset">
          <p className="font-semibold">This erases your progress like a corrupted memory card. Sure?</p>
          <div className="flex flex-wrap gap-3">
            <ArcadeButton variant="secondary" onClick={() => setStep("idle")} autoFocus>
              Keep my save
            </ArcadeButton>
            <ArcadeButton
              variant="danger"
              sfx="lose"
              onClick={() => {
                resetSave();
                setStep("done");
              }}
            >
              Erase save
            </ArcadeButton>
          </div>
        </div>
      )}
    </div>
  );
}
