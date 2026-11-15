import { SoonPanel } from "@/components/ui/ComingSoon";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { WorldSection } from "./parts";

/** World 5 · BONUS STAGE: THE ARCADE · Mini-games (PARTS 11–12). */
export function ArcadeSection() {
  return (
    <WorldSection id="arcade" world="arcade" labelledBy="arcade-title">
      <WorldHeader world="arcade" id="arcade-title" />
      <SoonPanel>
        <p className="read">
          Mini-games built from real résumé lines are on their way. Every one will be skippable, pausable and playable
          with a keyboard.
        </p>
      </SoonPanel>
    </WorldSection>
  );
}
