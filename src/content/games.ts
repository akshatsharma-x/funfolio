// Side quests = arcade cartridges (PART 8 links them from the Quest Log; PART 11 builds the Arcade and flips `ready`).
// Names are game labels, not facts about Akshat.

export type GameDef = { id: string; name: string; ready: boolean };

export const GAMES: readonly GameDef[] = [
  { id: "token-squeeze", name: "Token Squeeze", ready: false },
  { id: "bug-whack", name: "Bug Whack", ready: false },
  { id: "pipeline", name: "Pipeline", ready: false },
  // PART 10: the Vault's side quests
  { id: "rag-catcher", name: "RAG Catcher", ready: false },
  { id: "gradient-descent", name: "Gradient Descent", ready: false },
  // the JD Scanner is a Skill Tree tool (PART 13), reached the same way
  { id: "jd-scanner", name: "JD Scanner", ready: false },
];

export const GAME_BY_ID: Readonly<Record<string, GameDef>> = Object.fromEntries(GAMES.map((g) => [g.id, g]));
