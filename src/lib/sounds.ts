// Original procedural chiptune SFX (Bible §5) — ZzFX parameter sets, no samples, nothing borrowed.
// Order: volume, randomness, frequency, attack, sustain, release, shape, shapeCurve, slide, deltaSlide, pitchJump,
//        pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo, filter

import type { SfxName } from "./sfx";

export const SOUNDS: Readonly<Record<SfxName, readonly number[]>> = {
  click: [0.45, 0, 520, 0, 0.01, 0.04, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0.01],
  hover: [0.15, 0, 900, 0, 0.004, 0.02, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5],
  coin: [0.55, 0, 988, 0, 0.04, 0.22, 1, 1.5, 0, 0, 330, 0.06, 0, 0, 0, 0, 0, 0.7, 0.03],
  xp: [0.35, 0, 660, 0, 0.03, 0.12, 1, 1.4, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0.02],
  levelUp: [0.55, 0, 440, 0.02, 0.18, 0.35, 1, 1, 0, 0, 220, 0.08, 0.08, 0, 0, 0, 0, 0.8, 0.06],
  achievement: [0.55, 0, 587, 0.01, 0.2, 0.4, 2, 1.2, 0, 0, 293, 0.1, 0.1, 0, 0, 0, 0.05, 0.7, 0.05],
  open: [0.35, 0, 300, 0, 0.04, 0.1, 1, 1, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0.7],
  close: [0.35, 0, 520, 0, 0.03, 0.1, 1, 1, -10, 0, 0, 0, 0, 0, 0, 0, 0, 0.7],
  error: [0.45, 0, 140, 0, 0.08, 0.18, 2, 1.5, -2, 0, 0, 0, 0, 0.3, 0, 0, 0, 0.6],
  whoosh: [0.3, 0.1, 180, 0.03, 0.06, 0.22, 0, 1, 8, 0, 0, 0, 0, 4, 0, 0, 0, 0.5],
  stretch: [0.3, 0, 220, 0.01, 0.12, 0.08, 1, 1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0.6],
  thud: [0.55, 0, 80, 0, 0.02, 0.18, 0, 1.2, -6, 0, 0, 0, 0, 0.4, 0, 0, 0, 0.5],
  pop: [0.4, 0, 700, 0, 0.01, 0.06, 0, 2, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0.5],
  blip: [0.12, 0.02, 1200, 0, 0.003, 0.015, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5],
  insertCoin: [0.55, 0, 1047, 0, 0.05, 0.25, 1, 1, 0, 0, 523, 0.05, 0, 0, 0, 0, 0, 0.7, 0.02],
  powerUp: [0.45, 0, 300, 0.01, 0.2, 0.25, 1, 1, 14, 0, 0, 0, 0.06, 0, 0, 0, 0, 0.7],
  countdown: [0.35, 0, 440, 0, 0.06, 0.1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.8],
  win: [0.55, 0, 523, 0.02, 0.25, 0.5, 1, 1, 0, 0, 262, 0.12, 0.12, 0, 0, 0, 0, 0.8, 0.05],
  lose: [0.45, 0, 300, 0.02, 0.2, 0.4, 2, 1, -4, 0, 0, 0, 0, 0.1, 0, 0, 0, 0.6, 0.1],
  // PART 5: a short square-ish pluck for the playable name letters (pitch = the note) and a metallic coin-slot clink
  note: [0.3, 0, 523.25, 0, 0.02, 0.16, 1, 1.8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.55, 0.02],
  clink: [0.5, 0.02, 1568, 0, 0.01, 0.09, 1, 0.4, 0, 0, 784, 0.03, 0, 0.1, 0, 0, 0.03, 0.4, 0.01],
  // PART 8: a rubbery downward squelch (token squeeze) and a quick rising three-note fanfare (a quest's checklist done)
  squish: [0.4, 0.05, 240, 0.01, 0.05, 0.16, 0, 1.6, -14, 0, 0, 0, 0, 0.6, 2, 0, 0, 0.5, 0.03],
  fanfare: [0.5, 0, 659, 0.01, 0.1, 0.24, 1, 1, 0, 0, 330, 0.06, 0.06, 0, 0, 0, 0, 0.75, 0.04],
};
