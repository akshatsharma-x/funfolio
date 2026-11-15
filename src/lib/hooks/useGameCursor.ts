import { useEffect } from "react";
import type { CursorVariant } from "@/components/cursor/skins";
import { claimCursor } from "../cursor";

/**
 * Sets <html data-cursor="variant"> while `variant` is truthy and restores the previous variant on change/unmount
 * (stack-safe). Use it for games (crosshair), drags (grabbing/pull) and R3F hovers (hand):
 *   useGameCursor(hovered ? "hand" : null)
 * drei's useCursor is banned (R2): it writes document.body.style.cursor and wipes the pixel cursors.
 */
export function useGameCursor(variant: CursorVariant | null | false | undefined): void {
  useEffect(() => {
    if (!variant || variant === "default") return;
    return claimCursor(variant);
  }, [variant]);
}
