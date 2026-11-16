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
- Game layer (PART 3): save = `src/lib/store.ts` (zustand persist `funfolio-save`; bump `SAVE_VERSION` + add a `migrateSave` step for shape changes). Registries: `src/content/{achievements,coins,prizes,levels,patchNotes}.ts`. Runtime (HUD, rail, toasts, pause menu, world tracking) = `src/components/hud/`, lazy-loaded after hydration.
- Server components talk to the game with `command(...)` from `src/lib/commands.ts` (or ArcadeButton's `command` prop) — never import the store into the initial bundle. Side effects go through `src/lib/bus.ts`.
- Keyboard shortcuts live only in `useKeyboardShortcuts` (`src/components/hud/useGameRuntime.ts`). Games mark their focus area `data-keyboard="exclusive"` (then only Esc is global); single letters are reserved for PART 16's typed eggs.
- Speedrun Mode is CSS-only (`html[data-mode="speedrun"]`, rules in `src/app/game.css`); add `data-speedrun="hide"` to anything recruiters should skip. Add a `PATCH_NOTES` entry for each part.
- FX (PART 4): call `fx.*` from `src/lib/juice.ts` and `byte.*` from `src/lib/byte.ts` — never import the engines. `data-fx-skip` opts an element out of click juice. BYTE lines about a feature wait for its hook attribute (`data-slingshot`, `data-boss-fight`, `data-cartridge`, `data-arcade-game`, `data-jd-scanner`, `data-contact-form`, `data-coin`) — add it when you build the feature.
- Keep the page idle (docs/DECISIONS.md #40–41): no always-on rAF loops, continuous CSS animations only on HTML elements' transform/opacity (never on SVG elements), no style writes inside scroll events (use `onScrollMotion`), and get GSAP/ScrollTrigger via `loadScrollTrigger()` only where needed.
