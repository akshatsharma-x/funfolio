"use client";

import dynamic from "next/dynamic";

const GameRuntime = dynamic(() => import("./GameRuntime"), { ssr: false });

/** Loads the game runtime after hydration (client-only) — keeps zustand, the registries and the HUD out of first load. */
export function GameRuntimeLoader({ resumeHref }: { resumeHref: string | null }) {
  return <GameRuntime resumeHref={resumeHref} />;
}
