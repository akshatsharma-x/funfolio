// Smooth scrolling (Bible §4): Lenis on its own sleeping rAF loop; GSAP ScrollTrigger on demand (loadScrollTrigger).
// Off under reduced motion (the caller decides). Lenis, GSAP and ScrollTrigger load lazily so they stay out of the
// initial bundle. Same-page anchors are handled here (not by Lenis' `anchors` option) so focus moves to the target
// like a native jump — skip links keep working for keyboard and screen-reader users.

import type Lenis from "lenis";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";
import { warp } from "./warp";

let instance: Lenis | null = null;
const listeners = new Set<() => void>();
let lockCount = 0;
let wakeLoop: () => void = () => {};

export type ScrollMotion = { y: number; v: number };
const motionListeners = new Set<(m: ScrollMotion) => void>();

/** Smooth-scroll position + velocity (px per frame) on every Lenis frame — for velocity-linked FX (tickers, decor).
 *  Silent without Lenis (reduced motion), where those effects are static anyway. */
export function onScrollMotion(fn: (m: ScrollMotion) => void): () => void {
  motionListeners.add(fn);
  return () => motionListeners.delete(fn);
}

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

/** Smoothly scrolls to an element (or instantly when Lenis is off), then focuses it. `block: "center"` lands it in the
 *  middle of the screen (a node deep inside a big figure) instead of under the HUD. */
export function scrollToElement(el: HTMLElement, opts: { focus?: boolean; onComplete?: () => void; block?: "start" | "center" } = {}) {
  const done = () => {
    if (opts.focus) focusTarget(el);
    opts.onComplete?.();
  };
  const offset = opts.block === "center" ? -Math.max(HUD_OFFSET, (window.innerHeight - el.getBoundingClientRect().height) / 2) : -HUD_OFFSET;
  if (instance) {
    // Lenis adds an element's offset to where it *thinks* the page is. After a native jump it didn't register (a hash
    // link at load, find-in-page, scrollIntoView) that's stale and the flight lands short — measured: 582px. So resync
    // an idle Lenis to the real position first, and aim at a number from the real geometry.
    if (!instance.isScrolling && Math.abs(instance.animatedScroll - window.scrollY) > 1) instance.scrollTo(window.scrollY, { immediate: true });
    instance.scrollTo(window.scrollY + el.getBoundingClientRect().top + offset, { onComplete: done });
    wakeLoop();
  } else {
    el.scrollIntoView({ block: opts.block ?? "start" });
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
    const { default: LenisCtor } = await import("lenis");
    if (disposed) return;

    const lenis = new LenisCtor({ autoRaf: false, lerp: 0.12, smoothWheel: true });
    // Motion listeners (decor, tickers) run on the next animation frame, never inside a native scroll event:
    // Lenis emits "scroll" synchronously from its native-scroll handler, and style writes there are a
    // scroll-linked effect (janky with async panning; Firefox warns). Coalesced: at most one dispatch per frame.
    let pendingMotion: ScrollMotion | null = null;
    let motionRaf = 0;
    const flushMotion = () => {
      motionRaf = 0;
      const m = pendingMotion;
      pendingMotion = null;
      if (m) motionListeners.forEach((fn) => fn(m));
    };
    const offScroll = lenis.on("scroll", (l: Lenis) => {
      scrollTriggerUpdate?.();
      if (!motionListeners.size) return;
      pendingMotion = { y: l.animatedScroll, v: l.velocity };
      if (!motionRaf) motionRaf = requestAnimationFrame(flushMotion);
    });

    // Own rAF loop that SLEEPS when Lenis is idle (the GSAP ticker would wake the CPU 60×/s forever — PART 4
    // "the CPU idles when nothing moves"). Woken by anything that can start a scroll. Lenis only needs time deltas,
    // so it gets a virtual clock whose steps are clamped: the first frame after a nap is not a huge jump.
    let raf = 0;
    let lastT = 0;
    let virtual = 0;
    let awakeUntil = 0;
    const loop = (t: number) => {
      const dt = lastT ? Math.min(t - lastT, 34) : 16;
      lastT = t;
      virtual += dt;
      lenis.raf(virtual);
      if (lenis.isScrolling || performance.now() < awakeUntil) raf = requestAnimationFrame(loop);
      else {
        raf = 0;
        lastT = 0;
      }
    };
    const wake = () => {
      awakeUntil = performance.now() + 250;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    wakeLoop = wake;
    const wakeEvents = ["wheel", "touchstart", "touchmove", "keydown", "pointerdown", "scroll"] as const;
    wakeEvents.forEach((type) => window.addEventListener(type, wake, { passive: true, capture: true }));
    wake();
    if (lockCount > 0) lenis.stop();
    document.addEventListener("click", onAnchorClick);
    setInstance(lenis);

    teardown = () => {
      document.removeEventListener("click", onAnchorClick);
      wakeEvents.forEach((type) => window.removeEventListener(type, wake, { capture: true }));
      cancelAnimationFrame(raf);
      cancelAnimationFrame(motionRaf);
      wakeLoop = () => {};
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

let scrollTriggerUpdate: (() => void) | null = null;
let scrollTriggerPromise: Promise<typeof ScrollTriggerType> | null = null;

/**
 * GSAP + ScrollTrigger, loaded on first use and kept in sync with Lenis. Not loaded at startup: while enabled,
 * ScrollTrigger keeps a perpetual requestAnimationFrame loop alive, so the page would never idle (PART 4) — the first
 * part that really needs scroll choreography pays for it.
 */
export function loadScrollTrigger(): Promise<typeof ScrollTriggerType> {
  scrollTriggerPromise ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.ticker.lagSmoothing(0);
    scrollTriggerUpdate = () => ScrollTrigger.update();
    return ScrollTrigger;
  });
  return scrollTriggerPromise;
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
    wakeLoop();
    document.documentElement.removeAttribute("data-scroll-lock");
  }
}
