import Image from "next/image";
import { education, player } from "@/content/content";
import { counts, known } from "@/content/derived";
import { Chip } from "@/components/ui/Chip";
import { Fact, Soon } from "@/components/ui/ComingSoon";
import { NumberRoll } from "@/components/ui/NumberRoll";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { StickerCard } from "@/components/ui/StickerCard";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { InfoList, WorldSection } from "./parts";

const QUICK_STATS = [
  { label: "Internships", value: counts.internships },
  { label: "Projects", value: counts.projects },
  { label: "Papers", value: counts.papers },
  { label: "Skills", value: counts.skills },
  { label: "Honors", value: counts.honors },
];

/** World 1 · PLAYER PROFILE · About. PART 6 turns this into the character-sheet bento. */
export function ProfileSection() {
  return (
    <WorldSection id="profile" world="profile" labelledBy="profile-title">
      <WorldHeader world="profile" id="profile-title" />
      <div className="grid gap-5 lg:grid-cols-12">
        <StickerCard as="article" className="lg:col-span-5" aria-labelledby="profile-character">
          <h3 id="profile-character" className="mb-4 text-xl">
            Character card
          </h3>
          <div className="relative mb-5 grid aspect-[4/3] place-items-center overflow-hidden rounded-xl border-[3px] border-dashed border-line bg-surface-2">
            {known(player.photo) ? (
              <Image src={player.photo} alt={`Photo of ${player.name}`} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            ) : (
              <Soon label="Photo coming soon" />
            )}
          </div>
          <InfoList
            rows={[
              { label: "Name", value: player.name },
              { label: "Handle", value: player.handle },
              { label: "Status", value: player.status },
              { label: "Spawn point", value: <Fact value={player.base} /> },
              { label: "Availability", value: <Fact value={player.availability} /> },
            ]}
          />
        </StickerCard>

        <StickerCard as="article" className="lg:col-span-7" aria-labelledby="profile-bio">
          <h3 id="profile-bio" className="mb-4 text-xl">
            Bio
          </h3>
          <p className="read mb-6">
            <Fact value={player.bio} />
          </p>
          <h4 className="mb-3 text-lg">Classes</h4>
          <ul aria-label="Classes" className="mb-6 flex flex-wrap gap-2">
            {player.classes.map((c) => (
              <li key={c}>
                <Chip tone="world" icon="star">
                  {c}
                </Chip>
              </li>
            ))}
          </ul>
          <h4 className="mb-3 text-lg">Fun facts</h4>
          {player.funFacts.length > 0 ? (
            <ul className="read grid list-disc gap-1 pl-5">
              {player.funFacts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          ) : (
            <Soon />
          )}
        </StickerCard>

        <StickerCard as="article" className="lg:col-span-7" aria-labelledby="profile-education">
          <h3 id="profile-education" className="mb-1 text-xl">
            Guild · Education
          </h3>
          <p className="mb-4 font-semibold">
            {education.degree} — {education.school}
          </p>
          <InfoList
            className="mb-5"
            rows={[
              { label: "Period", value: education.period },
              { label: "CGPA", value: <NumberRoll value={education.cgpa} className="font-display font-bold" /> },
            ]}
          />
          <h4 className="mb-2 text-lg">Previous saves · School</h4>
          <ul className="mb-5 grid gap-1">
            {education.previous.map((p) => (
              <li key={p.name}>
                {p.name} — <span className="font-semibold">{p.score}</span> <span className="text-muted">({p.year})</span>
              </li>
            ))}
          </ul>
          <h4 className="mb-3 text-lg">Coursework</h4>
          <ul aria-label="Coursework" className="flex flex-wrap gap-2">
            {education.coursework.map((c) => (
              <li key={c}>
                <Chip>{c}</Chip>
              </li>
            ))}
          </ul>
        </StickerCard>

        <StickerCard as="article" variant="world" className="lg:col-span-5" aria-labelledby="profile-stats">
          <h3 id="profile-stats" className="mb-4 flex items-center gap-2 text-xl">
            <PixelIcon name="star" mono size={24} /> Quick stats
          </h3>
          <dl className="grid grid-cols-2 gap-4">
            {QUICK_STATS.map((s) => (
              <div key={s.label}>
                <dt className="font-pixel text-sm uppercase tracking-wider">{s.label}</dt>
                <dd className="font-display text-2xl font-black">
                  <NumberRoll value={String(s.value)} />
                </dd>
              </div>
            ))}
          </dl>
        </StickerCard>
      </div>
    </WorldSection>
  );
}
