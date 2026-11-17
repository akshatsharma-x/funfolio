# AKSHAT.EXE — The Funfolio

"Don't read my résumé. Play it." — Akshat Sharma's game-themed portfolio. Fully static (Next.js `output: "export"`):
no server, no API keys, no runtime third-party requests.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:3000 |
| `npm run build` | Static export to `out/`, then R1/R10/budget checks (`scripts/check-export.mjs`) |
| `npm run preview` | Serves `out/` at http://localhost:4173 |
| `npm run check` | ESLint + TypeScript |
| `npm run images` | Pre-builds AVIF/WebP variants from `assets/images/` into `public/img/` |
| `npm run cursors` | Rebuilds the pixel cursors (6 skins × 3 sizes × 7 variants) and their CSS |
| `npm run globe` | Rebuilds the Lab globe's land dots (`public/data/land-dots.json`) from the bundled Natural Earth land file |

## Playing

Progress (XP, levels, coins, achievements, settings) is saved in this browser only (`localStorage`, key
`funfolio-save`) — Pause → Reset save erases it. Recruiter link: `/?speedrun` shows the whole résumé summary first.

The home page boots first (AKSHAT-OS log → INSERT COIN → start with sound / muted); returning players get a 1s boot
and CONTINUE? / NEW GAME. Any key, Esc or "Skip ▶▶" skips it, and 8s of idling continues muted. No boot in Speedrun
Mode, on deep links (`/#lab`), with `?boot=0`, or without JavaScript; `?boot=full` forces the first-visit boot.

The Title Screen island: drag to turn it (the wheel always scrolls the page), hover or Tab to a landmark to see its
world, click or Enter to fly there. "Peek behind the tower" turns it around. Without WebGL (or on a software
renderer) it is a flat isometric drawing with the same buttons; phones switch to 3D after the first tap or scroll.

| Key | Action |
|---|---|
| `0`–`8` | Jump to a world |
| `Esc` | Pause menu / resume |
| `M` | Map |
| `L` | Locate the cursor (or shake the mouse) |
| `Shift`+`S` / `Shift`+`D` / `Shift`+`R` | Sound · day/night · Recruiter Speedrun Mode |
| `?` | Controls |

Shortcuts never fire while typing; inside a game or a dialog only `Esc` is global. In the Launchpad (click or Tab
into the game screen first): `←`/`→` aim · `↑`/`↓` power · `Space` launch · `R` reset.

World 1 (Player Profile) is a character sheet: wave at the avatar (click or Enter) for a high-five from BYTE, flip
the perk cards (hover, Tab or tap), and hit the mystery crate three times. The Focus Radar counts the résumé entries
behind each area — it is not a self-rating. Decorative animations rest after 30s without input.

World 2a (The Launchpad) is a slingshot game in front of the Quest Log: drag BYTE back on the launcher and let go
(touch works the same), with a dotted preview of the flight. Three shots to pop the five glitch-bugs in the Bug
Fortress; a strong lob reaches the coin above it. The Quest Log below is only frosted, never locked: clearing the
fortress, running out of shots, "Skip ▶▶" or simply scrolling on opens it. Reduced motion shows a still picture of
the level ("Play anyway" starts the game); Speedrun Mode leaves the game out.

World 2b (the Quest Log) starts with the ACTIVE QUEST — the current role, with illustrative widgets built only from
its real numbers (a cost dial, a token squeeze, a SHA-256 cache hit, a knowledge graph) and a hidden coin on "$0.08".
The COMPLETED QUESTS follow, newest first, on a trail that draws itself as you scroll while a tiny BYTE walks it (a
straight rail on phones): checklists tick, stamps thump down, emblems spin when clicked, and every loot chip opens its
Skill Tree entry. Side quest buttons say "coming soon" until the Arcade exists. Reading a card for 3s pays +10 XP once.

World 3 (The Lab) has a research-route globe — drag it, pause its spin, "Show the route" — from Manipal University
Jaipur to SCI-2026 (a flat map on phones and without 3D). Each paper is a boss: scroll it into view to watch the
battle, sweep the smog off the Smog Golem with your pointer (or press "Run the air purifier"), and open "Read the
scroll" for the details. Abstracts, links and BibTeX show "Coming soon" until they are in content.ts.

World 4 (the Cartridge Vault) is a shelf of 3D cartridges, one per project, next to the FUNSOLE console. Click (or tap)
a cartridge to blow the dust off and slot it in: the screen crackles, shows a title card, then the project — story,
abilities, stats, stack (each chip opens its Skill Tree entry) and links. Keyboard: `←`/`→`/`↑`/`↓` move along the
shelf, `Enter` inserts, `Esc` ejects. The tabs filter by AI/ML · Full-Stack · Tools; "Fullscreen" enlarges the screen.
On phones the shelf scrolls sideways and the console slides up from the bottom. The locked cartridge isn't a project,
but blowing on it pays off. The Web Accessibility Analyzer's cartridge has "Scan this page": it runs axe-core (bundled,
nothing leaves the browser) on the live page and lists what it finds. Without JavaScript and in Speedrun Mode every
project is a plain list.

World 5 (the Bonus Stage: the Arcade) is a hall of six arcade cabinets, each game based on a real résumé line: Token
Squeeze (squeeze the filler out of a bloated prompt — token compression at United Airlines), Cache Hit! (a memory match
of SHA-256-hashed stack logos — SHA256 caching), Bug Whack (whack the bugs in nine code editors, spare the features —
debugging at Truechip), RAG Catcher (catch the chunks that answer the query, dodge the hallucinations — Cognivault AI),
Pipeline (grow a data pipeline, dodge the NULLs — WalkingTree's aggregation pipelines) and Gradient Descent (roll a
ball down a 3D loss landscape; mind the learning rate — the churn model). Click, tap or press Enter on a cabinet; inside
a game `P` or `Esc` pauses (so does leaving the window), `R` restarts, `Esc` on a paused game leaves. Runs pay coins;
beat any game's target for a hidden coin; play all six for Arcade Rat. Spend coins at the Prize Counter (next to the
cabinets, and in Pause → Prize Counter) on cursor skins, confetti, the Retro CRT theme and hats for BYTE.

BYTE, the robot mascot, lives in the bottom-right corner: click for a quip, drag or throw it, rub it for hearts,
minimize it with the `–` button (or turn it off in Pause → Settings). `/playground` has a Juice kit & BYTE panel.

## Editing content

All facts live in `src/content/content.ts`. Anything set to `"TODO"` renders as "Coming soon"; counts (internships,
projects, papers, skills, honors) are computed. Rules: [`docs/FUNFOLIO_BIBLE.md`](docs/FUNFOLIO_BIBLE.md) ·
choices: [`docs/DECISIONS.md`](docs/DECISIONS.md). Design check: `/playground`.

While `player.bio` is `"TODO"`, the Profile shows a DRAFT bio assembled only from these facts — write your own in
`player.bio` to replace it. Until `player.photo` is set, the Character Card shows a pixel avatar; its colors are in
`src/content/avatar.ts`. Perk names and the Focus Radar's domain buckets live in `src/content/profile.ts`.
