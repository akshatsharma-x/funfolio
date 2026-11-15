import { player } from "@/content/content";
import { site } from "@/content/site";

/** CREDITS · Footer. PART 15 adds the credits roll and session stats. */
export function CreditsSection() {
  const year = new Date().getFullYear(); // build year (static export)
  return (
    <footer id="credits" data-world="credits" aria-labelledby="credits-title" className="border-t-[3px] border-line py-16">
      <div className="shell grid gap-4">
        <h2 id="credits-title" className="w-fit text-xl uppercase text-rainbow">
          Credits
        </h2>
        <p className="font-pixel uppercase tracking-wider">{site.name}</p>
        <p className="read text-muted">
          © {year} {player.name}. Fonts: Unbounded, Pixelify Sans, DM Sans and JetBrains Mono (SIL Open Font License),
          self-hosted. No trackers, no cookies, no third-party requests.
        </p>
        <p>
          <a href="#title" className="font-pixel uppercase tracking-wider">
            ▲ Back to the title screen
          </a>
        </p>
      </div>
    </footer>
  );
}
