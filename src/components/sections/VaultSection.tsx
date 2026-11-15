import { projects } from "@/content/content";
import { CATEGORY_LABEL, counts, known } from "@/content/derived";
import { Badge } from "@/components/ui/Badge";
import { Soon } from "@/components/ui/ComingSoon";
import { StickerCard } from "@/components/ui/StickerCard";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { BulletList, InfoList, LinkOrSoon, StackList, StatList, WorldSection } from "./parts";

/** World 4 · CARTRIDGE VAULT · Projects. PART 10 adds the cartridges and the console. */
export function VaultSection() {
  return (
    <WorldSection id="vault" world="vault" labelledBy="vault-title">
      <WorldHeader world="vault" id="vault-title">
        <p className="text-muted">{counts.projects} projects.</p>
      </WorldHeader>
      <ul className="grid gap-6 md:grid-cols-2">
        {projects.map((p) => (
          <StickerCard key={p.id} as="li" aria-labelledby={`project-${p.id}`} bodyClassName="grid content-start gap-5">
            <p className="flex flex-wrap gap-2">
              <Badge tone="world" icon="cartridge">
                {p.genre}
              </Badge>
              <Badge>{CATEGORY_LABEL[p.category]}</Badge>
            </p>
            <div>
              <h3 id={`project-${p.id}`} className="text-xl">
                {p.title}
              </h3>
              <p className="mt-1 text-muted">{p.subtitle}</p>
            </div>
            <BulletList items={p.bullets} />
            <StatList stats={p.stats} label={`${p.title} stats`} />
            <StackList items={p.stack} label={`${p.title} stack`} />
            <InfoList
              rows={[
                { label: "Live demo", value: <LinkOrSoon href={p.links.demo}>Launch</LinkOrSoon> },
                { label: "Source", value: <LinkOrSoon href={p.links.repo}>View the code</LinkOrSoon> },
                { label: "Screens", value: known(p.media) ? p.media : <Soon /> },
              ]}
            />
          </StickerCard>
        ))}
      </ul>
    </WorldSection>
  );
}
