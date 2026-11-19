import { SkipLink } from "@/components/ui/SkipLink";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { LaunchpadPoster } from "./launchpad/LaunchpadPoster";
import { LaunchpadStage } from "./launchpad/LaunchpadStage";
import { WorldSection } from "./parts";

/**
 * World 2A · THE LAUNCHPAD · Gate to Experience (PART 7): a slingshot stage in front of the Quest Log. A soft gate —
 * the whole experience list is server-rendered right below and never needs this game (R3).
 */
export function LaunchpadSection() {
  return (
    <WorldSection id="launchpad" world="launchpad" labelledBy="launchpad-title" className="pb-8 md:pb-10">
      <WorldHeader world="launchpad" id="launchpad-title">
        <p className="read text-muted">
          Pull BYTE back on the launcher and fling it into the Bug Fortress — pop every bug to unlock the Quest Log. Or
          press Skip: the whole experience list is right below.
        </p>
      </WorldHeader>
      <div className="relative">
        <SkipLink to="quests">Skip mini-game</SkipLink>
        <LaunchpadStage poster={<LaunchpadPoster />} />
      </div>
    </WorldSection>
  );
}
