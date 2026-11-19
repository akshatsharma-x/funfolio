// PART 16 · the eggs' effects — imperative, self-cleaning DOM on a fixed layer, loaded by the EggProvider on first
// use (its own chunk). Each one is bounded (≤ 3s; the coffee steam 5s), aria-hidden, and lets clicks through
// (pointer-events: none) — except the bugs, which are there to be squashed. Matter.js loads only for the letter rain.
// Callers decide what runs at all (data-fx, reduced motion, Speedrun Mode); the effects only draw.

import { pixelIconPaths, type PixelIconName } from "@/components/ui/PixelIcon";
import { READ } from "@/components/fx/readZones";
import { fx } from "@/lib/juice";
import { sfx } from "@/lib/sfx";

const SVG = "http://www.w3.org/2000/svg";
const RAINBOW = ["#FF3D8B", "#FF8A1F", "#FFD23F", "#B6FF3B", "#2EE59D", "#22D3EE", "#A78BFA"];

/** A fixed, click-through, aria-hidden layer for one effect; `done()` removes it. */
function layer(kind: string) {
  const el = document.createElement("div");
  el.className = "egg-layer";
  el.dataset.egg = kind;
  el.setAttribute("aria-hidden", "true");
  document.body.append(el);
  return { el, done: () => el.remove() };
}

/** A pixel icon as an SVG element (runtime DOM — the same paths PixelIcon draws). */
export function pixelSvg(name: PixelIconName, size: number): SVGSVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("shape-rendering", "crispEdges");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  for (const p of pixelIconPaths(name)) {
    const path = document.createElementNS(SVG, "path");
    path.setAttribute("d", p.d);
    path.setAttribute("fill", p.color);
    svg.append(path);
  }
  return svg;
}

const center = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

// ── the four corners ─────────────────────────────────────────────────────────────────────────────────────────────
/** Top-left: the HUD logo (BYTE's icon + AKSHAT.EXE) flips like a coin. */
export async function flipLogo(reduced: boolean): Promise<void> {
  const parts = [...document.querySelectorAll<HTMLElement>(".hud__byte, .hud__brand")].filter((e) => e.getClientRects().length);
  if (!parts.length) return;
  sfx.play("clink", { pitch: 1.2 });
  const c = center(parts[0]);
  if (reduced) {
    await Promise.all(parts.map((p) => p.animate([{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }], { duration: 500 }).finished.catch(() => {})));
    return;
  }
  fx.burst(c.x, c.y + 8, { shape: "coin", count: 6 });
  await Promise.all(
    parts.map((p) =>
      p.animate([{ transform: "perspective(300px) rotateY(0deg)" }, { transform: "perspective(300px) rotateY(720deg) scale(1.15)", offset: 0.75 }, { transform: "perspective(300px) rotateY(720deg)" }], { duration: 950, easing: "cubic-bezier(.2,.7,.3,1)" }).finished.catch(() => {}),
    ),
  );
}

/** Bottom-left: a pixel door creaks open on the dev room (desk, CRT, mug, rubber duck), then shuts. */
export async function devRoom(reduced: boolean): Promise<void> {
  const { el, done } = layer("dev-room");
  el.innerHTML = `
    <div class="egg-door">
      <svg class="egg-door__room" viewBox="0 0 64 48" shape-rendering="crispEdges">
        <rect width="64" height="48" fill="#1A1535"/>
        <rect y="38" width="64" height="10" fill="#251E4A"/>
        <rect x="6" y="6" width="14" height="10" fill="#2EE59D"/><rect x="8" y="9" width="10" height="1" fill="#07060F"/><rect x="8" y="12" width="6" height="1" fill="#07060F"/>
        <rect x="26" y="14" width="22" height="16" fill="#07060F"/><rect x="28" y="16" width="18" height="12" fill="#0B3D2E"/>
        <rect x="30" y="18" width="9" height="1" fill="#2EE59D"/><rect x="30" y="21" width="13" height="1" fill="#22D3EE"/><rect x="30" y="24" width="6" height="1" fill="#FFD23F"/>
        <rect x="35" y="30" width="4" height="3" fill="#07060F"/><rect x="18" y="33" width="38" height="3" fill="#C98A00"/><rect x="20" y="36" width="2" height="8" fill="#C98A00"/><rect x="52" y="36" width="2" height="8" fill="#C98A00"/>
        <rect x="50" y="27" width="5" height="6" fill="#FF3D8B"/><rect x="55" y="28" width="2" height="3" fill="#FF3D8B"/><rect x="51" y="23" width="1" height="3" fill="#B9B2D9"/><rect x="53" y="22" width="1" height="3" fill="#B9B2D9"/>
        <rect x="21" y="28" width="6" height="5" fill="#FFD23F"/><rect x="25" y="26" width="4" height="4" fill="#FFD23F"/><rect x="29" y="28" width="2" height="1" fill="#FF8A1F"/><rect x="26" y="27" width="1" height="1" fill="#07060F"/>
      </svg>
      <span class="egg-door__label">DEV ROOM · keep out (unless curious)</span>
      <span class="egg-door__panel"></span>
    </div>`;
  const panel = el.querySelector<HTMLElement>(".egg-door__panel");
  const door = el.querySelector<HTMLElement>(".egg-door");
  sfx.play("open", { pitch: 0.55 });
  if (!panel || !door) return done();
  const open = reduced ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: "perspective(400px) rotateY(0deg)" }, { transform: "perspective(400px) rotateY(-102deg)" }];
  door.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: "forwards" });
  await panel.animate(open, { duration: reduced ? 200 : 560, easing: "cubic-bezier(.3,1.4,.5,1)", fill: "forwards" }).finished.catch(() => {});
  await wait(1500);
  sfx.play("close", { pitch: 0.6 });
  await panel.animate([...open].reverse(), { duration: reduced ? 200 : 380, easing: "ease-in", fill: "forwards" }).finished.catch(() => {});
  await door.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" }).finished.catch(() => {});
  done();
}

