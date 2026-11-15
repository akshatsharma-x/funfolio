import { SoonPanel } from "@/components/ui/ComingSoon";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { WorldSection } from "./parts";

/** World 2A · THE LAUNCHPAD — the optional slingshot gate (PART 7). It never blocks the Quest Log (R3). */
export function LaunchpadSection() {
  return (
    <WorldSection id="launchpad" world="launchpad" labelledBy="launchpad-title" className="pb-8 md:pb-10">
      <WorldHeader world="launchpad" id="launchpad-title" />
      <SoonPanel>
        <p className="read">
          A slingshot mini-game will guard the Quest Log here. It is optional: the full experience list is right below,
          and it always will be.
        </p>
        <p className="mt-3">
          <a href="#quests" className="font-pixel uppercase tracking-wider text-text">
            Skip to the Quest Log ▼
          </a>
        </p>
      </SoonPanel>
    </WorldSection>
  );
}
