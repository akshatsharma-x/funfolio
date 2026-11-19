"use client";

import { useState } from "react";
import { ACHIEVEMENTS } from "@/content/achievements";
import { useSave } from "@/lib/store";
import { AchievementPlaque } from "./AchievementPlaque";

/**
 * YOUR TROPHIES (PART 14): the visitor's own shelf, live from the save file — unlocked achievements first (newest
 * first, as of the page load), then the rest as silhouettes with hints. The runtime portals it into the Trophy Room
 * (like the Prize Counter's booth), so the store stays out of the initial bundle; the server-rendered shelf steps aside.
 */
export default function TrophyShelf() {
  const unlocked = useSave((s) => s.achievements);
  const total = ACHIEVEMENTS.length;
  const n = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  // The order is set when the shelf mounts — unlocked first (newest first), then the rest — and kept for the visit: a
  // trophy unlocked while the page is open lights up where it stands instead of every plaque after it jumping a slot (a
  // layout shift; on phones Explorer unlocks just as the shelf scrolls by — PART 17). The next visit sorts again.
  const [list] = useState(() => {
    const on = ACHIEVEMENTS.filter((a) => unlocked[a.id]).sort((a, b) => (unlocked[b.id] ?? 0) - (unlocked[a.id] ?? 0));
    return [...on, ...ACHIEVEMENTS.filter((a) => !unlocked[a.id])];
  });

  return (
    <div className="shelf__live" data-shelf-live="">
      <p className="shelf__count">
        {n === total ? (
          <>
            You&apos;ve unlocked <span className="shelf__num">{n}/{total}</span> — every last one. Legend.
          </>
        ) : (
          <>
            You&apos;ve unlocked <span className="shelf__num">{n}/{total}</span> — keep exploring!
          </>
        )}
      </p>
      <ul className="shelf__grid">
        {list.map((a) => (
          <AchievementPlaque key={a.id} a={a} at={unlocked[a.id] ?? null} />
        ))}
      </ul>
    </div>
  );
}
