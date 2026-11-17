"use client";

import dynamic from "next/dynamic";
import type { ArcadeData } from "@/content/arcade";
import type { BootScript } from "@/content/boot";
import type { ByteScript } from "@/content/quips";

const GameRuntime = dynamic(() => import("./GameRuntime"), { ssr: false });
// Boot pages: start fetching the boot screen in parallel with the runtime (it must reach INSERT COIN in ≤ 3.5s).
if (typeof document !== "undefined" && document.documentElement.hasAttribute("data-boot")) void import("@/components/boot/Boot");

/** Loads the game runtime after hydration (client-only) — keeps zustand, the registries and the HUD out of first load. */
export function GameRuntimeLoader(props: { resumeHref: string | null; byteScript: ByteScript; bootScript: BootScript; arcade: ArcadeData }) {
  return <GameRuntime {...props} />;
}
