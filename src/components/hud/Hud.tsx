"use client";

import { ACHIEVEMENTS, isAchievementId } from "@/content/achievements";
import { COINS } from "@/content/coins";
import { levelProgress } from "@/content/levels";
import { LATEST_PATCH } from "@/content/patchNotes";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { Tooltip } from "@/components/ui/Tooltip";
import { useHtmlAttribute } from "@/lib/hooks/useHtmlAttribute";
import { useSave } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { HudButton, ThemeToggle, WorldLabel, XpBar } from "./HudParts";
import { setSpeedrun } from "./useGameRuntime";

/**
 * The HUD (PART 3 #6): fixed top, glass + pixel brackets, 56px → 44px after the Title Screen, never hides.
 * Left: BYTE · AKSHAT.EXE · LV · XP bar. Center: current world. Right: coins · trophies · sound · day/night ·
 * speedrun · map · pause. Everything is a real button with a shortcut tooltip.
 */
export function Hud() {
  const world = useUi((s) => s.currentWorld);
  const openPause = useUi((s) => s.openPause);
  const xp = useSave((s) => s.player.xp);
  const wallet = useSave((s) => s.player.wallet);
  const coinsFound = useSave((s) => s.player.coinIds.length);
  const trophies = useSave((s) => Object.keys(s.achievements).filter(isAchievementId).length);
  const sound = useSave((s) => s.settings.sound);
  const setSetting = useSave((s) => s.setSetting);
  const patchUnseen = useSave((s) => s.meta.lastSeenPatch !== LATEST_PATCH);
  const theme = useHtmlAttribute("data-theme", "night");
  const mode = useHtmlAttribute("data-mode", "play");
  const { level, title } = levelProgress(xp);

  return (
    <header className="hud" data-compact={world !== "title" ? "" : undefined} aria-label="Game HUD">
      <div className="hud__left">
        <span className="hud__byte" aria-hidden="true">
          <PixelIcon name="byte" />
        </span>
        <span className="hud__brand">AKSHAT.EXE</span>
        <span className="hud__lv">
          <span aria-hidden="true">LV{level}</span>
          <span className="sr-only">
            Level {level}, {title}
          </span>
        </span>
        <XpBar />
      </div>

      <WorldLabel />

      <div className="hud__right">
        <Tooltip title={`Wallet · ${wallet} coin${wallet === 1 ? "" : "s"}`} typeLine={`Hidden coins found ${coinsFound}/${COINS.length}`}>
          <button
            type="button"
            className="hud-chip"
            aria-label={`Wallet: ${wallet} coins. Hidden coins found ${coinsFound} of ${COINS.length}. Open achievements.`}
            onClick={() => openPause("achievements")}
          >
            <span className="hud-coin" aria-hidden="true">
              <PixelIcon name="coin" />
            </span>
            <span aria-hidden="true">{wallet}</span>
          </button>
        </Tooltip>
        <Tooltip title="Trophies" typeLine={`${trophies}/${ACHIEVEMENTS.length} achievements unlocked`}>
          <button
            type="button"
            className="hud-chip hud-chip--optional"
            aria-label={`${trophies}/${ACHIEVEMENTS.length} trophies (achievements unlocked). Open achievements.`}
            onClick={() => openPause("achievements")}
          >
            <span aria-hidden="true">
              <PixelIcon name="trophy" />
            </span>
            <span aria-hidden="true">
              {trophies}/{ACHIEVEMENTS.length}
            </span>
          </button>
        </Tooltip>
        <HudButton
          label={sound ? "Sound on" : "Sound off"}
          shortcut="Shift+S"
          icon={sound ? "speaker" : "mute"}
          pressed={sound}
          onClick={() => setSetting("sound", !sound)}
        />
        <ThemeToggle theme={theme} />
        <HudButton
          label="Recruiter Speedrun Mode"
          shortcut="Shift+R"
          icon="bolt"
          pressed={mode === "speedrun"}
          onClick={() => setSpeedrun("toggle")}
        />
        <HudButton label="Map" shortcut="M" icon="map" onClick={() => openPause("map")} className="hud-btn--optional" />
        <HudButton label="Pause menu" shortcut="Escape" icon="pause" badge={patchUnseen} onClick={() => openPause()} />
      </div>
    </header>
  );
}
