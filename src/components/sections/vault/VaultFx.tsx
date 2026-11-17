"use client";

import { useEffect } from "react";
import { announce } from "@/lib/announce";
import { command } from "@/lib/commands";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { fx } from "@/lib/juice";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { sfx } from "@/lib/sfx";

const PUFF_MS = 360;
const STATIC_MS = 380;
const TITLE_MS = 1250;
const LOCK_BLOWS = 5;
const DUST = ["#E4E1EC", "#B9B2D9", "#FFF4E0"];
type Flipper = { gsap: typeof import("gsap").gsap; Flip: typeof import("gsap/Flip").Flip };
let flipper: Promise<Flipper> | null = null;
const loadFlip = () =>
  (flipper ??= Promise.all([import("gsap"), import("gsap/Flip")]).then(([g, f]) => {
    g.gsap.registerPlugin(f.Flip);
    return { gsap: g.gsap, Flip: f.Flip };
  }));

/**
 * The Cartridge Vault's play (PART 10), attached to the server-rendered shelf and Funsole:
 *  • filter tabs (Flip reshuffle) · roving focus on the shelf (arrows, Home/End) · Enter / click inserts
 *  • insert: a dust puff the first time ("blow on it"), a GSAP Flip flight into the slot, a clack, static → title card
 *    (sting) → details (focus moves there) · Eject / Esc pops it back onto the shelf · inserting all → collector
 *  • the locked cartridge: blow on it 5× → coin #8 · Fullscreen (Fullscreen API, or an expanded view)
 *  • side quests (openGame) and "Scan this page": axe-core, lazy and bundled, run on the document — reported honestly
 *  • phones: the console is a bottom sheet that slides up on insert
 */
