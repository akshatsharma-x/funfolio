import { ACHIEVEMENTS } from "@/content/achievements";
import { counts } from "@/content/derived";
import { certCards, hallHonors } from "@/content/trophies";
import { AchievementPlaque } from "@/components/trophies/AchievementPlaque";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { WorldSection } from "./parts";
import { CapsuleMachine } from "./trophies/CapsuleMachine";
import { CertificateCards } from "./trophies/CertificateCards";
import { HallOfFame } from "./trophies/HallOfFame";
import { TrophiesFx } from "./trophies/TrophiesFx";

/**
 * World 7 · TROPHY ROOM · Certificates & Achievements (PART 14): the Hall of Fame (honors — 3D on the HIGH tier, CSS
 * medallions otherwise), the card collection (certificates, or sealed packs while there are none), the capsule machine
 * (a toy that deals the same honors and certificates) and the visitor's own trophy shelf (achievements from the save).
 * Every honor and certificate is server-rendered; one delegated island (TrophiesFx) plays the world.
 */
export function TrophiesSection() {
  const honors = hallHonors();
  const cards = certCards();
  return (
    <WorldSection id="trophies" world="trophies" labelledBy="trophies-title" className="trophies-world">
      <WorldHeader world="trophies" id="trophies-title">
        <p className="text-muted">
          {counts.honors} honors on pedestals, the certificate collection — and a shelf for the trophies you earn here.
        </p>
      </WorldHeader>
      <div className="trophies">
        <HallOfFame honors={honors} />
        <CertificateCards cards={cards} />
        <CapsuleMachine items={honors.length + cards.length} />
        <section className="shelf" aria-labelledby="shelf-title" data-needs-js="" data-speedrun="hide">
          <h3 id="shelf-title" className="trophy-h">
            Your trophies <span className="trophy-h__plain">· Achievements</span>
          </h3>
          <div id="trophy-shelf-live" className="shelf__mount" />
          <div className="shelf__static">
            <p className="shelf__count">
              <span className="shelf__num">{ACHIEVEMENTS.length}</span> trophies to unlock — they light up here as you play.
            </p>
            <ul className="shelf__grid">
              {ACHIEVEMENTS.map((a) => (
                <AchievementPlaque key={a.id} a={a} at={null} />
              ))}
            </ul>
          </div>
        </section>
      </div>
      <TrophiesFx />
    </WorldSection>
  );
}
