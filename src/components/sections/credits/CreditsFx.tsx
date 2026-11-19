"use client";

import { useEffect } from "react";
import { byte } from "@/lib/byte";
import { command } from "@/lib/commands";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { fx } from "@/lib/juice";
import { scrollToElement } from "@/lib/scroll";

const MANUAL_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]);

/**
 * The credits' island (PART 15):
 *  • the roll scrolls by itself (a CSS loop over two copies of the list); a wheel, a touch or a scrolling key inside it
 *    hands it to the visitor — the box becomes a normal scroller at the spot the roll had reached — until it leaves
 *    the screen. Hover and focus pause the loop (CSS); "Pause the roll" stops it (and rolls on from where the visitor
 *    scrolled to);
 *  • the coin drifting through the roll → coin #12;
 *  • ▲ Back to top: BYTE lights a jetpack while the page flies up to the Title Screen.
 */
export function CreditsFx() {
  useEffect(() => {
    const footer = document.getElementById("credits");
    if (!footer) return;
    const abort = new AbortController();
    const on = { signal: abort.signal };
    const roll = footer.querySelector<HTMLElement>("[data-credits-roll]");
    const track = footer.querySelector<HTMLElement>("[data-credits-track]");

    const pauseBtn = footer.querySelector<HTMLButtonElement>("[data-credits-pause]");
    const rollAnim = () => track?.getAnimations().find((a) => a instanceof CSSAnimation && a.animationName === "credits-roll");
    const sync = () => pauseBtn?.setAttribute("aria-pressed", String(!!roll && (roll.hasAttribute("data-paused") || roll.hasAttribute("data-manual"))));
    // → true when it just took over (a static list — reduced motion, Speedrun, off screen — has no loop to take over)
    const manual = () => {
      if (!roll || !track || roll.hasAttribute("data-manual")) return false;
      const anim = rollAnim();
      if (!anim) return false;
      // where the loop is now (0 → one copy's height), so taking over doesn't jump
      const dur = Number(anim.effect?.getComputedTiming().duration ?? 0);
      const t = dur ? ((Number(anim.currentTime ?? 0) % dur) + dur) % dur / dur : 0;
      const offset = t * (track.scrollHeight / 2);
      roll.setAttribute("data-manual", "");
      roll.setAttribute("data-lenis-prevent", ""); // a real scroller now: the wheel scrolls it, not the page
      roll.scrollTop = offset;
      sync();
      return true;
    };
    // back to rolling, from where the visitor left it
    const resume = () => {
      if (!roll || !track) return;
      const wasManual = roll.hasAttribute("data-manual");
      const t = wasManual ? Math.min(1, roll.scrollTop / Math.max(1, track.scrollHeight)) : 0;
      roll.removeAttribute("data-paused");
      roll.removeAttribute("data-manual");
      roll.removeAttribute("data-lenis-prevent");
      roll.scrollTop = 0;
      if (wasManual) {
        const anim = rollAnim(); // a fresh animation once data-manual is gone
        const dur = Number(anim?.effect?.getComputedTiming().duration ?? 0);
        if (anim && dur) anim.currentTime = t * dur;
      }
      sync();
    };
    pauseBtn?.addEventListener(
      "click",
      () => {
        if (!roll) return;
        if (roll.hasAttribute("data-paused") || roll.hasAttribute("data-manual")) resume();
        else {
          roll.setAttribute("data-paused", "");
          sync();
        }
      },
      on,
    );
    // the wheel tick that takes over only switches modes (the next ones scroll the roll)
    roll?.addEventListener(
      "wheel",
      (e) => {
        if (manual()) e.preventDefault();
      },
      { passive: false, signal: abort.signal },
    );
    roll?.addEventListener("touchstart", () => void manual(), { passive: true, signal: abort.signal });
    roll?.addEventListener(
      "keydown",
      (e) => {
        if (MANUAL_KEYS.has(e.key)) manual();
      },
      on,
    );
    const away = new IntersectionObserver((entries) => {
      if (!roll || entries.some((e) => e.isIntersecting) || !roll.hasAttribute("data-manual")) return;
      roll.removeAttribute("data-manual");
      roll.removeAttribute("data-lenis-prevent");
      roll.scrollTop = 0; // off screen: back to the self-scrolling roll for next time (a pause stays a pause)
      sync();
    });
    if (roll) away.observe(roll);

    footer.addEventListener(
      "click",
      (e) => {
        const target = e.target as Element;
        const coin = target.closest<HTMLElement>("[data-credits-coin]");
        if (coin) {
          const r = coin.getBoundingClientRect();
          const origin = { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
          command({ type: "coin", id: "credits-roll", origin });
          if (!prefersReducedMotion()) fx.burst(origin.x, origin.y, { shape: "coin", count: 10 });
          return;
        }
        const top = target.closest<HTMLAnchorElement>("[data-back-to-top]");
        const title = document.getElementById("title");
        if (!top || !title || (e as MouseEvent).button !== 0) return;
        e.preventDefault();
        byte.jetpack();
        history.pushState(null, "", "#title");
        scrollToElement(title, { focus: true });
      },
      on,
    );

    return () => {
      abort.abort();
      away.disconnect();
    };
  }, []);
  return null;
}
