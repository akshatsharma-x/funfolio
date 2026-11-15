import { experience } from "@/content/content";
import { counts } from "@/content/derived";
import { Badge } from "@/components/ui/Badge";
import { Fact } from "@/components/ui/ComingSoon";
import { StickerCard } from "@/components/ui/StickerCard";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { BulletList, Emblem, InfoList, StackList, StatList, WorldSection } from "./parts";

/** World 2B · QUEST LOG · Experience. PART 8 adds the quest path, side quests and stamps. */
export function QuestsSection() {
  return (
    <WorldSection id="quests" world="quests" labelledBy="quests-title" className="pt-8 md:pt-10">
      <WorldHeader world="quests" id="quests-title">
        <p className="text-muted">{counts.internships} internships.</p>
      </WorldHeader>
      <ol className="grid gap-6">
        {experience.map((xp) => (
          <StickerCard key={xp.id} as="li" aria-labelledby={`quest-${xp.id}`} bodyClassName="grid gap-5 sm:p-7">
            <div className="flex flex-wrap items-start gap-4">
              <Emblem text={xp.emblem} />
              <div className="grid min-w-0 flex-1 gap-1">
                <h3 id={`quest-${xp.id}`} className="text-xl">
                  {xp.company}
                </h3>
                <p className="font-semibold">{xp.role}</p>
                <p className="flex flex-wrap items-center gap-3 text-muted">
                  <span>{xp.period}</span>
                  {xp.current ? <Badge tone="world">Current quest</Badge> : null}
                </p>
              </div>
            </div>
            <InfoList rows={[{ label: "Work mode", value: <Fact value={xp.mode} /> }]} />
            <BulletList items={xp.bullets} />
            <StatList stats={xp.stats} label={`${xp.company} stats`} />
            <StackList items={xp.stack} label={`${xp.company} stack`} />
          </StickerCard>
        ))}
      </ol>
    </WorldSection>
  );
}
