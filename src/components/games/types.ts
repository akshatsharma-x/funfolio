import type { ArcadeData, ArcadeGame } from "@/content/arcade";
import type { SfxName, SfxOptions } from "@/lib/sfx";
import type { FloatTone } from "./engine";

/** What a game hands the shell when a run ends (time up, lives out, or everything done). */
export type GameResult = {
  score: number;
  /** Reached the game's target: coin #9 the first time (any game), and more wallet coins. */
  won: boolean;
  /** The results screen's big line ("Squeezed 24%", "CACHE HIT 100%"). */
  headline: string;
  notes?: string[];
  /** Achievement ids this run earned — the shell unlocks them. */
  achievements?: string[];
};

/** The shell's services. Stable for a game's whole life; ticks run only while it is playing (not paused). */
export type GameApi = {
  /** Fixed 60 Hz game-time steps (ms); returns an unsubscribe. */
  onTick(fn: (dtMs: number) => void): () => void;
  setScore(score: number): void;
  setLives(lives: number | null): void;
  /** Time left (ms) for the HUD; null hides the timer. */
  setTime(ms: number | null): void;
  /** One game-specific HUD readout ("Compression 18%", "Hit rate 67%"). */
  setStat(text: string | null): void;
  end(result: GameResult): void;
  /** A floating word over the playfield, at a point relative to the playfield's box. */
  float(x: number, y: number, text: string, tone?: FloatTone): void;
  /** Screen-reader announcement (lands in the dialog's live region). */
  say(text: string): void;
  sfx(name: SfxName, opts?: SfxOptions): void;
  /** The playfield element (for positioning floaters). */
  field(): HTMLElement | null;
};

export type GameProps = {
  api: GameApi;
  reduced: boolean;
  game: ArcadeGame;
  data: ArcadeData;
  /** A fresh random seed per run (made in the Start click, so rendering stays pure). */
  seed: number;
};
