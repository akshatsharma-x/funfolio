// AKSHAT-OS boot log (PART 5). Server-side only (like quips.ts): every number is computed from content.ts (R1) and
// the plain strings are handed to the lazy client boot screen.

import { COINS } from "./coins";
import { player } from "./content";
import { counts } from "./derived";

export type BootLine = { text: string; ok: string };
export type BootScript = { lines: BootLine[]; coinTotal: number };

export function buildBootScript(): BootScript {
  return {
    lines: [
      { text: `LOADING PLAYER: ${player.name.toUpperCase()}`, ok: "OK" },
      { text: `MOUNTING ${counts.internships} INTERNSHIPS`, ok: "OK" },
      { text: `EQUIPPING ${counts.skills} SKILLS`, ok: "OK" },
      { text: `SUMMONING ${counts.papers} BOSSES (RESEARCH)`, ok: "OK" },
      { text: `INSERTING ${counts.projects} CARTRIDGES`, ok: "OK" },
      { text: "WAKING UP BYTE", ok: "ZZZ… OK" },
    ],
    coinTotal: COINS.length,
  };
}
