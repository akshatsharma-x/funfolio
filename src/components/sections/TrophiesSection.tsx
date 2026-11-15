import { certificates, honors, type TrophyKind } from "@/content/content";
import { counts, known } from "@/content/derived";
import { SoonPanel } from "@/components/ui/ComingSoon";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";
import { StickerCard } from "@/components/ui/StickerCard";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { InfoList, WorldSection } from "./parts";

const TROPHY_ICON: Record<TrophyKind, PixelIconName> = { cup: "trophy", medal: "coin", star: "star", scroll: "scroll" };

/** World 7 · TROPHY ROOM · Certificates & Achievements. PART 14 adds 3D trophies and the capsule machine. */
export function TrophiesSection() {
  return (
    <WorldSection id="trophies" world="trophies" labelledBy="trophies-title">
      <WorldHeader world="trophies" id="trophies-title" />

      <h3 className="mb-5 text-xl">
        Trophy shelf · Honors <span className="text-muted">({counts.honors})</span>
      </h3>
      <ul className="mb-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {honors.map((h) => (
          <StickerCard key={h.id} as="li" aria-labelledby={`honor-${h.id}`} bodyClassName="grid content-start gap-3">
            <PixelIcon name={TROPHY_ICON[h.trophy]} size={48} />
            <h4 id={`honor-${h.id}`} className="text-base leading-snug">
              {h.title}
            </h4>
            <p className="text-sm text-muted">
              {h.org} · {h.year}
            </p>
            {known(h.detail) ? <p className="text-sm">{h.detail}</p> : null}
          </StickerCard>
        ))}
      </ul>

      <h3 className="mb-5 text-xl">Certificates</h3>
      {certificates.length > 0 ? (
        <ul className="grid gap-5 md:grid-cols-2">
          {certificates.map((c) => (
            <StickerCard key={c.id} as="li" aria-labelledby={`cert-${c.id}`}>
              <h4 id={`cert-${c.id}`} className="mb-3 text-base">
                {c.name}
              </h4>
              <InfoList
                rows={[
                  { label: "Issuer", value: c.issuer },
                  { label: "Date", value: c.date },
                  ...(c.credentialId ? [{ label: "Credential", value: c.credentialId }] : []),
                ]}
              />
              {c.credentialUrl ? (
                <a href={c.credentialUrl} className="mt-3 inline-block font-semibold underline">
                  Verify credential
                </a>
              ) : null}
            </StickerCard>
          ))}
        </ul>
      ) : (
        <SoonPanel>
          <p>Certificates are being added to the shelf.</p>
        </SoonPanel>
      )}
    </WorldSection>
  );
}
