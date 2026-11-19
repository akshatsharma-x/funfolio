# AKSHAT.EXE — The Funfolio

"Don't read my résumé. Play it." — Akshat Sharma's game-themed portfolio. Fully static (Next.js `output: "export"`):
no server, no API keys, no runtime third-party requests.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:3000 |
| `npm run build` | Static export to `out/`, then R1/R10/budget checks (`scripts/check-export.mjs`) |
| `npm run preview` | Serves `out/` at http://localhost:4173 like a static host (brotli/gzip, immutable `/_next/static`, 404 page) |
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
Skill Tree entry. Side quest buttons open their games in the Arcade. Reading a card for 3s pays +10 XP once.

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

World 6 (the Skill Tree) has three views. TREE: every skill as a hex node on five type-colored branches around the
root (a vertical tree on phones); hover, focus or tap a node for its card — type, "Used in:" (click to jump to that
quest, or to insert that project's cartridge) and the evidence count. Arrow keys move between nodes, `Esc` closes a
card. INVENTORY: the same skills as an RPG slot grid with type filters and a search that knows aliases ("js",
"postgres", "ml"); equip up to three for the LOADOUT, which shows where they were used together. JD SCANNER ("Party
Compatibility Check"): paste a job description and SCAN — it runs entirely in the browser (offline too) and lists the
matching skills by type, bonus perks, what else the résumé shows and what isn't on the save file yet; counts only,
never a percentage. "Try a sample JD" fills in a generic AI/ML internship. Without JavaScript and in Speedrun Mode the
tree is a plain list with "Used in" for every skill.

World 7 (the Trophy Room) starts with the Hall of Fame: one pedestal per honor under a spotlight, with a 3D trophy on
desktop (gold medallions on phones). Hover a trophy to spin it; click or press Enter for its card (the camera dollies
in), arrow keys move along the pedestals, `Esc` closes. The certificate cards flip and enlarge when clicked — until
there are certificates, three sealed packs wait for them. The capsule machine deals the same honors and certificates:
wind the crank (or press TURN) and a capsule rolls out and pops open — one in five holds something extra. "Your
trophies" is a shelf of the achievements you've unlocked on this browser.

World 8 (the Co-op Lobby) is the contact page: "PLAYER 2, PRESS START". The party invite is an RPG dialog — BYTE asks
for your player name, a quest type (Full-time · Internship · Freelance · Collab · Just saying hi) and a message, and
answers in character when something's missing. SEND folds the form into a paper plane: pull it back and let go, press
Enter, or click Auto-launch, and it flies into the mailbox portal — then your own email app opens with the subject and
message filled in ("Copy message" for people without one). Nothing is sent anywhere by the site: it's a `mailto:` link,
and it works offline. The direct portals are Email (with "Copy address"), LinkedIn, GitHub and the Save File (the
résumé PDF). Speedrun Mode skips the plane; without JavaScript the form is a plain `mailto:` form.

The credits (the footer) roll by themselves — hover or focus pauses them, "Pause the roll" stops them, and the wheel
or the arrow keys take over. A coin drifts through. YOUR RUN shows this browser's run (time played, coins, achievements,
best scores, level) with "Share my run" (copies a line and the site's address) and NEW GAME+ (a fresh run that keeps the
cosmetics you bought). "▲ Back to top" sends BYTE up with a jetpack. Without JavaScript, in Speedrun Mode and with
reduced motion the credits are a plain list.

Any unknown address shows GAME OVER (`out/404.html`, served with status 404): "CONTINUE?" counts down from 10 and goes
home — any key or click stops it — with a quick round of Bug Whack on offer.

Secrets are everywhere (none of them gets in the way): linger in a screen corner, type a word outside a text box
(try a name, or what recruiters are here to do), remember an old code (↑↑↓↓←→←→BA), right-click (Shift + right-click
keeps the browser's menu), switch tabs, leave BYTE alone for a while, or visit after midnight. Press `` ` `` (or Pause →
Controls → Open the terminal) for AKSHAT-OS, a terminal: `help`, `whoami`, `experience`, `play bug-whack`, `hint`, `cat
secrets.txt`… and `sudo hire akshat`. Developers: check the console. `/playground/eggs` lists them all with a trigger
button each. Recruiter Speedrun Mode keeps only the terminal and the right-click menu.

BYTE, the robot mascot, lives in the bottom-right corner: click for a quip, drag or throw it, rub it for hearts,
minimize it with the `–` button (or turn it off in Pause → Settings). `/playground` has a Juice kit & BYTE panel.

On phones and tablets (a touch screen, or any window under 768px) the page is in Handheld Mode. The HUD becomes a slim
strip (level, XP, coins; everything else is under START) and a controller bar sits at the bottom: ◀ ▶ previous / next
world · A = the world's main action (named on the button: Launch, Read the scroll, Insert cartridge, Turn the crank…) ·
B = back (closes whatever is open, else the top of the world, else the previous one) · START = the pause menu. It tucks
away while you scroll down and comes back when you scroll up. Long-press anything with a tooltip to read it; "Enable
tilt" lets the island follow your phone; the Lab's globe loads when you tap "Spin the 3D globe"; coins, level-ups and
achievements give a short buzz (never with reduced motion, in CHILL or in Speedrun Mode). Every touch target is at
least 44px. Speedrun Mode has no controller.

Keyboard: "Skip to content" is the first Tab stop, and "Skip mini-game" links (shown when focused) jump past the
Launchpad to the Quest Log and past the Arcade's cabinets to the Prize Counter. Every in-page jump moves focus to where
it lands.

## Editing content

All facts live in `src/content/content.ts`. Anything set to `"TODO"` renders as "Coming soon"; counts (internships,
projects, papers, skills, honors) are computed. Rules: [`docs/FUNFOLIO_BIBLE.md`](docs/FUNFOLIO_BIBLE.md) ·
choices: [`docs/DECISIONS.md`](docs/DECISIONS.md). Design check: `/playground`.

The Lobby's Save File portal stays "Coming soon" until the PDF named by `player.resumeUrl` is in `public/` (checked at
build time — rebuild after adding it); the availability card appears once `player.availability` is filled in, and the
phone portal only with `showPhone: true` and a number (it's revealed on click — and a number in content.ts is in git).

While `player.bio` is `"TODO"`, the Profile shows a DRAFT bio assembled only from these facts — write your own in
`player.bio` to replace it. Until `player.photo` is set, the Character Card shows a pixel avatar; its colors are in
`src/content/avatar.ts`. Perk names and the Focus Radar's domain buckets live in `src/content/profile.ts`.

Search and sharing: the page title, description and the JSON-LD `Person` (name, school, current role, LinkedIn,
GitHub) are built from content.ts; the share card (`/og.png`, a game character card), the Apple icon and the pixel
BYTE favicon are generated at build time. Set `site.url` in `src/content/site.ts` once the domain exists — the canonical
link, `og:url` / `og:image` and the sitemap's entry need an absolute address, so they're left out until then.

Skills come from `skills` in content.ts (each listed once — the build checks). A skill's "Used in" is computed from the
roles' and projects' `stack`s through the alias map in `src/lib/skills-index.ts` ("GPT-4.1" counts for LLMs, "Django
REST Framework" for Django); a skill no stack names says "On the skills list". Pick 5–8 `skills.signature` items for
the holo-foil. The JD scanner's "not on the save file yet" vocabulary is in the same file.
