// The Skill Tree's vocabulary (PART 13): aliases, matching, the in-browser JD scan and the inventory search.
// Pure and client-safe: no content.ts import. The server builds the canonical index from content.skills
// (src/content/skills.ts) and schema.ts checks every alias against it — an alias can only point at a real skill (R1).
// Nothing here is a fact about Akshat: aliases are synonyms, the vocabulary is a list of common tech words.

/** How a term relates to its target. 0 = the skill's own name · 1 = another way to write it (react.js, ml) · 2 = a
 *  neighbour that implies it (claude → LLMs, containers → Docker): a job description naming it earns a "bonus perk". */
export type TermKind = 0 | 1 | 2;

/** Term syntax (lower-case words unless marked): "rest api" — words, any case · "=React" — only with that exact
 *  capitalisation (the framework, not the verb) · "gpt*" — a family: any word that starts with it (GPT-4.1, GPT-4o). */
export type AliasEntry = {
  same?: readonly string[];
  related?: readonly string[];
  /** Stack items only — too ambiguous in free text ("next", "node"). */
  loose?: readonly string[];
  /** The skill's own name matches free text only with its exact capitalisation ("React", "Windows", "Excel"). */
  exactCase?: boolean;
};

/** Canonical skill (as written in content.skills) → aliases. Keys must exist in content (schema.ts). */
export const ALIASES: Readonly<Record<string, AliasEntry>> = {
  // ── Weapons · Languages
  "C/C++": { same: ["c++", "cpp", "c and c++", "c or c++", "c programming", "c language"] },
  Java: { same: ["core java", "java se", "java ee", "j2ee"] },
  Python: { same: ["python3", "python 3"] },
  TypeScript: { same: ["ts"] },
  JavaScript: { same: ["js", "es6", "ecmascript", "es2015", "vanilla js", "vanilla javascript"] },
  SQL: { same: ["structured query language"], related: ["mysql", "sqlite", "sql server", "mssql", "t sql", "tsql"] },
  HTML5: { same: ["html", "html 5"] },
  CSS: { same: ["css3", "css 3"], related: ["sass", "scss"] },
  // ── Spells · AI/ML & Data
  "Machine Learning": { same: ["ml", "machine learning models"], related: ["predictive modeling", "predictive modelling"] },
  "Deep Learning": { same: ["dl", "neural networks", "neural network", "neural nets", "deep neural networks"], related: ["cnn", "cnns", "rnn", "rnns", "lstm", "lstms"] },
  GenAI: { same: ["gen ai", "generative ai", "generative artificial intelligence"] },
  RAG: { same: ["retrieval augmented generation", "retrieval augmented"] },
  LLMs: {
    same: ["llm", "large language model", "large language models"],
    related: ["llm*", "gpt*", "chatgpt", "claude*", "gemini*", "llama*", "mistral*", "openai*"],
  },
  "Multimodal AI": { same: ["multimodal", "multi modal", "multimodal models"], related: ["vision language model", "vision language models", "vlm", "vlms", "gemini vision"] },
  "Prompt Engineering": { same: ["prompting", "prompt design", "prompt engineer"] },
  A2A: { same: ["agent to agent", "agent2agent"], related: ["multi agent", "multi agent systems", "multiagent"] },
  LangGraph: { same: ["lang graph"], related: ["agentic", "agentic workflows", "ai agents"] },
  LangChain: { same: ["lang chain"] },
  FAISS: { related: ["vector database", "vector databases", "vector db", "vector dbs", "vector search", "vector store", "vector stores", "similarity search"] },
  HyDE: { same: ["hypothetical document embeddings", "hypothetical document embedding"] },
  Ragas: { related: ["rag evaluation", "llm evaluation", "llm evals"] },
  Transformers: { same: ["transformer", "transformer models", "hugging face transformers"], related: ["hugging face", "huggingface"] },
  BERT: { related: ["roberta", "distilbert"] },
  TensorFlow: { related: ["keras"] },
  KerasTuner: { same: ["keras tuner"], related: ["hyperparameter tuning", "hyperparameter optimization", "hyperparameter search"] },
  "Model Fine-Tuning": { same: ["fine tuning", "finetuning", "fine tune", "fine tuned", "fine tuning models"], related: ["lora", "qlora", "peft"] },
  PySpark: { related: ["spark", "apache spark"] },
  EDA: { same: ["exploratory data analysis"] },
  ETL: { same: ["elt", "extract transform load"], related: ["data pipelines", "data pipeline"] },
  "Advanced Excel (Pivot Tables, VLOOKUP, Dashboards)": {
    same: ["=Excel", "advanced excel", "ms excel", "microsoft excel", "pivot tables", "pivot table", "vlookup", "xlookup"],
    related: ["spreadsheets"],
  },
  // ── Gear · Frameworks & Backend
  React: { exactCase: true, same: ["reactjs", "react js"] },
  "Next.js": { same: ["next js"], loose: ["next"] },
  "Node.js": { same: ["node js", "=Node"], loose: ["node"] },
  "Express.js": { same: ["express js", "=Express"] },
  Django: { same: ["django*"] },
  "Django REST Framework": { same: ["drf", "django rest"] },
  FastAPI: { same: ["fast api"] },
  "Socket.io": { same: ["socket io"], related: ["websockets", "websocket", "web sockets", "web socket"] },
  "Tailwind CSS": { same: ["tailwind", "tailwindcss"] },
  "REST APIs": { same: ["=REST", "rest api", "restful", "restful api", "restful apis", "restful services", "rest services"] },
  "Android (Kotlin)": { same: ["android", "android development", "android apps"] },
  // ── Gadgets · Tools & Platforms
  Docker: { same: ["docker compose", "dockerfile"], related: ["containers", "container", "containerization", "containerisation", "containerized", "containerised"] },
  Git: { related: ["version control"] },
  GitHub: { related: ["gitlab", "bitbucket"] },
  PostgreSQL: { same: ["postgres", "psql", "postgre"] },
  MongoDB: { same: ["mongo", "mongo db"], related: ["nosql", "no sql"] },
  "Oracle Database": { same: ["oracle", "oracle db", "oracle sql"], related: ["pl sql", "plsql"] },
  "Power BI": { same: ["powerbi"], related: ["business intelligence", "bi dashboards", "dax", "data visualization", "data visualisation"] },
  Postman: { related: ["api testing"] },
  "AWS Secrets Manager": { same: ["secrets manager", "aws secrets"], related: ["aws", "amazon web services"] },
  Linux: { related: ["unix", "ubuntu"] },
  Windows: { exactCase: true },
  // ── Runes · Core CS & SE
  DSA: { same: ["data structures", "data structure", "data structures and algorithms", "algorithms", "algorithm"] },
  "Operating Systems": { same: ["operating system", "=OS"] },
  "Relational DBMS": { same: ["rdbms", "dbms", "relational databases", "relational database"] },
  OOP: { same: ["object oriented programming", "object oriented", "object oriented design", "oops"] },
  "Computer Networks": { same: ["computer networking"], related: ["tcp ip", "osi model"] },
  SDLC: { same: ["software development life cycle", "software development lifecycle"] },
  Agile: { same: ["agile methodology", "agile methodologies"], related: ["scrum", "kanban"] },
  "Unit Testing": { same: ["unit tests", "unit test"], related: ["junit", "pytest", "jest", "tdd", "test driven development"] },
  Debugging: { same: ["debug"], related: ["troubleshooting"] },
  JWT: { same: ["json web token", "json web tokens"] },
};