export function VaultFx() {
  useEffect(() => {
    const section = document.getElementById("vault");
    const vault = section?.querySelector<HTMLElement>("[data-vault]");
    const shelf = section?.querySelector<HTMLElement>(".vault-shelf");
    const funsole = section?.querySelector<HTMLElement>("[data-funsole]");
    const slotCart = funsole?.querySelector<HTMLElement>("[data-slot-cart]");
    const ejectBtn = funsole?.querySelector<HTMLButtonElement>("[data-eject]");
    const fullBtn = funsole?.querySelector<HTMLButtonElement>("[data-fullscreen]");
    const crt = funsole?.querySelector<HTMLElement>("[data-crt]");
    const view = crt?.querySelector<HTMLElement>(".crt-view");
    if (!section || !vault || !shelf || !funsole || !slotCart || !ejectBtn || !fullBtn || !crt || !view) return;
    const all = (vault.dataset.carts ?? "").split(",").filter(Boolean);
    const abort = new AbortController();
    const on = { signal: abort.signal };
    const timers = new Set<number>();
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = window.setTimeout(() => {
          timers.delete(t);
          resolve();
        }, ms);
        timers.add(t);
      });
    const reduced = () => prefersReducedMotion();
    const narrow = window.matchMedia("(max-width: 63.99rem)");
    let inserted: string | null = null; // the cartridge in the console (set as it flies in)
    let busy = false; // an insert is playing (dust → flight → static → title card)
    let ticket = 0; // eject bumps it: a playing insert stops at its next step
    let blows = 0;
    let sheetLocked = false;
    const dusted = new Set<string>();
    const tabs = [...section.querySelectorAll<HTMLButtonElement>("[data-filter-tab]")];

    const slotOf = (id: string) => shelf.querySelector<HTMLElement>(`[data-cart-slot="${id}"]`);
    const visibleBtns = () => [...shelf.querySelectorAll<HTMLButtonElement>(".cart__btn")].filter((b) => !b.closest("[data-hidden]"));
    const titleOf = (id: string) => slotOf(id)?.querySelector(".cart__title")?.textContent ?? id;
    const screenOf = (id: string) => funsole.querySelector<HTMLElement>(`[data-screen="${id}"]`);

    // ── the console's screens ────────────────────────────────────────────────────────────────────────────────
    const setPhase = (phase: "idle" | "insert" | "static" | "title" | "details", id: string | null) => {
      funsole.dataset.phase = phase;
      if (id) funsole.dataset.cart = id;
      else delete funsole.dataset.cart;
      funsole.querySelectorAll<HTMLElement>("[data-title-for]").forEach((el) => el.toggleAttribute("data-on", phase === "title" && el.dataset.titleFor === id));
      // the screen is in place (and holds focus) from the moment its cartridge goes in; CSS keeps it dark until "details"
      funsole.querySelectorAll<HTMLElement>("[data-screen]").forEach((el) => el.toggleAttribute("data-on", phase !== "idle" && el.dataset.screen === id));
    };
    setPhase("idle", null);
    funsole.setAttribute("data-live", "");

    const openSheet = (open: boolean) => {
      vault.toggleAttribute("data-sheet", open);
      if (narrow.matches && open && !sheetLocked) {
        lockScroll();
        sheetLocked = true;
      } else if (!open && sheetLocked) {
        unlockScroll();
        sheetLocked = false;
      }
    };

    const fillSlot = (id: string) => {
      const slot = slotOf(id);
      if (!slot) return;
      slotCart.style.setProperty("--from", slot.style.getPropertyValue("--from"));
      slotCart.style.setProperty("--to", slot.style.getPropertyValue("--to"));
      const code = slot.querySelector(".cart__code")?.textContent ?? "";
      slotCart.querySelector("[data-slot-code]")!.textContent = code;
      slotCart.querySelector("[data-slot-title]")!.textContent = titleOf(id);
    };

    /** The CRT's static: a small noise tile, drawn once on the first insert. */
    let noise = false;
    const makeNoise = () => {
      if (noise) return;
      noise = true;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 96;
      const c = canvas.getContext("2d");
      if (!c) return;
      const img = c.createImageData(96, 96);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      c.putImageData(img, 0, 0);
      funsole.style.setProperty("--noise", `url(${canvas.toDataURL()}) 0 0 / 96px 96px`);
    };

    const puff = (cart: HTMLElement) => {
      const r = cart.getBoundingClientRect();
      fx.burst(r.left + r.width / 2, r.top + r.height * 0.2, { count: 14, colors: DUST });
      sfx.play("whoosh");
      cart.animate([{ translate: "0 0" }, { translate: "0 -7px" }, { translate: "0 0" }], { duration: 320, easing: "ease-out" });
    };

    const fly = async (from: HTMLElement, to: HTMLElement, show: () => void) => {
      if (reduced() || narrow.matches) {
        show();
        return;
      }
      const { gsap, Flip } = await loadFlip();
      to.dataset.flipId = from.dataset.flipId;
      const state = Flip.getState(from);
      show();
      Flip.killFlipsOf(to, true); // a flight still under way (eject, then insert in a hurry) lands first
      to.style.transition = "none"; // the shelf cartridge's own transform transition would drag behind the flight
      await Flip.from(state, {
        targets: to,
        duration: 0.62,
        ease: "power3.inOut",
        scale: true,
        absolute: to === slotCart, // the shelf cartridge keeps its cell, so nothing on the shelf shifts
        zIndex: 90,
        onComplete: () => {
          gsap.set(to, { clearProps: "transform,zIndex" }); // hand the transform back to CSS (hover lift, tilt)
          to.style.removeProperty("transition");
        },
      });
    };

    /** Where focus goes when the ejected cartridge isn't on the shelf (the filter hides it): the shelf's stop, or the tab. */
    const shelfStop = () => {
      const list = visibleBtns();
      return list.find((b) => b.tabIndex === 0) ?? list[0] ?? tabs.find((t) => t.getAttribute("aria-pressed") === "true") ?? null;
    };

    const insert = async (id: string) => {
      if (busy) return;
      if (inserted === id) {
        screenOf(id)?.focus();
        return;
      }
      if (inserted) await eject(true); // the old cartridge pops out first, quietly
      const slot = slotOf(id);
      const cart = slot?.querySelector<HTMLElement>(".cart");
      if (busy || !slot || !cart) return;
      busy = true;
      const mine = ++ticket;
      const live = () => mine === ticket;
      try {
        if (!dusted.has(id)) {
          dusted.add(id);
          if (!reduced()) {
            puff(cart);
            await wait(PUFF_MS);
            if (!live()) return;
          }
        }
        inserted = id; // from here on, Eject and Esc pop it back out
        openSheet(true);
        fillSlot(id);
        view.scrollTop = 0;
        setPhase("insert", id);
        await fly(cart, slotCart, () => {
          slot.setAttribute("data-out", "");
          slotCart.setAttribute("data-in", "");
          if (!reduced() && !narrow.matches) slotCart.setAttribute("data-flying", ""); // whole while in the air
          // focus goes with the cartridge: to its screen (in place already, dark until the title card is done)
          screenOf(id)?.focus({ preventScroll: true });
          ejectBtn.disabled = false;
          fullBtn.disabled = false;
        });
        if (!live()) return; // (an eject or a newer insert owns the slot cartridge now)
        slotCart.removeAttribute("data-flying"); // seated: the part below the lip is inside the console
        sfx.play("clink", { pitch: 0.7 });
        funsole.setAttribute("data-power", "");
        if (!reduced()) {
          makeNoise();
          setPhase("static", id);
          await wait(STATIC_MS);
          if (!live()) return;
          setPhase("title", id);
          sfx.play("powerUp");
          await wait(TITLE_MS);
          if (!live()) return;
        }
        setPhase("details", id);
        announce(`${titleOf(id)} inserted. Its details are on the console screen; Eject or Esc pops it out.`);
        command({ type: "cartridge", id, all });
      } finally {
        if (live()) busy = false;
      }
    };

    const eject = async (quiet = false) => {
      const id = inserted;
      if (!id) return;
      inserted = null;
      ticket++; // stops an insert that is still playing…
      busy = false; // …and the shelf answers again at once
      setPhase("idle", null);
      funsole.removeAttribute("data-power");
      if (document.fullscreenElement === crt) void document.exitFullscreen().catch(() => {});
      crt.removeAttribute("data-expanded");
      openSheet(false);
      if (!quiet) {
        sfx.play("pop");
        announce(`${titleOf(id)} ejected.`);
      }
      const slot = slotOf(id);
      const cart = slot?.querySelector<HTMLElement>(".cart");
      const onShelf = !!slot && !slot.hasAttribute("data-hidden");
      const back = () => {
        slotCart.removeAttribute("data-in");
        slotCart.removeAttribute("data-flying");
        slot?.removeAttribute("data-out");
        // focus returns once the cartridge is visible again (a hidden button can't take it), before Eject goes disabled
        if (!quiet) (onShelf ? slot.querySelector<HTMLButtonElement>(".cart__btn") : shelfStop())?.focus({ preventScroll: true });
        ejectBtn.disabled = true;
        fullBtn.disabled = true;
      };
      if (cart && onShelf && !quiet) await fly(slotCart, cart, back);
      else back();
    };

    // ── the shelf: filter, roving focus, insert ─────────────────────────────────────────────────────────────────
    const fixRoving = () => {
      const list = visibleBtns();
      const current = list.find((b) => b.tabIndex === 0) ?? list[0];
      shelf.querySelectorAll<HTMLButtonElement>(".cart__btn").forEach((b) => (b.tabIndex = b === current ? 0 : -1));
    };
    const applyFilter = async (id: string) => {
      vault.dataset.filter = id;
      tabs.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.filterTab === id)));
      const slots = [...shelf.querySelectorAll<HTMLElement>("[data-cart-slot]")];
      const show = (s: HTMLElement) => id === "all" || s.dataset.category === id;
      if (reduced()) {
        slots.forEach((s) => s.toggleAttribute("data-hidden", !show(s)));
      } else {
        const { gsap, Flip } = await loadFlip();
        const state = Flip.getState(slots);
        slots.forEach((s) => s.toggleAttribute("data-hidden", !show(s)));
        Flip.from(state, {
          duration: 0.5,
          ease: "power2.inOut",
          scale: true,
          absolute: true,
          onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.35 }),
          onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.8, duration: 0.25 }),
        });
      }
      fixRoving();
      announce(`${visibleBtns().length} cartridge${visibleBtns().length === 1 ? "" : "s"} on the shelf.`);
    };
    tabs.forEach((t) => t.addEventListener("click", () => void applyFilter(t.dataset.filterTab ?? "all"), on));

    const columns = (list: HTMLElement[]) => {
      const top = list[0]?.getBoundingClientRect().top ?? 0;
      return Math.max(1, list.filter((b) => Math.abs(b.getBoundingClientRect().top - top) < 4).length);
    };
    shelf.addEventListener(
      "keydown",
      (e) => {
        const btn = (e.target as Element).closest<HTMLButtonElement>(".cart__btn");
        if (!btn) return;
        const list = visibleBtns();
        const i = list.indexOf(btn);
        if (i < 0) return;
        const cols = columns(list);
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + cols, ArrowUp: i - cols, Home: 0, End: list.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        const j = Math.min(list.length - 1, Math.max(0, next));
        list.forEach((b, k) => (b.tabIndex = k === j ? 0 : -1));
        list[j].focus({ preventScroll: true });
        list[j].closest("li")?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduced() ? "auto" : "smooth" });
      },
      on,
    );
    shelf.addEventListener(
      "click",
      (e) => {
        const btn = (e.target as Element).closest<HTMLButtonElement>(".cart__btn");
        if (!btn) return;
        visibleBtns().forEach((b) => (b.tabIndex = b === btn ? 0 : -1));
        if (btn.hasAttribute("data-cart-locked")) {
          const cart = btn.closest<HTMLElement>(".cart");
          if (cart && !reduced()) puff(cart);
          else sfx.play("whoosh");
          btn.closest(".cart")?.querySelector(".cart__lock")?.animate([{ rotate: "0deg" }, { rotate: "-12deg" }, { rotate: "10deg" }, { rotate: "0deg" }], { duration: 320 });
          blows++;
          if (blows === LOCK_BLOWS) {
            const r = btn.getBoundingClientRect();
            command({ type: "coin", id: "locked-cartridge", origin: { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } });
            btn.closest(".cart-slot")?.setAttribute("data-dusted", "");
          }
          return;
        }
        const id = btn.dataset.cartBtn;
        if (id) void insert(id);
      },
      on,
    );

    // ── the console: eject, Esc, fullscreen, side quests, the scan ──────────────────────────────────────────────
    ejectBtn.addEventListener("click", () => void eject(), on);
    section.addEventListener(
      "keydown",
      (e) => {
        // a keyboard-opened tooltip takes the first Esc (it prevents it); the browser's own fullscreen exit comes first too
        if (e.key !== "Escape" || e.defaultPrevented || document.fullscreenElement) return;
        if (crt.hasAttribute("data-expanded")) {
          e.preventDefault();
          void exitFull();
        } else if (inserted) {
          e.preventDefault(); // before the pause menu (the global manager skips handled keys)
          void eject();
        } else if (busy) {
          e.preventDefault(); // still blowing the dust off: never mind, it stays on the shelf
          ticket++;
          busy = false;
        }
      },
      on,
    );
    // Fullscreen: the Fullscreen API, or an expanded view where elements can't go fullscreen (iPhone Safari). Focus moves
    // onto the screen (the button stays outside); the expanded view closes with its button, Esc, or when focus leaves it
    // (so nothing under it can take focus unseen, WCAG 2.4.11).
    const enterFull = async () => {
      const screen = inserted ? screenOf(inserted) : null;
      try {
        if (typeof crt.requestFullscreen !== "function") throw new Error("no element fullscreen");
        await crt.requestFullscreen();
      } catch {
        crt.setAttribute("data-expanded", "");
      }
      screen?.focus({ preventScroll: true });
    };
    const exitFull = async () => {
      // focus moves back only once the browser has left fullscreen (the button is outside the fullscreen element)
      if (document.fullscreenElement === crt) await document.exitFullscreen().catch(() => {});
      crt.removeAttribute("data-expanded");
      fullBtn.focus({ preventScroll: true });
    };
    fullBtn.addEventListener("click", () => void enterFull(), on);
    crt.querySelector("[data-exit-full]")?.addEventListener("click", () => void exitFull(), on);
    crt.addEventListener(
      "focusout",
      (e) => {
        const to = e.relatedTarget;
        if (crt.hasAttribute("data-expanded") && to instanceof Node && !crt.contains(to)) crt.removeAttribute("data-expanded");
      },
      on,
    );
    let scanning = false;
    funsole.addEventListener(
      "click",
      (e) => {
        const target = e.target as Element;
        const quest = target.closest<HTMLElement>("[data-open-game]");
        if (quest) {
          quest.focus({ preventScroll: true }); // (Safari) so the game's dialog returns focus to the side quest
          const r = quest.getBoundingClientRect();
          command({ type: "openGame", id: quest.dataset.openGame ?? "", origin: { x: Math.round(r.left + r.width / 2), y: Math.round(r.top) } });
          return;
        }
        const scanBtn = target.closest<HTMLButtonElement>("[data-scan]");
        if (scanBtn && !scanning) void scan(scanBtn);
      },
      on,
    );

    /** Scrolls the CRT's own view (never the page) until the element is on the screen. */
    const reveal = (el: HTMLElement) => {
      const v = view.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      if (r.top >= v.top && r.bottom <= v.bottom) return;
      view.scrollTo({ top: view.scrollTop + r.top - v.top - 12, behavior: reduced() ? "auto" : "smooth" });
    };

    const scan = async (btn: HTMLButtonElement) => {
      scanning = true;
      btn.setAttribute("aria-disabled", "true"); // not `disabled`: that would drop the keyboard focus on the page body
      const out = btn.closest(".crt-scan")?.querySelector<HTMLElement>("[data-scan-results]");
      if (out) out.textContent = "Scanning the page…";
      announce("Scanning this page with axe-core…");
      const laser = document.createElement("div");
      laser.className = "scan-laser";
      laser.setAttribute("aria-hidden", "true");
      document.body.append(laser);
      const sweep = reduced() ? null : laser.animate([{ translate: "0 -10px" }, { translate: "0 100vh" }], { duration: 1500, iterations: Infinity, easing: "linear" });
      sfx.play("countdown");
      const started = performance.now();
      try {
        const axe = (await import("axe-core")).default;
        const res = await axe.run({ exclude: [[".scan-laser"]] }, { resultTypes: ["violations"] });
        const left = 1500 - (performance.now() - started);
        if (left > 0 && sweep) await wait(left);
        if (out) {
          renderResults(out, res.violations, res.passes.length);
          reveal(out);
        }
        const by = count(res.violations);
        announce(`Scan complete: ${res.violations.length} issue type${res.violations.length === 1 ? "" : "s"} — ${by.critical} critical, ${by.serious} serious, ${by.moderate} moderate, ${by.minor} minor.`);
        sfx.play(res.violations.length ? "error" : "win");
      } catch {
        if (out) out.textContent = "The scanner didn't load. Oops — that's a glitch. Try again?";
      } finally {
        sweep?.cancel();
        laser.remove();
        btn.removeAttribute("aria-disabled");
        scanning = false;
      }
    };

    const onResize = () => {
      if (!narrow.matches && sheetLocked) {
        unlockScroll();
        sheetLocked = false;
      }
    };
    narrow.addEventListener("change", onResize, on);

    return () => {
      abort.abort();
      timers.forEach((t) => window.clearTimeout(t));
      if (sheetLocked) unlockScroll();
      funsole.removeAttribute("data-live");
    };
  }, []);
  return null;
}

