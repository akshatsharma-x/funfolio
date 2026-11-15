// World registry (Bible §8): page order, ids, numbers, game title + plain name (R9) and lead color (R8).
// Structure, not facts — the facts live in content.ts. CSS maps each id to colors via [data-world] in globals.css.

export type WorldId =
  | "title"
  | "profile"
  | "launchpad"
  | "quests"
  | "lab"
  | "vault"
  | "arcade"
  | "skills"
  | "trophies"
  | "lobby"
  | "credits";

/** Lead color names; must match the [data-world] rules in globals.css. */
export type WorldColor = "gold" | "cyan" | "lime" | "violet" | "pink" | "yellow" | "orange" | "mint";

export type World = {
  id: WorldId;
  /** Shown as "WORLD {number}{sub}". Credits has none. */
  number?: number;
  sub?: "A" | "B";
  /** Optional kicker shown next to the number, e.g. "Bonus Stage". */
  stage?: string;
  /** Game metaphor, title case (rendered uppercase via CSS so screen readers don't spell it out). */
  gameTitle: string;
  /** Plain name that always sits next to the metaphor (R9). */
  plainTitle: string;
  /** Short plain name for the HUD ("WORLD 3 · THE LAB · Research"). */
  hudTitle: string;
  color: WorldColor;
  /** Celebration worlds may use full multicolor (R8). */
  rainbow?: boolean;
};

export const WORLDS: readonly World[] = [
  { id: "title", number: 0, gameTitle: "Title Screen", plainTitle: "Home", hudTitle: "Home", color: "gold", rainbow: true },
  { id: "profile", number: 1, gameTitle: "Player Profile", plainTitle: "About", hudTitle: "About", color: "cyan" },
  { id: "launchpad", number: 2, sub: "A", gameTitle: "The Launchpad", plainTitle: "Gate to Experience", hudTitle: "Experience gate", color: "lime" },
  { id: "quests", number: 2, sub: "B", gameTitle: "Quest Log", plainTitle: "Experience", hudTitle: "Experience", color: "lime" },
  { id: "lab", number: 3, gameTitle: "The Lab", plainTitle: "Research & Publications", hudTitle: "Research", color: "violet" },
  { id: "vault", number: 4, gameTitle: "Cartridge Vault", plainTitle: "Projects", hudTitle: "Projects", color: "pink" },
  { id: "arcade", number: 5, stage: "Bonus Stage", gameTitle: "The Arcade", plainTitle: "Mini-games", hudTitle: "Mini-games", color: "gold", rainbow: true },
  { id: "skills", number: 6, gameTitle: "Skill Tree", plainTitle: "Skills", hudTitle: "Skills", color: "yellow" },
  { id: "trophies", number: 7, gameTitle: "Trophy Room", plainTitle: "Certificates & Achievements", hudTitle: "Certificates", color: "orange" },
  { id: "lobby", number: 8, gameTitle: "Co-op Lobby", plainTitle: "Contact", hudTitle: "Contact", color: "mint" },
  { id: "credits", gameTitle: "Credits", plainTitle: "Credits", hudTitle: "Credits", color: "gold", rainbow: true },
];

export const worldById: Readonly<Record<WorldId, World>> = Object.fromEntries(
  WORLDS.map((w) => [w.id, w]),
) as Record<WorldId, World>;

/** "WORLD 2B", "WORLD 0", or "" for credits. */
export function worldLabel(world: World): string {
  return world.number === undefined ? "" : `World ${world.number}${world.sub ?? ""}`;
}
