"use client";

import dynamic from "next/dynamic";
import { orNothing } from "@/lib/chunks";
import type { ArcadeData } from "@/content/arcade";
import type { BootScript } from "@/content/boot";
import type { EggData } from "@/content/eggs";
import type { ByteScript } from "@/content/quips";

// a runtime that can't load leaves the server-rendered page as it is (PART 18) — every word of it is already there
const GameRuntime = dynamic(() => import("./GameRuntime").catch(orNothing(null)), { ssr: false });
// Boot pages: start fetching the boot screen in parallel with the runtime (it must reach INSERT COIN in ≤ 3.5s).
if (typeof document !== "undefined" && document.documentElement.hasAttribute("data-boot")) void import("@/components/boot/Boot").catch(() => {});

/** Loads the game runtime after hydration (client-only) — keeps zustand, the registries and the HUD out of first load. */
export function GameRuntimeLoader(props: { resumeHref: string | null; byteScript: ByteScript; bootScript: BootScript; arcade: ArcadeData; eggs: EggData }) {
  return <GameRuntime {...props} />;
}
