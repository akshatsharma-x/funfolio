"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import type { TrophyKind } from "@/content/content";
import type { HallCanvasProps } from "@/components/three/HallCanvas";
import { hall } from "@/lib/hall";
import { useHtmlAttribute } from "@/lib/hooks/useHtmlAttribute";
import { useQualityTier } from "@/lib/hooks/useQualityTier";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * The Hall of Fame's stage (PART 14). Server-rendered with the pedestal buttons and their CSS-3D medallions (children)
 * — the hall on the LOW / NONE tiers, without JS and in Speedrun Mode. On the HIGH tier the 3D hall loads when the
 * stage nears the viewport, draws only while it's on screen (unpaused, awake, no game open) and unmounts beyond a
 * viewport; `data-live` swaps the medallions for the 3D trophies once the first frame is in. The world's only canvas.
 */
export function HallStage({ slots, children }: { slots: { id: string; kind: TrophyKind }[]; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const { tier } = useQualityTier();
  const reduced = useReducedMotion();
  const mode = useHtmlAttribute("data-mode", "play");
  const pauseMenu = useHtmlAttribute("data-paused", "no") !== "no";
  const gameOpen = useHtmlAttribute("data-game-open", "no") !== "no";
  const idle = useHtmlAttribute("data-idle", "no") !== "no";
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [Hall, setHall] = useState<ComponentType<HallCanvasProps> | null>(null);
  const [live, setLive] = useState(false);
  const [lost, setLost] = useState(false);
  const want = mode !== "speedrun" && tier === "high" && !lost;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const nearIO = new IntersectionObserver(
      ([e]) => {
        setNear(e.isIntersecting);
        if (!e.isIntersecting) setLive(false); // the canvas unmounts: the medallions are the hall until it draws again
      },
      { rootMargin: "100% 0px" },
    );
    const seeIO = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    nearIO.observe(el);
    seeIO.observe(el);
    return () => {
      nearIO.disconnect();
      seeIO.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!want || !near || Hall) return;
    let cancelled = false;
    import("@/components/three/HallCanvas")
      .then((m) => {
        if (!cancelled) setHall(() => m.default);
      })
      .catch(() => setLost(true));
    return () => {
      cancelled = true;
    };
  }, [want, near, Hall]);

  const show = want && near && Hall;
  const on = !!show && live;
  useEffect(() => {
    hall.set({ live: on });
  }, [on]);

  return (
    <div ref={root} className="hall__stage" data-live={on ? "" : undefined}>
      {show ? (
        <div className="hall__canvas" aria-hidden="true">
          <Hall
            slots={slots}
            running={visible && !pauseMenu && !gameOpen && !idle}
            still={reduced}
            low={false}
            onReady={() => setLive(true)}
            onLost={() => {
              setLost(true);
              setLive(false);
            }}
          />
        </div>
      ) : null}
      {children}
    </div>
  );
}
