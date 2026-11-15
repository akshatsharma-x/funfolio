// Cursor skins, sizes and variants (PART 2). Pure data, no imports: read by the app AND by scripts/build-cursors.mjs
// (Node type-stripping), which renders every skin × size × variant to /public/cursors and writes the CSS variables.
// Every skin keeps the dual outline (black outer + white inner) and the full variant set — that's the contrast
// guarantee (R2), so fills and accents are free to change.

export const CURSOR_VARIANTS = ["default", "hand", "grab", "grabbing", "crosshair", "pull", "not-allowed"] as const;
export type CursorVariant = (typeof CURSOR_VARIANTS)[number];

/** Native keyword used when an image can't load (always a visible system cursor). */
export const CURSOR_FALLBACK: Readonly<Record<CursorVariant, string>> = {
  default: "default",
  hand: "pointer",
  grab: "grab",
  grabbing: "grabbing",
  crosshair: "crosshair",
  pull: "grabbing",
  "not-allowed": "not-allowed",
};

/** Settings → Cursor size. Each size is its own pixel-perfect asset set (2×, 3×, 4× of the 16px art grid). */
export const CURSOR_SIZES = { normal: 32, large: 48, xl: 64 } as const;
export type CursorSize = keyof typeof CURSOR_SIZES;
export const CURSOR_SIZE_IDS = Object.keys(CURSOR_SIZES) as CursorSize[];

export type CursorPalette = {
  /** One color, or one per art row (Rainbow). */
  fill: string | readonly string[];
  highlight: string;
  shade: string;
  /** Accent pixels "1" "2" "3" (Pixel Pop: pink · cyan · yellow). */
  accents: readonly [string, string, string];
};

export type CursorSkin = {
  id: string;
  name: string;
  /** Locked skins are Prize Counter / achievement unlocks (PART 3 / PART 11). */
  locked: boolean;
  unlockHint?: string;
  palette: CursorPalette;
  /** Optional shape set from cursor-art.ts (e.g. the sword pointer). */
  shapes?: "pixel-sword" | "robo-glove";
};

export const CURSOR_SKINS = [
  {
    id: "pixel-pop",
    name: "Pixel Pop",
    locked: false,
    palette: { fill: "#FFF4E0", highlight: "#FFFFFF", shade: "#FFE2B8", accents: ["#FF3D8B", "#22D3EE", "#FFD23F"] },
  },
  {
    id: "golden",
    name: "Golden",
    locked: true,
    unlockHint: "Find all 12 hidden coins",
    palette: { fill: "#FFC83D", highlight: "#FFF1A8", shade: "#C98A00", accents: ["#FFF1A8", "#C98A00", "#FFFFFF"] },
  },
  {
    id: "rainbow",
    name: "Rainbow",
    locked: true,
    unlockHint: "Prize Counter",
    palette: {
      fill: ["#FF3D8B", "#FF8A1F", "#FFD23F", "#B6FF3B", "#22D3EE", "#A78BFA"],
      highlight: "#FFFFFF",
      shade: "#FFF4E0",
      accents: ["#FFFFFF", "#FFF4E0", "#FFFFFF"],
    },
  },
  {
    id: "retro-green",
    name: "Retro Green",
    locked: true,
    unlockHint: "Prize Counter",
    palette: { fill: "#2EE59D", highlight: "#B6FF3B", shade: "#047857", accents: ["#B6FF3B", "#047857", "#FFF4E0"] },
  },
  {
    id: "pixel-sword",
    name: "Pixel Sword",
    locked: true,
    unlockHint: "Prize Counter",
    shapes: "pixel-sword",
    palette: { fill: "#B9B2D9", highlight: "#FFFFFF", shade: "#8B84B0", accents: ["#8B5CF6", "#22D3EE", "#FFC83D"] },
  },
  {
    id: "robo-glove",
    name: "Robo Glove",
    locked: true,
    unlockHint: "Prize Counter",
    shapes: "robo-glove",
    palette: { fill: "#B9B2D9", highlight: "#FFFFFF", shade: "#6B6390", accents: ["#FF3D8B", "#22D3EE", "#FFD23F"] },
  },
] as const satisfies readonly CursorSkin[];

export type CursorSkinId = (typeof CURSOR_SKINS)[number]["id"];
export const CURSOR_SKIN_IDS = CURSOR_SKINS.map((s) => s.id) as CursorSkinId[];
export const DEFAULT_CURSOR_SKIN: CursorSkinId = "pixel-pop";

/** Labels the follower may show from [data-cursor-label] (PART 2 vocabulary). */
export const CURSOR_LABELS = ["OPEN", "PLAY", "PULL!", "DRAG", "COPY", "READ", "LAUNCH", "EQUIP", "INSERT"] as const;
export type CursorLabel = (typeof CURSOR_LABELS)[number];
