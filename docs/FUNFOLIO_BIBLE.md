# AKSHAT.EXE — The Funfolio Bible

> Verbatim copy of PART 0 (the project Bible), extracted from `../prompts.md` — one value masked: the phone number
> (docs/DECISIONS.md #1). Do not edit the text below;
> record later decisions in [DECISIONS.md](./DECISIONS.md). §11 is the original content snapshot —
> the live source of truth for facts is `src/content/content.ts`.

````text
PART 0 — THE FUNFOLIO BIBLE (context only — no code yet)

You are a senior creative developer and game-UI designer at an award-winning interactive studio. We're building
"AKSHAT.EXE — The Funfolio": a gaming-themed, multicolor, 3D, interactive portfolio for Akshat Sharma.
I'll send the build in numbered PARTS. Don't write code for this message.

Reply with: (1) a 10-line summary of the vision, (2) up to 5 sharp questions (if I answer "defaults", choose sensible
defaults and note them), (3) "READY FOR PART 1". In PART 1 you'll save this Bible to docs/FUNFOLIO_BIBLE.md and the
CONTENT block to src/content/content.ts.

══ 1 · BIG IDEA ══
Tagline: "Don't read my résumé. Play it."
The site IS a game. Visitors boot it, insert a coin, explore a 3D overworld, clear worlds, collect coins, unlock
achievements, and every big résumé line has a playable twin (token compression → a squeeze game, SHA256 caching →
memory match, RAG → a catching game, debugging → bug-whacking, research papers → boss battles).
Feeling: joyful, surprising, crafted. A first-time visitor grins within 3 seconds and finds something new on every click
and in every corner. Under the fun, every fact is real, and a recruiter gets everything in 30 seconds.
Audiences: recruiters (speed → Recruiter Speedrun Mode, résumé "Save File"), engineers (craft → physics, 3D, perf, a11y,
code jokes), everyone (fun → surprises, mini-games, mascot).

══ 2 · GOLDEN RULES (non-negotiable — re-check at the end of every part) ══
R1 TRUTH — Facts come only from src/content/content.ts. Never invent metrics, dates, titles, links or claims. Missing
   data → a tasteful "COMING SOON" state; never show raw "TODO". Decorative visuals (graphs, particles, maps) must not
   pass as real data — label them "illustrative" when ambiguous.
R2 CURSOR ALWAYS LOCATABLE — The native custom cursor is the source of truth (zero lag); the animated follower is a bonus.
   Never `cursor: none`. Never displace the real pointer with "magnetic" effects. No overlay, game, modal, loader or 3D
   canvas may hide it. Full spec in PART 2.
R3 NEVER BLOCK CONTENT — Every gate, intro, game and long animation is skippable (button + key). All real content is
   server-rendered in the DOM (SEO + screen readers) even while visually "locked". Recruiter Speedrun Mode removes friction.
R4 ORIGINAL IP ONLY — Genre mechanics are fine (slingshot physics, snake, whack-a-mole, memory match, catcher, marble
   tilt); names, characters, art, sounds and UI must be original. Do NOT use or imitate: birds/pigs/wooden-slingshot
   scenes, plumbers, mushrooms, warp pipes, "?" blocks, maze ghosts, falling tetrominoes, any console brand's
   UI/logos/sounds/fonts, existing game music/SFX, or famous portfolio sites. Companies appear as text + original
   pixel-monogram "guild emblems" (no official logos).
R5 ACCESSIBLE FUN — WCAG 2.2 AA: full keyboard support, visible focus, prefers-reduced-motion honored, nothing flashes
   more than 3×/second, text contrast ≥ 4.5:1, sound OFF by default, every game pausable, every drag has a click/key
   alternative.
R6 PLAY ZONES vs READ ZONES — Paragraphs stay calm and legible; chaos lives at edges, on interactions and inside games.
   No shake, wobble or particles on top of text.
R7 PERFORMANCE — 60fps on a mid-range laptop. 3D, physics and games lazy-load and pause/unmount off-screen. Budgets in §10.
R8 RAINBOW DISCIPLINE — Each world = ONE lead color + ink + cream. Full multicolor is reserved for celebrations (hero
   title, wins, achievements, arcade, credits). Cohesive maximalism, not noise.
R9 CLARITY — Every game metaphor sits next to its plain name: "QUEST LOG · Experience", "CARTRIDGE VAULT · Projects".
   Recruiters and screen readers must never need to decode a metaphor.
R10 STATIC & KEYLESS — No API keys, no backend API routes, no runtime calls to third-party services or CDNs. The site is a
   static export that keeps working forever with zero maintenance: fonts, icons, map data and textures are bundled
   locally; contact = mailto + copy-to-clipboard; BYTE's chat = an offline dialogue tree; no analytics scripts.

══ 3 · DESIGN SYSTEM — "NEO-ARCADE POP" ══
Mood: 90s arcade sticker sheets × modern 3D & glass × pixel art. Chunky, glossy, outlined, toy-like, bouncy.

Themes (CSS variables on <html data-theme>):
• night (default) "Neon Arcade": bg #0E0B1E · surface #1A1535 · surface-2 #251E4A · line rgba(255,255,255,.08) ·
  text #FFF4E0 · muted #B9B2D9 · ink/outline #07060F
• day "Toybox": bg #FFF4E0 · surface #FFFFFF · surface-2 #FFE9C7 · line rgba(27,21,48,.10) · text #1B1530 ·
  muted #5B5375 · ink/outline #1B1530. Rule: colored fills carry ink text; never light colored text on cream.
• retro (unlockable) "CRT": night palette + scanlines, phosphor glow, vignette, pixel-font headings, slight chromatic split.

Palette (night value / day-safe deep value):
pink #FF3D8B / #D6146A · cyan #22D3EE / #0E7490 · lime #B6FF3B / #4D7C0F · yellow #FFD23F / #A16207 ·
orange #FF8A1F / #C2410C · violet #A78BFA (text) & #8B5CF6 (fill) / #6D28D9 · mint #2EE59D / #047857 ·
red #FF4D4D / #B91C1C · coin gold #FFC83D (highlight #FFF1A8, shade #C98A00).
World colors: Title rainbow · Profile cyan · Quests lime · Lab violet · Vault pink · Arcade rainbow · Skills yellow ·
Trophies orange→gold · Lobby mint. The current world color lives in --world (registered via @property as <color> so it
animates between worlds).
Item types: Weapons = Languages (pink) · Spells = AI/ML & Data (violet) · Gear = Frameworks & Backend (cyan) ·
Gadgets = Tools & Platforms (orange) · Runes = Core CS & SE (mint). "Signature" items get animated holo-foil.

Typography (next/font, latin subset, swap; max 4 families):
• Display "Unbounded" 700–900 — titles, big numbers; tracking −0.02em; world titles uppercase.
• Pixel "Pixelify Sans" 400–700 — HUD, labels, buttons, badges, game UI.
• Body "DM Sans" 400–700 — paragraphs 16–18px, line-height 1.6, max 68ch.
• Mono "JetBrains Mono" — terminal, hashes, stack chips, code jokes.
Fluid scale: xs 12 · sm 14 · base 16–18 · lg 20–22 · xl 28–32 · 2xl 40–48 · hero 72–152.

Shapes & surfaces:
• Sticker card: 3px ink outline, radius 20, hard offset shadow 0 6px 0 ink + inner top highlight; press → translateY(4px)
  with shadow 0 2px 0 (arcade-button feel).
• Pixel-stepped corners (clip-path) on badges, dialogs and retro accents.
• Arcade buttons: pill/circle, 3px outline, glossy top half, squash on press, colored by intent.
• Glass HUD: backdrop-blur 14px, hairline light border, pixel corner brackets.
• Textures (CSS/SVG, subtle): pixel grid, halftone dots, comic starbursts ("POW!"), scanlines on screens, 3% grain,
  animated holo-foil (conic gradient + noise) for legendary items.
• Icons: original 16×16 pixel icons rendered from arrays to SVG; tech logos from simple-icons, tinted, monochrome.
• 3D look: toon/flat-shaded low-poly + voxels built from primitives, thick outlines (drei <Outlines/>), one key light +
  ambient, blob shadows, no realistic PBR — the stickers came alive.
Layout: 12-col grid, max-width 1280, gutters 24; bento gaps 16–20; generous space around read zones.
Voice: short, playful gamer-speak that stays professional. Buttons: PRESS START, SAVE FILE, EJECT, LAUNCH. Errors:
"Oops — that's a glitch. Try again?" Empty: "COMING SOON — next level loading…". Never mock the visitor. Pixel icons
over emoji.

══ 4 · MOTION & JUICE ══
Principles: anticipation → action → overshoot → settle; squash & stretch; follow-through; hit-stop on impacts;
anything touchable answers within 100ms.
Timing: micro 120–180ms · UI 250–400ms · reveals 600–900ms · nothing delays reading by more than 1.2s.
Easing: pops back.out(1.7) · jelly elastic.out(1, 0.4) · camera expo.inOut · sprite/retro motion steps(4–6) ·
springs (Motion) 400/18 bouncy, 220/26 smooth · stagger 40–60ms.
Juice kit: particle bursts, floating text ("+10 XP", "CRIT!"), slot-machine number rolls, squash-on-press,
screen shake (≤ 6px, ≤ 200ms, games/celebrations only), hit-stop 50–80ms (games only), pixel-dissolve transitions,
confetti, ripples on the background grid.
Effects intensity: CHILL / NORMAL / CHAOS via <html data-fx> scales particles, shake, trails and idle motion.
prefers-reduced-motion → CHILL + no shake/parallax/trails/camera flights; state changes become fades.
Library roles: GSAP + ScrollTrigger/Flip/SplitText (scroll choreography, timelines) · Motion (component states,
gestures, layout) · Lenis (smooth scroll, synced to ScrollTrigger) · React Three Fiber + drei (3D) · Matter.js (2D physics).

══ 5 · SOUND ══
Original procedural chiptune SFX with ZzFX — no sample files, no borrowed sounds. OFF by default; boot offers
"Start with sound / Start muted". Master volume + mute in HUD; hover sounds throttled; a global rate limiter so
spam-clicks never become noise. Optional background loop only if I supply a royalty-free file later.
SFX set: click, hover, coin, xp, levelUp, achievement, open, close, error, whoosh, stretch (pitch follows pull), thud,
pop, blip (typewriter), insertCoin, powerUp, countdown, win, lose.

══ 6 · GAME LAYER (built in PART 3) ══
XP & levels (LV 1–10) · 12 hidden coins + a spendable coin wallet · ~35 achievements · high scores · Prize Counter
(cursor skins, retro theme, BYTE hats, confetti styles) · save file in localStorage (Continue / New Game) · pause menu ·
level-select rail · keyboard shortcuts · Recruiter Speedrun Mode · patch notes.
Mascot BYTE: an original tiny floating robot with a rounded CRT-monitor head; the screen shows pixel eyes and moods; the
antenna bulb glows in --world. Friendly, cheeky, helpful; never blocks content; can be minimized.

══ 7 · TECH STACK ══
Next.js (latest stable, App Router) · React · TypeScript strict · Tailwind CSS v4 (@theme tokens) · gsap (ScrollTrigger,
Flip, SplitText) · motion · lenis · three + @react-three/fiber + @react-three/drei · matter-js · zustand (persist) ·
zzfx · canvas-confetti · simple-icons · zod · clsx. Later, lazy-loaded: react-globe.gl, axe-core.
Ask before adding other heavy dependencies. Deployment = static export (next.config output: "export") — see R10.
No package that needs an API key or a runtime network request.
Conventions:
• Content-first: server components render all text; client islands add play. 3D/physics/games via next/dynamic
  ({ ssr: false }) and mount only near the viewport.
• Global modes on <html>: data-theme (night|day|retro) · data-fx (chill|normal|chaos) · data-mode (play|speedrun) ·
  data-cursor (variant). Components read these instead of ad-hoc props.
• One FX overlay canvas + one background canvas for the whole site.
• Every interactive game element has an accessible name and a keyboard path. No lorem ipsum.
Folders: src/app (layout, page, not-found, opengraph-image) · src/content (content.ts, achievements.ts,
coins.ts, quips.ts, patchNotes.ts) · src/components/{ui,cursor,hud,fx,byte,sections,three,games,terminal} ·
src/lib (store, bus, sfx, juice, eggs, skills-index, jd-scanner, quality, hooks) · public/{cursors,resume,og}.

══ 8 · WORLD MAP (page order · ids · colors) ══
#boot      overlay (client-only)
#title     World 0 · TITLE SCREEN · Hero ............................ rainbow
#profile   World 1 · PLAYER PROFILE · About ......................... cyan
#launchpad + #quests   World 2 · QUEST LOG · Experience ............. lime
#lab       World 3 · THE LAB · Research & Publications .............. violet
#vault     World 4 · CARTRIDGE VAULT · Projects ..................... pink
#arcade    World 5 · BONUS STAGE: THE ARCADE · Mini-games ........... rainbow
#skills    World 6 · SKILL TREE · Skills ............................ yellow
#trophies  World 7 · TROPHY ROOM · Certificates & Achievements ...... orange→gold
#lobby     World 8 · CO-OP LOBBY · Contact .......................... mint
#credits   CREDITS · Footer ......................................... rainbow
Between worlds: LED dot-matrix ticker dividers or pixel-stepped edges in the next world's color.

══ 9 · WORKING AGREEMENT (every part) ══
Before coding: a 5-line plan. After coding: files created/changed, how to test (what to click), the Acceptance list
with ✅/❌, known gaps. Small typed components. If a part is too big for one reply, split it and continue.
Re-read R1–R10 before finishing.

══ 10 · BUDGETS ══
Initial JS (excluding lazy 3D/games) < 250 KB gzip · LCP < 2.5s · CLS < 0.05 · INP < 200ms · Lighthouse: Performance
≥ 85 desktop / ≥ 70 mobile, Accessibility ≥ 95, Best Practices ≥ 95, SEO 100 · WebGL DPR clamp [1, 1.75] ·
max 2 live WebGL contexts · zero console errors.

══ 11 · CONTENT → src/content/content.ts (single source of truth) ══
```ts
// The ONLY place facts live. "TODO" = waiting for Akshat (render as "Coming soon", never raw).

export type Stat = { label: string; value: string };
export type Certificate = {
  id: string; name: string; issuer: string; date: string;
  credentialId?: string; credentialUrl?: string; skills?: string[];
};

export const player = {
  name: "Akshat Sharma",
  handle: "AKSHAT.EXE",
  tagline: "Don't read my résumé. Play it.",
  classes: ["AI/ML Engineer", "GenAI Builder", "Full-Stack Developer", "Research Author", "Bug Exterminator"],
  status: "AI & ML Intern (Generative AI) @ United Airlines",
  email: "akshatsharma.data@gmail.com",
  phone: "[redacted from git — see docs/DECISIONS.md #1]",
  showPhone: false, // off by default (spam); reveal-on-click when true
  links: {
    linkedin: "https://linkedin.com/in/akshatsharma-in",
    github: "https://github.com/akshatsharma-x",
  },
  resumeUrl: "/resume/Akshat_Sharma_Resume.pdf", // TODO: add the PDF to public/resume
  base: "TODO",         // "spawn point" city
  bio: "TODO",          // 2–3 lines; a DRAFT built only from these facts is OK until Akshat sends his own
  availability: "TODO", // roles + start date
  photo: "TODO",
  funFacts: [] as string[], // TODO
};

export const education = {
  school: "Manipal University Jaipur",
  degree: "B.Tech. in Computer Science and Engineering",
  period: "Jul 2023 – Jul 2027",
  cgpa: "8.79/10",
  previous: [
    { name: "XII (CBSE)", score: "95.4%", year: "2022" },
    { name: "X (CBSE)", score: "93.8%", year: "2020" },
  ],
  coursework: ["Design & Analysis of Algorithms", "NLP", "Computer Vision", "Cryptography", "Digital Image Processing"],
};

export const experience = [
  {
    id: "united",
    company: "United Airlines",
    emblem: "UA",
    role: "AI & ML Intern (Generative AI)",
    period: "Jun 2026 – Present",
    current: true,
    mode: "TODO",
    bullets: [
      "Working on LLM Model Monitoring and automation for enterprise-level ML models.",
      "Built Cartographer using LangGraph, GPT-4.1, and Claude Sonnet 4.5, automating generation of 6 documentation artifacts in 2 LLM calls.",
      "Developed a code knowledge graph extracting dependencies, API surfaces, and architectural relationships across large codebases.",
      "Cut inference cost to $0.08–0.11/run via 22–25% token compression and SHA256 caching across 35 eval scenarios.",
    ],
    stats: [
      { label: "Documentation artifacts", value: "6 in 2 LLM calls" },
      { label: "Inference cost", value: "$0.08–0.11/run" },
      { label: "Token compression", value: "22–25%" },
      { label: "Eval scenarios", value: "35" },
    ],
    stack: ["LangGraph", "GPT-4.1", "Claude Sonnet 4.5", "LLM Monitoring", "Knowledge Graphs", "Token Compression", "SHA256 Caching"],
    sideQuest: "token-squeeze",
  },
  {
    id: "ey",
    company: "Ernst & Young (EY)",
    emblem: "EY",
    role: "Software Development Intern",
    period: "Jun 2026 – Jul 2026",
    current: false,
    mode: "Hybrid",
    bullets: [
      "Contributed to a TRAI India engagement under IT Transformation in Government & Public Sector, a regulated environment, building full-stack features using Next.js 16 (App Router), TypeScript, React.js, and Tailwind CSS.",
      "Built a Django REST Framework backend with JWT auth, RESTful APIs, and PostgreSQL; tested end-to-end via Postman.",
      "Worked within an Agile team using Git/GitHub, contributing to code reviews and SDLC-driven iterative delivery.",
    ],
    stats: [
      { label: "Engagement", value: "TRAI India" },
      { label: "Sector", value: "Government & Public Sector" },
    ],
    stack: ["Next.js", "TypeScript", "React", "Tailwind CSS", "Django REST Framework", "JWT", "REST APIs", "PostgreSQL", "Postman", "Git", "GitHub", "Agile"],
    sideQuest: null, // shows a "REGULATED ENV" stamp instead
  },
  {
    id: "truechip",
    company: "Truechip Solutions Pvt. Ltd.",
    emblem: "TC",
    role: "Java Intern",
    period: "Dec 2025 – Jan 2026",
    current: false,
    mode: "TODO",
    bullets: [
      "Contributed to Core Java backend across 10+ modules using OOP and modular design for maintainable components.",
      "Achieved 90%+ test coverage via unit testing and debugging, cutting post-integration defects by ~30%.",
      "Participated in code reviews within SDLC using Git and enterprise coding standards, reducing review turnaround time by ~25%.",
    ],
    stats: [
      { label: "Modules", value: "10+" },
      { label: "Test coverage", value: "90%+" },
      { label: "Post-integration defects", value: "~30% fewer" },
      { label: "Review turnaround time", value: "~25% shorter" },
    ],
    stack: ["Java", "OOP", "Unit Testing", "Debugging", "Git", "SDLC"],
    sideQuest: "bug-whack",
  },
  {
    id: "walkingtree",
    company: "WalkingTree Technologies",
    emblem: "WT",
    role: "Technical Intern",
    period: "Jul 2025 – Aug 2025",
    current: false,
    mode: "TODO",
    bullets: [
      "Contributed to Engazewell, an enterprise Employee Management System supporting 10,000+ records and 2,500+ DAU.",
      "Worked on backend using Java and MongoDB, optimizing data aggregation pipelines for fast retrieval.",
      "Worked with cloud-integrated systems and scalable backend architectures for enterprise-level applications.",
      "Built responsive UI with React and created Power BI dashboards for workforce analytics, validated via manual testing.", // CONFIRM: one résumé says A/B testing
    ],
    stats: [
      { label: "Records", value: "10,000+" },
      { label: "Daily active users", value: "2,500+" },
    ],
    stack: ["Java", "MongoDB", "React", "Power BI"],
    sideQuest: "pipeline",
  },
];

export const projects = [
  {
    id: "cognivault",
    title: "Cognivault AI",
    subtitle: "Multi-Agent Research Assistant",
    genre: "Multi-Agent RAG",
    category: "ai",
    bullets: [
      "Built a multi-agent RAG system with A2A communication using FastAPI, LangChain, and Gemini 1.5, enabling automated summarization.",
      "Engineered FAISS + HyDE retrieval and a custom orchestrator for intent-based routing of automatable sub-tasks.",
      "Integrated multimodal AI (Gemini Vision) to extract structured data from PDFs.",
      "Developed a scalable system with FastAPI, PostgreSQL, Next.js, and Docker, with evaluation using Ragas.",
    ],
    stats: [] as { label: string; value: string }[],
    stack: ["FastAPI", "LangChain", "Gemini 1.5", "Gemini Vision", "A2A", "RAG", "FAISS", "HyDE", "PostgreSQL", "Next.js", "Docker", "Ragas"],
    links: { demo: "TODO", repo: "TODO" },
    media: "TODO",
    sideQuest: "rag-catcher",
  },
  {
    id: "quizmuj",
    title: "QuizMUJ",
    subtitle: "Real-Time Learning Management System",
    genre: "Real-Time Full-Stack",
    category: "fullstack",
    bullets: [
      "Developed a full-stack, role-based examination platform using Node.js, Express, MongoDB, and Tailwind CSS.",
      "Architected a real-time Live Exam Room using Socket.io, enabling proctoring features such as browser tab-switch tracking.",
      "Containerized the app using Docker and built admin tools including CSV bulk uploads and an analytics API for result export.",
      "Ensured scalability, data integrity, and secure session handling through backend design and system architecture.",
    ],
    stats: [],
    stack: ["Node.js", "Express.js", "MongoDB", "Tailwind CSS", "Socket.io", "Docker"],
    links: { demo: "TODO", repo: "TODO" },
    media: "TODO",
    sideQuest: "tab-switch-egg",
  },
  {
    id: "resume-screener",
    title: "Automated Resume Screening",
    subtitle: "& Candidate Classification Pipeline",
    genre: "NLP + Explainable AI",
    category: "ai",
    bullets: [
      "Built an NLP-based screening system using Python, Streamlit, and Transformers for automated classification and data extraction.",
      "Developed a hybrid model (TF-IDF + BERT) and optimized a weighted ensemble to improve candidate matching.",
      "Designed a robust NLP pipeline and XAI dashboard with PCA visualizations for interpretability.",
    ],
    stats: [],
    stack: ["Python", "Streamlit", "Transformers", "BERT", "TF-IDF", "XAI", "PCA"],
    links: { demo: "TODO", repo: "TODO" },
    media: "TODO",
    sideQuest: "jd-scanner",
  },
  {
    id: "churn",
    title: "Predictive Customer Churn Analysis",
    subtitle: "Stacking-Ensemble ML Pipeline",
    genre: "ML / Deep Learning",
    category: "ai",
    bullets: [
      "Built an ML pipeline to predict customer churn and inform retention strategy, using a stacking ensemble to achieve 97% accuracy and 0.98 ROC-AUC.",
      "Applied SMOTE, KerasTuner, and TensorFlow for optimized model performance.",
      "Performed feature importance analysis to identify churn drivers and enable actionable insights.",
    ],
    stats: [
      { label: "Accuracy", value: "97%" },
      { label: "ROC-AUC", value: "0.98" },
    ],
    stack: ["TensorFlow", "KerasTuner", "SMOTE", "Stacking Ensemble", "Feature Importance"],
    links: { demo: "TODO", repo: "TODO" },
    media: "TODO",
    sideQuest: "gradient-descent",
  },
  {
    id: "a11y-analyzer",
    title: "Web Accessibility Analyzer",
    subtitle: "WCAG Compliance Tool",
    genre: "Developer Tool",
    category: "tools",
    bullets: [
      "Developed a WCAG 2.1-compliant web app with a headless DOM crawler to detect accessibility issues including alt text, ARIA, and navigation.",
      "Built a rule-based analyzer with accessibility scoring, fix suggestions, and reports.",
    ],
    stats: [],
    stack: ["WCAG 2.1", "Headless DOM Crawler", "Rule-based Analyzer"], // TODO: real tech stack
    links: { demo: "TODO", repo: "TODO" },
    media: "TODO",
    sideQuest: "a11y-scan",
  },
];

export const research = [
  {
    id: "cold-chain",
    title: "An Interpretable Artificial Intelligence Framework for Food Waste Prediction and Prevention in Cold-Chain Logistics",
    venue: "SCI-2026 — International Conference-SCI (Springer LNNS)",
    host: "Swinburne Vietnam, Hanoi, Vietnam",
    dates: "April 28–29, 2026",
    status: "Presented", // TODO: switch to "Published" + DOI once the LNNS volume is out
    boss: { name: "The Spoilage Specter", domain: "Cold-Chain Logistics", weapon: "Interpretable AI" },
    keywords: ["Interpretable AI", "Food Waste", "Cold-Chain Logistics"],
    abstract: "TODO",
    links: { paper: "TODO", doi: "TODO" },
    bibtex: "TODO",
  },
  {
    id: "pm25",
    title: "Short-Term PM2.5 Forecasting Using ML for Sustainable Urban Air Quality",
    venue: "SCI-2026 (Springer LNNS)",
    host: "TODO", // confirm: same conference (Hanoi)?
    dates: "TODO",
    status: "Presented",
    boss: { name: "The Smog Golem", domain: "Urban Air Quality", weapon: "ML Forecasting" },
    keywords: ["PM2.5", "Forecasting", "Sustainability"],
    abstract: "TODO",
    links: { paper: "TODO", doi: "TODO" },
    bibtex: "TODO",
  },
];

export const honors = [
  { id: "sih", title: "Smart India Hackathon — Qualifier", year: "2024 & 2025", org: "Smart India Hackathon (college level)", detail: "Ranked among the top 50 teams selected from over 300.", trophy: "cup" },
  { id: "deans-list", title: "Dean's List for Academic Excellence", year: "2024", org: "Manipal University", detail: "", trophy: "medal" },
  { id: "excellence", title: "Student Excellence Award", year: "2026", org: "Manipal University", detail: "", trophy: "star" },
  { id: "sci-2026", title: "2 papers presented at SCI-2026", year: "2026", org: "Springer LNNS", detail: "International Conference-SCI · Swinburne Vietnam, Hanoi", trophy: "scroll" },
];

export const certificates: Certificate[] = []; // TODO: Akshat will send the list

export const skills = {
  weapons: { label: "Languages", items: ["C/C++", "Java", "Python", "TypeScript", "JavaScript", "SQL", "Kotlin", "HTML5", "CSS"] },
  spells: { label: "AI/ML & Data", items: ["Machine Learning", "Deep Learning", "GenAI", "RAG", "LLMs", "Multimodal AI", "Prompt Engineering", "A2A", "LangGraph", "LangChain", "FAISS", "HyDE", "Ragas", "Transformers", "BERT", "TensorFlow", "KerasTuner", "Model Fine-Tuning", "Pandas", "NumPy", "PySpark", "EDA", "ETL", "Advanced Excel (Pivot Tables, VLOOKUP, Dashboards)"] },
  gear: { label: "Frameworks & Backend", items: ["React", "Next.js", "Node.js", "Express.js", "Django", "Django REST Framework", "FastAPI", "Streamlit", "Socket.io", "Tailwind CSS", "REST APIs", "Android (Kotlin)"] },
  gadgets: { label: "Tools & Platforms", items: ["Docker", "Git", "GitHub", "PostgreSQL", "MongoDB", "Oracle Database", "Power BI", "Postman", "AWS Secrets Manager", "Android Studio", "Linux", "Windows"] },
  runes: { label: "Core CS & SE", items: ["DSA", "Operating Systems", "Relational DBMS", "OOP", "Computer Networks", "SDLC", "Agile", "Unit Testing", "Debugging", "JWT"] },
  signature: [] as string[], // TODO: Akshat picks 5–8 for holo-foil (e.g. Python, LangGraph, RAG, Next.js, Java, FastAPI)
};
```
Computed everywhere, never hard-coded: number of internships, projects, papers, skills and honors.
"Used in" evidence for skills is computed from experience[].stack + projects[].stack (PART 13).
````
