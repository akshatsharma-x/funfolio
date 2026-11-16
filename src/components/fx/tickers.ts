// LED ticker dividers (PART 4 #5) — the markup + marquee are server-rendered CSS (TickerDivider); this only couples
// them to scroll velocity: playback rate (Web Animations updatePlaybackRate — no jump) and a skew, both easing back to
// rest ~150ms after scrolling stops. Hover pauses (CSS). Nothing runs while the page is still.

import { onScrollMotion } from "@/lib/scroll";

export function startTickers(): () => void {
  const tickers = Array.from(document.querySelectorAll<HTMLElement>("[data-ticker]"));
  const tracks = tickers.map((t) => t.querySelector<HTMLElement>("[data-ticker-track]")).filter((t): t is HTMLElement => !!t);
  if (!tracks.length) return () => {};
  // only the marquee itself — getAnimations() also returns the skew's CSS transition while scrolling
  const anims = () => tracks.flatMap((t) => t.getAnimations().filter((a) => (a as CSSAnimation).animationName === "ticker-scroll"));
  let settleTimer = 0;
  let resting = true;

  const apply = (rate: number, skew: number) => {
    for (const a of anims()) a.updatePlaybackRate(rate);
    for (const t of tickers) t.style.setProperty("--ticker-skew", `${skew.toFixed(2)}deg`);
  };

  const off = onScrollMotion(({ v }) => {
    const rate = 1 + Math.min(4, Math.abs(v) * 0.08);
    const skew = Math.max(-9, Math.min(9, -v * 0.22));
    apply(rate, skew);
    resting = false;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      apply(1, 0);
      resting = true;
    }, 150);
  });

  return () => {
    off();
    window.clearTimeout(settleTimer);
    if (!resting) apply(1, 0);
  };
}
