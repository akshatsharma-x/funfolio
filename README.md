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

BYTE, the robot mascot, lives in the bottom-right corner: click for a quip, drag or throw it, rub it for hearts,
minimize it with the `–` button (or turn it off in Pause → Settings). `/playground` has a Juice kit & BYTE panel.

## Editing content

All facts live in `src/content/content.ts`. Anything set to `"TODO"` renders as "Coming soon"; counts (internships,
projects, papers, skills, honors) are computed. Rules: [`docs/FUNFOLIO_BIBLE.md`](docs/FUNFOLIO_BIBLE.md) ·
choices: [`docs/DECISIONS.md`](docs/DECISIONS.md). Design check: `/playground`.

While `player.bio` is `"TODO"`, the Profile shows a DRAFT bio assembled only from these facts — write your own in
`player.bio` to replace it. Until `player.photo` is set, the Character Card shows a pixel avatar; its colors are in
`src/content/avatar.ts`. Perk names and the Focus Radar's domain buckets live in `src/content/profile.ts`.
