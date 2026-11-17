// RAG Catcher's query sets (PART 12): six original queries — game copy, not facts about Akshat (the "That's real:"
// line comes from content.ts). Every relevant chunk contains one of its query's keywords (the glow highlights it).

export type QuerySet = { query: string; keywords: readonly string[]; relevant: readonly string[] };

export const QUERIES: readonly QuerySet[] = [
  {
    query: "How does HyDE improve retrieval?",
    keywords: ["HyDE", "hypothetical", "embedding"],
    relevant: ["drafts a hypothetical answer", "embeds the hypothetical doc", "HyDE bridges query and docs", "hypothetical text, real matches", "an answer-shaped embedding", "HyDE before the vector search"],
  },
  {
    query: "What does a FAISS index store?",
    keywords: ["FAISS", "vector", "index"],
    relevant: ["dense vectors in an index", "FAISS nearest-neighbor search", "IVF lists of vectors", "inner product on vectors", "a FAISS index on disk", "vector ids → chunks"],
  },
  {
    query: "How should a long PDF be chunked?",
    keywords: ["chunk", "overlap", "heading"],
    relevant: ["chunk by section heading", "overlap chunks by 50 tokens", "keep a table in one chunk", "chunks near 500 tokens", "heading path in every chunk", "page numbers per chunk"],
  },
  {
    query: "How do you grade a RAG answer?",
    keywords: ["faithful", "recall", "Ragas"],
    relevant: ["Ragas faithfulness score", "context recall per answer", "faithful to the sources", "answer relevancy in Ragas", "recall of the gold facts", "Ragas on a test set"],
  },
  {
    query: "Why rerank the top results?",
    keywords: ["rerank", "cross-encoder", "top-k"],
    relevant: ["a cross-encoder reranks top-k", "rerank 50, keep 5", "top-k gets precise", "rerank by relevance", "cross-encoder reads both texts", "rerank before the prompt"],
  },
  {
    query: "How do agents split a research task?",
    keywords: ["agent", "route", "sub-task"],
    relevant: ["route by intent", "one agent per sub-task", "agents message each other", "route search to an agent", "sub-task results merged", "a planner agent assigns work"],
  },
];

export const JUNK: readonly string[] = [
  "office party RSVP",
  "parking lot map",
  "printer jam fix",
  "Tuesday's lunch menu",
  "old sprint notes",
  "font kerning tips",
  "weather for Friday",
  "cafeteria survey",
  "holiday calendar",
  "logo color swatches",
  "meeting room booking",
  "keyboard shortcut list",
];

export const HALLUCINATIONS: readonly string[] = ["made-up citation", "confident nonsense", "fake statistic", "source: trust me", "an invented API", "an imaginary paper"];

/** Splits a chunk's text around its first keyword (for the glow), case-insensitively. */
export function splitKeyword(text: string, keywords: readonly string[]): [string, string, string] | null {
  const lower = text.toLowerCase();
  let best: { at: number; len: number } | null = null;
  for (const k of keywords) {
    const at = lower.indexOf(k.toLowerCase());
    if (at >= 0 && (best === null || at < best.at)) best = { at, len: k.length };
  }
  return best ? [text.slice(0, best.at), text.slice(best.at, best.at + best.len), text.slice(best.at + best.len)] : null;
}
