"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { LANDMARKS, landmarkAction, landmarkLabel, type LandmarkId } from "@/content/landmarks";
import type { IslandCanvasProps } from "@/components/three/IslandCanvas";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { command } from "@/lib/commands";
import { heroLoad } from "@/lib/heroLoad";
import { useHtmlAttribute } from "@/lib/hooks/useHtmlAttribute";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useQualityTier } from "@/lib/hooks/useQualityTier";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { island } from "@/lib/island";
import { HUD_OFFSET, onScrollMotion, scrollToElement } from "@/lib/scroll";
import { warp } from "@/lib/warp";

type Spots = Record<string, readonly [number, number]>;

/** Labels near the island's edges anchor to that side instead of centering, so they never spill off the page. */
const edgeOf = (x: number | undefined) => (x === undefined ? undefined : x > 64 ? "end" : x < 36 ? "start" : undefined);

/**
 * The Title Screen's overworld island (PART 5). The isometric SVG (children, server-rendered) is the NONE tier, the
 * no-JS view and the loading placeholder; the R3F island (lazy chunk) takes over when the device allows. The landmark
 * buttons are real HTML in both tiers — keyboard + screen readers — and the 3D scene projects them onto its landmarks.
 * Phones start on the SVG and load the LOW tier after the first tap or scroll (docs/DECISIONS.md #2).
 */
