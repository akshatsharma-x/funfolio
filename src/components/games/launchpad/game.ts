// The Launchpad controller (PART 7, lazy chunk): canvas, fixed-timestep loop, pointer/touch/keyboard input, juice.
// Rules live in sim.ts, drawing in draw.ts. Frames run only while something moves (drag, flight, settling); at rest
// a slow 10fps "glitch" tick animates the bugs — off under reduced motion, in the idle nap, off screen and paused.

import { bus } from "@/lib/bus";
import { command } from "@/lib/commands";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { fx } from "@/lib/juice";
import { sfx } from "@/lib/sfx";
import { useSave } from "@/lib/store";
import { drawScene } from "./draw";
import { ANCHOR, BIG_HIT, CRATE, CRATE_TEXT, PHYSICS, WORLD } from "./level";
import { LaunchpadSim, previewDots, type Phase, type Vec } from "./sim";

export type HudState = { shots: number; score: number; best: number | null; phase: Phase; bugsLeft: number; bugs: number; angle: number; power: number };
export type RoundResult = { cleared: boolean; score: number; best: number; newBest: boolean; popped: number; total: number };
export type CrateSnap = { x: number; y: number; w: number; h: number; angle: number; label: string };
export type LaunchpadController = {
  reset(): void;
  /** Screen rects of the crates still on the stage — and stop drawing them (they fly off as DOM overlays). */
  liftCrates(): CrateSnap[];
  destroy(): void;
};
export type LaunchpadOptions = {
  /** The game screen (focusable): the canvas goes in here; keyboard controls listen on it. */
  screen: HTMLElement;
  /** The grab handle over BYTE (touch-action: none) — the only place a drag starts, so swipes elsewhere scroll. */
  handle: HTMLElement;
  onHud: (h: HudState) => void;
  onEnd: (r: RoundResult) => void;
  onAnnounce: (text: string) => void;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const ARROWS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

export function startLaunchpad({ screen, handle, onHud, onEnd, onAnnounce }: LaunchpadOptions): LaunchpadController {
  const canvas = document.createElement("canvas");
  canvas.className = "lp__canvas";
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { reset() {}, liftCrates: () => [], destroy() {} };
  screen.prepend(canvas);
  const root = document.documentElement;
  const font = getComputedStyle(root).getPropertyValue("--font-body").trim() || "sans-serif"; // crate labels (CRATE_TEXT)
  const reduced = () => prefersReducedMotion();
  const coinTaken = () => useSave.getState().player.coinIds.includes("bug-fortress");
  const best = () => useSave.getState().games.highScores.launchpad ?? null;

  let scale = 1;
  let dpr = 1;
  const toPage = (p: Vec) => {
    const r = canvas.getBoundingClientRect();
    return { x: r.left + p.x * scale, y: r.top + p.y * scale };
  };

  // ── the simulation + its juice ──────────────────────────────────────────────────────────────────────────────
  let freezeUntil = 0;
  const sim: LaunchpadSim = new LaunchpadSim(
    {
      pop: (at, points) => {
        const p = toPage(at);
        fx.burst(p.x, p.y, { count: 16 });
        fx.text(p.x, p.y - 18, `+${points}`, { color: "#B6FF3B", size: 20, font: "display" });
        sfx.play("pop", { pitch: 0.9 + Math.random() * 0.25 });
        hud();
      },
      topple: (at, points) => {
        const p = toPage(at);
        fx.text(p.x, p.y - 10, `+${points}`, { color: "#FFF4E0", size: 14, rise: 22, font: "display" });
        hud();
      },
      hit: (speed) => {
        sfx.play("thud", { volume: clamp(speed / 12, 0.25, 1), pitch: clamp(1.25 - speed / 18, 0.6, 1.25) });
        if (speed > BIG_HIT && !reduced()) {
          freezeUntil = performance.now() + 60; // hit-stop (the sim pauses; FX too)
          void fx.hitStop(60);
          fx.shake(4, screen); // games only — the playfield shakes, never the page (R6)
        }
      },
      coin: (at) => {
        const p = toPage(at);
        command({ type: "coin", id: "bug-fortress", origin: p });
        fx.burst(p.x, p.y, { shape: "coin", count: 10 });
      },
      launch: () => {
        command({ type: "achievement", id: "launch-day" }); // first launch ever (unlock is once per save)
        sfx.play("whoosh");
        hud();
      },
      shotEnd: (shot, popped) => onAnnounce(`Shot ${shot} of 3: ${popped ? `${popped} bug${popped === 1 ? "" : "s"} popped` : "no bugs this time"}. Score ${sim.score}.`),
      end: (cleared) => {
        const { best: newBest, highScore } = useSave.getState().recordScore("launchpad", sim.score);
        if (cleared) {
          command({ type: "achievement", id: "exterminator" });
          if (!reduced()) fx.confetti({ style: "coins" });
          sfx.play("win");
        } else sfx.play("powerUp");
        onEnd({ cleared, score: sim.score, best: highScore, newBest: newBest && sim.score > 0, popped: sim.bugs.length - sim.bugsLeft, total: sim.bugs.length });
        hud();
      },
    },
    { coinTaken: coinTaken() },
  );
  sim.aim(40, 0);

  const hud = () =>
    onHud({ shots: sim.shots, score: sim.score, best: best(), phase: sim.phase, bugsLeft: sim.bugsLeft, bugs: sim.bugs.length, angle: Math.round(sim.angle), power: Math.round(sim.power * 100) });

  // ── drawing ─────────────────────────────────────────────────────────────────────────────────────────────────
  let dragging = false;
  let aimed = false; // the visitor has started aiming (dots show)
  let cratesLifted = false;
  let time = 0;
  const render = (now = performance.now()) => {
    if (!reduced()) time = now;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    const aiming = sim.phase === "aim";
    const { start, v0 } = sim.shot();
    const showDots = aiming && aimed && sim.power >= PHYSICS.minPower;
    drawScene(ctx, { sim, held: aiming ? start : null, dots: showDots ? previewDots(start, v0) : null, time, font, cratesLifted });
  };
  const resize = () => {
    const r = screen.getBoundingClientRect();
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    scale = r.width / WORLD.w;
    render();
  };

  // ── the loop: one Engine.update per 1000/60 ms, frames only while something moves ───────────────────────────
  let raf = 0;
  let last = 0;
  let acc = 0;
  let idleTimer = 0;
  let visible = true;
  let paused = false;
  const moving = () => dragging || sim.busy || performance.now() < freezeUntil;
  const frame = (now: number) => {
    raf = 0;
    const dt = last ? Math.min(100, now - last) : PHYSICS.dt;
    last = now;
    if (now >= freezeUntil) {
      acc += dt;
      let n = 0;
      while (acc >= PHYSICS.dt && n < 6) {
        sim.step();
        acc -= PHYSICS.dt;
        n += 1;
      }
      if (n === 6) acc = 0; // fell behind (a long frame): drop the backlog instead of fast-forwarding
    }
    render(now);
    schedule();
  };
  const schedule = () => {
    window.clearTimeout(idleTimer);
    if (!visible || paused) return;
    if (moving()) {
      if (!raf) raf = requestAnimationFrame(frame);
      return;
    }
    last = 0;
    acc = 0;
    if (!reduced() && !root.hasAttribute("data-idle"))
      idleTimer = window.setTimeout(() => {
        render();
        schedule();
      }, 100);
  };
  const wake = () => {
    if (visible && !paused && !raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  // ── pointer / touch: drag BYTE back inside the pull radius, release to launch ───────────────────────────────
  let dragId = -1;
  let lastStretch = 0;
  const pullRange = () => Math.max(PHYSICS.pullMax, 88 / scale); // a full pull is ≥ 88 screen px, even on a phone
  const stretch = () => {
    if (Math.abs(sim.power - lastStretch) < 0.08) return;
    lastStretch = sim.power;
    sfx.play("stretch", { pitch: 0.7 + sim.power * 0.9 }); // pitch follows the pull
  };
  const dragTo = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const dx = (e.clientX - r.left) / scale - ANCHOR.x;
    const dy = (e.clientY - r.top) / scale - ANCHOR.y;
    const dist = Math.hypot(dx, dy);
    const angle = dist < 4 ? sim.angle : (Math.atan2(dy, Math.max(-dx, 1)) * 180) / Math.PI; // launch = opposite the pull
    sim.aim(angle, Math.min(1, dist / pullRange()));
    stretch();
    hud();
  };
  const onDown = (e: PointerEvent) => {
    if (sim.phase !== "aim" || sim.shots <= 0 || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    dragging = true;
    aimed = true;
    dragId = e.pointerId;
    screen.setAttribute("data-dragging", "");
    dragTo(e);
    wake();
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== dragId) return;
    dragTo(e);
    wake();
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== dragId) return;
    dragging = false;
    screen.removeAttribute("data-dragging");
    if (!sim.launch()) sim.aim(sim.angle, 0); // a tiny pull just lets go
    lastStretch = 0;
    hud();
    wake();
  };
  const onCancel = (e: PointerEvent) => {
    if (e.pointerId !== dragId) return;
    dragging = false;
    screen.removeAttribute("data-dragging");
    sim.aim(sim.angle, 0);
    hud();
    wake();
  };
  handle.addEventListener("pointerdown", onDown);
  handle.addEventListener("pointermove", onMove);
  handle.addEventListener("pointerup", onUp);
  handle.addEventListener("pointercancel", onCancel);

  // ── keyboard, only while the stage has focus: ←/→ angle, ↑/↓ power, Space launch, R reset ──────────────────
  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    if (k === "r" || k === "R") {
      e.preventDefault();
      reset();
      return;
    }
    if (![...ARROWS, " ", "Enter"].includes(k)) return;
    e.preventDefault(); // focused: these keys belong to the game (unfocused, the page scrolls as usual)
    if (sim.phase !== "aim") return;
    const big = e.shiftKey;
    if (ARROWS.includes(k) && sim.power < PHYSICS.minPower) sim.aim(sim.angle, 0.7); // first arrow: a sensible pull
    aimed = true;
    if (k === "ArrowLeft") sim.aim(sim.angle + (big ? 6 : 2), sim.power);
    else if (k === "ArrowRight") sim.aim(sim.angle - (big ? 6 : 2), sim.power);
    else if (k === "ArrowUp") sim.aim(sim.angle, sim.power + (big ? 0.15 : 0.05));
    else if (k === "ArrowDown") sim.aim(sim.angle, sim.power - (big ? 0.15 : 0.05));
    else if (!sim.launch()) onAnnounce("Pull back first: up arrow adds power.");
    if (ARROWS.includes(k)) stretch();
    hud();
    wake();
  };
  const onFocus = () => screen.setAttribute("data-keyboard", "exclusive"); // only Esc stays global (docs/DECISIONS.md #28)
  const onBlur = () => screen.removeAttribute("data-keyboard");
  screen.addEventListener("keydown", onKey);
  screen.addEventListener("focus", onFocus);
  screen.addEventListener("blur", onBlur);

  // ── pause off screen, in the pause menu; the idle tick comes back after the idle nap ────────────────────────
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      render();
      schedule();
    } else {
      cancelAnimationFrame(raf);
      raf = 0;
      window.clearTimeout(idleTimer);
    }
  });
  io.observe(screen);
  const offPause = bus.on("game:pause", () => {
    paused = true;
    cancelAnimationFrame(raf);
    raf = 0;
    window.clearTimeout(idleTimer);
  });
  const offResume = bus.on("game:resume", () => {
    paused = false;
    schedule();
  });
  const idleWatch = new MutationObserver(() => {
    if (!root.hasAttribute("data-idle")) schedule();
  });
  idleWatch.observe(root, { attributes: true, attributeFilter: ["data-idle"] });
  const ro = new ResizeObserver(resize);
  ro.observe(screen);

  const reset = () => {
    sim.reset(coinTaken());
    sim.aim(40, 0);
    dragging = false;
    aimed = false;
    cratesLifted = false;
    screen.removeAttribute("data-dragging");
    hud();
    render();
    schedule();
  };

  resize();
  hud();
  schedule();
  // QA hook (inert unless a test pre-registers it): the sim + the same preview the player sees, in world units
  const qa = (window as unknown as { __QA_LAUNCHPAD?: (api: unknown) => void }).__QA_LAUNCHPAD;
  qa?.({ sim, preview: () => previewDots(sim.shot().start, sim.shot().v0), toPage, scale: () => scale });
  void document.fonts?.load(`${CRATE_TEXT.weight} ${CRATE_TEXT.one}px ${font}`).then(() => render());

  return {
    reset,
    liftCrates() {
      const r = canvas.getBoundingClientRect();
      const out = sim.crates
        .filter((c) => c.body.position.y < WORLD.h && c.body.position.x > -40 && c.body.position.x < WORLD.w + 40)
        .map((c) => ({ x: r.left + c.body.position.x * scale, y: r.top + c.body.position.y * scale, w: CRATE * scale, h: CRATE * scale, angle: c.body.angle, label: c.label }));
      cratesLifted = true;
      render();
      return out;
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      io.disconnect();
      ro.disconnect();
      idleWatch.disconnect();
      offPause();
      offResume();
      handle.removeEventListener("pointerdown", onDown);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onCancel);
      screen.removeEventListener("keydown", onKey);
      screen.removeEventListener("focus", onFocus);
      screen.removeEventListener("blur", onBlur);
      screen.removeAttribute("data-keyboard");
      canvas.remove();
    },
  };
}
