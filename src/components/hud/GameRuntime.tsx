"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { BootScript } from "@/content/boot";
import type { ByteScript } from "@/content/quips";
import { bus } from "@/lib/bus";
import { useHtmlAttribute } from "@/lib/hooks/useHtmlAttribute";
import { useSave } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { ToastHost, LevelUpBanner, SpeedrunPill, XpGhosts } from "./Feedback";
import { Hud } from "./Hud";
import { LevelRail } from "./LevelRail";
import {
  useBusWiring,
  useCommandHandler,
  useDocumentSync,
  useKeyboardShortcuts,
  useSpareCoinSync,
  useStatsTracker,
  useWorldTracker,
} from "./useGameRuntime";

const PauseMenu = dynamic(() => import("./PauseMenu"), { ssr: false });
// PART 4 — each its own lazy chunk, so the HUD is never waiting for the effects or the mascot
const FxLayer = dynamic(() => import("@/components/fx/FxLayer"), { ssr: false });
const Byte = dynamic(() => import("@/components/byte/Byte"), { ssr: false });
// PART 5 — the boot screen (its chunk is prefetched by GameRuntimeLoader when the pre-paint script asked for a boot)
const Boot = dynamic(() => import("@/components/boot/Boot"), { ssr: false });
const BOOT_MODE = typeof document === "undefined" ? null : document.documentElement.getAttribute("data-boot");

/**
 * The game layer every world plugs into (PART 3). Client-only and lazy (GameRuntimeLoader), so the store, registries
 * and HUD never block first paint — all real content is already server-rendered underneath.
 */
export default function GameRuntime({ resumeHref, byteScript, bootScript }: { resumeHref: string | null; byteScript: ByteScript; bootScript: BootScript }) {
  // The root layout (and so this runtime) survives client-side navigations — re-scan worlds per route.
  const pathname = usePathname();
  const home = pathname === "/";
  useDocumentSync();
  useCommandHandler(resumeHref);
  useKeyboardShortcuts();
  useWorldTracker(pathname);
  useSpareCoinSync(pathname);
  useStatsTracker();
  useBusWiring();
  const pauseOpen = useUi((s) => s.pauseOpen);
  const pauseEverOpened = useUi((s) => s.pauseEverOpened);
  const byteVisible = useSave((s) => s.settings.byteVisible);
  const speedrun = useHtmlAttribute("data-mode", "play") === "speedrun";
  const [booting, setBooting] = useState(home && (BOOT_MODE === "full" || BOOT_MODE === "fast"));
  useEffect(() => bus.on("boot:done", () => setBooting(false)), []);

  return (
    <>
      <Hud />
      {home ? <LevelRail /> : null}
      <ToastHost />
      <LevelUpBanner />
      <XpGhosts />
      <SpeedrunPill />
      <FxLayer />
      {byteVisible && !speedrun ? <Byte script={byteScript} /> : null}
      {booting ? <Boot script={bootScript} mode={BOOT_MODE === "fast" ? "fast" : "full"} /> : null}
      {pauseEverOpened ? <PauseMenu open={pauseOpen} resumeHref={resumeHref} /> : null}
    </>
  );
}
