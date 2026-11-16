"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";

const SVG_NS = "http://www.w3.org/2000/svg";
/** The lit trail's head follows this line of the viewport (0 = top, 1 = bottom). */
const HEAD = 0.62;
/** Winding layout: nodes sit this far outside a card's inner edge; the trail crosses the channel every WAVE px. */
const INSET = 18;
const WAVE = 240;

/**
 * The COMPLETED QUESTS trail (PART 8): a winding path through the cards (a straight rail on narrow screens — CSS says
 * which via --trail) that lights up as you scroll, with a tiny BYTE walking at its head.
 *
 * Scroll-scrubbed without ScrollTrigger: ScrollTrigger keeps a perpetual rAF loop while enabled (DECISIONS #40), and
 * the page must idle. Here a passive scroll listener schedules one rAF; nothing runs while the page is still. Under
 * reduced motion the trail is drawn in full and BYTE stays home. Without JS a CSS rail stands in.
 */
export function QuestTrail() {
  useEffect(() => {
    const wrap = document.querySelector<HTMLElement>("[data-quest-trail]");
    const svg = wrap?.querySelector<SVGSVGElement>(".quest-trail__svg");
    const base = svg?.querySelector<SVGPathElement>(".quest-trail__base");
    const lit = svg?.querySelector<SVGPathElement>(".quest-trail__lit");
    const dots = svg?.querySelector<SVGGElement>(".quest-trail__nodes");
    const walker = wrap?.querySelector<HTMLElement>("[data-walker]");
    if (!wrap || !svg || !base || !lit || !dots || !walker) return;
    const reduced = prefersReducedMotion();
    wrap.setAttribute("data-trail", reduced ? "static" : "live");
    let length = 0;
    let lastP = -1;
    let lastAt = { x: 0, y: 0 };
    let face = 1;
    let frame = 0;
    let stopTimer = 0;

    const update = () => {
      frame = 0;
      if (!length) return;
      const box = wrap.getBoundingClientRect();
      const p = reduced ? 1 : Math.min(1, Math.max(0, (window.innerHeight * HEAD - box.top) / box.height));
      if (p === lastP) return;
      const at = lit.getPointAtLength(length * p);
      lit.style.strokeDashoffset = `${length * (1 - p)}`;
      for (const dot of dots.children) dot.classList.toggle("is-lit", Number(dot.getAttribute("cy")) <= at.y + 1);
      if (!reduced) {
        // face the way BYTE is walking: along the trail when scrolling down, back up it when scrolling up
        const ahead = lit.getPointAtLength(Math.min(length, length * p + 6));
        const dx = (ahead.x - at.x) * (p >= lastP ? 1 : -1);
        if (Math.abs(dx) > 0.6) face = dx > 0 ? 1 : -1;
        walker.style.transform = `translate(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px)`;
        walker.style.setProperty("--face", String(face));
        // the walk cycle runs only on real steps — not on the sub-pixel tail of a smooth scroll easing out
        if (lastP >= 0 && Math.hypot(at.x - lastAt.x, at.y - lastAt.y) > 0.4) {
          walker.setAttribute("data-walking", "");
          window.clearTimeout(stopTimer);
          stopTimer = window.setTimeout(() => walker.removeAttribute("data-walking"), 180);
        }
        lastAt = { x: at.x, y: at.y };
      }
      lastP = p;
    };

    const layout = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      const css = getComputedStyle(wrap);
      const rail = css.getPropertyValue("--trail").trim() === "rail";
      const railX = parseFloat(css.getPropertyValue("--rail-x")) || 18;
      const box = wrap.getBoundingClientRect();
      // a node beside each card's header: on the card's inner edge (winding) or on the rail
      const cards = [...wrap.querySelectorAll<HTMLElement>("[data-quest-card]")];
      let xL = w / 2;
      let xR = w / 2;
      const nodes = cards.map((card) => {
        const r = card.getBoundingClientRect();
        const y = r.top - box.top + Math.min(64, r.height / 2);
        if (rail) return { x: railX, y };
        const right = card.dataset.side === "right";
        const x = right ? r.left - box.left - INSET : r.right - box.left + INSET;
        if (right) xR = x;
        else xL = x;
        return { x, y };
      });
      const x0 = rail ? railX : w / 2;
      const pts = [{ x: x0, y: 0 }, ...nodes, { x: x0, y: h }];
      // winding: between two nodes the trail snakes from one edge of the channel to the other every ~WAVE px
      const route = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const a = route[route.length - 1];
        const b = pts[i];
        const extra = rail || xR - xL < 40 ? 0 : Math.max(0, Math.floor(((b.y - a.y) / WAVE - 1) / 2)) * 2;
        for (let k = 1; k <= extra; k++) route.push({ x: route[route.length - 1].x === xL ? xR : xL, y: a.y + ((b.y - a.y) * k) / (extra + 1) });
        route.push(b);
      }
      let d = `M${route[0].x.toFixed(1)} 0`;
      for (let i = 1; i < route.length; i++) {
        const a = route[i - 1];
        const b = route[i];
        const my = ((a.y + b.y) / 2).toFixed(1);
        d += rail ? ` L${b.x.toFixed(1)} ${b.y.toFixed(1)}` : ` C${a.x.toFixed(1)} ${my} ${b.x.toFixed(1)} ${my} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      }
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      base.setAttribute("d", d);
      lit.setAttribute("d", d);
      try {
        length = lit.getTotalLength();
      } catch {
        length = 0; // not rendered (Speedrun Mode hides the trail)
        return;
      }
      lit.style.strokeDasharray = `${length} ${length}`;
      dots.replaceChildren(
        ...nodes.map((n) => {
          const c = document.createElementNS(SVG_NS, "circle");
          c.setAttribute("cx", n.x.toFixed(1));
          c.setAttribute("cy", n.y.toFixed(1));
          c.setAttribute("r", "9");
          return c;
        }),
      );
      lastP = -1;
      update();
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const resize = new ResizeObserver(() => layout());
    resize.observe(wrap);
    void document.fonts?.ready.then(layout);
    layout();
    return () => {
      window.removeEventListener("scroll", onScroll);
      resize.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(stopTimer);
      wrap.removeAttribute("data-trail");
    };
  }, []);
  return null;
}
