// The overworld island's landmarks (PART 5): one per world, in its world color (R8), always labelled with the game
// name AND the plain name (R9) — "QUEST TOWER · Experience". Positions are island grid coordinates (x, z) used by both
// the 3D scene and the isometric SVG fallback.

import { worldById, type WorldId } from "./worlds";

export type LandmarkId = "house" | "tower" | "observatory" | "workshop" | "arcade" | "tree" | "pedestal" | "radio";

export type Landmark = {
  id: LandmarkId;
  world: WorldId;
  name: string;
  /** World number (for the jump: World 2 = the Launchpad gate in play mode). */
  number: number;
  /** Fill color (bright value — the 3D scene and the SVG use the same palette in every theme). */
  color: string;
  /** Island grid position (x, z); the island spans about −8…8. */
  at: readonly [number, number];
};

export const LANDMARKS: readonly Landmark[] = [
  { id: "house", world: "profile", name: "Player House", number: 1, color: "#22D3EE", at: [-4.5, 3] },
  { id: "tower", world: "quests", name: "Quest Tower", number: 2, color: "#B6FF3B", at: [-1, -4.5] },
  { id: "observatory", world: "lab", name: "Observatory", number: 3, color: "#A78BFA", at: [4.5, -2.5] },
  { id: "workshop", world: "vault", name: "Cartridge Workshop", number: 4, color: "#FF3D8B", at: [-6, -1.5] },
  { id: "arcade", world: "arcade", name: "Arcade", number: 5, color: "#FFC83D", at: [2.5, 4] },
  { id: "tree", world: "skills", name: "Skill Tree", number: 6, color: "#FFD23F", at: [-3, -0.5] },
  { id: "pedestal", world: "trophies", name: "Trophy Pedestal", number: 7, color: "#FF8A1F", at: [1, 0.5] },
  { id: "radio", world: "lobby", name: "Radio Tower", number: 8, color: "#2EE59D", at: [6, 1.5] },
];

/** "QUEST TOWER · Experience" */
export const landmarkLabel = (l: Landmark) => `${l.name.toUpperCase()} · ${worldById[l.world].plainTitle}`;
/** Accessible name — contains the visible label (WCAG 2.5.3): "Quest Tower · Experience — go to World 2" */
export const landmarkAction = (l: Landmark) => `${l.name} · ${worldById[l.world].plainTitle} — go to World ${l.number}`;
