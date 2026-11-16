// The Launchpad's own canvas renderer (PART 7) — our look, not Matter's debug view: a dark game screen in every theme
// (like the LED tickers), lime as the world's lead color (R8), ink outlines, pixel labels. Draws in world units.

import { ANCHOR, BUG_R, BYTE_R, COIN, CRATE, CRATE_TEXT, crateText, PYLONS, WORLD } from "./level";
import type { Bug, LaunchpadSim, Mood, Vec } from "./sim";

const INK = "#07060F";
const CREAM = "#FFF4E0";
const LIME = "#B6FF3B";
const YELLOW = "#FFD23F";
const RED = "#FF4D4D";
const PINK = "#FF3D8B";
const CYAN = "#22D3EE";
const GOLD = "#FFC83D";
const GOLD_HI = "#FFF1A8";
const GOLD_SH = "#C98A00";

export type Scene = {
  sim: LaunchpadSim;
  /** BYTE in the launcher (aiming) — where it is drawn; null while it flies (drawn from its body). */
  held: Vec | null;
  dots: Vec[] | null;
  /** ms clock for the idle animation (bug jitter, coin spin); frozen under reduced motion. */
  time: number;
  font: string;
  /** The crates have flown off to the Quest Log heading (DOM overlays) — don't draw them twice. */
  cratesLifted?: boolean;
};

const hexToRgb = (h: string) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)}, ${Math.round(g1 + (g2 - g1) * t)}, ${Math.round(b1 + (b2 - b1) * t)})`;
}
/** Band color by tension: lime → yellow → red. */
export const bandColor = (t: number) => (t < 0.5 ? mix(LIME, YELLOW, t / 0.5) : mix(YELLOW, RED, (t - 0.5) / 0.5));

const hash = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const STARS = Array.from({ length: 34 }, (_, i) => ({ x: Math.round(hash(i) * WORLD.w), y: 30 + Math.round(hash(i + 100) * 460), s: 2 + (i % 3), p: i * 0.7 }));

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function backdrop(ctx: CanvasRenderingContext2D, time: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD.h);
  sky.addColorStop(0, "#0B0920");
  sky.addColorStop(0.72, "#17112F");
  sky.addColorStop(1, "#0B0920");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  ctx.strokeStyle = "rgba(182, 255, 59, 0.06)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= WORLD.w; x += 50) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD.groundY);
  }
  for (let y = 0; y <= WORLD.groundY; y += 50) {
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD.w, y);
  }
  ctx.stroke();
  for (const s of STARS) {
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time / 700 + s.p) ** 2;
    ctx.fillStyle = CREAM;
    ctx.fillRect(s.x, s.y, s.s, s.s);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#0F1A0A";
  ctx.fillRect(0, WORLD.groundY, WORLD.w, WORLD.h - WORLD.groundY);
  ctx.save();
  ctx.shadowColor = LIME;
  ctx.shadowBlur = 16;
  ctx.fillStyle = LIME;
  ctx.fillRect(0, WORLD.groundY - 2, WORLD.w, 5);
  ctx.restore();
  ctx.fillStyle = "rgba(182, 255, 59, 0.16)";
  for (let x = 20; x < WORLD.w; x += 80) ctx.fillRect(x, WORLD.groundY + 22, 36, 6);
}

function pylon(ctx: CanvasRenderingContext2D, x: number, top: number) {
  ctx.fillStyle = "#1A2810";
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 4;
  ctx.fillRect(x - 8, top, 16, WORLD.groundY - top);
  ctx.strokeRect(x - 8, top, 16, WORLD.groundY - top);
  ctx.save();
  ctx.shadowColor = LIME;
  ctx.shadowBlur = 22;
  ctx.fillStyle = LIME;
  circle(ctx, x, top, 12);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  circle(ctx, x, top, 12);
  ctx.stroke();
}

function band(ctx: CanvasRenderingContext2D, from: Vec, to: Vec, tension: number) {
  ctx.save();
  const color = bandColor(tension);
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.lineWidth = 7 - tension * 4.5; // the laser band thins as it stretches
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function crate(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, label: string, font: string) {
  const h = CRATE / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = CREAM;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(-h, -h, CRATE, CRATE, 9);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(7, 6, 15, 0.16)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-h + 8, -h + 22);
  ctx.lineTo(h - 8, -h + 22);
  ctx.moveTo(-h + 8, h - 22);
  ctx.lineTo(h - 8, h - 22);
  ctx.stroke();
  ctx.fillStyle = LIME;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.fillRect(-h + 5, -17, CRATE - 10, 34);
  ctx.strokeRect(-h + 5, -17, CRATE - 10, 34);
  for (const [bx, by] of [
    [-h + 9, -h + 9],
    [h - 9, -h + 9],
    [-h + 9, h - 9],
    [h - 9, h - 9],
  ]) {
    ctx.fillStyle = INK;
    ctx.fillRect(bx - 3, by - 3, 6, 6);
  }
  const text = crateText(label);
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${CRATE_TEXT.weight} ${text.size}px ${font}`;
  for (const line of text.lines) ctx.fillText(line.text, 0, line.y, CRATE_TEXT.maxWidth);
  ctx.restore();
}

