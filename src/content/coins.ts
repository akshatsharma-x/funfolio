// The 12 hidden coins (Bible §6, consolidated per PART 16). Each part that hides one calls store.collectCoin(id).
// Each coin: +25 XP, +1 wallet coin, an "ITEM ACQUIRED" toast. 5 → coin-collector · 12 → treasure-hunter.

export type Coin = {
  id: string;
  number: number;
  name: string;
  /** Where it hides (for QA and the eggs page). */
  location: string;
  /** Terminal hint (PART 16). */
  hint: string;
};

export const COINS = [
  { id: "boot", number: 1, name: "Starter Coin", location: "Boot sequence — the INSERT COIN slot", hint: "Every run starts with a credit." },
  { id: "quest-tower", number: 2, name: "Tower Coin", location: "Title Screen — behind the Quest Tower", hint: "Spin the island; look behind the tallest building." },
  { id: "title-k", number: 3, name: "Kerning Coin", location: "Title Screen — hover the K in the name", hint: "One letter in the name is worth more than the others." },
  { id: "mystery-crate", number: 4, name: "Crate Coin", location: "Player Profile — the mystery crate", hint: "Some crates rattle." },
  { id: "bug-fortress", number: 5, name: "Fortress Coin", location: "Launchpad — above the Bug Fortress", hint: "Aim higher than the bugs." },
  { id: "active-quest", number: 6, name: "Cost Coin", location: "Quest Log — the $0.08 in the active quest", hint: "Cheap inference, rich reward." },
  { id: "cleared-smog", number: 7, name: "Clear-Sky Coin", location: "The Lab — after the smog clears", hint: "Beat the golem, breathe the air." },
  { id: "locked-cartridge", number: 8, name: "Cartridge Coin", location: "Cartridge Vault — the locked cartridge", hint: "Not every cartridge is a project." },
  { id: "arcade-target", number: 9, name: "High-Score Coin", location: "Arcade — first target score in any game", hint: "Beat any game's target." },
  { id: "skill-root", number: 10, name: "Root Coin", location: "Skill Tree — the root of the tree", hint: "Every tree grows from one root. Knock twice." },
  { id: "capsule-machine", number: 11, name: "Capsule Coin", location: "Trophy Room — the capsule machine", hint: "Turn the crank." },
  { id: "credits-roll", number: 12, name: "Credits Coin", location: "Credits — during the roll", hint: "Stay until the very end." },
] as const satisfies readonly Coin[];

export type CoinId = (typeof COINS)[number]["id"];

export const COIN_BY_ID: Readonly<Record<string, Coin>> = Object.fromEntries(COINS.map((c) => [c.id, c]));
