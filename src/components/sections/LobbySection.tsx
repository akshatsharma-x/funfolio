import { player } from "@/content/content";
import { known } from "@/content/derived";
import { Fact } from "@/components/ui/ComingSoon";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { StickerCard } from "@/components/ui/StickerCard";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { SaveFileButton, WorldSection } from "./parts";

/** "https://linkedin.com/in/x" → "linkedin.com/in/x" for display. */
const display = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** World 8 · CO-OP LOBBY · Contact (mailto only — R10). PART 15 adds the paper-plane form and copy-to-clipboard. */
export function LobbySection({ resumeAvailable }: { resumeAvailable: boolean }) {
  const showPhone = player.showPhone && known(player.phone);
  return (
    <WorldSection id="lobby" world="lobby" labelledBy="lobby-title">
      <WorldHeader world="lobby" id="lobby-title" />
      <div className="grid gap-5 lg:grid-cols-12">
        <StickerCard as="article" className="lg:col-span-7" aria-labelledby="lobby-channels" bodyClassName="grid gap-5 sm:p-7">
          <h3 id="lobby-channels" className="text-xl">
            Send a co-op invite
          </h3>
          <ul className="grid gap-4">
            <li className="flex flex-wrap items-center gap-3">
              <PixelIcon name="mail" size={32} />
              <span className="font-pixel text-sm uppercase tracking-wider text-muted">Email</span>
              <a href={`mailto:${player.email}`} className="break-all font-semibold underline">
                {player.email}
              </a>
            </li>
            <li className="flex flex-wrap items-center gap-3">
              <PixelIcon name="map" size={32} />
              <span className="font-pixel text-sm uppercase tracking-wider text-muted">LinkedIn</span>
              <a href={player.links.linkedin} rel="me noreferrer" className="break-all font-semibold underline">
                {display(player.links.linkedin)}
              </a>
            </li>
            <li className="flex flex-wrap items-center gap-3">
              <PixelIcon name="gear" size={32} />
              <span className="font-pixel text-sm uppercase tracking-wider text-muted">GitHub</span>
              <a href={player.links.github} rel="me noreferrer" className="break-all font-semibold underline">
                {display(player.links.github)}
              </a>
            </li>
            {showPhone ? (
              <li className="flex flex-wrap items-center gap-3">
                <span className="font-pixel text-sm uppercase tracking-wider text-muted">Phone</span>
                <a href={`tel:${player.phone.replace(/\s+/g, "")}`} className="font-semibold underline">
                  {player.phone}
                </a>
              </li>
            ) : null}
          </ul>
          <div>
            <SaveFileButton href={player.resumeUrl} available={resumeAvailable} size="md" />
          </div>
        </StickerCard>
        <StickerCard as="article" variant="world" className="lg:col-span-5" aria-labelledby="lobby-availability">
          <h3 id="lobby-availability" className="mb-3 text-xl">
            Availability
          </h3>
          <p className="read">
            <Fact value={player.availability} />
          </p>
        </StickerCard>
      </div>
    </WorldSection>
  );
}
