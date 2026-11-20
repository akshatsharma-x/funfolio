"use client";

import { useEffect } from "react";
import { bus } from "@/lib/bus";
import { command } from "@/lib/commands";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { fx } from "@/lib/juice";
import { scrollToElement } from "@/lib/scroll";
import { sfx } from "@/lib/sfx";

type CrateRect = { x: number; y: number; w: number; h: number; angle: number; label: string };

/** Screen rects of the heading's letters (Range per character — the DOM isn't touched). */
function letterRects(el: Element): DOMRect[] {
  const out: DOMRect[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  while (walker.nextNode()) {
    const t = walker.currentNode as Text;
    if (t.parentElement?.closest(".sr-only")) continue;
    for (let i = 0; i < t.length; i++) {
      if (!t.data[i].trim()) continue;
      range.setStart(t, i);
      range.setEnd(t, i + 1);
      const r = range.getBoundingClientRect();
      if (r.width) out.push(r);
    }
  }
  return out;
}

/**
 * The Quest Log's soft gate (PART 7). Locked = frosted cards + pixel chains (CSS, html[data-quest-log="locked"]);
 * everything stays in the DOM and readable by screen readers. Scrolling into the cards (or tabbing into them) opens it
 * — it never traps. A gate opened elsewhere (fortress cleared, out of shots, Skip) is revealed once the cards are on
 * screen: the chains shatter into pixels and the cards deal in. Skip / Continue also flies the fortress's remaining
 * crates up into the QUEST LOG heading (GSAP, loaded on demand).
 */
export function QuestGate() {
  useEffect(() => {
    const root = document.documentElement;
    const section = document.getElementById("quests");
    const list = section?.querySelector<HTMLElement>("[data-quest-list]");
    if (!section || !list) return;
    const locked = () => root.getAttribute("data-quest-log") === "locked";
    const onScreen = () => {
      const r = list.getBoundingClientRect();
      return r.top < window.innerHeight * 0.85 && r.bottom > 0;
    };
    let pending = false;
    let showing = false;
    const timers: number[] = [];

    const reveal = () => {
      pending = false;
      if (root.getAttribute("data-quest-log") === "open") return;
      const reduced = prefersReducedMotion();
      if (!reduced) {
        for (const chain of section.querySelectorAll(".quest-gate__chain")) {
          const r = chain.getBoundingClientRect();
          for (let i = 0; i < 5; i++) fx.burst(r.left + (r.width * (i + 0.5)) / 5, r.top + (r.height * (i + 0.5)) / 5, { count: 6, colors: ["#B9B2D9", "#5B5375", "#FFF4E0", "#B6FF3B"] });
        }
        sfx.play("pop", { pitch: 0.8 });
        list.setAttribute("data-deal", "play");
        timers.push(window.setTimeout(() => list.removeAttribute("data-deal"), 1600));
      }
      root.setAttribute("data-quest-log", "open");
    };

    // walking right past the gate opens it (BYTE grumbles; the runtime stores it and emits gate:open)
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || showing) return;
        if (locked() && !pending) command({ type: "gate", id: "quest-log", how: "scrolled" });
        else if (pending) reveal();
      },
      { rootMargin: "0px 0px -35% 0px" },
    );
    io.observe(list);
    const onFocus = () => {
      if (locked() && !pending) command({ type: "gate", id: "quest-log", how: "focus" });
    };
    list.addEventListener("focusin", onFocus);

    const offOpen = bus.on("gate:open", ({ id }) => {
      if (id !== "quest-log" || showing) return;
      if (onScreen()) reveal();
      else pending = true;
    });

    const offAssemble = bus.on("gate:assemble", ({ crates }) => {
      if (showing) return;
      showing = true;
      void assemble(crates).finally(() => {
        showing = false;
        reveal();
      });
    });

    async function assemble(crates: CrateRect[]) {
      const reduced = prefersReducedMotion();
      bus.emit("intro:skip", { id: "quests" }); // the crates own the heading this time
      // Lenis drops onComplete when the visitor takes over the scroll mid-flight: never wait on it forever (R3)
      const toQuests = () =>
        new Promise<void>((resolve) => {
          const safety = window.setTimeout(resolve, 2500);
          scrollToElement(section!, {
            focus: true,
            onComplete: () => {
              window.clearTimeout(safety);
              resolve();
            },
          });
        });
      const gsapMod = reduced || crates.length === 0 ? null : await import("gsap").catch(() => null); // offline: no flourish
      if (!gsapMod) {
        await toQuests();
        return;
      }
      const { gsap } = gsapMod;
      const layer = document.createElement("div");
      layer.className = "crate-fly";
      layer.setAttribute("aria-hidden", "true");
      document.body.append(layer);
      const els = crates.map((c) => {
        const d = document.createElement("div");
        d.className = "crate-fly__crate";
        d.textContent = c.label;
        d.style.width = `${c.w}px`;
        d.style.height = `${c.h}px`;
        d.style.fontSize = `${Math.max(8, c.w * 0.14)}px`;
        layer.append(d);
        gsap.set(d, { x: c.x - c.w / 2, y: c.y - c.h / 2, rotation: (c.angle * 180) / Math.PI });
        return d;
      });
      try {
        sfx.play("whoosh");
        // 1 · up and out of the fortress with a near-full spin (the labels hover upright, slightly tossed) while the
        //     page scrolls down to the Quest Log underneath the fixed layer
        const spin = (i: number) => (i % 2 ? 1 : -1) * 360;
        const lift = gsap.to(els, { y: `-=${Math.round(window.innerHeight * 0.28)}`, rotation: (i: number) => spin(i) * (352 / 360), scale: 0.75, duration: 0.55, ease: "back.in(1.5)", stagger: 0.035 });
        await Promise.all([lift, toQuests()]);
        // 2 · the gate opens the moment the page arrives — reading never waits for the flourish
        reveal();
        // 3 · each crate lands on a letter of QUEST LOG
        const title = section!.querySelector(".world-header__game");
        const letters = title ? letterRects(title) : [];
        if (letters.length) {
          const tl = gsap.timeline();
          els.forEach((d, i) => {
            const L = letters[i % letters.length];
            const w = d.offsetWidth;
            const h = d.offsetHeight;
            tl.to(d, { x: L.left + L.width / 2 - w / 2, y: L.top + L.height / 2 - h / 2, rotation: spin(i), scale: Math.max(0.18, L.height / h), duration: 0.55, ease: "power3.inOut" }, i * 0.05);
          });
          await tl;
          (title as HTMLElement).animate([{ scale: "1" }, { scale: "1.07" }, { scale: "1" }], { duration: 420, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });
          sfx.play("powerUp");
        }
        await gsap.to(els, { opacity: 0, duration: 0.25, stagger: 0.02 });
      } finally {
        layer.remove();
      }
    }

    return () => {
      io.disconnect();
      list.removeEventListener("focusin", onFocus);
      offOpen();
      offAssemble();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  return null;
}
