"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ByteScript } from "@/content/quips";
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

/**
 * The game layer every world plugs into (PART 3). Client-only and lazy (GameRuntimeLoader), so the store, registries
 * and HUD never block first paint — all real content is already server-rendered underneath.
 */
export default function GameRuntime({ resumeHref, byteScript }: { resumeHref: string | null; byteScript: ByteScript }) {
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
      {pauseEverOpened ? <PauseMenu open={pauseOpen} resumeHref={resumeHref} /> : null}
    </>
  );
}
