# Decisions log

Choices made on top of the Bible ([FUNFOLIO_BIBLE.md](./FUNFOLIO_BIBLE.md)), which stays verbatim. Append new entries;
change an entry only when the decision itself changes.

## After PART 0 — defaults (the questions went unanswered, so the proposed defaults apply)

1. **Phone stays out of git.** `player.phone` is `""` while `showPhone` is `false`, and it is rendered nowhere; the
   Bible copy masks the same value. Paste the number back only when you decide to show it. (A public résumé PDF that
   lists it publishes it anyway.)
2. **3D on phones.** Phones start on the SVG island (NONE tier) and swap to LOW-tier 3D after the first tap or scroll;
   desktop keeps the boot-time preload. Protects the Lighthouse mobile ≥ 70 budget. Applies in PART 5 / PART 17.
3. **Facts awaiting confirmation (prompts.md Appendix B).** The EY / United Airlines date overlap is shown as given;
   both papers stay "Presented"; the PM2.5 paper's host/dates and both DOIs render "Coming soon" — nothing is
   borrowed from the cold-chain paper.
4. **Palette contrast (measured).** Colored fills use the bright values with ink text in every theme (ink on the deep
   values is only 2.5–3.6:1). Day-theme violet fills use `#A78BFA` (day ink on `#8B5CF6` is 4.14:1). Deep values are
   day-theme text on bg/surface; on surface-2 (`#FFE9C7`) deep pink/lime/yellow/orange drop to 4.16–4.37:1, so there
   they are large-text only (≥ 24px, or ≥ 18.66px bold).
5. **Pre-paint script.** An inline `<head>` script sets `data-theme`, `data-fx`, `data-mode`, `data-cursor` and
   `data-world` on `<html>` before first paint, from the saved prefs, `prefers-reduced-motion` and the URL:
   `?speedrun` (recruiter link), `?theme=night|day|retro`, `?fx=chill|normal|chaos`. Visitors without JS get the
   night theme and every word of content.
6. **Build tripwires** (`scripts/check-export.mjs`, runs after every `npm run build`): fail on a raw `TODO`,
   `undefined`, `NaN` or `[object Object]` in exported HTML (R1), on third-party asset URLs (R10), and on initial JS
   over 250 KB gzip (§10).
7. **Voice.** The bio draft (PART 6) is first person, built only from content.ts and marked DRAFT; BYTE refers to
   Akshat by name.

## PART 1 — Foundation

8. **Cache Components off.** The Next 16.4 scaffold enabled `cacheComponents` + `partialPrefetching`; both target
   server streaming (Node runtime) and are removed for the pure static export.
9. **`trailingSlash: true`** — every route exports as `route/index.html`, which any static host serves as-is.
10. **Rainbow worlds** (Title, Arcade, Credits) use coin gold `#FFC83D` as their single `--world` accent
    (day-theme text: `#A16207`). Trophies uses orange; its orange→gold gradient is decoration.
11. **Hero size** follows the 72–152px scale from ~490px viewports up and scales down below that (≈50px at 360px):
    "SHARMA" measures 5.85em in Unbounded Black, so a fixed 72px minimum would overflow phones (WCAG 1.4.10 reflow).
12. **Plain names.** The Title Screen's plain name is "Home" (the Bible's "Hero" is a developer term). The Launchpad
    reads "THE LAUNCHPAD · Gate to Experience".
13. **Theme-scoped tokens.** Semantic colors are declared on `[data-theme]` and the world accent is re-derived on every
    `[data-theme]` / `[data-world]` scope, so themes and worlds nest correctly (the playground renders all three
    themes side by side). `--world` / `--world-fg` are registered `<color>` properties and animate over 600ms.
14. **Reduced motion.** Honored via the media query and a future in-app switch: PART 3 only has to set
    `data-motion="reduce"` on `<html>`; CSS (the `--motion` / `--play` switches) and `useReducedMotion()` already read it.
15. **`/playground` is noindex via a meta tag**, never a robots.txt `Disallow` (which hides the noindex from crawlers
    and advertises the path).

## PART 2 — Cursor system

16. **Three cursor attributes on `<html>`:** `data-cursor` = variant (always `default` at load; only
    `useGameCursor()` / `claimCursor()` change it, stack-safe), `data-cursor-skin`, `data-cursor-size`. Since PART 3
    skin and size live in the save (`inventory.equipped.cursorSkin`, `settings.cursorSize`); `src/lib/apply.ts` calls
    `setCursorSkin()` / `setCursorSize()` from `src/lib/cursor.ts`.
17. **Cursor art = 16×16 masks** (`src/components/cursor/cursor-art.ts`); the build adds the dual outline. The 32/48/64
    sizes are exact 2×/3×/4× renders, so outlines are 2/3/4px. Generated SVG/PNG + CSS are committed — rerun
    `npm run cursors` after editing skins or art (URLs carry a cache key).
18. **Global variant semantics:** `html[data-cursor≠default]` forces that cursor everywhere, links and text fields
    included (drags, games, 3D hovers). Element-level variants use `[data-cursor]` attributes.
19. **The follower lives in the top layer** (`popover="manual"`) and re-raises itself whenever a dialog or popover
    opens, so it is never under a modal. Locked skins are previewable in `/playground`; PART 11's Prize Counter gates them.
