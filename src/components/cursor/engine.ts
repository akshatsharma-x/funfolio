// Cursor follower engine (PART 2 · fun layer + locator kit). Imperative on purpose: one rAF loop that sleeps when idle,
// transform-only updates via element refs, zero React renders per pointermove.
// The native cursor (truth layer, cursors.css) is never touched here — the follower is decoration on top of it.

import { bus } from "@/lib/bus";
import { fx } from "@/lib/juice";

export type EngineOptions = { reducedMotion: boolean };

const TEXTISH =
  'input:not([type="button"],[type="submit"],[type="reset"],[type="checkbox"],[type="radio"],[type="range"],[type="color"],[type="file"],[type="image"]), textarea, [contenteditable]:not([contenteditable="false"]), iframe, video, embed, object';
const INTERACTIVE =
  'a[href], area[href], button, [role="button"], [role="tab"], [role="link"], [role="menuitem"], [role="option"], [role="switch"], [role="checkbox"], [role="radio"], summary, label[for], select, input[type="checkbox"], input[type="radio"], input[type="range"], input[type="button"], input[type="submit"], [data-cursor="hand"], [data-cursor="grab"], [data-cursor="pull"], [data-cursor="crosshair"]';
const DISABLED = ':disabled, [aria-disabled="true"], [data-cursor="not-allowed"]';
const DRAGGABLE = '[data-cursor="grab"], [data-cursor="pull"], [data-cursor="grabbing"], [draggable="true"]';
const MAGNETIC = '.arcade-btn, [data-magnetic]';
const RAINBOW_WORLDS = new Set(["title", "arcade", "credits"]);
const RAINBOW = ["#FF3D8B", "#FF8A1F", "#FFD23F", "#B6FF3B", "#22D3EE", "#A78BFA"];

/** Shake-to-find: ≥ 4 direction reversals within 600ms while moving faster than 1.2 px/ms. */
const SHAKE_REVERSALS = 4;
const SHAKE_WINDOW = 600;
const SHAKE_SPEED = 1.2;
const IDLE_AFTER = 3000;
const BEACON_EVERY = 2500;
/** Follower lag: exponential smoothing, τ = 14ms → < 2% behind after 60ms. */
const TAU = 14;

type Mode = "idle" | "hover" | "drag" | "disabled" | "text";
type LocateKind = "shake" | "key" | "api" | "reentry";

const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

