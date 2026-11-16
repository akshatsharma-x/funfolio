// BYTE's brain (PART 4). Imperative on purpose (like the cursor engine): React renders the robot once; this controller
// moves it, swaps faces, types speech and reacts — no React renders per frame.
//   • moods from the face sheet; idle blinks every 3–6s; sleepy (Zzz) after 30s without input
//   • eyes track the pointer (clamped) — a second cursor locator
//   • speech queue + typewriter (blip every 2 chars); click BYTE or the bubble to fast-forward
//   • click → a quip (facts from content.ts); once-only world lines and first-run tips (from the server-built script)
//   • drag; throw → bounces off the viewport edges with squash ("Wheee!"); the home position is saved
//   • minimize → only the antenna peeks out; rubbing → hearts; 10 pets → petting-zoo
//   • never covers a button: when its spot overlaps anything interactive, BYTE glides to the nearest free spot
//     (and back home once it's free); if nothing is free, it tucks away like minimized.
//   • never talks over a game unasked: over a `[data-game-screen]` (and on phones) its lines wait behind a "!"

import type { ByteScript } from "@/content/quips";
import type { WorldId } from "@/content/worlds";
import { announce } from "@/lib/announce";
import { bus } from "@/lib/bus";
import type { ByteMood } from "@/lib/byte";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { fx } from "@/lib/juice";
import { sfx } from "@/lib/sfx";
import { useSave } from "@/lib/store";
import { faceFor } from "./faces";

export const BYTE_W = 72;
export const BYTE_H = 84;
const MARGIN = 10;
const TOP_SAFE = 76; // below the HUD
const PEEK = 22; // px of antenna that stay visible when minimized
const TYPE_MS = 28;
const SLEEP_AFTER = 30000;
const PETS_FOR_ZOO = 10;
const LABEL = "BYTE, the robot mascot. Press for a quip; arrow keys move BYTE.";
const PENDING_LABEL = "BYTE, the robot mascot, has something to say. Press to hear it; arrow keys move BYTE.";
const INTERACTIVE =
  'a[href], button, input, select, textarea, summary, label[for], [role="button"], [role="link"], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], [role="slider"], [contenteditable="true"], [tabindex]:not([tabindex="-1"]), .peel__corner';

