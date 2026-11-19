"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ArcadeData } from "@/content/arcade";
import type { BootScript } from "@/content/boot";
import type { ByteScript } from "@/content/quips";
import type { EggData } from "@/content/eggs";
import { bus } from "@/lib/bus";
import { useHtmlAttribute } from "@/lib/hooks/useHtmlAttribute";
import { useSave } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { ToastHost, LevelUpBanner, SpeedrunPill, XpGhosts } from "./Feedback";
import { HandheldPad } from "./HandheldPad";
import { Hud } from "./Hud";
import { LevelRail } from "./LevelRail";
import {
  useBusWiring,
  useCommandHandler,
  useDocumentSync,
  useIdleNap,
  useOffscreenPause,
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
// PART 11 — the arcade's game host (any page) and the live Prize Counter for the Arcade's booth
const GameHost = dynamic(() => import("@/components/games/GameHost"), { ssr: false });
const PrizeCounter = dynamic(() => import("@/components/prizes/PrizeCounter"), { ssr: false });
// PART 14 — the visitor's trophy shelf in the Trophy Room (live from the save file)
const TrophyShelf = dynamic(() => import("@/components/trophies/TrophyShelf"), { ssr: false });
// PART 15 — YOUR RUN in the credits (live from the save file)
const CreditsRun = dynamic(() => import("@/components/credits/CreditsRun"), { ssr: false });
// PART 16 — the eggs (one provider, every listener once; effects load on first use) and the AKSHAT-OS terminal
const EggProvider = dynamic(() => import("@/components/eggs/EggProvider"), { ssr: false });
const Terminal = dynamic(() => import("@/components/terminal/Terminal"), { ssr: false });

/** The booth beside the cabinets is server-rendered (a static price list); the live counter is portaled into it. */
function PrizeBooth({ pathname }: { pathname: string }) {
  const el = useMemo(() => (pathname && typeof document !== "undefined" ? document.getElementById("prize-counter-live") : null), [pathname]);
  return el ? createPortal(<PrizeCounter variant="booth" />, el) : null;
}

/** The Trophy Room's shelf is server-rendered (every achievement locked); the live one is portaled over it. */
function TrophyShelfMount({ pathname }: { pathname: string }) {
  const el = useMemo(() => (pathname && typeof document !== "undefined" ? document.getElementById("trophy-shelf-live") : null), [pathname]);
  return el ? createPortal(<TrophyShelf />, el) : null;
}

/** The credits' YOUR RUN is a server-rendered placeholder; the live panel is portaled into it. */
function CreditsRunMount({ pathname }: { pathname: string }) {
  const el = useMemo(() => (pathname && typeof document !== "undefined" ? document.getElementById("credits-run-live") : null), [pathname]);
  return el ? createPortal(<CreditsRun shareName={el.dataset.shareName ?? ""} />, el) : null;
}

/**
 * The game layer every world plugs into (PART 3). Client-only and lazy (GameRuntimeLoader), so the store, registries
 * and HUD never block first paint — all real content is already server-rendered underneath.
 */
export default function GameRuntime({ resumeHref, byteScript, bootScript, arcade, eggs }: { resumeHref: string | null; byteScript: ByteScript; bootScript: BootScript; arcade: ArcadeData; eggs: EggData }) {
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
  useIdleNap();
  useOffscreenPause();
  const pauseOpen = useUi((s) => s.pauseOpen);
  const pauseEverOpened = useUi((s) => s.pauseEverOpened);
  const gameEverOpened = useUi((s) => s.gameEverOpened);
  const byteVisible = useSave((s) => s.settings.byteVisible);
  const speedrun = useHtmlAttribute("data-mode", "play") === "speedrun";
  const [booting, setBooting] = useState(home && (BOOT_MODE === "full" || BOOT_MODE === "fast"));
  useEffect(() => bus.on("boot:done", () => setBooting(false)), []);
  const terminalOpen = useUi((s) => s.terminalOpen);
  const terminalEverOpened = useUi((s) => s.terminalEverOpened);
  useEffect(() => bus.on("terminal:toggle", () => useUi.getState().setTerminal("toggle")), []);

  return (
    <>
      <Hud />
      <HandheldPad />
      {home ? <LevelRail /> : null}
      <ToastHost />
      <LevelUpBanner />
      <XpGhosts />
      <SpeedrunPill />
      <FxLayer />
      {byteVisible && !speedrun ? <Byte script={byteScript} /> : null}
      {booting ? <Boot script={bootScript} mode={BOOT_MODE === "fast" ? "fast" : "full"} /> : null}
      {pauseEverOpened ? <PauseMenu open={pauseOpen} resumeHref={resumeHref} /> : null}
      {gameEverOpened ? <GameHost data={arcade} /> : null}
      <PrizeBooth pathname={pathname} />
      <TrophyShelfMount pathname={pathname} />
      <CreditsRunMount pathname={pathname} />
      <EggProvider data={eggs} resumeHref={resumeHref} />
      {terminalEverOpened ? <Terminal data={eggs.terminal} resumeHref={resumeHref} open={terminalOpen} onClose={() => useUi.getState().setTerminal(false)} /> : null}
    </>
  );
}
