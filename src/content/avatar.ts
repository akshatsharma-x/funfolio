// The pixel-art avatar the Character Card shows until player.photo exists (PART 6). Original art (R4) — change the
// colors below to taste; the shapes are 26×22 pixel rows, one letter per pixel ("." = transparent).

export const AVATAR_COLORS = {
  outline: "#07060F",
  hair: "#2A2140",
  hairShine: "#4A3D6B",
  skin: "#C68B59",
  skinShade: "#A86E42",
  blush: "#E8917A",
  eyes: "#07060F",
  eyeShine: "#FFFFFF",
  mouth: "#7A2E3A",
  shirt: "#22D3EE",
  shirtShade: "#0E7490",
  headphones: "#FF3D8B",
  headphonesShade: "#B0185A",
} as const;

export type AvatarColor = keyof typeof AVATAR_COLORS;

/** Letter → color name. */
export const AVATAR_LEGEND: Readonly<Record<string, AvatarColor>> = {
  k: "outline",
  h: "hair",
  H: "hairShine",
  s: "skin",
  n: "skinShade",
  b: "blush",
  e: "eyes",
  w: "eyeShine",
  m: "mouth",
  c: "shirt",
  C: "shirtShade",
  p: "headphones",
  P: "headphonesShade",
};

export const AVATAR = {
  width: 26,
  height: 22,
  /** Head, headphones and torso. */
  body: [
    "..........................",
    "........kkkkkk............",
    "......kkhhhhhhkk..........",
    ".....khhhhhhhhhhk.........",
    "....khHHHhhhhhhhhk........",
    "....khhhhhhhhhhhhk........",
    "...pkhhhhhhhhhhhhkp.......",
    "..pPkhhshhsshhshhkPp......",
    "..pPksssssssssssskPp......",
    "..pPksswessssewsskPp......",
    "..pPksseesssseesskPp......",
    "...pkbssssssssssbkp.......",
    "....ksssmssssmsssk........",
    ".....ksssmmmmsssk.........",
    "......kksssssskk..........",
    ".......knnnnnnk...........",
    "....kkkcccccccckkk........",
    "...kcccccccccccccck.......",
    "..kcccccccccccccccck......",
    ".kcCccccccCCccccccCck.....",
    ".kcCccccccCCccccccCck.....",
    ".kkkkkkkkkkkkkkkkkkkk.....",
  ],
  /** The raised hand + sleeve: its own layer, so it can wave (rotates around `pivot`, at the shoulder). */
  arm: [
    "..........................",
    "..........................",
    "......................kkk.",
    ".....................ksssk",
    ".....................ksssk",
    ".....................sssk.",
    ".....................kssk.",
    ".....................kcck.",
    ".....................kcck.",
    ".....................kcck.",
    ".....................kcck.",
    ".....................kcck.",
    ".....................kcck.",
    ".....................kcck.",
    ".....................kcck.",
    "....................kccck.",
    "...................kcccck.",
    "..................ccccck..",
    "...................cccck..",
    "..........................",
    "..........................",
    "..........................",
  ],
  pivot: [21, 18] as const,
};
