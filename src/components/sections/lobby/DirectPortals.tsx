import type { CSSProperties } from "react";
import { Soon } from "@/components/ui/ComingSoon";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";

type Portal = { id: string; name: string; value: string; href: string | null; icon: PixelIconName; download?: boolean; external?: boolean };

/** "https://linkedin.com/in/x" → "linkedin.com/in/x" for display. */
const display = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

// the particles a portal sucks in on hover (angle around the ring, delay)
const PARTICLES = [0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => ({ a, d: (i % 4) * 0.18 }));

/**
 * DIRECT PORTALS · Links (PART 15): swirling conic-gradient rings that pull particles in on hover. Email (mailto, and
 * Copy → Copycat + "Item acquired: Email"), LinkedIn, GitHub, the save file (the résumé PDF from /public, while it's
 * there — "Coming soon" otherwise, R1), and the phone only when content says to show it (revealed on click).
 */
export function DirectPortals({ email, linkedin, github, resume, phone }: { email: string; linkedin: string; github: string; resume: string | null; phone: string | null }) {
  const portals: Portal[] = [
    { id: "email", name: "Email", value: email, href: `mailto:${email}`, icon: "mail" },
    { id: "linkedin", name: "LinkedIn", value: display(linkedin), href: linkedin, icon: "map", external: true },
    { id: "github", name: "GitHub", value: display(github), href: github, icon: "gear", external: true },
    { id: "resume", name: "Save file", value: "Résumé · PDF", href: resume, icon: "chest", download: true },
  ];
  return (
    <section className="portals" aria-labelledby="portals-title">
      <h3 id="portals-title" className="lobby-h">
        Direct portals <span className="lobby-h__plain">· Links</span>
      </h3>
      <ul className="portals__grid">
        {portals.map((p) => (
          <li key={p.id} className="portal" data-portal={p.id}>
            {p.href ? (
              <a
                className="portal__link"
                href={p.href}
                data-cursor-label="OPEN"
                {...(p.external ? { rel: "me noopener noreferrer", target: "_blank" } : {})}
                {...(p.download ? { download: "", "data-download-resume": "" } : {})}
              >
                <Ring icon={p.icon} />
                <span className="portal__name">{p.name}</span>
                <span className="portal__value">
                  {p.value}
                  {p.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
                </span>
              </a>
            ) : (
              <span className="portal__link portal__link--locked">
                <Ring icon="lock" />
                <span className="portal__name">{p.name}</span>
                <Soon />
              </span>
            )}
            {p.id === "email" ? (
              <button type="button" className="portal__copy" data-copy-email={email} data-needs-js="">
                Copy address
              </button>
            ) : null}
          </li>
        ))}
        {phone ? (
          <li className="portal" data-portal="phone">
            <span className="portal__link portal__link--static">
              <Ring icon="controller" />
              <span className="portal__name">Phone</span>
              <a className="portal__value" href={`tel:${phone.replace(/\s+/g, "")}`} data-phone="" hidden>
                {phone}
              </a>
            </span>
            <button type="button" className="portal__copy" data-reveal-phone="" data-needs-js="" aria-expanded="false">
              Reveal number
            </button>
            <noscript>
              <a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a>
            </noscript>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function Ring({ icon }: { icon: PixelIconName }) {
  return (
    <span className="portal__ring" aria-hidden="true">
      <span className="portal__swirl" />
      <span className="portal__core">
        <PixelIcon name={icon} size={32} />
      </span>
      <span className="portal__particles">
        {PARTICLES.map((p, i) => (
          <i key={i} style={{ "--a": `${p.a}deg`, "--d": `${p.d}s` } as CSSProperties} />
        ))}
      </span>
    </span>
  );
}
