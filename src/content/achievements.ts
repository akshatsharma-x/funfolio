// Achievement registry (PART 3). Game content, not facts about Akshat. Later parts wire most triggers; the unlock
// pipeline (store.unlock → bus "achievement:unlocked" → toast + XP) already works for every id.
// secret: true → shows "???" until unlocked.

export type AchievementIcon =
  | "controller" | "map" | "trophy" | "star" | "bug" | "key" | "sparkle" | "coin" | "chest" | "gear" | "lock"
  | "scroll" | "bolt" | "cartridge" | "sword" | "mail" | "heart" | "moon" | "sun" | "byte";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  xp: number;
  secret?: boolean;
};

export const ACHIEVEMENTS = [
  { id: "player-one", title: "Player One", description: "Pressed start. Welcome to the Funfolio.", icon: "controller", xp: 20 },
  { id: "tourist", title: "Tourist", description: "Visited 3 worlds.", icon: "map", xp: 30 },
  { id: "explorer", title: "Explorer", description: "Visited every world.", icon: "map", xp: 100 },
  { id: "completionist", title: "Completionist", description: "Made it all the way to the credits.", icon: "trophy", xp: 75 },
  { id: "launch-day", title: "Launch Day", description: "Fired the Launchpad slingshot for the first time.", icon: "star", xp: 30 },
  { id: "exterminator", title: "Exterminator", description: "Cleared the Bug Fortress.", icon: "bug", xp: 75 },
  { id: "skipper", title: "Skipper", description: "Skipped an intro. No shame.", icon: "bolt", xp: 10 },
  { id: "button-masher", title: "Button Masher", description: "10 clicks in 3 seconds.", icon: "controller", xp: 20 },
  { id: "shaky-hands", title: "Shaky Hands", description: "Shook the mouse to find the cursor.", icon: "sparkle", xp: 20 },
  { id: "coin-collector", title: "Coin Collector", description: "Found 5 hidden coins.", icon: "coin", xp: 50 },
  { id: "treasure-hunter", title: "Treasure Hunter", description: "Found all 12 hidden coins. The Golden cursor is yours.", icon: "chest", xp: 200 },
  { id: "cheat-code", title: "Cheat Code", description: "Entered the classic code. Retro mode unlocked.", icon: "key", xp: 75, secret: true },
  { id: "hacker", title: "Hacker", description: "Opened the terminal.", icon: "gear", xp: 30 },
  { id: "root-access", title: "Root Access", description: "Ran sudo hire akshat.", icon: "lock", xp: 100, secret: true },
  { id: "console-cowboy", title: "Console Cowboy", description: "Called window.akshat from the DevTools console.", icon: "gear", xp: 75, secret: true },
  { id: "caught-switching-tabs", title: "Caught Switching Tabs", description: "The proctor noticed.", icon: "scroll", xp: 50, secret: true },
  { id: "night-owl", title: "Night Owl", description: "Visited between midnight and 5 a.m.", icon: "moon", xp: 50, secret: true },
  { id: "speedrunner", title: "Speedrunner", description: "Turned on Recruiter Speedrun Mode.", icon: "bolt", xp: 25 },
  { id: "frequent-flyer", title: "Frequent Flyer", description: "Clicked the plane three times.", icon: "star", xp: 50, secret: true },
  { id: "bookworm", title: "Bookworm", description: "Opened both research scrolls.", icon: "scroll", xp: 40 },
  { id: "cartridge-collector", title: "Cartridge Collector", description: "Inserted every cartridge.", icon: "cartridge", xp: 75 },
  { id: "skill-issue-nope", title: "Skill Issue? Nope.", description: "Inspected 10 skills.", icon: "sword", xp: 40 },
  { id: "perfect-match", title: "Perfect Match", description: "Ran a job description through the compatibility check.", icon: "sparkle", xp: 50 },
  { id: "lucky-capsule", title: "Lucky Capsule", description: "Turned the capsule machine.", icon: "coin", xp: 30 },
  { id: "arcade-rat", title: "Arcade Rat", description: "Played all six arcade games.", icon: "controller", xp: 150 },
  { id: "compressor", title: "Compressor", description: "Squeezed a prompt by 22% or more.", icon: "gear", xp: 50 },
  { id: "global-minimum", title: "Global Minimum", description: "Rolled the ball into the global minimum.", icon: "star", xp: 50 },
  { id: "co-op-invite", title: "Co-op Invite", description: "Sent a message from the Co-op Lobby.", icon: "mail", xp: 200 },
  { id: "copycat", title: "Copycat", description: "Copied the email address.", icon: "mail", xp: 20 },
  { id: "save-file", title: "Save File", description: "Downloaded the résumé.", icon: "chest", xp: 30 },
  { id: "petting-zoo", title: "Petting Zoo", description: "Petted BYTE 10 times.", icon: "heart", xp: 30 },
  { id: "corner-case", title: "Corner Case", description: "Visited all four corners of the screen.", icon: "map", xp: 50, secret: true },
  { id: "game-over", title: "Game Over", description: "Found the 404 page.", icon: "bug", xp: 30, secret: true },
  { id: "pixel-perfect", title: "Pixel Perfect", description: "Switched to the Retro CRT theme.", icon: "sparkle", xp: 40 },
  { id: "lights-out", title: "Lights Out", description: "Toggled day/night for the first time.", icon: "sun", xp: 15 },
] as const satisfies readonly Achievement[];

export type AchievementId = (typeof ACHIEVEMENTS)[number]["id"];

export const ACHIEVEMENT_BY_ID: Readonly<Record<string, Achievement>> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

export function isAchievementId(id: string): id is AchievementId {
  return id in ACHIEVEMENT_BY_ID;
}
