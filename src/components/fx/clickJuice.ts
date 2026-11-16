// Click juice (PART 4 #2): every real click on the page answers. Away from text: a multicolor pixel burst
// (chill 4 · normal 10 · chaos 24), a 1-in-4 floating word, "COMBO ×N" for clicks < 500ms apart, and a ripple on the
// living grid. Near reading text the click stays silent — no particles over paragraphs (R6). Skips fields, text
// selections, drags, BYTE, games and dialogs. 10 clicks in 3s → "button-masher" (counted for every real click).

import { fx } from "@/lib/juice";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useSave } from "@/lib/store";

const READ = "p, li, dd, dt, h1, h2, h3, h4, h5, h6, blockquote, figcaption, td, th, pre, label, legend, .read, [data-read]";
const FIELD = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const SKIP = '[data-byte], [data-keyboard="exclusive"], [data-fx-skip], dialog, [popover]';
const WORDS = ["POW!", "BOOP", "NICE", "CRIT!", "+1", "GG", "WOW", "YEET", "EZ"];
const RAINBOW = ["#FF3D8B", "#FF8A1F", "#FFD23F", "#B6FF3B", "#22D3EE", "#A78BFA", "#2EE59D"];
const COMBO_MS = 500;
const MASH_COUNT = 10;
const MASH_MS = 3000;

/** Sample points around the click (and above it, where floating words rise): any reading element → stay quiet. */
const SAMPLES: [number, number][] = [
  [0, 0],
  [36, 0],
  [-36, 0],
  [0, 36],
  [0, -36],
  [26, 26],
  [-26, 26],
  [26, -26],
  [-26, -26],
  [0, -56],
  [-28, -50],
  [28, -50],
];

export function nearText(x: number, y: number): boolean {
  for (const [dx, dy] of SAMPLES) {
    const el = document.elementFromPoint(x + dx, y + dy);
    if (el && el.closest(READ)) return true;
  }
  return false;
}

export function startClickJuice(): () => void {
  let down: { x: number; y: number; t: number; id: number } | null = null;
  let lastClick = -Infinity;
  let combo = 0;
  const recent: number[] = [];

  const onDown = (e: PointerEvent) => {
    down = null;
    if (!e.isPrimary || e.button !== 0) return;
    const target = e.target instanceof Element ? e.target : null;
    if (!target || target.closest(FIELD) || target.closest(SKIP)) return;
    down = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId };
  };

  const onUp = (e: PointerEvent) => {
    const d = down;
    down = null;
    if (!d || e.pointerId !== d.id) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || e.timeStamp - d.t > 700) return; // a drag or long press
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim()) return; // selecting text
    if (document.querySelector("dialog[open]")) return;
    onClick(d.x, d.y, e.timeStamp);
  };

  const onClick = (x: number, y: number, now: number) => {
    recent.push(now);
    while (recent.length && now - recent[0] > MASH_MS) recent.shift();
    if (recent.length >= MASH_COUNT) useSave.getState().unlock("button-masher");
    combo = now - lastClick < COMBO_MS ? combo + 1 : 1;
    lastClick = now;

    if (prefersReducedMotion() || nearText(x, y)) return; // calm: reading zones and reduced motion
    const level = document.documentElement.getAttribute("data-fx") ?? "normal";
    fx.ripple(x, y);
    fx.burst(x, y, { colors: RAINBOW, shape: "pixel" });
    if (level === "chill") return; // CHILL: a small pop, no words
    const color = getComputedStyle(document.documentElement).getPropertyValue("--world").trim() || "#FFD23F";
    if (combo >= 2) fx.text(x, y - 20, `COMBO ×${combo}`, { color, size: combo >= 5 ? 22 : 18 });
    else if (Math.random() < 0.25) fx.text(x, y - 20, WORDS[Math.floor(Math.random() * WORDS.length)], { color });
  };

  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  window.addEventListener("pointercancel", () => (down = null), { passive: true });
  return () => {
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
  };
}
