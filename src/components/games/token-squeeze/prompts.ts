// Token Squeeze's prompts (PART 11): five original bloated prompts — game copy, not facts. [Brackets] mark filler that
// can go without changing what the prompt asks for; every other word carries meaning (careful: "only", "not", "must",
// "under" look small but matter). Tokens are counted as words, roughly how a tokenizer sees short English words.

export const PROMPTS: readonly string[] = [
  "[Hey,] [could you please] summarize the attached quarterly report in five bullet points? Focus on [the really] important risks. [Please note that] each bullet must stay under twenty words, and [basically] do not mention customer names.",
  "[Hello!] [Could you] review this pull request and list [any] security issues? [Please note that] the service handles payments, so [actually] flag every unsafe database query. [If that makes sense,] only report real problems.",
  "[Hi! I just wanted to ask if you could] write a short email to the team about [the fact that] the launch moved to Friday. [Kindly] keep it [very] friendly, mention the new demo time, and [really] make sure it stays under 100 words.",
  "[Okay, so basically,] write a SQL query that returns the top ten customers by total revenue this year. [In order] to keep it fast, [please] only use the orders table, [if at all possible,] and [just] sort from highest to lowest.",
  "[I would really appreciate it if you could] create a two-week study plan for a data structures interview. [Please note that] I can only study one hour per day, so [basically] prioritize graphs and dynamic programming first. [Thanks a lot in advance!]",
];

export type Tile = { text: string; filler: boolean; tokens: number };

export function parsePrompt(prompt: string): Tile[] {
  const tiles: Tile[] = [];
  for (const m of prompt.matchAll(/\[([^\]]+)\]|(\S+)/g)) {
    const text = (m[1] ?? m[2]).trim();
    tiles.push({ text, filler: m[1] !== undefined, tokens: text.split(/\s+/).length });
  }
  return tiles;
}