/** Display labels for skills too long for a node or a slot; the full name stays in the accessible name and the card. */
export const SHORT_LABEL: Readonly<Record<string, string>> = {
  "Advanced Excel (Pivot Tables, VLOOKUP, Dashboards)": "Advanced Excel",
};

/** Other spellings of résumé items that aren't Skill Tree entries (coursework, stack items, research keywords — the
 *  server finds those in content.ts; keys must match one, schema.ts checks). They show as "also on the save file". */
export const EXTRA_ALIASES: Readonly<Record<string, readonly string[]>> = {
  NLP: ["natural language processing"],
  "Digital Image Processing": ["image processing"],
  "Knowledge Graphs": ["knowledge graph"],
  "Token Compression": ["prompt compression"],
  "SHA256 Caching": ["caching", "sha256", "sha 256"],
  "TF-IDF": ["tfidf"],
  XAI: ["explainable ai", "explainability", "explainable machine learning"],
  PCA: ["principal component analysis", "dimensionality reduction"],
  SMOTE: ["class imbalance", "imbalanced data", "imbalanced datasets"],
  "Stacking Ensemble": ["ensemble methods", "ensemble learning", "ensemble models", "model stacking", "stacking"],
  "Feature Importance": ["feature importance analysis"],
  "WCAG 2.1": ["wcag", "web accessibility", "accessibility", "a11y"],
  "Headless DOM Crawler": ["web crawler", "web crawling", "web scraping", "headless browser", "crawler"],
  "Rule-based Analyzer": ["rule based"],
  "Interpretable AI": ["interpretability", "interpretable ml", "interpretable machine learning"],
  Forecasting: ["forecast", "forecasts"],
  "PM2.5": ["air quality"],
  "Cold-Chain Logistics": ["cold chain"],
};

