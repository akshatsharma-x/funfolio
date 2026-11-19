// The 404 page's countdown (PART 15), loaded after hydration by GameOverFx — the root not-found boundary's client code
// ships with every page, so the page itself keeps to plain markup and this tiny loader.
import { command } from "@/lib/commands";
import { sfx } from "@/lib/sfx";

const FROM = 10;

/**
 * CONTINUE? 10…0, then home. It stops on "Stop the countdown", on any key or click (someone is using the page — never
 * yank it away, WCAG 2.2.1) and when a game opens; the status is announced once at the start and once when it stops,
 * not every second. Finding the page unlocks Game Over. "Play a quick round of Bug Whack" opens the game host.
 */
export function runGameOver(root: HTMLElement): () => void {
  const num = root.querySelector<HTMLElement>("[data-count]");
  const status = root.querySelector<HTMLElement>("[data-count-status]");
  const box = root.querySelector<HTMLElement>("[data-gameover-continue]");
  const stopBtn = root.querySelector<HTMLButtonElement>("[data-gameover-stop]");
  const playBtn = root.querySelector<HTMLButtonElement>("[data-gameover-play]");
  command({ type: "achievement", id: "game-over" });
  let n = FROM;
  let stopped = false;
  const say = (text: string) => {
    if (status) status.textContent = text;
  };
  const stop = (why: string) => {
    if (stopped) return;
    stopped = true;
    window.clearInterval(timer);
    box?.setAttribute("data-stopped", "");
    if (stopBtn) stopBtn.hidden = true;
    say(why);
  };
  say(`Page not found. Going back to the start in ${FROM} seconds — press Stop the countdown to stay.`);
  const timer = window.setInterval(() => {
    n -= 1;
    if (num) num.textContent = String(n);
    box?.style.setProperty("--left", String(n));
    if (n > 0) {
      sfx.play("countdown", { pitch: 0.8 + (FROM - n) * 0.04 });
      return;
    }
    window.clearInterval(timer);
    stopped = true;
    // a full load, not a client-side push: the home page's pre-paint script (boot, gates, theme) has to run
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    location.assign("/");
  }, 1000);
  const onStop = () => {
    sfx.play("click");
    stop("Countdown stopped. Take your time — Continue goes back to the start.");
  };
  const onPlay = () => {
    sfx.play("click");
    // Safari doesn't focus a clicked button: the game dialog needs something to give focus back to (#132)
    if (document.activeElement !== playBtn) playBtn?.focus({ preventScroll: true });
    stop("Countdown stopped. Have fun — Continue goes back to the start.");
    command({ type: "openGame", id: "bug-whack" });
  };
  stopBtn?.addEventListener("click", onStop);
  playBtn?.addEventListener("click", onPlay);
  // any key or click on the page: someone's here — but not the countdown's own controls, which act themselves
  const onInput = (e: Event) => {
    if (e.target instanceof Element && e.target.closest("[data-gameover-stop], [data-gameover-play], a[href='/']")) return;
    stop("Countdown stopped. Continue goes back to the start whenever you're ready.");
  };
  window.addEventListener("keydown", onInput, { capture: true });
  window.addEventListener("pointerdown", onInput, { capture: true });
  return () => {
    window.clearInterval(timer);
    stopBtn?.removeEventListener("click", onStop);
    playBtn?.removeEventListener("click", onPlay);
    window.removeEventListener("keydown", onInput, { capture: true });
    window.removeEventListener("pointerdown", onInput, { capture: true });
  };
}
