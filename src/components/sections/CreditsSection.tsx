import { player } from "@/content/content";
import { site } from "@/content/site";
import { CreditsFx } from "./credits/CreditsFx";

// the roll: who's in it (the brief's credits; the tools are the ones the site is really built with)
const ROLL: { role: string; names: string[] }[] = [
  { role: "Starring", names: [player.name] },
  { role: "Sidekick", names: ["BYTE"] },
  { role: "Built with", names: ["Next.js", "React Three Fiber", "GSAP", "Matter.js", "Tailwind CSS"] },
  { role: "Fonts", names: ["Unbounded", "Tiny5", "DM Sans", "JetBrains Mono"] },
  { role: "Special thanks", names: ["coffee", "stack traces", "and you, Player 2"] },
];

function Roll({ echo = false }: { echo?: boolean }) {
  return (
    <dl className="credits__list" aria-hidden={echo || undefined} data-echo={echo ? "" : undefined}>
      {ROLL.map((r) => (
        <div key={r.role} className="credits__item">
          <dt className="credits__role">{r.role}</dt>
          {r.names.map((n) => (
            <dd key={n} className="credits__name">
              {n}
            </dd>
          ))}
        </div>
      ))}
      <div className="credits__item credits__item--end">
        <dt className="credits__role">Game over?</dt>
        <dd className="credits__name">Never. Press start again.</dd>
      </div>
    </dl>
  );
}

/**
 * CREDITS · Footer (PART 15): a boxed credits roll that scrolls by itself (compositor CSS; pauses on hover, on focus
 * and with "Pause the roll" — WCAG 2.2.2; wheel, keys or touch take over; a plain list under reduced motion, in
 * Speedrun Mode and without JS) with coin #12 drifting through it;
 * YOUR RUN (the visitor's stats, portaled in live from the save by the runtime), NEW GAME+, ▲ Back to top (BYTE
 * jetpacks), the footer line. Arriving here unlocks Completionist (the world tracker, "credits").
 */
export function CreditsSection() {
  const first = player.name.split(/\s+/)[0] ?? player.name;
  return (
    <footer id="credits" data-world="credits" aria-labelledby="credits-title" className="credits">
      <div className="shell credits__shell">
        <h2 id="credits-title" className="credits__title text-rainbow">
          Credits
        </h2>
        <p className="credits__game">{site.name}</p>
        <div className="credits__roll" data-credits-roll="" tabIndex={0} role="region" aria-label="Credits roll">
          <div className="credits__track" data-credits-track="">
            <Roll />
            <Roll echo />
          </div>
          <button type="button" className="credits__coin" data-credits-coin="" data-coin="" data-coin-id="credits-roll" data-needs-js="" data-speedrun="hide" aria-label="Catch the coin drifting through the credits">
            <span className="credits__coin-face" aria-hidden="true" />
          </button>
        </div>
        <div className="credits__controls" data-needs-js="" data-speedrun="hide">
          <button type="button" className="credits__pause" data-credits-pause="" aria-pressed="false">
            Pause the roll
          </button>
        </div>
        <section className="run" aria-labelledby="run-title" data-needs-js="" data-speedrun="hide">
          <h3 id="run-title" className="run__title">
            Your run <span className="run__plain">· Session stats</span>
          </h3>
          <div id="credits-run-live" className="run__mount" data-share-name={first} />
          <p className="run__static">Your run shows up here as you play.</p>
        </section>
        <p className="credits__top-wrap">
          <a href="#title" className="credits__top" data-back-to-top="" data-primary="">
            ▲ Back to top
          </a>
        </p>
        <p className="credits__line">© {player.name} · No bugs were harmed (several were squashed).</p>
        <p className="credits__fine">Fonts self-hosted (SIL Open Font License). No trackers, no cookies, no third-party requests.</p>
      </div>
      <CreditsFx />
    </footer>
  );
}
