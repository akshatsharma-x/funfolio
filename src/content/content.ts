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
  status: "AI & ML Intern (Generative AI) @ United Airlines",
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
  photo: "TODO",
  funFacts: [], // TODO
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

export const certificates: Certificate[] = []; // TODO: Akshat will send the list

export const skills: Skills = {
  weapons: { label: "Languages", items: ["C/C++", "Java", "Python", "TypeScript", "JavaScript", "SQL", "Kotlin", "HTML5", "CSS"] },
  spells: { label: "AI/ML & Data", items: ["Machine Learning", "Deep Learning", "GenAI", "RAG", "LLMs", "Multimodal AI", "Prompt Engineering", "A2A", "LangGraph", "LangChain", "FAISS", "HyDE", "Ragas", "Transformers", "BERT", "TensorFlow", "KerasTuner", "Model Fine-Tuning", "Pandas", "NumPy", "PySpark", "EDA", "ETL", "Advanced Excel (Pivot Tables, VLOOKUP, Dashboards)"] },
  gear: { label: "Frameworks & Backend", items: ["React", "Next.js", "Node.js", "Express.js", "Django", "Django REST Framework", "FastAPI", "Streamlit", "Socket.io", "Tailwind CSS", "REST APIs", "Android (Kotlin)"] },
  gadgets: { label: "Tools & Platforms", items: ["Docker", "Git", "GitHub", "PostgreSQL", "MongoDB", "Oracle Database", "Power BI", "Postman", "AWS Secrets Manager", "Android Studio", "Linux", "Windows"] },
  runes: { label: "Core CS & SE", items: ["DSA", "Operating Systems", "Relational DBMS", "OOP", "Computer Networks", "SDLC", "Agile", "Unit Testing", "Debugging", "JWT"] },
  signature: [], // TODO: Akshat picks 5–8 for holo-foil (e.g. Python, LangGraph, RAG, Next.js, Java, FastAPI)
};