/** Common tech words a job description may ask for (tools, platforms, languages) — the "not on the save file yet"
 *  list. Anything here that content.ts mentions anywhere becomes "also on the save file" instead (src/content/skills.ts),
 *  so the scanner never claims something is missing that the résumé shows. Concepts the résumé could imply without
 *  naming (statistics, time series…) are left out on purpose. */
export const VOCAB: Readonly<Record<string, readonly string[]>> = {
  Kubernetes: ["kubernetes", "k8s"],
  PyTorch: ["pytorch", "torch"],
  "scikit-learn": ["scikit learn", "sklearn", "scikit"],
  Azure: ["azure", "microsoft azure"],
  GCP: ["gcp", "google cloud", "google cloud platform"],
  "AWS Lambda": ["aws lambda"],
  SageMaker: ["sagemaker", "amazon sagemaker"],
  "Vertex AI": ["vertex ai", "vertex"],
  Terraform: ["terraform"],
  Ansible: ["ansible"],
  "CI/CD": ["ci cd", "cicd", "continuous integration", "continuous delivery", "continuous deployment"],
  "GitHub Actions": ["github actions"],
  Jenkins: ["jenkins"],
  GraphQL: ["graphql"],
  gRPC: ["grpc"],
  Redis: ["redis"],
  Kafka: ["kafka", "apache kafka"],
  RabbitMQ: ["rabbitmq"],
  Elasticsearch: ["elasticsearch", "elastic search"],
  Cassandra: ["cassandra"],
  DynamoDB: ["dynamodb"],
  Firebase: ["firebase"],
  Supabase: ["supabase"],
  Snowflake: ["snowflake"],
  Databricks: ["databricks"],
  BigQuery: ["bigquery"],
  Redshift: ["redshift"],
  Airflow: ["airflow", "apache airflow"],
  dbt: ["dbt"],
  Hadoop: ["hadoop"],
  Tableau: ["tableau"],
  Looker: ["looker"],
  "Spring Boot": ["spring boot", "springboot", "=Spring"],
  Flask: ["flask"],
  "Ruby on Rails": ["ruby on rails", "rails"],
  Ruby: ["ruby"],
  PHP: ["php"],
  Laravel: ["laravel"],
  Go: ["golang", "=Go"],
  Rust: ["=Rust"],
  Scala: ["scala"],
  "C#": ["csharp"],
  ".NET": ["dotnet"],
  Swift: ["=Swift"],
  Dart: ["=Dart"],
  Flutter: ["flutter"],
  "React Native": ["react native"],
  Angular: ["angular", "angularjs"],
  "Vue.js": ["vue", "vuejs", "vue js"],
  Svelte: ["svelte", "sveltekit"],
  Nuxt: ["nuxt", "nuxtjs"],
  Redux: ["redux"],
  jQuery: ["jquery"],
  Webpack: ["webpack"],
  "Three.js": ["threejs", "three js"],
  D3: ["d3", "d3js"],
  MATLAB: ["matlab"],
  R: ["r programming", "rstudio", "r language"],
  OpenCV: ["opencv"],
  XGBoost: ["xgboost"],
  LightGBM: ["lightgbm"],
  "Reinforcement learning": ["reinforcement learning", "rlhf"],
  MLOps: ["mlops", "ml ops"],
  LLMOps: ["llmops"],
  MLflow: ["mlflow"],
  Kubeflow: ["kubeflow"],
  CUDA: ["cuda"],
  ONNX: ["onnx"],
  LlamaIndex: ["llamaindex", "llama index"],
  Pinecone: ["pinecone"],
  Weaviate: ["weaviate"],
  Milvus: ["milvus"],
  Qdrant: ["qdrant"],
  pgvector: ["pgvector"],
  vLLM: ["vllm"],
  CrewAI: ["crewai"],
  AutoGen: ["autogen"],
  Selenium: ["selenium"],
  Cypress: ["cypress"],
  Playwright: ["playwright"],
  Jira: ["jira"],
  Figma: ["figma"],
  Bash: ["bash", "shell scripting", "bash scripting"],
  Microservices: ["microservices", "microservice"],
  Serverless: ["serverless"],
  "Cloud computing": ["cloud computing", "cloud"],
  OWASP: ["owasp"],
};

