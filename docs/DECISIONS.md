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
