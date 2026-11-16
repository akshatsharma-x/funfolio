"use client";

import dynamic from "next/dynamic";
import type { ByteScript } from "@/content/quips";

const GameRuntime = dynamic(() => import("./GameRuntime"), { ssr: false });

/** Loads the game runtime after hydration (client-only) — keeps zustand, the registries and the HUD out of first load. */
export function GameRuntimeLoader({ resumeHref, byteScript }: { resumeHref: string | null; byteScript: ByteScript }) {
  return <GameRuntime resumeHref={resumeHref} byteScript={byteScript} />;
}