type Vec = { x: number; y: number };
type Line = { text: string; mood?: ByteMood; ms?: number };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function shuffle<T>(list: T[]): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function startByte(root: HTMLElement, script: ByteScript): () => void {
  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel);
  const bot = $<HTMLButtonElement>("[data-byte-bot]");
  const minBtn = $<HTMLButtonElement>("[data-byte-min]");
  const squashEl = $<HTMLElement>("[data-byte-squash]");
  const eyes = $<SVGGElement>("[data-byte-eyes]");
  const faceWorld = $<SVGPathElement>("[data-face='world']");
  const facePink = $<SVGPathElement>("[data-face='pink']");
  const faceWhite = $<SVGPathElement>("[data-face='white']");
  const dots = Array.from(root.querySelectorAll<SVGRectElement>("[data-byte-dot]"));
  const bubble = $<HTMLElement>("[data-byte-bubble]");
  const ghost = $<HTMLElement>("[data-byte-ghost]");
  const typedEl = $<HTMLElement>("[data-byte-text]");
  if (!bot || !minBtn || !squashEl || !eyes || !faceWorld || !facePink || !faceWhite || !bubble || !ghost || !typedEl) return () => {};

  const store = useSave;
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };
  const cancel = (id: number) => {
    window.clearTimeout(id);
    timers.delete(id);
  };
  const offs: (() => void)[] = [];
  const listen = <K extends keyof WindowEventMap>(target: Window | Document | HTMLElement, type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
    target.addEventListener(type, fn as EventListener, opts);
    offs.push(() => target.removeEventListener(type, fn as EventListener, opts));
  };

  // ── geometry ───────────────────────────────────────────────────────────────────────────────────────────────────
  const bounds = () => ({
    minX: MARGIN,
    maxX: Math.max(MARGIN, window.innerWidth - BYTE_W - MARGIN),
    minY: TOP_SAFE,
    maxY: Math.max(TOP_SAFE, window.innerHeight - BYTE_H - MARGIN),
  });
  const homeFromSave = (): Vec => {
    const b = bounds();
    const { fx: hx, fy: hy } = store.getState().byte;
    if (hx === null || hy === null) return { x: b.maxX - 8, y: b.maxY - 4 }; // docked bottom-right
    return { x: b.minX + hx * (b.maxX - b.minX), y: b.minY + hy * (b.maxY - b.minY) };
  };
  let home = homeFromSave();
  let pos: Vec = { ...home };
  let minimized = store.getState().byte.minimized;
  let tucked = false;

  const saveHome = () => {
    const b = bounds();
    const fx = b.maxX > b.minX ? (home.x - b.minX) / (b.maxX - b.minX) : 1;
    const fy = b.maxY > b.minY ? (home.y - b.minY) / (b.maxY - b.minY) : 1;
    store.getState().setBytePos(Math.round(clamp(fx, 0, 1) * 1000) / 1000, Math.round(clamp(fy, 0, 1) * 1000) / 1000);
  };

  const render = (glide: boolean) => {
    const hidden = minimized || tucked;
    const y = hidden ? window.innerHeight - PEEK : pos.y;
    root.toggleAttribute("data-glide", glide && !prefersReducedMotion());
    root.style.transform = `translate3d(${Math.round(pos.x)}px, ${Math.round(y)}px, 0)`;
    root.dataset.side = pos.x + BYTE_W / 2 > window.innerWidth / 2 ? "right" : "left";
    root.dataset.place = y < 190 ? "below" : "above";
  };

  // ── face + mood ───────────────────────────────────────────────────────────────────────────────────────────────
  let baseMood: ByteMood = "idle";
  let mood: ByteMood = "idle";
  let moodTimer = 0;
  const drawFace = (m: ByteMood | "blink") => {
    const face = faceFor(m);
    const d: Record<string, string> = {};
    for (const p of face.parts) d[p.color] = p.d;
    faceWorld.setAttribute("d", d["var(--world)"] ?? "");
    facePink.setAttribute("d", d["#FF3D8B"] ?? "");
    faceWhite.setAttribute("d", d["#FFFFFF"] ?? "");
    dots.forEach((dot, i) => {
      const at = face.dots[i];
      dot.style.display = at ? "" : "none";
      if (at) {
        dot.setAttribute("x", String(at[0]));
        dot.setAttribute("y", String(at[1]));
      }
    });
  };
  const setMood = (m: ByteMood) => {
    mood = m;
    root.dataset.mood = m;
    drawFace(m);
  };
  const react = (m: ByteMood, ms = 1500) => {
    cancel(moodTimer);
    setMood(m);
    moodTimer = later(() => setMood(baseMood), ms);
  };
  const blinkLoop = () => {
    later(() => {
      if (mood === "idle" && !document.hidden) {
        drawFace("blink");
        later(() => mood === "idle" && drawFace("idle"), 130);
      }
      blinkLoop();
    }, 3000 + Math.random() * 3000);
  };

  // ── eyes: follow the pointer (or what BYTE points at) ─────────────────────────────────────────────────────────
  let pointer: Vec = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let lookAt: (Vec & { until: number }) | null = null;
  let eyeRaf = 0;
  const updateEyes = () => {
    eyeRaf = 0;
    const r = bot.getBoundingClientRect();
    const target = lookAt && performance.now() < lookAt.until ? lookAt : pointer;
    const dx = clamp((target.x - (r.left + r.width / 2)) / 180, -1, 1) * 0.9;
    const dy = clamp((target.y - (r.top + 30)) / 180, -1, 1) * 0.6;
    eyes.setAttribute("transform", `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
  };
  const queueEyes = () => {
    if (!eyeRaf) eyeRaf = requestAnimationFrame(updateEyes);
  };

  // ── input / sleepy ──────────────────────────────────────────────────────────────────────────────────────────
  let lastInput = performance.now();
  const onInput = () => {
    lastInput = performance.now();
    if (baseMood === "sleepy") {
      baseMood = "idle";
      if (mood === "sleepy") setMood("idle");
    }
  };
  const sleepTimer = window.setInterval(() => {
    if (baseMood !== "sleepy" && !speaking && performance.now() - lastInput > SLEEP_AFTER) {
      baseMood = "sleepy";
      if (mood === "idle") setMood("sleepy");
    }
  }, 5000);

  // ── speech ──────────────────────────────────────────────────────────────────────────────────────────────────
  const queue: Line[] = [];
  // Phones have no gutters, so an unrequested bubble would sit on the text being read (R6). There, tips and world
  // lines wait behind a "!" on BYTE until the visitor taps it, and any open bubble closes once the page scrolls on.
  const narrow = window.matchMedia("(max-width: 47.99rem)");
  const pending: { key: string; line: Line }[] = [];
  let openedAtY = 0;
  let speaking = false;
  let typing = false;
  let full = "";
  let typeTimer = 0;
  let holdTimer = 0;

  /** Pointer-through when the bubble would sit on top of something clickable. */
  const updateBubbleHit = () => {
    const r = bubble.getBoundingClientRect();
    const blocked = interactiveRects().some((e) => e.left < r.right && e.right > r.left && e.top < r.bottom && e.bottom > r.top);
    bubble.toggleAttribute("data-passthrough", blocked);
  };

  const finishTyping = (hold: number) => {
    typing = false;
    cancel(typeTimer);
    typedEl.textContent = full;
    cancel(holdTimer);
    holdTimer = later(nextLine, hold);
  };
  const nextLine = () => {
    cancel(typeTimer);
    cancel(holdTimer);
    const line = queue.shift();
    if (!line) {
      speaking = false;
      typing = false;
      bubble.removeAttribute("data-open");
      return;
    }
    speaking = true;
    full = line.text;
    ghost.textContent = full;
    typedEl.textContent = "";
    bubble.setAttribute("data-open", "");
    bubble.setAttribute("data-text", full);
    openedAtY = window.scrollY;
    requestAnimationFrame(updateBubbleHit);
    const hold = line.ms ?? 2400 + full.length * 45;
    if (line.mood) react(line.mood, hold + full.length * TYPE_MS);
    if (prefersReducedMotion()) {
      finishTyping(hold);
      return;
    }
    typing = true;
    let shown = 0;
    const step = () => {
      shown += 1;
      typedEl.textContent = full.slice(0, shown);
      if (shown % 2 === 0 && full[shown - 1] !== " ") sfx.play("blip");
      if (shown >= full.length) finishTyping(hold);
      else typeTimer = later(step, TYPE_MS);
    };
    typeTimer = later(step, TYPE_MS);
  };
  const say = (line: Line): boolean => {
    if (minimized || tucked) return false;
    if (queue.length >= 3) queue.shift();
    queue.push(line);
    if (!speaking) nextLine();
    return true;
  };
  const fastForward = () => {
    if (typing) finishTyping(1600);
    else nextLine();
  };
  /** Interrupts whatever BYTE is saying (a direct answer to the visitor, e.g. the high-five). */
  const sayNow = (line: Line): boolean => {
    if (minimized || tucked) return false;
    queue.length = 0;
    queue.push(line);
    nextLine();
    return true;
  };
  // A game screen (`[data-game-screen]`) is a play zone with its own tips: there, too, lines BYTE offers unasked wait
  // behind the "!" rather than open a bubble over the game (estimated from BYTE's spot; a click on BYTE plays them).
  const bubbleOverGame = () => {
    const games = document.querySelectorAll<HTMLElement>("[data-game-screen]");
    if (!games.length) return false;
    const w = Math.min(260, window.innerWidth - 24);
    const h = 120;
    const l = root.dataset.side === "left" ? pos.x : pos.x + BYTE_W - w;
    const t = root.dataset.place === "below" ? pos.y + BYTE_H + 4 : pos.y - 4 - h;
    return [...games].some((g) => {
      const r = g.getBoundingClientRect();
      return r.width > 0 && r.left < l + w && r.right > l && r.top < t + h && r.bottom > t;
    });
  };
  const syncPending = () => {
    root.toggleAttribute("data-pending", pending.length > 0);
    if (!minimized) bot.setAttribute("aria-label", pending.length ? PENDING_LABEL : LABEL);
  };
  // the page moves under a fixed bubble: phones close it; elsewhere re-check what it covers (≤ every 120ms)
  let scrollFrame = 0;
  let hitCheckedAt = 0;
  listen(
    window,
    "scroll",
    () => {
      if (!speaking || scrollFrame) return;
      scrollFrame = requestAnimationFrame((now) => {
        scrollFrame = 0;
        if (!speaking) return;
        if (narrow.matches && Math.abs(window.scrollY - openedAtY) > 48) {
          queue.length = 0;
          nextLine(); // closes the bubble
        } else if (now - hitCheckedAt > 120) {
          hitCheckedAt = now;
          updateBubbleHit();
        }
      });
    },
    { passive: true },
  );

  // ── quips ───────────────────────────────────────────────────────────────────────────────────────────────────
  const order = shuffle(script.quips.map((_, i) => i));
  let qi = 0;
  const quip = (viaKeyboard: boolean) => {
    if (!script.quips.length) return;
    const q = script.quips[order[qi++ % order.length]];
    say({ text: q.text, mood: q.mood });
    // the bubble is decorative (aria-hidden); a deliberate keyboard press still deserves the words
    if (viaKeyboard) announce(`BYTE says: ${q.text}`);
  };

  // ── minimize ────────────────────────────────────────────────────────────────────────────────────────────────
  const setMinimized = (on: boolean, persist = true) => {
    minimized = on;
    if (persist) store.getState().setByteMinimized(on);
    root.toggleAttribute("data-minimized", on);
    bot.setAttribute("aria-label", on ? "Bring BYTE back" : pending.length ? PENDING_LABEL : LABEL);
    if (on) {
      queue.length = 0;
      nextLine();
    }
    render(true);
    if (!on) later(() => avoid(true), 360);
  };

  // ── never cover a button ────────────────────────────────────────────────────────────────────────────────────
  // Exact rect intersection against every visible interactive element on screen (sampling points misses thin
  // overlaps along BYTE's edges). The rects are measured once per check and reused for all candidate spots.
  const interactiveRects = (): DOMRect[] => {
    const out: DOMRect[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(INTERACTIVE)) {
      if (root.contains(el) || el.closest("[hidden], [inert], dialog:not([open])")) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      out.push(r);
    }
    return out;
  };
  const overlaps = (rects: DOMRect[], x: number, y: number, pad = 4) =>
    rects.some((r) => r.left < x + BYTE_W + pad && r.right > x - pad && r.top < y + BYTE_H + pad && r.bottom > y - pad);
  const findSpot = (t: Vec, rects: DOMRect[]): Vec | null => {
    const b = bounds();
    const candidates: Vec[] = [];
    for (const x of [t.x, b.maxX, b.minX]) for (let y = b.minY; y <= b.maxY; y += 24) candidates.push({ x, y });
    candidates.sort((p, q) => Math.hypot(p.x - t.x, p.y - t.y) - Math.hypot(q.x - t.x, q.y - t.y));
    return candidates.find((c) => !overlaps(rects, c.x, c.y)) ?? null;
  };
  let dragging = false;
  let flying = false;
  let visiting = false;
  function avoid(glide: boolean) {
    if (minimized || dragging || flying || visiting) return;
    const b = bounds();
    const target = { x: clamp(home.x, b.minX, b.maxX), y: clamp(home.y, b.minY, b.maxY) };
    const rects = interactiveRects();
    const spot = overlaps(rects, target.x, target.y) ? findSpot(target, rects) : target;
    if (!spot) {
      if (!tucked) {
        tucked = true;
        root.setAttribute("data-tucked", "");
        queue.length = 0;
        nextLine();
        render(glide);
      }
      return;
    }
    const wasTucked = tucked;
    if (tucked) {
      tucked = false;
      root.removeAttribute("data-tucked");
    }
    if (wasTucked || spot.x !== pos.x || spot.y !== pos.y) {
      pos = spot;
      render(glide);
    }
  }
  let avoidTimer = 0;
  const avoidSoon = (ms = 180) => {
    cancel(avoidTimer);
    avoidTimer = later(() => avoid(true), ms);
  };

  // ── drag + throw ────────────────────────────────────────────────────────────────────────────────────────────
  let drag: { id: number; sx: number; sy: number; ox: number; oy: number; active: boolean; samples: { x: number; y: number; t: number }[] } | null = null;
  let suppressClick = false;
  let flight: { vx: number; vy: number; last: number; bounces: number } | null = null;
  let flightRaf = 0;

  const squash = (axis: "x" | "y") => {
    if (prefersReducedMotion()) return;
    squashEl.animate(axis === "x" ? [{ scale: "0.78 1.18" }, { scale: "1 1" }] : [{ scale: "1.2 0.8" }, { scale: "1 1" }], {
      duration: 240,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    });
    sfx.play("thud");
  };
  const stopFlight = () => {
    cancelAnimationFrame(flightRaf);
    flightRaf = 0;
    flight = null;
    flying = false;
    root.removeAttribute("data-flying");
  };
  const settle = (userMoved: boolean) => {
    if (userMoved) {
      home = { ...pos };
      saveHome();
    }
    avoid(true);
  };
  const flyStep = (now: number) => {
    const f = flight;
    if (!f) return;
    const dt = Math.min(32, now - f.last);
    f.last = now;
    const k = Math.pow(0.9966, dt);
    f.vx *= k;
    f.vy *= k;
    let x = pos.x + f.vx * dt;
    let y = pos.y + f.vy * dt;
    const b = bounds();
    if (x < b.minX || x > b.maxX) {
      x = clamp(x, b.minX, b.maxX);
      f.vx = (x === b.minX ? 1 : -1) * Math.abs(f.vx) * 0.72;
      f.bounces++;
      squash("x");
    }
    if (y < b.minY || y > b.maxY) {
      y = clamp(y, b.minY, b.maxY);
      f.vy = (y === b.minY ? 1 : -1) * Math.abs(f.vy) * 0.72;
      f.bounces++;
      squash("y");
    }
    pos = { x, y };
    render(false);
    if (Math.hypot(f.vx, f.vy) < 0.03) {
      const bounces = f.bounces;
      stopFlight();
      if (bounces >= 2) react("dizzy", 1800);
      settle(true);
      return;
    }
    flightRaf = requestAnimationFrame(flyStep);
  };
  const fly = (vx: number, vy: number) => {
    const speed = Math.hypot(vx, vy);
    const cap = Math.min(1, 3 / speed);
    flight = { vx: vx * cap, vy: vy * cap, last: performance.now(), bounces: 0 };
    flying = true;
    root.setAttribute("data-flying", "");
    if (speed > 0.9) say({ text: "Wheee!", mood: "happy", ms: 900 });
    flightRaf = requestAnimationFrame(flyStep);
  };

  listen(bot, "pointerdown", (e: PointerEvent) => {
    if (e.button !== 0 || minimized || tucked) return;
    bot.setPointerCapture(e.pointerId);
    stopFlight();
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: e.clientX - pos.x, oy: e.clientY - pos.y, active: false, samples: [{ x: e.clientX, y: e.clientY, t: e.timeStamp }] };
  });

  // petting: rub back and forth over BYTE (direction reversals while hovering, no button pressed)
  const pet = { lastX: Number.NaN, dir: 0, travel: 0, flips: [] as number[], lastPet: 0, count: 0 };
  const petMove = (e: PointerEvent) => {
    if (Number.isNaN(pet.lastX)) {
      pet.lastX = e.clientX;
      return;
    }
    const dx = e.clientX - pet.lastX;
    pet.lastX = e.clientX;
    if (Math.abs(dx) < 1) return;
    const dir = Math.sign(dx);
    if (dir !== pet.dir) {
      if (pet.dir !== 0 && pet.travel >= 6) pet.flips.push(e.timeStamp);
      pet.dir = dir;
      pet.travel = 0;
    }
    pet.travel += Math.abs(dx);
    pet.flips = pet.flips.filter((t) => e.timeStamp - t < 520);
    if (pet.flips.length >= 2 && e.timeStamp - pet.lastPet > 260) {
      pet.lastPet = e.timeStamp;
      pet.flips = [];
      pet.count += 1;
      fx.burst(e.clientX, e.clientY - 12, { shape: "heart", count: 3, colors: ["#FF3D8B", "#FF4D4D", "#FFF4E0"], power: 0.8 });
      react("love", 1300);
      sfx.play("pop");
      if (pet.count === PETS_FOR_ZOO && store.getState().unlock("petting-zoo")) say({ text: "Best. Day. Ever.", mood: "love" });
    }
  };
  root.dataset.pets = "0";

  listen(bot, "pointermove", (e: PointerEvent) => {
    const d = drag;
    if (d && e.pointerId === d.id) {
      if (!d.active && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 5) {
        d.active = true;
        dragging = true;
        root.setAttribute("data-dragging", "");
        react("surprised", 60000);
      }
      if (d.active) {
        const b = bounds();
        pos = { x: clamp(e.clientX - d.ox, b.minX, b.maxX), y: clamp(e.clientY - d.oy, b.minY, b.maxY) };
        render(false);
        d.samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
        while (d.samples.length > 2 && e.timeStamp - d.samples[0].t > 90) d.samples.shift();
      }
      return;
    }
    if (!e.buttons && !minimized) {
      petMove(e);
      root.dataset.pets = String(pet.count);
    }
  });
  listen(bot, "pointerleave", () => {
    pet.lastX = Number.NaN;
    pet.dir = 0;
  });

  const endDrag = (e: PointerEvent) => {
    const d = drag;
    drag = null;
    if (!d || e.pointerId !== d.id || !d.active) return;
    dragging = false;
    root.removeAttribute("data-dragging");
    suppressClick = true;
    later(() => (suppressClick = false), 60);
    setMood(baseMood);
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const dt = Math.max(1, last.t - first.t);
    const vx = (last.x - first.x) / dt;
    const vy = (last.y - first.y) / dt;
    if (Math.hypot(vx, vy) > 0.5 && !prefersReducedMotion()) fly(vx, vy);
    else settle(true);
  };
  listen(bot, "pointerup", endDrag);
  listen(bot, "pointercancel", endDrag);

  listen(bot, "click", (e: MouseEvent) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (minimized) {
      setMinimized(false);
      return;
    }
    if (speaking) {
      fastForward();
      return;
    }
    const waiting = pending.shift();
    if (waiting) {
      syncPending();
      if (say(waiting.line)) store.getState().markByteSaid(waiting.key);
      if (e.detail === 0) announce(`BYTE says: ${waiting.line.text}`);
      return;
    }
    quip(e.detail === 0);
  });
  listen(bubble, "click", () => fastForward());
  listen(minBtn, "click", () => setMinimized(true));

  // keyboard alternative to dragging (R5): arrows move BYTE
  listen(bot, "keydown", (e: KeyboardEvent) => {
    const step = e.shiftKey ? 96 : 32;
    const moves: Record<string, Vec> = { ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 }, ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step } };
    const m = moves[e.key];
    if (!m || minimized) return;
    e.preventDefault();
    const b = bounds();
    pos = { x: clamp(pos.x + m.x, b.minX, b.maxX), y: clamp(pos.y + m.y, b.minY, b.maxY) };
    render(true);
    home = { ...pos };
    saveHome();
  });

  // ── point ───────────────────────────────────────────────────────────────────────────────────────────────────
  const point = (selector: string) => {
    let el: HTMLElement | null = null;
    try {
      el = document.querySelector<HTMLElement>(selector);
    } catch {
      return; // bad selector
    }
    if (!el || minimized || tucked) return;
    const r = el.getBoundingClientRect();
    const b = bot.getBoundingClientRect();
    const tx = r.left + r.width / 2;
    const ty = r.top + r.height / 2;
    const left = tx < b.left + b.width / 2;
    const sx = left ? b.left + 14 : b.right - 14;
    const ang = (Math.atan2(ty - (b.top + 58), tx - sx) * 180) / Math.PI;
    root.style.setProperty(left ? "--arm-l" : "--arm-r", `${clamp(left ? ang + 180 : ang, -80, 80).toFixed(1)}deg`);
    root.setAttribute("data-pointing", left ? "left" : "right");
    lookAt = { x: tx, y: ty, until: performance.now() + 2200 };
    queueEyes();
    const target = el;
    target.setAttribute("data-byte-point", "");
    react("happy", 2200);
    later(() => {
      target.removeAttribute("data-byte-point");
      root.removeAttribute("data-pointing");
      root.style.removeProperty("--arm-l");
      root.style.removeProperty("--arm-r");
      queueEyes();
    }, 2200);
  };

  // ── visit (PART 6): fly next to an element for a high-five, then home ───────────────────────────────────────────
  let visitTimer = 0;
  function endVisit() {
    if (!visiting) return;
    visiting = false;
    cancel(visitTimer);
    root.removeAttribute("data-visiting");
    avoid(true); // glides home (or to the nearest free spot)
  }
  const visit = (selector: string, text = "High five!") => {
    let el: HTMLElement | null = null;
    try {
      el = document.querySelector<HTMLElement>(selector);
    } catch {
      return; // bad selector
    }
    if (!el || minimized || dragging || flying || visiting) return;
    const fromHere = () => {
      if (sayNow({ text, mood: "love", ms: 1500 })) react("love", 1800);
    };
    if (prefersReducedMotion() || narrow.matches || tucked) return fromHere();
    const r = el.getBoundingClientRect();
    const b = bounds();
    const rects = interactiveRects();
    const cy = clamp(r.top + r.height / 2 - BYTE_H / 2, b.minY, b.maxY);
    const spot = [
      { x: r.right + 10, y: cy },
      { x: r.left - BYTE_W - 10, y: cy },
      { x: clamp(r.left + r.width / 2 - BYTE_W / 2, b.minX, b.maxX), y: r.top - BYTE_H - 10 },
    ].find((c) => c.x >= b.minX && c.x <= b.maxX && c.y >= b.minY && c.y <= b.maxY && !overlaps(rects, c.x, c.y));
    if (!spot) return fromHere();
    visiting = true;
    root.setAttribute("data-visiting", "");
    pos = spot;
    render(true);
    cancel(visitTimer);
    visitTimer = later(() => {
      // the near hand meets the target: a little star burst at the contact point
      const fromRight = spot.x > r.left;
      fx.burst(fromRight ? spot.x + 6 : spot.x + BYTE_W - 6, spot.y + BYTE_H * 0.4, { shape: "star", count: 8 });
      sfx.play("pop");
      point(selector);
      sayNow({ text, mood: "love", ms: 1400 });
      visitTimer = later(endVisit, 1700);
    }, 380);
  };

  // ── world lines + first-run tips ────────────────────────────────────────────────────────────────────────────
  const sayOnce = (key: string, line: Line, requires?: string) => {
    if (requires && !document.querySelector(requires)) return; // the feature it talks about isn't on the page yet
    if (store.getState().byte.said.includes(key)) return;
    if (narrow.matches || bubbleOverGame()) {
      if (minimized || tucked || pending.some((p) => p.key === key)) return;
      pending.push({ key, line });
      if (pending.length > 3) pending.shift();
      syncPending();
      react("surprised", 900);
      return;
    }
    if (say(line)) store.getState().markByteSaid(key);
  };
  const tipTimes = [5000, 17000, 29000];
  const scheduleTips = () =>
    script.tips
      .filter((t) => !store.getState().byte.said.includes(t.key))
      .forEach((tip, i) => later(() => sayOnce(tip.key, { text: tip.text, mood: tip.mood, ms: 3800 }, tip.requires), tipTimes[Math.min(i, tipTimes.length - 1)]));
  // the tips start once the boot screen is gone (PART 5) — nobody can read BYTE behind it
  if (document.documentElement.hasAttribute("data-boot")) {
    const offBoot = bus.on("boot:done", () => {
      offBoot();
      scheduleTips();
    });
    offs.push(offBoot);
  } else scheduleTips();

  offs.push(
    bus.on("world:enter", ({ id }) => {
      const line = script.worldLines[id as WorldId];
      if (!line) return;
      // only about a world the visitor stays in: a jump or a fast scroll passing through says nothing (and the line
      // stays unsaid for a real visit)
      later(() => {
        if (document.documentElement.getAttribute("data-world") === id) sayOnce(`world:${id}`, { text: line.text, mood: line.mood }, line.requires);
      }, 650);
    }),
    bus.on("byte:say", ({ text, mood: m, ms, now }) => {
      if (now) sayNow({ text, mood: m, ms });
      else say({ text, mood: m, ms });
    }),
    bus.on("byte:react", ({ mood: m }) => react(m)),
    bus.on("byte:point", ({ selector }) => point(selector)),
    bus.on("byte:visit", ({ selector, text }) => visit(selector, text)),
    bus.on("achievement:unlocked", () => react("happy", 1400)),
    bus.on("coin:collected", () => react("love", 1400)),
    bus.on("level:up", () => react("cool", 2200)),
    bus.on("cursor:shake", ({ x, y }) => {
      lookAt = { x, y, until: performance.now() + 1500 };
      queueEyes();
      react("surprised", 1200);
    }),
    bus.on("cursor:locate", () => react("surprised", 1000)),
    store.subscribe((s, prev) => {
      if (s.byte.minimized !== prev.byte.minimized && s.byte.minimized !== minimized) setMinimized(s.byte.minimized, false);
    }),
  );

  // ── global listeners ────────────────────────────────────────────────────────────────────────────────────────
  listen(
    window,
    "pointermove",
    (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      onInput();
      queueEyes();
    },
    { passive: true },
  );
  listen(window, "keydown", onInput);
  listen(window, "pointerdown", onInput, { passive: true });
  listen(
    window,
    "scroll",
    () => {
      onInput();
      if (visiting) endVisit(); // the target scrolled away: go home
      avoidSoon(200);
    },
    { passive: true },
  );
  let resizeTimer = 0;
  listen(window, "resize", () => {
    cancel(resizeTimer);
    resizeTimer = later(() => {
      home = homeFromSave();
      const b = bounds();
      pos = { x: clamp(pos.x, b.minX, b.maxX), y: clamp(pos.y, b.minY, b.maxY) };
      render(false);
      avoid(false);
    }, 200);
  });
  const layoutObserver = new ResizeObserver(() => avoidSoon(320));
  layoutObserver.observe(document.body);

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────────
  setMood("idle");
  bot.setAttribute("aria-label", minimized ? "Bring BYTE back" : LABEL);
  root.toggleAttribute("data-minimized", minimized);
  render(false);
  requestAnimationFrame(() => root.setAttribute("data-ready", ""));
  later(() => avoid(true), 500);
  blinkLoop();

  return () => {
    timers.forEach((id) => window.clearTimeout(id));
    timers.clear();
    window.clearInterval(sleepTimer);
    cancelAnimationFrame(eyeRaf);
    cancelAnimationFrame(flightRaf);
    cancelAnimationFrame(scrollFrame);
    cancel(visitTimer);
    layoutObserver.disconnect();
    offs.forEach((off) => off());
  };
}
