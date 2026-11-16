// Quest card building blocks (PART 8). Server components: the final state is rendered here; QuestLogFx arms and
// plays the one-shot animations (ticks, stamps, widgets) only for cards that are below the fold.

import type { CSSProperties, ReactNode } from "react";
import { ITEM_META } from "@/content/derived";
import type { Loot } from "@/content/quests";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";
import { Tooltip } from "@/components/ui/Tooltip";

/** "OBJECTIVES · What I did" — the game label next to its plain name (R9). */
export function SubHead({ id, game, plain }: { id: string; game: string; plain: string }) {
  return (
    <h4 id={id} className="quest-sub">
      {game} <span className="quest-sub__plain">· {plain}</span>
    </h4>
  );
}

/** Original pixel-monogram guild emblem (R4: no official logos) that spins like a coin when clicked. */
export function QuestEmblem({ text, company }: { text: string; company: string }) {
  return (
    <button type="button" className="quest-emblem" data-emblem-spin="" aria-label={`Spin the ${text} guild emblem (${company})`}>
      <span className="quest-emblem__coin" aria-hidden="true">
        {text}
      </span>
    </button>
  );
}

/** Completed objectives: a checklist whose boxes tick one by one on first view (decorative boxes; the text is a list). */
export function Checklist({ items, labelledBy }: { items: string[]; labelledBy: string }) {
  return (
    <ul className="checklist read" aria-labelledby={labelledBy}>
      {items.map((b, i) => (
        <li key={b} className="checklist__item" style={{ "--i": i } as CSSProperties}>
          <span className="checklist__box" aria-hidden="true">
            <PixelIcon name="check" mono size={16} />
          </span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

/** The active quest's objectives: no ticks — it's still in progress. */
export function Objectives({ items, labelledBy }: { items: string[]; labelledBy: string }) {
  return (
    <ul className="objectives read" aria-labelledby={labelledBy}>
      {items.map((b) => (
        <li key={b} className="objectives__item">
          <span className="objectives__marker" aria-hidden="true" />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

function LootGlyph({ item }: { item: Loot }) {
  if (item.logo)
    return (
      <svg className="loot__logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d={item.logo.path} />
      </svg>
    );
  return item.type ? <PixelIcon name={ITEM_META[item.type].icon} mono /> : null;
}

/** LOOT: the stack as game items — Skill Tree items in their type color, with a tooltip, linking to the tree. */
export function LootList({ items, labelledBy }: { items: Loot[]; labelledBy: string }) {
  return (
    <ul className="loot" aria-labelledby={labelledBy}>
      {items.map((item) => {
        const tone = item.type ? ITEM_META[item.type].tone : undefined;
        if (!item.anchor)
          return (
            <li key={item.name}>
              <span className="chip loot__item">
                <LootGlyph item={item} />
                <span>{item.name}</span>
              </span>
            </li>
          );
        return (
          <li key={item.name}>
            <Tooltip
              title={item.name}
              typeLine={item.typeLine ?? undefined}
              body={<>Used in {item.usedIn.join(" · ")} — opens its Skill Tree entry.</>}
            >
              <a className="chip loot__item loot__link" href={`#${item.anchor}`} data-tone={tone} data-loot="" data-cursor-label="FIND">
                <LootGlyph item={item} />
                <span>{item.name}</span>
              </a>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}

/** A rubber stamp: "Complete" (every finished quest) or "Regulated env" (EY's stand-in for a side quest). */
export function Stamp({ kind, icon, children }: { kind: "complete" | "regulated"; icon: PixelIconName; children: ReactNode }) {
  return (
    <span className={`stamp stamp--${kind}`} data-stamp={kind}>
      <PixelIcon name={icon} mono size={16} />
      <span>{children}</span>
    </span>
  );
}
