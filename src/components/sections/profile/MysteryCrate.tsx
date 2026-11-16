"use client";

import { useEffect, useRef, useState } from "react";
import { announce } from "@/lib/announce";
import { command } from "@/lib/commands";
import { fx } from "@/lib/juice";
import { sfx } from "@/lib/sfx";
import { PixelLayer } from "./pixels";

const HITS = 3;
const WOOD = { k: "#07060F", L: "#E0A458", W: "#B9772F", D: "#7A4A1C", m: "#B9B2D9", g: "#FFC83D", G: "#C98A00" };
const LID = ["..kkkkkkkkkkkk..", ".kLLLLLLLLLLLLk.", ".kWWWWWWWWWWWWk.", "kkkkkkkggkkkkkkk"];
const BODY = [
  "................",
  "................",
  "................",
  "................",
  "kmWWWWWgGWWWWWmk",
  "kWLLLLLggLLLLLWk",
  "kWWWWWWWWWWWWWWk",
  "kDDDDDDDDDDDDDDk",
  "kWLLLLLLLLLLLLWk",
  "kWWWWWWWWWWWWWWk",
  "kDDDDDDDDDDDDDDk",
  "kWLLLLLLLLLLLLWk",
  "kmWWWWWWWWWWWWmk",
  "kkkkkkkkkkkkkkkk",
];
// cracks appear hit by hit
const CRACK_1 = ["", "", "", "", "", "", "....k...........", ".....k..........", ".....k..........", "......k.........", "", "", "", ""];
const CRACK_2 = ["", "", "", "", "", "", "", "..........k.....", "...........k....", "..........k.....", "...........k....", "", "", ""];

/** Original pixel loot crate (no "?" blocks — R4). */
function CrateArt() {
  return (
    <svg className="crate__art" viewBox="0 0 16 14" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <g className="crate__body">
        <PixelLayer rows={BODY} colors={WOOD} />
      </g>
      <g className="crate__crack crate__crack--1">
        <PixelLayer rows={CRACK_1} colors={WOOD} />
      </g>
      <g className="crate__crack crate__crack--2">
        <PixelLayer rows={CRACK_2} colors={WOOD} />
      </g>
      <g className="crate__lid">
        <PixelLayer rows={LID} colors={WOOD} />
      </g>
    </svg>
  );
}

/**
 * MYSTERY CRATE (PART 6): it wiggles; three hits (click, Enter or Space) burst it open → coin #4 "Crate Coin" and a
 * fun fact from content.ts — or "More secrets loading…" while there are none (R1: never invented). Opened stays
 * opened: the game runtime marks [data-coin-id] collected from the save.
 */
export function MysteryCrate({ fact }: { fact: string | null }) {
  const [hits, setHits] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const open = hits >= HITS;

  // the save says it's already open (the runtime sets data-collected after hydration)
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const sync = () => {
      if (el.hasAttribute("data-collected")) setHits(HITS);
    };
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ["data-collected"] });
    queueMicrotask(sync);
    return () => mo.disconnect();
  }, []);

  const reveal = fact ?? "More secrets loading…";
  const left = HITS - hits;
  const label = open ? `Mystery crate — open. ${reveal}` : hits === 0 ? `Mystery crate — hit it ${HITS} times to open it` : `Mystery crate — ${left} more hit${left === 1 ? "" : "s"}`;

  return (
    <div ref={wrap} className="crate" data-coin-id="mystery-crate" data-coin="" data-hits={hits} data-open={open ? "" : undefined}>
      <button
        ref={btn}
        type="button"
        className="crate__btn"
        data-fx-skip=""
        data-cursor-label={open ? undefined : "HIT!"}
        aria-label={label}
        onClick={() => {
          if (open || !btn.current) return;
          const next = hits + 1;
          setHits(next);
          const r = btn.current.getBoundingClientRect();
          const origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          if (next < HITS) {
            fx.burst(origin.x, origin.y, { count: 6, colors: [WOOD.L, WOOD.W, WOOD.D] });
            sfx.play("thud", { pitch: 1 + next * 0.18 });
            announce(next === 1 ? "The crate rattles. Two more hits." : "It's cracking. One more hit!");
          } else {
            fx.burst(origin.x, origin.y, { shape: "coin", count: 14, power: 1.2 });
            sfx.play("open");
            command({ type: "coin", id: "mystery-crate", origin });
            announce(`The crate bursts open! ${reveal}`);
          }
        }}
      >
        <span className="crate__wiggle">
          <CrateArt />
        </span>
      </button>
      <p className="crate__reveal">{reveal}</p>
    </div>
  );
}
