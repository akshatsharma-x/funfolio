// Sound effects (Bible §5) — STUB. PART 3 replaces the body with the ZzFX wrapper (master volume, mute, AudioContext
// unlock on first gesture, hover throttle, global rate limiter). Sound is OFF by default (R5), so this stays silent.

export const SFX_NAMES = [
  "click",
  "hover",
  "coin",
  "xp",
  "levelUp",
  "achievement",
  "open",
  "close",
  "error",
  "whoosh",
  "stretch",
  "thud",
  "pop",
  "blip",
  "insertCoin",
  "powerUp",
  "countdown",
  "win",
  "lose",
] as const;

export type SfxName = (typeof SFX_NAMES)[number];
export type SfxOptions = { pitch?: number; volume?: number };

export const sfx = {
  play(_name: SfxName, _opts?: SfxOptions): void {},
};
