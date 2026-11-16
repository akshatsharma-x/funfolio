// AKSHAT-OS boot (PART 5) — the controller. Imperative (like BYTE's brain): React renders the screen once, this runs
// the timeline. A real preloader: the bar follows the hero 3D island's loading (src/lib/heroLoad.ts) when it loads
// during the boot. Every step is skippable (any key after 400ms, Esc, "Skip ▶▶", 8s idle → continue muted).

import type { BootLine } from "@/content/boot";
import { levelProgress } from "@/content/levels";
import { setSpeedrun } from "@/components/hud/useGameRuntime";
import { bus } from "@/lib/bus";
import { heroLoad } from "@/lib/heroLoad";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { sfx } from "@/lib/sfx";
import { useSave } from "@/lib/store";

export type BootMode = "full" | "fast";

const TYPE_MS = 12; // ~15ms/char in the brief; a touch faster keeps INSERT COIN well inside 3.5s
const LINE_BEAT = 55;
const SEGMENTS = 12;
const IDLE_MS = 8000;
const SKIP_AFTER = 400;
const COIN_BY = 3000; // INSERT COIN by ~3s after the boot starts, even if the island is still loading
const LATE_MOUNT = 4500; // the page has been readable too long — don't interrupt it with a boot
const RAINBOW = ["#FF3D8B", "#FF8A1F", "#FFD23F", "#B6FF3B", "#22D3EE", "#A78BFA", "#2EE59D"];

export type BootController = {
  insertCoin: () => void;
  start: (withSound: boolean) => void;
  skip: () => void;
  speedrun: () => void;
  continueYes: () => void;
  newGame: () => void;
  erase: () => void;
  back: () => void;
  destroy: () => void;
};

