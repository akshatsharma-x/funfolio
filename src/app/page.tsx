import { ArcadeSection } from "@/components/sections/ArcadeSection";
import { CreditsSection } from "@/components/sections/CreditsSection";
import { LabSection } from "@/components/sections/LabSection";
import { LaunchpadSection } from "@/components/sections/LaunchpadSection";
import { LobbySection } from "@/components/sections/LobbySection";
import { ProfileSection } from "@/components/sections/ProfileSection";
import { QuestsSection } from "@/components/sections/QuestsSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { TitleSection } from "@/components/sections/TitleSection";
import { TrophiesSection } from "@/components/sections/TrophiesSection";
import { VaultSection } from "@/components/sections/VaultSection";
import { TickerDivider } from "@/components/fx/TickerDivider";
import { player } from "@/content/content";
import { assertContent } from "@/content/schema";
import { jsonLd, personJsonLd } from "@/content/seo";
import { publicFileExists } from "@/lib/files";

// Fails `next build` on malformed content (R1). Server-only: zod never reaches the client bundle.
assertContent();

/**
 * Every world from Bible §8, in order, with ALL content as semantic HTML — server-rendered for SEO and screen readers
 * from day one (R3). Later parts upgrade each section in place. (#boot is a client-only overlay, added in PART 5.)
 */
export default function Home() {
  const resumeAvailable = publicFileExists(player.resumeUrl);
  return (
    <>
      {/* PART 17 · structured data: who this is (schema.org Person, from content.ts) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personJsonLd()) }} />
      <main id="main">
        <TitleSection resumeAvailable={resumeAvailable} />
        <TickerDivider set="start" world="profile" />
        <ProfileSection />
        <TickerDivider set="quests" world="launchpad" reverse />
        <LaunchpadSection />
        <QuestsSection />
        <TickerDivider set="lab" world="lab" />
        <LabSection />
        <TickerDivider set="vault" world="vault" reverse />
        <VaultSection />
        <TickerDivider set="arcade" world="arcade" />
        <ArcadeSection />
        <TickerDivider set="skills" world="skills" reverse />
        <SkillsSection />
        <TickerDivider set="trophies" world="trophies" />
        <TrophiesSection />
        <TickerDivider set="lobby" world="lobby" reverse />
        <LobbySection resumeAvailable={resumeAvailable} />
        <TickerDivider set="credits" world="credits" />
      </main>
      <CreditsSection />
    </>
  );
}
