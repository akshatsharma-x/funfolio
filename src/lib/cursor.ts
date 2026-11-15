// Cursor control (PART 2). The truth layer is pure CSS driven by three attributes on <html>:
//   data-cursor        variant (default | hand | grab | grabbing | crosshair | pull | not-allowed) — via claims below
//   data-cursor-skin   asset set (Pixel Pop + Prize Counter skins) — PART 3's store calls setCursorSkin()
//   data-cursor-size   normal 32 | large 48 | xl 64 — Settings → Cursor size calls setCursorSize()
// Nothing may write element.style.cursor or hide the pointer (R2; enforced by ESLint).

import {
  CURSOR_SIZE_IDS,
  CURSOR_SKIN_IDS,
  type CursorSize,
  type CursorSkinId,
  type CursorVariant,
} from "@/components/cursor/skins";
import { bus } from "./bus";
import { writePrefs } from "./prefs";

type Claim = { id: number; variant: CursorVariant };
const claims: Claim[] = [];
let nextId = 1;

function applyVariant() {
  const top = claims[claims.length - 1];
  document.documentElement.setAttribute("data-cursor", top ? top.variant : "default");
}

/**
 * Sets the global cursor variant until the returned release() is called. Claims stack, so nested users (a game inside
 * a hovered 3D scene, a drag inside a modal…) always restore the previous variant correctly.
 */
export function claimCursor(variant: CursorVariant): () => void {
  const id = nextId++;
  claims.push({ id, variant });
  applyVariant();
  return () => {
    const i = claims.findIndex((c) => c.id === id);
    if (i >= 0) claims.splice(i, 1);
    applyVariant();
  };
}

export function setCursorSkin(id: CursorSkinId): void {
  if (!CURSOR_SKIN_IDS.includes(id)) return;
  document.documentElement.setAttribute("data-cursor-skin", id);
  writePrefs({ cursorSkin: id });
}

export function setCursorSize(size: CursorSize): void {
  if (!CURSOR_SIZE_IDS.includes(size)) return;
  document.documentElement.setAttribute("data-cursor-size", size);
  writePrefs({ cursorSize: size });
}

/** Radar ping around the pointer (same as hotkey L). */
export function locateCursor(): void {
  bus.emit("cursor:locate", { source: "api" });
}
