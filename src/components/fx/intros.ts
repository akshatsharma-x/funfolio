// WorldHeader intro (PART 4 #6): the first time a world's header scrolls into view this session — a colored band
// wipes across, "WORLD 3" stamps in, the title letters drop with stepped easing and a bounce, a "READY? GO!" chip
// pops, powerUp sfx. ≤ 900ms, inline (never an overlay). Headers already on screen when the page starts are marked
// seen without playing (no replay over text you are reading). Off under reduced motion and in Speedrun Mode.
// The letters are split only for the 900ms, with an sr-only copy; the original text node comes back afterwards.

import { bus } from "@/lib/bus";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { sfx } from "@/lib/sfx";

const KEY = "funfolio-intros";
const DURATION = 900;

function readSeen(): Set<string> {
  try {
    const v: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

export function startWorldIntros(): () => void {
  const headers = Array.from(document.querySelectorAll<HTMLElement>("header[data-world-header]"));
  if (!headers.length) return () => {};
  const seen = readSeen();
  const save = () => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify([...seen]));
    } catch {
      // storage blocked — intros just replay next time
    }
  };
  const timers: number[] = [];
  const pending = new Set<() => void>();
  let initial = true;

  const play = (el: HTMLElement, id: string) => {
    const game = el.querySelector<HTMLElement>(".world-header__game");
    const kicker = el.querySelector<HTMLElement>(".world-header__kicker");
    const text = game?.textContent ?? "";
    let restore = () => {};
    if (game && text && !game.classList.contains("text-rainbow")) {
      const sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = text;
      const letters = document.createElement("span");
      letters.className = "wh-letters";
      letters.setAttribute("aria-hidden", "true");
      letters.style.setProperty("--stagger", `${Math.min(28, 260 / Math.max(1, text.length - 1)).toFixed(1)}ms`);
      [...text].forEach((ch, i) => {
        const s = document.createElement("span");
        s.className = "wh-l";
        s.style.setProperty("--i", String(i));
        s.textContent = ch === " " ? "\u00a0" : ch; // keep word gaps inside inline-block letters
        letters.append(s);
      });
      game.replaceChildren(sr, letters);
      restore = () => {
        game.textContent = text;
      };
    }
    const chip = kicker ? document.createElement("span") : null;
    if (chip && kicker) {
      chip.className = "wh-ready";
      chip.setAttribute("aria-hidden", "true");
      chip.textContent = "READY?";
      kicker.append(chip);
    }
    const finish = () => {
      restore();
      el.setAttribute("data-intro", "done");
      chip?.remove();
      pending.delete(finish);
    };
    pending.add(finish);
    el.setAttribute("data-intro", "play");
    bus.emit("world:intro", { id });
    sfx.play("powerUp");
    timers.push(window.setTimeout(() => chip && (chip.textContent = "GO!"), 560));
    timers.push(
      window.setTimeout(() => {
        restore();
        restore = () => {};
        el.setAttribute("data-intro", "done");
      }, DURATION + 40),
    );
    timers.push(window.setTimeout(finish, 1500));
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const id = el.dataset.worldHeader ?? "";
        io.unobserve(el);
        if (seen.has(id)) continue;
        seen.add(id);
        save();
        if (initial) continue; // already on screen at start — no replay over visible content
        if (prefersReducedMotion() || document.documentElement.getAttribute("data-mode") === "speedrun") continue;
        play(el, id);
      }
      initial = false;
    },
    { threshold: 0.6 },
  );
  for (const h of headers) if (!seen.has(h.dataset.worldHeader ?? "")) io.observe(h);
  // another animation is about to own a header (PART 7: crates assembling into QUEST LOG) — don't play over it
  const offSkip = bus.on("intro:skip", ({ id }) => {
    seen.add(id);
    save();
    const el = headers.find((h) => h.dataset.worldHeader === id);
    if (el) io.unobserve(el);
  });

  return () => {
    offSkip();
    io.disconnect();
    timers.forEach((t) => window.clearTimeout(t));
    pending.forEach((finish) => finish());
  };
}
