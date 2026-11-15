"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useUi } from "@/lib/ui";
import { ToastHost, LevelUpBanner, SpeedrunPill, XpGhosts } from "./Feedback";
import { Hud } from "./Hud";
import { LevelRail } from "./LevelRail";
import {
  useBusWiring,
  useCommandHandler,
  useDocumentSync,
  useKeyboardShortcuts,
  useStatsTracker,
  useWorldTracker,
} from "./useGameRuntime";

const PauseMenu = dynamic(() => import("./PauseMenu"), { ssr: false });

/**
 * The game layer every world plugs into (PART 3). Client-only and lazy (GameRuntimeLoader), so the store, registries
 * and HUD never block first paint — all real content is already server-rendered underneath.
 */
export default function GameRuntime({ resumeHref }: { resumeHref: string | null }) {
  // The root layout (and so this runtime) survives client-side navigations — re-scan worlds per route.
  const pathname = usePathname();
  const home = pathname === "/";
  useDocumentSync();
  useCommandHandler(resumeHref);
  useKeyboardShortcuts();
  useWorldTracker(pathname);
  useStatsTracker();
  useBusWiring();
  const pauseOpen = useUi((s) => s.pauseOpen);
  const pauseEverOpened = useUi((s) => s.pauseEverOpened);

  return (
    <>
      <Hud />
      {home ? <LevelRail /> : null}
      <ToastHost />
      <LevelUpBanner />
      <XpGhosts />
      <SpeedrunPill />
      {pauseEverOpened ? <PauseMenu open={pauseOpen} resumeHref={resumeHref} /> : null}
    </>
  );
}
