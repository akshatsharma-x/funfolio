"use client";

import { useEffect, useRef } from "react";
import type { WorldId } from "@/content/worlds";
import { haptic } from "@/lib/haptics";
import { onScrollMotion, scrollToElement } from "@/lib/scroll";
import { useUi } from "@/lib/ui";

/** What A does in each world (its control carries data-primary in the markup). */
const A_LABEL: Partial<Record<WorldId, string>> = {
  title: "Press start",
  profile: "High five",
  launchpad: "Launch",
  quests: "Side quest",
  lab: "Read the scroll",
  vault: "Insert cartridge",
  arcade: "Play",
  skills: "JD scanner",
  trophies: "Turn the crank",
  lobby: "Write a message",
  credits: "Back to top",
};

const worlds = () => [...document.querySelectorAll<HTMLElement>("main > section[data-world][id], body > footer[data-world][id]")].filter((s) => s.getClientRects().length > 0);
const shown = (el: Element) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden" && !el.closest("[hidden], [inert]");

/**
 * Handheld Mode's controller (PART 17): a 56px bar at the bottom on a coarse pointer or a narrow screen (CSS decides;
 * never in Speedrun Mode). ◀ ▶ previous / next world · A = the world's primary action (its `data-primary` control:
 * clicked, focused — a field — or sent `data-primary-keys`, the Launchpad's ↑ Enter) · B = back: whatever Esc would
 * close (a card, the menu, a cartridge — a synthetic Escape the keyboard manager ignores), else the top of this
 * world, else the previous one · START = the pause menu. It tucks away while scrolling down and comes back on the way
 * up (and whenever a button in it has focus). Every press buzzes 10ms where haptics exist.
 */
export function HandheldPad() {
  const world = useUi((s) => s.currentWorld);
  const page = useUi((s) => s.pageLabel);
  const ref = useRef<HTMLElement>(null);

  // the pad's own flights (◀ ▶ A B) scroll the page too — they mustn't tuck it away mid-navigation
  const held = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lastY = window.scrollY;
    return onScrollMotion(({ y }) => {
      const dy = y - lastY;
      lastY = y;
      if (performance.now() < held.current) return;
      const edge = y < 40 || y + window.innerHeight > document.documentElement.scrollHeight - 40;
      if (edge || dy < -6) el.removeAttribute("data-tucked");
      else if (dy > 6) el.setAttribute("data-tucked", "");
    });
  }, []);
  const hold = () => {
    held.current = performance.now() + 1500;
    ref.current?.removeAttribute("data-tucked");
  };

  const current = () => worlds().find((s) => s.dataset.world === world) ?? null;
  const go = (step: number) => {
    haptic(10);
    hold();
    const list = worlds();
    if (!list.length) return;
    const i = Math.max(0, list.findIndex((s) => s.dataset.world === world));
    const target = list[Math.max(0, Math.min(list.length - 1, i + step))];
    if (target) scrollToElement(target, { focus: true });
  };
  const primary = () => {
    haptic(14);
    hold();
    const t = [...(current()?.querySelectorAll<HTMLElement>("[data-primary]") ?? [])].find(shown);
    if (!t) return;
    scrollToElement(t, { block: "center" });
    if (t.matches("input, textarea, select")) {
      t.focus({ preventScroll: true });
      return;
    }
    t.focus({ preventScroll: true });
    const keys = t.dataset.primaryKeys?.split(/\s+/).filter(Boolean);
    if (keys?.length) for (const key of keys) t.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
    else t.click();
  };
  /** Sends the Escape that closes whatever is open; true when something took it. */
  const escape = () => {
    const sec = current();
    const active = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
    const ev = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    Object.defineProperty(ev, "padB", { value: true }); // the keyboard manager mustn't open the pause menu for it
    (active && !ref.current?.contains(active) ? active : (sec ?? document.body)).dispatchEvent(ev);
    return ev.defaultPrevented;
  };
  // A finger on B: the Escape goes out on pointerdown — before the page's own "a tap elsewhere closes it" handlers
  // (pointerdown, focusout) close a card and leave B thinking nothing was open (it would then fly to the world's top too).
  const pressedB = useRef<{ at: number; done: boolean } | null>(null);
  const backDown = () => {
    pressedB.current = { at: performance.now(), done: escape() };
  };
  const back = () => {
    haptic(10);
    hold();
    const press = pressedB.current && performance.now() - pressedB.current.at < 1500 ? pressedB.current : null;
    pressedB.current = null;
    if (press ? press.done : escape()) return; // the keyboard (Enter / Space on B) has no pointerdown
    const sec = current();
    if (sec && sec.getBoundingClientRect().top < -40) scrollToElement(sec, { focus: true });
    else go(-1);
  };
  const start = () => {
    haptic(10);
    useUi.getState().openPause();
  };

  const label = page ? null : (A_LABEL[world] ?? null);
  return (
    <nav ref={ref} className="pad" aria-label="Handheld controller" data-pad="">
      {page ? null : (
        <span className="pad__dpad">
          <button type="button" className="pad__btn pad__btn--dir" aria-label="Previous world" onClick={() => go(-1)} data-pad-btn="prev">
            <span aria-hidden="true">◀</span>
          </button>
          <button type="button" className="pad__btn pad__btn--dir" aria-label="Next world" onClick={() => go(1)} data-pad-btn="next">
            <span aria-hidden="true">▶</span>
          </button>
        </span>
      )}
      <button type="button" className="pad__start" onClick={start} aria-label="Start — pause menu" data-pad-btn="start">
        START
      </button>
      <span className="pad__ab">
        <button type="button" className="pad__btn pad__btn--b" aria-label="B — back" onPointerDownCapture={backDown} onClick={back} data-pad-btn="b">
          B
        </button>
        {label ? (
          <button type="button" className="pad__btn pad__btn--a" aria-label={`A — ${label}`} onClick={primary} data-pad-btn="a">
            <span aria-hidden="true">A</span>{" "}
            <span className="pad__a-label" aria-hidden="true">
              {label}
            </span>
          </button>
        ) : null}
      </span>
    </nav>
  );
}