// ── tokens ────────────────────────────────────────────────────────────────────────────────────────────────────────
export type Token = { raw: string; low: string; at: number; end: number };

/** Words of a text, symbols folded the way tech writing spells them: "C++" → cpp, "C#" → csharp, ".NET" → dotnet,
 *  "Next.js" → nextjs, "Socket.io" → socketio; "&" → and; accents dropped. Offsets point into the folded text. */
export function tokenize(text: string): { text: string; tokens: Token[] } {
  const folded = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b([cf])#/gi, (_, c: string) => `${c}sharp`)
    .replace(/\b(c)\+\+/gi, (_, c: string) => `${c}pp`)
    .replace(/(^|[^a-z0-9])\.net\b/gi, "$1dotnet")
    .replace(/([a-z0-9])\.(js|io)\b/gi, "$1$2")
    .replace(/&/g, " and ");
  const tokens: Token[] = [];
  for (const m of folded.matchAll(/[A-Za-z0-9]+/g)) {
    const at = m.index ?? 0;
    tokens.push({ raw: m[0], low: m[0].toLowerCase(), at, end: at + m[0].length });
  }
  return { text: folded, tokens };
}

/** Lower-case words joined by single spaces — the comparable form of a name ("Next.js" → "nextjs"). */
export const normalize = (s: string): string =>
  tokenize(s)
    .tokens.map((t) => t.low)
    .join(" ");

// ── matching ──────────────────────────────────────────────────────────────────────────────────────────────────────
/** A group of terms that all point at one target; lower `prio` wins a tie (skills 0 · résumé extras 1 · vocabulary 2). */
export type TermGroup = { target: number; prio: number; terms: readonly (readonly [spec: string, kind: TermKind])[] };
type Compiled = { words: string[]; raw: string[] | null; family: string | null; target: number; prio: number; kind: TermKind };
export type Matcher = { byWord: Map<string, Compiled[]>; families: Compiled[] };

export function compile(groups: readonly TermGroup[]): Matcher {
  const byWord = new Map<string, Compiled[]>();
  const families: Compiled[] = [];
  for (const g of groups) {
    for (const [spec, kind] of g.terms) {
      const base = { target: g.target, prio: g.prio, kind };
      if (spec.endsWith("*")) {
        families.push({ ...base, words: [], raw: null, family: spec.slice(0, -1).toLowerCase() });
        continue;
      }
      const exact = spec.startsWith("=");
      const toks = tokenize(exact ? spec.slice(1) : spec).tokens;
      if (toks.length === 0) continue;
      const c: Compiled = { ...base, words: toks.map((t) => t.low), raw: exact ? toks.map((t) => t.raw) : null, family: null };
      const list = byWord.get(c.words[0]) ?? [];
      list.push(c);
      byWord.set(c.words[0], list);
    }
  }
  return { byWord, families };
}

