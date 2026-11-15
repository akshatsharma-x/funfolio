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

| Key | Action |
|---|---|
| `0`–`8` | Jump to a world |
| `Esc` | Pause menu / resume |
| `M` | Map |
| `L` | Locate the cursor (or shake the mouse) |
| `Shift`+`S` / `Shift`+`D` / `Shift`+`R` | Sound · day/night · Recruiter Speedrun Mode |
| `?` | Controls |

Shortcuts never fire while typing; inside a game or a dialog only `Esc` is global.

## Editing content

All facts live in `src/content/content.ts`. Anything set to `"TODO"` renders as "Coming soon"; counts (internships,
projects, papers, skills, honors) are computed. Rules: [`docs/FUNFOLIO_BIBLE.md`](docs/FUNFOLIO_BIBLE.md) ·
choices: [`docs/DECISIONS.md`](docs/DECISIONS.md). Design check: `/playground`.
