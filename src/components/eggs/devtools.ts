// PART 16 · DevTools: a multicolor ASCII "AKSHAT" in the console and a `window.akshat` to play with. Calling any of
// its functions is the Console Cowboy achievement (the provider passes `onCall`).

import { COINS } from "@/content/coins";
import { command } from "@/lib/commands";
import { useSave } from "@/lib/store";

const GLYPHS: Record<string, string[]> = {
  A: [" ███ ", "█   █", "█████", "█   █", "█   █"],
  K: ["█   █", "█  █ ", "███  ", "█  █ ", "█   █"],
  S: [" ████", "█    ", " ███ ", "    █", "████ "],
  H: ["█   █", "█   █", "█████", "█   █", "█   █"],
  T: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
};
const COLORS = ["#FF3D8B", "#FF8A1F", "#FFD23F", "#2EE59D", "#22D3EE"];

let printed = false;
let installed = false;

/** Prints the banner once per page (or again with `force`) and installs `window.akshat` the first time. */
export function printBanner(force: boolean, onCall?: () => void, toLobby?: () => void): void {
  if (!printed || force) {
    printed = true;
    const rows = [0, 1, 2, 3, 4].map((i) => [..."AKSHAT"].map((ch) => GLYPHS[ch][i]).join("  "));
    console.log(rows.map((r) => `%c${r}`).join("\n"), ...COLORS.map((c) => `color:${c};font:700 11px/1.15 ui-monospace,monospace`));
    console.log("%cHey dev 👋 try akshat.hire() or akshat.help()", "color:#B6FF3B;font:600 13px ui-monospace,monospace");
  }
  if (installed || !onCall) return;
  installed = true;
  const called = () => onCall();
  (window as unknown as { akshat: Record<string, () => string> }).akshat = {
    help() {
      called();
      console.log("%cakshat.help()  this list\nakshat.hire()  the best idea you'll have today\nakshat.coins() your hidden-coin count\nakshat.secret() a hint", "color:#22D3EE;font:12px/1.5 ui-monospace,monospace");
      return "Console Cowboy unlocked. Yee-haw. 🤠";
    },
    hire() {
      called();
      command({ type: "item", kicker: "Console", title: "Excellent choice.", detail: "Opening the Co-op Lobby…" });
      toLobby?.();
      return "Excellent choice. Opening the Co-op Lobby — the form folds into a paper plane.";
    },
    coins() {
      called();
      const found = useSave.getState().player.coinIds.length;
      return `${found}/${COINS.length} hidden coins found.`;
    },
    secret() {
      called();
      const missing = COINS.find((c) => !useSave.getState().player.coinIds.includes(c.id));
      return missing ? `Coin hint: ${missing.hint}` : "All 12 coins found. The Golden cursor suits you.";
    },
  };
}
