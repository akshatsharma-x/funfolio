// Patch notes (pause menu). About the site's builds — not facts about Akshat. Newest first.

export type PatchNote = { version: string; date: string; title: string; notes: string[] };

export const PATCH_NOTES: readonly PatchNote[] = [
  {
    version: "0.10.0",
    date: "2026-11-17",
    title: "Cartridge Vault",
    notes: [
      "The Projects world is a vault of cartridges: blow off the dust, slot one into the FUNSOLE and read it on the CRT.",
      "Arrow keys walk the shelf, Enter inserts, Esc ejects. Filter by AI/ML, Full-Stack or Tools.",
      "One cartridge scans this very page for accessibility issues — live, in your browser.",
      "There is a locked cartridge. It isn't a project. Blow harder.",
      "The pixel font is crisper at small sizes: B, G, C, O, 5 and S no longer look alike.",
    ],
  },
  {
    version: "0.9.0",
    date: "2026-11-17",
    title: "The Lab",
    notes: [
      "The research world is a lab of boss battles: each paper is a monster, and you watch it fall.",
      "A dotted globe traces the research route to SCI-2026 — drag it, pause it, or let it spin.",
      "The Smog Golem hides in grey air. Clear the sky and something shiny appears.",
      "Open the scrolls for each paper's details; open both and you earn a title.",
    ],
  },
  {
    version: "0.8.0",
    date: "2026-11-17",
    title: "Quest Log",
    notes: [
      "The Experience world is a quest log: the active quest up top, finished quests on a trail you walk down with BYTE.",
      "The active quest's widgets use only real numbers: cost per run, token compression, cache hits, the doc generator.",
      "Checklists tick, stamps thump, emblems spin — and every loot item opens its spot in the Skill Tree.",
      "One of those numbers is worth a coin.",
      "Small pixel text got easier to read everywhere: numbers now use the chunky display font.",
    ],
  },
  {
    version: "0.7.0",
    date: "2026-11-16",
    title: "The Launchpad",
    notes: [
      "World 2 opens with a slingshot: pull BYTE back on the neon launcher and fling it into the Bug Fortress.",
      "Three shots, five glitch-bugs, nine crates of dev nightmares. The dotted line shows exactly where BYTE will fly.",
      "Mouse, touch or keyboard (arrows to aim and set power, Space to launch). Skip ▶▶ any time.",
      "The Quest Log is only frosted until you play, skip or scroll on — never locked.",
      "A coin floats high above the fortress. Lob it.",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-11-16",
    title: "Player Profile",
    notes: [
      "World 1 is a character sheet: class, guild, status, grades, perks and a radar of what the résumé shows.",
      "Flip the perk cards (hover, Tab or tap) — every number on them comes straight from the résumé.",
      "Wave at the avatar for a high-five from BYTE.",
      "Something on the sheet rattles when you hit it…",
      "Decorative animations rest after 30 seconds without input, and pick up again the moment you move.",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-11-16",
    title: "Boot sequence & Title Screen",
    notes: [
      "The site boots like a console: insert the coin (click or drag it), then start with sound or muted. Skippable.",
      "Returning players get a one-second boot and CONTINUE? / NEW GAME.",
      "A 3D island on the Title Screen with one landmark per world — click one to fly there. Drag to turn it.",
      "Play the letters of the name, find three new coins and make the little plane loop.",
      "No 3D on this device? The same island, drawn flat, with the same buttons.",
    ],
  },
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
