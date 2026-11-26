// The ONLY place facts live. "TODO" = waiting for Akshat (render as "Coming soon", never raw).
// Validated at build time by ./schema.ts (zod, server-only). Counts are computed in ./derived.ts — never hard-code them.

/* ───────────────────────────── Types ───────────────────────────── */

/** Placeholder for a fact we don't have yet. Rendered as "Coming soon", never shown raw (R1). */
export type Todo = "TODO";

export type Stat = { label: string; value: string };
export type Certificate = {
  id: string; name: string; issuer: string; date: string;
  credentialId?: string; credentialUrl?: string; skills?: string[];
};

/** Ids of résumé-twin mini-games / eggs (built in later parts). */
export type SideQuestId =
  | "token-squeeze"
  | "bug-whack"
  | "pipeline"
  | "rag-catcher"
  | "tab-switch-egg"
  | "jd-scanner"
  | "gradient-descent"
  | "a11y-scan";

export type Player = {
  name: string;
  handle: string;
  tagline: string;
  classes: string[];
  status: string;
  email: string;
  phone: string;
  showPhone: boolean;
  links: { linkedin: string; github: string };
  resumeUrl: string;
  base: string;
  bio: string;
  availability: string;
  photo: string;
  funFacts: string[];
  /** Optional: research interests, shown as chips in The Lab (PART 9) only while the list has entries. */
  researchInterests: string[];
};

export type PreviousSchool = { name: string; score: string; year: string };

export type Education = {
  school: string;
  degree: string;
  period: string;
  cgpa: string;
  previous: PreviousSchool[];
  coursework: string[];
};

export type Experience = {
  id: string;
  company: string;
  /** Text for the original pixel-monogram "guild emblem" (no official logos — R4). */
  emblem: string;
  role: string;
  period: string;
  current: boolean;
  mode: string;
  bullets: string[];
  stats: Stat[];
  stack: string[];
  sideQuest: SideQuestId | null;
};

export type ProjectCategory = "ai" | "fullstack" | "tools";

export type Project = {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  category: ProjectCategory;
  bullets: string[];
  stats: Stat[];
  stack: string[];
  links: { demo: string; repo: string };
  media: string;
  sideQuest: SideQuestId | null;
};

export type ResearchStatus = "Presented" | "Published";
export type Boss = { name: string; domain: string; weapon: string };

export type Research = {
  id: string;
  title: string;
  venue: string;
  host: string;
  dates: string;
  status: ResearchStatus;
  boss: Boss;
  keywords: string[];
  abstract: string;
  links: { paper: string; doi: string };
  bibtex: string;
};

export type TrophyKind = "cup" | "medal" | "star" | "scroll";

export type Honor = {
  id: string;
  title: string;
  year: string;
  org: string;
  detail: string;
  trophy: TrophyKind;
};

/** Bible §3 item types: Weapons = Languages · Spells = AI/ML & Data · Gear = Frameworks & Backend ·
 *  Gadgets = Tools & Platforms · Runes = Core CS & SE. */
export type ItemType = "weapons" | "spells" | "gear" | "gadgets" | "runes";
export type SkillCategory = { label: string; items: string[] };
export type Skills = Record<ItemType, SkillCategory> & { signature: string[] };

/* ───────────────────────────── Facts ───────────────────────────── */

export const player: Player = {
  name: "Akshat Sharma",
  handle: "AKSHAT.EXE",
  tagline: "Don't read my résumé. Play it.",
  classes: ["AI/ML Engineer", "GenAI Builder", "Full-Stack Developer", "Research Author", "Bug Exterminator"],
  status: "Associate Analyst – Clinical and Digital Innovation and Applications (Intern) @ Merck Group",
  email: "akshatsharma.data@gmail.com",
  phone: "", // kept out of git while showPhone is false (docs/DECISIONS.md #1) — paste the number here if you flip showPhone
  showPhone: false, // off by default (spam); reveal-on-click when true
  links: {
    linkedin: "https://linkedin.com/in/akshatsharma-in",
    github: "https://github.com/akshatsharma-x",
  },
  resumeUrl: "/resume/Akshat_Sharma_Resume.pdf", // TODO: add the PDF to public/resume
  base: "TODO",         // "spawn point" city
  bio: "TODO",          // 2–3 lines; a DRAFT built only from these facts is OK until Akshat sends his own
  availability: "TODO", // roles + start date
  photo: "/img/me-960.webp", // from assets/images/me.jpg (`npm run images`)
  funFacts: [], // TODO
  researchInterests: [], // TODO (optional): chips in The Lab — hidden while empty
};