export function startBoot(root: HTMLDialogElement, lines: BootLine[], initialMode: BootMode, coinTotal: number): BootController {
  const html = document.documentElement;
  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel);
  const $$ = <T extends Element>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
  const reduced = prefersReducedMotion();
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };
  const offs: (() => void)[] = [];
  let mode = initialMode;
  let phase = "power";
  let exiting = false;
  let coinIn = false;
  let started = performance.now();
  let lastInput = performance.now();
  let logDone = 0;

  const noop: BootController = {
    insertCoin() {},
    start() {},
    skip() {},
    speedrun() {},
    continueYes() {},
    newGame() {},
    erase() {},
    back() {},
    destroy() {},
  };
  // Late (slow network): the visitor is already reading — never throw a boot screen over the page now.
  if (performance.now() > LATE_MOUNT) {
    html.removeAttribute("data-boot");
    bus.emit("boot:done", { skipped: false });
    return noop;
  }

  const setPhase = (p: string) => {
    phase = p;
    root.dataset.phase = p;
  };

  // ── progress bar: the log, plus the hero island when it loads during the boot ─────────────────────────────────
  const bar = $<HTMLElement>("[data-boot-bar]");
  const segs = $$<HTMLElement>("[data-seg]");
  const renderBar = () => {
    const logFrac = mode === "fast" ? Math.min(1, (performance.now() - started) / 700) : logDone / lines.length;
    const hero = heroLoad.get();
    const p = hero.wanted ? 0.35 * logFrac + 0.65 * hero.progress : logFrac;
    const lit = Math.round(p * SEGMENTS);
    segs.forEach((s, i) => s.toggleAttribute("data-on", i < lit));
    bar?.setAttribute("aria-valuenow", String(Math.round(p * 100)));
  };
  offs.push(heroLoad.subscribe(renderBar));

  const heroReady = () => {
    const h = heroLoad.get();
    return !h.wanted || h.done;
  };

  // ── the log: time-based, so a busy main thread (3D shaders compiling) can't stretch the boot — it catches up ──
  const runLog = () => {
    setPhase("log");
    logDone = 0;
    const items = $$<HTMLElement>("[data-line]").map((li) => {
      li.removeAttribute("data-on");
      li.removeAttribute("data-ok");
      const text = li.querySelector<HTMLElement>("[data-text]");
      if (text) text.textContent = "";
      return { li, text, full: text?.dataset.full ?? "" };
    });
    let t = 0;
    const plan = items.map((it) => {
      const start = t;
      const typed = start + it.full.length * TYPE_MS;
      t = typed + LINE_BEAT;
      return { start, typed, ok: t };
    });
    const total = t;
    const t0 = performance.now();
    const tick = () => {
      if (exiting) return;
      const now = reduced ? total : performance.now() - t0;
      let done = 0;
      plan.forEach((p, i) => {
        const it = items[i];
        if (now < p.start) return;
        it.li.setAttribute("data-on", "");
        const n = Math.min(it.full.length, Math.floor((now - p.start) / TYPE_MS));
        if (it.text && it.text.textContent?.length !== n) it.text.textContent = it.full.slice(0, n);
        if (now >= p.ok) {
          it.li.setAttribute("data-ok", "");
          done++;
        }
      });
      if (done !== logDone) {
        logDone = done;
        renderBar();
      }
      if (now < total) {
        later(tick, 16);
        return;
      }
      // the island is what we are preloading — wait for it, but never past COIN_BY
      const until = started + COIN_BY;
      const wait = () => {
        if (exiting) return;
        if (heroReady() || performance.now() >= until) toCoin();
        else later(wait, 50);
      };
      wait();
    };
    tick();
  };

  // ── INSERT COIN ───────────────────────────────────────────────────────────────────────────────────────────────
  const coinBtn = $<HTMLButtonElement>("[data-boot-coin]");
  const coinWrap = $<HTMLElement>("[data-boot-coin-wrap]");
  const slot = $<HTMLElement>("[data-boot-slot]");
  const toCoin = () => {
    logDone = lines.length;
    renderBar();
    setPhase("coin");
    lastInput = performance.now();
    later(() => coinBtn?.focus({ preventScroll: true }), 60);
  };
  const insertCoin = () => {
    if (coinIn || exiting || phase !== "coin") return;
    coinIn = true;
    lastInput = performance.now();
    root.dataset.coin = "in";
    sfx.play("clink");
    later(() => {
      root.setAttribute("data-credit", "");
      const r = slot?.getBoundingClientRect();
      useSave.getState().collectCoin("boot", r ? { x: r.left + r.width / 2, y: r.top } : undefined);
    }, reduced ? 0 : 380);
    later(() => $<HTMLElement>('[data-boot-start="sound"]')?.focus({ preventScroll: true }), reduced ? 30 : 560);
  };

  // drag the coin into the slot (a click without moving also inserts it)
  let drag: { id: number; x: number; y: number; moved: boolean } | null = null;
  let suppressClick = false; // the click that ends a drag must not insert twice
  if (coinBtn && coinWrap) {
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || coinIn) return;
      coinBtn.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
      lastInput = performance.now();
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 6) {
        drag.moved = true;
        root.dataset.coin = "drag";
      }
      if (drag.moved) coinWrap.style.translate = `${dx}px ${dy}px`;
      lastInput = performance.now();
    };
    const onUp = (e: PointerEvent) => {
      const d = drag;
      drag = null;
      if (!d || e.pointerId !== d.id) return;
      if (!d.moved) return; // a plain click — the click handler inserts it
      const c = coinWrap.getBoundingClientRect();
      const s = slot?.getBoundingClientRect();
      const cx = c.left + c.width / 2;
      const cy = c.top + c.height / 2;
      coinWrap.style.translate = "";
      root.dataset.coin = "";
      suppressClick = true;
      later(() => (suppressClick = false), 50);
      if (s && cx > s.left - 40 && cx < s.right + 40 && cy > s.top - 60 && cy < s.bottom + 40) insertCoin();
    };
    const onClick = () => {
      if (suppressClick) return;
      insertCoin();
    };
    coinBtn.addEventListener("pointerdown", onDown);
    coinBtn.addEventListener("pointermove", onMove);
    coinBtn.addEventListener("pointerup", onUp);
    coinBtn.addEventListener("pointercancel", onUp);
    coinBtn.addEventListener("click", onClick);
    offs.push(() => {
      coinBtn.removeEventListener("pointerdown", onDown);
      coinBtn.removeEventListener("pointermove", onMove);
      coinBtn.removeEventListener("pointerup", onUp);
      coinBtn.removeEventListener("pointercancel", onUp);
      coinBtn.removeEventListener("click", onClick);
    });
  }

  // ── fast boot (returning players) ─────────────────────────────────────────────────────────────────────────────
  const runFast = () => {
    setPhase("fast");
    const s = useSave.getState();
    const { level } = levelProgress(s.player.xp);
    const save = $<HTMLElement>("[data-boot-save]");
    if (save) save.textContent = `LV ${level} · ${s.player.coinIds.length}/${coinTotal} coins`;
    const tick = () => {
      renderBar();
      if (exiting) return;
      if (performance.now() - started >= 700 && (heroReady() || performance.now() - started > 1000)) {
        renderBar();
        setPhase("continue");
        lastInput = performance.now();
        later(() => $<HTMLElement>("[data-boot-yes]")?.focus({ preventScroll: true }), 40);
      } else later(tick, 50);
    };
    tick();
  };

  // ── exit: a multicolor pixel dissolve reveals the Title Screen ─────────────────────────────────────────────────
  const dissolve = (ms: number) =>
    new Promise<void>((resolve) => {
      const canvas = $<HTMLCanvasElement>("[data-boot-dissolve]");
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return resolve();
      const w = (canvas.width = window.innerWidth);
      const h = (canvas.height = window.innerHeight);
      const cell = 28;
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      const order = new Float32Array(cols * rows);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) order[r * cols + c] = (r / rows) * 0.7 + Math.random() * 0.3;
      root.setAttribute("data-dissolving", "");
      const t0 = performance.now();
      const frame = (now: number) => {
        const p = (now - t0) / ms;
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < order.length; i++) {
          const o = order[i];
          if (o <= p) continue; // revealed
          ctx.fillStyle = o <= p + 0.09 ? RAINBOW[i % RAINBOW.length] : "#07060f";
          ctx.fillRect((i % cols) * cell, Math.floor(i / cols) * cell, cell, cell);
        }
        if (p < 1.12) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

  const exit = (skipped: boolean, quick = false) => {
    if (exiting) return;
    exiting = true;
    setPhase("exit");
    const done = () => {
      if (root.open) root.close();
      html.removeAttribute("data-boot");
      bus.emit("boot:done", { skipped });
      const title = document.getElementById("title-heading");
      if (title) {
        title.setAttribute("tabindex", "-1");
        title.setAttribute("data-scroll-target", "");
        title.focus({ preventScroll: true });
      }
      destroy();
    };
    if (reduced) {
      const a = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: "ease-out" });
      a.onfinish = done;
      return;
    }
    void dissolve(quick ? 340 : 560).then(done);
  };

  // ── choices ───────────────────────────────────────────────────────────────────────────────────────────────────
  const start = (withSound: boolean) => {
    const store = useSave.getState();
    store.setSetting("sound", withSound); // this click IS the first gesture — audio may start now (R5)
    if (withSound) sfx.play("powerUp");
    store.unlock("player-one");
    exit(false);
  };
  const skip = () => {
    if (exiting) return;
    useSave.getState().unlock("skipper");
    exit(true, true);
  };
  const speedrun = () => {
    if (exiting) return;
    exit(false, true);
    setSpeedrun(true);
  };
  const continueYes = () => exit(false);
  const newGame = () => {
    root.setAttribute("data-confirm", "");
    later(() => $<HTMLElement>("[data-boot-back]")?.focus({ preventScroll: true }), 30);
  };
  const back = () => {
    root.removeAttribute("data-confirm");
    later(() => $<HTMLElement>("[data-boot-new]")?.focus({ preventScroll: true }), 30);
  };
  const erase = () => {
    root.removeAttribute("data-confirm");
    useSave.getState().resetSave();
    mode = "full";
    root.dataset.mode = "full";
    started = performance.now();
    coinIn = false;
    root.dataset.coin = "";
    root.removeAttribute("data-credit");
    root.focus({ preventScroll: true });
    runLog();
  };

  // ── keys + idle ───────────────────────────────────────────────────────────────────────────────────────────────
  const IGNORE = new Set(["Tab", "Shift", "Control", "Alt", "Meta", "CapsLock", "Fn"]);
  const onKey = (e: KeyboardEvent) => {
    if (IGNORE.has(e.key) || exiting) return;
    lastInput = performance.now();
    if (e.shiftKey && (e.key === "R" || e.key === "r")) {
      e.preventDefault();
      speedrun();
      return;
    }
    const onButton = e.target instanceof Element && !!e.target.closest("button, a");
    if ((e.key === "Enter" || e.key === " ") && onButton) return; // the focused control handles it
    if (e.key === "Escape") return; // the dialog's cancel event handles Esc
    if (performance.now() - started < SKIP_AFTER) return;
    e.preventDefault();
    skip();
  };
  const onCancel = (e: Event) => {
    e.preventDefault();
    skip();
  };
  const onPointer = () => {
    lastInput = performance.now();
  };
  root.addEventListener("keydown", onKey);
  root.addEventListener("cancel", onCancel);
  root.addEventListener("pointermove", onPointer, { passive: true });
  root.addEventListener("pointerdown", onPointer, { passive: true });
  const idleTimer = window.setInterval(() => {
    if (exiting || (phase !== "coin" && phase !== "continue") || root.hasAttribute("data-confirm")) return;
    if (performance.now() - lastInput < IDLE_MS) return;
    if (phase === "continue") continueYes();
    else exit(false); // auto-continue muted (sound stays off — R5)
  }, 400);

  function destroy() {
    timers.forEach((t) => window.clearTimeout(t));
    timers.clear();
    window.clearInterval(idleTimer);
    root.removeEventListener("keydown", onKey);
    root.removeEventListener("cancel", onCancel);
    root.removeEventListener("pointermove", onPointer);
    root.removeEventListener("pointerdown", onPointer);
    offs.forEach((off) => off());
    offs.length = 0;
  }

  // ── go ────────────────────────────────────────────────────────────────────────────────────────────────────────
  root.dataset.mode = mode;
  if (!root.open) root.showModal();
  html.setAttribute("data-boot", "running"); // the dialog covers the page now — drop the pre-paint curtain
  root.focus({ preventScroll: true });
  started = performance.now();
  setPhase("power");
  renderBar();
  later(() => (mode === "fast" ? runFast() : runLog()), reduced ? 60 : 220);

  return { insertCoin, start, skip, speedrun, continueYes, newGame, erase, back, destroy };
}