function bug(ctx: CanvasRenderingContext2D, b: Bug, look: Vec | null, time: number) {
  const p = b.body.position;
  const r = BUG_R;
  const frame = Math.floor(time / 90 + b.seed * 13); // ~11 glitches a second
  const jx = ((frame * 7) % 3) - 1;
  const jy = ((frame * 5) % 3) - 1;
  const split = (frame + Math.round(b.seed * 10)) % 17 === 0; // an occasional RGB split
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(b.body.angle * 0.5);
  // antennae
  const wob = Math.sin(time / 160 + b.seed) * 3;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, -r + 6);
  ctx.lineTo(-14 + wob, -r - 14);
  ctx.moveTo(8, -r + 6);
  ctx.lineTo(14 + wob, -r - 14);
  ctx.stroke();
  for (const ax of [-14 + wob, 14 + wob]) {
    ctx.fillStyle = LIME;
    circle(ctx, ax, -r - 16, 5);
    ctx.fill();
    ctx.stroke();
  }
  if (split) {
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = PINK;
    circle(ctx, -4, 0, r);
    ctx.fill();
    ctx.fillStyle = CYAN;
    circle(ctx, 4, 0, r);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // body with a jittery (glitching) outline
  ctx.fillStyle = LIME;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r + (((frame + i * 3) % 4 === 0 ? 2 : 0) - 1);
    const x = jx + Math.cos(a) * rr;
    const y = jy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // eyes that track BYTE
  let ex = 0;
  let ey = 0;
  if (look) {
    const dx = look.x - p.x;
    const dy = look.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    ex = (dx / d) * 3;
    ey = (dy / d) * 3;
  }
  for (const side of [-1, 1]) {
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.ellipse(side * 9, -4, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = INK;
    circle(ctx, side * 9 + ex, -4 + ey, 3.4);
    ctx.fill();
  }
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 8, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

/** BYTE curled into a ball: cream shell, CRT face — scared while pulled, thrilled in flight, dizzy after impact. */
export function byteBall(ctx: CanvasRenderingContext2D, at: Vec, angle: number, mood: Mood) {
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.rotate(angle);
  ctx.fillStyle = CREAM;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  circle(ctx, 0, 0, BYTE_R);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#141026";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-19, -14, 38, 27, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CYAN;
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  if (mood === "scared") {
    circle(ctx, -8, -3, 4.5);
    ctx.fill();
    circle(ctx, 8, -3, 4.5);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 7, 2.8, 0, Math.PI * 2);
    ctx.stroke();
  } else if (mood === "thrilled") {
    ctx.beginPath();
    ctx.moveTo(-12, -1);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-4, -1);
    ctx.moveTo(4, -1);
    ctx.lineTo(8, -6);
    ctx.lineTo(12, -1);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 3, 7, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  } else if (mood === "dizzy") {
    for (const sx of [-8, 8]) {
      ctx.beginPath();
      ctx.moveTo(sx - 4, -7);
      ctx.lineTo(sx + 4, 1);
      ctx.moveTo(sx + 4, -7);
      ctx.lineTo(sx - 4, 1);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-7, 8);
    ctx.quadraticCurveTo(-3, 5, 0, 8);
    ctx.quadraticCurveTo(3, 11, 7, 8);
    ctx.stroke();
  } else {
    ctx.fillRect(-11, -6, 6, 6);
    ctx.fillRect(5, -6, 6, 6);
    ctx.fillRect(-5, 6, 10, 3);
  }
  // the antenna bulb glows in the world color
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -BYTE_R + 1);
  ctx.lineTo(0, -BYTE_R - 9);
  ctx.stroke();
  ctx.fillStyle = LIME;
  circle(ctx, 0, -BYTE_R - 12, 5);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function coin(ctx: CanvasRenderingContext2D, time: number) {
  const bob = Math.sin(time / 420) * 6;
  const sx = Math.max(0.22, Math.abs(Math.cos(time / 380)));
  ctx.save();
  ctx.translate(COIN.x, COIN.y + bob);
  ctx.shadowColor = GOLD;
  ctx.shadowBlur = 18;
  ctx.scale(sx, 1);
  ctx.fillStyle = GOLD;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  circle(ctx, 0, 0, COIN.r);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.strokeStyle = GOLD_SH;
  ctx.lineWidth = 3;
  circle(ctx, 0, 0, COIN.r - 9);
  ctx.stroke();
  ctx.fillStyle = GOLD_HI;
  ctx.fillRect(-9, -15, 6, 10);
  ctx.restore();
}

export function drawScene(ctx: CanvasRenderingContext2D, scene: Scene) {
  const { sim, held, dots, time, font } = scene;
  backdrop(ctx, time);
  pylon(ctx, PYLONS[0].x, PYLONS[0].top);
  const tips = PYLONS.map((p) => ({ x: p.x, y: p.top }));
  const tension = held ? sim.power : 0;
  if (held) band(ctx, tips[0], held, tension);
  else band(ctx, tips[0], tips[1], 0);
  for (const c of scene.cratesLifted ? [] : sim.crates) {
    const p = c.body.position;
    if (p.y < WORLD.h + 80 && p.x > -100 && p.x < WORLD.w + 100) crate(ctx, p.x, p.y, c.body.angle, c.label, font);
  }
  const look = held ?? (sim.byte ? sim.byte.position : { x: ANCHOR.x, y: ANCHOR.y });
  for (const b of sim.bugs) if (!b.popped) bug(ctx, b, look, time);
  if (sim.coin) coin(ctx, time);
  if (dots) {
    dots.forEach((d, i) => {
      ctx.globalAlpha = 1 - (i / dots.length) * 0.85;
      ctx.fillStyle = LIME;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      circle(ctx, d.x, d.y, Math.max(3, 7 - i * 0.32));
      ctx.fill();
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }
  if (held) byteBall(ctx, held, 0, sim.mood);
  else if (sim.byte) byteBall(ctx, sim.byte.position, sim.byte.angle, sim.mood);
  pylon(ctx, PYLONS[1].x, PYLONS[1].top);
  if (held) band(ctx, tips[1], held, tension);
}
