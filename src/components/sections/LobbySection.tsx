import { player } from "@/content/content";
import { known } from "@/content/derived";
import { StickerCard } from "@/components/ui/StickerCard";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { WorldSection } from "./parts";
import { DirectPortals } from "./lobby/DirectPortals";
import { LobbyFx } from "./lobby/LobbyFx";
import { PartyInvite } from "./lobby/PartyInvite";

/**
 * World 8 · CO-OP LOBBY · Contact (PART 15): "PLAYER 2, PRESS START", the availability card (only once content has
 * it), the party invite (a form that folds into a paper plane and lands as a mailto:) and the direct portals. Static
 * forever — mailto: and the clipboard, no backend, no API, no keys (R10). One island (LobbyFx) plays it.
 */
export function LobbySection({ resumeAvailable }: { resumeAvailable: boolean }) {
  const phone = player.showPhone && known(player.phone) ? player.phone : null;
  return (
    <WorldSection id="lobby" world="lobby" labelledBy="lobby-title" className="lobby-world">
      <WorldHeader world="lobby" id="lobby-title" />
      <div className="lobby">
        <div className="lobby__hero">
          <h3 className="lobby__press" data-lobby-press="">
            Player 2, press start
          </h3>
          <p className="lobby__sub">Looking for a teammate? Let&apos;s build something fun.</p>
        </div>
        {known(player.availability) ? (
          <StickerCard as="article" variant="world" className="lobby__availability" aria-labelledby="lobby-availability">
            <h3 id="lobby-availability" className="lobby-h">
              Availability
            </h3>
            <p className="read">{player.availability}</p>
          </StickerCard>
        ) : null}
        <div className="lobby__grid">
          <PartyInvite email={player.email} />
          <DirectPortals email={player.email} linkedin={player.links.linkedin} github={player.links.github} resume={resumeAvailable ? player.resumeUrl : null} phone={phone} />
        </div>
      </div>
      <LobbyFx />
    </WorldSection>
  );
}
