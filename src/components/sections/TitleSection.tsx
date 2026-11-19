import { player } from "@/content/content";
import { educationShort } from "@/content/derived";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { SaveFileButton } from "./parts";
import { SpeedrunSummary } from "./SpeedrunSummary";
import { ClassLine } from "./title/ClassLine";
import { IslandSvg, islandSvgLayout } from "./title/IslandSvg";
import { TitleIsland } from "./title/TitleIsland";
import { TitleName } from "./title/TitleName";

/**
 * World 0 · TITLE SCREEN · Home (PART 5): a crisp HTML overlay (works without WebGL or JS) over the overworld island —
 * the isometric SVG, upgraded to the R3F island when the device allows. On wide screens the stage is pinned while
 * the camera dives through the clouds into World 1 (≤ 100vh; not under reduced motion, on phones or in Speedrun Mode).
 * Speedrun Mode swaps the play block (.title-play) for the SpeedrunSummary via CSS only.
 */
export function TitleSection({ resumeAvailable }: { resumeAvailable: boolean }) {
  const layout = islandSvgLayout();
  const [, , w, h] = layout.viewBox.split(" ").map(Number);
  return (
    <section id="title" data-world="title" aria-labelledby="title-heading" className="title">
      <div className="title__stage">
        <div className="shell title__overlay">
          <WorldHeader world="title" compact />
          <div className="grid gap-2">
            <p className="title-kicker font-pixel text-sm uppercase tracking-[0.14em] text-muted">
              <span className="title-tag">Player 1</span> · <span className="text-text">{player.handle}</span>
            </p>
            <TitleName name={player.name} id="title-heading" />
          </div>
          <SpeedrunSummary resumeAvailable={resumeAvailable} />
          <div className="title-play grid gap-5">
            <ClassLine classes={player.classes} />
            <p className="title-tagline font-display text-xl font-bold">{player.tagline}</p>
            <ul className="title-chips" aria-label="Status">
              <li className="title-chip">
                <span className="status-dot" aria-hidden="true" />
                <span>
                  <span className="font-pixel uppercase tracking-wider">Online</span> — {player.status}
                </span>
              </li>
              <li className="title-chip title-chip--muted">{educationShort()}</li>
            </ul>
            <div className="flex flex-wrap gap-4 pt-1">
              <ArcadeButton
                href="#profile"
                size="lg"
                icon="controller"
                cursorLabel="PLAY"
                data-primary=""
                command={[
                  { type: "cta", id: "press-start" },
                  { type: "achievement", id: "player-one" },
                ]}
              >
                <span className="press-start">Press start</span>
              </ArcadeButton>
              <ArcadeButton size="lg" variant="ghost" icon="bolt" cursorLabel="LAUNCH" command={{ type: "speedrun", on: true }}>
                Recruiter speedrun
              </ArcadeButton>
              <SaveFileButton href={player.resumeUrl} available={resumeAvailable} />
            </div>
            <a href="#profile" className="title-scroll font-pixel text-sm uppercase tracking-[0.14em] text-muted no-underline hover:text-text">
              <span className="title-scroll__mouse" aria-hidden="true">
                <PixelIcon name="mouse" size={32} />
              </span>
              Scroll to play
            </a>
          </div>
        </div>
        <TitleIsland spots={layout.spots} ratio={w / h}>
          <IslandSvg />
        </TitleIsland>
      </div>
    </section>
  );
}
