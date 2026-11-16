"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import type { GlobeCanvasProps } from "@/components/three/GlobeCanvas";
import { useHtmlAttribute } from "@/lib/hooks/useHtmlAttribute";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useQualityTier } from "@/lib/hooks/useQualityTier";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

type Place = { lat: number; lon: number; label: string; detail?: string };

/**
 * The research-route globe's stage (PART 9). Server-rendered with the flat SVG route map (children) — the view
 * without JS, on the LOW / NONE tiers, on touch-first devices and in Speedrun Mode (where the whole stage hides). On
 * HIGH tier with a fine pointer the 3D globe loads when the stage nears the viewport, renders only while it's on
 * screen (unpaused, awake), and unmounts again beyond a viewport. Auto-spin has a Pause toggle (WCAG 2.2.2).
 */
export function GlobeStage({ route, caption, children }: { route: { from: Place; to: Place }; caption: ReactNode; children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const fromLabel = useRef<HTMLSpanElement>(null);
  const toLabel = useRef<HTMLSpanElement>(null);
  const { tier } = useQualityTier();
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const mode = useHtmlAttribute("data-mode", "play");
  const paused = useHtmlAttribute("data-paused", "no") !== "no";
  const idle = useHtmlAttribute("data-idle", "no") !== "no";
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [Globe, setGlobe] = useState<ComponentType<GlobeCanvasProps> | null>(null);
  const [live, setLive] = useState(false);
  const [lost, setLost] = useState(false);
  const [spin, setSpin] = useState(true);
  const [recenter, setRecenter] = useState(0);
  const want = mode !== "speedrun" && tier === "high" && fine && !lost;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const nearIO = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "100% 0px" });
    const seeIO = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    nearIO.observe(el);
    seeIO.observe(el);
    return () => {
      nearIO.disconnect();
      seeIO.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!want || !near || Globe) return;
    let cancelled = false;
    import("@/components/three/GlobeCanvas")
      .then((m) => {
        if (!cancelled) setGlobe(() => m.default);
      })
      .catch(() => setLost(true));
    return () => {
      cancelled = true;
    };
  }, [want, near, Globe]);

  const show = want && near && Globe;
  const on = !!show && live;
  return (
    <figure ref={root} className="globe-stage" data-live={on ? "" : undefined} data-speedrun="hide">
      <div className="globe-stage__view">
        <div className="globe-stage__map">{children}</div>
        {show ? (
          <Globe
            route={route}
            running={visible && !paused && !idle}
            still={reduced}
            spin={spin}
            recenter={recenter}
            labels={{ from: fromLabel, to: toLabel }}
            onReady={() => setLive(true)}
            onLost={() => {
              setLost(true);
              setLive(false);
            }}
          />
        ) : null}
        <div className="globe-stage__labels" aria-hidden="true">
          <span ref={fromLabel} className="globe-label">
            <span className="globe-label__title">{route.from.label}</span>
          </span>
          <span ref={toLabel} className="globe-label globe-label--to">
            <span className="globe-label__title">{route.to.label}</span>
            {route.to.detail ? <span className="globe-label__detail">{route.to.detail}</span> : null}
          </span>
        </div>
        {on ? (
          <div className="globe-stage__controls">
          {!reduced ? (
            <button type="button" className="globe-btn" aria-pressed={!spin} onClick={() => setSpin((s) => !s)}>
              Pause spin
            </button>
          ) : null}
            <button type="button" className="globe-btn" onClick={() => setRecenter((n) => n + 1)}>
              Show the route
            </button>
          </div>
        ) : null}
      </div>
      <figcaption className="globe-stage__caption">{caption}</figcaption>
    </figure>
  );
}
