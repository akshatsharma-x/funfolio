import { counts } from "@/content/derived";
import { activeQuest, completedQuests } from "@/content/quests";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { QuestGate } from "./quests/QuestGate";
import { QuestLogFx } from "./quests/QuestLogFx";
import { QuestTrail } from "./quests/QuestTrail";
import { ActiveQuestCard, CompletedQuestCard } from "./quests/QuestCards";
import { WorldSection } from "./parts";

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
 * World 2B · QUEST LOG · Experience (PART 8). The ACTIVE QUEST hero (current role, illustrative widgets, coin #6), then
 * the COMPLETED QUESTS on a winding trail that draws itself as you scroll, with a tiny BYTE walking it (a straight
 * rail on phones). Behind the Launchpad's soft gate (PART 7): frosted until opened, always fully in the DOM.
 */
export function QuestsSection() {
  const active = activeQuest();
  const done = completedQuests();
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
        <div className="quest-log" data-quest-list="">
          {active ? <ActiveQuestCard q={active} /> : null}
          {done.length ? (
            <>
              <p className="quest-kicker quest-log__done" id="quests-done">
                Completed quests <span className="quest-kicker__plain">· Previous roles, newest first</span>
              </p>
              <div className="quest-trail" data-quest-trail="">
                {/* drawn by QuestTrail; without JS a plain CSS rail stands in */}
                <svg className="quest-trail__svg" aria-hidden="true" focusable="false" data-speedrun="hide">
                  <path className="quest-trail__base" />
                  <path className="quest-trail__lit" />
                  <g className="quest-trail__nodes" />
                </svg>
                <span className="quest-trail__walker" data-walker="" aria-hidden="true" data-speedrun="hide">
                  <span className="quest-trail__byte">
                    <PixelIcon name="byte" size={32} />
                  </span>
                </span>
                <QuestTrail />
                <ol className="quest-trail__list" aria-labelledby="quests-done">
                  {done.map((q, i) => (
                    <CompletedQuestCard key={q.id} q={q} index={i} />
                  ))}
                </ol>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <QuestGate />
      <QuestLogFx />
    </WorldSection>
  );
}
