Always follow @docs/FUNFOLIO_BIBLE.md — Golden Rules R1–R10 are non-negotiable.

Choices made on top of the Bible live in @docs/DECISIONS.md (append, never rewrite the Bible).

@AGENTS.md

## Commands
- `npm run dev` — local dev server (http://localhost:3000)
- `npm run build` — static export to `out/`, then `scripts/check-export.mjs` (R1 raw-TODO check, R10 third-party check, §10 JS budget)
- `npm run preview` — serve `out/` locally (http://localhost:4173)
- `npm run check` — ESLint + TypeScript
- `npm run images` — pre-build AVIF/WebP variants from `assets/images/` into `public/img/`
- `npm run cursors` — rebuild the pixel cursors (`src/components/cursor/{skins,cursor-art}.ts` → `public/cursors/`, `src/app/cursors.generated.css`)

## Where things live
- Facts: `src/content/content.ts` only. `"TODO"` renders as "Coming soon" (`isTodo` in `src/content/derived.ts`); counts are computed there too.
- World registry (ids, numbers, game + plain names, colors): `src/content/worlds.ts`.
- Tokens and themes: `src/app/globals.css` (Tailwind v4 `@theme`, `[data-theme]`, `[data-world]`).
- UI kit: `src/components/ui` · page sections: `src/components/sections` · hooks: `src/lib/hooks`.
- `/playground` (noindex): every UI-kit component in all three themes, the style tile and the cursor lab.
- Cursor (R2): native CSS cursors in `src/app/cursors.css` are the truth layer; the follower is `src/components/cursor/`. Change the global cursor only with `useGameCursor()` — never `cursor: none`, never drei's `useCursor`.
