// Smooth scrolling (Bible §4): Lenis driven by the GSAP ticker, ScrollTrigger kept in sync.
// Off under reduced motion (the caller decides). Lenis, GSAP and ScrollTrigger load lazily so they stay out of the
// initial bundle. Same-page anchors are handled here (not by Lenis' `anchors` option) so focus moves to the target
// like a native jump — skip links keep working for keyboard and screen-reader users.

import type Lenis from "lenis";
import { warp } from "./warp";

let instance: Lenis | null = null;
const listeners = new Set<() => void>();
let lockCount = 0;

function setInstance(next: Lenis | null) {
  instance = next;
  listeners.forEach((fn) => fn());
}

export function getLenis(): Lenis | null {
  return instance;
}

export function subscribeLenis(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Moves focus to an in-page target without a second jump (adds tabindex=-1 when the target isn't focusable). */
function focusTarget(el: HTMLElement) {
  if (!el.matches("a[href], button, input, select, textarea, [tabindex]")) {
    el.setAttribute("tabindex", "-1");
    el.setAttribute("data-scroll-target", "");
  }
  el.focus({ preventScroll: true });
}

/** Space kept clear for the fixed HUD (56px) when jumping to a target. */
export const HUD_OFFSET = 64;

/** Smoothly scrolls to an element (or instantly when Lenis is off), then focuses it. */
export function scrollToElement(el: HTMLElement, opts: { focus?: boolean } = {}) {
  const done = () => {
    if (opts.focus) focusTarget(el);
  };
  if (instance) {
    instance.scrollTo(el, { offset: -HUD_OFFSET, onComplete: done });
  } else {
    el.scrollIntoView({ block: "start" });
    done();
  }
}

function onAnchorClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element | null)?.closest?.("a[href^='#']");
  if (!(link instanceof HTMLAnchorElement)) return;
  const id = decodeURIComponent(link.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  event.preventDefault();
  history.pushState(null, "", `#${id}`);
  if (link.hasAttribute("data-warp")) warp();
  scrollToElement(target, { focus: true });
}

/** Starts Lenis + GSAP ticker sync. Returns a cleanup function (safe to call before the lazy imports resolve). */
export function startSmoothScroll(): () => void {
  let disposed = false;
  let teardown = () => {};

  void (async () => {
    const [{ default: LenisCtor }, { gsap }, { ScrollTrigger }] = await Promise.all([
      import("lenis"),
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]);
    if (disposed) return;

    gsap.registerPlugin(ScrollTrigger);
    const lenis = new LenisCtor({ autoRaf: false, lerp: 0.12, smoothWheel: true });
    const offScroll = lenis.on("scroll", () => ScrollTrigger.update());
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    if (lockCount > 0) lenis.stop();
    document.addEventListener("click", onAnchorClick);
    setInstance(lenis);

    teardown = () => {
      document.removeEventListener("click", onAnchorClick);
      gsap.ticker.remove(tick);
      offScroll();
      lenis.destroy();
      setInstance(null);
    };
  })();

  return () => {
    disposed = true;
    teardown();
  };
}

/** Ref-counted scroll lock for modals/games. Keeps Lenis in sync (stop/start) and blocks native scroll. */
export function lockScroll() {
  lockCount += 1;
  if (lockCount === 1) {
    instance?.stop();
    document.documentElement.setAttribute("data-scroll-lock", "");
  }
}

export function unlockScroll() {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    instance?.start();
    document.documentElement.removeAttribute("data-scroll-lock");
  }
}
