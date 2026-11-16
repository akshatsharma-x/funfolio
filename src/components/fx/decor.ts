// Floating decor (PART 4 #4): sparse parallax pixel shapes — stars, coins, plus signs, hearts, triangles — in the page
// gutters only (never behind paragraphs, R6), drifting with scroll at their own depth and leaning with scroll
// velocity. Hidden when the gutters are too narrow for them. Updates only while Lenis reports motion, so the decor
// costs nothing at rest. Not mounted under reduced motion; hidden in Speedrun Mode (CSS).

import { onScrollMotion } from "@/lib/scroll";

const SHELL_MAX = 1280;
const SHELL_PAD = 24;
const RAIL = 64; // keep clear of the level-select rail on the right edge
const MIN_GUTTER = 60;

const SHAPES: Record<string, { rows: string[]; fill: "world" | "gold" | "cream" }> = {
  star: { rows: ["..#..", ".###.", "#####", ".###.", ".#.#."], fill: "world" },
  coin: { rows: [".ggg.", "ghggd", "ghggd", "gggdd", ".gdd."], fill: "gold" },
  plus: { rows: [".#.", "###", ".#."], fill: "cream" },
  heart: { rows: [".#.#.", "#####", "#####", ".###.", "..#.."], fill: "world" },
  triangle: { rows: ["..#..", ".###.", "#####"], fill: "world" },
};
const GOLD: Record<string, string> = { g: "#FFC83D", h: "#FFF1A8", d: "#C98A00" };

function svgFor(name: string, px: number): string {
  const { rows, fill } = SHAPES[name];
  const w = rows[0].length;
  const h = rows.length;
  const color = fill === "world" ? "var(--world)" : fill === "cream" ? "#FFF4E0" : "";
  let rects = "";
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      const c = ch === "#" ? color : GOLD[ch];
      rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${c}"/>`;
    }),
  );
  return `<svg viewBox="0 0 ${w} ${h}" width="${w * px}" height="${h * px}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

/** Deterministic pseudo-random (same layout every visit). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Item = { el: HTMLElement; side: "l" | "r"; u: number; baseY: number; depth: number; spin: number; x: number };

export function startDecor(layer: HTMLElement): () => void {
  const rand = rng(20261116);
  const names = Object.keys(SHAPES);
  const items: Item[] = [];
  for (let i = 0; i < 14; i++) {
    const el = document.createElement("span");
    el.className = "fx-decor__item";
    const name = names[i % names.length];
    el.innerHTML = svgFor(name, 3 + Math.floor(rand() * 2));
    el.style.opacity = (0.35 + rand() * 0.4).toFixed(2);
    layer.append(el);
    items.push({ el, side: i % 2 ? "r" : "l", u: rand(), baseY: rand() * 2400, depth: 0.15 + rand() * 0.45, spin: rand() * 40 - 20, x: 0 });
  }

  let span = 0;
  const layout = () => {
    const vw = document.documentElement.clientWidth;
    const g = Math.max(0, (vw - SHELL_MAX) / 2) + SHELL_PAD; // distance from the viewport edge to the text column
    const ITEM = 22;
    // left zone: [8, g − 12 − item] · right zone: [vw − g + 12, vw − rail − item − 4]
    const leftRoom = g - 12 - 8 - ITEM;
    const rightRoom = g - RAIL - 16 - ITEM;
    layer.toggleAttribute("hidden", Math.max(leftRoom, rightRoom) < MIN_GUTTER - ITEM);
    span = window.innerHeight + 160;
    for (const it of items) {
      const room = it.side === "l" ? leftRoom : rightRoom;
      it.x = it.side === "l" ? 8 + it.u * Math.max(0, room) : vw - g + 12 + it.u * Math.max(0, room);
      it.el.style.display = room < 24 ? "none" : "";
    }
    place(window.scrollY, 0);
  };

  const place = (scrollY: number, v: number) => {
    if (layer.hasAttribute("hidden")) return;
    const lean = Math.max(-28, Math.min(28, v * 1.6));
    const stretch = 1 + Math.min(0.35, Math.abs(v) * 0.012);
    for (const it of items) {
      const y = ((((it.baseY - scrollY * it.depth) % span) + span) % span) - 80;
      it.el.style.transform = `translate3d(${it.x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(it.spin + lean * it.depth * 2).toFixed(1)}deg) scale(${(1 / stretch).toFixed(3)}, ${stretch.toFixed(3)})`;
    }
  };

  let settleTimer = 0;
  const off = onScrollMotion(({ y, v }) => {
    place(y, v);
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => place(window.scrollY, 0), 140);
  });
  window.addEventListener("resize", layout);
  layout();

  return () => {
    off();
    window.clearTimeout(settleTimer);
    window.removeEventListener("resize", layout);
    layer.replaceChildren();
  };
}
