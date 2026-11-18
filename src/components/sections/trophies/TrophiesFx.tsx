"use client";

import { useEffect } from "react";
import { XP_RULES } from "@/content/levels";
import { announce } from "@/lib/announce";
import { byte } from "@/lib/byte";
import { command } from "@/lib/commands";
import { hall } from "@/lib/hall";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { fx } from "@/lib/juice";
import { sfx } from "@/lib/sfx";

type Flipper = { gsap: typeof import("gsap").gsap; Flip: typeof import("gsap/Flip").Flip };
let flipper: Promise<Flipper> | null = null;
const loadFlip = () =>
  (flipper ??= Promise.all([import("gsap"), import("gsap/Flip")]).then(([g, f]) => {
    g.gsap.registerPlugin(f.Flip);
    return { gsap: g.gsap, Flip: f.Flip };
  }));

const TURN = Math.PI * 2;
const COIN_ODDS = 0.2; // one capsule in five…
const COIN_BY = 5; // …and never more than five turns without it
type Prize = { kind: "honor" | "cert"; id: string } | { kind: "coin" };
type QaCapsule = { next?: string; log?: string[] };

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string) => {
  const node = document.createElement(tag);
  node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

/**
 * The Trophy Room's island (PART 14), on server-rendered DOM:
 *  • Hall of Fame: pedestal triggers become buttons with one tab stop (←/→, Home/End); hover / focus tells the 3D hall
 *    (faster spin, brighter spotlight); click / Enter opens the honor's card (the camera dollies there, or the
 *    medallion flips), confetti and +10 XP the first time; Esc or "Back to the hall" closes it.
 *  • Certificate cards: the holo foil follows the pointer; click / Enter flips and enlarges a card (GSAP Flip); Esc,
 *    the backdrop, "Flip back" or focus leaving it puts it back.
 *  • Capsule machine: drag the crank a full turn or press TURN → jostle, a capsule rolls out, bounces, pops open on an
 *    honor or a certificate (rarity flash); one in five holds coin #11 (once, never more than five turns away); the
 *    first turn → Lucky Capsule.
 */
export function TrophiesFx() {
  useEffect(() => {
    const section = document.getElementById("trophies");
    if (!section) return;
    const html = document.documentElement;
    const abort = new AbortController();
    const on = { signal: abort.signal };
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
      return t;
    };
    const wait = (ms: number) => new Promise<void>((r) => later(r, ms));
    const reduced = () => prefersReducedMotion();
    const playMode = () => html.getAttribute("data-mode") !== "speedrun";
    const center = (node: Element) => {
      const r = node.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    };

    // ── Hall of Fame ──────────────────────────────────────────────────────────────────────────────────────────────
    const hallRoot = section.querySelector<HTMLElement>("[data-hall]");
    const slots = [...section.querySelectorAll<HTMLElement>(".hall__slot")];
    const triggers = slots.map((s) => s.querySelector<HTMLElement>("[data-hall-btn]")).filter((t): t is HTMLElement => !!t);
    triggers.forEach((t, i) => {
      t.setAttribute("role", "button");
      t.tabIndex = i === 0 ? 0 : -1;
      t.setAttribute("aria-expanded", "false");
      t.setAttribute("aria-controls", `honor-${t.dataset.hallBtn}`);
    });
    const opened = new Set<string>();
    // the 3D hall reads `hall`; the DOM mirrors the hovered pedestal for CSS (and tests)
    const offHover = hall.subscribe(() => {
      const h = hall.get().hovered;
      if (!hallRoot) return;
      if (h) hallRoot.dataset.hovered = h;
      else delete hallRoot.dataset.hovered;
    });
    const setStop = (t: HTMLElement) => triggers.forEach((x) => (x.tabIndex = x === t ? 0 : -1));
    const triggerOf = (id: string) => triggers.find((t) => t.dataset.hallBtn === id) ?? null;
    let selected: string | null = null;
    const select = (id: string | null) => {
      if (id === selected) return;
      selected = id;
      hall.set({ selected: id });
      for (const s of slots) {
        const mine = s.dataset.honor === id;
        s.toggleAttribute("data-selected", mine);
        s.querySelector(".honor-card")?.toggleAttribute("data-open", mine);
        s.querySelector("[data-hall-btn]")?.setAttribute("aria-expanded", String(mine));
      }
      hallRoot?.toggleAttribute("data-detail", !!id);
      // the card covers the side away from its trophy (the 3D camera always puts it on the left)
      if (hallRoot && id) {
        const i = slots.findIndex((s) => s.dataset.honor === id);
        hallRoot.dataset.side = hall.get().live || i < slots.length / 2 ? "right" : "left";
      }
      if (!id) {
        sfx.play("close");
        return;
      }
      sfx.play("open");
      const t = triggerOf(id);
      if (!opened.has(id)) {
        opened.add(id);
        if (playMode()) fx.confetti();
        if (t) command({ type: "xp", amount: XP_RULES.openDetails, reason: `open:honor-${id}`, origin: center(t) });
      }
      byte.recheck(); // the card's button appeared without a scroll
    };
    hallRoot?.addEventListener(
      "pointerover",
      (e) => {
        const s = (e.target as Element).closest<HTMLElement>(".hall__slot");
        hall.set({ hovered: s?.dataset.honor ?? null });
      },
      on,
    );
    hallRoot?.addEventListener("pointerleave", () => hall.set({ hovered: null }), on);
    hallRoot?.addEventListener(
      "focusin",
      (e) => {
        const t = (e.target as Element).closest<HTMLElement>("[data-hall-btn]");
        if (!t) return;
        setStop(t);
        hall.set({ hovered: t.dataset.hallBtn ?? null });
      },
      on,
    );
    hallRoot?.addEventListener(
      "focusout",
      (e) => {
        if (!hallRoot.contains(e.relatedTarget as Node | null)) hall.set({ hovered: null });
      },
      on,
    );
    hallRoot?.addEventListener(
      "click",
      (e) => {
        const target = e.target as Element;
        if (target.closest("[data-hall-close]")) {
          const id = selected;
          select(null);
          if (id) triggerOf(id)?.focus();
          return;
        }
        const t = target.closest<HTMLElement>("[data-hall-btn]");
        if (!t) return;
        if (document.activeElement !== t) t.focus({ preventScroll: true });
        select(selected === t.dataset.hallBtn ? null : (t.dataset.hallBtn ?? null));
      },
      on,
    );
    hallRoot?.addEventListener(
      "keydown",
      (e) => {
        const target = e.target as Element;
        if (e.key === "Escape") {
          if (!selected) return;
          e.preventDefault(); // before the pause menu
          const id = selected;
          select(null);
          triggerOf(id)?.focus();
          return;
        }
        const t = target.closest<HTMLElement>("[data-hall-btn]");
        if (!t) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select(selected === t.dataset.hallBtn ? null : (t.dataset.hallBtn ?? null));
          return;
        }
        const i = triggers.indexOf(t);
        const j = ({ ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: triggers.length - 1 } as Record<string, number>)[e.key];
        if (j === undefined) return;
        e.preventDefault();
        const next = triggers[Math.min(triggers.length - 1, Math.max(0, j))];
        setStop(next);
        next.focus();
        if (selected) select(next.dataset.hallBtn ?? null); // a card open: it follows along the pedestals
      },
      on,
    );
    document.addEventListener(
      "pointerdown",
      (e) => {
        if (selected && hallRoot && !(e.target instanceof Node && hallRoot.contains(e.target))) select(null);
      },
      on,
    );

    // ── certificate cards ─────────────────────────────────────────────────────────────────────────────────────────
    const backdrop = section.querySelector<HTMLElement>("[data-tcard-backdrop]");
    const cards = [...section.querySelectorAll<HTMLElement>("[data-tcard]")];
    for (const c of cards) {
      const b = c.querySelector<HTMLElement>("[data-tcard-btn]");
      if (!b) continue;
      b.setAttribute("role", "button");
      b.tabIndex = 0;
      b.setAttribute("aria-expanded", "false");
      b.setAttribute("aria-controls", `cert-${c.dataset.tcard}-back`);
    }
    let enlarged: HTMLElement | null = null;
    let cardBusy = false;
    const front = (c: HTMLElement) => c.querySelector<HTMLElement>("[data-tcard-btn]");
    const closeCard = async (c: HTMLElement, refocus = true) => {
      if (enlarged !== c) return;
      cardBusy = true;
      enlarged = null;
      front(c)?.setAttribute("aria-expanded", "false");
      c.removeAttribute("data-flipped");
      if (reduced()) c.removeAttribute("data-enlarged");
      else {
        await wait(380);
        const { gsap, Flip } = await loadFlip();
        const state = Flip.getState(c);
        c.removeAttribute("data-enlarged");
        await Flip.from(state, { duration: 0.45, ease: "power3.inOut", zIndex: 95, onComplete: () => void gsap.set(c, { clearProps: "transform,zIndex" }) });
      }
      if (backdrop && !enlarged) backdrop.hidden = true;
      cardBusy = false;
      if (refocus) front(c)?.focus({ preventScroll: true });
    };
    const openCard = async (c: HTMLElement) => {
      if (cardBusy || enlarged === c) return;
      if (enlarged) await closeCard(enlarged, false);
      cardBusy = true;
      enlarged = c;
      sfx.play("whoosh");
      front(c)?.setAttribute("aria-expanded", "true");
      if (backdrop) backdrop.hidden = false;
      if (reduced()) {
        c.setAttribute("data-enlarged", "");
        c.setAttribute("data-flipped", "");
      } else {
        const { gsap, Flip } = await loadFlip();
        const state = Flip.getState(c);
        c.setAttribute("data-enlarged", "");
        // the flight uses an inline transform; hand the transform back to CSS (the flip's perspective) when it lands
        await Flip.from(state, { duration: 0.5, ease: "power3.inOut", zIndex: 95, onComplete: () => void gsap.set(c, { clearProps: "transform,zIndex" }) });
        c.setAttribute("data-flipped", "");
        await wait(420);
      }
      cardBusy = false;
      c.querySelector<HTMLElement>(".tcard__back a, .tcard__back button")?.focus({ preventScroll: true });
    };
    section.addEventListener(
      "pointermove",
      (e) => {
        const c = (e.target as Element).closest<HTMLElement>("[data-tcard]");
        if (!c || reduced()) return;
        const r = c.getBoundingClientRect();
        c.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        c.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      },
      { passive: true, signal: abort.signal },
    );
    section.addEventListener(
      "click",
      (e) => {
        const target = e.target as Element;
        const c = target.closest<HTMLElement>("[data-tcard]");
        if (target.closest("[data-tcard-close]") && c) {
          void closeCard(c);
          return;
        }
        if (target.closest("[data-tcard-btn]") && c) void openCard(c);
      },
      on,
    );
    section.addEventListener(
      "keydown",
      (e) => {
        const target = e.target as Element;
        if (e.key === "Escape" && enlarged) {
          e.preventDefault();
          void closeCard(enlarged);
          return;
        }
        if ((e.key === "Enter" || e.key === " ") && target.matches("[data-tcard-btn]")) {
          e.preventDefault();
          const c = target.closest<HTMLElement>("[data-tcard]");
          if (c) void openCard(c);
        }
      },
      on,
    );
    backdrop?.addEventListener("click", () => enlarged && void closeCard(enlarged), on);
    // focus leaving the enlarged card puts it back (nothing under it may take focus unseen, WCAG 2.4.11)
    section.addEventListener(
      "focusout",
      (e) => {
        const c = enlarged;
        if (!c || cardBusy || c.contains(e.relatedTarget as Node | null)) return;
        if (!(e.target instanceof Node && c.contains(e.target))) return;
        void closeCard(c, false);
      },
      on,
    );

    // ── capsule machine ───────────────────────────────────────────────────────────────────────────────────────────
    const machine = section.querySelector<HTMLElement>("[data-capsule-machine]");
    const crank = machine?.querySelector<HTMLElement>("[data-crank]") ?? null;
    const turnBtn = section.querySelector<HTMLButtonElement>("[data-capsule-turn]");
    const out = machine?.querySelector<HTMLElement>("[data-capsule-out]") ?? null;
    const prizeBox = section.querySelector<HTMLElement>("[data-capsule-prize]");
    const caps = machine ? [...machine.querySelectorAll<HTMLElement>(".cap")] : [];
    const pool: { kind: "honor" | "cert"; id: string }[] = [
      ...slots.map((s) => ({ kind: "honor" as const, id: s.dataset.honor ?? "" })),
      ...cards.map((c) => ({ kind: "cert" as const, id: c.dataset.tcard ?? "" })),
    ].filter((p) => p.id);
    const qa = (window as unknown as { __QA_CAPSULE?: QaCapsule }).__QA_CAPSULE;
    let busy = false;
    let turns = 0;
    let sinceCoin = 0;
    let coinGiven = false;
    let last = "";
    let angle = 0;
    const coinLeft = () => !coinGiven && !machine?.hasAttribute("data-collected");
    const choose = (): Prize => {
      const forced = qa?.next;
      if (qa) qa.next = undefined;
      if (forced === "coin" && coinLeft()) return { kind: "coin" };
      const pick = forced ? pool.find((p) => p.id === forced) : undefined;
      if (pick) return pick;
      if (coinLeft() && (Math.random() < COIN_ODDS || sinceCoin >= COIN_BY - 1)) return { kind: "coin" };
      const choices = pool.length > 1 ? pool.filter((p) => p.id !== last) : pool;
      return choices[Math.floor(Math.random() * choices.length)] ?? { kind: "coin" };
    };
    const colorOf = () => caps[Math.floor(Math.random() * caps.length)]?.style.getPropertyValue("--c") || "#FF8A1F";
    const renderPrize = (p: Prize) => {
      if (!prizeBox) return "";
      const card = prizeBox.querySelector<HTMLElement>("[data-capsule-card]");
      const rarity = prizeBox.querySelector<HTMLElement>("[data-capsule-rarity]");
      const parts: Node[] = [];
      let said = "";
      if (p.kind === "coin") {
        prizeBox.dataset.rarity = "legendary";
        if (rarity) rarity.textContent = "Legendary · Hidden coin";
        parts.push(el("p", "capsule-prize__title", "A hidden coin!"), el("p", "capsule-prize__meta", "Coin #11 is yours — it's in your wallet."));
        said = "A hidden coin! Coin 11 is yours.";
      } else if (p.kind === "honor") {
        const src = section.querySelector<HTMLElement>(`[data-honor-card="${p.id}"]`);
        const title = src?.querySelector(".honor-card__title")?.textContent ?? "";
        const meta = src?.querySelector(".honor-card__meta")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
        const detail = src?.querySelector(".honor-card__detail")?.textContent ?? "";
        prizeBox.dataset.rarity = "epic";
        if (rarity) rarity.textContent = "Epic · Honor";
        parts.push(el("p", "capsule-prize__title", title), el("p", "capsule-prize__meta", meta));
        if (detail) parts.push(el("p", "capsule-prize__detail", detail));
        said = `${title} — ${meta}.`;
      } else {
        const src = section.querySelector<HTMLElement>(`[data-tcard="${p.id}"]`);
        const name = src?.querySelector(".tcard__name")?.textContent ?? "";
        const issuer = src?.querySelector(".tcard__issuer")?.textContent ?? "";
        const date = src?.querySelector(".tcard__date")?.textContent ?? "";
        prizeBox.dataset.rarity = "rare";
        if (rarity) rarity.textContent = "Rare · Certificate";
        parts.push(el("p", "capsule-prize__title", name), el("p", "capsule-prize__meta", `${issuer} · ${date}`));
        said = `${name} — ${issuer}, ${date}.`;
      }
      card?.replaceChildren(...parts);
      prizeBox.hidden = false;
      return said;
    };
    /** A turn starts the moment the crank is pressed or wound: the machine is busy (later presses are ignored) and
     *  the last prize goes back in the box; `dispense` follows once the crank has come round. */
    const startTurn = () => {
      if (busy || !machine || !out) return false;
      busy = true;
      turnBtn?.setAttribute("aria-disabled", "true");
      machine.setAttribute("data-turning", "");
      prizeBox?.setAttribute("hidden", "");
      return true;
    };
    const dispense = async () => {
      if (!machine || !out) return;
      turns++;
      if (turns === 1) command({ type: "achievement", id: "lucky-capsule" });
      const prize = choose();
      sinceCoin = prize.kind === "coin" ? 0 : sinceCoin + 1;
      if (prize.kind !== "coin") last = prize.id;
      qa?.log?.push(prize.kind === "coin" ? "coin" : prize.id);
      out.style.setProperty("--c", colorOf());
      out.removeAttribute("data-open");
      if (!reduced()) {
        // jostle, then a capsule drops down the chute and bounces in the tray
        for (const c of caps) {
          const dx = (Math.random() - 0.5) * 14;
          const dy = -Math.random() * 16;
          c.animate([{ translate: "0 0" }, { translate: `${dx.toFixed(1)}px ${dy.toFixed(1)}px` }, { translate: `${(-dx / 2).toFixed(1)}px 0` }, { translate: "0 0" }], { duration: 520, easing: "ease-in-out" });
        }
        sfx.play("squish", { pitch: 1.3 });
        await wait(380);
        out.setAttribute("data-out", "");
        sfx.play("whoosh");
        await out.animate(
          [
            { translate: "-38% -150%", opacity: 0 },
            { translate: "-20% -40%", opacity: 1, offset: 0.45 },
            { translate: "0 0", offset: 0.68 },
            { translate: "0 -22%", offset: 0.82 },
            { translate: "0 0" },
          ],
          { duration: 820, easing: "ease-in" },
        ).finished.catch(() => {});
        sfx.play("thud", { pitch: 1.6 });
        await wait(160);
      } else out.setAttribute("data-out", "");
      out.setAttribute("data-open", "");
      sfx.play("pop");
      const said = renderPrize(prize);
      if (prizeBox && !reduced()) prizeBox.animate([{ opacity: 0, scale: "0.7" }, { opacity: 1, scale: "1.04", offset: 0.7 }, { opacity: 1, scale: "1" }], { duration: 420, easing: "cubic-bezier(.3,1.6,.5,1)" });
      if (prize.kind === "coin") {
        coinGiven = true;
        command({ type: "coin", id: "capsule-machine", origin: center(out) });
      } else if (prize.kind === "honor") sfx.play("fanfare");
      else sfx.play("powerUp");
      announce(`Capsule opened: ${said}`);
      byte.recheck();
      machine.removeAttribute("data-turning");
      turnBtn?.removeAttribute("aria-disabled");
      busy = false;
    };
    turnBtn?.addEventListener(
      "click",
      () => {
        if (!crank || !startTurn()) return;
        if (reduced()) {
          void dispense();
          return;
        }
        const from = angle;
        angle += TURN;
        for (let k = 1; k <= 8; k++) later(() => sfx.play("click", { pitch: 0.8 + k * 0.08 }), k * 80);
        crank.animate([{ rotate: `${from}rad` }, { rotate: `${angle}rad` }], { duration: 700, easing: "ease-in-out" });
        crank.style.rotate = `${angle}rad`;
        later(() => void dispense(), 620);
      },
      on,
    );
    // the crank: drag it around its hub (either way); a full turn dispenses — the TURN button is the keyboard path
    let drag: { id: number; prev: number; acc: number; ticks: number } | null = null;
    const angleAt = (e: PointerEvent, c: HTMLElement) => {
      const r = c.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    };
    crank?.addEventListener(
      "pointerdown",
      (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        crank.setPointerCapture(e.pointerId);
        drag = { id: e.pointerId, prev: angleAt(e, crank), acc: 0, ticks: 0 };
        crank.setAttribute("data-grabbed", "");
      },
      on,
    );
    crank?.addEventListener(
      "pointermove",
      (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const a = angleAt(e, crank);
        let d = a - drag.prev;
        if (d > Math.PI) d -= TURN;
        if (d < -Math.PI) d += TURN;
        drag.prev = a;
        drag.acc += d;
        angle += d;
        crank.style.rotate = `${angle}rad`;
        const ticks = Math.floor(Math.abs(drag.acc) / (Math.PI / 4));
        if (ticks > drag.ticks) {
          drag.ticks = ticks;
          sfx.play("click", { pitch: 0.8 + ticks * 0.08 });
        }
        if (Math.abs(drag.acc) >= TURN * 0.92) {
          drag.acc = 0;
          drag.ticks = 0;
          if (startTurn()) void dispense();
        }
      },
      on,
    );
    const release = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      crank?.removeAttribute("data-grabbed");
    };
    crank?.addEventListener("pointerup", release, on);
    crank?.addEventListener("pointercancel", release, on);

    return () => {
      abort.abort();
      offHover();
      timers.forEach((t) => window.clearTimeout(t));
      hall.set({ hovered: null, selected: null });
    };
  }, []);
  return null;
}