// ── CHEAT ACTIVATED ──────────────────────────────────────────────────────────────────────────────────────────────
/** The banner (and, when the FX level allows, a rain of coins). */
export async function cheatBanner(coinRain: boolean, reduced: boolean): Promise<void> {
  const { el, done } = layer("cheat");
  const t = document.createElement("p");
  t.className = "egg-cheat";
  t.textContent = "CHEAT ACTIVATED";
  el.append(t);
  sfx.play("powerUp");
  if (coinRain) fx.confetti({ style: "coins" });
  await t
    .animate(reduced ? [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }] : [{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: "scale(1.08)", offset: 0.18 }, { opacity: 1, transform: "scale(1)", offset: 0.3 }, { opacity: 1, transform: "scale(1)", offset: 0.82 }, { opacity: 0, transform: "scale(1.2)" }], { duration: 1800, easing: "ease-out" })
    .finished.catch(() => {});
  done();
}

// ── typed words ──────────────────────────────────────────────────────────────────────────────────────────────────
/** "akshat": the letters rain down and bounce as physics blocks (Matter.js, lazy), then fade. ~2.8s. */
export async function letterRain(word = "AKSHAT"): Promise<void> {
  const { default: Matter } = await import("matter-js");
  const { el, done } = layer("letters");
  const W = window.innerWidth;
  const H = window.innerHeight;
  const size = Math.max(40, Math.min(64, Math.round(W / 16)));
  const engine = Matter.Engine.create({ gravity: { x: 0, y: 1, scale: 0.0012 } });
  const wall = { isStatic: true, restitution: 0.2 };
  Matter.Composite.add(engine.world, [
    Matter.Bodies.rectangle(W / 2, H + 30, W * 2, 60, wall),
    Matter.Bodies.rectangle(-30, H / 2, 60, H * 3, wall),
    Matter.Bodies.rectangle(W + 30, H / 2, 60, H * 3, wall),
  ]);
  const span = Math.min(W - size * 2, size * 1.6 * word.length);
  const blocks = [...word].map((ch, i) => {
    const x = W / 2 - span / 2 + (span / Math.max(1, word.length - 1)) * i + (Math.random() - 0.5) * 20;
    const body = Matter.Bodies.rectangle(x, -size * (1 + i * 0.6), size, size, { restitution: 0.55, friction: 0.3, angle: (Math.random() - 0.5) * 0.6, chamfer: { radius: 6 } });
    Matter.Composite.add(engine.world, body);
    const b = document.createElement("span");
    b.className = "egg-letter";
    b.textContent = ch;
    b.style.width = b.style.height = `${size}px`;
    b.style.background = RAINBOW[i % RAINBOW.length];
    el.append(b);
    return { body, b };
  });
  const t0 = performance.now();
  let last = t0;
  let bumped = 0;
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const steps = Math.min(4, Math.max(1, Math.round((now - last) / (1000 / 60))));
      last = now;
      for (let s = 0; s < steps; s++) Matter.Engine.update(engine, 1000 / 60);
      for (const { body, b } of blocks) b.style.transform = `translate(${(body.position.x - size / 2).toFixed(1)}px, ${(body.position.y - size / 2).toFixed(1)}px) rotate(${body.angle.toFixed(3)}rad)`;
      const landed = blocks.filter(({ body }) => body.position.y > H - size * 1.2).length;
      if (landed > bumped) {
        bumped = landed;
        sfx.play("thud", { pitch: 1.4 + landed * 0.05, volume: 0.5 });
      }
      if (now - t0 < 2400) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
  await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" }).finished.catch(() => {});
  Matter.Engine.clear(engine);
  done();
}

