// Patch notes (pause menu). About the site's builds — not facts about Akshat. Newest first.

export type PatchNote = { version: string; date: string; title: string; notes: string[] };

export const PATCH_NOTES: readonly PatchNote[] = [
  {
    version: "0.4.0",
    date: "2026-11-16",
    title: "FX layer & BYTE",
    notes: [
      "Meet BYTE, the robot mascot: click for a quip, drag and throw, rub for hearts. Settings can hide BYTE.",
      "Clicks pop with pixels (quiet near text), and the background grid lights up where you move.",
      "LED tickers between worlds, world intros, sticker corners you can peel and cards that tilt.",
      "Effects follow the Chill / Normal / Chaos setting and switch off with reduced motion.",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-11-16",
    title: "Game engine & HUD",
    notes: [
      "XP, ten levels and 35 achievements, saved on your device.",
      "A HUD with your level, coins and trophies, plus a level-select rail.",
      "Pause menu with map, achievements, settings, controls and save tools.",
      "Recruiter Speedrun Mode: the whole résumé at the top, in seconds.",
      "Keyboard shortcuts — press ? to see them.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-11-15",
    title: "Always-locatable cursor",
    notes: [
      "Original pixel cursors that stay visible on any background.",
      "A follower ring with labels, a pixel trail and cursor-finding pings (shake the mouse or press L).",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-11-15",
    title: "Foundation",
    notes: ["Every world, every fact, fully static and readable without JavaScript.", "Night, day and retro themes."],
  },
];

export const LATEST_PATCH = PATCH_NOTES[0].version;