export const education: Education = {
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

export const experience: Experience[] = [
  {
    id: "merck",
    company: "Merck Group",
    emblem: "MG",
    role: "Associate Analyst – Clinical and Digital Innovation and Applications (Intern)",
    period: "Dec 2026 – Present",
    current: true,
    mode: "TODO",
    bullets: [], // TODO: what the role involves, once Akshat sends it
    stats: [],
    stack: [],
    sideQuest: null,
  },
  {
    id: "united",
    company: "United Airlines",
    emblem: "UA",
    role: "AI & ML Intern (Generative AI)",
    period: "Jun 2026 – Nov 2026",
    current: false,
    mode: "TODO",
    bullets: [
      "Worked on LLM Model Monitoring and automation for enterprise-level ML models.",
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

export const projects: Project[] = [
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
    stats: [],
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
      "Developed a full-stack, role-based examination platform using Node.js, Express and MongoDB, with an HTML, CSS and JavaScript front end.",
      "Architected a real-time Live Exam Room using Socket.io, enabling proctoring features such as browser tab-switch tracking.",
      "Containerized the app using Docker and built admin tools including CSV bulk uploads and an analytics API for result export.",
      "Ensured scalability, data integrity, and secure session handling through backend design and system architecture.",
      "Focus-mode exams with a server-controlled timer and autosave to the server and the device, so a reload, crash or device switch resumes the attempt.",
      "Tab switches, leaving the window, exiting full screen, copy attempts and disconnects stream live to faculty; more than 3 violations flags the attempt.",
      "Sign-up takes only university email addresses, verified by one-time codes; sockets use the same JWT auth as the REST API.",
    ],
    stats: [],
    stack: ["HTML5", "CSS", "JavaScript", "Node.js", "Express.js", "MongoDB", "Socket.io", "Nodemailer", "JWT", "Docker"],
    links: { demo: "TODO", repo: "https://github.com/akshatsharma-x/Quiz-App" },
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
      "Ranks resumes against a job description with a hybrid TF-IDF + Sentence-BERT score, shows which skills drive each score, and benchmarks candidates against 2,361 historical resumes.",
      "Batch-screens PDF, DOCX and TXT resumes into a ranked leaderboard with CSV export; a calibrated SVM predicts each resume's domain out of 24.",
    ],
    stats: [
      { label: "Category accuracy (hybrid)", value: "0.786" },
      { label: "Category accuracy (TF-IDF alone)", value: "0.704" },
      { label: "Ranking ROC-AUC", value: "0.892" },
      { label: "MRR", value: "0.832" },
      { label: "nDCG@10", value: "0.666" },
    ],
    stack: ["Python", "Streamlit", "Transformers", "BERT", "Sentence-BERT", "TF-IDF", "LinearSVC", "XAI", "PCA", "NLTK", "Plotly"],
    links: { demo: "TODO", repo: "https://github.com/akshatsharma-x/cv-scan" },
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
    links: { demo: "TODO", repo: "https://github.com/akshatsharma-x/customer-churn-prediction" },
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
  {
    id: "nexus",
    title: "NEXUS",
    subtitle: "Personalized Learning for Career Transitions",
    genre: "Adaptive Learning Platform",
    category: "fullstack",
    bullets: [
      "A personalized learning platform for career transitions: conversational onboarding, an adaptive learning path, a 3D skill map, assessments and an offline tutor.",
      "Onboarding is a conversation: it extracts the target role, timeline, experience and skills, and shows the profile it's building as you talk.",
      "A staged journey of skills, resources, projects and assessments; steps unlock as their prerequisites complete, and assessment results are written back into per-skill mastery.",
      "The Skill Universe draws every skill as a 3D knowledge map, coloured by mastery.",
      "The tutor answers from the learner's own progress and runs fully offline by default (Claude is optional); there are no accounts, and all data stays in the browser.",
    ],
    stats: [],
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Three.js", "React Three Fiber", "Anthropic SDK"],
    links: { demo: "https://nexus-opal-phi-60.vercel.app", repo: "https://github.com/akshatsharma-x/nexus" },
    media: "TODO",
    sideQuest: null,
  },
  {
    id: "researchx",
    title: "ResearchX",
    subtitle: "Autonomous Multi-Agent Research Platform",
    genre: "Multi-Agent Research",
    category: "ai",
    bullets: [
      "An autonomous multi-agent research platform: a LangGraph pipeline of 17 agents plans the research, searches the web, academic sources and news in parallel, fact-checks claims against the evidence, hunts for counter-evidence, and writes a report in which every citation points to a real, numbered source.",
      "Two budgeted feedback loops: a replanner adds searches for unanswered sub-questions, and a critic and a citation verifier send weak drafts back for revision.",
      "Durable jobs: the graph's state is checkpointed to PostgreSQL after every step, so a job whose worker dies resumes where it stopped.",
      "Grounded citations: the reference list is generated from the source data, not by the model, and a citation can only point to a source that exists.",
      "Bounded cost: the research workers make no LLM calls, a run takes about 13 Gemini calls, and the public API has per-IP and daily job limits.",
      "Forked from Adyashas/ResearchX; wired up the full research pipeline and made the app deployable.",
    ],
    stats: [
      { label: "Agents", value: "17" },
      { label: "Gemini calls per run", value: "~13" },
    ],
    stack: ["LangGraph", "LangChain", "Gemini", "Tavily", "FastAPI", "Celery", "Redis", "PostgreSQL", "Alembic", "Next.js", "React", "Tailwind CSS"],
    links: { demo: "TODO", repo: "https://github.com/akshatsharma-x/ResearchX" },
    media: "TODO",
    sideQuest: null,
  },
  {
    id: "bbc-news-retrieval",
    title: "BBC News Retrieval",
    subtitle: "Lexical, Semantic & Hybrid News Search",
    genre: "Information Retrieval",
    category: "ai",
    bullets: [
      "Lexical, semantic and hybrid search over the BBC News archive, with a purpose-built test collection, a full evaluation and a news-desk search interface — an Information Retrieval course project.",
      "Four rankers over one inverted index: TF-IDF, BM25, a Sentence Transformer (best-passage cosine), and a hybrid that fuses BM25 and the Sentence Transformer by Reciprocal Rank Fusion.",
      "A TREC-style test collection built from scratch: 25 topics, 12 of them deliberately paraphrased, with 957 graded relevance judgments.",
      "The live app runs entirely in the browser: a JavaScript port of the engine, with the encoder as a half-precision ONNX model through transformers.js — it matches the Python engine (TF-IDF and BM25 exactly, the neural models' MAP to 3 decimals).",
      "On 2,066 known-item queries the hybrid leads every other model (p < 0.001), at about 4 ms per hybrid query.",
    ],
    stats: [
      { label: "Hybrid MAP", value: "0.811" },
      { label: "Recall@100", value: "0.992" },
      { label: "Known-item MRR (hybrid)", value: "0.812" },
      { label: "Per hybrid query", value: "~4 ms" },
    ],
    stack: ["Python", "Sentence Transformers", "BM25", "TF-IDF", "NLTK", "Streamlit", "Altair", "transformers.js", "ONNX"],
    links: { demo: "https://akshatsharma-x.github.io/BBC-News-Retrieval/app/", repo: "https://github.com/akshatsharma-x/BBC-News-Retrieval" },
    media: "TODO",
    sideQuest: null,
  },
  {
    id: "vistara",
    title: "Vistara",
    subtitle: "Credit Scoring from Life's Rhythms",
    genre: "Fintech Prototype",
    category: "fullstack",
    bullets: [
      "Credit scoring for thin-file applicants that reads only the timing of recurring life events (vehicle service, UPI mandates, utility bills, phone recharges, FASTag), never amounts — a prototype built for the TVS Credit hackathon on synthetic data.",
      "Five signals, each with an expected cadence and a weight, each scored on how steady its gaps are; coherence across signals carries 25% of the score, so being evenly consistent beats excelling at one habit.",
      "The result is a 300–900 score with a tier, a loan offer, a recommended EMI date and a dated path to the next tier; thin files get a rhythm-building path instead.",
      "A loan officer's queue ranks the twelve sample applicants; the engine is plain, seeded TypeScript with no ML library, so the same input always gives the same score.",
    ],
    stats: [
      { label: "Score range", value: "300–900" },
      { label: "Signals", value: "5" },
      { label: "Coherence weight", value: "25%" },
    ],
    stack: ["Next.js", "TypeScript"],
    links: { demo: "https://vistara-delta-fawn.vercel.app", repo: "https://github.com/akshatsharma-x/Vistara" },
    media: "TODO",
    sideQuest: null,
  },
  {
    id: "cabinmuj",
    title: "CabinMUJ",
    subtitle: "Faculty Cabin Finder",
    genre: "Campus Directory",
    category: "fullstack",
    bullets: [
      "Find any Manipal University Jaipur faculty member, and their block, floor and cabin, in seconds; students search and browse, and an admin maintains the data.",
      "Live search shows block, floor and cabin as you type; a directory filters by department, block, floor, designation or HoD; a campus map goes block by block and floor by floor.",
      "Students report outdated locations; the admin panel tracks verification, resolves those reports, keeps a full change history with restore, and backs up all data as JSON.",
      "The seed data's cabin locations start as unverified until they're checked.",
    ],
    stats: [],
    stack: ["Next.js", "TypeScript", "Upstash Redis", "Vercel", "Python"],
    links: { demo: "https://cabin-muj.vercel.app", repo: "https://github.com/akshatsharma-x/CabinMUJ" },
    media: "TODO",
    sideQuest: null,
  },
  {
    id: "myhub",
    title: "MyHUB",
    subtitle: "Your Life, In Receipts",
    genre: "Data Storytelling",
    category: "fullstack",
    bullets: [
      "Three public datasets (162,588 rows) read as one person's decade: 2,411 receipts in nine kinds, the connections between them, and a story about what they add up to; none of the rows is Akshat's, and the app says so on its sources page.",
      "Eight routes: searchable receipts, 120 threads with the reason printed on every link, a constellation of 131 entities, six eras, rhythms with 14 findings, a ten-beat story, and the sources.",
      "A deterministic build-time ETL, and no server or runtime network calls at all: every page is static, on GitHub Pages.",
      "A verification suite drives the production build in headless Chrome across 8 pages × 4 widths × 2 themes, checking overflow, an 11px type floor, keyboard paths, WCAG contrast and layout shift.",
    ],
    stats: [
      { label: "Rows", value: "162,588" },
      { label: "Receipts", value: "2,411" },
      { label: "Threads", value: "120" },
    ],
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "GitHub Pages"],
    links: { demo: "https://akshatsharma-x.github.io/MyHub/", repo: "https://github.com/akshatsharma-x/MyHub" },
    media: "TODO",
    sideQuest: null,
  },
];

export const research: Research[] = [
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

export const honors: Honor[] = [
  { id: "sih", title: "Smart India Hackathon — Qualifier", year: "2024 & 2025", org: "Smart India Hackathon (college level)", detail: "Ranked among the top 50 teams selected from over 300.", trophy: "cup" },
  { id: "deans-list", title: "Dean's List for Academic Excellence", year: "2024", org: "Manipal University", detail: "", trophy: "medal" },
  { id: "excellence", title: "Student Excellence Award", year: "2026", org: "Manipal University", detail: "", trophy: "star" },
  { id: "sci-2026", title: "2 papers presented at SCI-2026", year: "2026", org: "Springer LNNS", detail: "International Conference-SCI · Swinburne Vietnam, Hanoi", trophy: "scroll" },
];

/** Every "Show credential" on LinkedIn opens the certifications page (it asks for a sign-in). */
const CERTS_URL = "https://www.linkedin.com/in/akshatsharma-in/details/certifications/";

export const certificates: Certificate[] = [
  // from LinkedIn (2026-11-25), in LinkedIn's order; dates as LinkedIn shows them (month only; "TODO" where it shows none).
  // Smart India Hackathon (Internal Round) is already an honor, so it isn't repeated here.
  { id: "claude-code-in-action", name: "Claude Code in Action", issuer: "Anthropic", date: "Jul 2026", credentialId: "A3WZHUFAVB2T", credentialUrl: CERTS_URL, skills: ["Claude Code"] },
  { id: "rh134", name: "Red Hat System Administration II (RH134 - RHA) - Ver. 9.3", issuer: "Red Hat", date: "Mar 2025", credentialUrl: CERTS_URL },
  { id: "rh124", name: "Red Hat System Administration I (RH124 - RHA) - Ver. 9.3", issuer: "Red Hat", date: "Mar 2025", credentialUrl: CERTS_URL },
  { id: "ibm-containers", name: "Introduction to Containers w/ Docker, Kubernetes & OpenShift", issuer: "IBM", date: "Mar 2026", credentialId: "Z8JB88YRGJCV", credentialUrl: CERTS_URL },
  { id: "devops-git", name: "Introduction to DevOps and Git for Beginners", issuer: "Simplilearn", date: "Mar 2026", credentialId: "EO663YJ19PUX", credentialUrl: CERTS_URL },
  { id: "aws-cloud-practitioner", name: "AWS Cloud Practitioner Essentials", issuer: "Amazon Web Services (AWS)", date: "Jul 2026", credentialId: "CO9GMSYMB8XC", credentialUrl: CERTS_URL, skills: ["Amazon Web Services (AWS)"] },
  { id: "cisco-network-fundamentals", name: "Network Fundamentals", issuer: "Cisco", date: "TODO", credentialId: "UOTYMANQCF0A", credentialUrl: CERTS_URL },
  { id: "data-analytics-workshop", name: "Data Analytics Workshop", issuer: "Coding Ninjas 10X Club", date: "TODO", credentialUrl: CERTS_URL, skills: ["Data Analysis", "Microsoft Power BI"] },
  { id: "ibm-java", name: "Java Programming for Beginners", issuer: "IBM", date: "Jul 2025", credentialUrl: CERTS_URL, skills: ["Java", "Object-Oriented Programming (OOP)"] },
  { id: "oracle-database-design", name: "Database Design", issuer: "Oracle", date: "Nov 2024", credentialUrl: CERTS_URL, skills: ["Oracle Database", "Database Design"] },
  { id: "oracle-sql", name: "Database Programming with SQL", issuer: "Oracle", date: "Nov 2024", credentialUrl: CERTS_URL, skills: ["Oracle Database", "SQL"] },
  { id: "codechef-dsa-lab", name: "Data Structures & Algorithms lab", issuer: "CodeChef", date: "Nov 2024", credentialId: "6d3d989", credentialUrl: CERTS_URL, skills: ["Data Structures", "C (Programming Language)"] },
  { id: "gfg-oop-java", name: "Object Oriented Programming Using JAVA", issuer: "GeeksforGeeks", date: "TODO", credentialUrl: CERTS_URL, skills: ["Java", "Object-Oriented Programming (OOP)"] },
  { id: "nptel-daa", name: "Design and analysis of algorithms", issuer: "NPTEL", date: "Apr 2025", credentialUrl: CERTS_URL, skills: ["Data Structures", "Algorithm Design"] },
  { id: "nptel-dsa-java", name: "Data Structures and Algorithms using Java", issuer: "NPTEL", date: "Nov 2024", credentialUrl: CERTS_URL, skills: ["Data Structures", "Java"] },
];

export const skills: Skills = {
  weapons: { label: "Languages", items: ["C/C++", "Java", "Python", "TypeScript", "JavaScript", "SQL", "Kotlin", "HTML5", "CSS"] },
  spells: { label: "AI/ML & Data", items: ["Machine Learning", "Deep Learning", "GenAI", "RAG", "LLMs", "Multimodal AI", "Prompt Engineering", "A2A", "LangGraph", "LangChain", "FAISS", "HyDE", "Ragas", "Transformers", "BERT", "TensorFlow", "KerasTuner", "Model Fine-Tuning", "Pandas", "NumPy", "PySpark", "EDA", "ETL", "Advanced Excel (Pivot Tables, VLOOKUP, Dashboards)"] },
  gear: { label: "Frameworks & Backend", items: ["React", "Next.js", "Node.js", "Express.js", "Django", "Django REST Framework", "FastAPI", "Streamlit", "Socket.io", "Tailwind CSS", "REST APIs", "Android (Kotlin)"] },
  gadgets: { label: "Tools & Platforms", items: ["Docker", "Git", "GitHub", "PostgreSQL", "MongoDB", "Oracle Database", "Power BI", "Postman", "AWS Secrets Manager", "Android Studio", "Linux", "Windows"] },
  runes: { label: "Core CS & SE", items: ["DSA", "Operating Systems", "Relational DBMS", "OOP", "Computer Networks", "SDLC", "Agile", "Unit Testing", "Debugging", "JWT"] },
  signature: [], // TODO: Akshat picks 5–8 for holo-foil (e.g. Python, LangGraph, RAG, Next.js, Java, FastAPI)
};

/* ───────────────────────── Recruiter Speedrun Mode ───────────────────────── */

/** A pointer to an existing fact above — never a copy (R1). Resolved in derived.ts; schema.ts fails the build if one breaks. */
export type HighlightRef =
  | { from: "experience"; id: string; stat: string }
  | { from: "project"; id: string; stat: string }
  | { from: "honor"; id: string };

/** Which existing facts lead the Speedrun Summary (curation only). One tile per entry; 2 refs share a tile. */
export const speedrun: { highlights: { refs: HighlightRef[] }[] } = {
  highlights: [
    { refs: [{ from: "experience", id: "united", stat: "Inference cost" }] },
    { refs: [{ from: "experience", id: "truechip", stat: "Test coverage" }] },
    { refs: [{ from: "project", id: "churn", stat: "Accuracy" }, { from: "project", id: "churn", stat: "ROC-AUC" }] },
    { refs: [{ from: "honor", id: "sci-2026" }] },
  ],
};
