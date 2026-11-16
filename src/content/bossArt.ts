// The Lab's bosses (PART 9): original 24×24 pixel art, drawn from arrays (R4). Two frames each for a steps() idle.
// Edit the rows freely — every row is 24 characters; "." is transparent; the palette maps the rest.

export type BossArt = { palette: Readonly<Record<string, string>>; frames: readonly (readonly string[])[] };

const INK = "#07060F";

/** "The Spoilage Specter" — a ghostly melting ice cube hauling a sad crate of fruit. */
const SPECTER_A = [
  "........................",
  "....kkkkkkkkkk..........",
  "...kwwwwwwwwwwk.........",
  "..kwiiiiiiiiiwbk........",
  "..kiiikiiikiiibk........",
  "..kikkiiiiikkibk........",
  "..kiiiiiiiiiiibk........",
  "..kiiweiiiweiibk........",
  "..kiieeiiieeiibk........",
  "..kiiciiiiiiiibk........",
  "..kciciiiiiiicbk..k.....",
  "..kcciikkkkiicbkkkk.....",
  "..kccikiiiikccbk..k.....",
  "..kcccccccccccbk..k.....",
  "..kbcccccccccbbk.rrgg...",
  "...kbccbcccbcbk.rrrggyy.",
  "....kbkbkcbkbk.kkkkkkkkk",
  ".....k.kbk.k.k.knnnnnnnk",
  "......c.k...c..knkknnkkk",
  "......c.....c..knnnnnnnk",
  "...............kdnkkkndk",
  ".......c.......knnnnnnnk",
  "...............kkkkkkkkk",
  "........................",
];
/** frame B: the drips fall, the fruit sags */
const SPECTER_B = [
  ...SPECTER_A.slice(0, 14),
  "..kbcccccccccbbk.rrgg...",
  "...kbccbcccbcbk.rrrgg.yy",
  "....kbkbkcbkbk.kkkkkkkkk",
  ".....k.kbk.k.k.knnnnnnnk",
  "...............knkknnkkk",
  "......c.....c..knnnnnnnk",
  "......c.....c..kdnkkkndk",
  "...............knnnnnnnk",
  ".......c.......kkkkkkkkk",
  "........................",
];

/** "The Smog Golem" — a hulking grey cloud-rock creature. */
const GOLEM_A = [
  "......sss......sss......",
  ".....sssss....sssss.....",
  "......sss......sss......",
  ".....kkkk.kkkkk.kkkk....",
  "....kllllkllllllkllllk..",
  "...kllmlllllmlllllmlllk.",
  "...klllllllllllllllllmk.",
  "..kmlllkkllllllllkklllk.",
  "..kmllllkkllllllkklllmk.",
  ".kmmlllyylllmllllyylllmk",
  ".kmllllyylllllllyylllmmk",
  ".kmllllllllllllllllllmmk",
  "kmmlllllkkkkkkkkllllldmk",
  "kmdllllkdddddddkllldllmk",
  "kmmllllllkkkkkklllllmmmk",
  "kmdmlllllllllllllllmdmmk",
  "kmmdmmlllmlllllmllmmdmk.",
  ".kmmdmmmmmmmmmmmmmmdmmk.",
  ".kkmmdkkmmmmmmmmkkdmmkk.",
  "..kkmmk.kmmmmmmk.kmmkk..",
  "...kkk..kmmkkmmk..kkk...",
  "........kddk.kddk.......",
  "........kkkk.kkkk.......",
  "........................",
];
/** frame B: the puffs drift up, the eyes narrow */
const GOLEM_B = [
  ".....sssss....sssss.....",
  "......sss......sss......",
  "........................",
  ...GOLEM_A.slice(3, 9),
  ".kmmllllllllmlllllllllmk",
  ".kmllllyylllllllyylllmmk",
  ...GOLEM_A.slice(11),
];

export const BOSS_ART: Readonly<Record<string, BossArt>> = {
  "cold-chain": {
    palette: {
      k: INK,
      w: "#F4FBFF",
      i: "#C9F1FA",
      c: "#8FDCEF",
      b: "#55AFD0",
      e: "#1B1530",
      n: "#B07A45",
      d: "#6E4526",
      r: "#FF5A5F",
      g: "#6BCB5A",
      y: "#FFC83D",
    },
    frames: [SPECTER_A, SPECTER_B],
  },
  pm25: {
    palette: { k: INK, l: "#C9C5D6", m: "#9590AA", d: "#66617D", s: "#E4E1EC", y: "#FFD23F" },
    frames: [GOLEM_A, GOLEM_B],
  },
};

/** Damage words for the three hits (game copy from the PART 9 brief — words of the paper's own topic). */
export const BOSS_HITS: Readonly<Record<string, readonly [string, string, string]>> = {
  "cold-chain": ["−INTERPRETABILITY", "−PREDICTION", "−PREVENTION"],
  pm25: ["−FEATURES", "−FORECAST", "−CLEAN AIR"],
};
