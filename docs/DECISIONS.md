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
23. **Trail:** max 6/10/14 squares by `data-fx`, with an ink rim so squares read on light backgrounds. Since PART 4 it
    draws on the shared FX canvas (`fx.trail`); the follower has no canvas of its own.
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
    after hydration, pause menu +10 KB on first open. (PART 4: after hydration 39.1 KB in total — runtime 20,
    FX layer 7.4, BYTE 6.2, Lenis 5.3 — now that GSAP/ScrollTrigger load on demand, #40.)
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

## PART 4 — FX layer & BYTE

37. **One FX overlay canvas** (`src/components/fx/engine.ts`) for bursts, floating text, confetti, the cursor trail,
    pixel dissolves, hit-stop and shake: fixed, `pointer-events: none`, DPR ≤ 1.5, z-index 90 (above the HUD and
    BYTE, below the top layer, so dialogs, toasts and the cursor follower stay on top — R2). Its rAF loop runs only
    while something is alive. Everything goes through the `fx.*` facade in `src/lib/juice.ts` (no-ops until the
    lazy FX layer registers, and under reduced motion, where it is never mounted). Confetti is drawn natively on
    this canvas, so canvas-confetti (which owns and clears its own canvas) was removed from the dependencies.
    `fx.shake` moves the FX + grid layers and an optional game playfield — never the reading content (R6).
38. **Click juice stays out of reading zones.** A real click (not a drag, selection, field, BYTE, dialog or game)
    bursts 4 / 10 / 24 pixels (CHILL / NORMAL / CHAOS), shows a 1-in-4 floating word or "COMBO ×N" (never in
    CHILL) and ripples the grid — unless any of 12 sample points around and above it lands on reading text
    (`p, li, dd, h1–h6, …`), in which case it stays silent. 10 clicks in 3s → button-masher (also under reduced
    motion, where nothing is drawn).
39. **Living grid** (`src/components/fx/grid.ts`) replaces the static CSS grid, which stays as the no-JS and
    reduced-motion fallback (`html[data-grid="live"]` hides it). Lines are drawn once; each frame repaints only lit
    cells; the loop sleeps when nothing is lit. No lighting or twinkles behind reading text. Attract-mode twinkles
    start after 7s without pointer movement, last at most a minute, and never run in CHILL, while paused or hidden.
    Touch: no hover lighting; a tap ripples (via click juice).
40. **The page really idles.** Measured at rest: 0 requestAnimationFrame callbacks and ~1–2% main-thread time.
    To get there: Lenis runs on its own rAF loop that sleeps when idle and wakes on wheel / touch / keys / pointer /
    scroll, with a clamped virtual clock so the first frame after a nap doesn't jump (it no longer rides the
    always-on GSAP ticker). GSAP + ScrollTrigger load on demand via `loadScrollTrigger()` — while enabled,
    ScrollTrigger keeps a perpetual rAF loop (its Firefox repaint workaround), so the first part that needs scroll
    choreography pays that cost. Continuous CSS loops must be compositor-only: transforms/opacity on HTML elements
    (Chrome can't composite transform animations on SVG elements, so the rail bounce and BYTE's antenna glow animate
    HTML wrappers). Off-screen tickers skip rendering (`content-visibility: auto`).
41. **No scroll-linked effects.** Nothing writes styles inside a scroll event: scroll-motion listeners
    (`onScrollMotion`: decor, tickers) are coalesced to the next animation frame, and tooltips follow their
    trigger one frame later (Firefox flags writes during scroll dispatch).
42. **LED ticker dividers** (`TickerDivider`, server-rendered, aria-hidden) between every pair of worlds, in the next
    world's color, alternating directions, every item computed from content (`tickerItems()` in derived.ts; unknown
    values are left out). The LED board is dark in every theme, so the text uses the bright text-safe value of the
    world color. The LED look comes from unlit dots on the panel plus a fine 2px texture on the glyphs that never
    drops below 60% — a coarser dot mask made "2" and "5" read as "8" (R1: decoration must not show numbers that
    look wrong). Speed and skew follow scroll velocity via Web Animations `updatePlaybackRate`; hover pauses;
    static under reduced motion; hidden in Speedrun Mode.
43. **WorldHeader intro** (`src/components/fx/intros.ts`): first view of a header per session (sessionStorage), not
    for headers already on screen at load (no replay over text being read), not under reduced motion or in
    Speedrun Mode. ≤ 900ms, inline: band wipe, badge stamp, letter drop (stepped, with a bounce), "READY? GO!" chip,
    powerUp sfx. Letters are split only for the animation (aria-hidden + an sr-only copy); the original text node
    comes back afterwards. Rainbow titles drop as one block.
44. **Sticker peel + tilt.** Secrets are original code jokes and pixel doodles; fun facts appear once
    `player.funFacts` has some (R1 — never invented). "Rarely a coin" = a **spare coin**: one card (Vault ·
    Predictive Customer Churn Analysis) hides a one-time +1 wallet coin (+10 XP, `collectSpare`), pocketed with a
    real button — it is not one of the 12 hidden coins, so "x/12" stays meaningful. The peel closes with 160ms of
    hysteresis and tilt freezes while the pointer is on the peel (a tilting card moved the corner out from under
    the pointer and made it flicker in WebKit). Tilt is gentler on text-heavy cards: Quests ≤ 3°, Lab and Vault ≤ 4°.
45. **BYTE** (`src/components/byte/`): script built on the server (`buildByteScript()`), so content.ts stays out of
    client chunks. 28 quips, each assembled from content values and checked at build time against the exact
    content fragments it restates (a quip whose evidence disappears is dropped). World lines and tips that mention a
    feature wait for its hook to exist on the page — `[data-slingshot]`, `[data-boss-fight]`, `[data-cartridge]`,
    `[data-arcade-game]`, `[data-jd-scanner]`, `[data-contact-form]`, `[data-coin]` — so today only the Profile and
    Trophies lines and the first two tips play. The Bible's "quests" line (pull me back) belongs to the Launchpad
    slingshot. Bubbles are aria-hidden; a deliberate keyboard press on BYTE also announces the quip; arrow keys move
    BYTE (drag alternative, R5). BYTE never covers an interactive element: exact rect intersection against
    everything clickable on screen → glide to the nearest free spot, back home when it frees up, tuck away (like
    minimized) when nothing is free. Home position (fractions of the viewport) and minimized survive a reset; said
    lines don't. Hidden in Speedrun Mode and when turned off in Settings. Petting doesn't count as shake-to-find.
46. **Playground: Juice kit & BYTE panel** drives every `fx.*` call and `byte.react / say / point` by hand.

## PART 5 — Boot sequence & Title Screen

