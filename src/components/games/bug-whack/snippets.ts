// Bug Whack's nine mini editors (PART 11): original snippets — game copy, not facts. One file per editor, four lines each.

export type Snippet = { file: string; lines: readonly string[] };

export const SNIPPETS: readonly Snippet[] = [
  { file: "Retry.java", lines: ["int attempts = 0;", "while (attempts < 3) {", "  if (send(packet)) return;", "  attempts++;"] },
  { file: "cache.ts", lines: ["const key = sha256(prompt);", "if (cache.has(key)) {", "  return cache.get(key);", "}"] },
  { file: "parser.py", lines: ["def parse(row):", '    cells = row.split(",")', "    return [c.strip() for c in cells]", "# quotes: next sprint"] },
  { file: "Queue.java", lines: ["Node head = null;", "public void push(int v) {", "  head = new Node(v, head);", "}"] },
  { file: "auth.ts", lines: ["const token = sign(user, KEY);", 'res.cookie("jwt", token, {', "  httpOnly: true,", "});"] },
  { file: "stats.py", lines: ["total = sum(scores)", "mean = total / len(scores)", 'print(f"mean={mean:.2f}")', "assert mean >= 0"] },
  { file: "Report.java", lines: ["for (Module m : modules) {", "  covered += m.tested();", "}", 'log("coverage", covered);'] },
  { file: "api.ts", lines: ['app.get("/health", (req, res) => {', "  res.json({ ok: true });", "});", "app.listen(8080);"] },
  { file: "top.py", lines: ["def top(xs, k=10):", "    xs = sorted(xs, reverse=True)", "    return xs[:k]", "# fast enough"] },
];

export type CodeToken = { text: string; kind: "kw" | "str" | "num" | "com" | null };

const TOKEN = /("[^"]*"|'[^']*'|#.*$|\/\/.*$|\b\d+(?:\.\d+)?\b|\b(?:const|let|return|if|while|for|def|public|void|int|new|null|true|in)\b)/g;

/** A tiny highlighter: keywords, strings, numbers and comments. */
export function highlight(line: string): CodeToken[] {
  const out: CodeToken[] = [];
  let at = 0;
  for (const m of line.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > at) out.push({ text: line.slice(at, i), kind: null });
    const t = m[0];
    out.push({ text: t, kind: t.startsWith("#") || t.startsWith("//") ? "com" : t.startsWith('"') || t.startsWith("'") ? "str" : /^\d/.test(t) ? "num" : "kw" });
    at = i + t.length;
  }
  if (at < line.length) out.push({ text: line.slice(at), kind: null });
  return out;
}
