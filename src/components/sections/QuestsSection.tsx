import type { CSSProperties } from "react";
import { experience } from "@/content/content";
import { counts } from "@/content/derived";
import { Badge } from "@/components/ui/Badge";
import { Fact } from "@/components/ui/ComingSoon";
import { PeelDoodle, PeelFact } from "@/components/ui/PeelSecrets";
import { StickerCard } from "@/components/ui/StickerCard";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { QuestGate } from "./quests/QuestGate";
import { BulletList, Emblem, InfoList, StackList, StatList, WorldSection } from "./parts";

/** Pixel chain links for the soft gate (decorative). */
function Chain({ className }: { className: string }) {
  return (
    <svg className={`quest-gate__chain ${className}`} viewBox="0 0 640 40" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={i * 40 + 4} y={i % 2 ? 14 : 6} width={i % 2 ? 44 : 36} height={i % 2 ? 12 : 28} rx="6" fill="none" stroke="#B9B2D9" strokeWidth="6" />
      ))}
    </svg>
  );
}

/**
 * World 2B · QUEST LOG · Experience. PART 7: behind the Launchpad's soft gate — frosted and chained until the fortress
 * falls, Skip is pressed or you simply scroll in; always fully in the DOM. PART 8 adds the quest path and stamps.
 */
export function QuestsSection() {
  return (
    <WorldSection id="quests" world="quests" labelledBy="quests-title" className="pt-8 md:pt-10">
      <WorldHeader world="quests" id="quests-title">
        <p className="text-muted">{counts.internships} internships.</p>
      </WorldHeader>
      <div className="quest-gate-wrap">
        <div className="quest-gate" aria-hidden="true">
          <Chain className="quest-gate__chain--a" />
          <Chain className="quest-gate__chain--b" />
          <span className="quest-gate__lock">
            <PixelIcon name="lock" size={48} />
          </span>
          <p className="quest-gate__msg">
            Clear the fortress or press Skip <span className="quest-gate__or">— or just keep scrolling</span>
          </p>
        </div>
      <ol className="grid gap-6" data-quest-list="">
        {experience.map((xp, i) => (
          <StickerCard
            key={xp.id}
            as="li"
            style={{ "--i": i } as CSSProperties}
            aria-labelledby={`quest-${xp.id}`}
            bodyClassName="grid gap-5 sm:p-7"
            tilt
            tiltMax={3}
            peelLabel={`Peek under the ${xp.company} quest card`}
            peel={i === 2 ? <PeelDoodle name="byte" caption="BYTE was here." /> : <PeelFact n={i} />}
          >
            <div className="flex flex-wrap items-start gap-4">
              <Emblem text={xp.emblem} />
              {/* below 25rem the name goes under the emblem: "WalkingTree Technologies" needs the full width at 320px */}
              <div className="grid min-w-0 flex-1 basis-full gap-1 min-[25rem]:basis-0">
                <h3 id={`quest-${xp.id}`} className="text-xl [overflow-wrap:break-word]">
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
      </div>
      <QuestGate />
    </WorldSection>
  );
}
