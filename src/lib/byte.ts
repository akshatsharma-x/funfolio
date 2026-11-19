// BYTE's public API (PART 4). Any module can make the mascot talk, react or point without importing it: calls go
// over the bus to the mounted <Byte/> (lazy, client-only). When BYTE is hidden (Settings, Speedrun Mode) they are no-ops.
// Speech bubbles are decorative (aria-hidden) — anything important must also exist in the page content.

import { bus } from "./bus";

export const BYTE_MOODS = ["idle", "happy", "surprised", "love", "sleepy", "dizzy", "cool", "thinking"] as const;
export type ByteMood = (typeof BYTE_MOODS)[number];

export type SayOptions = {
  mood?: ByteMood;
  /** How long the finished bubble stays (default: 2.4s + 45ms per character). */
  ms?: number;
  /** A direct reaction to what the visitor just did: cut in instead of queueing behind the current line. */
  now?: boolean;
};

export const byte = {
  say(text: string, opts: SayOptions = {}): void {
    bus.emit("byte:say", { text, ...opts });
  },
  react(mood: ByteMood): void {
    bus.emit("byte:react", { mood });
  },
  /** Looks and points at an element (it gets a short highlight ring). */
  point(selector: string): void {
    bus.emit("byte:point", { selector });
  },
  /**
   * Flies next to an element for a moment — a high-five — then glides home. Never lands on anything clickable; under
   * reduced motion, on phones or with no free spot it answers from where it is.
   */
  visit(selector: string, text?: string): void {
    bus.emit("byte:visit", { selector, text });
  },
  /**
   * Re-checks that BYTE covers nothing clickable — after controls appear without a scroll or a layout change (a
   * transform-only pop-in, a card opening). Scrolls and resizes already trigger the check.
   */
  recheck(): void {
    bus.emit("byte:recheck", {});
  },
  /** A jetpack flame and a happy hop while the page scrolls back to the top (the credits' ▲ Back to top). */
  jetpack(): void {
    bus.emit("byte:jetpack", {});
  },
};
