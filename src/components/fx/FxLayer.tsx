"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { registerFx, registerGrid } from "@/lib/juice";
import { startClickJuice } from "./clickJuice";
import { startDecor } from "./decor";
import { createFxEngine } from "./engine";
import { createGrid } from "./grid";
import { startWorldIntros } from "./intros";
import { startTickers } from "./tickers";

/**
 * The FX layer (PART 4), lazy and client-only: the living grid (behind content), gutter decor, the ONE FX overlay
 * canvas (above the HUD, below the top layer), click juice, ticker motion and WorldHeader intros.
 * Under reduced motion only the click counter runs (button-masher still counts); the static CSS grid stays.
 */
export default function FxLayer() {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const fxRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLCanvasElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = fxRef.current;
    const gridCanvas = gridRef.current;
    if (reduced || !canvas || !gridCanvas) return;
    const engine = createFxEngine(canvas, { shakeTargets: () => [gridCanvas] });
    const grid = createGrid(gridCanvas);
    registerFx(engine);
    registerGrid(grid);
    return () => {
      registerFx(null);
      registerGrid(null);
      engine.destroy();
      grid.destroy();
    };
  }, [reduced]);

  useEffect(() => startClickJuice(), []);

  useEffect(() => {
    const layer = decorRef.current;
    if (reduced || !layer) return;
    return startDecor(layer);
  }, [reduced]);

  useEffect(() => (reduced ? undefined : startTickers()), [reduced, pathname]);
  useEffect(() => startWorldIntros(), [pathname]);

  if (reduced) return null;
  return (
    <>
      <canvas ref={gridRef} className="fx-grid" data-fx-grid="" aria-hidden="true" />
      <div ref={decorRef} className="fx-decor" data-speedrun="hide" aria-hidden="true" />
      <canvas ref={fxRef} className="fx-canvas" data-fx-canvas="" aria-hidden="true" />
    </>
  );
}
