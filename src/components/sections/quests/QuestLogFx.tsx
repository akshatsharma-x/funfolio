"use client";

import { useEffect } from "react";
import { XP_RULES } from "@/content/levels";
import { bus } from "@/lib/bus";
import { command } from "@/lib/commands";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { fx } from "@/lib/juice";
import { scrollToElement } from "@/lib/scroll";
import { sfx } from "@/lib/sfx";

const TICK_MS = 150;
const READ_MS = 3000;
const HEX = "0123456789abcdef";

type Target = { el: HTMLElement; trigger: Element; run: () => void };

/**
 * The Quest Log's juice (PART 8), attached to the server-rendered cards (one small island, no per-card hydration):
 *  • first view: checklist boxes tick one by one (150ms, blip) → fanfare + COMPLETE stamp; EY's REGULATED ENV stamp
 *    thumps down; the active quest's widgets play (needle, squeeze + squish, hash scramble, graph). Server HTML is the
 *    final state — only targets below the fold (or behind the closed gate) are armed; never under reduced motion or in
 *    Speedrun Mode.
 *  • a card read for 3s → +10 XP (once per card per save), the ghost flies to the HUD.
 *  • emblems spin like coins · "$0.08" = coin #6 ("Saved you a coin") · loot chips jump to their Skill Tree entry.
 */
export function QuestLogFx() {
  useEffect(() => {
    const section = document.getElementById("quests");
    if (!section) return;
    const root = document.documentElement;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    const gateOpen = () => root.getAttribute("data-quest-log") !== "locked";
    const center = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    };
    const cards = [...section.querySelectorAll<HTMLElement>("[data-quest-card]")];

    // ── 1 · one-shot animations on first view ──────────────────────────────────────────────────────────────
    const scramble = (el: HTMLElement) => {
      const final = el.dataset.hash ?? el.textContent ?? "";
      let n = 0;
      const step = () => {
        n += 1;
        if (n > 14) {
          el.textContent = final;
          return;
        }
        el.textContent = final.replace(/[0-9a-f]/g, () => HEX[Math.floor(Math.random() * 16)]);
        later(step, 55);
      };
      later(step, 240);
    };
    const playCard = (card: HTMLElement) => {
      card.setAttribute("data-play", "run");
      const ticks = card.querySelectorAll(".checklist__item").length;
      for (let i = 0; i < ticks; i++) later(() => sfx.play("blip", { pitch: 1 + i * 0.12 }), 160 + i * TICK_MS);
      if (ticks) later(() => sfx.play("fanfare"), 160 + ticks * TICK_MS + 80);
      if (card.querySelector('[data-widget="tokens"]')) later(() => sfx.play("squish"), 700);
      const hash = card.querySelector<HTMLElement>("[data-hash]");
      if (hash) scramble(hash);
    };

    const targets: Target[] = [];
    for (const card of cards) {
      targets.push({ el: card, trigger: card.querySelector(".checklist, .widgets") ?? card, run: () => playCard(card) });
      const stamp = card.querySelector<HTMLElement>('[data-stamp="regulated"]');
      if (stamp)
        targets.push({
          el: stamp,
          trigger: stamp,
          run: () => {
            stamp.setAttribute("data-play", "run");
            later(() => sfx.play("thud"), 260);
          },
        });
    }
    const pending = new Set<Target>();
    if (!prefersReducedMotion() && root.getAttribute("data-mode") !== "speedrun") {
      for (const t of targets) {
        const r = t.trigger.getBoundingClientRect();
        if (gateOpen() && r.top < window.innerHeight && r.bottom > 0) continue; // already being read: never replay over it
        t.el.setAttribute("data-play", "armed");
        pending.add(t);
      }
    }
    const visible = new Set<Element>();
    const check = () => {
      if (!gateOpen()) return;
      for (const t of pending) {
        if (!visible.has(t.trigger)) continue;
        pending.delete(t);
        t.run();
      }
    };
    const playIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        check();
      },
      { threshold: 0.4 },
    );
    for (const t of pending) playIo.observe(t.trigger);

    // ── 2 · read a card for 3s → +10 XP (the store pays each "open:" reason once per save) ─────────────────────
    const reading = new Map<Element, number>();
    const enough = new Set<Element>();
    const reward = (card: HTMLElement) => {
      reading.delete(card);
      if (!enough.has(card)) return;
      if (!gateOpen() || document.visibilityState !== "visible") {
        reading.set(card, window.setTimeout(() => reward(card), 1000)); // frosted or hidden: not read yet
        return;
      }
      const head = card.querySelector(".quest-head") ?? card;
      command({ type: "xp", amount: XP_RULES.openDetails, reason: `open:quest-${card.dataset.questCard}`, origin: center(head) });
      readIo.unobserve(card);
      enough.delete(card);
    };
    const readIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const card = e.target as HTMLElement;
          const seen = e.isIntersecting && e.intersectionRect.height >= Math.min(e.boundingClientRect.height, window.innerHeight) * 0.5;
          if (seen) {
            enough.add(card);
            if (!reading.has(card)) reading.set(card, window.setTimeout(() => reward(card), READ_MS));
          } else {
            enough.delete(card);
            window.clearTimeout(reading.get(card));
            reading.delete(card);
          }
        }
      },
      { threshold: [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1] },
    );
    cards.forEach((c) => readIo.observe(c));

    // gate opening (PART 7) releases whatever waited behind the frost
    const gateWatch = new MutationObserver(check);
    gateWatch.observe(root, { attributes: true, attributeFilter: ["data-quest-log"] });

    // ── 3 · emblems, the cost coin, loot links ──────────────────────────────────────────────────────────────
    const flash = (el: HTMLElement) => {
      el.setAttribute("data-flash", "");
      later(() => el.removeAttribute("data-flash"), 1700);
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      const emblem = target?.closest<HTMLElement>("[data-emblem-spin]");
      if (emblem) {
        sfx.play("clink");
        if (!prefersReducedMotion())
          emblem.querySelector(".quest-emblem__coin")?.animate([{ transform: "rotateY(0turn)" }, { transform: "rotateY(2turn)" }], { duration: 820, easing: "cubic-bezier(0.2, 0.75, 0.25, 1)" });
        return;
      }
      const egg = target?.closest<HTMLElement>("[data-coin-egg]");
      if (egg) {
        command({ type: "coin", id: egg.dataset.coinEgg ?? "", origin: center(egg) });
        return;
      }
      const link = target?.closest<HTMLAnchorElement>("a[data-loot]");
      if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const id = decodeURIComponent(link.hash.slice(1));
      const dest = document.getElementById(id);
      if (!dest) return;
      e.preventDefault(); // instead of the global anchor handler: same smooth scroll + focus, then a flash on arrival
      history.pushState(null, "", `#${id}`);
      scrollToElement(dest, { focus: true, onComplete: () => flash(dest) });
    };
    section.addEventListener("click", onClick);
    const offCoin = bus.on("coin:collected", ({ id }) => {
      const egg = section.querySelector(`[data-coin-egg="${id}"]`);
      if (!egg) return;
      const c = center(egg);
      fx.text(c.x, c.y - 26, "Saved you a coin", { color: "#FFC83D", size: 16, rise: 42, ms: 1500 });
    });

    return () => {
      playIo.disconnect();
      readIo.disconnect();
      gateWatch.disconnect();
      section.removeEventListener("click", onClick);
      offCoin();
      timers.forEach((t) => window.clearTimeout(t));
      reading.forEach((t) => window.clearTimeout(t));
      for (const t of targets) t.el.removeAttribute("data-play");
    };
  }, []);
  return null;
}