export function TitleIsland({ spots, ratio, children }: { spots: Spots; ratio: number; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [spotLayer, setSpotLayer] = useState<HTMLDivElement | null>(null);
  const { tier } = useQualityTier();
  const reduced = useReducedMotion();
  const mode = useHtmlAttribute("data-mode", "play");
  const pauseMenu = useHtmlAttribute("data-paused", "no") !== "no";
  const gameOpen = useHtmlAttribute("data-game-open", "no") !== "no"; // an arcade game covers the page (PART 12)
  const paused = pauseMenu || gameOpen;
  // behind the boot screen the island only renders its warm-up frames (shaders compiled), then waits — and it doesn't
  // even start loading until the boot screen is up (its parse/compile must not delay the boot's first paint)
  const bootAttr = useHtmlAttribute("data-boot", "none");
  const booting = bootAttr !== "none";
  const bootPending = bootAttr === "full" || bootAttr === "fast";
  const wide = useMediaQuery("(min-width: 64rem)");
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const [Canvas3D, setCanvas3D] = useState<ComponentType<IslandCanvasProps> | null>(null);
  const [armed, setArmed] = useState(false); // phones: armed by the first tap/scroll
  const live = useSyncExternalStore(island.subscribe, () => island.get().live, () => false);
  const [near, setNear] = useState(true);
  const [visible, setVisible] = useState(true);
  const [spun, setSpun] = useState(false);
  const [loops, setLoops] = useState(0);
  const [asleep, setAsleep] = useState(false);
  const planeClicks = useRef(0);

  const speedrun = mode === "speedrun";
  const coarse = !fine;
  const want3D = !speedrun && tier !== "none" && (!coarse || armed) && !bootPending;
  const quality: "high" | "low" = tier === "high" && !coarse ? "high" : "low";

  // the island naps after 30s without any input (a tab left open on the Title Screen shouldn't burn battery)
  useEffect(() => {
    let timer = 0;
    const wake = () => {
      setAsleep(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setAsleep(true), 30000);
    };
    const events = ["pointermove", "pointerdown", "keydown", "scroll", "wheel", "touchstart"] as const;
    events.forEach((t) => window.addEventListener(t, wake, { passive: true }));
    timer = window.setTimeout(() => setAsleep(true), 30000);
    return () => {
      window.clearTimeout(timer);
      events.forEach((t) => window.removeEventListener(t, wake));
    };
  }, []);

  // phones: the first tap or scroll arms the 3D island
  useEffect(() => {
    if (!coarse || armed) return;
    const arm = () => setArmed(true);
    window.addEventListener("pointerdown", arm, { once: true, passive: true });
    window.addEventListener("scroll", arm, { once: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("scroll", arm);
    };
  }, [coarse, armed]);

  // load the 3D chunk (the boot screen shows this progress)
  useEffect(() => {
    if (!want3D || Canvas3D) return;
    let cancelled = false;
    const booting = document.documentElement.hasAttribute("data-boot");
    heroLoad.report({ wanted: booting, progress: 0.05 });
    let p = 0.05;
    const creep = window.setInterval(() => {
      p = Math.min(0.55, p + 0.035);
      heroLoad.report({ progress: p });
    }, 80);
    import("@/components/three/IslandCanvas")
      .then((m) => {
        if (cancelled) return;
        heroLoad.report({ progress: 0.6 });
        setCanvas3D(() => m.default);
      })
      .catch(() => heroLoad.report({ wanted: false, done: true }))
      .finally(() => window.clearInterval(creep));
    return () => {
      cancelled = true;
      window.clearInterval(creep);
    };
  }, [want3D, Canvas3D]);

  // mount only within 1.5 viewports; render only while on screen
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const nearIO = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "150% 0px" });
    // a strip left under the HUD doesn't count as on screen (the pinned stage ends right behind it at World 1)
    const seeIO = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: `-${HUD_OFFSET + 16}px 0px 0px 0px` });
    nearIO.observe(el);
    seeIO.observe(el);
    return () => {
      nearIO.disconnect();
      seeIO.disconnect();
    };
  }, []);

  // Scroll-out dive. Wide screens pin the stage ≤ 100vh (`data-pin`) — only with motion, outside Speedrun Mode and
  // when the whole overlay fits the viewport (it wraps taller on narrower windows; a clipped CTA is blocked content,
  // R3). Without the pin there is no dive.
  const allowPin = wide && !reduced && !speedrun;
  useEffect(() => {
    const section = root.current?.closest("section");
    const overlay = section?.querySelector<HTMLElement>(".title__overlay");
    if (!section || !overlay) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = section.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = section.hasAttribute("data-pin") && span > 10 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      island.set({ dive: p });
      section.style.setProperty("--dive", p.toFixed(3));
    };
    const decide = () => {
      section.toggleAttribute("data-pin", allowPin && overlay.offsetHeight + 88 <= window.innerHeight); // 64px top padding + air
      // side by side (wide): where the text column ends, for the plane (see island.ts)
      const right = wide ? Math.max(0, ...[...overlay.children].map((el) => el.getBoundingClientRect().right)) : 0;
      island.set({ textRight: Math.round(right) });
      update();
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const off = onScrollMotion(queue);
    const ro = new ResizeObserver(decide);
    ro.observe(overlay);
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", decide);
    decide();
    return () => {
      off();
      ro.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", decide);
      section.removeAttribute("data-pin");
    };
  }, [allowPin, wide]);

  useEffect(() => island.set({ spun }), [spun]);

  const go = async (id: LandmarkId) => {
    const l = LANDMARKS.find((x) => x.id === id);
    if (!l) return;
    command({ type: "cta", id: `landmark-${id}` });
    await island.go(id);
    const targetId = l.number === 2 ? (document.documentElement.getAttribute("data-mode") === "speedrun" ? "quests" : "launchpad") : l.world;
    const target = document.getElementById(targetId);
    if (target) {
      warp();
      scrollToElement(target, { focus: true });
    }
  };

  const onPlane = () => {
    if (live) {
      island.plane(); // the 3D plane counts and loops
      return;
    }
    planeClicks.current += 1;
    if (planeClicks.current >= 3) {
      planeClicks.current = 0;
      setLoops((n) => n + 1);
      command({ type: "achievement", id: "frequent-flyer" });
    }
  };

  const showCanvas = Canvas3D && near && want3D;
  return (
    <div
      ref={root}
      className="island title__island"
      data-live={live ? "" : undefined}
      data-spun={spun ? "" : undefined}
      data-loop={loops > 0 ? String(loops % 2) : undefined}
      data-speedrun="hide"
      style={{ "--art-ratio": ratio } as CSSProperties}
    >
      <div className="island__art">{children}</div>
      {showCanvas ? (
        <Canvas3D
          tier={quality}
          running={visible && !paused && !asleep && !(booting && live)}
          still={reduced}
          rotate={fine}
          offsetX={wide ? 0.29 : 0}
          hotspots={spotLayer}
          onReady={() => {
            island.set({ live: true });
            heroLoad.report({ done: true });
          }}
        />
      ) : null}
      <div ref={setSpotLayer} className="island__spots" role="group" aria-label="Overworld map — jump to a world">
        {LANDMARKS.map((l) => (
          <button
            key={l.id}
            type="button"
            className="hotspot"
            data-hotspot={l.id}
            data-edge={edgeOf(spots[l.id]?.[0])}
            data-fx-skip=""
            style={{ left: `${spots[l.id]?.[0] ?? 50}%`, top: `${spots[l.id]?.[1] ?? 50}%`, "--hc": l.color } as CSSProperties}
            aria-label={landmarkAction(l)}
            onPointerEnter={() => island.set({ hovered: l.id })}
            onPointerLeave={() => island.set({ hovered: null })}
            onFocus={() => island.set({ hovered: l.id })}
            onBlur={() => island.set({ hovered: null })}
            onClick={() => void go(l.id)}
          >
            <span className="hotspot__label" aria-hidden="true">
              {landmarkLabel(l)}
            </span>
          </button>
        ))}
        <button
          type="button"
          className="hotspot hotspot--plane"
          data-hotspot="plane"
          data-edge={edgeOf(spots.plane?.[0])}
          data-fx-skip=""
          data-loops={loops}
          style={{ left: `${spots.plane?.[0] ?? 80}%`, top: `${spots.plane?.[1] ?? 10}%` } as CSSProperties}
          aria-label="The little plane — click it three times"
          onClick={onPlane}
        >
          <span className="hotspot__label" aria-hidden="true">
            ✈ Plane
          </span>
        </button>
        <button
          type="button"
          className="hotspot hotspot--coin"
          data-hotspot="coin"
          data-edge={edgeOf(spots.coin?.[0])}
          data-coin-id="quest-tower"
          data-coin=""
          data-fx-skip=""
          style={{ left: `${spots.coin?.[0] ?? 40}%`, top: `${spots.coin?.[1] ?? 30}%` } as CSSProperties}
          aria-label="A coin behind the Quest Tower — grab it"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            command({ type: "coin", id: "quest-tower", origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 } });
          }}
        >
          <span className="hotspot__label" aria-hidden="true">
            Tower Coin
          </span>
        </button>
      </div>
      <button type="button" className="island__spin" data-fx-skip="" aria-pressed={spun} onClick={() => setSpun((v) => !v)}>
        <PixelIcon name="map" mono />
        {spun ? "Turn back" : "Peek behind the tower"}
      </button>
    </div>
  );
}