47. **When the boot runs.** Decided before first paint (`html[data-boot]`, pre-paint script #5): home page only,
    `full` on a first visit (no `meta.lastVisit` in the save), `fast` for returning players. Never in Speedrun Mode,
    on a deep link (`/#lab` — the visitor asked for a world), with `?boot=0`, or without JavaScript; `?boot=full`
    forces the first-visit boot. A black curtain covers the first paint while `data-boot` is set and hides itself
    after 6s by CSS alone, so a failed chunk can't hide the page (R3). If the runtime mounts later than 4.5s after
    navigation (slow network), the boot is skipped — the page has been readable too long to interrupt.
48. **The boot is a native modal `<dialog>`** (lazy client chunk, ~8 KB gzip): focus stays inside, the page behind is
    inert but fully server-rendered, Esc (the dialog's cancel) = skip. Any other key skips after 400ms, "Skip ▶▶"
    always does, and 8s idle at INSERT COIN continues muted. Skipping unlocks Skipper; idling doesn't. Focus lands
    on the coin at INSERT COIN, on START WITH SOUND after the coin, and on the Title's heading when the boot exits.
49. **Real progress, honest timing.** The bar is 35% log + 65% hero island: the island chunk's dynamic import (a
    creeping estimate until it resolves — fetch progress isn't observable for `import()`), drei's `useProgress`
    (three's loading manager; the island is procedural, so it has nothing to load today) and the first rendered
    frames (shaders compiled). Typing is time-based (12ms/char, line beats 55ms) so a busy main thread doesn't
    stretch it, and the log stops waiting for the island at 3s. The island loads only once the boot is on screen
    and renders just its 3 warm-up frames behind it (rendering behind the boot starved the boot's timers).
    Measured on the export: INSERT COIN at 2.5s with a GPU or with WebGL off, 3.4s on SwiftShader.
50. **Software WebGL = NONE tier.** SwiftShader / llvmpipe / "basic render" (via `WEBGL_debug_renderer_info`) get the
    SVG island: their first 3D frame blocked the main thread for ~1.9s.
51. **INSERT COIN.** Click, Enter/Space or drag the CSS-3D coin into the slot (drop zone = the slot ± a margin):
    clink sfx (only after that gesture), CREDIT 01 flashes once, coin #1 "Starter Coin". START WITH SOUND turns sound
    on (that click is the audio gesture), START MUTED keeps it off; both unlock Player One. "Recruiter Speedrun"
    (or Shift+R) exits straight into Speedrun Mode. The coin's face glyphs are CSS-drawn so the button's visible
    text matches its name (WCAG 2.5.3).
52. **CONTINUE? / NEW GAME.** The fast boot shows "LV n · x/12 coins" from the save. NEW GAME asks first (Erase &
    start / Back — erasing progress is destructive), then plays the full boot on a fresh save (settings kept, #25).
53. **Exit = pixel dissolve** drawn on the boot's own canvas (the FX layer sits below the top layer and may not be
    loaded yet): rainbow cells clear in a sweep in ~650ms, revealing the Title underneath.
54. **Landmarks are HTML buttons, not raycast meshes.** The 8 landmarks, the plane and the hidden coin are real
    `<button>`s (keyboard, screen readers, label-in-name "QUEST TOWER · Experience"); the 3D scene projects them onto
    its anchors every frame and hides them (`data-off`) off screen, mid-dive, or — the coin — while the tower covers
    it. Hover/focus makes the landmark hop and its outline glow. The same buttons sit on the SVG island. The button
    layer passes the pointer through everywhere except the buttons, so the name, the CTAs and drags stay reachable.
    Landmark → world: House → Profile, Quest Tower → Launchpad (Quest Log in Speedrun Mode), Observatory → Lab,
    Workshop → Vault, Arcade → Arcade, Skill Tree → Skills, Pedestal → Trophies, Radio Tower → Lobby. Click = GSAP
    camera swoop (0.75s, expo.inOut; skipped under reduced motion), then the smooth scroll, then focus on the world.
55. **Orbit only with a mouse.** OrbitControls rotate-only (no zoom, no pan — the wheel always scrolls the page),
    polar angle clamped to 0.75–1.25 rad, ≤ 3° pointer parallax. Touch-first devices get no OrbitControls (they set
    `touch-action: none` and would swallow page swipes); touchscreen laptops keep vertical swipes (`pan-y`). The
    keyboard/touch alternative to dragging is "Peek behind the tower" (aria-pressed), which turns the island to
    reveal coin #2; on wide screens it sits under the island, clear of BYTE's corner and the rail.
56. **Scroll-out dive without ScrollTrigger.** When pinned, the Title section is 200vh with a sticky 100vh stage (pin
    ≤ 100vh); its scroll progress (read once per frame) raises the island past the camera, widens the fov, thickens
    a cream fog and fades the overlay. The pin (`#title[data-pin]`) is set by the island component only on wide
    screens (≥ 64rem), with motion, outside Speedrun Mode, and only when the whole overlay fits the viewport — it
    wraps taller on narrower windows (1280×800 needs ~890px), and a clipped CTA would be blocked content (R3).
    Unpinned, the stage simply grows with its content and nothing dives (phones included). ScrollTrigger would bring
    its perpetual rAF loop (#40).
57. **Island budget.** One WebGL context; DPR 1.5 (≤ 1.75) on HIGH with antialias and blob shadows, 1 on LOW with
    fewer voxels and no shadows; PerformanceMonitor steps DPR by 0.25 and drops a tier when it gives up. The canvas
    unmounts beyond 1.5 viewports and renders only while on screen (the strip left under the HUD doesn't count),
    unpaused and awake: it naps after 30s without input, and under reduced motion it renders on demand (no idle
    loops, no parallax). The chunk (three + R3F +
    drei pieces + the scene) is 249 KB gzip, lazy, never part of initial JS; Speedrun Mode never loads it.
58. **R3F's THREE.Clock warning is filtered.** R3F 9.8 still constructs `THREE.Clock`, which three r187 deprecates
    with a console warning (§10: zero console errors). `THREE.setConsoleFunction` drops exactly that message and
    forwards everything else.
59. **The name is playable but reads plainly.** The h1's text is an sr-only "Akshat Sharma"; the extruded letters
    are aria-hidden spans, one palette color each (the Title is a rainbow world, R8). Hover = hop + a C-major
    pentatonic note (sound on only). Coin #3: hover the K for 2s or long-press it on touch — a pointer-only egg for
    now; PART 16's typed eggs add the keyboard path (single letters are reserved for them, #28).
60. **Bounded loops (WCAG 2.2.2).** PRESS START blinks at 1Hz five times and then stays lit; the scroll mouse nudges
    four times; nothing title-related animates while the boot is up. The class line types once after the boot
    (screen readers get the full list; a hidden ghost line reserves the space, no layout shift).
61. **BYTE on phones (PART 4 finding).** Below 48rem there are no gutters, so an unrequested bubble lands on the text
    being read (R6). There, tips and world lines wait behind a "!" badge on BYTE (its name says "has something to
    say"); a tap plays the waiting line before any quip, and any open bubble closes once the page scrolls 48px on.
    Wider screens are unchanged.
62. **Confetti falls behind the words (PART 4 finding).** Celebration confetti (level-ups) is drawn first and every
    box with words on it — reading text plus links, buttons and fields (`TEXT` in `src/components/fx/readZones.ts`;
    click juice's quieter zone is `READ`, since bursts on buttons are wanted) — is erased from it before the other
    effects are drawn, so it shows around the words, never on them. The boxes are re-measured after scrolling and at
    most every 300ms, only while confetti is alive.
63. **The Title never widens the page.** Hidden landmark labels (nowrap, centered on a marker near the edge) made a
    390px phone 449px wide. Labels near an edge now anchor to that side (static positions on the SVG island,
    projected every frame in 3D), and `#title` has `overflow: clip` (sticky-safe) as a safety net.
64. **WebGL probe without console noise.** The tier probe reads `RENDERER` first; only browsers that mask it
    ("WebKit WebGL": Chrome, Safari) are asked for `WEBGL_debug_renderer_info` and get the probe context released at
    once. Firefox reports the renderer directly and logs a warning both for the extension and for a deliberately lost
    context, so there the 1×1 probe is left to garbage collection. Firefox still notes "WebGL context was lost."
    when the island unmounts (R3F releases its context) — expected, not an error. The canvas box is snapped up to
    a multiple of 4 CSS px: three.js floors the drawing buffer but rounds the viewport, so a fractional
    size × DPR made the viewport 1px larger than the buffer (Firefox warned); with DPR steps of 0.25 the product is
    now always whole.
65. **Moving things never steal a click.** The circling plane's button hides while it crosses the Title's text column
    (its right edge is measured with the pin check and shared through `island.textRight`). BYTE's fixed speech bubble
    re-checks what it covers when the page scrolls under it (≤ every 120ms, only while speaking) and lets the
    pointer through over anything interactive — sticker peel corners now count as interactive, for BYTE's body too.

## PART 6 — Player Profile

66. **Character-sheet bento** (`src/components/sections/ProfileSection.tsx`): 12 columns on desktop, 2 on tablets, 1 on
    phones, dense packing so the tablet layout leaves no holes. Every tile is a StickerCard titled "GAME NAME · plain
    name" (R9: "XP STATS · Grades"); text tiles tilt ≤ 3–4°, the perks and the crate don't tilt (they move by
    themselves); five tiles hide a peel secret. The spawn-point tile is left out while `player.base` is "TODO" and
    becomes a full-width strip once it exists.
67. **Idle nap** (PART 5 finding): after 30s without input `html[data-idle]` pauses every decorative CSS loop (they all
    run on `--play`); the next pointer move, key, wheel, touch or scroll resumes them at once. Measured after the nap:
    0.5% main-thread time (vs ~4–20% before). Since PART 7 the living grid's attract mode stops then too (#88).
68. **Everything on the sheet is computed** (`src/content/profile.ts`, server-side): Class = the first class, Subclass =
    the Full-Stack class, Guild = the school, Status = the current role's company; quick stats are `counts`;
    "Currently playing" = the current role, "since" its start, and headline phrases shown only while they appear
    verbatim in its bullets ("LLM Model Monitoring", "Cartographer").
69. **DRAFT bio** (#7): `bioDraft()` writes three first-person sentences from content values only — degree, school,
    period and CGPA; the current role and its first bullet; internship / project / paper counts, two project genres
    and the venue code. Marked DRAFT in code (and `data-draft` in the DOM); `player.bio` replaces it when written.
    Fun facts, once added, are also listed visibly in this tile (R3), not only in peels and the crate.
70. **Perks restate facts.** The names are game labels; every back face is a content value (a stat or an honor) with
    its source, and schema.ts fails the build when a perk's fact disappears. Flipping is purely visual: both faces
    are in the button's text, so screen readers always get name + fact + source. Hover (real hover devices only) and
    keyboard focus flip; a click or tap pins it (aria-pressed); reduced motion crossfades instead of turning.
71. **Focus radar = evidence counts**, never a self-rating: each axis counts the résumé entries (roles and projects)
    whose stack lists at least one of the domain's items; Research = the number of papers. The buckets are a
    classification in profile.ts (schema.ts checks every item exists in some stack — a typo would undercount).
    Today: GenAI 2 · ML & Data 3 · Backend 4 · Frontend 5 · Java & OOP 2 · Research 2. The legend names the entries
    behind every number. The SVG is geometry only; its labels are HTML placed with container units so they stay
    ≥ 12px at 320px, and the two longest labels sit at the top and bottom. Draws in on first view.
72. **XP stats.** The ring fills to the CGPA's real ratio on first view and shows it exactly as written ("8.79/10").
    "Previous saves" are 20-segment meters, floored so a score is never over-lit (95.4% → 19 segments).
73. **Avatar + high-five.** Until `player.photo` exists: original pixel art (`src/content/avatar.ts`, colors editable)
    that breathes, framed by a holo-foil ring — a rotating conic layer under a static mask, compositor-only (the
    shared `.sticker[data-variant="holo"]` animates a custom property on the main thread). A click / Enter waves and
    calls `byte.visit()`: BYTE glides next to the avatar (never onto anything clickable; a scroll ends the visit),
    a star burst and "High five!" (it interrupts BYTE's current line), then back home. Under reduced motion, on phones
    or without free room it answers from its corner. One-time +5 XP (cta).
74. **Mystery crate** (coin #4): an original pixel loot crate (no "?" — R4) that wiggles; three hits (click, Enter or
    Space), with cracks and a narrated countdown, burst it open → Crate Coin + a fun fact, or "More secrets loading…"
    while there are none (R1). Opened stays opened (the save marks it). Hidden in Speedrun Mode.
75. **The deal** + one-shot animations: the first time the bento comes into view its tiles fly from a deck in the
    middle of the visible grid (50ms stagger, back.out); under reduced motion they fade in. Tiles are never hidden
    without JS, in Speedrun Mode, on a deep link (`/#profile`) or when already on screen at load. The ring and radar
    use the same "server renders the final state, JS arms it below the fold" pattern (`PlayOnView`, ui kit).
76. **Announcements are spaced ≥ 1s** (`src/lib/announce.ts`): two messages at once (a coin toast + the crate bursting
    open, an achievement + a level-up) replaced each other in the single live region before a screen reader got to
    the first.
77. **320px reflow** (WCAG 1.4.10) for the whole page, not just the Profile: world titles cap at 11vw ("LAUNCHPAD"),
    headings may break an over-long word as a last resort, quest cards put the emblem above the name below 25rem,
    the character sheet stacks labels above values below 26rem and the Title's landmark labels wrap. Measured: the
    page is exactly 320px wide.
78. **Off-screen worlds rest.** The runtime marks every world section that isn't on screen (IntersectionObserver,
    64px margin) with `data-offscreen`, which sets `--play: paused` for everything inside it. Chrome ticks even unseen
    compositor loops on the main thread, and the Profile alone added eleven (holo ring, breathing avatar, equalizer,
    crate): with them running below the fold the Title's idle main-thread time rose from ≤ 3% to 9%; paused, it's
    back under 3%. Together with the idle nap (#67), a loop only runs while its world is on screen and someone's there.

## PART 7 — World 2a: The Launchpad

79. **A soft gate, never a wall (R3).** The Quest Log is server-rendered and stays in the DOM while "locked":
    `html[data-quest-log="locked"]` only frosts it (blur, two pixel chains, a lock and "Clear the fortress or press
    Skip — or just keep scrolling"); the overlay passes the pointer through. It opens when the fortress is cleared,
    when a round ends out of shots ("Close enough! Quest Log unlocked anyway 😄"), on Skip ▶▶ (+ Skipper), and as soon
    as the visitor scrolls the list into view or tabs into it (BYTE, interrupting: "Fine, fine… unlocked for you 🙄").
    The pre-paint script (#5) opens it before first paint when the save has it, in Speedrun Mode, under reduced motion
    and on a deep link to any world past the gate (`/#quests`, `/#lab` …); without JS it is simply open. Saved as
    `gates: ["quest-log"]` — SAVE_VERSION 2; the v1 → v2 migration step adds `gates: []`.
80. **Physics tuned in Node, verified in the browser.** Matter.js 0.20, fixed 1000/60 timestep (one `Engine.update`
    per tick), gravity 1 × 0.001, BYTE's frictionAir 0.004, launch speed 22 units/tick × power along the aim, from
    where BYTE is pulled back to (pull radius 170 world units in a 1600 × 1000 world; never under 88px on screen).
    A full pull lands ≈ 1524 (past the far tower at 1450); the coin above the front tower (1080, 400) needs a
    full-power lob at ≈ 50–58° (never reachable at ≤ 88% power). Every number lives in `level.ts`. The trajectory
    preview (12 dots, one every 3 ticks) runs the engine's own per-tick integration (v = v·(1 − frictionAir) + g·dt²;
    p += v); measured against real flights in Chrome, every dot is < 0.5 world units off.
81. **Rules.** 3 shots. A glitch-bug pops (+500, burst, pop sfx) on an impact faster than 4.2 units/tick along the
    contact normal, a 70-unit fall or leaving the stage; a crate tipped past 0.5 rad or pushed 45 units counts once
    (+50). Impacts over 9 → a thud scaled by the hit, 60ms hit-stop and a small shake of the playfield (#37). All
    five popped → "FORTRESS CLEARED!", coin confetti, Bug Exterminator; out of shots → "Close enough!". Either way
    the gate opens and the score is saved (`games.highScores.launchpad`); the first launch ever unlocks Launch Day.
    Coin #5 "Bug Fortress" floats above the front tower.
82. **Input (R5).** A ≥ 88px grab handle around BYTE takes the pointer (`touch-action: none`); the rest of the screen
    keeps `pan-y`, so a swipe elsewhere scrolls the page. The focused stage (`role="application"`,
    `data-keyboard="exclusive"`, so only Esc stays global) takes ←/→ aim (Shift = bigger steps), ↑/↓ power, Space or
    Enter launch, R reset; the first arrow sets 70% power so the preview shows at once. Unfocused, arrows scroll.
    Skip ▶▶ and Reset sit in the game's HUD; Skip works before the game has even loaded.
83. **Lazy and resting (R7).** The game chunk (Matter + sim + renderer: 31 KB gzip) loads when the stage is within one
    viewport — never under reduced motion until "Play anyway", never in Speedrun Mode. Frames run only while
    something moves; at rest a 10fps tick animates the bugs' glitch (off under reduced motion, in the pause menu,
    during the idle nap #67 and off screen). The pause menu freezes the world (`game:pause`). Canvas DPR ≤ 1.5.
84. **The poster.** No JS and reduced motion get a server-rendered SVG of the same level (built from `level.ts`, with
    a text description); reduced motion adds "Play anyway". Speedrun Mode keeps `#launchpad` hidden (#29) instead of
    showing the poster the brief asks for: the mode exists to remove friction, and the Quest Log is open in it.
85. **Unlock choreography.** "Continue to the Quest Log ▼" or Skip ▶▶: the canvas hands its remaining crates over
    (`liftCrates()`) as fixed HTML stickers; GSAP (loaded on demand) spins them up out of the fortress while the page
    scrolls to the Quest Log underneath (`scrollToElement(el, { onComplete })`). The gate opens the moment the page
    arrives — the chains shatter into pixel bursts and the cards deal in (CSS, 70ms stagger) while the crates land on
    the letters of the heading (measured with a Range) — so reading never waits for the flourish: readable 1.1s after
    Skip. Lenis drops `onComplete` when the visitor takes over the scroll mid-flight, so the wait gives up after 2.5s
    and nothing is ever stranded (part7-qa J3). The Quest Log's world intro is skipped for that visit
    (`intro:skip`) so two animations never play at once. Reduced motion: a scroll and a fade.
86. **BYTE around games.** The Launchpad's world line ("pull me back…", #45) plays now that `[data-slingshot]`
    exists — at the Launchpad only (it no longer doubles as the Quest Log's line). A world line plays only if the
    visitor is still in that world 650ms later: a jump or a fast scroll passing through says nothing, and the line
    stays unsaid for a real visit. BYTE's body already avoided the live stage (it is focusable); now its bubble does
    too: unasked lines (world lines, tips) wait behind the "!" badge (#61) while the bubble would open over a
    `[data-game-screen]`. `byte.say(text, { now: true })` interrupts the current line (direct answers to the visitor).
87. **The pixel face misreads at small sizes (finding).** Pixelify Sans has no stylistic alternates; its C is an O
    with a one-pixel notch that fills in at weight 700 ("SCORE" read "SOORE"), and its 5/S and 0/O look alike at
    every size ("500 ERROR" read "SOO ERROR"). In the Launchpad, crate labels use DM Sans 800 (canvas and poster
    share `crateText()`), numbers use the display face (the Bible's "big numbers": HUD values, results, and
    `fx.text(…, { font: "display" })` for the +500 / +50 pops), and the HUD labels, the stage tip and the gate's
    message use the pixel face at 400; the crates that fly to the Quest Log keep the canvas crates' DM Sans. PART 8
    applies the same rule site-wide (#97).
88. **Attract mode naps too** (PART 6 finding): the living grid's twinkles (#39) stop when the idle nap starts (#67)
    instead of finishing their 60s show.
89. **QA hook.** If a test defines `window.__QA_LAUNCHPAD` before load, the game hands it the sim, the preview and the
    world ↔ page mapping; otherwise nothing is exposed.

## PART 8 — World 2b: Quest Log

90. **Every value on the cards is computed (R1)** in `src/content/quests.ts` (server-only). Active quest = the
    `current` role; completed quests = the others in content order (content.ts lists them newest first). The work-mode
    chip shows only when known. Loot = the stack, typed by the Skill Tree category that lists the item (color, type
    line, `#skill-<slug>` link) or neutral when the tree doesn't list it; "Used in" = every role and project whose stack
    has it. Side quests come from `src/content/games.ts` (PART 11 builds the cartridges). EY's "Regulated env" stamp
    shows only for a role without a side quest whose objectives say "regulated".
91. **The active quest's widgets restate real stats.** Each is bound by label to one United Airlines stat (Inference
    cost, Token compression, Eval scenarios, Documentation artifacts) and shows it exactly as written; the Cartographer
    caption is two phrases found verbatim in the bullets; schema.ts fails the build when a binding breaks. The visuals
    are decoration and say so ("Illustrative widgets — every number on them is from the résumé", "illustrative: code
    knowledge graph"): the cost dial has no numbers (the needle settles in a lime band); the token row squeezes into a
    band drawn at 75–78% of its length (= 22–25% compression); the hash is a real SHA-256 of the objective that
    mentions caching, not a cache key; the 2 bolts → 6 docs are the stat's own numbers; the graph is a 14-node
    Fruchterman–Reingold layout computed at build time from a fixed seed (no runtime simulation).
92. **Coin #6 and side quests.** "$0.08" — the head of the cost value — is a button: coin #6 "Cost Coin" and a "Saved
    you a coin" float. Side quest buttons send `openGame`; until PART 11 the runtime answers with a "Side quest ·
    Cartridge not found · <name> — coming soon" toast (`item:acquired` gained an optional `kicker`).
93. **Card anatomy** (StickerCard, tilt ≤ 3°, peel): an emblem button that spins like a coin (Web Animations, two
    turns, clink; no spin under reduced motion); company, role, period and mode chips; a COMPLETE stamp; OBJECTIVES as a
    checklist (decorative boxes; the text stays a list) ticking one box per 150ms with a rising blip, then a three-note
    fanfare and the stamp's thump; LOOT chips with a tinted simple-icons logo (or the item-type pixel icon) and the item
    tooltip, linking to the Skill Tree (smooth scroll, focus, a flash on arrival); XP EARNED tiles (NumberRoll, exact
    strings); a side-quest button, or EY's REGULATED ENV stamp thumping down as it scrolls in. The active quest's
    objectives get "in progress" markers, not ticks. Everything is server-rendered in its final state; one delegated
    island (`QuestLogFx`) arms only what is below the fold or behind the closed gate — never under reduced motion or
    in Speedrun Mode — and plays it on view, after the gate opens.
94. **Read a card for 3s → +10 XP** (`XP_RULES.openDetails`, reason `open:quest-<id>`, once per save) when half of it
    (or half the viewport) stays visible, through the existing XP ghost; not while the gate is closed or the tab hidden.
95. **The trail scrubs without ScrollTrigger.** The brief names ScrollTrigger, whose perpetual rAF loop (#40) would end
    the page's idle state. `QuestTrail` measures the cards per layout (ResizeObserver) and scrubs from a passive scroll
    listener that schedules one rAF: dash offset + `getPointAtLength` for BYTE. Measured: zero frames at rest, p95 frame
    10ms while scrolling. Desktop (≥ 64rem): cards alternate at 42% width with a 9rem overlap and the trail snakes across
    the channel every ~240px through a node beside each card; narrower screens get a straight rail on the left. The walk
    cycle runs only on real steps (≥ 0.4px — not the sub-pixel tail of an easing scroll). Reduced motion: drawn in full,
    no walker. Speedrun Mode: no trail, cards stacked. No JS: a dotted CSS rail. The walker is the `byte` pixel icon,
    rendered on the server (no icon data in client JS).
96. **Skill Tree anchors.** Every skill has `id="skill-<slug>"` (unique — checked); PART 13 keeps the ids. A deep link
    to `#skill-…` opens the Quest Log's gate before first paint, like a world past it (#79).
97. **Pixel-face legibility, site-wide** (#87, applied): Pixelify Sans renders at 400 for 12–14px labels and 500 for
    16–22px text (arcade buttons, tooltip titles, the boot title), 700 only from 24px up; numbers move to the display
    face — HUD coin and trophy chips, toast and ghost XP, "CREDIT 01", Meter values, the radar's counts and every digit
    run in the LED tickers (the LED mask still applies). The FX layer's pixel words render at 500. Left: at 12px the
    pixel B and G (and O and 0 in words) still look alike — a different pixel face would solve that.
98. **320px reflow.** The Quest Log's grid columns are `minmax(0, 1fr)` (an `auto` column grows to its widest
    min-content: "Technologies" at 28px is wider than a 320px card), company names scale down to 6.6vw, and `#quests`
    clips horizontal overflow so a stamp thumping in can't widen the page.
99. **The gate's frost no longer dims** (PART 7, #79): blur + desaturation + the chains say "locked"; the 60% opacity
    went, because the new cards' muted labels, the violet loot chips and deep lime on day sit near 4.5:1 and fell
    under it (axe) while frosted.

## PART 9 — World 3: The Lab

100. **A custom R3F globe, not react-globe.gl.** Lighter, and it shares three + R3F with the Title island (no new
     dependency). HIGH tier on fine pointers only; LOW / NONE tiers, touch-first devices, Speedrun Mode and no-JS get a
     server-rendered flat dot map with the same arc, pins and labels. The land is Natural Earth 1:110m (public domain)
     bundled in `public/data/`; `npm run globe` turns it into `land-dots.json` (4,618 dots, 16.5 KB gzip) — the only
     file the globe fetches, from the site itself (R10; measured: zero third-party requests). Hexagon dots (one
     InstancedMesh), a violet fresnel atmosphere, a dashed great-circle arc (drei Line) with a gliding paper plane,
     pulsing pins and HTML labels projected every frame (hidden behind the globe). The spin lingers while the route
     faces you, pauses on hover and drag, has a "Pause spin" toggle (WCAG 2.2.2) and "Show the route". It renders only
     while on screen, unpaused and awake, and unmounts beyond a viewport (measured: no frames off screen, at the idle
     nap or in the pause menu); reduced motion renders one still frame.
101. **The route stays inside the facts (R1).** Coordinates come from the brief (Jaipur 26.84 N 75.56 E, Hanoi
     21.03 N 105.83 E); the route exists only while a paper's host names Hanoi, so the PM2.5 paper's unknown host
     borrows nothing (#3). Labels and caption say "Presented at SCI-2026 · April 28–29, 2026 · Springer LNNS" — the
     dates exactly as written, never "travelled" — and the figure is labelled "Research route · illustrative".
102. **Lab stats are computed** from the venues: conference codes (`SCI-2026`), the series in parentheses (Springer
     LNNS), "international" when a venue says so, plus `counts.papers` → "2 papers · 1 international conference ·
     Springer LNNS · SCI-2026".
103. **Boss cards.** Original 24×24 sprites in `src/content/bossArt.ts` (editable rows, two frames; each frame is an
     HTML-wrapped SVG, so the steps() idle stays compositor-only). The full title in Unbounded (1.05–1.4rem), never
     truncated; PM2.5's host and dates "Coming soon". On first view below the fold: 3 hits 650ms apart (≈ 1.5 flashes
     per second, R5) with the brief's damage words (game copy, kept in bossArt.ts) in the display face and a
     playfield-only shake, then DEFEATED and a small burst. The server HTML is the defeated state (no JS, reduced
     motion, Speedrun Mode, already on screen). No tilt on boss cards (the arena is a play area).
104. **The Smog Golem.** 28 seeded smog blobs behind the arena's content (the boss name sits on a dark plate, R6); the
     pointer is an air purifier — a dashed ring follows it, taps clear too — and "Run the air purifier" is the
     keyboard path (R5). ~90% cleared → blue sky, the golem shrinks, coin #7. Replayable; the coin pays once.
105. **The scroll.** "Read the scroll · Abstract" opens the Modal as parchment between two rollers, unrolling in 7
     steps (instant under reduced motion); it redefines the semantic tokens locally, so every component inside keeps
     its contrast. It shows the boss, the abstract ("Coming soon"), keywords, the conference details and links only
     when they exist. A `scroll` command pays +10 XP once per paper; both opened → Bookworm. "Cite · BibTeX" copies the
     BibTeX ("Item acquired · Citation") once content has it; until then it is disabled with "BibTeX coming soon".
106. **The room.** `#lab` is deep violet (lavender in the day theme) with a hex grid, a sheen masked to the hex lines
     and 12 rising pixel bubbles — compositor-only loops on `--play`, hidden in Speedrun Mode. The globe's view is dark
     in every theme (a screen, like the Launchpad).
107. **BYTE's Lab line** ("Boss fights ahead. Bring snacks.") plays now that `[data-boss-fight]` exists (#45).
108. **Research interests:** `player.researchInterests` (new, empty) — chips only when it has entries.
109. **Pixel-face candidates** (#97 follow-up): a comparison sheet of the misread strings. Tiny5 keeps Pixelify's width
     and look and separates B/G, C/O and 5/S; Silkscreen is clearest but ~40% wider; Jersey 10 / Handjet are
     condensed. Recommendation: Tiny5 — Akshat's call (the Bible names Pixelify Sans).

## PART 10 — World 4: Cartridge Vault

110. **Pixel face: Tiny5** (deviation from the Bible's Pixelify Sans, following #97 / #109 — the recommendation was
     forwarded twice and applied). Same width and look; B/G, C/O and 5/S are distinct at 12px. It has one weight
     (400), so the #97 weight ladder is gone and `font-synthesis-weight: none` keeps browsers from smearing a fake
     bold; numbers stay in the display face. next/font exposes it as `--font-pixelface` (read by `--font-pixel` and
     the FX layer). Credits and the style tile name it.
111. **Cartridges are computed** in `src/content/vault.ts` (server-only) from `projects`: tabs for the categories that
     have projects (+ All); a two-letter monogram; the label's gradient starts at the Vault's pink (R8) and leans
     toward a category tint (AI violet, full-stack orange, tools cyan); one of five pixel patterns; item-type dots
     from the stack (Skill Tree categories, as in the Quest Log's loot). STORY = the first bullet, ABILITIES = the
     rest, STATS = `project.stats` exactly as written, with a bar only for a percentage or a 0–1 score (97% → 97,
     0.98 → 98); STACK = loot chips → Skill Tree. Side quests come from games.ts (RAG Catcher, JD Scanner, Gradient
     Descent — schema.ts fails the build if one is missing); QuizMUJ's egg is a hint for now ("Try switching tabs 😉",
     PART 16); the analyzer's is the page scan (#118). Links stay "Coming soon" (not links) while content says TODO.
112. **One delegated island** (`VaultFx`) on server-rendered DOM: the shelf (real buttons, roving tabindex; arrows
     move in 2D by the measured column count, Home/End), the filter tabs (`aria-pressed`, GSAP Flip reshuffle),
     insert/eject, the locked cartridge, fullscreen and the scan. GSAP + Flip load on the first insert or filter.
     Insert: a dust puff (the first time per cartridge) → a Flip flight into the slot → clack → static (380ms) →
     title card with the powerUp sting (1.25s) → details. The slot cartridge has the shelf cartridge's shape, so the
     flight scales evenly (a wide one stretched the label 2.4× mid-air); seated, its lower part is clipped at a line
     the slot's lip covers. The details screen is in place and takes focus the moment the cartridge leaves the shelf
     (kept dark until the title card ends), so keyboard and screen-reader users never lose focus and can read at once;
     the announcement comes with the details. Eject (button or Esc) flies it home and returns focus to it — or to the
     visible shelf when a filter hides it — and cancels an insert at any step (the shelf answers again at once); Esc
     during the dust puff cancels the insert. Reduced motion: no puff, flight, static or title card. The first insert
     of each cartridge pays +10 XP (`open:cartridge-<id>`); all five → Cartridge Collector (`cartridge` command).
     The locked cartridge ("Locked — next project loading…", chains + padlock) is a button too: 5 blows → coin #8.
113. **Cartridge buttons are named by their own label** (WCAG 2.5.3; axe label-content-name-mismatch): no
     aria-label — the visible title first, an sr-only " — insert cartridge.", then the visible genre ("Cognivault AI —
     insert cartridge. Genre: Multi-Agent RAG"); the monogram, foil and dots are aria-hidden. Hover lifts 12px and
     tilts up to 10° (toys, not text cards — #44's ≤ 4° was for the old project cards); the holo-foil follows the
     pointer. The sticker peels (#44) sit on the labels; the spare coin is still under Churn's. An inserted
     cartridge leaves a dashed outline on the shelf.
114. **Esc in the Vault, in order:** a keyboard-opened tooltip (#28) → the expanded screen → eject → cancel a dust
     puff → (nothing inserted) the pause menu as everywhere else. The Vault's handler runs in the bubble phase, skips
     events already handled and marks its own, which the global manager then skips.
115. **Fullscreen** = the Fullscreen API on the CRT, else (iPhone Safari has no element fullscreen) an expanded fixed
     view. Focus moves onto the screen and comes back to the button on exit (after the browser has left
     fullscreen); an "Exit fullscreen" button inside gives touch a way out; Esc collapses the expanded view, and so
     does focus leaving it (WCAG 2.4.11 — nothing under it may take focus unseen). The open bottom sheet uses
     `translate: none`: any translate would make it the containing block of the fixed view.
116. **Phones and tablets (< 64rem):** the shelf is a horizontal scroll-snap carousel and the console a bottom sheet —
     fixed, it slides up on insert (page scroll locked while open) and away on eject. No flights there; the sheet moves.
     Desktop: shelf | sticky console (sticky top leaves room for the seated cartridge under the HUD).
117. **Manual mode.** Without JS and in Speedrun Mode the shelf and the console's toys hide and every project's screen
     shows as a plain list (R3) — all of it server-rendered. Controls that only work with the runtime carry
     `data-needs-js` and are hidden without JS (no dead buttons): the side quests, the scan, the tab hint — and the
     Quest Log's side-quest buttons too.
118. **SCAN THIS PAGE.** axe-core 4.14 (MPL-2.0; pre-approved by the Bible as a lazy dependency) is imported on click
     from the site's own chunks (R10 — measured: zero third-party requests) and runs on the live document with its
     default rules. A laser line sweeps while it runs (WAAPI, ≥ 1.5s; static under reduced motion). The results card
     is built with DOM APIs (no HTML from the results is ever injected): "Scan complete · N rules passed · M issue
     types found", counts by impact, then "impact · help (n elements) — rule id" per issue; with none it says so and
     adds that automated checks catch only part of what matters. The button keeps focus (`aria-disabled` while it
     runs) and the summary is announced. Honesty is tested: the card must match an independent run of the same axe
     version on the same document (part10-qa F2, engines-p10).
119. **Fixed what the scan found** (the brief: fix anything it finds). label-content-name-mismatch on the cartridge
     buttons (#113), and landmark-unique: the Quest Log cards' Objectives / Loot / XP parts were named `<section>`
     regions repeated on every card — plain groups under their headings now, like the console screens' parts.
     Measured: 0 issues, 47 rules passed, in Chrome, WebKit and Firefox; independent runs in Play Mode with a
     cartridge in and in Speedrun Mode find 0 violations.
120. **@keyframes names are global (finding).** The boot's `crt-on` (it ends at opacity 0) silently replaced the
     Vault's, so every console screen stayed invisible; the same check found two older clashes — `byte-bob` (BYTE vs
     the HUD's mini BYTE, 4px vs 2px) and `pop-in` (globals vs the Quest Log, scale 0.9 vs 0.4), where one file's
     animation ran with the other's keyframes. Renamed (`funsole-on`, `hud-byte-bob`, `quest-pop`); the build now
     fails when a keyframe name is defined twice with different bodies (`scripts/check-export.mjs`).
121. **The FUNSOLE** (original, R4): a chunky ink-violet body, a d-pad, two candy buttons, a power LED (lit while a
     cartridge is in), speaker dots, a top slot with a lip and a CRT — scanlines, glow and a vignette under rounded
     glass for the curve (no distortion filter, so text stays crisp, R6). Attract mode ("Insert cartridge" bouncing
     over a starfield) is compositor-only on `--play` (rests off screen and at the idle nap; measured: zero frames
     at rest). The title card's "Loading…" blinks twice (R5). The CRT is dark in every theme (a screen, like the
     Launchpad). BYTE's Vault line ("Pick a cartridge. Blow on it first. Trust me.") plays now that `[data-cartridge]`
     exists (#45).

## PART 11 — World 5a: The Arcade

122. **The real-work map** (`src/content/arcade.ts`, server-only). A cabinet's "Based on" line is a phrase found
     verbatim in a résumé entry's bullets plus that entry's name ("Token compression · United Airlines"). The results
     screens' "That's real:" lines are assembled from stats and checked against the bullet they restate (schema.ts
     fails the build when the evidence goes): "Akshat's real result: 22–25% token compression + SHA256 caching →
     $0.08–0.11/run." (the stat as written — "/run", not the brief's "per run"), "…SHA256 caching across 35 eval
     scenarios (plus token compression) → $0.08–0.11/run.", "Real life: 90%+ test coverage and ~30% fewer
     post-integration defects." Token Squeeze's target (22%) and its meter's band (22–25%) come from the "Token
     compression" stat. The runtime gets all of it as a prop (layout → GameRuntimeLoader, like BYTE's script), so
     content.ts stays out of client chunks. PART 12's three cabinets stand "Out of order", their lines already shown.
123. **One game host, on any page.** `command({ type: "openGame", id })` opens a ready game in the lazy GameHost — the
     Modal at a new full size (top layer, so the cursor stays above, R2); not-ready games still answer "coming soon".
     The Quest Log's side quests (Token Squeeze, Bug Whack) open their games now; PART 15's 404 and PART 16's idle chip
     will send the same command. The dialog's title carries the plain name ("Token Squeeze · Token compression · United
     Airlines", R9).
124. **The GameShell** (`src/components/games/GameShell.tsx`). Title card: pixel logo, "Based on real work", the how-to
     as key icons plus a touch line, the goal, best, PRESS START (focused). HUD: score, best, time, lives, one game stat
     (numbers in the display face). Pause: P, Esc or the HUD button, and automatically on window blur or a hidden tab —
     Resume, Restart (R), Exit. Results: headline, score + NEW BEST, notes, rewards, "That's real:", Play again (R),
     Exit. Esc pauses a running game first and leaves on the next press (browsers force-close a dialog on a second Esc
     without user activation anyway). Focus: PRESS START on open; into the game on every start and resume (each game
     marks its current control `data-game-focus`); Resume when paused; Play again on the results; the opener on exit.
     One fixed-timestep loop (60 Hz steps from rAF) runs only while a game is being played in an open dialog; paused,
     it stops and the playfield's CSS / Web Animations freeze (measured: zero frames paused and after closing). Games
     are lazy modules with one contract (`GameApi`: onTick, setScore/Lives/Time/Stat, end, float, say, sfx) and a seed
     per run, made in the Start click so their shuffles stay pure. `fitCanvas` (DPR ≤ 1.5) waits for PART 12's canvas
     games; PART 11's three are DOM games — real buttons for mouse, keyboard, touch and screen readers.
125. **Effects inside a game are DOM floaters** ("+10", "MEANING −5", "CACHE HIT!"): the FX canvas sits under the top
     layer, where a dialog hides it. Toasts and the level-up banner (top-layer popovers) wait while a game is open —
     its results screen lists the coins, the hidden coin, XP, a level-up and achievements — and play once it closes.
126. **Rewards.** Every finished run records the score (best + plays) and pays XP (`game:<id>`: 10 a run, 25 on target;
     capped at 200 a session, #27). Wallet coins (`earnCoins`, new): +2 on target, +1 for a run that scored, at most 15
     a session (page load) — replaying pays, farming doesn't empty the shop. The first target beaten in any game →
     coin #9 (High-Score Coin). Token Squeeze ≥ 22% → Compressor. All six games played → Arcade Rat (PART 12).
127. **Token Squeeze.** One of five original bloated prompts per run (`[brackets]` mark the filler; "only", "not",
     "must", "under" are meaningful decoys). Tiles are buttons in reading order — arrows move by measured rows, Enter,
     Space or a tap squeezes. Filler crunches and collapses (focus moves on first); a word that matters shakes, stays
     and costs MEANING −5. Compression = tokens removed ÷ tokens (words); the meter runs 0–45% with the real band
     marked. 30s; squeezing all the filler ends the round early with a time bonus. The prompts top out at 27–40%, so
     22% takes most of the filler.
128. **Cache Hit!** Eight stack items with bundled logos (LangGraph, Next.js, TypeScript, React, Tailwind CSS,
     PostgreSQL, MongoDB, Git) × 2; each card shows the first 8 hex digits of the real SHA-256 of its name — real
     hashes, computed at build time, instead of the brief's fake ones. Hit rate = hits ÷ lookups (a lookup is two
     cards: the brief's "matches ÷ flips" read per card would cap at 50%). 60s; all pairs wins; no miss at all = CACHE
     HIT 100% (+500). CSS-3D flips (a cross-fade under reduced motion); a miss turns back after 750ms of game time.
     Cards are named by the face that shows ("Card 3: Cache — face down", "Card 3: React sha256 …").
129. **Bug Whack.** Nine original mini editors; bugs pop out of a line (it glitches), friendly "feature" sprites (20%,
     after 3s) cost a life. 3 lives, 45s; spawns speed up from every 900ms to 430ms, a bug's life shrinks from 1250ms
     to 650ms, pairs after 55%; combos add 5 a level (up to +20). Keys: the number row reads across (1 = top-left), the
     numpad works by position (7 = top-left). The crosshair cursor while playing (useGameCursor). Reduced motion: no
     pop or glitch motion, 20–25% slower. Target 250.
130. **The hall.** The neon sign flickers on once in view (two flickers in 0.9s, R5); until then it is fully off — a
     dimmed sign below the fold was low-contrast text to axe (and to the Vault's own page scan, which caught it). Six original CSS-3D cabinets —
     top, side and front faces, a marquee with a 16×12 pixel logo (`src/components/games/art.ts`), an attract screen,
     joystick + two buttons, a coin door, FREE PLAY — stand on an arcade-carpet SVG tile (inline, R10); the plaques sit
     on a solid plate (R6). Hover or focus: the cabinet leans in, the marquee flickers on, the joystick wiggles. The
     whole cabinet is one Play button ("Play Token Squeeze"); it zooms a CRT-dark panel from the screen to the viewport
     (380ms, under the top layer), then opens the game; no zoom under reduced motion. Attract screens are CSS loops on
     `--play` (measured: zero frames at rest). Phones: a swipeable snap row. No JS: cabinets and plaques read as art +
     text; the Play buttons are `data-needs-js`.
131. **The Prize Counter.** One store-connected component (its own lazy chunk) in two places: the booth beside the
     cabinets (portaled by the runtime into the server-rendered booth, whose static price list then steps aside via
     `:has()`) and a new pause-menu tab. Cursors · BYTE's hats · Confetti · Themes; every card has a preview (the
     cursor's own 32px SVG, BYTE's head wearing the hat, a confetti swatch, a CRT swatch), the price ("free at LV n"
     for level rewards) and one button whose words start its name: Buy → KA-CHING (a DOM stamp with coins, so it also
     shows inside the pause dialog; plus a coin burst on the page) → Equip → Equipped / Take off (hats) / Switch back
     (theme). Short of coins: aria-disabled + "N more". The Golden cursor isn't for sale: "Find all 12 hidden coins
     (n/12)". BYTE now draws its equipped hat (original art in its own SVG coordinates) — the LV3 party hat finally shows.
132. **Safari doesn't focus a clicked button**, so a dialog opened by a click had nothing to return focus to:
     ArcadeButton (any button with a command), the cabinets and the Vault's side-quest buttons focus themselves first.

## PART 12 — World 5b: Action games

133. **Their real-work lines** (arcade.ts, checked against the bullets they restate): RAG Catcher "Akshat's real build:
     Cognivault AI — a multi-agent RAG system with FAISS + HyDE retrieval."; Pipeline "Real life: data aggregation
     pipelines on an enterprise system with 10,000+ records and 2,500+ daily active users." (its target is the Records
     stat: 10,000); Gradient Descent "Akshat's churn model: 97% accuracy · 0.98 ROC-AUC." (the brief's line, built from
     the stats).
134. **Canvas games in the shell.** `api.onFrame` (one render per display frame while playing) joins the fixed 60 Hz
     `onTick`; games with their own loop (R3F) get a `paused` prop. Canvases size with `fitCanvas` (DPR ≤ 1.5) and a
     ResizeObserver; canvas text uses the resolved next/font family. What must stay readable is DOM — RAG Catcher's
     query and context window, Pipeline's legend and arrow pad, Gradient Descent's learning-rate slider — and the
     playfield is a `role="application"` whose name lists its controls. Tests read live state through an opt-in
     `window.__QA_ARCADE` (like #89).
135. **RAG Catcher.** Six original query sets (six relevant chunks each, every one containing a keyword of its query
     — the part that glows), a shared junk pool and six hallucinations; 45% relevant / 35% junk / 20% hallucination
     (none in the first 2.5s); falling speed and spawn rate ramp over 60s. The RETRIEVER eases toward the mouse, moves
     with ←/→ (or A/D) or follows a drag. Relevant chunks fill the 10-slot context window (+100, combos up to +100
     more), junk pollutes it (−30), a hallucination costs a life (3). It ends when the window is full, the lives run
     out or time's up. Precision = relevant ÷ everything caught (hallucinations count); recall = relevant caught ÷
     relevant that fell; F1 ≥ 0.8 → Nearest-Neighbor Legend, ≥ 0.55 → Senior (the target), else Junior. Reduced motion:
     no glitch jitter or colour split, 20% slower.
136. **Pipeline.** A 22×14 board (14×18 on narrow screens) with wrap-around edges — the hazards are the NULL tiles and
     the pipe itself, as the brief lists them. A step every 140ms, down to 70ms over 60s, with a 3-turn input queue
     (no reversals). Packets: JSON 400 · CSV 600 · PDF 300 · SQL 700 records, +2 segments each; a NULL tile every 5s
     (≤ 10, never near the head). The pipe is one path drawn as glow, body and core with a dashed line flowing through
     it (the packets); the head looks where it's going. Arrows / WASD, 24px swipes, and an arrow pad on touch screens.
     Score = records processed; target 10,000.
137. **Gradient Descent.** The loss is a gentle bowl plus 8 Gaussians (a global pit, 3 local pits, 4 hills) with an
     analytic gradient, and the motion is literal heavy-ball gradient descent — v ← μ·v − lr·∇h + tilt, p ← p + v,
     μ = 0.85 — at 12 visible iterations a second (rendering interpolates; the last 14 iterates trail behind). Tilt =
     the mouse position (a dead zone in the middle), a drag, or the arrow keys. The learning-rate slider is logarithmic
     (0.005–1.58, default 0.05): on a slope a high rate overshoots and diverges (a "Diverged!" banner, back to the
     start); in a gentle pit even 1.58 stays stable — as real gradient descent does. A local pit holds a ball that
     settles in it for 2s (then 1.6s of grace to climb out). Within 0.45 of the global minimum: win + Global Minimum;
     otherwise the score is the loss progress. 3D: R3F in its own lazy chunk (three + R3F shared with the island and
     the globe), a flat-shaded vertex-coloured mesh (sRGB palette converted to linear — it washed out before), the
     flag with a pulsing ring (still under reduced motion), rings on the local pits, DPR ≤ 1.5 (1 on LOW),
     `frameloop="never"` while paused, mounted only while the game is open. No WebGL (NONE tier): a 2D top-down heatmap
     with contour lines and the same physics.
138. **No WebGL context leak** (the acceptance). A closed dialog no longer keeps its last game mounted: the shell
     unmounts 0.4s after the dialog closes and R3F releases its context 0.5s later. Measured: 10 open/close cycles →
     10 contexts made, 10 released (Chrome, WebKit, Firefox).
139. **The page rests behind an open game.** `html[data-game-open]` (set by the game host) pauses the `--play` loops,
     the living grid's attract twinkles (they ran behind the dialog's backdrop — measured as frames while a game was
     paused) and the 3D island and globe. The cursor follower re-reads what's under the pointer when a dialog opens or
     closes, so a stale "PLAY" label no longer hangs over a game.
140. **Phones.** The stages are shorter on touch screens (room for the arrow pad) and the full-size game dialog scrolls
     if a screen is still too short. Arcade Rat is reachable now: all six games played.

## PART 13 — World 6: Skill Tree

141. **One vocabulary, two halves.** `src/lib/skills-index.ts` is pure and client-safe — the alias map (the brief's
     list plus the obvious spellings), the tokenizer, the matcher, the inventory search, the JD scan — and imports no
     content. `src/content/skills.ts` (server-only) builds the rest from `content.skills`: nodes, evidence, the radial
     layout, the scanner's index (a prop for the island) and the build checks in schema.ts — every skill listed once;
     every alias, short label and logo points at a real skill; one term never names two things (two skills, a skill and
     a résumé item, or the vocabulary); every stack item spelled exactly like a skill shows up in its evidence.
142. **Evidence = the stacks, read through the aliases — never a score.** "Used in" lists every role and project whose
     stack names the skill: by name, another spelling (React.js, postgres) or a family (`gpt*`, `claude*`, `gemini*`,
     `llm*` → LLMs; `django*` → Django). So GPT-4.1, Claude Sonnet 4.5 and LLM Monitoring count for LLMs at United
     Airlines, Gemini 1.5 / Gemini Vision at Cognivault AI, Django REST Framework for Django at EY; the item shows next to
     the link ("as GPT-4.1, …"). No "tf" alias (TF-IDF isn't TensorFlow), no bare "c". 27 of the 67 skills are in no
     stack (Machine Learning, JavaScript, SQL, DSA…): their cards say "On the skills list · no role or project stack names
     it" — never "Evidence: 0", and nothing is borrowed from the bullets (R1). Adding them to a stack lights them up.
143. **One DOM, three layouts.** Each skill is one `<li id="skill-<slug>">` (PART 8's ids, unchanged) with its trigger
     and its card. CSS lays the same list out as the radial tree (Play Mode, the tree ≥ 1100px wide), a vertical trunk
     with stacked branches (Play Mode, narrower) or a plain list with "Used in" inline (no JS, Speedrun Mode) — every
     skill appears exactly once in every mode and the loot links always land. Triggers are plain text on the server;
     the island makes them `role="button"` with one roving tab stop (no dead buttons without JS, #117).
144. **The radial layout is computed at build time** (`src/content/skillLayout.ts`, pure): five fans around the root —
     the biggest branch (Spells, 24) on the right, Gear and Gadgets on the left, Weapons on top, Runes below — rows or
     columns bent into arcs, every node reserving a two-line label, so labels can't collide whatever they say. Positions
     are container units (the tree is 100 × 69 of its own width); each edge joins a node to the nearest node one lane
     in, or to its hub. A branch that outgrows its fan makes the page use the vertical tree. Measured in Chrome, WebKit
     and Firefox at 1160–1440px: no overlaps. (An inline label takes its block's strut: the label's size and line
     height live on the trigger, or two-line labels came out 70% taller than reserved.)
145. **Branches grow, packets flow.** First view below the fold (PlayOnView): edges draw out lane by lane and nodes pop
     (≤ 1.3s), one rising ding per branch. Data packets ride the trunks and the outer spokes — 15 compositor-only
     `::after` loops on `--play`, declared only for an on-screen `#skills` — and the root has a beacon; they rest off
     screen, at the idle nap and in the pause menu, and don't exist under reduced motion. Measured at rest on the tree:
     0–1 animation frames per 2s.
146. **Cards.** Hover (after 140ms of hover intent, so a sweep across the tree doesn't park cards over the neighbours),
     focus or a tap opens a node's card: name, type, "Used in:", "Evidence: N". The pointer can move onto it (a hover
     bridge), Esc closes it before the pause menu (WCAG 1.4.13, #114), and it shifts sideways or opens above the node to
     stay on screen; in the plain list (cards inline) Esc stays the pause menu's. The card is its trigger's (and its
     inventory slot's) description. 10 distinct skills inspected (hovered, focused or tapped for ≥ 350ms, tree or
     inventory) → Skill Issue? Nope.
147. **Getting around.** Arrows move in 2D (the nearest node in a ~68° cone, reading order as the fallback),
     PageUp/PageDown jump branches, Home is the root. In Play Mode any `#skill-…` link (Quest Log, Vault) lands on its
     node: the TREE tab, centered, focus on the node, its card, a flash (two pulses in 1.5s). "Used in" role links
     scroll to the quest heading (focused; the card flashes); project links scroll to the Vault and insert that
     cartridge (`vault:insert`). In Speedrun Mode and without JS they're plain anchors (`#quest-<id>`, `#screen-<id>`).
     `/#skills-inventory` and `/#skills-jd` open that tab with an instant jump — a smooth one aimed where the box was
     before the Prize Counter mounted above it. The root, AKSHAT, knocked twice within 450ms (two clicks, two Enters, a
     double tap) → coin #10; its hint now reads "Every tree grows from one root. Knock twice."
148. **Tabs.** Custom ARIA tabs (the UI kit's `Tabs` keeps inactive panels `hidden` even without JS): TREE · Skill map,
     INVENTORY · Grid & loadout, JD SCANNER · Job description match; ←/→ with automatic activation, Home/End. Inactive
     panels hide only with the runtime; INVENTORY and JD SCANNER are `data-needs-js` and hidden in Speedrun Mode.
149. **Inventory.** An RPG slot grid — 8 columns (6 on tablets, 4 on phones; empty slots fill the last row), type-colored
     frames, one tab stop with 2D arrows. Type filters (`aria-pressed`) and an alias-aware search ("js" → JavaScript,
     React, Next.js, Node.js, Express.js; "postgres" → PostgreSQL); one- or two-letter queries need a whole alias word
     and neighbours don't count, so "c" doesn't light Docker through "containers"; a miss keeps its text readable. The
     LOADOUT has three slots (click / Enter equips, a fourth replaces the oldest, the loadout's buttons unequip); with
     two or more it lists the roles and projects whose evidence has all of them — "COMBO! FastAPI + FAISS + Docker →
     Cognivault AI", with a star burst from the slot (never on the text) — or "Untested combo — Akshat's down to try 😄"
     and the closest pairs. Drag-to-equip (optional in the brief) isn't built; click and keys cover it. A detail pane
     shows a visual copy of the focused slot's card.
150. **JD scanner: counts only, and nothing leaves the browser.** The scan ships with the island (no lazy import), so
     it works offline once the page has loaded (measured with the network off in Chrome, WebKit and Firefox). Words are
     folded the way tech writing spells them (C++, C#, .NET, Next.js) and matched longest phrase first (React Native
     isn't React, Node.js isn't also JavaScript, LlamaIndex isn't a Llama), with case where it matters (React, REST,
     Windows, Excel — not the verbs). Results: "N matching skills" (named or spelled another way) by type; bonus perks,
     implied by a neighbour ("containers" → Docker, "AWS" → AWS Secrets Manager, "vector database" → FAISS); "also on
     the save file" — coursework, stack items that aren't Skill Tree entries, research keywords and vocabulary words
     content.ts already uses (cloud → WalkingTree Technologies), each with where it appears; and "Not on the save file
     yet — Akshat learns fast." for recognised tech words the résumé never mentions (~90 tools and platforms; concepts it
     could imply without naming, like statistics or time series, are left out). Laser sweep + beeps (1.3s; instant under
     reduced motion), the matched skills light up and bounce in the inventory, Perfect Match. The pasted text is only
     read — results are DOM-built. The sample JD is a generic AI/ML internship (no company). The Vault's "JD Scanner" side
     quest opens the tab (`skills:open`).
151. **Page weight.** The Skill Tree adds 7.3 KB gzip of initial JS (176.6 KB, budget 250) and ~30 KB gzip of HTML. Its
     31 tech logos are one static file, `/skill-logos.svg` (a `force-static` route handler, 12.7 KB gzip), `<use>`d by
     nodes and slots — inline, the path data was paid twice (HTML + RSC payload) and compresses poorly. The item-type
     pixel icons are inline symbols; icons built at run time (scan tiles, the loadout) use those, so they draw offline
     (WebKit re-requests an external `<use>` for every new element).
152. **Signature items** (holo-foil + a crown pip) are wired, but `skills.signature` is empty — Akshat picks them (R1);
     the QA checks the hook on a copy.
153. **BYTE and things that grow in place** (found by part4 I1 on a phone). BYTE avoids clickable boxes by measuring
     them on scroll and on layout changes; the tree's nodes popped in from `scale: 0`, so at the measurement they were
     nothing and grew under BYTE. Now the pop-in animates an inner wrapper (`.sk-node__art`), never the trigger, so
     BYTE sees each button's real box from the first frame — and `byte.recheck()` (bus `byte:recheck`, measured 220ms
     later) is the call for controls that appear without a scroll or a layout change: the tree sends it when the
     branches have grown and when a card opens (BYTE steps off the card's links).

## PART 14 — World 7: Trophy Room

154. **What the room shows is computed** in `src/content/trophies.ts` (server-only): every honor exactly as content.ts
     has it (title, year, org, the detail only when there is one) plus its trophy's plain name ("Cup", "Medal on a
     ribbon"…); certificate cards with whatever fields exist (an empty credential ID, skill or URL is left out) and an
     issuer monogram made of its initials — text, never an issuer's logo (R4). The capsule machine deals only these
     same honors and certificates.
155. **The Hall of Fame is the world's only canvas.** HTML pedestal buttons (title + year plates, a detail card each)
     are the hit targets — no raycasting (#54). On the HIGH tier a lazy R3F canvas stands one procedural trophy over each
     button: the scene measures the width the camera sees at the trophies' depth and gives every pedestal the same
     column as its button, so hover / focus / click map 1:1 at any width. Trophies: a lathe-turned cup with handles, a
     medal hanging from a T-stand by a two-tone ribbon, a star on a plaque, a rolled scroll with gold knobs — toon
     materials, ink outlines, gold accents, a spotlight and an additive light beam per pedestal, sparkles, a slow spin.
     Hover / focus spins a trophy faster and brightens its spotlight; opening one dollies the camera to it (the trophy
     lands left of centre, its HTML card on the right), with confetti and +10 XP the first time (`open:honor-<id>`);
     arrows (←/→/Home/End) move along the pedestals and take an open card with them; Esc or "Back to the hall" closes
     it. While a card is open in 3D the plates fade (opacity — they are the buttons' names; `visibility` dropped them
     from the accessibility tree). The canvas loads near the viewport, draws only on screen, unpaused, awake and with
     no game open, and unmounts beyond a viewport. Measured: ~9,600 draw calls a second on screen (≈80 a frame at
     120 Hz), none at the idle nap, in the pause menu or off screen; the context is released when far away (Chrome,
     WebKit, Firefox). Reduced motion: frames on demand, no spin, the dolly jumps.
156. **LOW / NONE tiers: CSS-3D medallions** (phones — a coarse pointer is LOW — and browsers without GPU WebGL): a gold
     coin per pedestal (two columns on phones) that tilts on hover and flips when its card opens; the card covers the
     side away from its medallion (the whole stage on phones). Without JS and in Speedrun Mode the honors are plain
     cards (title, org · year, detail); the triggers are plain text on the server and become buttons with the island,
     so there are no dead buttons (#117).
157. **Certificate cards.** Trading cards, both faces server-rendered: front — the monogram, the name, the issuer, the
     date and a holo foil that follows the pointer; back — credential ID, skills, Verify ↗ (new tab, `noopener`). Open =
     a GSAP Flip flight to the middle of the screen over a backdrop, then a 3D turn to the back (focus moves there); Esc,
     the backdrop, "Flip back" or focus leaving the card puts it back (WCAG 2.4.11). Only the face you see is focusable.
     The depth is in the card's own transform (`perspective()`): a `perspective` on its slot made the slot the
     containing block of the fixed, enlarged card. No-JS / Speedrun: both faces flat. With no certificates (today):
     three sealed packs, "NEW CARDS DROPPING SOON", that shake on hover. Tested with 0 (content) and 1 and 12 (fixtures
     swapped into content.ts for the test and restored byte for byte): same-size cards, nothing spills, one card
     centred (`auto-fit`, not `auto-fill`), no sideways scroll at 1440 or 390.
158. **The capsule machine** (original: a glass dome of two-tone capsules, an orange body with a crank, a chute and a
     tray). Wind the crank a full turn either way (pointer drag; `touch-action: none`) or press TURN (the keyboard path):
     the capsules jostle, one rolls out and bounces, the top pops open on a random honor or certificate — never the same
     twice in a row — with a rarity flash (certificate "Rare", honor "Epic", the coin "Legendary": labels about the toy,
     not a ranking of the honors). One capsule in five holds coin #11, never more than five turns away and only until
     it's found (the runtime's `data-collected`); the first turn → Lucky Capsule; the prize is announced. A turn starts
     on the press (the machine is busy, the last prize goes back in the box), so a double press can't queue a turn that
     then gets lost. Reduced motion: the capsule is simply there. The shake-to-find detector (#21) now ignores movement
     with a button held: winding the crank fast counted as "shaking to find the cursor" in WebKit.
159. **Your trophies.** Every achievement as a plaque on a shelf — server-rendered all locked; the runtime portals the
     live, store-connected shelf over it (like the Prize Counter's booth, #131): the visitor's unlocked trophies first
     (newest first), then the rest as grey silhouettes with their hints (secret ones "???"), and "You've unlocked
     n/total — keep exploring!". Hidden without JS and in Speedrun Mode (it's game state, not résumé content).
160. **In-page jumps aim at the real page** (found by the PART 14 regression). Lenis adds an element's offset to where
     it *thinks* the page is; after a native jump it didn't register (a hash link at load, find-in-page,
     `scrollIntoView`) that position is stale and the flight landed short — measured 582px, the Vault's JD Scanner side
     quest stopping above the scanner. `scrollToElement` now resyncs an idle Lenis to `window.scrollY` and aims at a
     number from the real geometry (every world's jumps go through it).

## PART 15 — World 8: Co-op Lobby, Credits, 404

161. **The contact flow is static forever (R10).** The party invite is a real `<form action="mailto:…" method="post"
     enctype="text/plain">` with native `required` checks — that is what visitors without JavaScript (and anyone in the
     moment before the island loads) get. With JS, `src/lib/invite.ts` validates with zod/mini: one in-character error
     per field ("That message looks empty — even BYTE needs words."), names and messages are trimmed and capped (80 /
     2,000 characters), focus goes to the first bad field, BYTE says the error and it is announced. A valid send opens
     `mailto:<email>?subject=[Funfolio] <Quest type> from <name>&body=<message>` (both `encodeURIComponent`ed — tested
     with `&`, `?`, `#`, `%`, `+`, new lines, accents and emoji) by clicking a generated link inside the send gesture's
     user activation; the done panel repeats it as "Open my email app" and offers [Copy message] ("To / Subject / Body")
     for visitors without a mail app. Measured: zero network requests from the first keystroke to the mailto, and the
     whole flow works offline once the page has loaded. "+200 XP" shows only while Co-op Invite is still locked (it is
     the achievement's own XP).
162. **The paper plane.** SEND folds the form (Web Animations) and morphs the sheet's four points into the plane's
     (`SHEET` → `PLANE`, 460ms of rAF — bounded, the island's only rAF). Nothing needs a drag (R5): Enter / Space on the
     focused plane or "Auto-launch ▶" fly it with a little wind-up; the pull-and-release (≥ 24px, clamped to the room
     behind the gate) is the optional extra. The arc's top stays inside the stage (30% of its height from the top, up
     to 18% for a full pull — the first version sailed out of the box). The launcher is a launch gate — two pylons and
     an energy beam — not a wooden slingshot (R4). On landing the flag pops, the mailbox gulps and flashes, confetti
     falls (kept off the words, #62) and the done panel opens *under* the launcher, so the landing stays visible. No
     floating "MESSAGE READY" text: the panel says it, and floating text would sit on the panel's words (R6). Reduced
     motion: no typing, folding or flight — the same steps, at once. Speedrun Mode: no typing or blinking, and Send goes
     straight to the mailto (the plane is play, not contact).
163. **Content that shrinks in place is revealed** (found by engines-p15 in Firefox, a real bug in every engine): the
     launcher is shorter than the form it replaces, so from down at the Send button it landed above the screen —
     focused, unseen (WCAG 2.4.11). `revealElement()` (new in `src/lib/scroll.ts`) scrolls the least amount that shows an
     element under the HUD, through Lenis; the launcher and the done panel use it.
164. **The credits roll.** Two copies of the list in a track that a compositor CSS loop moves by −50% (42s), declared
     only for an on-screen `#credits` with JS. Hover, focus and "Pause the roll" (aria-pressed — WCAG 2.2.2 wants a real
     control; the brief asked for hover) pause it. A wheel, a touch or a scrolling key inside hands it to the visitor as
     a real scroller at exactly the spot the loop had reached (progress → `scrollTop`; the wheel tick that switches is
     swallowed) and opts it out of Lenis (`data-lenis-prevent`, only while manual); "Pause the roll" then rolls on from
     where they scrolled; leaving the screen resets it. A plain list (no clip, echo or mask) without JS, in Speedrun
     Mode and under reduced motion. Cascade-layer finding: the loop is unlayered (it needs `#credits:not([data-offscreen])`),
     and an unlayered rule beats every layered one whatever its specificity — the layered `animation: none` for manual
     mode silently lost, so the roll kept moving under the visitor's scroll (part15-qa G2, a 138px jump), and a layered
     reduced-motion rule would have shown the coin in Speedrun Mode. Overrides of such loops are unlayered or
     `!important` now (CLAUDE.md).
165. **Coin #12 keeps beside the names (R6).** It drifts up the left gutter, over the masked top edge and down the
     right; the lanes are the list's side padding (`--gutter`, in the roll's own container units) and the coin's size
     (`--coin`) scales with it, so it never crosses the text — sampled over its whole loop at 1440 and 390px. Hover,
     focus and the Pause button stop it, so it can be caught; under reduced motion it sits still under the list. The
     hint stays "Stay until the very end."
166. **YOUR RUN** (a runtime portal like the trophy shelf, #159): time played, hidden coins x/12, achievements x/total,
     level and title, best scores ("—" until played). Share copies "I reached LV n and found x/12 coins in Akshat's
     Funfolio → <origin + path>" — no query or hash, or a shared `?boot=0` / `?speedrun` would follow the link. NEW GAME+
     asks first, then `newGamePlus()`: a fresh save that keeps the inventory (owned and equipped cosmetics), the settings
     and BYTE's corner; XP, coins, wallet, achievements, high scores, gates and BYTE's said lines start over (like Reset,
     #25, minus the cosmetics).
167. **▲ Back to top**: BYTE lights a jetpack — a flame that wobbles in scale (no flashing) and a lift, none under reduced
     motion — while the page flies to the Title Screen; focus lands there when the flight completes (Lenis's last pixel,
     ~2–3s for the full page). Reaching the credits unlocks Completionist (the world tracker, since PART 3).
168. **404 = GAME OVER** (`src/app/not-found.tsx` → `out/404.html`, which static hosts serve with status 404; noindex):
     "CONTINUE? 10…" counts down (dots go out one by one) and returns home with a full load (the home page's pre-paint
     script must run); "Stop the countdown", any key or any click stops it (WCAG 2.2.1); it is announced once at the
     start and once when it stops. "Play a quick round of Bug Whack" opens the game host and stops it too; Game Over
     unlocks. The title grows in from 0.7× (from 1.4× it widened phones for a moment). No JS: GAME OVER and CONTINUE ▶ (a
     link home).
169. **Page weight.** The root not-found boundary's client code ships with every page, and the Lobby's validation brings
     zod/mini's core (~20 KB gzip): together they took initial JS from 179.9 to 204.4 KB. Both islands are now loaders
     that `import()` their logic after hydration, and the 404's buttons are plain markup (ArcadeButton had been copied
     into that chunk): 181.0 KB (budget 250). The Lobby's chunk lands long before anyone can type, so the flow itself
     makes no requests (measured, and offline).
170. **PLAYER 2, PRESS START blinks between two colours** (mint ↔ cream / ink), five times at 1Hz, the first time it's
     seen: an opacity blink dropped the heading below 4.5:1 mid-blink (axe). Not in Speedrun Mode or under reduced
     motion. BYTE types its invite line when the dialog comes into view (a ghost line reserves the space), says the first
     error, "Folded!", "Delivered to the mailbox!" and "Take your time"; the floating BYTE's Lobby world line plays now
     that `[data-contact-form]` exists (#45).
171. **Direct portals**: conic rings that swirl only while the Lobby is on screen (`rotate` on an HTML span, `--play`)
     and pull eight particles in on hover or keyboard focus (compositor, none under reduced motion). Email = `mailto:`
     plus "Copy address" (Copycat, "Item acquired · Email"); LinkedIn and GitHub open in a new tab (`rel="me noopener
     noreferrer"`, announced); the Save File portal stays "Coming soon" until the PDF exists in `public/` (a build-time
     check) and downloads it otherwise (Save File); the phone portal exists only with `showPhone` and a number, revealed
     on click (#1). The availability card appears once `player.availability` is filled in (R1).

## PART 16 — Secrets & surprises

172. **One registry, one provider.** `src/lib/eggs.ts` is data — id, name, trigger, effect, achievement, `minFx`, `speedrun`,
     a hint (the brief's `effect` is a description; the implementations live in a lazy chunk keyed by id, so the
     registry stays client-safe data that /playground/eggs and the terminal read). `EggProvider` (lazy, inside the
     runtime) attaches every listener once; `effects.ts` (its own chunk) draws; Matter.js loads only for the letter rain.
     A first find is recorded in `stats.eggsFound` (the save has had `findEgg` since PART 3) and pays its achievement —
     Corner Case once all four corners are found; Explorer stays the world tracker's.
173. **Gating.** Speedrun Mode keeps only the terminal (` · the HUD button · `sudo` · the menu) and the right-click menu.
     `data-fx`: the letter rain, the bugs and the steam need Normal; everything else plays in CHILL, minus particles
     (the cheat code's coin rain). Reduced motion: static versions (the door fades, the logo pulses, no physics, bugs,
     steam or coin rain). An egg that can't play says so — an "Egg found" toast — instead of counting silently. Ambient
     eggs (corners, idle, chests) wait while a dialog, a game or the boot is up.
174. **Typed words and the cheat code ride the keyboard manager** (#28): keys it doesn't use reach the eggs over the bus —
     observed, never swallowed (arrows still scroll). Fields, dialogs, games and modifier keys never count; a word resets
     after a 1.5s gap, the code after 3s. akshat → six physics letter blocks (2.4s, click-through) — and, while the
     Title's name is on screen, coin #3: the keyboard path #59 promised. hire → confetti, BYTE "Excellent choice." and the
     flight to the Lobby. bug → three bugs scurry (a pointer toy: aria-hidden, untabbable; Bug Whack is the accessible
     squashing). coffee → steam at the pointer for 5s, never over reading text (R6). sudo → the terminal. ↑↑↓↓←→←→BA →
     CHEAT ACTIVATED: unlocking Cheat Code grants the Retro CRT theme (prizes.ts), the theme switches, BYTE wears pixel
     shades for the session, coins rain. (A classic web code — no console brand's assets, R4.)
175. **The four corners**: a 28px square in each corner of the content box (not the window — with a classic scrollbar,
     WebKit's and Windows', the window's edge is the scrollbar; found by engines-p16), held 600ms; a pass doesn't count,
     leaving re-arms it. Touch = a long-press, and the click that ends it is swallowed (HUD buttons live there). TL the HUD
     logo flips like a coin; TR a secret gear (6s) that switches on CHAOS; BL a pixel door creaks open on an original
     dev-room doodle (desk, CRT, mug, rubber duck); BR BYTE ducks off-screen and peeks back, waving.
176. **AKSHAT-OS** (`src/components/terminal/`, lazy): a native modal `<dialog>` in JetBrains Mono, prompt
     `player2@akshat-os:~$` (pink · cyan · yellow · lime), history ↑/↓ for the page view, Tab completion (choices listed
     when ambiguous), Ctrl+L. Tab completes, so the dialog doesn't trap Tab: Esc, `exit` and the close button leave (WCAG
     2.1.2), and focus returns to the opener. Output is plain text in a polite `role="log"` (never HTML — bytesay echoes
     the visitor's words safely; an `<ol role="log">` failed axe, so it's a div). Facts come from content.ts through a
     server-built prop (`src/content/eggs.ts`, like BYTE's script); live state from the save. All the brief's commands,
     plus quit; `theme retro` stays locked until earned; `sudo hire akshat` → Root Access, fireworks, the Lobby; opening
     → Hacker. Ways in: ` (the keyboard manager), the HUD button (desktop), `sudo`, the game menu, and Pause → Controls →
     "Open the terminal" (phones have no ` key).
177. **The game menu** (right-click · Shift+F10 · the menu key): a WAI-ARIA menu in the top layer — focus on the first
     item, ↑/↓/Home/End, Enter/Space, Esc or Tab close and return focus; a click elsewhere, a scroll, a resize or a blur
     close it. Copy email (Copycat) · Download résumé ("coming soon", disabled but focusable per the APG, until the PDF
     exists) · Toggle sound · Open terminal · Locate cursor · Inspect (a console nudge). The browser's own menu stays for
     Shift + right-click, links, fields, media, dialogs, popovers and any text selection (copying must always work). A
     3D canvas outside games only *prevents* the menu (three's OrbitControls), so the game menu opens there.
178. **DevTools**: a multicolor block-letter AKSHAT + "Hey dev 👋 try akshat.hire() or akshat.help()" once per page, and
     `window.akshat` { help, hire, coins, secret } — any call is Console Cowboy. Not in Speedrun Mode.
179. **Proctor alert**: a hidden tab gets "👾 Come back, Player 1!" and a sad pixel favicon (an SVG data: URL — no
     request, R10); back → both restored and "⚠ TAB SWITCH DETECTED — just like QuizMUJ's proctoring. −0 marks." (the
     project name from content, only while a project's bullets mention tab-switch tracking) once a session; Caught
     Switching Tabs once. The Vault's QuizMUJ hint pays off.
180. **Idle**: the page still naps at 30s (#67). At 45s BYTE sleeps — its own 1s check (it was 30s; now one constant,
     `EGG_TIMING.sleepAfterMs`) — and the Zzz rises three times, then rests (no loop through the nap); the living grid
     runs one marquee lap around the screen's edge (2.6s, below the HUD, skipping cells behind text; not in CHILL — the
     grid's `chase()`). At 90s "Bored? Squash some bugs" (bottom-left) opens Bug Whack; it outlives the wake-up by 8s so
     the pointer can reach it. Tests shorten the timings with an opt-in `window.__QA_EGGS`.
181. **Night owl**: 00:00–04:59 local → BYTE's nightcap (session-only, over any equipped hat) + Night Owl.
182. **Selection**: `::selection` is the world colour with ink text (+ a glow) — every coloured fill carries ink (#4).
     Selecting text that contains the word BYTE makes BYTE blush (pink cheeks + the love mood).
183. **Loot chests**: entering a world rolls 1 in 15 (at most 3 a session); a chest hops into the gutter left of the
     column (never over text; phones have no gutter, so no chest) for 6s; opening it pays +50 XP and a line — Akshat's
     fun facts once content has some, otherwise a "Did you know?" that restates a résumé value (R1).
184. **Milestones**: the 100th click, 5 minutes played and every world visited (with Explorer) each get a mini fanfare —
     three notes and stars under the HUD, a toast for the first two.
185. **Hidden coins** (consolidated in coins.ts since PART 3, with the terminal's hints): a collected coin now spins in at
     its spot, sparkles, flies to the HUD's wallet chip and bumps it (reduced motion: the bump only, as a glow); all 12 →
     Treasure Hunter + the Golden cursor, as before.
186. **Patch notes**: every content.ts export is hashed at build time (sha256, 12 hex). A save that saw an older hash —
     a returning visitor — gets "PATCH NOTES v<version>" with a button to the pause menu's list, once per new hash; a save
     without one (a first visit, an older save) stores it quietly. SAVE_VERSION 3 (`meta.contentHash`; the v2 → v3 step
     adds nothing — normalizeSave fills null).
187. **/playground/eggs** (noindex, unlinked): every egg from the registry with a Trigger button (a `command({ type: "egg"
     })` → the provider). Triggers count as finds; Speedrun Mode and reduced motion still apply.
188. **HUD page labels** (a PART 15 gap): pages without worlds name themselves with `data-hud-label` on their `<main>` —
     "Game over · Page not found", "Playground · …" — instead of "World 0 · Title Screen". Page weight: initial JS 181.3
     KB (+0.3); the provider, the effects, the terminal and Matter are lazy chunks; the eggs' data prop adds ~2.9 KB gzip
     of HTML.

## PART 17 — Handheld mode, accessibility, performance, SEO

189. **Handheld Mode** = a coarse pointer or a window under 768px (`(pointer: coarse), (max-width: 47.99rem)`,
     `HANDHELD_QUERY` in `src/lib/haptics.ts`), never in Speedrun Mode (the recruiter view keeps its HUD). The HUD becomes
     a top strip — LV, XP, coins; the rest (sound, theme, Speedrun, map, terminal) is one START away in the pause menu —
     and a 56px glass controller (`src/components/hud/HandheldPad.tsx`, inside the lazy runtime) sits 6px above the
     bottom edge (plus the safe area): ◀ ▶ previous / next world (focus moves there), START = the pause menu, B, and A
     with its label ("A — Launch", "A — Read the scroll"…). A = the current world's first visible `data-primary` control:
     clicked, focused (the Lobby's name field) or sent its `data-primary-keys` (the Launchpad: ↑ then Enter = a 70% shot).
     B = back: a synthetic Escape (flagged `padB` so the keyboard manager doesn't open the pause menu) goes to whatever is
     focused — a card, the cartridge, the hall's open trophy — and if nothing takes it, the top of this world, else the
     previous world. B sends that Escape on **pointerdown**: the page's own "a tap elsewhere closes it" handlers
     (pointerdown, focusout) closed a skill card before B's click ran, so B then also flew to the top of the world
     (part17-qa A7). Scrolling down tucks the pad away (`data-tucked`, a translate), scrolling up or to either end brings
     it back; its own flights hold it up for 1.5s, a focused pad button keeps it, and the Vault's bottom sheet hides it.
     The page keeps `--pad-space` free at the bottom (padding + `scroll-padding-bottom`, so focus is never hidden behind
     it — WCAG 2.4.11), BYTE's home stays above it (`padSpace()` in brain.ts) and the bottom-left eggs sit over it. On
     phones up to 420px the gaps tighten and START narrows; A's label is what gives way (an ellipsis on a 360px phone for
     the longer ones — its name keeps the whole label), and under 340px A shows just "A" — every button stays ≥ 44px and
     inside the bar (at first A pushed 3px past a 360px screen — qa.mjs's overflow check).
190. **Touch.** Long-press (500ms, < 10px of movement) shows any tooltip for 2.6s and swallows the click that ends it
     (and Android's long-press menu); hover tooltips are mouse/pen only; a tap's focus no longer opens a tooltip (it stuck
     open until something else took focus — part17-qa B1). Haptics: `haptic(ms)` → `navigator.vibrate(10–20)` on a pad
     press (10–14ms), a coin, a level-up (20) and an achievement (15) — coarse pointers only, never under reduced motion,
     in CHILL or in Speedrun Mode. Tilt: on a touch screen with a live 3D island, "Enable tilt" (aria-pressed; iOS asks for
     `DeviceOrientationEvent.requestPermission` on that tap) turns the phone's tilt into the island's parallax; nothing
     listens to the sensor before that tap (Firefox also logs a deprecation warning for any `deviceorientation`
     listener — engines-p17), and never under reduced motion. Lighter: the FX layer bursts and confetti use
     0.6× the particles in Handheld Mode (14 → 8 measured), phones keep the LOW island tier and the SVG island until the
     first tap or scroll (#2), and the Lab's globe stays the flat map on touch screens until "Spin the 3D globe" is tapped
     (LOW tier). The slingshot, the games and the capsule crank already had touch input and buttons (TURN is A).
191. **Touch targets ≥ 44 × 44px** on coarse pointers (`src/app/handheld.css`, unlayered so it wins over the components):
     a 44px min-height for the controls whose box can grow (scroll cue, Peek, the Launchpad's HUD buttons, linked loot
     chips, the globe's and purifier's buttons, Vault tabs, the Prize Counter's buttons, Copy address, Pause the roll, the
     quest chips), an invisible `::after` hit area for those inside a number or a moving lane ("$0.08", coin #12, the HUD
     chips). The UI kit's small arcade buttons said "≥ 44px" but measured 40 (an inset is taken from the padding box:
     36 − 2 × 3px border + 2 × 5px): −7px now. The audit measures the hit area (box + positioned pseudo-elements).
192. **Accessibility audit** (`a11y-audit.mjs`, part17-qa D: axe-core 4.14 on every world in night / day / retro, desktop
     and a 360px phone, the pause menu, a game, an inserted cartridge, the terminal, /playground/eggs and the 404; plus a
     Tab walk of the whole page). Landmarks (banner, main, contentinfo, the pad's nav), one h1 per page, no skipped
     heading levels, every canvas aria-hidden or inside a named figure / application. Fixed: the retro theme's chromatic
     split on the Skill Tree's hubs (ink on violet: the pink/cyan fringe is blended into the fill and dropped it under
     4.5:1 — headings with ink on a fill keep the pixel face, not the split); the "READY? GO!" chip pops by scale only (a
     half-faded chip was low-contrast text); the pad's A button name matches its visible text. Skip links: "Skip to
     content" first, and "Skip mini-game" (`SkipLink`, invisible until focused) before the Launchpad stage (→ the Quest
     Log) and the Arcade's cabinets (→ the Prize Counter). The keyboard walk reaches the footer and wraps (142 stops): every
     stop on screen, under the HUD, `:focus-visible` with a ring. No AudioContext without a sound gesture.
193. **In-page flights are timed** (`scrollToElement`: expo-out, 0.6s + distance / 6000px, at most 1.6s) instead of
     Lenis's lerp, whose sub-pixel tail held `onComplete` — and so the focus move — back ~1.2s on a short hop and 2–3s for
     Back to top (the PART 15 gap). Focus now lands as the page arrives (a skip link: 0.77s).
194. **Zero layout shift.** On load (Lighthouse CLS 0.92 → 0): the Title's hotspot layer kept one box in both the SVG and
     the 3D views (the projected buttons move by `translate` from where they rest — the layer switching boxes was 0.9 of
     it); the boot log lines, the coin stage, the fast-boot line and CONTINUE? reserve their space (`visibility`, not
     `display`); the HUD's world label holds its width with an invisible copy while the typed one fills in. While
     scrolling the whole page (measured: desktop 0.055 → 0.0045, phone 0.12 → 0.0003): the "READY? GO!" chip was 5px
     taller than the kicker line and pushed each world down for 1.5s (it's 19px now); the trophy shelf re-sorted itself
     under the reader when Explorer unlocked as it scrolled by — it now keeps the order it had when the page loaded
     (unlocked first, newest first) and new trophies light up where they stand (part14-qa H2 updated). Late web fonts
     (slow mobile; `display: swap`): the 404's "GAME OVER" filled its box exactly in Unbounded and wrapped in the ~4%
     wider fallback, so the swap turned two lines into one and the centred page re-centred (CLS 0.07 with the fonts held
     back 1.5s). It's `min(11vw, 7.25rem)` now — one line in both faces at every width from 320px — and the block sits
     near the top instead of centred: 0.005 with late fonts, 0.003 in Lighthouse (the home page: 0.011 with late fonts,
     0 in Lighthouse).
195. **The preview server behaves like a static host** (`scripts/serve-out.mjs`): brotli / gzip for text, `immutable`
     caching for `/_next/static`, `max-age=0, must-revalidate` for pages, the 404 page with status 404, HEAD. Its cache is
     keyed by path + mtime + size + encoding (it served stale HTML after a rebuild). Lighthouse numbers are measured
     against it — an uncompressed server made mobile LCP 9.3s.
196. **SEO & sharing, all static.** Title "Akshat Sharma — Funfolio · AI/ML Engineer & Full-Stack Developer" and the
     description are composed from content.ts (`site` in `src/content/site.ts`); a JSON-LD `Person` (`src/content/seo.ts`:
     name, the current role as jobTitle / worksFor, alumniOf Manipal University Jaipur, sameAs LinkedIn + GitHub;
     `<` escaped). The share card is a 1200×630 "character card" — BYTE's head, LV badge, the name in the pixel font in
     the palette, the first three classes, the current role, the pixel coin and the tagline — and the Apple icon a 180px
     BYTE head, both rendered at build time by `force-static` route handlers (`src/app/og.png/route.tsx`,
     `apple-icon.png/route.tsx`; the file conventions exported extension-less files a static host serves without a type).
     The favicon is the 16×16 BYTE head as SVG (`src/app/icon.svg`, drawn from `src/content/brand.ts`), declared
     explicitly (a metadata `icons` field replaces the convention's link); a web manifest; robots.txt allows everything
     (noindex stays a meta tag on /playground, /playground/eggs and the 404, #15) and lists the sitemap once the domain is
     known; `meta[name=theme-color]` follows the theme (night / retro #0e0b1e, day #fff4e0). `site.url` is still "TODO",
     so the canonical link, og:url, og:image and the sitemap's entry are left out — they need an absolute URL, and a
     localhost guess would be wrong (prompts.md Appendix A).
197. **Performance.** Initial JS 182.3 KB gzip (the build's check; PART 16: 181.3 — the pad, haptics and long-press
     tooltips are +1.0 KB); lazy chunks 729.5 KB in 40 files (gzip -9) — the largest: three + R3F 238 KB, axe-core (the page scan) 178 KB, GSAP with
     ScrollTrigger / Flip 27 + 17 KB, Matter 25 KB, the 3D scenes with drei's pieces 21 + 13 KB, zod/mini 19 KB; the rest
     (games, eggs, the pause menu, the terminal…) are 1–24 KB each. ≤ 2 live WebGL contexts (measured while scrolling the whole page:
     1 at most on desktop and phone; the island, the globe and the hall are worlds apart and unmount beyond a viewport;
     contexts are released — made 5, released 4, live 1). Off-screen: every 3D canvas renders only on screen and the CSS
     loops pause (`data-offscreen`, #78); hidden tabs: browsers stop rAF and CSS animations there, and the games pause, the
     grid sleeps, the cursor engine and BYTE's idle check skip work and play time stops counting (a real hidden tab can't
     be tested headless — the proctor test fakes it). Fonts: next/font self-hosts latin subsets (woff2); Unbounded, Tiny5
     and DM Sans are preloaded (all three are above the fold), JetBrains Mono isn't (no "preloaded but not used" warning).
     Images: there are no raster images yet (art is SVG, CSS and canvas); `npm run images` makes AVIF/WebP once photos
     arrive. **No `:has()` on the root:** `html:has(.vault[data-sheet]) .pad` (the pad stepping aside for the Vault's
     sheet) made every style recalculation check the whole page — 1.9s of style work per 8 idle seconds on a 4×-throttled
     phone (PART 16: 0.04s; Lighthouse mobile main thread 3.1s → 5.6s). The Vault sets `html[data-vault-sheet]` instead:
     0.04s again, main thread 3.5s. The other `:has()` rules are scoped to a component's own subtree.
198. **Lighthouse** (13.6, system Chrome, both exports behind the same preview server — PART 16 built from 59366ff in a
     worktree; Performance · Accessibility · Best Practices · SEO):

     | Page | PART 16 desktop | PART 17 desktop | PART 16 mobile | PART 17 mobile |
     |---|---|---|---|---|
     | `/` | 76 · 100 · 100 · 100 (LCP 0.4s, CLS 0.92) | **100** · 100 · 100 · 100 (LCP 0.4s, CLS 0, TBT 0) | 93 · 100 · 100 · 100 (LCP 2.1s, CLS 0.122, TBT 60ms) | **96–97** · 100 · 100 · 100 (LCP 2.1s, CLS 0, TBT 70ms) |
     | `/?boot=0` | — | 100 · 100 · 100 · 100 | — | 97 · 100 · 100 · 100 (TBT 50ms) |
     | `/?theme=day` | — | — | — | 97 · 100 · 100 · 100 |
     | `/404.html` | — | 100 · 100 · 100 · 63 | — | 97 · 100 · 100 · 63 (CLS 0.003) |

     §10 targets met: Performance ≥ 85 / ≥ 70, Accessibility ≥ 95, Best Practices ≥ 95, SEO 100, LCP < 2.5s, CLS < 0.05.
     The 404's SEO 63 is its noindex (by design, #168); Lighthouse refuses a document served with status 404, so it audits
     the file. Against the old uncompressed preview server the PART 16 numbers were 61 desktop / 52 mobile (LCP 9.3s).
     What's left in the reports: "unused JavaScript" (the lazy runtime's chunks are fetched right after hydration), a
     "legacy JavaScript" insight on Next.js's framework chunk (its built-in polyfills — not ours), and TTI 5.3s on
     simulated slow 4G (TBT stays ≤ 80ms).

## PART 18 — Final polish, QA & deploy

199. **A lazy part that can't load never takes the page down** (found by the offline audit: going offline after the
     first load and pressing Esc unmounted the whole runtime — the HUD vanished — because the pause menu's chunk threw
     inside React). Every `next/dynamic` part is `import(...).catch(orNothing(label))` (`src/lib/chunks.ts`): it renders
     nothing instead of throwing, and a part the visitor asked for says so once — "Oops — that's a glitch · The pause
     menu didn't load · You're offline — reconnect, then reload the page." Turbopack caches a failed chunk for the
     page's lifetime, so there is no retry, only the plain path: no GSAP → the Quest Log opens and cartridges / cards
     move without the flight, the island skips its swoop; no Lenis → native scrolling; no 3D for Gradient Descent → its
     2D heatmap; an egg whose effect fails still counts and says so; the Lobby's and the 404's islands fall back to
     their plain markup. Right after the runtime starts (in the same burst as its own lazy parts, before a visitor is
     doing anything) it also fetches the three parts a visitor opens on demand — the pause menu, the games' host, the
     terminal — through the *same* loader functions as `dynamic()` (Turbopack gives each `import()` call site its own
     small loader chunk, so warming a second call site left the menu's loader unfetched). Never offline (it would only
     log errors), never with Save-Data, never later on: a first version waited 6s and landed in the middle of the contact
     flow, which PART 15 keeps free of requests (part15-qa C5, D4). Measured offline (`static-p18`): everything loaded keeps working — the pause menu, the
     theme, games already opened, the terminal, the JD scanner, the contact form's mailto, the cartridges; parts not yet
     loaded fail gracefully. The same protects an open tab after a redeploy replaced the chunk files.
200. **Static audit (R10).** The source has one `fetch` (the globe's own `/data/land-dots.json`), no `process.env`
     (the preview tool's optional `PORT` went too), no API routes, keys or CDN URLs; the export is HTML, JS, CSS, fonts
     and SVG/PNG. Behind a plain `python3 -m http.server`, every request of `/`, `/playground/`, `/playground/eggs/` and
     `/404.html` is the site's own file. (`public/data/ne_110m_land.geojson` is a build-time input that gets copied but
     is never requested.)
201. **Fact audit (R1)** (`facts-p18`: 10,603 strings — the page in Play and Speedrun Mode with every hidden alternate,
     every pause-menu tab, every terminal command, every BYTE line, the 404 — numbers, tech names and organisations
     checked against content.ts and the counts). Nothing invented; two overstatements fixed: the perk the PART 6 brief
     named "Published" said so over two papers content.ts lists as "Presented" — its name now follows the status
     ("Presenter", "Published" once a DOI arrives); BYTE's EY line said "shipped" where content says "building" →
     "built". Kept as the briefs wrote them: "Hackathon Veteran", "Not on the save file yet — Akshat learns fast.", and the
     share card's "LV 10" (game flavour, the top level). The Lab's peel said "Peek under the The Spoilage Specter card".
202. **Originality audit (R4).** The coin sound was a famous platformer's coin — two square notes, B5 → E6 after
     60ms; it is a single bell "ting" with a shimmer and a short echo now. The handheld pad's green A and red B were a
     console's colour code: A wears the current world's lead colour (R8, ink on the bright fill) and B is neutral like
     START. Kept: the FUNSOLE (the generic portrait-handheld archetype, with its own button layout — the candy buttons
     beside the d-pad, EJECT / FULLSCREEN pills — a dot-grid speaker and its own body and name), the cartridges (plain
     ridged cards), the pixel sword and robo-glove cursors (original art), the names (generic or original), the cheat
     code's key sequence (the PART 16 brief's, under the generic name "Cheat code", no brand assets).
203. **Juice audit** (`juice-p18`: one of every kind of control in every world and the HUD, pressed like a person —
     pointer down, 60ms, up — with sound on). Every control answers within 100ms: a press animation or transition
     starts in ≤ 6ms everywhere, the action's own change lands around 70ms (the click fires on release). Sound had gaps
     (landmarks, perks, peels, tabs, Pause the roll, the root, Back to top…): `useClickSound()` (the runtime) gives any
     click on a control that asked for no sound of its own within 150ms a soft blip — heard in the capture phase (the
     Skill Tree's links stop the click), decided in a task after every handler, hover blips don't count, fields / BYTE
     / game screens / `[data-sfx-skip]` keep their own voices. Sound stays off by default (R5).
204. **Cursor audit (R2)** (`cursor-p18`, 22 checks): ~8,200 elements in each theme and in Speedrun Mode — none has
     `cursor: none`, every custom cursor is a url() with a keyword fallback and every file it names exists; a custom
     cursor over text, links, buttons, drag handles and 3D canvases in every world; the follower stays in the top layer
     over the pause menu, the scroll, the terminal, each of the six games while playing (Bug Whack's crosshair) and the
     boot.
205. **Consistency.** Outlines and hard shadows come in size tiers — 2px outline with a 2–3px shadow (chips, small
     controls), 3px with 4–6px (cards, buttons), 4–5px (big tokens) — and every component class has one look apart
     from its states (pressed, current, owned). Informational labels under the type scale's 12px floor moved to
     `--text-xs`: skill cards' type / "Used in" / evidence lines, the trophy plaques' state, the cartridges' genre,
     YOUR RUN's labels. The radial Skill Tree keeps its container-unit labels (10.5–12px) — its collision-free layout
     is computed for them; the same names are ≥ 12px in the cards and the vertical tree. Phones get the slim one-line
     toast in every mode (in Play Mode a full card plus the level-up banner covered the Title's name) and the level-up
     is a compact ribbon above the controller.
206. **Cross-browser** (`browsers-p18`: Chrome 141, Edge 141, Firefox 159, Safari / WebKit 27.2, iOS Safari and Android
     Chrome emulated — 46 checks: world ids, the native cursor, the HUD glass, the WebGL tier, Handheld Mode, the
     contact form's mailto, Speedrun Mode, no console errors, no third parties). Found: Chrome, Edge and Firefox had no
     HUD / rail / pad blur — the minifier keeps one of `backdrop-filter` and a hand-written `-webkit-backdrop-filter`
     that follows it, and kept the prefixed one, which only Safari reads. The source now writes the standard property
     only (the build adds the prefix). Never hand-write `-webkit-backdrop-filter`.
207. **Response headers** (`public/_headers` for Netlify and Cloudflare Pages, the same set in `vercel.json`):
     `Content-Security-Policy: default-src 'self'` with `'self'` for every origin — R10 enforced by the browser — plus
     `'unsafe-inline'` (Next's inline page data, the pre-paint script, style attributes), `'unsafe-eval'` (axe-core
     compiles its message templates — the Vault's "Scan this page"), `img-src data: blob:`, `form-action 'self'
     mailto:`, `frame-ancestors 'none'`; `nosniff`, `X-Frame-Options: DENY`, a strict referrer policy, a permissions
     policy that turns off camera / microphone / geolocation / payment / USB (not the motion sensors — tilt needs
     them), and a year of immutable caching for `/_next/static`. (No `Cross-Origin-Opener-Policy`: without COEP,
     WebKit logs a cross-origin-isolation warning on every page — engines-qa — and the site opens no popups.)
     `scripts/serve-out.mjs` applies the file, so the preview, the smoke test and every QA suite run under it — no
     violation in Chrome, Firefox or WebKit (the scan, the games, the 3D, the contact form, the eggs, the proctor's
     data: favicon). GitHub Pages can't set headers.
208. **Deploy.** `out/` on any static host, nothing to configure: `netlify.toml` (build + publish), `vercel.json`
     (headers), Cloudflare Pages by its dashboard settings, GitHub Pages through `.github/workflows/deploy-pages.yml`
     (run by hand — no surprise deploys; root hosting only: the `<user>.github.io` repository or a custom domain, as the
     site uses root paths). Node 22 comes from `.nvmrc` / `engines` — no environment variables anywhere. `public/.nojekyll`
     for branch-based Pages. CI (`.github/workflows/ci.yml`) runs check, build and the smoke test on every push and
     deploys nothing. Custom domain: TODO → `site.url`.
209. **The smoke test lives in the repo** (`tests/smoke.spec.ts`, `npm run test:smoke`; `@playwright/test` 1.65.1 as a
     dev dependency — the brief asked for Playwright; it runs in the installed Chrome, no browser download): no console
     errors and every world id, every fact visible in Speedrun Mode (from content.ts), the contact form's validation and
     its exact `mailto:` (the site's own `mailtoHref()`), the 404's status and GAME OVER, no third-party requests.
210. **Haptics wait for the first tap.** Chrome blocks `navigator.vibrate` before the page has had a user activation and
     logs a console error — an achievement at load (Night Owl) or one earned by scrolling alone (Explorer) did that on
     touch devices (found by the overnight regression). `haptic()` checks `navigator.userActivation.hasBeenActive`.
211. **The smooth-scroll loop sleeps again after a native scroll.** Lenis sets `isScrolling = "native"` on a native
     scroll and clears it from a timer it starts only when the velocity isn't zero — so a scroll event that didn't move
     the page (a deep link's jump) left it "native" for good, and our sleep-when-idle loop (#40) kept requesting frames
     at rest (found by the overnight regression: part8 G5, part16 R1 — 60 frames per 2s; part6 H1's idle style
     recalcs). The loop now runs only for Lenis's own animations (`isScrolling === "smooth"`) or 250ms after input, and
     the resync before a flight (#160) also runs unless Lenis is smooth-scrolling. Measured: 0 frames at rest.
212. **The "+XP" ghost's text is generated content** (`::before { content: attr(data-text) }`): an aria-hidden
     flourish that fades as it flies to the XP bar — axe caught it half-faded (part5 H4); the value itself is the HUD's.
213. **No deal for keyboard visitors.** The Profile's deal (#75) armed its tiles at `opacity: 0` — invisible but
     focusable — and Chrome leaves a focused element alone when a sliver of it is on screen, so a first Tab into the
     character sheet could focus a perk that stayed almost entirely below the fold (part17-qa D7). Focus arriving in
     the bento now skips the deal (the tiles are simply there) and reveals the focused tile whole under the HUD.
214. **Final measurements** (the v1.0.0 export behind the preview server, which now sends the production headers).
     Lighthouse desktop `/`: 100 · 100 · 100 · 100 (LCP 0.4s, CLS 0, TBT 0). Mobile `/`: 96–97 · 100 · 100 · 100 in
     most runs (LCP 2.1s, CLS 0, TBT 60–80ms); about one run in four reads 87–88 with LCP 3.6s (the Title's class line,
     which types itself in) — the same with the idle warm-up switched off (A/B), so it's the simulation's variance on
     this machine, not the build. `/404.html`: 97 mobile / 100 desktop (SEO 63 = its noindex). Initial JS 182.7 KB.
     The overnight regression's remaining failures were environmental: every 60fps check read a steady 33ms because
     the display had gone to sleep (a blank page did too; with vsync off the site's frames take 1–2ms, glass included),
     and Night Owl (00:00–04:59) fired in every fresh save — the suites pass on a daytime clock (`TZ=…`), except in
     WebKit, which ignores `TZ`.
215. **v1.0.0.** PART 18 closes the core build; PART 19 (Ask BYTE) is optional.

## PART 19 — Ask BYTE: offline NPC dialogue

216. **An offline dialogue tree, not a model** (R10: no LLM, no API, no keys — it works forever). `src/content/dialogue.ts`
     is server-only and builds the nodes from content.ts at build time: the current role (`now`, `now-built`,
     `now-stats`), the other roles (`experience`, `job-<id>`), the projects (`projects`, `project-<id>`), the papers
     (`research`, `paper-<id>`), skills for an AI/ML role (`skills-ai`: the AI/ML & Data skills with their "Used in"
     receipts — never a self-rating), availability, contact, the résumé, education + coursework, and BYTE's own corner
     (hub, joke, secret, byte, thanks, fallback) — 28 nodes today; a new role, project or paper gets its node and its
     type-to-ask route by itself. The runtime gets plain strings as a prop (layout → GameRuntimeLoader → GameRuntime →
     the lazy `ByteChat`, 5.3 KB gzip; the prop is ~5 KB gzip of HTML), so content.ts never ships to the client. Initial
     JS 183.0 KB (+0.3: BYTE's Ask button and the chat state).
217. **R1, checked twice.** `node(id, mood, line, facts, options)` takes the exact content fragments a line restates;
     the build fails when one isn't in content.ts or is a TODO. "Best project?": the save file doesn't rank projects,
     so BYTE doesn't either ("The save file doesn't rank them — 5 projects, 5 cartridges in the Vault. Pick one:").
     Availability is TODO → "That's not on the save file yet…" with the Lobby and the email; the résumé node says
     "coming soon" until the PDF exists (the Lobby portal's build-time check) and offers Speedrun Mode. The connective
     words, BYTE's lines and the seven jokes (original, about robots and code — never about Akshat) are game copy.
     part19-qa checks every number and name in every line against content.ts independently (B1) and walks all 28
     nodes in the browser (B3): the panel shows exactly the build's line and options for each.
218. **Type-to-ask** (`src/lib/ask.ts`, pure, no content import). Words are folded (case, accents — "Résumé?" →
     resume — and punctuation; `.` `+` `#` stay for pm2.5, c++, c#); stop words don't count alone; a word matches its
     plural; typos land (Damerau–Levenshtein ≤ 1 from 5 letters, ≤ 2 from 9: "experiance", "skils"); phrases ("machine
     learning", "who are you", "save file") match in order and weigh double; each folded word counts once per route
     ("résumé" and "resume" are one). Earlier routes win ties, so specific names (the résumé, projects, papers,
     companies) come before general words: "the resume screening project" → the project, "Résumé?" → the Save File.
     Generic company words (Solutions, Technologies, Web…) don't become routes. No match → "That's not in my save
     file! Try one of these:" + three starter topics not asked yet + All topics. Tested: 36 questions in Node, 22 in the
     browser (the brief's intent words, typos, names, accents).
219. **The panel is BYTE's bubble grown up.** A non-modal `role="dialog"` (`aria-modal="false"`; the page stays usable)
     in a PixelFrame, portaled to the body at z-index 86 — above BYTE, below the FX canvas and the top layer, so the
     cursor stays on top (R2). While it's open BYTE takes a seat beside it: 8px to its right, bottom-aligned, with the
     tail pointing at BYTE's screen (desktop: the panel sits 100px from the right edge, clear of the level rail); on
     phones the panel is a sheet above the controller and BYTE perches on its top edge; minimized or switched off, the
     panel takes the corner. BYTE skips its "never cover a button" glide then — the panel covers more than BYTE does,
     and closes on any action. Everything BYTE says while it's open (a quip when it's clicked, a high-five, the Lobby's
     errors) goes into the log (bus `chat:line`), unasked lines (tips, world lines) wait behind the "!", and BYTE's Ask
     button steps aside (the panel has its own ×). A fixed height — `min(540px, 100svh − 120px)` — so the panel
     doesn't move as the topics change; older lines fade out under the header. On phones the topics are a two-row strip
     that scrolls sideways (nine wrapped chips took the log's room).
220. **Alive.** "BYTE is thinking…" pixel dots for 300–600ms before every answer (measured over 112 answers: 301–598ms),
     BYTE's "thinking" face meanwhile and the answer's mood after; the reply types itself in (a blip every few letters
     while sound is on; a click on the log finishes it; whole at once under reduced motion). The greeting follows the
     time of day (Good morning / afternoon / evening; "Up late? Same." from 22:00 to 04:59), uses the name typed in
     the Co-op Lobby and reacts to the run — the newest of ten achievements BYTE has a line for ("You found the cheat
     code?! Respect."); an achievement unlocked while the chat is open gets a line at once. The last 10 lines stay for
     the page view, across closing and reopening (no second greeting).
221. **The visitor's name** (SAVE_VERSION 4, `visitor.name`): taken from the Co-op Lobby's name field when it changes
     (and from a valid invite), tidied (printable characters, collapsed spaces, ≤ 40); this browser only — the save
     file in localStorage, never sent anywhere. "Forget my name" (a topic while BYTE knows one) erases it at once, Reset
     save forgets it, NEW GAME+ keeps it (the same player). The v3 → v4 step adds nothing (normalizeSave fills null).
222. **Actions close the chat and go** — focus lands where they arrive, not back on BYTE: a world or a quest card
     (`scrollToElement` + focus), a game (`openGame`), a paper's scroll (its `[data-scroll-open]` button, after the
     flight), a cartridge (`vault:insert`, after the flight), the JD scanner (`skills:open`), a pause-menu tab, the
     terminal, Speedrun Mode, the résumé (once it exists). "Copy his email" stays in the chat: the clipboard (with an
     `execCommand` fallback), Copycat, "Copied!".
223. **Keyboard and screen readers.** Ways in: BYTE's Ask button (`aria-haspopup="dialog"`, `aria-expanded`; it focuses
     itself on click — Safari doesn't, #132) and Pause → Controls → Ask BYTE (phones, or with BYTE switched off). Focus
     moves into the panel at once (its name is announced) and to the first topic when it arrives. Topics are one tab
     stop (roving tabindex): ←/↑ and →/↓ move and wrap, Home/End jump, Enter or Space picks; after a typed question
     focus stays in the text box. Tab order: × → the log → topics → text box → out (non-modal). The log is a tab stop
     so the history scrolls by keyboard too (axe: scrollable-region-focusable); a wrapper draws its focus ring, because
     the log's fade mask would clip one drawn on the log. Esc anywhere in the panel closes it and returns focus to the
     opener, or to BYTE's Ask button — a handled Esc, which the keyboard manager and the pad's B skip (on phones B
     closes it). While BYTE thinks the topics stay, dimmed and inactive (`aria-disabled`), so focus — and Esc — never
     fall out of the chat. Opened from the pause menu, the chat takes focus only once that modal has closed: the Modal
     hands focus back to its opener when it finishes animating out, and behind a non-modal panel the page isn't inert.
     `data-keyboard="exclusive"`: no shortcuts or typed eggs inside. The log is `role="log"` with `aria-live="polite"`;
     each line reaches screen readers once and whole ("BYTE: …" / "You: …" in sr-only text; the typed copy is
     aria-hidden); the thinking line is aria-hidden; markup typed by a visitor stays text. axe: clean in night, day,
     retro, a violet world and on a phone. Touch targets ≥ 44px — BYTE's Ask and minimize buttons get an `::after` hit
     area (PART 17's audit had missed them).
224. **Speedrun Mode has no chat**: BYTE is hidden there, the pause menu's "Ask BYTE" is `data-speedrun="hide"`, and
     switching it on closes the chat (the conversation is still there back in Play Mode).
225. **Zero network** (the acceptance). The chat's chunk is part of the idle warm-up (through the same loader function
     as its `dynamic()`, #199), so opening and using it makes no request — measured in every part19-qa scenario and in
     WebKit and Firefox (the only request: the cursor image the browser fetches the first time BYTE's "grabbing" cursor
     shows, when BYTE itself is pressed). With the network off after the first load, it works fully.
226. **Deep links no longer land a screen short** (found by PART 19's QA; there since PART 5). On wide screens the Title
     pins itself after hydration (+100vh), after the browser's hash jump; scroll anchoring kept most worlds in place,
     but /#lab landed in the Quest Log and /#credits in the Trophy Room. When the pin changes while the Title is above
     the view, `TitleIsland` now keeps the view in place itself (it adds whatever height anchoring didn't make up).
     Measured: every world's deep link lands 76–80px from the top, in Chrome, WebKit and Firefox.
227. **v1.1.0** ("Ask BYTE").

## After PART 19 — fixes

228. **The Launchpad's second shot** (reported by Akshat: "it can only be played once — it gets stuck at the next
     shot"). The grab handle shows only while the stage says `data-phase="aim"`, and that attribute came from HUD
     refreshes the controller made on launches, pops and topples — but not when BYTE came back to the launcher, which
     happens inside the sim's `step()`. So after the first shot the handle stayed hidden and neither a mouse nor a finger
     could grab BYTE; the keyboard still worked (its handler reads the sim's own phase), which is why every suite — they
     all shot with the keys — missed it. The sim now reports every phase change (`setPhase` → a `phase` event → the
     HUD). `tests/launchpad.spec.ts` plays three shots by mouse, Play again and more, a finger pull (CDP touch events),
     the keyboard, Reset and Skip; against the old build all four tests fail.
229. **Reset and Play again keep the page still** (found by the new suite in Firefox). Both focus the stage for the
     keyboard; Firefox scrolls a focused element that isn't wholly in view, so the 754px stage jumped 403px and BYTE's
     launcher went below the fold (Chrome and Safari leave a partly visible element alone). The stage is focused with
     `preventScroll` now — it's on screen whenever those buttons are pressed.
230. **The page scan waits for one-shot animations** (found the same way). Scanning the moment a cartridge's screen
     appeared, axe read text mid-fade and reported a contrast failure that was gone a moment later (Firefox, 1 run in
     4). The scan now lets running one-shot animations and transitions finish first — at most 1.2s, inside the laser's
     1.5s, endless loops excluded — so it reports the settled page.
231. **The functional suite lives in the repo** (`npm test`, `tests/*.spec.ts`, `@playwright/test` on the installed
     Chrome) — the old QA suites lived in /tmp, and macOS's cleaner deleted them (the second time it struck). 35 tests
     play the site like a visitor, pointer first, every replayable thing twice: the slingshot; all six arcade games
     (start, real input, pause, restart into a second round, exit; Token Squeeze to its results and Play again); every
     world's toys and hidden coins (#2, #4, #6, #7, #8, #10), the scrolls, cartridges, the page scan, the Prize Counter,
     the Skill Tree's tabs and JD scanner, the hall and the capsule machine, two invites in a row, the credits; the
     boot, the HUD, every pause-menu tab, the map / rail / number keys, the terminal, Ask BYTE, typed eggs and the cheat
     code; the phone's controller and Ask BYTE's sheet. CI runs it on every push, with one retry there (games and
     physics run in real time on a slower runner). Measured: green twice in a row with the GPU off (software WebGL, as on
     GitHub's runners) and with it on. `npm run test:smoke` stays the one-minute smoke test. The same tests also run
     in WebKit and Firefox (Playwright's builds — a local check; CI stays on Chrome). One thing there isn't explained:
     under the test runner, Playwright's Firefox tab crashes while the page scan runs, every time — while the same
     steps in a plain Playwright script with the same Firefox build finish the scan in ~2s, every time.
232. **v1.1.1** ("Second shot").
