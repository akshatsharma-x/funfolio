import type { CSSProperties } from "react";
import type { TrophyKind } from "@/content/content";
import type { HallHonor } from "@/content/trophies";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";
import { HallStage } from "./HallStage";

const ICON: Record<TrophyKind, PixelIconName> = { cup: "trophy", medal: "coin", star: "star", scroll: "scroll" };

/**
 * HALL OF FAME · Honors (PART 14). One pedestal per honor: a plate (title, year) and a detail card (title, org · year,
 * detail — exactly as content.ts has them). The 3D trophies (HIGH tier) stand over the plates in the same columns;
 * otherwise each pedestal carries a CSS-3D medallion that flips. Triggers are plain text on the server and become
 * buttons with the island (TrophiesFx); without JS and in Speedrun Mode the cards are simply listed.
 */
export function HallOfFame({ honors }: { honors: HallHonor[] }) {
  return (
    <section className="hall" aria-labelledby="hall-title" data-hall="">
      <h3 id="hall-title" className="trophy-h">
        Hall of Fame <span className="trophy-h__plain">· Honors ({honors.length})</span>
      </h3>
      <p className="trophy-sub" data-needs-js="" data-speedrun="hide">
        Pick a trophy for the whole story — arrow keys move along the pedestals.
      </p>
      <HallStage slots={honors.map((h) => ({ id: h.id, kind: h.kind }))}>
        <ol className="hall__row" style={{ "--n": honors.length } as CSSProperties}>
          {honors.map((h) => (
            <li key={h.id} className="hall__slot" data-honor={h.id} data-kind={h.kind}>
              <span className="hall__btn" data-hall-btn={h.id} aria-describedby={`honor-${h.id}`} data-cursor-label="OPEN">
                <span className="medal3d" aria-hidden="true">
                  <span className="medal3d__coin">
                    <span className="medal3d__face medal3d__front">
                      <PixelIcon name={ICON[h.kind]} size={48} />
                    </span>
                    <span className="medal3d__face medal3d__back">
                      <PixelIcon name="star" size={32} />
                    </span>
                  </span>
                </span>
                <span className="hall__plate">
                  <span className="hall__name">{h.title}</span>
                  <span className="hall__year">{h.year}</span>
                </span>
              </span>
              <div className="honor-card" id={`honor-${h.id}`} data-honor-card={h.id}>
                <p className="honor-card__kicker">
                  {h.shape} <span aria-hidden="true">·</span> Honor
                </p>
                <h4 className="honor-card__title">{h.title}</h4>
                <p className="honor-card__meta">
                  {h.org} <span aria-hidden="true">·</span> {h.year}
                </p>
                {h.detail ? <p className="honor-card__detail">{h.detail}</p> : null}
                <button type="button" className="honor-card__close" data-hall-close="" data-needs-js="" data-speedrun="hide">
                  Back to the hall
                </button>
              </div>
            </li>
          ))}
        </ol>
      </HallStage>
    </section>
  );
}
