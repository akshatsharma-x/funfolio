import { education, player } from "@/content/content";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { Badge } from "@/components/ui/Badge";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { SaveFileButton } from "./parts";
import { SpeedrunSummary } from "./SpeedrunSummary";

/**
 * World 0 · TITLE SCREEN · Home. PART 5 adds the boot sequence, the 3D overworld island and the playable letters.
 * Speedrun Mode (PART 3) swaps the play block (.title-play) for the server-rendered SpeedrunSummary via CSS only.
 */
export function TitleSection({ resumeAvailable }: { resumeAvailable: boolean }) {
  return (
    <section
      id="title"
      data-world="title"
      aria-labelledby="title-heading"
      className="relative flex min-h-[92svh] items-center py-16"
    >
      <div className="shell grid gap-7">
        <WorldHeader world="title" compact />
        <div className="grid gap-3">
          <p className="title-kicker font-pixel text-sm uppercase tracking-[0.14em] text-muted">
            Player 1 · <span className="text-text">{player.handle}</span>
          </p>
          <h1 id="title-heading" className="w-fit text-hero font-black uppercase text-rainbow">
            {player.name}
          </h1>
        </div>
        <SpeedrunSummary resumeAvailable={resumeAvailable} />
        <div className="title-play grid gap-7">
          <ul aria-label="Classes" className="flex flex-wrap gap-2">
            {player.classes.map((c) => (
              <li key={c}>
                <Badge>{c}</Badge>
              </li>
            ))}
          </ul>
          <p className="font-display text-xl font-bold">{player.tagline}</p>
          <ul className="grid gap-2 text-base sm:text-lg">
            <li className="flex items-center gap-3">
              <span className="status-dot" aria-hidden="true" />
              <span>
                <span className="font-pixel uppercase tracking-wider">Online</span> — {player.status}
              </span>
            </li>
            <li className="text-muted">
              {education.degree} @ {education.school} · CGPA {education.cgpa}
            </li>
          </ul>
          <div className="flex flex-wrap gap-4 pt-2">
            <ArcadeButton
              href="#profile"
              size="lg"
              icon="controller"
              cursorLabel="PLAY"
              command={[
                { type: "cta", id: "press-start" },
                { type: "achievement", id: "player-one" },
              ]}
            >
              Press start
            </ArcadeButton>
            <ArcadeButton
              size="lg"
              variant="ghost"
              icon="bolt"
              cursorLabel="LAUNCH"
              command={{ type: "speedrun", on: true }}
            >
              Recruiter speedrun
            </ArcadeButton>
            <SaveFileButton href={player.resumeUrl} available={resumeAvailable} />
          </div>
          <a
            href="#profile"
            className="w-fit font-pixel text-sm uppercase tracking-[0.14em] text-muted no-underline hover:text-text"
          >
            ▼ Scroll to play
          </a>
        </div>
      </div>
    </section>
  );
}