export type Hit = { target: number; kind: TermKind; prio: number; /** The words as written in the text. */ via: string; at: number };

/** Every target named in `text`, longest phrase first: "React Native" is one thing, not React; "Node.js" doesn't also
 *  count as JavaScript. Exact words beat families of the same length ("LlamaIndex" isn't a Llama). */
export function findAll(m: Matcher, text: string): Hit[] {
  const { text: folded, tokens } = tokenize(text);
  type Cand = { i: number; len: number; c: Compiled };
  const cands: Cand[] = [];
  tokens.forEach((tok, i) => {
    for (const c of m.byWord.get(tok.low) ?? []) {
      if (i + c.words.length > tokens.length) continue;
      let ok = true;
      for (let k = 0; k < c.words.length && ok; k++) {
        const t = tokens[i + k];
        ok = t.low === c.words[k] && (!c.raw || t.raw === c.raw[k]);
      }
      if (ok) cands.push({ i, len: c.words.length, c });
    }
    for (const f of m.families) if (f.family && tok.low.startsWith(f.family)) cands.push({ i, len: 1, c: f });
  });
  cands.sort(
    (a, b) => b.len - a.len || Number(!!a.c.family) - Number(!!b.c.family) || a.c.prio - b.c.prio || a.c.kind - b.c.kind || a.i - b.i,
  );
  const used = new Uint8Array(tokens.length);
  const hits: Hit[] = [];
  for (const { i, len, c } of cands) {
    let free = true;
    for (let k = i; k < i + len; k++) if (used[k]) free = false;
    if (!free) continue;
    used.fill(1, i, i + len);
    hits.push({ target: c.target, kind: c.kind, prio: c.prio, via: folded.slice(tokens[i].at, tokens[i + len - 1].end), at: tokens[i].at });
  }
  return hits.sort((a, b) => a.at - b.at);
}

/** Does a stack item ("GPT-4.1", "Django REST Framework") name this skill? Exact words of the name or an alias, or a
 *  family ("gpt*", "django*"). Used at build time for the "Used in" evidence. */
export function namesSkill(item: string, terms: readonly string[]): boolean {
  const words = normalize(item);
  const first = words.split(" ")[0] ?? "";
  return terms.some((spec) => {
    if (spec.endsWith("*")) return first.startsWith(spec.slice(0, -1).toLowerCase());
    return normalize(spec.replace(/^=/, "")) === words;
  });
}

/** Every term of a skill, its own name first. `loose` aliases are for stack items only (see namesSkill). */
export function skillTerms(name: string, entry: AliasEntry | undefined, opts: { loose?: boolean } = {}): [string, TermKind][] {
  const own: [string, TermKind] = [entry?.exactCase ? `=${name}` : name, 0];
  return [
    own,
    ...(entry?.same ?? []).map((s) => [s, 1] as [string, TermKind]),
    ...(entry?.related ?? []).map((s) => [s, 2] as [string, TermKind]),
    ...(opts.loose ? (entry?.loose ?? []).map((s) => [s, 1] as [string, TermKind]) : []),
  ];
}

// ── the client index (built on the server, sent as a prop) ───────────────────────────────────────────────────────
export type ClientSkill = { slug: string; name: string; type: number; /** Entry indices ("Used in"). */ ev: number[]; terms: [string, TermKind][] };
export type ClientEntry = { name: string; kind: "quest" | "project"; id: string };
export type ClientExtra = { name: string; source: string; terms: string[] };
export type SkillsIndex = {
  types: { id: string; name: string; label: string; tone: string }[];
  skills: ClientSkill[];
  entries: ClientEntry[];
  extras: ClientExtra[];
  vocab: { name: string; terms: string[] }[];
};

