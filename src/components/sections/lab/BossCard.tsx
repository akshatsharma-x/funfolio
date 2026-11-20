// A paper as a boss you defeat (PART 9). Server-rendered in its FINAL state — HP empty, DEFEATED stamped — so without
// JS, under reduced motion, in Speedrun Mode or when already on screen the boss is simply beaten; LabFx arms and plays
// the battle (3 hits) for cards below the fold. Every fact comes from content.ts (R1).

import type { CSSProperties } from "react";
import type { Boss } from "@/content/lab";
import { known } from "@/content/derived";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { Fact } from "@/components/ui/ComingSoon";
import { PeelDoodle } from "@/components/ui/PeelSecrets";
import { Stamp } from "@/components/ui/Stamp";
import { StickerCard } from "@/components/ui/StickerCard";
import { InfoList, LinkOrSoon } from "../parts";
import { BossSprite } from "./BossSprite";
import { CiteButton } from "./CiteButton";
import { ScrollButton } from "./ScrollButton";

const HP = 10;

/** Smog blobs for the golem's arena: a jittered 7×4 grid, the same on every build (seeded). */
function smogBlobs() {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const out: { x: number; y: number; s: number; d: number }[] = [];
  for (let j = 0; j < 4; j++)
    // centres kept inside the arena (8–92%, 12–88%) so a sweep of the pointer can reach every one
    for (let i = 0; i < 7; i++) out.push({ x: 8 + ((i + 0.2 + rand() * 0.6) / 7) * 84, y: 12 + ((j + 0.2 + rand() * 0.6) / 4) * 76, s: 30 + rand() * 18, d: 5 + rand() * 5 });
  return out;
}

function doiHref(doi: string) {
  return doi.startsWith("http") ? doi : `https://doi.org/${doi}`;
}

export function BossCard({ boss, all, index }: { boss: Boss; all: string[]; index: number }) {
  const p = boss.paper;
  const smog = p.id === "pm25";
  const titleId = `paper-${p.id}`;
  return (
    <StickerCard
      as="li"
      className="boss-card"
      data-boss-card={p.id}
      data-damage={boss.hits?.join("|")}
      aria-labelledby={titleId}
      peelLabel={`Peek under ${/^the /i.test(p.boss.name) ? "" : "the "}${p.boss.name} card`}
      peel={<PeelDoodle name="coffee" caption="Fuel for boss fights." />}
    >
      <div className="boss-arena" data-arena="" data-sky={smog ? "smog" : undefined}>
        {smog ? (
          <div className="smog" data-smog="" aria-hidden="true" data-speedrun="hide">
            {smogBlobs().map((b, i) => (
              <span key={i} className="smog__blob" style={{ "--x": `${b.x.toFixed(1)}%`, "--y": `${b.y.toFixed(1)}%`, "--s": `${b.s.toFixed(1)}%`, "--d": `${b.d.toFixed(1)}s` } as CSSProperties} />
            ))}
            <span className="smog__ring" />
          </div>
        ) : null}
        {boss.art ? <BossSprite art={boss.art} className="boss-arena__sprite" /> : null}
        <p className="boss-arena__name">
          <span className="boss-arena__kicker">Boss {index + 1}</span> {p.boss.name}
        </p>
        <div className="boss-hp" aria-hidden="true">
          <span className="boss-hp__label">HP</span>
          <span className="boss-hp__bar" data-hp="0">
            {Array.from({ length: HP }, (_, i) => (
              <span key={i} className="boss-hp__seg" />
            ))}
          </span>
        </div>
        <Stamp kind="defeated" icon="check">
          Defeated
        </Stamp>
      </div>
      <div className="boss-info">
        <p className="boss-info__status">
          <Badge tone="world" icon="scroll">
            {p.status}
          </Badge>
        </p>
        <h3 id={titleId} className="boss-info__title">
          {p.title}
        </h3>
        <InfoList
          rows={[
            { label: "Venue", value: p.venue },
            { label: "Host", value: <Fact value={p.host} /> },
            { label: "Dates", value: <Fact value={p.dates} /> },
          ]}
        />
        <InfoList
          className="boss-info__lore"
          rows={[
            { label: "Domain", value: p.boss.domain },
            { label: "Weapon", value: p.boss.weapon },
          ]}
        />
        <ul aria-label="Keywords" className="flex flex-wrap gap-2">
          {p.keywords.map((k) => (
            <li key={k}>
              <Chip tone="violet" icon="sparkle">
                {k}
              </Chip>
            </li>
          ))}
        </ul>
        <div className="boss-info__actions">
          <ScrollButton id={p.id} all={all} title={p.title}>
            <div className="scroll-doc">
              <p className="scroll-doc__boss">
                {p.boss.name} <span className="text-muted">· {p.boss.domain}</span>
              </p>
              <section>
                <h3 className="scroll-doc__h">Abstract</h3>
                <p className="read">
                  <Fact value={p.abstract} />
                </p>
              </section>
              <section>
                <h3 className="scroll-doc__h">Keywords</h3>
                <p>{p.keywords.join(" · ")}</p>
              </section>
              <section>
                <h3 className="scroll-doc__h">Conference</h3>
                <InfoList
                  rows={[
                    { label: "Venue", value: p.venue },
                    { label: "Host", value: <Fact value={p.host} /> },
                    { label: "Dates", value: <Fact value={p.dates} /> },
                    { label: "Status", value: p.status },
                  ]}
                />
              </section>
              {known(p.links.paper) || known(p.links.doi) ? (
                <section>
                  <h3 className="scroll-doc__h">Links</h3>
                  <InfoList
                    rows={[
                      ...(known(p.links.paper) ? [{ label: "Paper", value: <LinkOrSoon href={p.links.paper}>Read the paper</LinkOrSoon> }] : []),
                      ...(known(p.links.doi) ? [{ label: "DOI", value: <a href={doiHref(p.links.doi)}>{p.links.doi}</a> }] : []),
                    ]}
                  />
                </section>
              ) : null}
            </div>
          </ScrollButton>
          <CiteButton bibtex={known(p.bibtex) ? p.bibtex : null} />
          {smog ? (
            <button type="button" className="purify-btn" data-purify="" data-speedrun="hide">
              Run the air purifier
            </button>
          ) : null}
        </div>
      </div>
    </StickerCard>
  );
}
