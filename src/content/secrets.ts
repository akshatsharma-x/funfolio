// Sticker-peel secrets (PART 4 #7). Original code jokes and pixel doodles — playful site copy, never facts about Akshat
// (fun facts come from player.funFacts in content.ts once Akshat sends them; see <PeelFact/>).

export const CODE_JOKES = [
  "while (curious) { peel(); }",
  "404: sticker glue not found.",
  "It works on my sticker.",
  "SELECT * FROM secrets WHERE peeled = true;",
  'git commit -m "peeled the sticker"',
  "There are 10 kinds of players: those who peel stickers and those who don't.",
  "sudo stick --force",
  "Under every sticker: another sticker.",
  'console.log("you found me");',
  "This sticker is load-bearing. Please put it back.",
] as const;

/** 12×12-ish pixel doodles. "." = clear; letters map to the palette. */
export const DOODLES = {
  rocket: {
    label: "a pixel rocket",
    rows: ["....##....", "...#ww#...", "..#wwww#..", "..#wccw#..", "..#wccw#..", "..#wwww#..", ".##wwww##.", "#k#wwww#k#", "#k#wwww#k#", "...####...", "...oyyo...", "....oo...."],
  },
  coffee: {
    label: "a pixel coffee mug",
    rows: ["..l..l..l...", "...l..l.....", "..l..l......", "#######.....", "#bbbbb####..", "#bbbbb#..#..", "#bbbbb#..#..", "#bbbbb####..", "#bbbbb#.....", ".#####......"],
  },
  byte: {
    label: "a tiny BYTE doodle",
    rows: ["....##....", "....#.....", "##########", "#wwwwwwww#", "#w######w#", "#w#k##k#w#", "#w######w#", "#wwwwwwww#", "##########", "...####...", "..#wwww#.."],
  },
} as const;

export type DoodleName = keyof typeof DOODLES;

export const DOODLE_PALETTE: Record<string, string> = {
  "#": "#07060F",
  w: "#FFF4E0",
  c: "#22D3EE",
  k: "#FF3D8B",
  o: "#FF8A1F",
  y: "#FFD23F",
  b: "#8B5A2B",
  l: "#B9B2D9",
};