/** "bug": three bugs scurry across the screen (~2.8s); click one to squash it. A pointer toy: nothing to miss. */
export function bugs(onSquash: (x: number, y: number) => void): Promise<void> {
  const { el, done } = layer("bugs");
  const W = window.innerWidth;
  const H = window.innerHeight;
  const runs = [0, 1, 2].map((i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "egg-bug";
    b.tabIndex = -1;
    b.setAttribute("aria-hidden", "true");
    b.append(pixelSvg("bug", 32));
    el.append(b);
    const ltr = Math.random() < 0.5;
    const y0 = H * (0.25 + i * 0.22) + (Math.random() - 0.5) * 60;
    const wob = 24 + Math.random() * 30;
    const frames: Keyframe[] = Array.from({ length: 9 }, (_, k) => {
      const t = k / 8;
      const x = ltr ? -40 + (W + 80) * t : W + 40 - (W + 80) * t;
      const y = y0 + Math.sin(t * Math.PI * 3 + i) * wob;
      return { transform: `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px) rotate(${ltr ? 90 : -90}deg)` };
    });
    const anim = b.animate(frames, { duration: 2600 + i * 200, delay: i * 140, easing: "linear", fill: "both" });
    let squashed = false;
    b.addEventListener("pointerdown", (e) => {
      if (squashed) return;
      squashed = true;
      e.preventDefault();
      // freeze it where it was hit (keep the transform, end the run — a paused run would never finish)
      b.style.transform = getComputedStyle(b).transform;
      anim.cancel();
      b.classList.add("egg-bug--squashed");
      const r = b.getBoundingClientRect();
      onSquash(r.left + r.width / 2, r.top + r.height / 2);
      b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, delay: 250, fill: "forwards" });
    });
    return anim.finished.catch(() => {});
  });
  return Promise.all(runs).then(async () => {
    await wait(700); // the last splat fades
    done();
  });
}

/** "coffee": steam rises from the pointer for `ms` (5s). Wisps skip reading text (R6). */
export function coffeeSteam(ms: number, start: { x: number; y: number } | null): Promise<void> {
  const { el, done } = layer("steam");
  let pos = start ?? { x: window.innerWidth / 2, y: window.innerHeight * 0.6 };
  let overText = false;
  const onMove = (e: PointerEvent) => {
    pos = { x: e.clientX, y: e.clientY };
    overText = !!(e.target instanceof Element && e.target.closest(READ));
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  let alive = 0;
  const puff = () => {
    if (overText || alive > 24) return;
    const w = document.createElement("span");
    w.className = "egg-steam";
    const dx = (Math.random() - 0.5) * 10;
    w.style.left = `${pos.x - 9 + dx}px`;
    w.style.top = `${pos.y - 26}px`;
    el.append(w);
    alive++;
    w.animate(
      [
        { transform: "translateY(0) scale(.6)", opacity: 0 },
        { transform: "translateY(-10px) scale(.9)", opacity: 0.75, offset: 0.25 },
        { transform: `translate(${(Math.random() - 0.5) * 18}px, -44px) scale(1.5)`, opacity: 0 },
      ],
      { duration: 1100, easing: "ease-out" },
    ).finished.finally(() => {
      w.remove();
      alive--;
    });
  };
  const timer = window.setInterval(puff, 110);
  return wait(ms).then(async () => {
    window.clearInterval(timer);
    window.removeEventListener("pointermove", onMove);
    await wait(1150);
    done();
  });
}

// ── hidden coins: spin-in, sparkle, a flight to the HUD, the chip bumps ──────────────────────────────────────────
export async function coinCeremony(origin: { x: number; y: number } | undefined, reduced: boolean): Promise<void> {
  const chip = document.querySelector<HTMLElement>(".hud__right .hud-chip");
  const bump = () =>
    chip?.animate(reduced ? [{ boxShadow: "0 0 0 0 #FFC83D" }, { boxShadow: "0 0 0 6px #FFC83D66" }, { boxShadow: "0 0 0 0 #FFC83D" }] : [{ transform: "scale(1)" }, { transform: "scale(1.28)", offset: 0.4 }, { transform: "scale(1)" }], { duration: 420, easing: "cubic-bezier(.3,1.6,.5,1)" });
  if (reduced || !origin || !chip) {
    bump();
    return;
  }
  const { el, done } = layer("coin");
  const coin = document.createElement("span");
  coin.className = "egg-coin";
  coin.append(pixelSvg("coin", 40));
  coin.style.left = `${origin.x - 20}px`;
  coin.style.top = `${origin.y - 20}px`;
  el.append(coin);
  fx.burst(origin.x, origin.y, { shape: "star", count: 8 });
  await coin.animate([{ transform: "scale(.2) rotateY(0deg)", opacity: 0 }, { transform: "scale(1.25) rotateY(540deg)", opacity: 1, offset: 0.7 }, { transform: "scale(1) rotateY(720deg)", opacity: 1 }], { duration: 520, easing: "cubic-bezier(.2,.8,.3,1)" }).finished.catch(() => {});
  const to = center(chip);
  await coin.animate([{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${to.x - origin.x}px, ${to.y - origin.y}px) scale(.45)`, opacity: 0.9 }], { duration: 460, easing: "cubic-bezier(.5,0,.6,1)", fill: "forwards" }).finished.catch(() => {});
  done();
  bump();
}

// ── milestones ───────────────────────────────────────────────────────────────────────────────────────────────────
/** A mini fanfare: three notes and a burst of stars under the HUD (never on text — the burst sits at the top edge). */
export function fanfare(reduced: boolean): void {
  sfx.play("fanfare");
  if (!reduced) fx.burst(window.innerWidth / 2, 80, { shape: "star", count: 14 });
}