// ── the JD scan ───────────────────────────────────────────────────────────────────────────────────────────────────
export type ScanResult = {
  /** Skills the text names (by name or another spelling), in text order. */
  matched: number[];
  /** Skills only implied by a neighbour ("containers" → Docker), with the words that implied them. */
  bonus: { skill: number; via: string }[];
  /** Résumé items that aren't Skill Tree entries (coursework, stack items, research keywords). */
  extras: { extra: number; via: string }[];
  /** Requirements recognised from the vocabulary that the save file doesn't have. */
  missing: { vocab: number; via: string }[];
};

export function makeScanner(index: SkillsIndex): (text: string) => ScanResult {
  const S = 0;
  const X = index.skills.length;
  const V = X + index.extras.length;
  const matcher = compile([
    ...index.skills.map((s, i) => ({ target: S + i, prio: 0, terms: s.terms })),
    ...index.extras.map((x, i) => ({ target: X + i, prio: 1, terms: x.terms.map((t) => [t, 1] as const) })),
    ...index.vocab.map((v, i) => ({ target: V + i, prio: 2, terms: v.terms.map((t) => [t, 1] as const) })),
  ]);
  return (text) => {
    const hits = findAll(matcher, text.slice(0, 40000));
    const direct = new Set<number>();
    const implied = new Map<number, string>();
    const extras = new Map<number, string>();
    const missing = new Map<number, string>();
    for (const h of hits) {
      if (h.target < X) {
        if (h.kind < 2) direct.add(h.target);
        else if (!implied.has(h.target)) implied.set(h.target, h.via);
      } else if (h.target < V) {
        if (!extras.has(h.target - X)) extras.set(h.target - X, h.via);
      } else if (!missing.has(h.target - V)) missing.set(h.target - V, h.via);
    }
    return {
      matched: [...direct],
      bonus: [...implied].filter(([s]) => !direct.has(s)).map(([skill, via]) => ({ skill, via })),
      extras: [...extras].map(([extra, via]) => ({ extra, via })),
      missing: [...missing].map(([vocab, via]) => ({ vocab, via })),
    };
  };
}

// ── inventory search ──────────────────────────────────────────────────────────────────────────────────────────────
/** Skills whose name starts a word with the query, or whose other spellings do ("js" → JavaScript, Next.js, Node.js;
 *  "postgres" → PostgreSQL). Neighbours (kind 2) don't count, and one- or two-letter queries need a whole alias word —
 *  "c" mustn't light up Docker through "containers". */
export function searchSkills(index: SkillsIndex, query: string): Set<number> {
  const q = normalize(query);
  const out = new Set<number>();
  if (!q) return out;
  const squashed = q.replace(/ /g, "");
  const prefix = (p: string) => p.startsWith(q) || p.includes(` ${q}`) || p.replace(/ /g, "").startsWith(squashed);
  index.skills.forEach((s, i) => {
    if (prefix(normalize(s.name))) return void out.add(i);
    for (const [spec, kind] of s.terms) {
      if (kind !== 1) continue;
      const p = normalize(spec.replace(/^=|\*$/g, ""));
      if (q.length <= 2 ? p.split(" ").includes(q) : prefix(p)) return void out.add(i);
    }
  });
  return out;
}

/** A short, generic AI/ML internship job description for "Try a sample JD" (no real company). */
export const SAMPLE_JD = `AI/ML Engineering Intern

We're looking for a curious intern to help build LLM-powered features for our internal tools.

What you'll do
• Prototype retrieval-augmented generation (RAG) pipelines with LangChain and a vector database
• Ship small Python services with FastAPI and containerize them with Docker
• Run evaluations, fine-tune open models and write clear notes on what you find

What we're looking for
• Solid Python and SQL; comfortable with Git
• Coursework or projects in machine learning, deep learning or NLP
• Familiarity with PyTorch or TensorFlow
• Strong grasp of data structures and algorithms

Nice to have
• Kubernetes, AWS or GCP
• React or Next.js for internal dashboards
• Prompt engineering experience`;
