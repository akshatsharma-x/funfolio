import type { Metadata } from "next";
import { GameOverFx } from "@/components/system/GameOverFx";
import { PixelIcon } from "@/components/ui/PixelIcon";

export const metadata: Metadata = {
  title: "Game over · Page not found",
  robots: { index: false, follow: true },
};

/**
 * 404 · GAME OVER (PART 15), exported as a static 404.html. "CONTINUE? 10…9…8" counts down to the home page — the
 * island stops it on any key or click, and "Stop the countdown" stops it outright (WCAG 2.2.1); CONTINUE ▶ goes home
 * now; a quick round of Bug Whack opens in the game host. Finding this page unlocks Game Over.
 */
export default function NotFound() {
  return (
    <main id="main" className="gameover" data-gameover="">
      <div className="shell gameover__shell">
        <p className="gameover__code">404 · Page not found</p>
        <h1 className="gameover__title">Game over</h1>
        <p className="gameover__lead">This level doesn&apos;t exist — the link may be old, or the address has a typo.</p>
        <div className="gameover__continue" data-needs-js="" data-gameover-continue="">
          <p className="gameover__count" aria-hidden="true">
            Continue? <span className="gameover__num" data-count="">10</span>
          </p>
          <ol className="gameover__dots" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <li key={i} />
            ))}
          </ol>
          <p className="sr-only" aria-live="polite" data-count-status="" />
        </div>
        {/* ArcadeButton's markup, server-rendered: the root not-found boundary's client code ships with every page */}
        <div className="gameover__actions">
          {/* a full load, not a client-side push: the home page's pre-paint script (boot, gates, theme) has to run */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="arcade-btn" data-size="lg" href="/">
            <PixelIcon name="controller" size={16} mono />
            Continue ▶
          </a>
          <button type="button" className="arcade-btn" data-variant="secondary" data-needs-js="" data-gameover-stop="">
            Stop the countdown
          </button>
          <button type="button" className="arcade-btn" data-variant="secondary" data-needs-js="" data-gameover-play="">
            <PixelIcon name="bug" size={16} mono />
            Play a quick round of Bug Whack
          </button>
        </div>
      </div>
      <GameOverFx />
    </main>
  );
}