type Violation = { id: string; impact?: string | null; help: string; nodes: { target: unknown[] }[] };
const IMPACTS = ["critical", "serious", "moderate", "minor"] as const;
function count(vs: Violation[]) {
  const by = { critical: 0, serious: 0, moderate: 0, minor: 0 } as Record<(typeof IMPACTS)[number], number>;
  for (const v of vs) if (v.impact && v.impact in by) by[v.impact as (typeof IMPACTS)[number]]++;
  return by;
}

/** The results card, built with DOM APIs (no HTML from the scan is ever injected). */
function renderResults(out: HTMLElement, vs: Violation[], passes: number) {
  const by = count(vs);
  const card = document.createElement("div");
  card.className = "scan-card";
  const head = document.createElement("p");
  head.className = "scan-card__head";
  head.textContent = `Scan complete · ${passes} rule${passes === 1 ? "" : "s"} passed · ${vs.length} issue type${vs.length === 1 ? "" : "s"} found`;
  card.append(head);
  const counts = document.createElement("ul");
  counts.className = "scan-card__counts";
  for (const k of IMPACTS) {
    const li = document.createElement("li");
    li.dataset.impact = k;
    li.textContent = `${by[k]} ${k}`;
    counts.append(li);
  }
  card.append(counts);
  if (vs.length) {
    const list = document.createElement("ul");
    list.className = "scan-card__list";
    for (const v of [...vs].sort((a, b) => IMPACTS.indexOf((a.impact ?? "minor") as (typeof IMPACTS)[number]) - IMPACTS.indexOf((b.impact ?? "minor") as (typeof IMPACTS)[number]))) {
      const li = document.createElement("li");
      li.dataset.impact = v.impact ?? "minor";
      li.textContent = `${v.impact ?? "minor"} · ${v.help} (${v.nodes.length} element${v.nodes.length === 1 ? "" : "s"}) — rule ${v.id}`;
      list.append(li);
    }
    card.append(list);
  } else {
    const ok = document.createElement("p");
    ok.className = "scan-card__ok";
    ok.textContent = "No issues found by the automated rules. (Automated checks catch only part of what matters — this site is also tested with keyboard-only flows and automated checks in three browser engines.)";
    card.append(ok);
  }
  out.replaceChildren(card);
}
