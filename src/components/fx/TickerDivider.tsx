import type { CSSProperties } from "react";
import { tickerItems, type TickerSet } from "@/content/derived";
import type { WorldId } from "@/content/worlds";

const MIN_ITEMS = 12; // each run must be wider than any viewport for a seamless loop

/**
 * LED dot-matrix ticker between two worlds (Bible §8, PART 4 #5), in the NEXT world's color (R8). Server-rendered from
 * computed content; decorative (aria-hidden — every fact is also in the page). The marquee is a CSS animation;
 * FxLayer couples its speed and skew to scroll velocity. Static under reduced motion, hidden in Speedrun Mode.
 */
/** Digits in the display face: the pixel face's 5/S and 0/O look alike, and these are facts (R1, DECISIONS #87). */
function LedText({ text }: { text: string }) {
  return text.split(/(\d(?:[\d.,/]*\d)?)/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="ticker__num">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function TickerDivider({ set, world, reverse = false }: { set: TickerSet; world: WorldId; reverse?: boolean }) {
  const base = tickerItems(set);
  if (base.length === 0) return null;
  const items = Array.from({ length: Math.ceil(MIN_ITEMS / base.length) }, () => base).flat();
  const run = (copy: string) => (
    <span className="ticker__run" key={copy}>
      {items.map((text, i) => (
        <span className="ticker__item" key={`${copy}-${i}`}>
          <span className="ticker__star" />
          <LedText text={text} />
        </span>
      ))}
    </span>
  );
  return (
    <div
      className="ticker"
      data-ticker=""
      data-world={world}
      data-direction={reverse ? "right" : "left"}
      data-speedrun="hide"
      aria-hidden="true"
    >
      <div className="ticker__track" data-ticker-track="" style={{ "--n": items.length } as CSSProperties}>
        {run("a")}
        {run("b")}
      </div>
    </div>
  );
}
