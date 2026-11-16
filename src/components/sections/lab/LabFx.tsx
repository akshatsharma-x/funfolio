"use client";

import { useEffect } from "react";
import { announce } from "@/lib/announce";
import { command } from "@/lib/commands";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { fx } from "@/lib/juice";
import { sfx } from "@/lib/sfx";

/** 3 hits ≈ 1.5 flashes per second (R5: never more than 3). */
const HIT_MS = 650;
const HP_AFTER = [6, 3, 0] as const;
const CLEAR_AT = 0.9;
const CONFETTI = ["#FF3D8B", "#22D3EE", "#B6FF3B", "#FFD23F", "#A78BFA"];

/**
 * The Lab's juice (PART 9), attached to the server-rendered boss cards:
 *  • first view of a boss below the fold: the HP bar drains in 3 chunky hits (flash + knock-back + damage word), then
 *    DEFEATED thumps down with a small confetti pop. Server HTML is the beaten state — nothing is armed under reduced
 *    motion, in Speedrun Mode or when the arena is already on screen.
 *  • the Smog Golem's arena: the pointer is an air purifier (a ring follows it; taps work too; "Run the air purifier"
 *    is the keyboard path). Clear ~90% of the smog → blue sky, the golem shrinks, coin #7.
 */
export function LabFx() {
  useEffect(() => {
    const section = document.getElementById("lab");
    if (!section) return;
    const root = document.documentElement;
    const abort = new AbortController();
    const on = { signal: abort.signal, passive: true } as const;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    const center = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    };
    const cards = [...section.querySelectorAll<HTMLElement>("[data-boss-card]")];

    // ── 1 · boss battles ─────────────────────────────────────────────────────────────────────────────────────
    const fight = (card: HTMLElement) => {
      const arena = card.querySelector<HTMLElement>("[data-arena]");
      const bar = card.querySelector<HTMLElement>("[data-hp]");
      const sprite = card.querySelector<HTMLElement>(".boss-arena__sprite");
      const words = (card.dataset.damage ?? "").split("|");
      card.setAttribute("data-battle", "fight");
      HP_AFTER.forEach((hp, k) =>
        later(() => {
          bar?.setAttribute("data-hp", String(hp));
          sprite?.animate(
            [
              { filter: "brightness(2.4) saturate(0)", translate: "6px 0" },
              { filter: "none", translate: "0 0" },
            ],
            { duration: 220, easing: "ease-out" },
          );
          const c = center(sprite ?? card);
          if (words[k]) fx.text(c.x, c.y - 36, words[k], { font: "display", color: "#FFD23F", size: 19, rise: 44, ms: 950 });
          fx.burst(c.x, c.y, { count: 8, colors: ["#FFF4E0", "#A78BFA", "#FFD23F"] });
          if (arena) fx.shake(3, arena);
          sfx.play("thud", { pitch: 1 + k * 0.18 });
        }, 280 + k * HIT_MS),
      );
      later(() => {
        card.setAttribute("data-battle", "won");
        sfx.play("win");
        const stamp = card.querySelector('[data-stamp="defeated"]');
        if (stamp) {
          const c = center(stamp);
          fx.burst(c.x, c.y, { count: 18, colors: CONFETTI });
        }
      }, 280 + HP_AFTER.length * HIT_MS + 200);
    };
    const pending = new Set<HTMLElement>();
    if (!prefersReducedMotion() && root.getAttribute("data-mode") !== "speedrun") {
      for (const card of cards) {
        const arena = card.querySelector("[data-arena]");
        if (!arena) continue;
        const r = arena.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) continue; // already on screen: already beaten
        card.setAttribute("data-battle", "armed");
        card.querySelector("[data-hp]")?.setAttribute("data-hp", "10");
        pending.add(card);
      }
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const card = (e.target as HTMLElement).closest<HTMLElement>("[data-boss-card]");
          if (!e.isIntersecting || !card || !pending.has(card)) continue;
          pending.delete(card);
          io.unobserve(e.target);
          fight(card);
        }
      },
      { threshold: 0.55 },
    );
    for (const card of pending) {
      const arena = card.querySelector("[data-arena]");
      if (arena) io.observe(arena);
    }

    // ── 2 · the Smog Golem: the pointer is an air purifier ───────────────────────────────────────────────────────
    const golem = section.querySelector<HTMLElement>("[data-boss-card] [data-smog]")?.closest<HTMLElement>("[data-boss-card]");
    const arena = golem?.querySelector<HTMLElement>("[data-arena]");
    const smog = golem?.querySelector<HTMLElement>("[data-smog]");
    if (golem && arena && smog) {
      const blobs = [...smog.querySelectorAll<HTMLElement>(".smog__blob")];
      const ring = smog.querySelector<HTMLElement>(".smog__ring");
      let cleared = 0;
      let done = false;
      let lastPuff = 0;
      const win = () => {
        done = true;
        blobs.forEach((b) => b.setAttribute("data-cleared", ""));
        arena.setAttribute("data-sky", "clear");
        sfx.play("powerUp");
        command({ type: "coin", id: "cleared-smog", origin: center(arena) });
        announce("The smog cleared: blue skies over the Smog Golem.");
      };
      const clearAt = (x: number, y: number, radius: number) => {
        if (done) return;
        let hit = false;
        for (const b of blobs) {
          if (b.hasAttribute("data-cleared")) continue;
          const r = b.getBoundingClientRect();
          if (Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y) < radius + r.width * 0.22) {
            b.setAttribute("data-cleared", "");
            cleared++;
            hit = true;
          }
        }
        if (hit && performance.now() - lastPuff > 140) {
          lastPuff = performance.now();
          sfx.play("whoosh", { volume: 0.5 });
        }
        if (cleared / blobs.length >= CLEAR_AT) win();
      };
      let frame = 0;
      let px = 0;
      let py = 0;
      arena.addEventListener("pointerenter", () => ring?.setAttribute("data-on", ""), on);
      arena.addEventListener("pointerleave", () => ring?.removeAttribute("data-on"), on);
      arena.addEventListener(
        "pointermove",
        (e) => {
          if (e.pointerType === "touch") return;
          px = e.clientX;
          py = e.clientY;
          if (frame) return;
          frame = requestAnimationFrame(() => {
            frame = 0;
            const a = arena.getBoundingClientRect();
            if (ring) ring.style.transform = `translate(${(px - a.left).toFixed(0)}px, ${(py - a.top).toFixed(0)}px)`;
            clearAt(px, py, 56);
          });
        },
        on,
      );
      arena.addEventListener("pointerdown", (e) => clearAt(e.clientX, e.clientY, 68), on);
      golem.querySelector("[data-purify]")?.addEventListener(
        "click",
        () => {
          if (done) return;
          const left = blobs.filter((b) => !b.hasAttribute("data-cleared"));
          left.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
          const step = prefersReducedMotion() ? 0 : 45;
          sfx.play("whoosh");
          left.forEach((b, i) =>
            later(() => {
              b.setAttribute("data-cleared", "");
              cleared++;
              if (!done && cleared / blobs.length >= CLEAR_AT) win();
            }, i * step),
          );
        },
        { signal: abort.signal },
      );
    }

    return () => {
      abort.abort();
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      for (const card of cards) {
        card.removeAttribute("data-battle");
        card.querySelector("[data-hp]")?.setAttribute("data-hp", "0");
      }
    };
  }, []);
  return null;
}
