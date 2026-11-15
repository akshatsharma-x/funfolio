// Save → <html> attributes (+ cursor assets and sound). Called by the game runtime on start and on every settings or
// equipment change, so the store itself stays free of DOM side effects.

import { setCursorSize, setCursorSkin } from "./cursor";
import type { FxLevel, Mode, Theme, UrlOverrides } from "./prefs";
import { sfx } from "./sfx";
import type { SaveData } from "./store";

export type Effective = { theme: Theme; mode: Mode; fx: FxLevel; reduced: boolean };

function setAttr(name: string, value: string) {
  const d = document.documentElement;
  if (d.getAttribute(name) !== value) d.setAttribute(name, value);
}

export function applyToDocument(save: SaveData, overrides: UrlOverrides): Effective {
  const osReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motion = save.settings.reducedMotion;
  const reduced = motion === "reduce" || (motion === "system" && osReduce);
  const mode: Mode = overrides.speedrun ? "speedrun" : save.settings.mode;
  const theme: Theme = overrides.theme ?? save.settings.theme;
  // Bible §4: reduced motion → CHILL; Speedrun Mode → CHILL. ?fx= wins for QA.
  const fx: FxLevel = overrides.fx ?? (reduced || mode === "speedrun" ? "chill" : save.settings.fx);

  setAttr("data-theme", theme);
  setAttr("data-mode", mode);
  setAttr("data-fx", fx);
  if (motion === "system") document.documentElement.removeAttribute("data-motion");
  else setAttr("data-motion", motion);
  setCursorSkin(save.inventory.equipped.cursorSkin);
  setCursorSize(save.settings.cursorSize);
  sfx.configure({ enabled: save.settings.sound, volume: save.settings.volume });
  return { theme, mode, fx, reduced };
}
