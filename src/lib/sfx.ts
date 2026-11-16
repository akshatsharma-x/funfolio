// Sound effects (Bible §5). ZzFX wrapper: master volume, mute (OFF by default — R5), AudioContext only after the first
// user gesture, 80ms hover throttle and a global rate limiter so spam-clicks never become noise.
// The game runtime calls sfx.configure() whenever settings change; everything else just calls sfx.play(name).

import { SOUNDS } from "./sounds";

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
  "note",
  "clink",
] as const;

export type SfxName = (typeof SFX_NAMES)[number];
/** pitch: frequency multiplier (e.g. the slingshot "stretch" follows the pull) · volume: per-call gain 0..1. */
export type SfxOptions = { pitch?: number; volume?: number };

type Engine = typeof import("zzfx");

const BASE_VOLUME = 0.35;
const MIN_GAP: Partial<Record<SfxName, number>> = { hover: 80, blip: 25, stretch: 30, note: 35 };
const DEFAULT_GAP = 45;
const WINDOW_MS = 250;
const WINDOW_MAX = 6;

let enabled = false;
let volume = 0.7;
let gestured = false;
let engine: Engine | null = null;
let loading: Promise<void> | null = null;
/** Sounds requested while ZzFX loads (first play after the gesture); stale ones are dropped. */
let pending: { name: SfxName; opts?: SfxOptions; at: number }[] = [];
const PENDING_MAX = 3;
const PENDING_TTL = 600;
const lastPlayed = new Map<SfxName, number>();
let windowStart = 0;
let windowCount = 0;
let listening = false;

function load(): void {
  if (engine || loading || !gestured) return;
  loading = import("zzfx")
    .then((mod) => {
      engine = mod;
      mod.ZZFX.volume = BASE_VOLUME * volume;
      void mod.ZZFX.audioContext.resume();
      const now = performance.now();
      const queued = pending.filter((p) => now - p.at < PENDING_TTL);
      pending = [];
      for (const p of queued) play(p.name, p.opts);
    })
    .catch(() => {
      loading = null; // no audio available — stay silent
    });
}

function onFirstGesture(): void {
  gestured = true;
  window.removeEventListener("pointerdown", onFirstGesture, true);
  window.removeEventListener("keydown", onFirstGesture, true);
  if (enabled) load();
  else void engine?.ZZFX.audioContext.resume();
}

function listenForGesture(): void {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("pointerdown", onFirstGesture, true);
  window.addEventListener("keydown", onFirstGesture, true);
}

function play(name: SfxName, opts?: SfxOptions): void {
  if (!enabled) return;
  if (!engine) {
    if (pending.length < PENDING_MAX) pending.push({ name, opts, at: performance.now() });
    load();
    return;
  }
  const now = performance.now();
  if (now - (lastPlayed.get(name) ?? -Infinity) < (MIN_GAP[name] ?? DEFAULT_GAP)) return;
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    windowCount = 0;
  }
  if (windowCount >= WINDOW_MAX) return;
  windowCount += 1;
  lastPlayed.set(name, now);
  const params = [...SOUNDS[name]];
  if (opts?.pitch) params[2] *= Math.max(0.25, Math.min(4, opts.pitch));
  if (opts?.volume !== undefined) params[0] *= Math.max(0, Math.min(1, opts.volume));
  try {
    engine.ZZFX.playSamples([engine.ZZFX.buildSamples(...params)]);
  } catch {
    // audio device busy/unavailable — never throw from a sound
  }
}

// Listen from the start: the gesture that turns sound ON (a click, Shift+S) must itself count as the first gesture —
// a listener added during that event would miss it. Only the flag is set; ZzFX (and its AudioContext) still loads
// lazily, and only when sound is on.
listenForGesture();

export const sfx = {
  play,
  configure(next: { enabled: boolean; volume: number }): void {
    enabled = next.enabled;
    volume = Math.max(0, Math.min(1, next.volume));
    if (engine) engine.ZZFX.volume = BASE_VOLUME * volume;
    if (enabled) load(); // no-op until the first gesture
  },
  get enabled() {
    return enabled;
  },
};
