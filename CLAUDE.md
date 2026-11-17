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
- Boot + Title Screen (PART 5): the pre-paint script sets `html[data-boot="full"|"fast"]` (home page only; never in
  Speedrun Mode, on a deep link or with `?boot=0`; `?boot=full` forces it); the lazy boot (`src/components/boot/`)
  switches it to `running`, removes it on exit and emits `boot:done` on the bus. Anything that must not start behind
  the boot (typing, tips, title animations) waits for that. Boot log lines come from `buildBootScript()`
  (`src/content/boot.ts`, server-side). The 3D island is `src/components/three/IslandCanvas.tsx` (lazy); the HTML
  landmark buttons and the SVG island (NONE tier, no-JS view) are in `src/components/sections/title/`. They talk
  through `src/lib/island.ts` (hover, go/swoop, spin, plane, dive) and report load progress to the boot via
  `src/lib/heroLoad.ts`. Landmarks: `src/content/landmarks.ts`. No raycasting — hit targets are HTML buttons.
  The Title pins (`#title[data-pin]`, set by `TitleIsland`) only when its whole overlay fits the viewport; nothing
  there may widen the page (labels near an edge anchor to that side).
- Player Profile (PART 6): every value on the sheet is computed server-side in `src/content/profile.ts` (character
  fields, the DRAFT bio, perks, the radar's domain buckets, quick stats); perk facts and radar items are checked by
  schema.ts. Avatar pixel art + editable colors: `src/content/avatar.ts`. Tiles live in `src/components/sections/profile/`.
- One-shot "play on first view" animations wrap their element in `PlayOnView` (`src/components/ui/PlayOnView.tsx`):
  render the FINAL state on the server; CSS animates from `[data-play="armed"]` to `[data-play="run"]`.
- `byte.visit(selector, text?)` flies BYTE next to an element for a moment (never onto anything clickable).
- Idle nap (#67) + off-screen pause (#78): after 30s without input `html[data-idle]`, and on any world section that
  isn't on screen `[data-offscreen]`, set `--play: paused` — every new continuous CSS loop must use
  `animation-play-state: var(--play)` (and live inside its world's section). `announce()` spaces messages ≥ 1s (#76).
- Reading zones (R6): `src/components/fx/readZones.ts` defines them once — `READ` (text people read: click juice stays
  silent near it) and `TEXT` (READ + labelled controls: confetti is masked out of it). Reuse them for any new effect
  that could land on text.
- Launchpad (PART 7): `src/components/games/launchpad/` — `level.ts` holds every tuned number (change physics only
  there and re-check that the preview still matches the flight), `sim.ts` the Matter world + rules (no DOM), `draw.ts`
  the canvas renderer, `game.ts` the lazy entry (input, FX, sfx, save). The stage, the HUD and the server-rendered
  poster (no-JS / reduced-motion view, drawn from the same `level.ts`) are in `src/components/sections/launchpad/`.
  Gates: `store.gates` + `command({ type: "gate", … })`; `html[data-quest-log]` comes from the pre-paint script and the
  runtime, and `QuestGate` plays the reveal. Gated content stays in the DOM and is never trapped (R3).
- Game screens carry `data-game-screen` (BYTE holds unasked lines behind its "!" instead of talking over them) and
  `data-keyboard="exclusive"` while focused.
- Pixel face = Tiny5 since PART 10 (#110; next/font `--font-pixelface` → `--font-pixel`): one weight (400) — never set
  a bold on it (`font-synthesis-weight: none` blocks fake bolds). Numbers always in the display face
  (`font-family: var(--font-display)`, `fx.text(…, { font: "display" })`, #97). Tiny world labels (canvas, SVG) use DM Sans.
- Quest Log (PART 8): cards, loot, widgets and "used in" evidence are computed in `src/content/quests.ts`
  (server-only; schema.ts checks the widget bindings); side quests/cartridges in `src/content/games.ts`
  (`command({ type: "openGame", id })`); tech logos in `src/content/techIcons.ts` (simple-icons, server-rendered).
  Components in `src/components/sections/quests/`: server cards render the final state; `QuestLogFx` (one delegated
  island) arms and plays the one-shots; `QuestTrail` scrubs the trail on scroll — no ScrollTrigger (#95). Skills keep
  `id="skill-<slug>"` anchors (`skillAnchor()`), the loot chips' targets.
- The Lab (PART 9): bosses, stats and the research route are computed in `src/content/lab.ts` (server-only; it reads
  `public/data/ne_110m_land.geojson` for the flat map); boss sprites + damage words in `src/content/bossArt.ts`; geo
  math in `src/lib/geo.ts`. The globe is `src/components/three/GlobeCanvas.tsx` (lazy, HIGH tier + fine pointer,
  `GlobeStage` decides); after replacing the land file run `npm run globe` (→ `public/data/land-dots.json`). The
  battle and the smog purifier are `LabFx` (one delegated island); `Stamp` lives in the UI kit.
- Cartridge Vault (PART 10): cartridges (tabs, codes, label art, stat bars, side quests) are computed in
  `src/content/vault.ts` (server-only); the shelf and the FUNSOLE are server components in
  `src/components/sections/vault/` and `VaultFx` (one delegated island) plays them — insert/eject, filter (GSAP Flip),
  the locked cartridge, fullscreen and "Scan this page" (axe-core, lazy `import()`, bundled — R10). Every project's
  screen is server-rendered; Play Mode shows one at a time, no-JS and Speedrun Mode list them all. The Vault's Esc
  (eject) runs before the pause menu (#114).
- Controls that only work with the runtime (side quests, the scan…) get `data-needs-js` — hidden without JavaScript.
- The Arcade (PART 11): what each game is based on and its "That's real:" line are computed in `src/content/arcade.ts`
  (server-only, checked by schema.ts) and reach the runtime as a prop. Games: `src/components/games/` — `registry.ts`
  (how-to, goal, cursor, lazy loader per id), `GameShell.tsx` (title / HUD / pause / results, rewards, coin #9),
  `GameHost.tsx` (the full-size Modal; `command({ type: "openGame", id })` from anywhere), `engine.ts` (fixed-timestep
  loop, `fitCanvas`, DOM floaters, seeded RNG). A new game = a module implementing `GameProps` + a registry entry + its
  `BASED_ON`/fact in arcade.ts + `ready: true` in games.ts. Inside a game, draw effects with `api.float` (the FX canvas
  is under the dialog); toasts and the level-up banner wait until the game closes. Canvas games render in
  `api.onFrame` (simulate in `onTick`); a game with its own loop (R3F) stops it on the `paused` prop. Every R3F canvas
  imports `@/components/three/quietThree` first. While a game is open `html[data-game-open]` rests the page behind it
  (`--play`, the grid, 3D stages) — honour it in any new background loop. The Prize Counter is
  `src/components/prizes/PrizeCounter.tsx` (booth portal + pause-menu tab); BYTE's hats are `src/components/byte/hats.tsx`.
- `@keyframes` names are global across every stylesheet: prefix new ones by feature (`funsole-on`, `quest-pop`); the
  build fails on a name defined twice with different bodies (#120).
- Keep the page idle (docs/DECISIONS.md #40–41): no always-on rAF loops, continuous CSS animations only on HTML elements' transform/opacity (never on SVG elements), no style writes inside scroll events (use `onScrollMotion`), and get GSAP/ScrollTrigger via `loadScrollTrigger()` only where needed.
