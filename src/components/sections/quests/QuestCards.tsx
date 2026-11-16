// The Quest Log's cards (PART 8): the ACTIVE QUEST hero (current role) and the COMPLETED QUEST cards on the trail.
// Server components; every fact comes from content.ts via src/content/quests.ts (R1).

import type { CSSProperties, ReactNode } from "react";
import { activeWidgets, loot, regulated, sideQuest, workMode, type Quest } from "@/content/quests";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { Chip } from "@/components/ui/Chip";
import { PeelDoodle, PeelFact } from "@/components/ui/PeelSecrets";
import { StickerCard } from "@/components/ui/StickerCard";
import { StatList } from "../parts";
import { ActiveWidgets } from "./ActiveWidgets";
import { Checklist, LootList, Objectives, QuestEmblem, Stamp, SubHead } from "./QuestParts";

function QuestHead({ q, children }: { q: Quest; children?: ReactNode }) {
  const mode = workMode(q);
  return (
    <header className="quest-head">
      <QuestEmblem text={q.emblem} company={q.company} />
      <div className="quest-head__text">
        <h3 id={`quest-${q.id}`} className="quest-head__company">
          {q.company}
        </h3>
        <p className="quest-head__role">{q.role}</p>
        <p className="quest-head__chips">
          <Chip tone="world" icon={false}>
            {q.period}
          </Chip>
          {mode ? <Chip icon={false}>{mode}</Chip> : null}
        </p>
      </div>
      {children}
    </header>
  );
}

function SideQuestButton({ q }: { q: Quest }) {
  const sq = sideQuest(q);
  if (!sq) return null;
  return (
    <ArcadeButton size="sm" icon="cartridge" command={{ type: "openGame", id: sq.id }} data-fx-skip="">
      Side quest: {sq.name}
    </ArcadeButton>
  );
}

/** ACTIVE QUEST · Current role — full width, "In progress", the illustrative widgets and coin #6. */
export function ActiveQuestCard({ q }: { q: Quest }) {
  const w = activeWidgets();
  const id = q.id;
  return (
    <StickerCard
      as="article"
      className="active-quest"
      data-quest-card={id}
      data-deal-card=""
      style={{ "--i": 0 } as CSSProperties}
      aria-labelledby={`quest-${id}`}
      peel={<PeelDoodle name="byte" caption="BYTE is on this quest too." />}
      peelLabel={`Peek under the ${q.company} quest card`}
    >
      <p className="quest-kicker">
        Active quest <span className="quest-kicker__plain">· Current role</span>
      </p>
      <QuestHead q={q}>
        <p className="quest-status">
          <span className="quest-status__dot" aria-hidden="true" />
          In progress
          <span className="quest-status__bar" aria-hidden="true" />
        </p>
      </QuestHead>
      <div className="active-quest__body">
        <section className="active-quest__objectives" aria-labelledby={`${id}-objectives`}>
          <SubHead id={`${id}-objectives`} game="Objectives" plain="What I'm doing" />
          <Objectives items={q.bullets} labelledBy={`${id}-objectives`} />
        </section>
        <section className="active-quest__xp" aria-labelledby={`${id}-xp`}>
          <SubHead id={`${id}-xp`} game="XP earned" plain="Results" />
          {w ? (
            <>
              <p className="widgets__note">Illustrative widgets — every number on them is from the résumé.</p>
              <ActiveWidgets w={w} />
            </>
          ) : (
            <StatList stats={q.stats} label={`${q.company} results`} />
          )}
        </section>
        <section className="quest-loot active-quest__loot" aria-labelledby={`${id}-loot`}>
          <SubHead id={`${id}-loot`} game="Loot" plain="Stack" />
          <LootList items={loot(q)} labelledBy={`${id}-loot`} />
        </section>
        <footer className="quest-foot active-quest__foot">
          <SideQuestButton q={q} />
        </footer>
      </div>
    </StickerCard>
  );
}

/** A COMPLETED QUEST on the trail: checklist objectives, loot, XP earned, a side quest or EY's "Regulated env". */
export function CompletedQuestCard({ q, index }: { q: Quest; index: number }) {
  const id = q.id;
  const sq = sideQuest(q);
  return (
    <StickerCard
      as="li"
      className="quest-card"
      data-quest-card={id}
      data-deal-card=""
      data-side={index % 2 ? "right" : "left"}
      style={{ "--i": index + 1, "--ticks": q.bullets.length } as CSSProperties}
      aria-labelledby={`quest-${id}`}
      tilt
      tiltMax={3}
      peel={index === 1 ? <PeelDoodle name="byte" caption="BYTE was here." /> : <PeelFact n={index} />}
      peelLabel={`Peek under the ${q.company} quest card`}
    >
      <span className="quest-node" aria-hidden="true" />
      <QuestHead q={q}>
        <Stamp kind="complete" icon="check">
          Complete
        </Stamp>
      </QuestHead>
      <section aria-labelledby={`${id}-objectives`}>
        <SubHead id={`${id}-objectives`} game="Objectives" plain="What I did" />
        <Checklist items={q.bullets} labelledBy={`${id}-objectives`} />
      </section>
      <section className="quest-loot" aria-labelledby={`${id}-loot`}>
        <SubHead id={`${id}-loot`} game="Loot" plain="Stack" />
        <LootList items={loot(q)} labelledBy={`${id}-loot`} />
      </section>
      {q.stats.length ? (
        <section aria-labelledby={`${id}-xp`}>
          <SubHead id={`${id}-xp`} game="XP earned" plain="Results" />
          <StatList stats={q.stats} label={`${q.company} results`} />
        </section>
      ) : null}
      {sq || regulated(q) ? (
        <footer className="quest-foot">
          {sq ? (
            <SideQuestButton q={q} />
          ) : (
            <Stamp kind="regulated" icon="lock">
              Regulated env
            </Stamp>
          )}
        </footer>
      ) : null}
    </StickerCard>
  );
}