export function startCursorEngine(root: HTMLElement, { reducedMotion }: EngineOptions): () => void {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);
  const pos = q<HTMLElement>("[data-fx-pos]");
  const bounce = q<HTMLElement>("[data-fx-bounce]");
  const label = q<HTMLElement>("[data-fx-label]");
  const beacon = q<HTMLElement>("[data-fx-beacon]");
  const radars = Array.from(root.querySelectorAll<HTMLElement>("[data-fx-radar]"));
  if (!pos || !bounce || !label || !beacon) return () => {};

  root.setAttribute("data-motion", reducedMotion ? "reduce" : "full");
  // The pixel trail lives on the shared FX canvas since PART 4 (fx.trail — a no-op until the FX layer is up).
  const trailOn = !reducedMotion;

  // pointer + follower state
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let known = false;
  let inside = false;
  let wasOutside = false; // only a real exit → re-entry pings (the first move after load is not a re-entry)
  let raf = 0;
  let last = 0;
  let mode: Mode = "idle";
  let lastTarget: Element | null = null;
  let pressed = false;
  let dragTarget: Element | null = null;
  let squash: Animation | null = null;
  // label
  let labelFor: Element | null = null;
  let labelTimer = 0;
  let locating = false;
  let locateTimer = 0;
  // glow + trail colors from the world under the pointer
  let glowFrom: Element | null | undefined;
  let trailColor = RAINBOW[0];
  let rainbow = true;
  let rainbowIndex = 0;
  // magnetic target
  let magnet: HTMLElement | null = null;
  let magnetRect: DOMRect | null = null;
  // shake
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  let dirX = 0;
  let dirY = 0;
  let segMaxX = 0;
  let segMaxY = 0;
  const reversals: number[] = [];
  let shakeReadyAt = 0;
  // idle beacon
  let idleTimer = 0;
  let beaconTimer = 0;
  let scrollRaf = 0;
  let refocusAt = 0;

  const setMode = (next: Mode) => {
    if (next === mode) return;
    mode = next;
    root.setAttribute("data-mode", next);
  };

  // ── render loop ───────────────────────────────────────────────────────────────────────────────────────────────
  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(64, now - last);
    last = now;
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-dt / TAU);
    cx += (tx - cx) * alpha;
    cy += (ty - cy) * alpha;
    if (Math.abs(tx - cx) < 0.15 && Math.abs(ty - cy) < 0.15) {
      cx = tx;
      cy = ty;
    }
    pos.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
    if (cx !== tx || cy !== ty) raf = requestAnimationFrame(frame);
  };
  const wake = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  // ── context: what is under the pointer ───────────────────────────────────────────────────────────────────────
  const updateGlow = (section: Element | null) => {
    glowFrom = section;
    const world = section?.getAttribute("data-world") ?? document.documentElement.getAttribute("data-world") ?? "title";
    rainbow = RAINBOW_WORLDS.has(world);
    const color = getComputedStyle(section ?? document.documentElement).getPropertyValue("--world").trim();
    if (color) {
      trailColor = color;
      root.style.setProperty("--fx-glow", color);
    }
  };

  const showLabel = (text: string) => {
    label.textContent = text;
    root.setAttribute("data-label", "");
  };

  const scheduleLabel = (el: Element | null) => {
    if (el === labelFor) return;
    labelFor = el;
    window.clearTimeout(labelTimer);
    if (locating) return;
    if (!el) {
      root.removeAttribute("data-label");
      return;
    }
    const text = el.getAttribute("data-cursor-label") ?? "";
    labelTimer = window.setTimeout(() => {
      if (labelFor === el && !locating && text) showLabel(text);
    }, 120);
  };

  const classify = (target: EventTarget | null) => {
    const el = target instanceof Element ? target : null;
    lastTarget = el;
    const global = document.documentElement.getAttribute("data-cursor");
    let next: Mode = "idle";
    if (global === "grabbing" || global === "pull" || (pressed && dragTarget)) next = "drag";
    else if (el?.closest(TEXTISH)) next = "text";
    else if (el?.closest(DISABLED)) next = "disabled";
    else if (el?.closest(INTERACTIVE) || (global && global !== "default")) next = "hover";
    setMode(next);
    scheduleLabel(el?.closest("[data-cursor-label]") ?? null);
    const section = el?.closest("[data-world]") ?? null;
    if (section !== glowFrom) updateGlow(section);
  };

  // ── magnetic targets (they lean toward the pointer; the pointer never moves) ───────────────────────────────
  const releaseMagnet = () => {
    if (magnet) {
      magnet.style.removeProperty("--mx");
      magnet.style.removeProperty("--my");
    }
    magnet = null;
    magnetRect = null;
  };
  const updateMagnet = (x: number, y: number) => {
    if (reducedMotion) return;
    const found = (lastTarget?.closest(MAGNETIC) as HTMLElement | null) ?? null;
    const usable = found && !found.matches(DISABLED) ? found : null;
    if (usable !== magnet) {
      releaseMagnet();
      magnet = usable;
      magnetRect = usable ? usable.getBoundingClientRect() : null;
    }
    if (!magnet || !magnetRect) return;
    const max = document.documentElement.getAttribute("data-fx") === "chill" ? 3 : 6;
    const ox = clamp((x - (magnetRect.left + magnetRect.width / 2)) * 0.18, max);
    const oy = clamp((y - (magnetRect.top + magnetRect.height / 2)) * 0.3, max);
    magnet.style.setProperty("--mx", `${ox.toFixed(2)}px`);
    magnet.style.setProperty("--my", `${oy.toFixed(2)}px`);
  };

  // ── locator kit ──────────────────────────────────────────────────────────────────────────────────────────────
  const radar = (delay = 0) => {
    radars.forEach((ring, i) =>
      ring.animate(
        [
          { scale: 0, opacity: 0.95 },
          { scale: 1, opacity: 0 },
        ],
        { duration: 600, delay: delay + i * 110, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      ),
    );
  };

  const locate = (kind: LocateKind) => {
    if (!known || !inside || document.hidden) return;
    window.clearTimeout(locateTimer);
    if (kind === "shake") bus.emit("cursor:shake", { x: tx, y: ty });
    const here = kind !== "reentry";
    if (reducedMotion) {
      // no pulses: a bigger static halo (and the label) for a moment
      locating = here;
      root.setAttribute("data-locate", "static");
      if (here) showLabel("HERE!");
    } else if (kind === "shake") {
      locating = true;
      root.setAttribute("data-locate", "shake");
      showLabel("HERE!");
      radar(0);
      radar(420);
    } else {
      radar(0);
    }
    locateTimer = window.setTimeout(() => {
      locating = false;
      root.removeAttribute("data-locate");
      if (labelFor?.getAttribute("data-cursor-label")) showLabel(labelFor.getAttribute("data-cursor-label") ?? "");
      else root.removeAttribute("data-label");
    }, 1000);
  };

  const pulse = () => {
    if (!inside || document.hidden) return;
    beacon.animate(
      [
        { scale: 0, opacity: 0.6 },
        { scale: 1, opacity: 0 },
      ],
      { duration: 1200, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  };
  const stopIdle = () => {
    window.clearTimeout(idleTimer);
    window.clearInterval(beaconTimer);
    beaconTimer = 0;
  };
  const restartIdle = () => {
    stopIdle();
    if (reducedMotion) return;
    idleTimer = window.setTimeout(() => {
      pulse();
      beaconTimer = window.setInterval(pulse, BEACON_EVERY);
    }, IDLE_AFTER);
  };

  const detectShake = (e: PointerEvent) => {
    const t = e.timeStamp;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const dt = Math.max(1, t - lastT);
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = t;
    // rubbing BYTE (petting, PART 4) is not "I lost my cursor"
    if (e.target instanceof Element && e.target.closest("[data-byte]")) {
      reversals.length = 0;
      return;
    }
    segMaxX = Math.max(segMaxX, Math.abs(dx) / dt);
    segMaxY = Math.max(segMaxY, Math.abs(dy) / dt);
    const sx = Math.abs(dx) > 1 ? Math.sign(dx) : 0;
    const sy = Math.abs(dy) > 1 ? Math.sign(dy) : 0;
    if (sx && dirX && sx !== dirX) {
      if (segMaxX > SHAKE_SPEED) reversals.push(t);
      segMaxX = 0;
    }
    if (sy && dirY && sy !== dirY) {
      if (segMaxY > SHAKE_SPEED) reversals.push(t);
      segMaxY = 0;
    }
    if (sx) dirX = sx;
    if (sy) dirY = sy;
    while (reversals.length > 0 && t - reversals[0] > SHAKE_WINDOW) reversals.shift();
    if (reversals.length >= SHAKE_REVERSALS && t >= shakeReadyAt) {
      reversals.length = 0;
      shakeReadyAt = t + 1500;
      locate("shake");
    }
  };

  // ── events ───────────────────────────────────────────────────────────────────────────────────────────────────
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    tx = e.clientX;
    ty = e.clientY;
    if (!known) {
      known = true;
      cx = tx;
      cy = ty;
      lastX = tx;
      lastY = ty;
      lastT = e.timeStamp;
    }
    if (!inside) inside = true;
    root.setAttribute("data-visible", "");
    if (e.target !== lastTarget) classify(e.target);
    updateMagnet(tx, ty);
    if (trailOn && mode !== "text") fx.trail(tx, ty, rainbow ? RAINBOW[rainbowIndex++ % RAINBOW.length] : trailColor);
    detectShake(e);
    restartIdle();
    wake();
  };

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "touch") {
      // hybrid device: hide the follower until the mouse moves again (touch gets tap ripples in PART 4)
      root.removeAttribute("data-visible");
      fx.clearTrail();
      return;
    }
    pressed = true;
    dragTarget = e.target instanceof Element ? e.target.closest(DRAGGABLE) : null;
    if (dragTarget) setMode("drag");
    if (!reducedMotion) {
      squash?.cancel();
      squash = bounce.animate([{ scale: 1 }, { scale: 0.85 }], { duration: 90, easing: "ease-out", fill: "forwards" });
    }
  };

  const onUp = () => {
    if (!pressed) return;
    pressed = false;
    dragTarget = null;
    if (!reducedMotion) {
      squash?.cancel();
      squash = null;
      bounce.animate([{ scale: 0.85 }, { scale: 1.1, offset: 0.45 }, { scale: 1 }], {
        duration: 280,
        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      });
    }
    classify(document.elementFromPoint(tx, ty));
  };

  const onOut = (e: PointerEvent) => {
    if (e.relatedTarget) return; // still inside the document
    inside = false;
    wasOutside = true;
    root.removeAttribute("data-visible");
    releaseMagnet();
    stopIdle();
  };

  const onOver = (e: PointerEvent) => {
    if (e.relatedTarget || inside || e.pointerType === "touch") return;
    inside = true;
    tx = e.clientX;
    ty = e.clientY;
    cx = tx;
    cy = ty;
    known = true;
    root.setAttribute("data-visible", "");
    wake();
    if (wasOutside) locate("reentry");
  };

  const onScroll = () => {
    if (!known || !inside || scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      releaseMagnet();
      classify(document.elementFromPoint(tx, ty));
    });
  };

  const onRefocus = () => {
    if (document.hidden) return;
    const now = performance.now();
    if (now - refocusAt < 400) return; // focus + visibilitychange often fire together
    refocusAt = now;
    locate("reentry");
  };

  const onHtmlChange = (records: MutationRecord[]) => {
    // theme / world / global cursor variant changed: refresh colors and mode. A dialog opened or closed (the pause
    // menu, an arcade game) without the pointer moving: what's under it changed — re-read it, or a stale label
    // ("PLAY") would stay on the follower.
    glowFrom = undefined;
    if (!known) return;
    const covered = records.some((r) => r.attributeName === "data-paused" || r.attributeName === "data-game-open");
    classify(covered ? document.elementFromPoint(tx, ty) : lastTarget);
  };

  const htmlObserver = new MutationObserver(onHtmlChange);
  htmlObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-world", "data-cursor", "data-paused", "data-game-open"] });
  // Hotkey L lives in the PART 3 keyboard manager (src/components/hud/useGameRuntime.ts) → locateCursor() → here.
  const offLocate = bus.on("cursor:locate", () => locate("api"));

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  window.addEventListener("pointercancel", onUp, { passive: true });
  document.addEventListener("pointerout", onOut, { passive: true });
  document.addEventListener("pointerover", onOver, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true, capture: true });
  window.addEventListener("focus", onRefocus);
  document.addEventListener("visibilitychange", onRefocus);

  return () => {
    cancelAnimationFrame(raf);
    cancelAnimationFrame(scrollRaf);
    window.clearTimeout(labelTimer);
    window.clearTimeout(locateTimer);
    stopIdle();
    releaseMagnet();
    htmlObserver.disconnect();
    offLocate();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    document.removeEventListener("pointerout", onOut);
    document.removeEventListener("pointerover", onOver);
    window.removeEventListener("scroll", onScroll, { capture: true });
    window.removeEventListener("focus", onRefocus);
    document.removeEventListener("visibilitychange", onRefocus);
  };
}
