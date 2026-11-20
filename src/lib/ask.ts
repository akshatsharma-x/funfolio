// Type-to-ask (PART 19): a tiny local intent matcher for BYTE's chat — no model, no network, no content import (the
// routes come from src/content/dialogue.ts through the runtime's props). Words are folded (case, accents,
// punctuation), stop words don't count on their own, a word matches its plural, and typos of one letter (two in
// long words) still land: "experiance" → experience, "skils" → skills. Multi-word routes ("machine learning",
// "who are you") match as phrases and weigh more. Earlier routes win ties — the dialogue lists specific names first.

export type AskIntent = { node: string; words: string[] };

const STOP = new Set(
  "a an the is are was were be been am what whats which who whom does do did doing he his him she her it its me my i you your yours about tell any of on in for to and or with at this that these those can could would should will please akshat sharma there here some much many how where when why give show have has had got know like want wanna need just also really".split(" "),
);

/** Lower case, no accents, letters / digits / . + # kept (pm2.5, c++, c#) — "Résumé?" → "resume". */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.+#]+/g, " ")
    .replace(/(^|\s)\.+|\.+(?=\s|$)/g, " ")
    .trim();
}
export const tokens = (s: string): string[] => fold(s).split(" ").filter(Boolean);
const plural = (w: string) => (w.length > 3 && w.endsWith("ies") ? `${w.slice(0, -3)}y` : w.length > 3 && w.endsWith("es") && !w.endsWith("ses") ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);

/** Damerau–Levenshtein distance, capped (we only care about 0–2). */
function distance(a: string, b: string, cap = 3): number {
  if (Math.abs(a.length - b.length) >= cap) return cap;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let best = cap;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      best = Math.min(best, d[i][j]);
    }
    if (best >= cap) return cap;
  }
  return d[a.length][b.length];
}

/** 2 = the same word (or its plural), 1.5 = a typo away, 0 = different. Short words must match exactly. */
function same(q: string, w: string): number {
  if (q === w || plural(q) === plural(w)) return 2;
  const n = Math.min(q.length, w.length);
  if (n >= 5 && distance(q, w) <= (n >= 9 ? 2 : 1)) return 1.5;
  return 0;
}

export type AskMatch = { node: string; score: number };

/** The best route for a question, or null when nothing on the save file fits (score < 1.5). */
export function matchIntent(question: string, intents: readonly AskIntent[]): AskMatch | null {
  const q = tokens(question);
  if (!q.length) return null;
  let best: AskMatch | null = null;
  for (const intent of intents) {
    let score = 0;
    // each distinct word counts once ("résumé" and "resume" fold to the same thing)
    for (const entry of new Set(intent.words.map(fold))) {
      const ws = tokens(entry);
      if (!ws.length) continue;
      if (ws.length === 1) {
        if (STOP.has(ws[0])) continue;
        let hit = 0;
        for (const t of q) if (!STOP.has(t)) hit = Math.max(hit, same(t, ws[0]));
        score += hit;
        continue;
      }
      // a phrase: its words in a row (stop words included — "who are you")
      for (let i = 0; i + ws.length <= q.length; i++) {
        if (ws.every((w, k) => same(q[i + k], w) > 0)) {
          score += 2 * ws.length;
          break;
        }
      }
    }
    if (score >= 1.5 && (!best || score > best.score)) best = { node: intent.node, score };
  }
  return best;
}
