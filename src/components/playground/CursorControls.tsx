"use client";

import { useState } from "react";
import { CURSOR_SIZES, CURSOR_SKINS, type CursorSize } from "@/components/cursor/skins";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { locateCursor, setCursorSize, setCursorSkin } from "@/lib/cursor";
import { useGameCursor } from "@/lib/hooks/useGameCursor";
import { useHtmlAttribute } from "@/lib/hooks/useHtmlAttribute";

const SIZE_LABEL: Record<CursorSize, string> = { normal: "Normal", large: "Large", xl: "XL" };

/** Skin + size pickers (the real switches land in PART 3's Settings / PART 11's Prize Counter), ping, game mode. */
export function CursorControls() {
  const skin = useHtmlAttribute("data-cursor-skin", "pixel-pop");
  const size = useHtmlAttribute("data-cursor-size", "normal");
  const [gameMode, setGameMode] = useState(false);
  useGameCursor(gameMode ? "crosshair" : null);

  return (
    <div className="grid gap-5">
      <fieldset className="grid gap-3">
        <legend className="mb-2 font-pixel text-sm uppercase tracking-wider text-muted">Skin (locked ones = preview only)</legend>
        <div className="flex flex-wrap gap-3">
          {CURSOR_SKINS.map((s) => (
            <ArcadeButton
              key={s.id}
              size="sm"
              variant={skin === s.id ? "primary" : "secondary"}
              aria-pressed={skin === s.id}
              cursorLabel="EQUIP"
              onClick={() => setCursorSkin(s.id)}
            >
              {s.name}
              {s.locked ? " · locked" : ""}
            </ArcadeButton>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="mb-2 font-pixel text-sm uppercase tracking-wider text-muted">Cursor size (Settings)</legend>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(CURSOR_SIZES) as CursorSize[]).map((id) => (
            <ArcadeButton
              key={id}
              size="sm"
              variant={size === id ? "primary" : "secondary"}
              aria-pressed={size === id}
              onClick={() => setCursorSize(id)}
            >
              {SIZE_LABEL[id]} {CURSOR_SIZES[id]}
            </ArcadeButton>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <ArcadeButton icon="map" variant="secondary" onClick={() => locateCursor()}>
          Ping my cursor (L)
        </ArcadeButton>
        <ArcadeButton
          icon="controller"
          variant={gameMode ? "danger" : "ghost"}
          aria-pressed={gameMode}
          cursorLabel="PLAY"
          onClick={() => setGameMode((v) => !v)}
        >
          {gameMode ? "Exit game mode" : "Game mode: global crosshair"}
        </ArcadeButton>
      </div>
    </div>
  );
}
