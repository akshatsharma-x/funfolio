"use client";

import { useState } from "react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import type { Perk } from "@/content/profile";

/**
 * A trait card that flips on hover and keyboard focus; a click or tap keeps it flipped (aria-pressed). Both faces are
 * in the button's text, so screen readers always get the name AND the fact — flipping is purely visual.
 */
export function PerkCard({ perk }: { perk: Perk }) {
  const [pinned, setPinned] = useState(false);
  return (
    <button type="button" className="perk" aria-pressed={pinned} data-fx-skip="" data-cursor-label="FLIP" onClick={() => setPinned((v) => !v)}>
      <span className="perk__inner">
        <span className="perk__face perk__front">
          <PixelIcon name={perk.icon} size={32} />
          <span className="perk__name">{perk.name}</span>
        </span>
        <span className="sr-only"> — </span>
        <span className="perk__face perk__back">
          {perk.lines.map((line, i) => (
            <span key={line} className="perk__line">
              {line}
              {i < perk.lines.length - 1 ? <span className="sr-only">. </span> : null}
            </span>
          ))}
          <span className="sr-only"> — </span>
          <span className="perk__source">{perk.source}</span>
        </span>
      </span>
    </button>
  );
}
