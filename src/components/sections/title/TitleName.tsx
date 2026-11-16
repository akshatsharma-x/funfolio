"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { command } from "@/lib/commands";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { sfx } from "@/lib/sfx";

/** C-major pentatonic, two octaves: every letter is a note (a playable xylophone when sound is on). */
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26];
const HOLD_MS = 2000;

/**
 * The hero name (PART 5): CSS-extruded 3D letters, each a different palette color. Hover a letter → it hops and
 * plays a note. Hover (or long-press) the K for 2s → coin #3 pops out. The heading's accessible name is the plain
 * name (sr-only); the letters are decorative. The coin button lives outside the <h1>.
 */
export function TitleName({ name, id }: { name: string; id: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const kTimer = useRef(0);
  const [coin, setCoin] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => () => window.clearTimeout(kTimer.current), []);

  const hop = (el: HTMLElement, index: number) => {
    if (!prefersReducedMotion()) {
      el.removeAttribute("data-hop");
      void el.offsetWidth; // restart
      el.setAttribute("data-hop", "");
    }
    sfx.play("note", { pitch: Math.pow(2, PENTA[index % PENTA.length] / 12) });
  };

  const armK = (el: HTMLElement) => {
    window.clearTimeout(kTimer.current);
    if (wrap.current?.hasAttribute("data-collected") || coin) return;
    kTimer.current = window.setTimeout(() => {
      const w = wrap.current?.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      if (!w) return;
      setCoin({ x: r.left - w.left + r.width / 2, y: r.top - w.top });
      sfx.play("pop");
    }, HOLD_MS);
  };
  const disarmK = () => window.clearTimeout(kTimer.current);

  let index = 0;
  let kDone = false;
  const words = name.split(" ");
  return (
    <div ref={wrap} className="title-name" data-coin-id="title-k" data-coin="">
      <h1 id={id} className="title-name__h1">
        <span className="sr-only">{name}</span>
        <span className="name-letters" aria-hidden="true">
          {words.map((word, wi) => (
            <span key={wi} className="name-letters__word">
              {[...word].map((ch) => {
                const i = index++;
                const isK = !kDone && ch.toUpperCase() === "K";
                if (isK) kDone = true;
                return (
                  <span
                    key={i}
                    className="name-letter"
                    data-c={i % 6}
                    data-k={isK ? "" : undefined}
                    style={{ "--i": i } as CSSProperties}
                    onPointerEnter={(e: PointerEvent<HTMLSpanElement>) => {
                      if (e.pointerType === "touch") return;
                      hop(e.currentTarget, i);
                      if (isK) armK(e.currentTarget);
                    }}
                    onPointerLeave={isK ? disarmK : undefined}
                    onPointerDown={(e: PointerEvent<HTMLSpanElement>) => {
                      if (e.pointerType !== "touch") return;
                      hop(e.currentTarget, i);
                      if (isK) armK(e.currentTarget); // long-press the K on touch screens
                    }}
                    onPointerUp={isK ? (e) => e.pointerType === "touch" && disarmK() : undefined}
                    onPointerCancel={isK ? disarmK : undefined}
                    onAnimationEnd={(e) => e.currentTarget.removeAttribute("data-hop")}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          ))}
        </span>
      </h1>
      {coin ? (
        <button
          type="button"
          className="k-coin"
          data-fx-skip=""
          style={{ left: coin.x, top: coin.y } as CSSProperties}
          aria-label="Kerning Coin — grab it"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            command({ type: "coin", id: "title-k", origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 } });
            setCoin(null);
          }}
        >
          <span className="k-coin__face" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
