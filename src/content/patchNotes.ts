// Patch notes (pause menu). About the site's builds — not facts about Akshat. Newest first.

export type PatchNote = { version: string; date: string; title: string; notes: string[] };

export const PATCH_NOTES: readonly PatchNote[] = [
  {
    version: "1.2.0",
    date: "2026-11-26",
    title: "New loot",
    notes: [
      "Six new cartridges in the Vault — NEXUS, ResearchX, BBC News Retrieval, Vistara, CabinMUJ and MyHUB — with links to try them and to their code.",
      "QuizMUJ, the résumé screener and the churn model link to their code now, and the screener shows its evaluation numbers.",
      "The Trophy Room's packs are open: 15 certificates as trading cards.",
      "A new active quest: Merck Group, from December 2026. United Airlines is a completed quest now — its widgets and the $0.08 coin are still on its card.",
      "The Character Card shows Akshat's photo.",
    ],
  },
  {
    version: "1.1.1",
    date: "2026-11-26",
    title: "Second shot",
    notes: [
      "The Launchpad: BYTE is back in the launcher and ready to grab — with the mouse or a finger — for every shot, and after Play again.",
      "Reset and Play again keep the page where it is (in Firefox they scrolled BYTE's launcher off the screen).",
      "Scan this page waits for anything still fading in, so it never reports a half-faded word.",
      "On a slower phone the controller no longer slips away while ◀ ▶ fly you to the next world.",
      "Behind the scenes: every world, game and control now gets played through automatically on every change, the way you'd play it.",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-11-20",
    title: "Ask BYTE",
    notes: [
      "BYTE talks back: press the speech bubble beside it (or Pause → Controls → Ask BYTE) and ask about the save file — pick a topic or type your own question.",
      "It all happens right here in your browser — nothing to sign up for, nothing to wait for, and it works offline.",
      "BYTE remembers the name you type in the Co-op Lobby (on this browser only — \"Forget my name\" any time), notices your achievements and knows what time it is.",
      "Arrow keys move between topics, Enter picks one, Esc closes the chat.",
      "Links straight to a world (like /#lab) now land right on it.",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-11-20",
    title: "Launch",
    notes: [
      "Version 1.0: every world polished and checked in every browser, on phones and with the keyboard alone.",
      "Every click answers right away — and with a little sound, when sound is on.",
      "Lost your connection? Everything you've opened keeps working, and anything that can't load says so instead of breaking.",
      "On phones, notifications stay slim and out of the way, and the level-up banner sits above the controller.",
      "A fresh coin sound, and the controller's A button wears each world's colour.",
    ],
  },
  {
    version: "0.17.0",
    date: "2026-11-19",
    title: "Handheld mode",
    notes: [
      "On a phone? A controller now sits at the bottom: ◀ ▶ hop between worlds, A does each world's main thing, B goes back, START pauses. It tucks away while you scroll down.",
      "Long-press anything with a tooltip to read it, and tilt your phone to look around the island (tap Enable tilt first). Little buzzes on coins and level-ups.",
      "Keyboard players can skip straight past the mini-games, and every jump lands — and focuses — as soon as it arrives.",
      "Nothing on the page jumps around any more while it loads or as you scroll.",
    ],
  },
  {
    version: "0.16.0",
    date: "2026-11-19",
    title: "Secrets & surprises",
    notes: [
      "Secrets everywhere: linger in a corner, type a word (outside a text box — try your favourite name), right-click, or remember an old code.",
      "AKSHAT-OS: press ` for a terminal with history and Tab completion — whoami, experience, play <game>… and sudo hire akshat.",
      "Leave BYTE alone and it falls asleep. Visit after midnight and it wears a nightcap.",
      "Switch tabs and the proctor notices. Developers: check the console.",
      "Rare loot chests, milestones, and a little ceremony for every hidden coin. All 12 still unlock the Golden cursor.",
    ],
  },
  {
    version: "0.15.0",
    date: "2026-11-19",
    title: "Co-op Lobby & credits",
    notes: [
      "World 8 is open: PLAYER 2, PRESS START. BYTE takes your party invite — name, quest type, message.",
      "Send folds it into a paper plane: pull it back and let go (or press Enter) to fly it into the mailbox. Your own email app takes it from there — nothing goes through a server.",
      "Direct portals for email (copy it in one click), LinkedIn, GitHub and the save file.",
      "The credits roll at the bottom, with your run's stats, Share my run and NEW GAME+. Something shiny drifts through them.",
      "Lost? Unknown pages now end in GAME OVER — with a continue countdown and a quick game.",
    ],
  },
  {
    version: "0.14.0",
    date: "2026-11-18",
    title: "Trophy Room",
    notes: [
      "World 7 is open: a Hall of Fame with a 3D trophy for every honor. Hover to spin, click for the story.",
      "Certificates become collectible cards that flip — the packs are sealed until the first ones arrive.",
      "A capsule machine: wind the crank and see what rolls out. Rumour has it one capsule in five is special.",
      "Your trophies: every achievement you've unlocked, on a shelf of its own.",
    ],
  },
  {
    version: "0.13.0",
    date: "2026-11-18",
    title: "Skill Tree",
    notes: [
      "World 6 is open: every skill on a five-branch tree, each with the roles and projects that used it.",
      "Hover, focus or tap a node for its card; arrow keys move around the tree. Knock on the root.",
      "Inventory: filter, search (aliases work — try \"js\"), and equip three skills to find a combo.",
      "JD Scanner: paste a job description and see the matching skills. It runs in your browser, even offline.",
      "Loot chips in the Quest Log and the Vault now land on their node in the tree.",
    ],
  },
  {
    version: "0.12.0",
    date: "2026-11-18",
    title: "Action games",
    notes: [
      "Three more cabinets light up: RAG Catcher, Pipeline and Gradient Descent. The whole arcade is open.",
      "RAG Catcher: catch the chunks that answer the query, dodge the hallucinations — graded on precision and recall.",
      "Pipeline: grow the data pipeline, dodge the NULLs, process 10,000+ records.",
      "Gradient Descent: roll a ball down a 3D loss landscape. Mind the learning rate — too high and it diverges.",
      "Play all six for a new achievement. The page behind a game now rests while you play.",
    ],
  },
  {
    version: "0.11.0",
    date: "2026-11-17",
    title: "The Arcade",
    notes: [
      "The Bonus Stage is open: a hall of arcade cabinets, and every game is based on real work.",
      "Token Squeeze, Cache Hit! and Bug Whack — mouse, keyboard or touch. P or Esc pauses; leaving the window pauses too.",
      "Beat any game's target and a hidden coin drops. Runs pay coins into your wallet as well.",
      "The Prize Counter is open: cursor skins, confetti styles, the Retro CRT theme — and hats for BYTE.",
      "The side quests in the Quest Log now launch their games.",
    ],
  },
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