20. **Hotkey L** is ignored while typing, inside an open dialog, or inside `[data-keyboard="exclusive"]` (games).
    Since PART 3 it lives in the keyboard manager (#28), which calls `locateCursor()`.
21. **Shake-to-find emits `cursor:shake`** on `src/lib/bus.ts`; PART 3 listens to unlock "Shaky Hands". Re-entry pings
    fire only after a real exit — the first pointer move after load is not a re-entry.
22. **Magnetic lean:** `.arcade-btn` and `[data-magnetic]` move ≤ 6px toward the pointer (3px in CHILL, off under
    reduced motion); the pointer never moves.
23. **Trail:** its own canvas for now, max 6/10/14 squares by `data-fx`, with an ink rim so squares read on light
    backgrounds. PART 4 moves it onto the shared FX canvas.
24. **Night rim (from the PART 1 look check):** `--rim` (14% white) outlines cards, buttons and their hard shadows on
    night/retro; transparent on day.

## PART 3 — Game engine & HUD

25. **One save, versioned.** localStorage `funfolio-save` (zustand `persist`, version 1). `migrateSave()` is a
    ladder (one step per version), then `normalizeSave()` sanitizes everything: unknown achievement/coin/prize ids are
    dropped, numbers clamped, retro needs ownership, a corrupted or future save never crashes. The PART 1–2 key
    `funfolio:prefs` seeds a new save once and is then removed. URL overrides (`?theme=`, `?fx=`, `?speedrun`) stay
    session-only and never touch the save. Reset erases progress but keeps settings (retro → night).
26. **The game layer loads after hydration.** Store, registries, HUD, toasts and shortcuts are one lazy client chunk
    (`GameRuntimeLoader`, `next/dynamic` with `ssr: false`); the pause menu is another, fetched on first open.
    Server-rendered islands (PRESS START, SAVE FILE, Speedrun buttons) send plain-object commands through
    `src/lib/commands.ts`, queued until the runtime is ready. Measured: initial JS 149.1 KB gzip, runtime +69.5 KB
    after hydration, pause menu +10 KB on first open.
27. **XP rules.** First visit of each world +50 (the world in view at load counts), details +10, CTA +5, coin +25,
    achievement = its own XP. One-time reasons (`visit:` / `open:` / `cta:` / `coin:` / `achievement:` + id) pay
    once per save; game XP is capped at 200 per session. Level rewards: LV3 party hat, LV5 Retro Green cursor,
    LV7 Retro CRT theme, LV10 Rainbow cursor. Achievements live in `src/content/achievements.ts` (35; secret ones show
    "???"), coins in `coins.ts` (12), prizes in `prizes.ts`, thresholds in `levels.ts`.
28. **One keyboard manager** (`useKeyboardShortcuts` in `src/components/hud/useGameRuntime.ts`) — no other global
    keydown shortcuts. 0–8 worlds · Esc pause · M map · L locate cursor · Shift+S sound · Shift+D day/night ·
    Shift+R Speedrun · `` ` `` terminal (PART 16) · ? controls. Nothing fires while typing; inside a dialog or
    `[data-keyboard="exclusive"]` only Esc is global; every other single letter is reserved for typed easter eggs
    (PART 16). Esc is layered: a tooltip opened by keyboard focus consumes the first Esc (WCAG 1.4.13), a hovered one
    doesn't.
29. **Speedrun Mode is CSS on the same DOM** (`html[data-mode="speedrun"]`): the server-rendered SpeedrunSummary
    shows; `.title-play`, `#launchpad`, `#arcade`, `[data-byte]` and `[data-speedrun="hide"]` hide; sections condense;
    FX → chill; World 2 jumps to the Quest Log. Toggles: Title button, HUD bolt / Shift+R, Pause → Settings, the
    "▶ Back to Play Mode" pill (boot toggle: PART 5). Toasts sit top-right (phones: a slim toast over the HUD) and the
    level-up banner is hidden on phones, so nothing covers the summary. The whole summary fits the first screen at
    1280×800 and 390×844.
30. **Speedrun highlights are references, not copies.** `speedrun.highlights` in content.ts points at existing stats
    (`{ from: "experience" | "project", id, stat }` or `{ from: "honor", id }`; two refs share a tile);
    `resolveHighlight()` reads the value and the schema
    fails the build on a dangling reference (R1).
31. **Sound.** ZzFX (and its AudioContext) loads only after the first gesture and only while sound is on. The
    first-gesture listener is installed at startup, so the click or Shift+S that turns sound on counts as that
    gesture; up to 3 sounds requested while ZzFX loads are queued (600ms TTL).
32. **Pause menu = native `<dialog>`.** Tab / Shift+Tab move explicitly through the reachable controls and wrap
    (Safari's default Tab skips buttons, so edge-only trapping leaked there). Announcements made while a dialog is
    open go to the dialog's own live region (everything outside a modal is inert). Open → `html[data-paused]`
    (idle loops freeze) + `game:pause` / `game:resume` on the bus.
33. **Themes.** Day/night uses a View Transition: a circular clip-path sweep from the toggle (instant without the
    API, without an origin or under reduced motion). Retro is earned (LV7, Cheat Code, Prize Counter); `?theme=retro`
    remains a session-only preview. Lights Out unlocks on the first switch, Pixel Perfect on retro.
34. **HUD.** Rendered before `<main>` so Tab order matches the screen (skip link → HUD → content). 56px on the Title
    Screen, 44px after; its bottom edge (64px) equals `scroll-padding-top` / `HUD_OFFSET`. Glass at 84% opacity keeps
    HUD text ≥ 4.5:1 over anything underneath. Narrow screens drop the brand, world label, trophies chip and map
    button (all reachable in the pause menu); the level-select rail hides below 768px (Pause → Map instead).
35. **Tooltips follow their trigger one frame after a scroll** (rAF). Repositioning inside the scroll event is a
    scroll-linked effect — janky with async panning (Firefox warns).
36. **Cross-engine QA.** Besides system Chrome, Playwright's bundled WebKit (Safari engine) and Firefox run the
    cursor, HUD, pause menu, theme, persistence, Speedrun and axe checks.
