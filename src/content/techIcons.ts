// Tech logos for stack items (Bible §3: simple-icons, tinted, monochrome). Server-only: the path data is inlined
// into the HTML, so none of it reaches a client bundle. Companies never get logos (R4) — only tools and languages.
// Items without an entry fall back to their item-type pixel icon.

import {
  siClaude,
  siDjango,
  siGit,
  siGithub,
  siJsonwebtokens,
  siLanggraph,
  siMongodb,
  siNextdotjs,
  siPostgresql,
  siPostman,
  siReact,
  siTailwindcss,
  siTypescript,
  type SimpleIcon,
} from "simple-icons";

export const TECH_ICONS: Readonly<Record<string, SimpleIcon>> = {
  LangGraph: siLanggraph,
  "Claude Sonnet 4.5": siClaude,
  "Next.js": siNextdotjs,
  TypeScript: siTypescript,
  React: siReact,
  "Tailwind CSS": siTailwindcss,
  "Django REST Framework": siDjango,
  JWT: siJsonwebtokens,
  PostgreSQL: siPostgresql,
  Postman: siPostman,
  Git: siGit,
  GitHub: siGithub,
  MongoDB: siMongodb,
};
