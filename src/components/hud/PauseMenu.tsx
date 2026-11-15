"use client";

import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { bus } from "@/lib/bus";
import { useUi, type PauseTab } from "@/lib/ui";
import {
  AchievementsPanel,
  ControlsPanel,
  MapPanel,
  PatchNotesPanel,
  ResetPanel,
  ResumePanel,
  SaveFilePanel,
  SettingsPanel,
} from "./PausePanels";

/**
 * Pause menu (PART 3 #8). Native <dialog> (focus trap, Esc, blurred backdrop, scroll lock) + a vertical tab menu.
 * Opening it sets <html data-paused> (idle loops freeze) and emits game:pause so games pause too.
 * Loaded lazily on first open (see GameRuntime).
 */
export default function PauseMenu({ open, resumeHref }: { open: boolean; resumeHref: string | null }) {
  const tab = useUi((s) => s.pauseTab);
  const setTab = useUi((s) => s.setPauseTab);
  const close = useUi((s) => s.closePause);

  useEffect(() => {
    const root = document.documentElement;
    if (open) {
      root.setAttribute("data-paused", "");
      bus.emit("game:pause", {});
    } else if (root.hasAttribute("data-paused")) {
      root.removeAttribute("data-paused");
      bus.emit("game:resume", {});
    }
  }, [open]);

  const tabs: TabItem[] = [
    { id: "resume", label: "Resume", icon: "controller", content: <ResumePanel onResume={close} /> },
    { id: "map", label: "Map", icon: "map", content: <MapPanel onJump={close} /> },
    { id: "achievements", label: "Achievements", icon: "trophy", content: <AchievementsPanel /> },
    { id: "settings", label: "Settings", icon: "gear", content: <SettingsPanel /> },
    { id: "controls", label: "Controls", icon: "key", content: <ControlsPanel /> },
    { id: "patch", label: "Patch notes", icon: "scroll", content: <PatchNotesPanel active={open && tab === "patch"} /> },
    { id: "save", label: "Save file", icon: "chest", content: <SaveFilePanel resumeHref={resumeHref} /> },
    { id: "reset", label: "Reset save", icon: "bug", content: <ResetPanel /> },
  ];

  return (
    <Modal open={open} onClose={close} title="Paused" size="lg" description="Game menu · Esc to resume.">
      <Tabs label="Pause menu" orientation="vertical" value={tab} onChange={(id) => setTab(id as PauseTab)} tabs={tabs} />
    </Modal>
  );
}
