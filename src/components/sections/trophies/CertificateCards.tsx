import type { CSSProperties } from "react";
import type { CertCard } from "@/content/trophies";
import { PixelIcon } from "@/components/ui/PixelIcon";

/**
 * CARD COLLECTION · Certificates (PART 14): collectible trading cards — front: the issuer's monogram, the name, the
 * issuer, the date and a holo foil that follows the pointer; back: credential ID, skills, Verify ↗. The island flips and
 * enlarges a card (GSAP Flip). Both faces are server-rendered; without JS and in Speedrun Mode they lie flat side by
 * side. While content has no certificates: three sealed packs, "NEW CARDS DROPPING SOON" (R1 — nothing invented).
 */
export function CertificateCards({ cards }: { cards: CertCard[] }) {
  return (
    <section className="certs" aria-labelledby="certs-title">
      <h3 id="certs-title" className="trophy-h">
        Card collection <span className="trophy-h__plain">· Certificates ({cards.length})</span>
      </h3>
      {cards.length === 0 ? (
        <div className="packs">
          <ul className="packs__row" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="pack" style={{ "--i": i } as CSSProperties}>
                <span className="pack__foil" />
                <span className="pack__crimp pack__crimp--top" />
                <span className="pack__art">
                  <PixelIcon name="star" size={40} />
                </span>
                <span className="pack__label">New cards dropping soon</span>
                <span className="pack__crimp pack__crimp--bottom" />
              </li>
            ))}
          </ul>
          <p className="packs__note">Certificates are coming soon — new cards are on their way to the collection.</p>
        </div>
      ) : (
        <>
          <ul className="certs__grid" data-count={cards.length}>
            {cards.map((c) => (
              <li key={c.id} className="tcard" data-cert={c.id}>
                <div className="tcard__flip" data-tcard={c.id}>
                  <div className="tcard__face tcard__front">
                    <span className="tcard__btn" data-tcard-btn={c.id} aria-describedby={`cert-${c.id}-back`} data-cursor-label="OPEN">
                      <span className="tcard__top">
                        <span className="tcard__emblem" aria-hidden="true">
                          {c.monogram}
                        </span>
                        <span className="tcard__kind">Certificate</span>
                      </span>
                      <span className="tcard__name">{c.name}</span>
                      <span className="tcard__issuer">{c.issuer}</span>
                      {c.date ? <span className="tcard__date">{c.date}</span> : null}
                    </span>
                    <span className="tcard__foil" aria-hidden="true" />
                  </div>
                  <div className="tcard__face tcard__back" id={`cert-${c.id}-back`}>
                    <p className="tcard__back-name">{c.name}</p>
                    {c.credentialId ? (
                      <p className="tcard__field">
                        <span className="tcard__label">Credential ID</span> <span className="tcard__id">{c.credentialId}</span>
                      </p>
                    ) : null}
                    {c.skills.length ? (
                      <ul className="tcard__skills" aria-label="Skills">
                        {c.skills.map((s) => (
                          <li key={s} className="chip">
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {c.verify ? (
                      <a className="tcard__verify" href={c.verify} target="_blank" rel="noopener noreferrer">
                        Verify <span aria-hidden="true">↗</span>
                        <span className="sr-only"> (opens the issuer&apos;s site)</span>
                      </a>
                    ) : null}
                    <button type="button" className="tcard__close" data-tcard-close="" data-needs-js="" data-speedrun="hide">
                      Flip back
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="tcard-backdrop" data-tcard-backdrop="" hidden />
        </>
      )}
    </section>
  );
}
