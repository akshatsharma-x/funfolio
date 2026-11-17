// Arcade games = the side quests' cartridges (PART 8 links them from the Quest Log, PART 10 from the Vault). PART 11
// builds the Arcade and its first three games; PART 12 flips the other three to `ready`. Names are game labels, not
// facts about Akshat — what each game is based on comes from content.ts (src/content/arcade.ts).

export type GameDef = { id: string; name: string; ready: boolean; /** A cabinet in the Arcade (the JD Scanner isn't one). */ arcade: boolean };

export const GAMES: readonly GameDef[] = [
  { id: "token-squeeze", name: "Token Squeeze", ready: true, arcade: true },
  { id: "cache-hit", name: "Cache Hit!", ready: true, arcade: true },
  { id: "bug-whack", name: "Bug Whack", ready: true, arcade: true },
  // PART 12
  { id: "rag-catcher", name: "RAG Catcher", ready: true, arcade: true },
  { id: "pipeline", name: "Pipeline", ready: true, arcade: true },
  { id: "gradient-descent", name: "Gradient Descent", ready: true, arcade: true },
  // the JD Scanner is a Skill Tree tool (PART 13), reached the same way
  { id: "jd-scanner", name: "JD Scanner", ready: false, arcade: false },
];

export const GAME_BY_ID: Readonly<Record<string, GameDef>> = Object.fromEntries(GAMES.map((g) => [g.id, g]));

/** The six arcade cabinets, in hall order — playing all of them unlocks Arcade Rat. */
export const ARCADE_IDS: readonly string[] = GAMES.filter((g) => g.arcade).map((g) => g.id);
