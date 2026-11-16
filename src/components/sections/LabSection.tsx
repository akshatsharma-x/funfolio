import { research } from "@/content/content";
import { counts, known } from "@/content/derived";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { Fact, Soon } from "@/components/ui/ComingSoon";
import { PeelDoodle } from "@/components/ui/PeelSecrets";
import { StickerCard } from "@/components/ui/StickerCard";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { InfoList, LinkOrSoon, WorldSection } from "./parts";

/** A DOI may be stored bare ("10.1007/…") or as a URL; both link to the standard resolver. */
function doiHref(doi: string) {
  return doi.startsWith("http") ? doi : `https://doi.org/${doi}`;
}

/** World 3 · THE LAB · Research & Publications. PART 9 adds boss battles and the globe arc. */
export function LabSection() {
  return (
    <WorldSection id="lab" world="lab" labelledBy="lab-title">
      <WorldHeader world="lab" id="lab-title">
        <p className="text-muted">{counts.papers} papers.</p>
      </WorldHeader>
      <ol className="grid gap-6 lg:grid-cols-2">
        {research.map((paper) => (
          <StickerCard
            key={paper.id}
            as="li"
            aria-labelledby={`paper-${paper.id}`}
            bodyClassName="grid gap-5"
            tilt
            tiltMax={4}
            peelLabel={`Peek under the ${paper.boss.name} scroll`}
            peel={<PeelDoodle name="coffee" caption="Fuel for boss fights." />}
          >
            <p>
              <Badge tone="world" icon="scroll">
                {paper.status}
              </Badge>
            </p>
            <h3 id={`paper-${paper.id}`} className="text-lg leading-snug">
              {paper.title}
            </h3>
            <InfoList
              rows={[
                { label: "Venue", value: paper.venue },
                { label: "Host", value: <Fact value={paper.host} /> },
                { label: "Dates", value: <Fact value={paper.dates} /> },
              ]}
            />
            <div className="rounded-xl border-2 border-line bg-surface-2 p-4">
              <p className="mb-2 font-pixel text-xs uppercase tracking-wider text-muted">Boss battle · Research problem</p>
              <InfoList
                rows={[
                  { label: "Boss", value: paper.boss.name },
                  { label: "Domain", value: paper.boss.domain },
                  { label: "Weapon", value: paper.boss.weapon },
                ]}
              />
            </div>
            <ul aria-label="Keywords" className="flex flex-wrap gap-2">
              {paper.keywords.map((k) => (
                <li key={k}>
                  <Chip tone="violet" icon="sparkle">
                    {k}
                  </Chip>
                </li>
              ))}
            </ul>
            <div>
              <h4 className="mb-2 text-base">Abstract</h4>
              <p className="read">
                <Fact value={paper.abstract} />
              </p>
            </div>
            <InfoList
              rows={[
                { label: "Paper", value: <LinkOrSoon href={paper.links.paper}>Read the paper</LinkOrSoon> },
                {
                  label: "DOI",
                  value: known(paper.links.doi) ? (
                    <a href={doiHref(paper.links.doi)} className="font-semibold underline">
                      {paper.links.doi}
                    </a>
                  ) : (
                    <Soon />
                  ),
                },
                { label: "BibTeX", value: known(paper.bibtex) ? <code className="font-mono text-sm">{paper.bibtex}</code> : <Soon /> },
              ]}
            />
          </StickerCard>
        ))}
      </ol>
    </WorldSection>
  );
}
