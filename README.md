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

## Editing content

All facts live in `src/content/content.ts`. Anything set to `"TODO"` renders as "Coming soon"; counts (internships,
projects, papers, skills, honors) are computed. Rules: [`docs/FUNFOLIO_BIBLE.md`](docs/FUNFOLIO_BIBLE.md) ·
choices: [`docs/DECISIONS.md`](docs/DECISIONS.md). Design check: `/playground`.
